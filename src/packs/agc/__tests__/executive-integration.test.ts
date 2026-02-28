/**
 * AGC Executive + Waitlist + BAILOUT integration tests.
 *
 * End-to-end scenarios testing the three Phase 216 subsystems working together:
 * timer-driven task dispatch feeding Executive job creation, BAILOUT preserving
 * critical jobs during overload, and the Apollo 11 1202 alarm scenario.
 */

import { describe, it, expect } from 'vitest';
import {
  JobState,
  createExecutiveState,
  novac,
  findvac,
  endofjob,
  scheduleNext,
  ALARM_1202,
} from '../executive.js';
import {
  createWaitlistState,
  addWaitlistEntry,
  advanceWaitlistTime,
  dispatchWaitlist,
  getActiveEntryCount,
} from '../waitlist.js';
import {
  RestartGroup,
  createRestartState,
  registerRestartPoint,
  bailout,
} from '../restart.js';

describe('Executive + Waitlist integration', () => {
  it('waitlist dispatch feeds into executive job creation via novac', () => {
    // Create states
    let execState = createExecutiveState();
    let waitlistState = createWaitlistState();

    // Add a Waitlist entry with 100cs delay
    const wr = addWaitlistEntry(waitlistState, 100, 0o2000);
    if (!('entryId' in wr)) throw new Error('expected entryId');
    waitlistState = wr.state;

    // Advance time past delay
    waitlistState = advanceWaitlistTime(waitlistState, 150);

    // Dispatch -> get task address
    const dispatch = dispatchWaitlist(waitlistState);
    expect(dispatch.dispatched).not.toBeNull();
    waitlistState = dispatch.state;

    // Use dispatched taskAddress to create Executive job
    const job = novac(execState, 2, dispatch.dispatched!.taskAddress);
    expect('coreSetId' in job).toBe(true);
    if ('coreSetId' in job) {
      execState = job.state;
      expect(execState.coreSets[job.coreSetId].returnAddress).toBe(0o2000);
      expect(execState.coreSets[job.coreSetId].state).toBe(JobState.DORMANT);
    }
  });

  it('multiple waitlist dispatches create multiple executive jobs with correct priority ordering', () => {
    let execState = createExecutiveState();
    let waitlistState = createWaitlistState();

    // Add entries at different times
    const w1 = addWaitlistEntry(waitlistState, 100, 0o2000);
    if (!('entryId' in w1)) throw new Error('expected entryId');
    waitlistState = w1.state;
    const w2 = addWaitlistEntry(waitlistState, 200, 0o3000);
    if (!('entryId' in w2)) throw new Error('expected entryId');
    waitlistState = w2.state;
    const w3 = addWaitlistEntry(waitlistState, 300, 0o4000);
    if (!('entryId' in w3)) throw new Error('expected entryId');
    waitlistState = w3.state;

    // Advance past all timers and dispatch all
    waitlistState = advanceWaitlistTime(waitlistState, 400);
    const d1 = dispatchWaitlist(waitlistState);
    waitlistState = d1.state;
    const d2 = dispatchWaitlist(waitlistState);
    waitlistState = d2.state;
    const d3 = dispatchWaitlist(waitlistState);
    waitlistState = d3.state;

    // Create jobs at different priorities
    const j1 = novac(execState, 3, d1.dispatched!.taskAddress);
    if (!('coreSetId' in j1)) throw new Error('expected coreSetId');
    execState = j1.state;
    const j2 = novac(execState, 1, d2.dispatched!.taskAddress);
    if (!('coreSetId' in j2)) throw new Error('expected coreSetId');
    execState = j2.state;
    const j3 = novac(execState, 5, d3.dispatched!.taskAddress);
    if (!('coreSetId' in j3)) throw new Error('expected coreSetId');
    execState = j3.state;

    // Make all RUNNABLE
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === j1.coreSetId || i === j2.coreSetId || i === j3.coreSetId
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Schedule -> should pick priority 1 (highest)
    const sched = scheduleNext(execState);
    expect(sched.coreSetId).toBe(j2.coreSetId);
  });

  it('full flow: waitlist dispatch -> novac -> scheduleNext', () => {
    let execState = createExecutiveState();
    let waitlistState = createWaitlistState();

    // Add timer task
    const wr = addWaitlistEntry(waitlistState, 50, 0o5000);
    if (!('entryId' in wr)) throw new Error('expected entryId');
    waitlistState = wr.state;

    // Time passes, T3RUPT fires
    waitlistState = advanceWaitlistTime(waitlistState, 50);
    const dispatch = dispatchWaitlist(waitlistState);
    waitlistState = dispatch.state;

    // Dispatched task creates a job
    const job = novac(execState, 0, dispatch.dispatched!.taskAddress);
    if (!('coreSetId' in job)) throw new Error('expected coreSetId');
    execState = job.state;

    // Make RUNNABLE
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === job.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // Schedule: priority 0 beats idle (priority 7)
    const sched = scheduleNext(execState);
    expect(sched.coreSetId).toBe(job.coreSetId);
    expect(sched.state.coreSets[sched.coreSetId].state).toBe(JobState.RUNNING);
  });
});

describe('Executive + BAILOUT integration', () => {
  it('7 jobs mixed priorities: BAILOUT preserves critical, discards deferrable', () => {
    let execState = createExecutiveState();
    let restartState = createRestartState();

    // Create 7 jobs
    const coreSetIds: number[] = [];
    for (let i = 1; i <= 7; i++) {
      const r = novac(execState, i, 0o2000 + i);
      if (!('coreSetId' in r)) throw new Error('expected coreSetId');
      execState = r.state;
      coreSetIds.push(r.coreSetId);
    }

    // Make all RUNNABLE
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i >= 1 ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // Register: 2 CRITICAL, 2 IMPORTANT, 3 DEFERRABLE
    restartState = registerRestartPoint(restartState, coreSetIds[0], RestartGroup.CRITICAL, 0o3001);
    restartState = registerRestartPoint(restartState, coreSetIds[1], RestartGroup.CRITICAL, 0o3002);
    restartState = registerRestartPoint(restartState, coreSetIds[2], RestartGroup.IMPORTANT, 0o3003);
    restartState = registerRestartPoint(restartState, coreSetIds[3], RestartGroup.IMPORTANT, 0o3004);
    restartState = registerRestartPoint(restartState, coreSetIds[4], RestartGroup.DEFERRABLE, 0o3005);
    restartState = registerRestartPoint(restartState, coreSetIds[5], RestartGroup.DEFERRABLE, 0o3006);
    restartState = registerRestartPoint(restartState, coreSetIds[6], RestartGroup.DEFERRABLE, 0o3007);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);

    // CRITICAL preserved (2 critical < 4, so IMPORTANT also preserved)
    expect(result.preserved).toContain(coreSetIds[0]);
    expect(result.preserved).toContain(coreSetIds[1]);
    expect(result.preserved).toContain(coreSetIds[2]);
    expect(result.preserved).toContain(coreSetIds[3]);

    // DEFERRABLE discarded
    expect(result.discarded).toContain(coreSetIds[4]);
    expect(result.discarded).toContain(coreSetIds[5]);
    expect(result.discarded).toContain(coreSetIds[6]);

    // Freed core sets should be FREE
    for (const csId of result.discarded) {
      expect(result.execState.coreSets[csId].state).toBe(JobState.FREE);
    }
  });

  it('after BAILOUT, preserved jobs have returnAddress = restart address', () => {
    let execState = createExecutiveState();
    const r = novac(execState, 1, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    execState = r.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, r.coreSetId, RestartGroup.CRITICAL, 0o6000);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.execState.coreSets[r.coreSetId].returnAddress).toBe(0o6000);
  });

  it('after BAILOUT, novac succeeds in freed core sets', () => {
    let execState = createExecutiveState();
    // Fill all core sets
    for (let i = 1; i <= 7; i++) {
      const r = novac(execState, i, 0o2000 + i);
      if (!('coreSetId' in r)) throw new Error('expected coreSetId');
      execState = r.state;
    }
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i >= 1 ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // Register only 2 as CRITICAL
    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, 1, RestartGroup.CRITICAL, 0o3000);
    restartState = registerRestartPoint(restartState, 2, RestartGroup.CRITICAL, 0o3100);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);

    // Now novac should succeed (freed core sets 3-7)
    const newJob = novac(result.execState, 2, 0o5000);
    expect('coreSetId' in newJob).toBe(true);
  });

  it('Apollo 11 1202 scenario: overload -> BAILOUT -> recovery', () => {
    let execState = createExecutiveState();
    let restartState = createRestartState();

    // Fill all core sets (overload condition)
    for (let i = 1; i <= 7; i++) {
      const r = novac(execState, i, 0o2000 + i);
      if (!('coreSetId' in r)) throw new Error('expected coreSetId');
      execState = r.state;
    }
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i >= 1 ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // Register guidance (critical) and display (deferrable)
    restartState = registerRestartPoint(restartState, 1, RestartGroup.CRITICAL, 0o4000); // guidance
    restartState = registerRestartPoint(restartState, 2, RestartGroup.CRITICAL, 0o4100); // navigation
    // 3-7 are unregistered -> treated as DEFERRABLE

    // Attempt novac -> 1202 alarm
    const overflow = novac(execState, 1, 0o6000);
    expect('alarm' in overflow).toBe(true);

    // BAILOUT triggered by 1202
    const result = bailout(restartState, execState, createWaitlistState(), ALARM_1202);
    expect(result.preserved).toHaveLength(2); // guidance + navigation
    expect(result.discarded).toHaveLength(5); // 5 deferrable

    // Now novac succeeds
    const recovery = novac(result.execState, 1, 0o6000);
    expect('coreSetId' in recovery).toBe(true);

    // Guidance still runs highest priority
    if ('coreSetId' in recovery) {
      let recExec = recovery.state;
      recExec = {
        ...recExec,
        coreSets: recExec.coreSets.map((cs, i) =>
          i === recovery.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
        ),
      };
      const sched = scheduleNext(recExec);
      // Priority 1 (guidance, core set 1) should run before new job
      expect(sched.state.coreSets[1].state).toBe(JobState.RUNNING);
    }
  });
});

describe('Waitlist + BAILOUT integration', () => {
  it('BAILOUT clears all Waitlist entries', () => {
    let waitlistState = createWaitlistState();
    for (let i = 0; i < 5; i++) {
      const r = addWaitlistEntry(waitlistState, (i + 1) * 100, 0o2000 + i);
      if (!('entryId' in r)) throw new Error('expected entryId');
      waitlistState = r.state;
    }
    expect(getActiveEntryCount(waitlistState)).toBe(5);

    const result = bailout(createRestartState(), createExecutiveState(), waitlistState, 1202);
    expect(getActiveEntryCount(result.waitlistState)).toBe(0);
  });

  it('after BAILOUT, new Waitlist entries can be added', () => {
    let waitlistState = createWaitlistState();
    for (let i = 0; i < 5; i++) {
      const r = addWaitlistEntry(waitlistState, (i + 1) * 100, 0o2000 + i);
      if (!('entryId' in r)) throw new Error('expected entryId');
      waitlistState = r.state;
    }

    const result = bailout(createRestartState(), createExecutiveState(), waitlistState, 1202);

    // Add new entries to the cleared waitlist
    const newEntry = addWaitlistEntry(result.waitlistState, 50, 0o5000);
    expect('entryId' in newEntry).toBe(true);
    if ('entryId' in newEntry) {
      expect(getActiveEntryCount(newEntry.state)).toBe(1);
    }
  });
});

describe('full three-way integration', () => {
  it('Executive + Waitlist + BAILOUT end-to-end scenario', () => {
    let execState = createExecutiveState();
    let waitlistState = createWaitlistState();
    let restartState = createRestartState();

    // Create 3 Executive jobs (priorities 1, 3, 5)
    const j1 = novac(execState, 1, 0o2000);
    if (!('coreSetId' in j1)) throw new Error('expected coreSetId');
    execState = j1.state;
    const j2 = novac(execState, 3, 0o3000);
    if (!('coreSetId' in j2)) throw new Error('expected coreSetId');
    execState = j2.state;
    const j3 = novac(execState, 5, 0o4000);
    if (!('coreSetId' in j3)) throw new Error('expected coreSetId');
    execState = j3.state;

    // Make all RUNNABLE
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === j1.coreSetId || i === j2.coreSetId || i === j3.coreSetId
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Add 2 Waitlist entries
    const w1 = addWaitlistEntry(waitlistState, 100, 0o5000);
    if (!('entryId' in w1)) throw new Error('expected entryId');
    waitlistState = w1.state;
    const w2 = addWaitlistEntry(waitlistState, 200, 0o6000);
    if (!('entryId' in w2)) throw new Error('expected entryId');
    waitlistState = w2.state;

    // Register restart points
    restartState = registerRestartPoint(restartState, j1.coreSetId, RestartGroup.CRITICAL, 0o2100);
    restartState = registerRestartPoint(restartState, j2.coreSetId, RestartGroup.IMPORTANT, 0o3100);
    restartState = registerRestartPoint(restartState, j3.coreSetId, RestartGroup.DEFERRABLE, 0o4100);

    // Advance time, dispatch one Waitlist entry -> creates 4th job
    waitlistState = advanceWaitlistTime(waitlistState, 150);
    const dispatch = dispatchWaitlist(waitlistState);
    waitlistState = dispatch.state;
    expect(dispatch.dispatched).not.toBeNull();

    const j4 = novac(execState, 4, dispatch.dispatched!.taskAddress);
    if (!('coreSetId' in j4)) throw new Error('expected coreSetId');
    execState = j4.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === j4.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // BAILOUT: priority-1 (CRITICAL) and priority-3 (IMPORTANT) preserved
    // priority-5 (DEFERRABLE) and j4 (no restart point -> DEFERRABLE) discarded
    const result = bailout(restartState, execState, waitlistState, 1202);

    expect(result.preserved).toContain(j1.coreSetId);
    expect(result.preserved).toContain(j2.coreSetId);
    expect(result.discarded).toContain(j3.coreSetId);
    expect(result.discarded).toContain(j4.coreSetId);
    expect(getActiveEntryCount(result.waitlistState)).toBe(0);

    // After BAILOUT, create a new job -> should succeed
    const j5 = novac(result.execState, 2, 0o7000);
    expect('coreSetId' in j5).toBe(true);
    if ('coreSetId' in j5) {
      let recExec = j5.state;
      recExec = {
        ...recExec,
        coreSets: recExec.coreSets.map((cs, i) =>
          i === j5.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
        ),
      };

      // Schedule -> priority-1 job (CRITICAL, core set 1) should run
      const sched = scheduleNext(recExec);
      expect(sched.coreSetId).toBe(j1.coreSetId);
    }
  });

  it('double BAILOUT: system remains consistent', () => {
    let execState = createExecutiveState();
    let restartState = createRestartState();

    // Create jobs and BAILOUT
    const j1 = novac(execState, 1, 0o2000);
    if (!('coreSetId' in j1)) throw new Error('expected coreSetId');
    execState = j1.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === j1.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };
    restartState = registerRestartPoint(restartState, j1.coreSetId, RestartGroup.CRITICAL, 0o2100);

    const b1 = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(b1.restartState.bailoutCount).toBe(1);

    // Create new jobs after BAILOUT
    const j2 = novac(b1.execState, 5, 0o3000);
    if (!('coreSetId' in j2)) throw new Error('expected coreSetId');
    let recExec = j2.state;
    recExec = {
      ...recExec,
      coreSets: recExec.coreSets.map((cs, i) =>
        i === j2.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // Second BAILOUT (j2 has no restart point -> DEFERRABLE)
    const b2 = bailout(b1.restartState, recExec, createWaitlistState(), 1201);
    expect(b2.restartState.bailoutCount).toBe(2);
    expect(b2.discarded).toContain(j2.coreSetId);
    expect(b2.preserved).toContain(j1.coreSetId); // still CRITICAL

    // System still valid
    expect(b2.execState.coreSets[0].state).not.toBe(JobState.FREE);
  });
});
