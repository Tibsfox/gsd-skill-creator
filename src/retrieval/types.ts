import type { SkillIndexEntry } from '../storage/skill-index.js';
import type { SkillScope } from '../types/scope.js';

/**
 * The two retrieval scoring strategies.
 * - 'tfidf': Fast keyword-based scoring (TF-IDF)
 * - 'embedding': Semantic similarity via embeddings
 */
export type RetrievalStrategy = 'tfidf' | 'embedding';

/**
 * Output of AdaptiveRouter.classify() — determines which
 * scoring path a query should take.
 */
export interface RouteDecision {
  strategy: RetrievalStrategy;
  /** Human-readable classification reason (e.g., 'simple_keyword', 'complex_semantic') */
  reason: string;
}

/**
 * Configurable thresholds for the CorrectionStage.
 * Controls when correction loops terminate.
 */
export interface CorrectionConfig {
  /** Minimum top score to skip correction (default: 0.7) */
  confidenceThreshold: number;
  /** Hard cap on correction iterations (default: 3, per RAG-02) */
  maxIterations: number;
  /** Stop if improvement < this rate (default: 0.05, per RAG-02) */
  minImprovementRate: number;
}

/**
 * Output metadata from a correction pass.
 * Tracks what the correction loop attempted and whether it improved results.
 */
export interface CorrectionResult {
  originalTopScore: number;
  finalTopScore: number;
  iterations: number;
  /** Queries attempted during correction */
  refinedQueries: string[];
  improved: boolean;
}

/**
 * Extended SkillIndexEntry for cross-project search results.
 * Adds source directory, scope, and relevance score.
 */
export interface ScopedSearchResult extends SkillIndexEntry {
  /** Directory where skill was found */
  sourceDir: string;
  /** Which scope directory it came from */
  scope: SkillScope | 'plugin';
  /** Search relevance score */
  score: number;
}

/** Default correction configuration values */
export const DEFAULT_CORRECTION_CONFIG: CorrectionConfig = {
  confidenceThreshold: 0.7,
  maxIterations: 3,
  minImprovementRate: 0.05,
};
