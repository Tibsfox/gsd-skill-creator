/**
 * @file Review milestone barrel export
 * @description Re-exports all review milestone types, constants, and functions
 *              from review-config, review-lifecycle, and review-gates modules.
 * @module tools/commands/review-milestone
 */

// review-config.ts -- Phase 556
export type { ReviewMilestoneConfig, ReviewLifecycleState, ReviewScoringConfig } from './review-config.js';
export { DEFAULT_REVIEW_MILESTONE_CONFIG } from './review-config.js';

// review-lifecycle.ts -- Phase 560 Plan 01
export type { ReviewMilestoneState, ReviewStateTransition } from './review-lifecycle.js';
export {
  VALID_REVIEW_TRANSITIONS,
  isValidReviewTransition,
  createReviewMilestoneState,
  transitionReviewMilestone,
  enforceSequentialExecution,
} from './review-lifecycle.js';

// review-gates.ts -- Phase 560 Plan 02
export type { ReviewGateResult, ReviewGateEvaluation, ReviewGateParams } from './review-gates.js';
export { evaluateReviewGates } from './review-gates.js';
