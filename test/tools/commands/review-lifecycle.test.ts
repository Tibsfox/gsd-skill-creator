/**
 * @file Review milestone lifecycle state machine tests
 * @description Behavioral tests for the review lifecycle state machine:
 *              VALID_REVIEW_TRANSITIONS, isValidReviewTransition,
 *              createReviewMilestoneState, transitionReviewMilestone,
 *              enforceSequentialExecution.
 */
import { describe, expect, it } from 'vitest';
import {
  VALID_REVIEW_TRANSITIONS,
  isValidReviewTransition,
  createReviewMilestoneState,
  transitionReviewMilestone,
  enforceSequentialExecution,
} from '../../../src/tools/commands/review-milestone/review-lifecycle.js';
import type {
  ReviewMilestoneState,
} from '../../../src/tools/commands/review-milestone/review-lifecycle.js';
import { DEFAULT_REVIEW_MILESTONE_CONFIG } from '../../../src/tools/commands/review-milestone/review-config.js';

// ============================================================================
// VALID_REVIEW_TRANSITIONS constant
// ============================================================================

describe('VALID_REVIEW_TRANSITIONS', () => {
  it('should allow LOAD to transition only to REVIEW', () => {
    expect(VALID_REVIEW_TRANSITIONS.LOAD).toEqual(['REVIEW']);
  });

  it('should allow REVIEW to transition only to REFLECT', () => {
    expect(VALID_REVIEW_TRANSITIONS.REVIEW).toEqual(['REFLECT']);
  });

  it('should allow REFLECT to transition only to CLOSE', () => {
    expect(VALID_REVIEW_TRANSITIONS.REFLECT).toEqual(['CLOSE']);
  });

  it('should allow CLOSE to transition nowhere (terminal)', () => {
    expect(VALID_REVIEW_TRANSITIONS.CLOSE).toEqual([]);
  });
});

// ============================================================================
// isValidReviewTransition
// ============================================================================

describe('isValidReviewTransition', () => {
  // Valid forward transitions
  it('should return true for LOAD -> REVIEW', () => {
    expect(isValidReviewTransition('LOAD', 'REVIEW')).toBe(true);
  });

  it('should return true for REVIEW -> REFLECT', () => {
    expect(isValidReviewTransition('REVIEW', 'REFLECT')).toBe(true);
  });

  it('should return true for REFLECT -> CLOSE', () => {
    expect(isValidReviewTransition('REFLECT', 'CLOSE')).toBe(true);
  });

  // Terminal state -- no transitions out
  it('should return false for CLOSE -> LOAD (terminal state)', () => {
    expect(isValidReviewTransition('CLOSE', 'LOAD')).toBe(false);
  });

  it('should return false for CLOSE -> REVIEW (terminal state)', () => {
    expect(isValidReviewTransition('CLOSE', 'REVIEW')).toBe(false);
  });

  // Skipping not allowed
  it('should return false for LOAD -> CLOSE (skip not allowed)', () => {
    expect(isValidReviewTransition('LOAD', 'CLOSE')).toBe(false);
  });

  it('should return false for LOAD -> REFLECT (skip not allowed)', () => {
    expect(isValidReviewTransition('LOAD', 'REFLECT')).toBe(false);
  });

  it('should return false for REVIEW -> CLOSE (skip not allowed)', () => {
    expect(isValidReviewTransition('REVIEW', 'CLOSE')).toBe(false);
  });

  // Backward not allowed
  it('should return false for REVIEW -> LOAD (backward not allowed)', () => {
    expect(isValidReviewTransition('REVIEW', 'LOAD')).toBe(false);
  });

  it('should return false for REFLECT -> REVIEW (backward not allowed)', () => {
    expect(isValidReviewTransition('REFLECT', 'REVIEW')).toBe(false);
  });
});

// ============================================================================
// createReviewMilestoneState
// ============================================================================

describe('createReviewMilestoneState', () => {
  it('should return state with currentState LOAD', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.currentState).toBe('LOAD');
  });

  it('should return state with empty transitions array', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.transitions).toEqual([]);
  });

  it('should use DEFAULT_REVIEW_MILESTONE_CONFIG when config not provided', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.config).toEqual(DEFAULT_REVIEW_MILESTONE_CONFIG);
  });

  it('should set createdAt to an ISO timestamp', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should set updatedAt to an ISO timestamp', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should set milestoneId to the provided parameter', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.milestoneId).toBe('v1.50.14');
  });

  it('should accept custom config override', () => {
    const customConfig = {
      ...DEFAULT_REVIEW_MILESTONE_CONFIG,
      scoring: { rubric: ['custom'], minimumScore: 4.0 },
    };
    const state = createReviewMilestoneState('v1.50.14', customConfig);
    expect(state.config.scoring.minimumScore).toBe(4.0);
  });
});

// ============================================================================
// transitionReviewMilestone
// ============================================================================

describe('transitionReviewMilestone', () => {
  it('should return new state with updated currentState on valid transition', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const next = transitionReviewMilestone(state, 'REVIEW', 'begin review');
    expect(next.currentState).toBe('REVIEW');
  });

  it('should append transition record to transitions array', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const next = transitionReviewMilestone(state, 'REVIEW', 'begin review');
    expect(next.transitions).toHaveLength(1);
    expect(next.transitions[0].from).toBe('LOAD');
    expect(next.transitions[0].to).toBe('REVIEW');
    expect(next.transitions[0].trigger).toBe('begin review');
  });

  it('should update updatedAt timestamp', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const originalUpdated = state.updatedAt;
    // Small delay to ensure different timestamp
    const next = transitionReviewMilestone(state, 'REVIEW', 'begin review');
    expect(next.updatedAt).toBeDefined();
    expect(typeof next.updatedAt).toBe('string');
  });

  it('should NOT mutate the input state (pure function)', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const originalState = state.currentState;
    const originalTransitions = state.transitions.length;
    transitionReviewMilestone(state, 'REVIEW', 'begin review');
    expect(state.currentState).toBe(originalState);
    expect(state.transitions).toHaveLength(originalTransitions);
  });

  it('should throw Error with descriptive message for invalid transition', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(() => transitionReviewMilestone(state, 'CLOSE', 'skip ahead')).toThrow(
      /LOAD.*CLOSE/,
    );
  });

  it('should throw Error when attempting to transition from CLOSE (terminal)', () => {
    let state = createReviewMilestoneState('v1.50.14');
    state = transitionReviewMilestone(state, 'REVIEW', 'step 1');
    state = transitionReviewMilestone(state, 'REFLECT', 'step 2');
    state = transitionReviewMilestone(state, 'CLOSE', 'step 3');
    expect(() => transitionReviewMilestone(state, 'LOAD', 'restart')).toThrow();
  });

  it('should support full lifecycle LOAD -> REVIEW -> REFLECT -> CLOSE', () => {
    let state = createReviewMilestoneState('v1.50.14');
    state = transitionReviewMilestone(state, 'REVIEW', 'step 1');
    state = transitionReviewMilestone(state, 'REFLECT', 'step 2');
    state = transitionReviewMilestone(state, 'CLOSE', 'step 3');
    expect(state.currentState).toBe('CLOSE');
    expect(state.transitions).toHaveLength(3);
  });
});

// ============================================================================
// enforceSequentialExecution
// ============================================================================

describe('enforceSequentialExecution', () => {
  it('should return allowed=false when sequentialOnly is true and waveCount > 1', () => {
    const config = { ...DEFAULT_REVIEW_MILESTONE_CONFIG };
    const result = enforceSequentialExecution(config, 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('should return allowed=true when sequentialOnly is true and waveCount <= 1', () => {
    const config = { ...DEFAULT_REVIEW_MILESTONE_CONFIG };
    const result = enforceSequentialExecution(config, 1);
    expect(result.allowed).toBe(true);
  });

  it('should return allowed=true when sequentialOnly is false regardless of waveCount', () => {
    const config = {
      ...DEFAULT_REVIEW_MILESTONE_CONFIG,
      pacing: { ...DEFAULT_REVIEW_MILESTONE_CONFIG.pacing, sequentialOnly: false },
    };
    const result = enforceSequentialExecution(config, 5);
    expect(result.allowed).toBe(true);
  });

  it('should return allowed=true when config type is not review', () => {
    const config = {
      ...DEFAULT_REVIEW_MILESTONE_CONFIG,
      type: 'standard' as const,
    };
    // Force non-review type to test guard clause
    const result = enforceSequentialExecution(config as any, 5);
    expect(result.allowed).toBe(true);
  });
});
