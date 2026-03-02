import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  TEAM_VALID_TRANSITIONS,
  isValidTeamTransition,
  teamTransition,
  TeamLifecycleManager,
} from './team-lifecycle.js';
import { TeamStore } from './team-store.js';
import { readTeamEvents } from './team-event-log.js';
import type { TeamConfig } from '../../core/types/team.js';
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

// ============================================================================
// TeamLifecycleManager (507-02)
// ============================================================================

describe('TeamLifecycleManager', () => {
  let tempDir: string;
  let teamsDir: string;
  let store: TeamStore;
  let manager: TeamLifecycleManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-lifecycle-mgr-'));
    teamsDir = path.join(tempDir, 'teams');
    store = new TeamStore(teamsDir);
    manager = new TeamLifecycleManager(store, teamsDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // createTeam
  // --------------------------------------------------------------------------

  describe('createTeam', () => {
    it('should save config with lifecycleState=FORMING and log created event', async () => {
      const config = createTeamConfig();
      const result = await manager.createTeam(config);
      expect(result.lifecycleState).toBe('FORMING');
      expect(result.managedBy).toBe('manual');

      const stored = await store.read('test-team');
      expect(stored.lifecycleState).toBe('FORMING');

      const events = await readTeamEvents(teamsDir, 'test-team');
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('created');
      expect(events[0].managedBy).toBe('manual');
    });

    it('should save config with managedBy=auto when specified', async () => {
      const config = createTeamConfig();
      const result = await manager.createTeam(config, 'auto');
      expect(result.managedBy).toBe('auto');

      const events = await readTeamEvents(teamsDir, 'test-team');
      expect(events[0].managedBy).toBe('auto');
    });

    it('should return existing config when FORMING team exists (idempotent)', async () => {
      const config = createTeamConfig();
      const first = await manager.createTeam(config);
      const second = await manager.createTeam(config);
      expect(second.name).toBe(first.name);
      expect(second.lifecycleState).toBe('FORMING');

      // Should only have 1 created event (no duplicate)
      const events = await readTeamEvents(teamsDir, 'test-team');
      expect(events).toHaveLength(1);
    });

    it('should return existing config when ACTIVE team exists (idempotent)', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      await manager.activateTeam('test-team');
      const result = await manager.createTeam(config);
      expect(result.lifecycleState).toBe('ACTIVE');
    });

    it('should throw when DISSOLVED team exists', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      await manager.dissolveTeam('test-team');

      await expect(manager.createTeam(config)).rejects.toThrow(
        /Cannot create team 'test-team': already exists in DISSOLVED state/,
      );
    });
  });

  // --------------------------------------------------------------------------
  // activateTeam
  // --------------------------------------------------------------------------

  describe('activateTeam', () => {
    it('should transition FORMING->ACTIVE and log activated event', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      const result = await manager.activateTeam('test-team');
      expect(result.lifecycleState).toBe('ACTIVE');

      const events = await readTeamEvents(teamsDir, 'test-team');
      expect(events).toHaveLength(2);
      expect(events[1].event).toBe('activated');
    });

    it('should be a no-op when already ACTIVE (idempotent)', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      await manager.activateTeam('test-team');
      const result = await manager.activateTeam('test-team');
      expect(result.lifecycleState).toBe('ACTIVE');

      // Only 1 activated event, not 2
      const events = await readTeamEvents(teamsDir, 'test-team');
      const activatedEvents = events.filter((e) => e.event === 'activated');
      expect(activatedEvents).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // dissolveTeam
  // --------------------------------------------------------------------------

  describe('dissolveTeam', () => {
    it('should transition ACTIVE->DISSOLVING->DISSOLVED and log both events', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      await manager.activateTeam('test-team');
      const result = await manager.dissolveTeam('test-team');
      expect(result.lifecycleState).toBe('DISSOLVED');

      const events = await readTeamEvents(teamsDir, 'test-team');
      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toContain('dissolving');
      expect(eventTypes).toContain('dissolved');
    });

    it('should dissolve ephemeral teams the same way', async () => {
      const config = createTeamConfig({ durability: 'ephemeral' });
      await manager.createTeam(config);
      await manager.activateTeam('test-team');
      const result = await manager.dissolveTeam('test-team');
      expect(result.lifecycleState).toBe('DISSOLVED');
    });

    it('should be a no-op when already DISSOLVED (idempotent)', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      await manager.activateTeam('test-team');
      await manager.dissolveTeam('test-team');
      const result = await manager.dissolveTeam('test-team');
      expect(result.lifecycleState).toBe('DISSOLVED');
    });

    it('should transition FORMING->DISSOLVED directly (abort shortcut)', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      const result = await manager.dissolveTeam('test-team');
      expect(result.lifecycleState).toBe('DISSOLVED');

      const events = await readTeamEvents(teamsDir, 'test-team');
      const eventTypes = events.map((e) => e.event);
      // FORMING->DISSOLVED is direct, no 'dissolving' event
      expect(eventTypes).toContain('dissolved');
      expect(eventTypes).not.toContain('dissolving');
    });
  });

  // --------------------------------------------------------------------------
  // getLifecycleState
  // --------------------------------------------------------------------------

  describe('getLifecycleState', () => {
    it('should return current state from stored config', async () => {
      const config = createTeamConfig();
      await manager.createTeam(config);
      expect(await manager.getLifecycleState('test-team')).toBe('FORMING');

      await manager.activateTeam('test-team');
      expect(await manager.getLifecycleState('test-team')).toBe('ACTIVE');
    });
  });
});
