/**
 * @file Review milestone lifecycle state machine
 * @description Strict 4-state lifecycle for review-type milestones:
 *              LOAD -> REVIEW -> REFLECT -> CLOSE.
 *
 *              The state machine enforces sequential progression with no
 *              state skipping or backward transitions. CLOSE is terminal.
 *              All functions are pure -- they return new state objects
 *              without mutating inputs.
 *
 *              Follows the autonomy engine state-machine pattern
 *              (src/services/autonomy/state-machine.ts).
 *
 * @module tools/commands/review-milestone
 */

import type { ReviewLifecycleState, ReviewMilestoneConfig } from './review-config.js';
import { DEFAULT_REVIEW_MILESTONE_CONFIG } from './review-config.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A single recorded state transition in the review lifecycle.
 */
export interface ReviewStateTransition {
  /** State transitioned from. */
  from: ReviewLifecycleState;

  /** State transitioned to. */
  to: ReviewLifecycleState;

  /** Human-readable reason for the transition. */
  trigger: string;

  /** ISO-8601 timestamp of when the transition occurred. */
  timestamp: string;
}

/**
 * Complete state of a review milestone, including its current lifecycle
 * position, configuration, and transition history.
 */
export interface ReviewMilestoneState {
  /** Unique identifier for this review milestone (e.g., 'v1.50.14'). */
  milestoneId: string;

  /** Current lifecycle state. */
  currentState: ReviewLifecycleState;

  /** Configuration governing this review milestone. */
  config: ReviewMilestoneConfig;

  /** Ordered history of state transitions. */
  transitions: ReviewStateTransition[];

  /** ISO-8601 timestamp of when this state was created. */
  createdAt: string;

  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
}

// ============================================================================
// Transition Map
// ============================================================================

/**
 * Valid state transitions for the review milestone lifecycle.
 *
 * The lifecycle is a strict linear chain with no branching:
 * - LOAD -> [REVIEW]
 * - REVIEW -> [REFLECT]
 * - REFLECT -> [CLOSE]
 * - CLOSE -> [] (terminal)
 */
export const VALID_REVIEW_TRANSITIONS: Record<ReviewLifecycleState, ReviewLifecycleState[]> = {
  LOAD: ['REVIEW'],
  REVIEW: ['REFLECT'],
  REFLECT: ['CLOSE'],
  CLOSE: [],
};

// ============================================================================
// Transition Validation
// ============================================================================

/**
 * Check whether a review lifecycle transition is valid.
 *
 * @param from - Current lifecycle state
 * @param to - Target lifecycle state
 * @returns true if the transition is allowed
 */
export function isValidReviewTransition(
  from: ReviewLifecycleState,
  to: ReviewLifecycleState,
): boolean {
  const allowed = VALID_REVIEW_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new ReviewMilestoneState in the LOAD phase.
 *
 * @param milestoneId - Unique milestone identifier (e.g., 'v1.50.14')
 * @param config - Optional configuration override; defaults to DEFAULT_REVIEW_MILESTONE_CONFIG
 * @returns A fresh ReviewMilestoneState in LOAD with empty transitions
 */
export function createReviewMilestoneState(
  milestoneId: string,
  config?: ReviewMilestoneConfig,
): ReviewMilestoneState {
  const now = new Date().toISOString();

  return {
    milestoneId,
    currentState: 'LOAD',
    config: config ?? DEFAULT_REVIEW_MILESTONE_CONFIG,
    transitions: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Transition Function
// ============================================================================

/**
 * Transition a review milestone to a new lifecycle state.
 *
 * This function is **pure** -- it returns a new state object and does not
 * mutate the input. The transition is validated against VALID_REVIEW_TRANSITIONS
 * and throws if the transition is not allowed.
 *
 * @param state - Current review milestone state (not mutated)
 * @param to - Target lifecycle state
 * @param trigger - Human-readable reason for the transition
 * @returns New ReviewMilestoneState with updated currentState, timestamp, and transition record
 * @throws Error if the transition is invalid
 */
export function transitionReviewMilestone(
  state: ReviewMilestoneState,
  to: ReviewLifecycleState,
  trigger: string,
): ReviewMilestoneState {
  if (!isValidReviewTransition(state.currentState, to)) {
    const allowed = VALID_REVIEW_TRANSITIONS[state.currentState];
    throw new Error(
      `Invalid review transition from ${state.currentState} to ${to}: ` +
      `allowed targets from ${state.currentState} are [${allowed.join(', ')}]`,
    );
  }

  const now = new Date().toISOString();

  const record: ReviewStateTransition = {
    from: state.currentState,
    to,
    trigger,
    timestamp: now,
  };

  return {
    ...state,
    currentState: to,
    updatedAt: now,
    transitions: [...state.transitions, record],
  };
}

// ============================================================================
// Sequential Execution Enforcement
// ============================================================================

/**
 * Enforce sequential execution for review-type milestones.
 *
 * Review milestones with `pacing.sequentialOnly = true` must not use
 * wave parallelism (i.e., waveCount must be <= 1). Non-review configs
 * are always allowed.
 *
 * @param config - Milestone configuration to check
 * @param waveCount - Number of parallel waves requested
 * @returns Object with `allowed` boolean and optional `reason` string
 */
export function enforceSequentialExecution(
  config: ReviewMilestoneConfig,
  waveCount: number,
): { allowed: boolean; reason?: string } {
  // Non-review configs are always allowed
  if (config.type !== 'review') {
    return { allowed: true };
  }

  // If sequential execution is not required, allow any wave count
  if (!config.pacing.sequentialOnly) {
    return { allowed: true };
  }

  // Sequential-only milestones must have at most 1 wave
  if (waveCount > 1) {
    return {
      allowed: false,
      reason: `Review milestone requires sequential execution (sequentialOnly=true), but ${waveCount} parallel waves were requested. Use wave count of 1.`,
    };
  }

  return { allowed: true };
}
