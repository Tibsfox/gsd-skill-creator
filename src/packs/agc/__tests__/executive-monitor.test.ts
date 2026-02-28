/**
 * Executive Monitor tests -- snapshot extraction, metric computation, read-only guarantees.
 *
 * Phase 218, Plan 01.
 */

import { describe, it, expect } from 'vitest';
import {
  type MonitorSnapshot,
  type CoreSetView,
  type WaitlistEntryView,
  type InterruptView,
  type CounterView,
  type RestartView,
  type MonitorMetrics,
  captureSnapshot,
  computeMetrics,
} from '../executive-monitor.js';
import { createAgcState, type AgcState } from '../cpu.js';
import {
  createExecutiveState,
  novac,
  scheduleNext,
  jobWake,
  jobSleep,
  JobState,
  CORE_SET_COUNT,
  type ExecutiveState,
} from '../executive.js';
import {
  createWaitlistState,
  addWaitlistEntry,
  advanceWaitlistTime,
  type WaitlistState,
} from '../waitlist.js';
import {
  createInterruptState,
  requestInterrupt,
  setInhibit,
  InterruptId,
} from '../interrupts.js';
import { createCounterState, CounterId } from '../counters.js';
import {
  createRestartState,
  registerRestartPoint,
  RestartGroup,
  bailout,
  type RestartState,
} from '../restart.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Create an AGC state with a given interrupt state. */
function agcWithInterrupts(agc: AgcState, pending: number, inhibited = false): AgcState {
  return {
    ...agc,
    interrupts: {
      ...agc.interrupts,
      pending,
      inhibited,
    },
  };
}

/** Make a DORMANT job RUNNABLE (simulates job activation). */
function makeRunnable(exec: ExecutiveState, coreSetId: number): ExecutiveState {
  return {
    ...exec,
    coreSets: exec.coreSets.map((cs, i) =>
      i === coreSetId && cs.state === JobState.DORMANT
        ? { ...cs, state: JobState.RUNNABLE }
        : cs,
    ),
  };
}

// ─── View Types ───────────────────────────────────────────────────────────

describe('Executive Monitor view types', () => {
  it('CoreSetView contains expected fields', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    const cs0: CoreSetView = snap.coreSets[0];
    expect(cs0).toHaveProperty('coreSetId');
    expect(cs0).toHaveProperty('jobId');
    expect(cs0).toHaveProperty('priority');
    expect(cs0).toHaveProperty('state');
    expect(cs0).toHaveProperty('hasVacArea');
    expect(cs0).toHaveProperty('restartGroup');
  });

  it('WaitlistEntryView contains expected fields', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    let wl = createWaitlistState();
    const addResult = addWaitlistEntry(wl, 100, 0o5000);
    if ('alarm' in addResult) throw new Error('unexpected alarm');
    wl = addResult.state;
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.waitlistEntries.length).toBeGreaterThan(0);
    const entry: WaitlistEntryView = snap.waitlistEntries[0];
    expect(entry).toHaveProperty('entryId');
    expect(entry).toHaveProperty('fireTime');
    expect(entry).toHaveProperty('taskAddress');
    expect(entry).toHaveProperty('timeUntilFire');
    expect(entry).toHaveProperty('active');
  });

  it('InterruptView contains expected fields', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    const iv: InterruptView = snap.interrupts;
    expect(iv).toHaveProperty('pendingBitmask');
    expect(iv).toHaveProperty('pendingList');
    expect(iv).toHaveProperty('isServicing');
    expect(iv).toHaveProperty('isInhibited');
    expect(iv).toHaveProperty('currentlyServicing');
  });

  it('CounterView contains expected fields', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    const cv: CounterView = snap.counters;
    expect(cv).toHaveProperty('values');
    expect(cv).toHaveProperty('time6Enabled');
  });

  it('RestartView contains expected fields', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    const rv: RestartView = snap.restart;
    expect(rv).toHaveProperty('registeredCount');
    expect(rv).toHaveProperty('restartPoints');
    expect(rv).toHaveProperty('bailoutCount');
    expect(rv).toHaveProperty('lastAlarmCode');
  });
});

// ─── Snapshot Capture ─────────────────────────────────────────────────────

describe('captureSnapshot', () => {
  it('returns MonitorSnapshot with timestamp', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.timestamp).toBe(0); // totalMCTs is 0 for initial state
    expect(snap.coreSets).toBeDefined();
    expect(snap.waitlistEntries).toBeDefined();
    expect(snap.interrupts).toBeDefined();
    expect(snap.counters).toBeDefined();
    expect(snap.restart).toBeDefined();
  });

  it('initial state: core set 0 RUNNING idle, sets 1-7 FREE', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.coreSets).toHaveLength(CORE_SET_COUNT);

    // Core set 0: idle job running
    expect(snap.coreSets[0].coreSetId).toBe(0);
    expect(snap.coreSets[0].state).toBe('RUNNING');
    expect(snap.coreSets[0].jobId).toBe(0);
    expect(snap.coreSets[0].priority).toBe(7);

    // Core sets 1-7: FREE
    for (let i = 1; i < CORE_SET_COUNT; i++) {
      expect(snap.coreSets[i].coreSetId).toBe(i);
      expect(snap.coreSets[i].state).toBe('FREE');
      expect(snap.coreSets[i].jobId).toBeNull();
    }
  });

  it('initial state: empty waitlist entries', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.waitlistEntries).toHaveLength(0);
  });

  it('initial state: no pending interrupts', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.interrupts.pendingBitmask).toBe(0);
    expect(snap.interrupts.pendingList).toHaveLength(0);
    expect(snap.interrupts.isServicing).toBe(false);
    expect(snap.interrupts.isInhibited).toBe(false);
  });

  it('initial state: all counters at zero', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    for (const id of Object.values(CounterId)) {
      expect(snap.counters.values[id]).toBe(0);
    }
    expect(snap.counters.time6Enabled).toBe(false);
  });

  it('initial state: no restart points', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.restart.registeredCount).toBe(0);
    expect(snap.restart.restartPoints).toHaveLength(0);
    expect(snap.restart.bailoutCount).toBe(0);
    expect(snap.restart.lastAlarmCode).toBeNull();
  });

  it('snapshot after 3 novac jobs: shows 3 DORMANT/RUNNABLE core sets', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    // Create 3 jobs with priorities 1, 3, 5
    const r1 = novac(exec, 1, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected alarm');
    exec = r1.state;

    const r2 = novac(exec, 3, 0o4200);
    if ('alarm' in r2) throw new Error('unexpected alarm');
    exec = r2.state;

    const r3 = novac(exec, 5, 0o4300);
    if ('alarm' in r3) throw new Error('unexpected alarm');
    exec = r3.state;

    // Schedule to set highest priority as RUNNING
    const sched = scheduleNext(exec);
    exec = sched.state;

    const snap = captureSnapshot(agc, exec, wl, rs);

    // Count non-FREE core sets: idle (set 0) + 3 jobs = 4
    const nonFree = snap.coreSets.filter(cs => cs.state !== 'FREE');
    expect(nonFree.length).toBe(4); // idle + 3 jobs

    // Verify priorities are present
    const priorities = nonFree.map(cs => cs.priority).sort();
    expect(priorities).toContain(1);
    expect(priorities).toContain(3);
    expect(priorities).toContain(5);

    // 4 free sets
    const freeSets = snap.coreSets.filter(cs => cs.state === 'FREE');
    expect(freeSets.length).toBe(4);
  });

  it('snapshot with 2 Waitlist entries: shows correct timeUntilFire', () => {
    let agc = createAgcState();
    const exec = createExecutiveState();
    let wl = createWaitlistState();
    const rs = createRestartState();

    // Set current time to 50cs
    wl = advanceWaitlistTime(wl, 50);

    // Add 2 entries: delays 100cs and 200cs (fireTimes: 150 and 250)
    const a1 = addWaitlistEntry(wl, 100, 0o5000);
    if ('alarm' in a1) throw new Error('unexpected alarm');
    wl = a1.state;

    const a2 = addWaitlistEntry(wl, 200, 0o5100);
    if ('alarm' in a2) throw new Error('unexpected alarm');
    wl = a2.state;

    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.waitlistEntries).toHaveLength(2);

    // Both should be active
    expect(snap.waitlistEntries[0].active).toBe(true);
    expect(snap.waitlistEntries[1].active).toBe(true);

    // Time until fire: fireTime - currentTime
    // Entry 1: fireTime=150, currentTime=50, timeUntilFire=100
    // Entry 2: fireTime=250, currentTime=50, timeUntilFire=200
    const times = snap.waitlistEntries.map(e => e.timeUntilFire).sort((a, b) => a - b);
    expect(times).toEqual([100, 200]);
  });

  it('snapshot with pending T3RUPT: pendingList contains T3RUPT', () => {
    let agc = createAgcState();
    agc = agcWithInterrupts(agc, 1 << (InterruptId.T3RUPT - 1)); // bit 3
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.interrupts.pendingBitmask).toBe(1 << (InterruptId.T3RUPT - 1));
    expect(snap.interrupts.pendingList).toContain(InterruptId.T3RUPT);
  });

  it('snapshot with T3RUPT + T6RUPT: pendingList ordered by priority (T6RUPT first)', () => {
    let agc = createAgcState();
    // T6RUPT=2 (bit 1), T3RUPT=4 (bit 3) -- T6RUPT has lower InterruptId = higher priority
    const pendingBits = (1 << (InterruptId.T6RUPT - 1)) | (1 << (InterruptId.T3RUPT - 1));
    agc = agcWithInterrupts(agc, pendingBits);
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.interrupts.pendingList[0]).toBe(InterruptId.T6RUPT);
    expect(snap.interrupts.pendingList[1]).toBe(InterruptId.T3RUPT);
  });

  it('snapshot with interrupts inhibited: isInhibited=true', () => {
    let agc = createAgcState();
    // Set pending + inhibited
    const pendingBits = 1 << (InterruptId.T3RUPT - 1);
    agc = agcWithInterrupts(agc, pendingBits, true);
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.interrupts.isInhibited).toBe(true);
    expect(snap.interrupts.pendingList).toHaveLength(1);
  });

  it('snapshot with restart points: restartPoints array matches registrations', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    const wl = createWaitlistState();
    let rs = createRestartState();

    // Create 2 jobs
    const r1 = novac(exec, 1, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected alarm');
    exec = r1.state;
    const csId1 = r1.coreSetId;

    const r2 = novac(exec, 3, 0o4200);
    if ('alarm' in r2) throw new Error('unexpected alarm');
    exec = r2.state;
    const csId2 = r2.coreSetId;

    // Register restart points
    rs = registerRestartPoint(rs, csId1, RestartGroup.CRITICAL, 0o4100);
    rs = registerRestartPoint(rs, csId2, RestartGroup.IMPORTANT, 0o4200);

    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(snap.restart.registeredCount).toBe(2);
    expect(snap.restart.restartPoints).toHaveLength(2);

    // Verify restart group shows on core set views
    const cs1View = snap.coreSets[csId1];
    expect(cs1View.restartGroup).toBe('CRITICAL');

    const cs2View = snap.coreSets[csId2];
    expect(cs2View.restartGroup).toBe('IMPORTANT');
  });

  it('snapshot after BAILOUT: bailoutCount=1, discarded sets FREE', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    const wl = createWaitlistState();
    let rs = createRestartState();

    // Create jobs: 1 CRITICAL, 1 DEFERRABLE
    const r1 = novac(exec, 1, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected alarm');
    exec = r1.state;
    rs = registerRestartPoint(rs, r1.coreSetId, RestartGroup.CRITICAL, 0o4100);

    const r2 = novac(exec, 5, 0o4500);
    if ('alarm' in r2) throw new Error('unexpected alarm');
    exec = r2.state;
    rs = registerRestartPoint(rs, r2.coreSetId, RestartGroup.DEFERRABLE, 0o4500);

    // BAILOUT
    const bailoutResult = bailout(rs, exec, wl, 1202);
    exec = bailoutResult.execState;
    rs = bailoutResult.restartState;

    const snap = captureSnapshot(agc, exec, bailoutResult.waitlistState, rs);

    expect(snap.restart.bailoutCount).toBe(1);
    expect(snap.restart.lastAlarmCode).toBe(1202);

    // Discarded core set should be FREE
    const cs2View = snap.coreSets[r2.coreSetId];
    expect(cs2View.state).toBe('FREE');

    // Preserved core set should be RUNNABLE
    const cs1View = snap.coreSets[r1.coreSetId];
    expect(cs1View.state).toBe('RUNNABLE');
  });
});

// ─── Derived Metrics ──────────────────────────────────────────────────────

describe('computeMetrics', () => {
  it('returns MonitorMetrics with correct fields', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);
    const metrics = computeMetrics(snap);

    expect(metrics).toHaveProperty('coreSetUtilization');
    expect(metrics).toHaveProperty('highestActivePriority');
    expect(metrics).toHaveProperty('nextWaitlistFireTime');
    expect(metrics).toHaveProperty('pendingInterruptCount');
    expect(metrics).toHaveProperty('totalJobs');
    expect(metrics).toHaveProperty('sleepingJobs');
    expect(metrics).toHaveProperty('activeWaitlistEntries');
  });

  it('initial state: utilization=1/8, no active priority, no jobs', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);
    const metrics = computeMetrics(snap);

    // Only idle job (core set 0) is non-FREE
    expect(metrics.coreSetUtilization).toBeCloseTo(1 / CORE_SET_COUNT);
    expect(metrics.highestActivePriority).toBeNull(); // idle excluded
    expect(metrics.nextWaitlistFireTime).toBeNull();
    expect(metrics.pendingInterruptCount).toBe(0);
    expect(metrics.totalJobs).toBe(0); // excludes idle
    expect(metrics.sleepingJobs).toBe(0);
    expect(metrics.activeWaitlistEntries).toBe(0);
  });

  it('3 jobs + 2 waitlist: utilization=4/8, priority=1', () => {
    const agc = createAgcState();
    let exec = createExecutiveState();
    let wl = createWaitlistState();
    const rs = createRestartState();

    // Create 3 jobs with priorities 1, 3, 5
    const r1 = novac(exec, 1, 0o4100);
    if ('alarm' in r1) throw new Error('unexpected alarm');
    exec = r1.state;

    const r2 = novac(exec, 3, 0o4200);
    if ('alarm' in r2) throw new Error('unexpected alarm');
    exec = r2.state;

    const r3 = novac(exec, 5, 0o4300);
    if ('alarm' in r3) throw new Error('unexpected alarm');
    exec = r3.state;

    // Activate jobs (DORMANT -> RUNNABLE) then schedule
    exec = makeRunnable(exec, r1.coreSetId);
    exec = makeRunnable(exec, r2.coreSetId);
    exec = makeRunnable(exec, r3.coreSetId);

    // Schedule to make highest priority RUNNING
    const sched = scheduleNext(exec);
    exec = sched.state;

    // Add 2 waitlist entries
    const a1 = addWaitlistEntry(wl, 100, 0o5000);
    if ('alarm' in a1) throw new Error('unexpected alarm');
    wl = a1.state;

    const a2 = addWaitlistEntry(wl, 200, 0o5100);
    if ('alarm' in a2) throw new Error('unexpected alarm');
    wl = a2.state;

    const snap = captureSnapshot(agc, exec, wl, rs);
    const metrics = computeMetrics(snap);

    // 4 non-FREE (idle + 3 jobs)
    expect(metrics.coreSetUtilization).toBeCloseTo(4 / CORE_SET_COUNT);
    expect(metrics.highestActivePriority).toBe(1);
    expect(metrics.nextWaitlistFireTime).toBe(100); // first entry's fireTime
    expect(metrics.totalJobs).toBe(3);
    expect(metrics.activeWaitlistEntries).toBe(2);
  });
});

// ─── Read-only Guarantees ─────────────────────────────────────────────────

describe('read-only guarantees', () => {
  it('snapshot is frozen', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(Object.isFrozen(snap)).toBe(true);
  });

  it('coreSets array is frozen', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    expect(Object.isFrozen(snap.coreSets)).toBe(true);
  });

  it('each core set view is frozen', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    for (const cs of snap.coreSets) {
      expect(Object.isFrozen(cs)).toBe(true);
    }
  });

  it('modifying snapshot has no effect on original AGC state', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();
    const snap = captureSnapshot(agc, exec, wl, rs);

    // Attempt to modify the snapshot (should throw in strict mode or be no-op)
    expect(() => {
      (snap as any).timestamp = 999;
    }).toThrow();

    // Original AGC timing is unchanged
    expect(agc.timing.totalMCTs).toBe(0);
  });

  it('two snapshots from same state are equal but separate objects', () => {
    const agc = createAgcState();
    const exec = createExecutiveState();
    const wl = createWaitlistState();
    const rs = createRestartState();

    const snap1 = captureSnapshot(agc, exec, wl, rs);
    const snap2 = captureSnapshot(agc, exec, wl, rs);

    // Separate objects
    expect(snap1).not.toBe(snap2);

    // But equal in content
    expect(snap1.timestamp).toBe(snap2.timestamp);
    expect(snap1.coreSets.length).toBe(snap2.coreSets.length);
    for (let i = 0; i < snap1.coreSets.length; i++) {
      expect(snap1.coreSets[i]).not.toBe(snap2.coreSets[i]);
      expect(snap1.coreSets[i].state).toBe(snap2.coreSets[i].state);
      expect(snap1.coreSets[i].priority).toBe(snap2.coreSets[i].priority);
    }
  });
});
