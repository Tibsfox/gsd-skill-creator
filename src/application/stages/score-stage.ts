import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { SkillIndex, SkillIndexEntry } from '../../core/storage/skill-index.js';
import type { RelevanceScorer } from '../relevance-scorer.js';
import type { ScoredSkill } from '../../core/types/application.js';
import type { AdaptiveRouter } from '../../retrieval/adaptive-router.js';
import type { EmbeddingService } from '../../embeddings/embedding-service.js';
import { cosineSimilarity } from '../../embeddings/cosine-similarity.js';
import type { SkillPosition } from '../../plane/types.js';
import type { PlaneActivationConfig } from '../../plane/activation.js';
import { analyzeTask, computeEnhancedScore, DEFAULT_PLANE_ACTIVATION_CONFIG } from '../../plane/activation.js';

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

    const matches = await this.skillIndex.findByTrigger(
      context.intent,
      context.file,
      context.context
    );
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

    const query = [context.intent, context.context].filter(Boolean).join(' ');

    if (query) {
      // Use adaptive routing if router is available
      if (this.router) {
        const decision = this.router.classify(query);
        if (decision.strategy === 'embedding' && this.embeddingService) {
          try {
            context.scoredSkills = await this.scoreWithEmbeddings(query, matches);
          } catch {
            // Fallback to TF-IDF on any embedding error
            context.scoredSkills = this.scoreWithTfidf(query, matches);
          }
        } else {
          context.scoredSkills = this.scoreWithTfidf(query, matches);
        }
      } else {
        // No router: use existing TF-IDF behavior (backward compatible)
        context.scoredSkills = this.scoreWithTfidf(query, matches);
      }
    } else {
      context.scoredSkills = matches.map<ScoredSkill>(m => ({
        name: m.name,
        score: 1,
        matchType: 'file' as const,
      }));
    }

    // Geometric scoring enhancement (ACTIV-02, ACTIV-04)
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
}
