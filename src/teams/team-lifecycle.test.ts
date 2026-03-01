import { describe, it, expect } from 'vitest';
import {
  TEAM_VALID_TRANSITIONS,
  isValidTeamTransition,
  teamTransition,
} from './team-lifecycle.js';
import type { TeamConfig } from '../types/team.js';
import type { TeamLifecycleState } from './team-lifecycle.js';

// ============================================================================
// Helper
// ============================================================================

function createTeamConfig(overrides?: Partial<TeamConfig>): TeamConfig {
  return {
    name: 'test-team',
    leadAgentId: 'lead-1',
    createdAt: '2026-03-01T00:00:00Z',
    members: [{ agentId: 'lead-1', name: 'Lead' }],
    lifecycleState: 'FORMING' as TeamLifecycleState,
    ...overrides,
  };
}

// ============================================================================
// TEAM_VALID_TRANSITIONS
// ============================================================================

describe('TEAM_VALID_TRANSITIONS', () => {
  it('should define transitions for all 4 states', () => {
    expect(Object.keys(TEAM_VALID_TRANSITIONS)).toEqual([
      'FORMING',
      'ACTIVE',
      'DISSOLVING',
      'DISSOLVED',
    ]);
  });

  it('should have DISSOLVED as terminal state with no transitions', () => {
    expect(TEAM_VALID_TRANSITIONS.DISSOLVED).toEqual([]);
  });
});

// ============================================================================
// isValidTeamTransition
// ============================================================================

describe('isValidTeamTransition', () => {
  it('should return true for FORMING -> ACTIVE', () => {
    expect(isValidTeamTransition('FORMING', 'ACTIVE')).toBe(true);
  });

  it('should return true for FORMING -> DISSOLVED (abort shortcut)', () => {
    expect(isValidTeamTransition('FORMING', 'DISSOLVED')).toBe(true);
  });

  it('should return true for ACTIVE -> DISSOLVING', () => {
    expect(isValidTeamTransition('ACTIVE', 'DISSOLVING')).toBe(true);
  });

  it('should return true for DISSOLVING -> DISSOLVED', () => {
    expect(isValidTeamTransition('DISSOLVING', 'DISSOLVED')).toBe(true);
  });

  it('should return false for DISSOLVED -> FORMING (terminal state)', () => {
    expect(isValidTeamTransition('DISSOLVED', 'FORMING')).toBe(false);
  });

  it('should return false for DISSOLVED -> ACTIVE (terminal state)', () => {
    expect(isValidTeamTransition('DISSOLVED', 'ACTIVE')).toBe(false);
  });

  it('should return false for ACTIVE -> FORMING (backward transition)', () => {
    expect(isValidTeamTransition('ACTIVE', 'FORMING')).toBe(false);
  });

  it('should return false for ACTIVE -> DISSOLVED (must go through DISSOLVING)', () => {
    expect(isValidTeamTransition('ACTIVE', 'DISSOLVED')).toBe(false);
  });

  it('should return false for DISSOLVING -> ACTIVE (cannot reactivate)', () => {
    expect(isValidTeamTransition('DISSOLVING', 'ACTIVE')).toBe(false);
  });
});

// ============================================================================
// teamTransition
// ============================================================================

describe('teamTransition', () => {
  it('should transition FORMING -> ACTIVE', () => {
    const config = createTeamConfig({ lifecycleState: 'FORMING' });
    const result = teamTransition(config, 'ACTIVE', 'activateTeam');
    expect(result.lifecycleState).toBe('ACTIVE');
  });

  it('should transition FORMING -> DISSOLVED (abort shortcut)', () => {
    const config = createTeamConfig({ lifecycleState: 'FORMING' });
    const result = teamTransition(config, 'DISSOLVED', 'abortTeam');
    expect(result.lifecycleState).toBe('DISSOLVED');
  });

  it('should transition ACTIVE -> DISSOLVING', () => {
    const config = createTeamConfig({ lifecycleState: 'ACTIVE' });
    const result = teamTransition(config, 'DISSOLVING', 'dissolveTeam');
    expect(result.lifecycleState).toBe('DISSOLVING');
  });

  it('should transition DISSOLVING -> DISSOLVED', () => {
    const config = createTeamConfig({ lifecycleState: 'DISSOLVING' });
    const result = teamTransition(config, 'DISSOLVED', 'dissolveTeam');
    expect(result.lifecycleState).toBe('DISSOLVED');
  });

  it('should throw on DISSOLVED -> anything (terminal state)', () => {
    const config = createTeamConfig({ lifecycleState: 'DISSOLVED' });
    expect(() => teamTransition(config, 'FORMING', 'revive')).toThrow(
      /Invalid team lifecycle transition from DISSOLVED to FORMING/,
    );
  });

  it('should throw on ACTIVE -> FORMING (backward transition)', () => {
    const config = createTeamConfig({ lifecycleState: 'ACTIVE' });
    expect(() => teamTransition(config, 'FORMING', 'revert')).toThrow(
      /Invalid team lifecycle transition from ACTIVE to FORMING/,
    );
  });

  it('should throw on ACTIVE -> DISSOLVED (must go through DISSOLVING)', () => {
    const config = createTeamConfig({ lifecycleState: 'ACTIVE' });
    expect(() => teamTransition(config, 'DISSOLVED', 'skip')).toThrow(
      /Invalid team lifecycle transition from ACTIVE to DISSOLVED/,
    );
  });

  it('should throw on DISSOLVING -> ACTIVE (cannot reactivate)', () => {
    const config = createTeamConfig({ lifecycleState: 'DISSOLVING' });
    expect(() => teamTransition(config, 'ACTIVE', 'reactivate')).toThrow(
      /Invalid team lifecycle transition from DISSOLVING to ACTIVE/,
    );
  });

  it('should return new object (does not mutate input)', () => {
    const config = createTeamConfig({ lifecycleState: 'FORMING' });
    const result = teamTransition(config, 'ACTIVE', 'activateTeam');
    expect(result).not.toBe(config);
    expect(config.lifecycleState).toBe('FORMING');
  });

  it('should set lifecycleState on returned config', () => {
    const config = createTeamConfig({ lifecycleState: 'FORMING' });
    const result = teamTransition(config, 'ACTIVE', 'activateTeam');
    expect(result.lifecycleState).toBe('ACTIVE');
    expect(result.name).toBe('test-team');
  });

  it('should throw descriptive error listing allowed transitions', () => {
    const config = createTeamConfig({ lifecycleState: 'ACTIVE' });
    try {
      teamTransition(config, 'FORMING', 'bad');
      expect.fail('should have thrown');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain('from ACTIVE to FORMING');
      expect(message).toContain('allowed targets from ACTIVE are [DISSOLVING]');
    }
  });

  it('should default to ACTIVE when lifecycleState is undefined (backward compat)', () => {
    const config = createTeamConfig();
    delete (config as Record<string, unknown>).lifecycleState;
    const result = teamTransition(config, 'DISSOLVING', 'dissolve');
    expect(result.lifecycleState).toBe('DISSOLVING');
  });
});
