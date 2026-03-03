/**
 * @file Review milestone configuration type definitions
 * @description Composite configuration type for review-type milestones that
 *              references PacingConfig and ChainConfig. Defines the review
 *              lifecycle state machine and scoring rubric.
 *              Consumed by Phase 560 (Review Milestone Type) and Phase 561
 *              (CLI Integration and Templates).
 * @module tools/commands/review-milestone
 */

import type { PacingConfig } from '../../../core/validation/pacing-gate/index.js';
import { DEFAULT_PACING_CONFIG } from '../../../core/validation/pacing-gate/index.js';
import type { ChainConfig } from '../lessons-chain/index.js';
import { DEFAULT_CHAIN_CONFIG } from '../lessons-chain/index.js';

/**
 * Lifecycle states for a review-type milestone.
 * Enforces a strict progression with no state skipping.
 * - `LOAD`: Load context from prior milestone and lessons-learned
 * - `REVIEW`: Execute the review (code review, proof verification, etc.)
 * - `REFLECT`: Write retrospective and lessons-learned documents
 * - `CLOSE`: Final gate checks and milestone closure
 */
export type ReviewLifecycleState = 'LOAD' | 'REVIEW' | 'REFLECT' | 'CLOSE';

/**
 * Configuration for the scoring rubric used to evaluate
 * review milestone quality.
 */
export interface ReviewScoringConfig {
  /** Scoring dimensions (e.g., ['completeness', 'depth', 'connections', 'honesty']). */
  rubric: string[];

  /** Minimum average score to pass (e.g., 3.0 out of 5.0). */
  minimumScore: number;
}

/**
 * Composite configuration for a review-type milestone.
 * Composes PacingConfig, ChainConfig, and ReviewScoringConfig
 * into a unified configuration consumed by the review milestone
 * lifecycle state machine.
 */
export interface ReviewMilestoneConfig {
  /** Literal type discriminant identifying this as a review milestone. */
  type: 'review';

  /** Pacing gate configuration (controls session budget and depth). */
  pacing: PacingConfig;

  /** Lessons-learned chain configuration (controls chain integrity). */
  chain: ChainConfig;

  /** Scoring rubric configuration. */
  scoring: ReviewScoringConfig;
}

/**
 * Default review milestone configuration with conservative
 * settings appropriate for the v1.50a Unit Circle re-execution.
 */
export const DEFAULT_REVIEW_MILESTONE_CONFIG: ReviewMilestoneConfig = {
  type: 'review',
  pacing: DEFAULT_PACING_CONFIG,
  chain: DEFAULT_CHAIN_CONFIG,
  scoring: {
    rubric: ['completeness', 'depth', 'connections', 'honesty'],
    minimumScore: 3.0,
  },
};
