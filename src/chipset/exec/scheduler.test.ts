/**
 * Tests for the prioritized round-robin scheduler.
 *
 * Validates priority ordering (higher runs first), round-robin fairness
 * for equal-priority teams, sleep/wake lifecycle, yield behavior,
 * dynamic add/remove, and state introspection.
 */

import { describe, it, expect } from 'vitest';
import { ExecScheduler } from './scheduler.js';
import type { SchedulerEntry, TeamState } from './scheduler.js';

// ============================================================================
// SchedulerEntry type shape
// ============================================================================

describe('SchedulerEntry', () => {
  it('has required fields: name, priority, state', () => {
    const entry: SchedulerEntry = {
      name: 'agnus',
      priority: 60,
      state: 'ready',
    };
    expect(entry.name).toBe('agnus');
    expect(entry.priority).toBe(60);
    expect(entry.state).toBe('ready');
  });
});

// ============================================================================
// ExecScheduler -- priority ordering
// ============================================================================

describe('ExecScheduler -- priority ordering', () => {
  it('single team schedules to itself', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    expect(scheduler.schedule()).toEqual(['agnus']);
  });

  it('higher priority runs first', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.add('denise', 15);
    scheduler.add('paula', 15);
    scheduler.add('gary', 10);

    const result = scheduler.schedule();
    // agnus must be first (highest priority)
    expect(result[0]).toBe('agnus');
    // gary must be last (lowest priority)
    expect(result[result.length - 1]).toBe('gary');
    // all four teams present
    expect(result).toHaveLength(4);
  });

  it('equal priorities share via round-robin', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('denise', 15);
    scheduler.add('paula', 15);

    const first = scheduler.schedule();
    expect(first).toHaveLength(2);

    // Note the initial order
    const firstLeader = first[0];
    const secondLeader = first[1];

    // Second schedule: round-robin rotates, so the OTHER one leads
    const second = scheduler.schedule();
    expect(second[0]).toBe(secondLeader);
    expect(second[1]).toBe(firstLeader);

    // Third schedule: back to original order
    const third = scheduler.schedule();
    expect(third[0]).toBe(firstLeader);
    expect(third[1]).toBe(secondLeader);
  });

  it('priority always beats round-robin', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.add('denise', 15);
    scheduler.add('paula', 15);

    // agnus always first regardless of round-robin rotation
    const first = scheduler.schedule();
    expect(first[0]).toBe('agnus');
    expect(first).toHaveLength(3);

    const second = scheduler.schedule();
    expect(second[0]).toBe('agnus');
    expect(second).toHaveLength(3);

    // denise and paula rotate in positions 2 and 3
    expect(first[1]).not.toBe(second[1]);
    expect(first[2]).not.toBe(second[2]);
  });
});

// ============================================================================
// ExecScheduler -- sleeping teams
// ============================================================================

describe('ExecScheduler -- sleeping teams', () => {
  it('sleeping team is excluded from schedule', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.add('denise', 15);
    scheduler.sleep('denise');

    expect(scheduler.schedule()).toEqual(['agnus']);
  });

  it('wake brings team back into schedule', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.add('denise', 15);
    scheduler.sleep('denise');

    expect(scheduler.schedule()).toEqual(['agnus']);

    scheduler.wake('denise');
    const result = scheduler.schedule();
    expect(result).toContain('agnus');
    expect(result).toContain('denise');
    expect(result).toHaveLength(2);
  });

  it('all teams sleeping returns empty schedule', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.sleep('agnus');

    expect(scheduler.schedule()).toEqual([]);
  });

  it('sleep is idempotent (sleeping already-sleeping team is no-op)', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.sleep('agnus');
    scheduler.sleep('agnus'); // second sleep -- no error

    expect(scheduler.getState('agnus')).toBe('sleeping');

    // Wake once brings it back
    scheduler.wake('agnus');
    expect(scheduler.getState('agnus')).toBe('ready');
  });

  it('wake is idempotent (waking ready team is no-op)', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);

    // Already ready, wake should be no-op
    scheduler.wake('agnus');
    expect(scheduler.getState('agnus')).toBe('ready');
  });
});

// ============================================================================
// ExecScheduler -- yield
// ============================================================================

describe('ExecScheduler -- yield', () => {
  it('yield moves team to end of its priority group', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('denise', 15);
    scheduler.add('paula', 15);

    const first = scheduler.schedule();
    const leader = first[0];

    // Yield the leader
    scheduler.yield(leader);

    // Next schedule: the OTHER team should be first
    const after = scheduler.schedule();
    expect(after[0]).not.toBe(leader);
  });

  it('yield on single team in priority group is no-op', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);

    scheduler.yield('agnus');
    expect(scheduler.schedule()).toEqual(['agnus']);
  });
});

// ============================================================================
// ExecScheduler -- dynamic add/remove
// ============================================================================

describe('ExecScheduler -- dynamic add/remove', () => {
  it('add team during operation', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    expect(scheduler.schedule()).toEqual(['agnus']);

    scheduler.add('denise', 15);
    const result = scheduler.schedule();
    expect(result).toContain('agnus');
    expect(result).toContain('denise');
    expect(result).toHaveLength(2);
  });

  it('remove team during operation', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.add('denise', 15);

    scheduler.remove('denise');
    expect(scheduler.schedule()).toEqual(['agnus']);
  });

  it('remove non-existent team throws', () => {
    const scheduler = new ExecScheduler();
    expect(() => scheduler.remove('nonexistent')).toThrow();
  });

  it('add duplicate team throws', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    expect(() => scheduler.add('agnus', 60)).toThrow();
  });
});

// ============================================================================
// ExecScheduler -- getState and entries
// ============================================================================

describe('ExecScheduler -- getState and entries', () => {
  it('getState returns current state of a team', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);

    expect(scheduler.getState('agnus')).toBe('ready');

    scheduler.sleep('agnus');
    expect(scheduler.getState('agnus')).toBe('sleeping');

    scheduler.wake('agnus');
    expect(scheduler.getState('agnus')).toBe('ready');
  });

  it('entries() returns all scheduler entries', () => {
    const scheduler = new ExecScheduler();
    scheduler.add('agnus', 60);
    scheduler.add('denise', 15);

    const entries = scheduler.entries();
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('priority');
      expect(entry).toHaveProperty('state');
    }
  });

  it('empty scheduler returns empty schedule', () => {
    const scheduler = new ExecScheduler();
    expect(scheduler.schedule()).toEqual([]);
  });
});
