/**
 * Team lifecycle state machine.
 *
 * Provides a pure state-transition function for team lifecycle management.
 * Follows the same pattern as src/services/autonomy/state-machine.ts.
 *
 * The 4 states form a directed graph:
 *   FORMING -> ACTIVE -> DISSOLVING -> DISSOLVED
 *        |                                ^
 *        +--------------------------------+
 *        (abort shortcut: FORMING -> DISSOLVED)
 *
 * DISSOLVED is a terminal state with no outgoing transitions.
 *
 * @module teams/team-lifecycle
 */

import type { TeamConfig, TeamLifecycleState } from '../types/team.js';

// ============================================================================
// Re-export TeamLifecycleState for convenience
// ============================================================================

export type { TeamLifecycleState } from '../types/team.js';

// ============================================================================
// Transition Map
// ============================================================================

/**
 * Valid state transitions for the team lifecycle state machine.
 *
 * Each key is a source state, and the value is an array of valid
 * target states reachable from it.
 *
 * - FORMING: Can activate (normal) or dissolve (abort)
 * - ACTIVE: Must go through DISSOLVING before DISSOLVED
 * - DISSOLVING: Terminal transition to DISSOLVED
 * - DISSOLVED: Terminal state with no outgoing transitions
 */
export const TEAM_VALID_TRANSITIONS: Record<TeamLifecycleState, TeamLifecycleState[]> = {
  FORMING: ['ACTIVE', 'DISSOLVED'],
  ACTIVE: ['DISSOLVING'],
  DISSOLVING: ['DISSOLVED'],
  DISSOLVED: [],
};

// ============================================================================
// Transition Validation
// ============================================================================

/**
 * Check whether a team lifecycle transition is valid.
 *
 * @param from - Current lifecycle state
 * @param to - Target lifecycle state
 * @returns true if the transition is allowed
 */
export function isValidTeamTransition(
  from: TeamLifecycleState,
  to: TeamLifecycleState,
): boolean {
  const allowed = TEAM_VALID_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}

// ============================================================================
// Transition Function
// ============================================================================

/**
 * Transition a team config to a new lifecycle state.
 *
 * This function is **pure** -- it returns a new config object and does not
 * mutate the input. The transition is validated against TEAM_VALID_TRANSITIONS
 * and throws if the transition is not allowed.
 *
 * @param config - Current team config (not mutated)
 * @param to - Target lifecycle state
 * @param trigger - Human-readable reason for the transition
 * @returns New TeamConfig with updated lifecycleState
 * @throws Error if the transition is invalid
 */
export function teamTransition(
  config: TeamConfig,
  to: TeamLifecycleState,
  trigger: string,
): TeamConfig {
  const current: TeamLifecycleState = (config.lifecycleState as TeamLifecycleState) ?? 'ACTIVE';

  if (!isValidTeamTransition(current, to)) {
    const allowed = TEAM_VALID_TRANSITIONS[current];
    throw new Error(
      `Invalid team lifecycle transition from ${current} to ${to}: ` +
      `allowed targets from ${current} are [${allowed.join(', ')}]`,
    );
  }

  return {
    ...config,
    lifecycleState: to,
  };
}
