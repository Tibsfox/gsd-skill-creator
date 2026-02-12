import type { PipelineStage, PipelineContext } from '../application/skill-pipeline.js';
import type { ScoredSkill } from '../types/application.js';
import type { EmbeddingService } from '../embeddings/embedding-service.js';
import type { RelevanceScorer } from '../application/relevance-scorer.js';
import type { SkillIndexEntry } from '../storage/skill-index.js';
import { cosineSimilarity } from '../embeddings/cosine-similarity.js';

/**
 * Configuration for the corrective RAG stage.
 *
 * If types.ts is created by 69-01, this definition can be consolidated
 * in the integration plan (69-05).
 */
export interface CorrectionConfig {
  /** Score threshold above which no correction is needed */
  confidenceThreshold: number;
  /** Maximum number of correction iterations */
  maxIterations: number;
  /** Minimum relative improvement per iteration to continue (0.05 = 5%) */
  minImprovementRate: number;
}

/** Default correction configuration: 0.7 confidence, max 3 iterations, 5% min improvement */
export const DEFAULT_CORRECTION_CONFIG: CorrectionConfig = {
  confidenceThreshold: 0.7,
  maxIterations: 3,
  minImprovementRate: 0.05,
};

/** Stop words to strip from queries during refinement */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'to', 'and', 'or', 'of', 'in', 'for',
  'with', 'on', 'at', 'by', 'it', 'be', 'as', 'do', 'not', 'this',
  'that', 'are', 'was', 'were', 'been', 'has', 'have', 'had',
]);

/**
 * Corrective RAG pipeline stage that validates retrieval quality
 * after scoring and re-queries with refined terms when confidence is low.
 *
 * Implements RAG-01 (corrective RAG validates and refines) and RAG-02
 * (max iterations + diminishing returns check). Pipeline wiring is
 * deferred to 69-05.
 *
 * Preconditions: scoredSkills populated (by ScoreStage).
 * Postconditions: scoredSkills may be updated with improved scores.
 */
export class CorrectionStage implements PipelineStage {
  readonly name = 'correction';

  constructor(
    private embeddingService: EmbeddingService,
    private scorer: RelevanceScorer,
    private config: CorrectionConfig = DEFAULT_CORRECTION_CONFIG,
  ) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    // Pass through on earlyExit or empty results
    if (context.earlyExit || context.scoredSkills.length === 0) {
      return context;
    }

    const topScore = context.scoredSkills[0]?.score ?? 0;

    // High confidence: no correction needed
    if (topScore >= this.config.confidenceThreshold) {
      return context;
    }

    // Build initial query from context
    const baseQuery = [context.intent, context.context].filter(Boolean).join(' ');
    if (!baseQuery) {
      return context; // No query to refine
    }

    // Enter correction loop
    let currentScores = [...context.scoredSkills];
    let previousBestScore = topScore;
    let iterations = 0;

    while (iterations < this.config.maxIterations) {
      iterations++;

      // Refine query based on current state and iteration strategy
      const refinedQuery = this.refineQuery(baseQuery, currentScores, context.matches, iterations);

      // Re-score with refined query using embedding similarity
      const newScores = await this.reScoreWithEmbeddings(refinedQuery, context.matches);

      const newBestScore = newScores[0]?.score ?? 0;

      // Check for improvement
      const improvement = previousBestScore > 0
        ? (newBestScore - previousBestScore) / previousBestScore
        : newBestScore > 0 ? 1 : 0;

      // Diminishing returns check (RAG-02)
      if (improvement < this.config.minImprovementRate) {
        // If new scores are better at all, use them; otherwise keep current
        if (newBestScore > previousBestScore) {
          currentScores = newScores;
        }
        break;
      }

      currentScores = newScores;
      previousBestScore = newBestScore;

      // Above threshold: done
      if (newBestScore >= this.config.confidenceThreshold) {
        break;
      }
    }

    context.scoredSkills = currentScores;
    return context;
  }

  /**
   * Refine the query based on iteration number using progressive strategies:
   *
   * 1. Iteration 1: Strip stop words from base query
   * 2. Iteration 2: Expand with terms from the top-scored skill's description
   * 3. Iteration 3: Combine with trigger keywords from top matches
   */
  private refineQuery(
    baseQuery: string,
    currentScores: ScoredSkill[],
    matches: SkillIndexEntry[],
    iteration: number,
  ): string {
    // Always start with cleaned query (stop words removed)
    const cleanedTokens = baseQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0 && !STOP_WORDS.has(word));
    const cleanedQuery = cleanedTokens.join(' ');

    if (iteration === 1) {
      // Strategy 1: Just strip stop words
      return cleanedQuery || baseQuery;
    }

    if (iteration === 2) {
      // Strategy 2: Expand with description terms from top-scored match
      const topSkillName = currentScores[0]?.name;
      const topMatch = matches.find(m => m.name === topSkillName);

      if (topMatch?.description) {
        const descriptionTerms = topMatch.description
          .toLowerCase()
          .split(/\s+/)
          .filter(word =>
            word.length > 2 &&
            !STOP_WORDS.has(word) &&
            !cleanedTokens.includes(word),
          )
          .slice(0, 3);

        if (descriptionTerms.length > 0) {
          return `${cleanedQuery} ${descriptionTerms.join(' ')}`;
        }
      }
      return cleanedQuery || baseQuery;
    }

    // Strategy 3 (iteration >= 3): Combine with trigger keywords
    const triggerTerms: string[] = [];
    for (const match of matches.slice(0, 3)) {
      if (match.triggers?.intents) {
        for (const intent of match.triggers.intents) {
          const terms = intent.toLowerCase().split(/\s+/).filter(
            w => w.length > 2 && !STOP_WORDS.has(w) && !cleanedTokens.includes(w),
          );
          triggerTerms.push(...terms);
        }
      }
      if (match.triggers?.contexts) {
        for (const ctx of match.triggers.contexts) {
          const terms = ctx.toLowerCase().split(/\s+/).filter(
            w => w.length > 2 && !STOP_WORDS.has(w) && !cleanedTokens.includes(w),
          );
          triggerTerms.push(...terms);
        }
      }
    }

    // Deduplicate and take first 3 unique trigger terms
    const uniqueTriggers = [...new Set(triggerTerms)].slice(0, 3);
    if (uniqueTriggers.length > 0) {
      return `${cleanedQuery} ${uniqueTriggers.join(' ')}`;
    }
    return cleanedQuery || baseQuery;
  }

  /**
   * Re-score matches using embedding similarity between the refined query
   * and each match's description.
   *
   * Embeds the refined query, then embeds each match description, and
   * computes cosine similarity to produce updated ScoredSkill entries.
   */
  private async reScoreWithEmbeddings(
    query: string,
    matches: SkillIndexEntry[],
  ): Promise<ScoredSkill[]> {
    // Embed the refined query
    const queryResult = await this.embeddingService.embed(query);
    const queryEmbedding = queryResult.embedding;

    const scored: ScoredSkill[] = [];

    for (const match of matches) {
      const description = match.description || match.name;
      const matchResult = await this.embeddingService.embed(description, match.name);
      const similarity = cosineSimilarity(queryEmbedding, matchResult.embedding);

      scored.push({
        name: match.name,
        score: similarity,
        matchType: 'intent',
      });
    }

    // Sort by similarity descending
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }
}
