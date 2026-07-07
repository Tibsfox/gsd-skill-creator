import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { SkillIndex, SkillIndexEntry } from '../../storage/skill-index.js';
import type { RelevanceScorer } from '../relevance-scorer.js';
import type { ScoredSkill } from '../../types/application.js';
import type { AdaptiveRouter } from '../../retrieval/adaptive-router.js';
import type { EmbeddingService } from '../../embeddings/embedding-service.js';
import { cosineSimilarity } from '../../embeddings/cosine-similarity.js';
import type { SkillPosition } from '../../plane/types.js';
import type { PlaneActivationConfig } from '../../plane/activation.js';
import { analyzeTask, computeEnhancedScore, DEFAULT_PLANE_ACTIVATION_CONFIG } from '../../plane/activation.js';

/** RET-1: max full-set semantic-recall candidates admitted per query. */
const SEMANTIC_RECALL_K = 10;
/** RET-1: minimum cosine for a skill to be recalled by the semantic scan. */
const SEMANTIC_RECALL_MIN_SIM = 0.2;
/** RET-4: fusion weights — cosine-dominant so the fused score stays cosine-comparable. */
const FUSION_W_EMBED = 0.7;
const FUSION_W_LEXICAL = 0.3;

/** Lookup function for skill positions. Returns null for skills without plane data. */
export type PositionLookup = (skillName: string) => SkillPosition | null;

/**
 * Finds trigger matches and scores them via TF-IDF or embedding similarity.
 *
 * When an AdaptiveRouter is provided, the stage classifies the query to select
 * the scoring strategy (TF-IDF fast path or embedding semantic path). Without
 * a router, behavior is identical to the original TF-IDF-only scoring.
 *
 * Preconditions: none (first stage in pipeline).
 * Postconditions: matches, scoredSkills populated (or earlyExit set).
 */
export class ScoreStage implements PipelineStage {
  readonly name = 'score';

  constructor(
    private skillIndex: SkillIndex,
    private scorer: RelevanceScorer,
    private router?: AdaptiveRouter,
    private embeddingService?: EmbeddingService,
    private positionLookup?: PositionLookup,
    private planeConfig?: PlaneActivationConfig,
  ) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    const lexicalMatches = await this.skillIndex.findByTrigger(
      context.intent,
      context.file,
      context.context
    );
    const query = [context.intent, context.context].filter(Boolean).join(' ');

    // Decide the route before pruning. On the semantic route we RECALL over the
    // full enabled set rather than only re-ranking lexical hits, so a query that
    // paraphrases a skill's description but matches none of its trigger patterns
    // can still surface it. (RET-1)
    const semantic = !!(
      this.router &&
      this.embeddingService &&
      query &&
      this.router.classify(query).strategy === 'embedding'
    );

    let matches = lexicalMatches;
    if (semantic) {
      try {
        matches = await this.recallByEmbedding(query, lexicalMatches);
      } catch {
        matches = lexicalMatches; // fall back to lexical candidates on any error
      }
    }
    context.matches = matches;

    if (matches.length === 0) {
      context.earlyExit = true;
      context.loaded = [];
      context.skipped = [];
      context.conflicts = {
        hasConflict: false,
        conflictingSkills: [],
        resolution: 'priority',
      };
      return context;
    }

    if (query) {
      if (semantic) {
        try {
          // Fuse the dense (cosine) and lexical (TF-IDF) signals. (RET-4)
          context.scoredSkills = await this.scoreSemanticFused(query, matches);
          // Fused output is normalized cosine-comparable [0,1]. (RET-4/RET-5)
          context.scoringScale = 'cosine';
        } catch {
          // Fallback to TF-IDF on any embedding error
          context.scoredSkills = this.scoreWithTfidf(query, matches);
          context.scoringScale = 'tfidf';
        }
      } else {
        // TF-IDF fast path (also the no-router backward-compatible behavior)
        context.scoredSkills = this.scoreWithTfidf(query, matches);
        context.scoringScale = 'tfidf';
      }
    } else {
      // File-only matches carry a fixed unit score, not a raw TF-IDF sum.
      context.scoredSkills = matches.map<ScoredSkill>(m => ({
        name: m.name,
        score: 1,
        matchType: 'file' as const,
      }));
      context.scoringScale = 'cosine';
    }

    // Geometric scoring enhancement (ACTIV-02, ACTIV-04).
    // Note: scoringScale (above) reflects the base scoring route; the enhanced
    // score blends an unbounded geometric term. This never coexists with the
    // CorrectionStage that reads scoringScale (the retrieval-enabled path builds
    // ScoreStage without a positionLookup), so the tag stays honest on that path.
    if (this.positionLookup && (this.planeConfig?.enabled ?? true)) {
      const config = this.planeConfig ?? DEFAULT_PLANE_ACTIVATION_CONFIG;
      try {
        const taskVector = analyzeTask({
          intent: context.intent,
          file: context.file,
          context: context.context,
        });

        context.scoredSkills = context.scoredSkills.map(skill => {
          const position = this.positionLookup!(skill.name);
          const enhanced = computeEnhancedScore(
            skill.name,
            position,
            taskVector,
            skill.score,
            config,
          );
          return {
            ...skill,
            score: enhanced.combinedScore,
          };
        });

        // Re-sort by enhanced score (highest first)
        context.scoredSkills.sort((a, b) => b.score - a.score);
      } catch {
        // Fallback: if geometric scoring fails, keep existing semantic scores (ACTIV-05)
        // No-op -- scoredSkills remain as computed by TF-IDF/embeddings
      }
    }

    return context;
  }

  /**
   * Score matches using TF-IDF relevance (existing behavior).
   */
  private scoreWithTfidf(query: string, matches: SkillIndexEntry[]): ScoredSkill[] {
    const allScored = this.scorer.scoreAgainstQuery(query);
    const matchNames = new Set(matches.map(m => m.name));
    return allScored.filter(s => matchNames.has(s.name));
  }

  /**
   * Score matches using embedding cosine similarity.
   * Embeds the query and each match's description, then ranks by similarity.
   */
  private async scoreWithEmbeddings(query: string, matches: SkillIndexEntry[]): Promise<ScoredSkill[]> {
    const queryResult = await this.embeddingService!.embed(query);
    const scored: ScoredSkill[] = [];

    for (const match of matches) {
      const desc = [match.description, ...(match.triggers?.intents ?? [])].join(' ');
      const matchResult = await this.embeddingService!.embed(desc, match.name);
      const similarity = cosineSimilarity(queryResult.embedding, matchResult.embedding);
      scored.push({ name: match.name, score: similarity, matchType: 'intent' });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Semantic recall: embed the query and every enabled skill, take the top
   * cosine matches above a floor, and union them with the lexical trigger
   * candidates (dedup by name). This turns the embedding path from a re-ranker
   * over lexical hits into an actual retriever — a paraphrase that matches no
   * trigger can still surface. (RET-1)
   */
  private async recallByEmbedding(
    query: string,
    lexicalMatches: SkillIndexEntry[],
  ): Promise<SkillIndexEntry[]> {
    const enabled = await this.skillIndex.getEnabled();
    const queryEmbedding = (await this.embeddingService!.embed(query)).embedding;

    const scored: Array<{ entry: SkillIndexEntry; sim: number }> = [];
    for (const entry of enabled) {
      const desc = [entry.description, ...(entry.triggers?.intents ?? [])].join(' ');
      const emb = (await this.embeddingService!.embed(desc, entry.name)).embedding;
      scored.push({ entry, sim: cosineSimilarity(queryEmbedding, emb) });
    }
    scored.sort((a, b) => b.sim - a.sim);
    const recalled = scored
      .filter(s => s.sim >= SEMANTIC_RECALL_MIN_SIM)
      .slice(0, SEMANTIC_RECALL_K)
      .map(s => s.entry);

    // Union with the lexical candidates, keeping the lexical entry on collision.
    const byName = new Map<string, SkillIndexEntry>();
    for (const e of lexicalMatches) byName.set(e.name, e);
    for (const e of recalled) if (!byName.has(e.name)) byName.set(e.name, e);
    return Array.from(byName.values());
  }

  /**
   * Score the candidate set by fusing the dense (cosine) ranking with the
   * lexical (TF-IDF) ranking: score = W_EMBED*cosine + W_LEXICAL*lexicalRank,
   * where lexicalRank is the TF-IDF position normalized to [0,1].
   *
   * The fused score is divided by the weight actually applied, so a candidate
   * with NO lexical signal reports its true cosine (not a lexical-penalized
   * 0.7*cosine). That keeps the output on a genuine cosine-comparable [0,1]
   * scale — important because the downstream CorrectionStage gates on a cosine
   * 0.7 threshold — while a candidate strong in BOTH signals still outranks one
   * strong in only one. (RET-4)
   */
  private async scoreSemanticFused(query: string, matches: SkillIndexEntry[]): Promise<ScoredSkill[]> {
    const cosineRanked = await this.scoreWithEmbeddings(query, matches);
    const tfidfRanked = this.scoreWithTfidf(query, matches);

    const lexicalRank = new Map<string, number>();
    tfidfRanked.forEach((s, i) => {
      lexicalRank.set(s.name, 1 - i / Math.max(1, tfidfRanked.length));
    });

    const fused = cosineRanked.map<ScoredSkill>(s => {
      const lex = lexicalRank.get(s.name);
      const weightMass = FUSION_W_EMBED + (lex !== undefined ? FUSION_W_LEXICAL : 0);
      const raw = FUSION_W_EMBED * s.score + FUSION_W_LEXICAL * (lex ?? 0);
      return { name: s.name, matchType: s.matchType, score: raw / weightMass };
    });
    return fused.sort((a, b) => b.score - a.score);
  }
}
