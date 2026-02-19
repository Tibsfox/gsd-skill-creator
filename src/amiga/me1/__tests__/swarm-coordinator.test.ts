/**
 * Tests for ME-1 SwarmCoordinator class.
 *
 * Covers: constructor, all 8 command types (LAUNCH, STATUS, REDIRECT, REVIEW,
 * HOLD, RESUME, ABORT, DEBRIEF), command validation, resource locking,
 * conflict queuing, lock timeout, and edge cases.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SwarmCoordinator,
} from '../swarm-coordinator.js';
import type {
  SwarmCoordinatorConfig,
  TeamRegistration,
  ResourceLock,
  CommandResult,
} from '../swarm-coordinator.js';
import { TelemetryEmitter } from '../telemetry-emitter.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MISSION_ID = 'mission-2026-02-18-001';

function makeTeams(): TeamRegistration[] {
  return [
    { team_id: 'CS', agent_ids: ['CS-1', 'CS-2'], status: 'active' },
    { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'], status: 'active' },
    { team_id: 'CE', agent_ids: ['CE-1', 'CE-2'], status: 'active' },
  ];
}

function makeCoordinator() {
  const emitter = new TelemetryEmitter({ mission_id: MISSION_ID });
  const teams = makeTeams();
  const coordinator = new SwarmCoordinator({ emitter, teams });
  return { coordinator, emitter, teams };
}

function buildCommand(
  command: string,
  target: string,
  params?: Record<string, unknown>,
): EventEnvelope {
  return createEnvelope({
    source: 'MC-1',
    destination: 'ME-1',
    type: 'COMMAND_DISPATCH',
    payload: {
      command,
      target_agent: target,
      mission_id: MISSION_ID,
      ...(params ? { parameters: params } : {}),
    },
    priority: 'normal',
    requires_ack: true,
  });
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('SwarmCoordinator constructor', () => {
  it('creates a coordinator instance', () => {
    const { coordinator } = makeCoordinator();
    expect(coordinator).toBeInstanceOf(SwarmCoordinator);
  });

  it('getRegisteredTeams() returns the registered team list', () => {
    const { coordinator } = makeCoordinator();
    const teams = coordinator.getRegisteredTeams();
    expect(teams).toHaveLength(3);
    expect(teams.map(t => t.team_id)).toEqual(['CS', 'ME', 'CE']);
  });

  it('getActiveLocks() returns an empty array initially', () => {
    const { coordinator } = makeCoordinator();
    expect(coordinator.getActiveLocks()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: LAUNCH
// ---------------------------------------------------------------------------

describe('LAUNCH command', () => {
  it('distributes to ALL registered teams', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('LAUNCH', 'broadcast'));
    expect(result.success).toBe(true);
  });

  it('returns dispatched_to with all teams', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('LAUNCH', 'broadcast'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.dispatched_to).toEqual(expect.arrayContaining(['CS', 'ME', 'CE']));
    }
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: STATUS
// ---------------------------------------------------------------------------

describe('STATUS command', () => {
  it('gathers status from all teams', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('STATUS', 'broadcast'));
    expect(result.success).toBe(true);
  });

  it('emits a TELEMETRY_UPDATE with consolidated team status', () => {
    const { coordinator, emitter } = makeCoordinator();
    emitter.clearEventLog();
    coordinator.dispatch(buildCommand('STATUS', 'broadcast'));
    const log = emitter.getEventLog();
    const telemetryEvents = log.filter(e => e.type === 'TELEMETRY_UPDATE');
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: HOLD / RESUME
// ---------------------------------------------------------------------------

describe('HOLD command', () => {
  it('suspends all active teams', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    expect(result.success).toBe(true);
  });

  it('after HOLD, isHeld() returns true', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    expect(coordinator.isHeld()).toBe(true);
  });

  it('HOLD acquires a global resource lock', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    const locks = coordinator.getActiveLocks();
    expect(locks.some(l => l.resource === 'global')).toBe(true);
  });
});

describe('RESUME command', () => {
  it('reactivates all teams', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    const result = coordinator.dispatch(buildCommand('RESUME', 'broadcast'));
    expect(result.success).toBe(true);
  });

  it('after RESUME, isHeld() returns false', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    coordinator.dispatch(buildCommand('RESUME', 'broadcast'));
    expect(coordinator.isHeld()).toBe(false);
  });

  it('RESUME releases the global lock', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    coordinator.dispatch(buildCommand('RESUME', 'broadcast'));
    const locks = coordinator.getActiveLocks();
    expect(locks.some(l => l.resource === 'global')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: ABORT
// ---------------------------------------------------------------------------

describe('ABORT command', () => {
  it('terminates all teams', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('ABORT', 'broadcast'));
    expect(result.success).toBe(true);
  });

  it('after ABORT, all teams have status terminated', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('ABORT', 'broadcast'));
    const teams = coordinator.getRegisteredTeams();
    for (const team of teams) {
      expect(team.status).toBe('terminated');
    }
  });

  it('ABORT releases all resource locks', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    coordinator.dispatch(buildCommand('ABORT', 'broadcast'));
    expect(coordinator.getActiveLocks()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: REDIRECT
// ---------------------------------------------------------------------------

describe('REDIRECT command', () => {
  it('targets only the specified team', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('REDIRECT', 'ME', { target: 'new-phase' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.dispatched_to).toEqual(['ME']);
    }
  });

  it('passes parameters to the targeted team', () => {
    const onCommand = vi.fn();
    const emitter = new TelemetryEmitter({ mission_id: MISSION_ID });
    const teams: TeamRegistration[] = [
      { team_id: 'ME', agent_ids: ['ME-1', 'ME-2', 'ME-3'], status: 'active', onCommand },
    ];
    const coordinator = new SwarmCoordinator({ emitter, teams });
    coordinator.dispatch(buildCommand('REDIRECT', 'ME', { target: 'new-phase' }));
    expect(onCommand).toHaveBeenCalledWith('REDIRECT', { target: 'new-phase' });
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: REVIEW
// ---------------------------------------------------------------------------

describe('REVIEW command', () => {
  it('triggers a review signal', () => {
    const { coordinator, emitter } = makeCoordinator();
    emitter.clearEventLog();
    const result = coordinator.dispatch(buildCommand('REVIEW', 'broadcast'));
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Command dispatch: DEBRIEF
// ---------------------------------------------------------------------------

describe('DEBRIEF command', () => {
  it('signals completion to all teams', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('DEBRIEF', 'broadcast'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.dispatched_to).toEqual(expect.arrayContaining(['CS', 'ME', 'CE']));
    }
  });
});

// ---------------------------------------------------------------------------
// Command validation
// ---------------------------------------------------------------------------

describe('command validation', () => {
  it('rejects an envelope with invalid command type', () => {
    const { coordinator } = makeCoordinator();
    const envelope = createEnvelope({
      source: 'MC-1',
      destination: 'ME-1',
      type: 'COMMAND_DISPATCH',
      payload: {
        command: 'INVALID_COMMAND',
        target_agent: 'broadcast',
      },
      priority: 'normal',
      requires_ack: true,
    });
    const result = coordinator.dispatch(envelope);
    expect(result.success).toBe(false);
  });

  it('rejects an envelope with missing command field', () => {
    const { coordinator } = makeCoordinator();
    const envelope = createEnvelope({
      source: 'MC-1',
      destination: 'ME-1',
      type: 'COMMAND_DISPATCH',
      payload: {
        target_agent: 'broadcast',
      },
      priority: 'normal',
      requires_ack: true,
    });
    const result = coordinator.dispatch(envelope);
    expect(result.success).toBe(false);
  });

  it('returns error result for invalid commands', () => {
    const { coordinator } = makeCoordinator();
    const envelope = createEnvelope({
      source: 'MC-1',
      destination: 'ME-1',
      type: 'COMMAND_DISPATCH',
      payload: {
        command: 'INVALID_COMMAND',
        target_agent: 'broadcast',
      },
      priority: 'normal',
      requires_ack: true,
    });
    const result = coordinator.dispatch(envelope);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Resource locking
// ---------------------------------------------------------------------------

describe('resource locking', () => {
  it('acquireLock returns granted: true for unlocked resource', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.acquireLock('resource-A', 'ME');
    expect(result.granted).toBe(true);
    expect(result.lock_id).toBeDefined();
  });

  it('acquireLock returns queued when resource is locked by another team', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    const result = coordinator.acquireLock('resource-A', 'CE');
    expect(result.granted).toBe(false);
    expect(result.queued).toBe(true);
    expect(result.position).toBe(1);
  });

  it('getActiveLocks shows the lock holder', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    const locks = coordinator.getActiveLocks();
    expect(locks.length).toBe(1);
    expect(locks[0].resource).toBe('resource-A');
    expect(locks[0].holder).toBe('ME');
  });

  it('releaseLock releases the lock', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    const result = coordinator.releaseLock('resource-A', 'ME');
    expect(result.released).toBe(true);
    expect(coordinator.getActiveLocks()).toEqual([]);
  });

  it('after releasing, queued request is auto-granted', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    coordinator.acquireLock('resource-A', 'CE');
    coordinator.releaseLock('resource-A', 'ME');
    const locks = coordinator.getActiveLocks();
    expect(locks.length).toBe(1);
    expect(locks[0].holder).toBe('CE');
  });

  it('different resources are independent', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    const result = coordinator.acquireLock('resource-B', 'CS');
    expect(result.granted).toBe(true);
    expect(coordinator.getActiveLocks()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Lock timeout
// ---------------------------------------------------------------------------

describe('lock timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lock with timeout is auto-released after expiry', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-C', 'ME', { timeout_ms: 100 });
    expect(coordinator.getActiveLocks()).toHaveLength(1);
    vi.advanceTimersByTime(150);
    expect(coordinator.getActiveLocks()).toHaveLength(0);
  });

  it('auto-released lock grants to next queued requester', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-C', 'ME', { timeout_ms: 100 });
    coordinator.acquireLock('resource-C', 'CE');
    vi.advanceTimersByTime(150);
    const locks = coordinator.getActiveLocks();
    expect(locks.length).toBe(1);
    expect(locks[0].holder).toBe('CE');
  });
});

// ---------------------------------------------------------------------------
// Conflict queuing
// ---------------------------------------------------------------------------

describe('conflict queuing', () => {
  it('queues multiple lock requests in order', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    coordinator.acquireLock('resource-A', 'CE');
    coordinator.acquireLock('resource-A', 'CS');
    const queue = coordinator.getLockQueue('resource-A');
    expect(queue).toHaveLength(2);
    expect(queue[0].team).toBe('CE');
    expect(queue[1].team).toBe('CS');
  });

  it('release in order: ME -> CE -> CS', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    coordinator.acquireLock('resource-A', 'CE');
    coordinator.acquireLock('resource-A', 'CS');

    // Release ME -> CE gets it
    coordinator.releaseLock('resource-A', 'ME');
    let locks = coordinator.getActiveLocks();
    expect(locks[0].holder).toBe('CE');

    // Release CE -> CS gets it
    coordinator.releaseLock('resource-A', 'CE');
    locks = coordinator.getActiveLocks();
    expect(locks[0].holder).toBe('CS');
  });

  it('getLockQueue shows the queue state', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    coordinator.acquireLock('resource-A', 'CE');
    const queue = coordinator.getLockQueue('resource-A');
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual({ team: 'CE', position: 1 });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('dispatch after ABORT returns error', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('ABORT', 'broadcast'));
    const result = coordinator.dispatch(buildCommand('STATUS', 'broadcast'));
    expect(result.success).toBe(false);
  });

  it('RESUME when not held returns error', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.dispatch(buildCommand('RESUME', 'broadcast'));
    expect(result.success).toBe(false);
  });

  it('HOLD when already held returns error', () => {
    const { coordinator } = makeCoordinator();
    coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    const result = coordinator.dispatch(buildCommand('HOLD', 'broadcast'));
    expect(result.success).toBe(false);
  });

  it('releaseLock for a resource not locked by the requester returns error', () => {
    const { coordinator } = makeCoordinator();
    coordinator.acquireLock('resource-A', 'ME');
    const result = coordinator.releaseLock('resource-A', 'CE');
    expect(result.released).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('releaseLock for a resource that does not exist returns error', () => {
    const { coordinator } = makeCoordinator();
    const result = coordinator.releaseLock('nonexistent', 'ME');
    expect(result.released).toBe(false);
    expect(result.error).toBeDefined();
  });
});
