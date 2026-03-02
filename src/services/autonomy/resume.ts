/**
 * Auto-resume logic for the autonomy execution engine.
 *
 * Provides crash recovery by reading persisted execution-state.json,
 * determining the correct subversion to resume from, and preparing
 * the state for the scheduler to continue.
 *
 * Key guarantees:
 * - Already-completed subversions are never re-executed
 * - PAUSED and CHECKPOINTING states transition back to RUNNING
 * - resume_from field is consumed (cleared) after use
 * - Missing or corrupt state files produce clear errors
 *
 * @module autonomy/resume
 */

import type { ExecutionState, ExecutionStatus } from './types.js';
import { transition } from './state-machine.js';
import { readExecutionState } from './persistence.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a resume attempt.
 */
export type ResumeResult =
  | { canResume: true; state: ExecutionState; resumeFrom: number }
  | { canResume: false; reason: string };

// ============================================================================
// Resumable status set
// ============================================================================

/** Statuses from which execution can be resumed */
const RESUMABLE_STATUSES: Set<ExecutionStatus> = new Set([
  'RUNNING',
  'CHECKPOINTING',
  'PAUSED',
]);

// ============================================================================
// canResume
// ============================================================================

/**
 * Check whether the given status allows resumption.
 *
 * Resumable: RUNNING (crash recovery), CHECKPOINTING, PAUSED
 * Not resumable: INITIALIZED (needs fresh start), DONE, FAILED, COMPLETING (terminal/near-terminal)
 *
 * @param status - Current execution status
 * @returns true if the engine can resume from this status
 */
export function canResume(status: ExecutionStatus): boolean {
  return RESUMABLE_STATUSES.has(status);
}

// ============================================================================
// computeResumePoint
// ============================================================================

/**
 * Determine which subversion to resume from.
 *
 * Priority:
 * 1. state.resume_from (explicit resume point set by checkpoint/pause logic)
 * 2. state.current_subversion (crash mid-subversion, re-attempt it)
 *
 * Validates that the resume point is within bounds and not already completed.
 * If the computed point has already been completed, advances to the next
 * uncompleted subversion.
 *
 * @param state - Current execution state
 * @returns The subversion number to resume from
 * @throws Error if resume point exceeds total_subversions
 */
export function computeResumePoint(state: ExecutionState): number {
  let point = state.resume_from !== null && state.resume_from !== undefined
    ? state.resume_from
    : state.current_subversion;

  // Validate bounds
  if (point >= state.total_subversions) {
    throw new Error(
      `Resume point ${point} is beyond total_subversions ${state.total_subversions}`,
    );
  }

  // Build set of completed subversion numbers for O(1) lookup
  const completedSet = new Set(
    state.completed_subversions.map(r => r.subversion),
  );

  // Advance past already-completed subversions
  while (point < state.total_subversions && completedSet.has(point)) {
    point++;
  }

  return point;
}

// ============================================================================
// resumeExecution
// ============================================================================

/**
 * Attempt to resume execution from a persisted state file.
 *
 * Reads the state file, validates it, checks if the status is resumable,
 * transitions PAUSED/CHECKPOINTING back to RUNNING, computes the resume
 * point, and returns the prepared state.
 *
 * @param statePath - Absolute path to execution-state.json
 * @returns ResumeResult with prepared state or reason for failure
 */
export async function resumeExecution(statePath: string): Promise<ResumeResult> {
  // Read and validate state
  const readResult = await readExecutionState(statePath);

  if (!readResult.success) {
    return {
      canResume: false,
      reason: `State file not found or invalid: ${readResult.errors.join('; ')}`,
    };
  }

  let state = readResult.data;

  // Check if status allows resumption
  if (!canResume(state.status)) {
    return {
      canResume: false,
      reason: `Cannot resume from ${state.status} state`,
    };
  }

  // Transition back to RUNNING if needed
  if (state.status === 'PAUSED' || state.status === 'CHECKPOINTING') {
    state = transition(state, 'RUNNING', `resume from ${state.status}`);
  }

  // Compute resume point
  const resumeFrom = computeResumePoint(state);

  // Update state with resume point and clear resume_from
  state = {
    ...state,
    current_subversion: resumeFrom,
    resume_from: null,
  };

  return {
    canResume: true,
    state,
    resumeFrom,
  };
}
