/**
 * AGC Waitlist timer-driven task scheduler tests.
 *
 * Covers: entry management, timing integration, chronological dispatch,
 * cancellation, overflow alarm 1203, edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  createWaitlistState,
  addWaitlistEntry,
  advanceWaitlistTime,
  dispatchWaitlist,
  cancelWaitlistEntry,
  getNextFireTime,
  getActiveEntryCount,
  MAX_WAITLIST_ENTRIES,
  ALARM_1203,
} from '../waitlist.js';

describe('waitlist entry management', () => {
  it('createWaitlistState returns empty waitlist with 0 entries', () => {
    const state = createWaitlistState();
    expect(getActiveEntryCount(state)).toBe(0);
    expect(getNextFireTime(state)).toBeNull();
  });

  it('addWaitlistEntry creates entry with delay and task address', () => {
    const state = createWaitlistState();
    const result = addWaitlistEntry(state, 100, 0o2000);
    expect('entryId' in result).toBe(true);
    if ('entryId' in result) {
      expect(result.entryId).toBeGreaterThan(0);
      expect(getActiveEntryCount(result.state)).toBe(1);
    }
  });

  it('entries store entryId, delay, fireTime, taskAddress, active', () => {
    const state = createWaitlistState();
    const result = addWaitlistEntry(state, 50, 0o3000);
    if ('entryId' in result) {
      const entry = result.state.entries.find((e) => e.entryId === result.entryId);
      expect(entry).toBeDefined();
      expect(entry!.delay).toBe(50);
      expect(entry!.fireTime).toBe(50); // currentTime=0 + delay=50
      expect(entry!.taskAddress).toBe(0o3000);
      expect(entry!.active).toBe(true);
    }
  });

  it('maintains chronological order by fireTime (earliest first)', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 300, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 100, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    const r3 = addWaitlistEntry(state, 200, 0o4000);
    if (!('entryId' in r3)) throw new Error('expected entryId');
    state = r3.state;
    // Active entries should be sorted by fireTime
    const active = state.entries.filter((e) => e.active);
    expect(active[0].fireTime).toBe(100);
    expect(active[1].fireTime).toBe(200);
    expect(active[2].fireTime).toBe(300);
  });

  it('triggers 1203 alarm when 9 active entries exist', () => {
    let state = createWaitlistState();
    for (let i = 0; i < MAX_WAITLIST_ENTRIES; i++) {
      const result = addWaitlistEntry(state, (i + 1) * 10, 0o2000 + i);
      if (!('entryId' in result)) throw new Error('expected entryId');
      state = result.state;
    }
    expect(getActiveEntryCount(state)).toBe(9);
    const overflow = addWaitlistEntry(state, 100, 0o5000);
    expect('alarm' in overflow).toBe(true);
    if ('alarm' in overflow) {
      expect(overflow.alarm).toBe(ALARM_1203);
    }
  });

  it('entries with same fireTime ordered by insertion order (FIFO)', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 100, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    const active = state.entries.filter((e) => e.active);
    expect(active[0].entryId).toBe(r1.entryId);
    expect(active[1].entryId).toBe(r2.entryId);
  });
});

describe('timing integration', () => {
  it('getNextFireTime returns earliest pending entry fireTime', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 200, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 100, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    expect(getNextFireTime(state)).toBe(100);
  });

  it('getNextFireTime returns null when empty', () => {
    expect(getNextFireTime(createWaitlistState())).toBeNull();
  });

  it('advanceWaitlistTime updates currentTime', () => {
    let state = createWaitlistState();
    state = advanceWaitlistTime(state, 500);
    expect(state.currentTime).toBe(500);
  });

  it('entries with fireTime <= currentTime are ready for dispatch', () => {
    let state = createWaitlistState();
    const r = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r)) throw new Error('expected entryId');
    state = r.state;
    state = advanceWaitlistTime(state, 150);
    const result = dispatchWaitlist(state);
    expect(result.dispatched).not.toBeNull();
  });
});

describe('dispatch', () => {
  it('dispatches the earliest expired entry', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 200, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    state = advanceWaitlistTime(state, 250);
    const result = dispatchWaitlist(state);
    expect(result.dispatched).not.toBeNull();
    expect(result.dispatched!.taskAddress).toBe(0o2000);
    expect(result.dispatched!.entryId).toBe(r1.entryId);
  });

  it('dispatches only ONE entry per call', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 200, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    state = advanceWaitlistTime(state, 300);
    // First dispatch -> entry at 100
    const d1 = dispatchWaitlist(state);
    expect(d1.dispatched!.taskAddress).toBe(0o2000);
    // Second dispatch -> entry at 200
    const d2 = dispatchWaitlist(d1.state);
    expect(d2.dispatched!.taskAddress).toBe(0o3000);
  });

  it('returns null when no entries are ready', () => {
    let state = createWaitlistState();
    const r = addWaitlistEntry(state, 500, 0o2000);
    if (!('entryId' in r)) throw new Error('expected entryId');
    state = r.state;
    state = advanceWaitlistTime(state, 100); // not yet
    const result = dispatchWaitlist(state);
    expect(result.dispatched).toBeNull();
  });

  it('after dispatch, getNextFireTime returns next pending entry time', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 200, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    state = advanceWaitlistTime(state, 150);
    const result = dispatchWaitlist(state);
    expect(getNextFireTime(result.state)).toBe(200);
  });

  it('sequential dispatch: add 3 entries, dispatch in time order', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 200, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    const r3 = addWaitlistEntry(state, 300, 0o4000);
    if (!('entryId' in r3)) throw new Error('expected entryId');
    state = r3.state;

    // Advance to 150 -> dispatches entry at 100
    state = advanceWaitlistTime(state, 150);
    let d = dispatchWaitlist(state);
    expect(d.dispatched!.taskAddress).toBe(0o2000);
    state = d.state;

    // Advance to 250 -> dispatches entry at 200
    state = advanceWaitlistTime(state, 250);
    d = dispatchWaitlist(state);
    expect(d.dispatched!.taskAddress).toBe(0o3000);
    state = d.state;

    // Advance to 350 -> dispatches entry at 300
    state = advanceWaitlistTime(state, 350);
    d = dispatchWaitlist(state);
    expect(d.dispatched!.taskAddress).toBe(0o4000);
    state = d.state;

    // No more entries
    d = dispatchWaitlist(state);
    expect(d.dispatched).toBeNull();
  });
});

describe('cancellation', () => {
  it('cancelWaitlistEntry marks entry inactive', () => {
    let state = createWaitlistState();
    const r = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r)) throw new Error('expected entryId');
    state = r.state;
    state = cancelWaitlistEntry(state, r.entryId);
    expect(getActiveEntryCount(state)).toBe(0);
  });

  it('cancelling non-existent entry is a no-op', () => {
    const state = createWaitlistState();
    const cancelled = cancelWaitlistEntry(state, 999);
    expect(cancelled).toEqual(state);
  });

  it('after cancellation, entry count decreases and new entries can be added', () => {
    let state = createWaitlistState();
    // Fill to MAX
    const ids: number[] = [];
    for (let i = 0; i < MAX_WAITLIST_ENTRIES; i++) {
      const r = addWaitlistEntry(state, (i + 1) * 10, 0o2000 + i);
      if (!('entryId' in r)) throw new Error('expected entryId');
      ids.push(r.entryId);
      state = r.state;
    }
    expect(getActiveEntryCount(state)).toBe(MAX_WAITLIST_ENTRIES);

    // Cancel one
    state = cancelWaitlistEntry(state, ids[0]);
    expect(getActiveEntryCount(state)).toBe(MAX_WAITLIST_ENTRIES - 1);

    // Now we can add another
    const result = addWaitlistEntry(state, 500, 0o5000);
    expect('entryId' in result).toBe(true);
  });

  it('cancelled entry is not dispatched', () => {
    let state = createWaitlistState();
    const r = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r)) throw new Error('expected entryId');
    state = r.state;
    state = cancelWaitlistEntry(state, r.entryId);
    state = advanceWaitlistTime(state, 200);
    const result = dispatchWaitlist(state);
    expect(result.dispatched).toBeNull();
  });
});

describe('edge cases', () => {
  it('dispatching from empty waitlist returns null', () => {
    const result = dispatchWaitlist(createWaitlistState());
    expect(result.dispatched).toBeNull();
  });

  it('entry with delay 0 fires immediately', () => {
    let state = createWaitlistState();
    const r = addWaitlistEntry(state, 0, 0o2000);
    if (!('entryId' in r)) throw new Error('expected entryId');
    state = r.state;
    // currentTime = 0, fireTime = 0 + 0 = 0, should dispatch immediately
    const result = dispatchWaitlist(state);
    expect(result.dispatched).not.toBeNull();
    expect(result.dispatched!.taskAddress).toBe(0o2000);
  });

  it('multiple entries at same fireTime dispatch in insertion order', () => {
    let state = createWaitlistState();
    const r1 = addWaitlistEntry(state, 100, 0o2000);
    if (!('entryId' in r1)) throw new Error('expected entryId');
    state = r1.state;
    const r2 = addWaitlistEntry(state, 100, 0o3000);
    if (!('entryId' in r2)) throw new Error('expected entryId');
    state = r2.state;
    const r3 = addWaitlistEntry(state, 100, 0o4000);
    if (!('entryId' in r3)) throw new Error('expected entryId');
    state = r3.state;

    state = advanceWaitlistTime(state, 100);
    let d = dispatchWaitlist(state);
    expect(d.dispatched!.taskAddress).toBe(0o2000);
    d = dispatchWaitlist(d.state);
    expect(d.dispatched!.taskAddress).toBe(0o3000);
    d = dispatchWaitlist(d.state);
    expect(d.dispatched!.taskAddress).toBe(0o4000);
  });
});

describe('constants', () => {
  it('MAX_WAITLIST_ENTRIES is 9', () => {
    expect(MAX_WAITLIST_ENTRIES).toBe(9);
  });

  it('ALARM_1203 is 1203', () => {
    expect(ALARM_1203).toBe(1203);
  });
});
