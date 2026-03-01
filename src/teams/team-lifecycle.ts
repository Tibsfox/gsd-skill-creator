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

import type { TeamConfig, TeamLifecycleState, TeamManagedBy } from '../types/team.js';
import type { TeamStore } from './team-store.js';
import { appendTeamEvent } from './team-event-log.js';
import type { TeamLifecycleEvent } from './team-event-log.js';

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

// ============================================================================
// TeamLifecycleManager
// ============================================================================

/**
 * Composes TeamStore, state machine, and event log into a
 * cohesive lifecycle management API.
 *
 * All methods are idempotent where sensible:
 * - createTeam: returns existing team if FORMING or ACTIVE
 * - activateTeam: no-op if already ACTIVE
 * - dissolveTeam: no-op if already DISSOLVED
 *
 * Every state transition persists the updated config and appends
 * an audit event to the team's JSONL event log.
 */
export class TeamLifecycleManager {
  constructor(
    private store: TeamStore,
    private teamsDir: string,
  ) {}

  /**
   * Create a new team in FORMING state.
   *
   * Idempotent: if a team with the same name already exists and is
   * FORMING or ACTIVE, returns the existing config without modification.
   *
   * @param config - Team configuration to create
   * @param managedBy - Who manages this team ('auto' or 'manual')
   * @returns The created (or existing) TeamConfig
   * @throws Error if team exists in DISSOLVED state
   */
  async createTeam(
    config: TeamConfig,
    managedBy: TeamManagedBy = 'manual',
  ): Promise<TeamConfig> {
    // Idempotent: if team exists and is FORMING or ACTIVE, return it
    if (await this.store.exists(config.name)) {
      const existing = await this.store.read(config.name);
      const state = (existing.lifecycleState as TeamLifecycleState) ?? 'ACTIVE';
      if (state === 'FORMING' || state === 'ACTIVE') return existing;
      throw new Error(
        `Cannot create team '${config.name}': already exists in ${state} state`,
      );
    }

    const newConfig: TeamConfig = {
      ...config,
      managedBy,
      lifecycleState: 'FORMING' as TeamLifecycleState,
      durability: config.durability ?? 'persistent',
    };

    await this.store.save(newConfig);
    await appendTeamEvent(this.teamsDir, config.name, {
      timestamp: new Date().toISOString(),
      event: 'created',
      trigger: `createTeam(managedBy=${managedBy})`,
      managedBy,
    });

    return newConfig;
  }

  /**
   * Activate a team (FORMING -> ACTIVE).
   *
   * Idempotent: no-op if team is already ACTIVE.
   *
   * @param teamName - Name of the team to activate
   * @returns Updated TeamConfig
   */
  async activateTeam(teamName: string): Promise<TeamConfig> {
    const config = await this.store.read(teamName);
    const current = (config.lifecycleState as TeamLifecycleState) ?? 'ACTIVE';
    if (current === 'ACTIVE') return config; // Idempotent

    const updated = teamTransition(config, 'ACTIVE', 'activateTeam');
    await this.store.save(updated);
    await appendTeamEvent(this.teamsDir, teamName, {
      timestamp: new Date().toISOString(),
      event: 'activated',
      trigger: 'activateTeam',
      managedBy: (updated.managedBy as TeamManagedBy) ?? 'manual',
    });
    return updated;
  }

  /**
   * Dissolve a team.
   *
   * - FORMING teams go directly to DISSOLVED (abort shortcut)
   * - ACTIVE teams go through DISSOLVING -> DISSOLVED
   * - Already DISSOLVED teams are a no-op (idempotent)
   *
   * @param teamName - Name of the team to dissolve
   * @param trigger - What caused the dissolution
   * @returns Updated TeamConfig in DISSOLVED state
   */
  async dissolveTeam(
    teamName: string,
    trigger: string = 'dissolveTeam',
  ): Promise<TeamConfig> {
    const config = await this.store.read(teamName);
    const current = (config.lifecycleState as TeamLifecycleState) ?? 'ACTIVE';
    if (current === 'DISSOLVED') return config; // Idempotent

    const managedBy = (config.managedBy as TeamManagedBy) ?? 'manual';

    if (current === 'FORMING') {
      // Abort shortcut: FORMING -> DISSOLVED directly
      const dissolved = teamTransition(config, 'DISSOLVED', trigger);
      await this.store.save(dissolved);
      await appendTeamEvent(this.teamsDir, teamName, {
        timestamp: new Date().toISOString(),
        event: 'dissolved',
        trigger,
        managedBy,
      });
      return dissolved;
    }

    // Normal path: ACTIVE -> DISSOLVING -> DISSOLVED
    const dissolving = teamTransition(config, 'DISSOLVING', trigger);
    await this.store.save(dissolving);
    await appendTeamEvent(this.teamsDir, teamName, {
      timestamp: new Date().toISOString(),
      event: 'dissolving',
      trigger,
      managedBy,
    });

    const dissolved = teamTransition(dissolving, 'DISSOLVED', trigger);
    await this.store.save(dissolved);
    await appendTeamEvent(this.teamsDir, teamName, {
      timestamp: new Date().toISOString(),
      event: 'dissolved',
      trigger,
      managedBy,
    });
    return dissolved;
  }

  /**
   * Get the current lifecycle state of a team.
   *
   * @param teamName - Name of the team
   * @returns Current TeamLifecycleState
   */
  async getLifecycleState(teamName: string): Promise<TeamLifecycleState> {
    const config = await this.store.read(teamName);
    return (config.lifecycleState as TeamLifecycleState) ?? 'ACTIVE';
  }
}
