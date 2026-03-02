/**
 * State machine for the autonomy execution engine.
 *
 * Defines the valid state transitions, a factory for creating initial
 * execution state, and a pure transition function that enforces the
 * transition map.
 *
 * The 7 states form a directed graph:
 *   INITIALIZED -> RUNNING -> CHECKPOINTING -> RUNNING (loop)
 *                     |           |
 *                     +-> PAUSED -+-> RUNNING (resume)
 *                     |
 *                     +-> COMPLETING -> DONE
 *                     |                  |
 *                     +-> FAILED <-------+
 *
 * DONE and FAILED are terminal states with no outgoing transitions.
 *
 * @module autonomy/state-machine
 */

import type { ExecutionState, ExecutionStatus, StateTransition } from './types.js';

// ============================================================================
// Transition Map
// ============================================================================

/**
 * Valid state transitions for the execution state machine.
 *
 * Each key is a source state, and the value is an array of valid
 * target states reachable from it.
 */
export const VALID_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
  INITIALIZED: ['RUNNING', 'FAILED'],
  RUNNING: ['CHECKPOINTING', 'PAUSED', 'COMPLETING', 'FAILED'],
  CHECKPOINTING: ['RUNNING', 'FAILED'],
  PAUSED: ['RUNNING', 'FAILED'],
  COMPLETING: ['DONE', 'FAILED'],
  DONE: [],
  FAILED: [],
};

// ============================================================================
// Transition Validation
// ============================================================================

/**
 * Check whether a state transition is valid according to the transition map.
 *
 * @param from - Current state
 * @param to - Target state
 * @returns true if the transition is allowed
 */
export function isValidTransition(from: ExecutionStatus, to: ExecutionStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new ExecutionState in the INITIALIZED status.
 *
 * All array fields use fresh instances to prevent shared mutable state
 * between multiple calls.
 *
 * @param milestone - The milestone identifier (e.g., 'v1.53')
 * @param overrides - Optional partial overrides merged into the state
 * @returns A fresh ExecutionState object
 */
export function createExecutionState(
  milestone: string,
  overrides?: Partial<ExecutionState>,
): ExecutionState {
  const now = new Date().toISOString();

  const base: ExecutionState = {
    version: 1,
    milestone,
    status: 'INITIALIZED' as ExecutionStatus,
    current_subversion: 0,
    total_subversions: 100,
    started_at: now,
    updated_at: now,
    completed_subversions: [],
    checkpoints: [],
    transitions: [],
    current_phase: null,
    context_budget: null,
    last_error: null,
    resume_from: null,
  };

  if (overrides) {
    return { ...base, ...overrides };
  }

  return base;
}

// ============================================================================
// Transition Function
// ============================================================================

/**
 * Transition the execution state to a new status.
 *
 * This function is **pure** — it returns a new state object and does not
 * mutate the input. The transition is validated against VALID_TRANSITIONS
 * and throws if the transition is not allowed.
 *
 * @param state - Current execution state (not mutated)
 * @param to - Target status
 * @param trigger - Human-readable reason for the transition
 * @returns New ExecutionState with updated status, timestamp, and transition record
 * @throws Error if the transition is invalid
 */
export function transition(
  state: ExecutionState,
  to: ExecutionStatus,
  trigger: string,
): ExecutionState {
  if (!isValidTransition(state.status, to)) {
    throw new Error(
      `Invalid transition from ${state.status} to ${to}: ` +
      `allowed targets from ${state.status} are [${VALID_TRANSITIONS[state.status].join(', ')}]`,
    );
  }

  const now = new Date().toISOString();

  const record: StateTransition = {
    from: state.status,
    to,
    trigger,
    timestamp: now,
  };

  return {
    ...state,
    status: to,
    updated_at: now,
    transitions: [...state.transitions, record],
  };
}
