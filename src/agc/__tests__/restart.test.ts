/**
 * AGC BAILOUT restart protection tests.
 *
 * Covers: restart groups, restart point registration, BAILOUT mechanism
 * (job classification, preservation/discard), alarm triggers, state
 * preservation, edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  RestartGroup,
  RESTART_GROUP,
  createRestartState,
  registerRestartPoint,
  getRestartGroup,
  getRestartTable,
  bailout,
} from '../restart.js';
import {
  JobState,
  createExecutiveState,
  novac,
  findvac,
} from '../executive.js';
import { createWaitlistState, addWaitlistEntry, getActiveEntryCount } from '../waitlist.js';

describe('restart groups and registration', () => {
  it('createRestartState returns empty state', () => {
    const state = createRestartState();
    expect(state.restartPoints.size).toBe(0);
    expect(state.lastAlarmCode).toBeNull();
    expect(state.bailoutCount).toBe(0);
  });

  it('registerRestartPoint adds a restart point for a core set', () => {
    let state = createRestartState();
    state = registerRestartPoint(state, 1, RestartGroup.CRITICAL, 0o2000);
    expect(state.restartPoints.size).toBe(1);
    const point = state.restartPoints.get(1);
    expect(point).toBeDefined();
    expect(point!.group).toBe(RestartGroup.CRITICAL);
    expect(point!.restartAddress).toBe(0o2000);
  });

  it('restart groups: CRITICAL=0, IMPORTANT=1, DEFERRABLE=2', () => {
    expect(RestartGroup.CRITICAL).toBe(0);
    expect(RestartGroup.IMPORTANT).toBe(1);
    expect(RestartGroup.DEFERRABLE).toBe(2);
    expect(RESTART_GROUP.CRITICAL).toBe(0);
    expect(RESTART_GROUP.IMPORTANT).toBe(1);
    expect(RESTART_GROUP.DEFERRABLE).toBe(2);
  });

  it('latest registration wins for same core set', () => {
    let state = createRestartState();
    state = registerRestartPoint(state, 1, RestartGroup.CRITICAL, 0o2000);
    state = registerRestartPoint(state, 1, RestartGroup.IMPORTANT, 0o3000);
    const point = state.restartPoints.get(1);
    expect(point!.group).toBe(RestartGroup.IMPORTANT);
    expect(point!.restartAddress).toBe(0o3000);
  });

  it('getRestartGroup returns group for registered core set', () => {
    let state = createRestartState();
    state = registerRestartPoint(state, 2, RestartGroup.DEFERRABLE, 0o4000);
    expect(getRestartGroup(state, 2)).toBe(RestartGroup.DEFERRABLE);
  });

  it('getRestartGroup returns null for unregistered core set', () => {
    const state = createRestartState();
    expect(getRestartGroup(state, 5)).toBeNull();
  });
});

describe('BAILOUT mechanism', () => {
  it('preserves CRITICAL jobs and discards DEFERRABLE jobs', () => {
    // Create executive with jobs
    let execState = createExecutiveState();
    const r1 = novac(execState, 1, 0o2000); // critical
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    execState = r1.state;
    const r2 = novac(execState, 5, 0o3000); // deferrable
    if (!('coreSetId' in r2)) throw new Error('expected coreSetId');
    execState = r2.state;

    // Make both RUNNABLE
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r1.coreSetId || i === r2.coreSetId
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    // Register restart points
    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, r1.coreSetId, RestartGroup.CRITICAL, 0o2100);
    restartState = registerRestartPoint(restartState, r2.coreSetId, RestartGroup.DEFERRABLE, 0o3100);

    const waitlistState = createWaitlistState();
    const result = bailout(restartState, execState, waitlistState, 1202);

    expect(result.preserved).toContain(r1.coreSetId);
    expect(result.discarded).toContain(r2.coreSetId);
    // Critical job's core set should still be allocated
    expect(result.execState.coreSets[r1.coreSetId].state).not.toBe(JobState.FREE);
    // Deferrable job's core set should be freed
    expect(result.execState.coreSets[r2.coreSetId].state).toBe(JobState.FREE);
  });

  it('preserves IMPORTANT jobs when fewer than 4 CRITICAL core sets used', () => {
    let execState = createExecutiveState();
    const rCrit = novac(execState, 1, 0o2000);
    if (!('coreSetId' in rCrit)) throw new Error('expected coreSetId');
    execState = rCrit.state;
    const rImp = novac(execState, 3, 0o3000);
    if (!('coreSetId' in rImp)) throw new Error('expected coreSetId');
    execState = rImp.state;

    // Make RUNNABLE
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === rCrit.coreSetId || i === rImp.coreSetId
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };

    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, rCrit.coreSetId, RestartGroup.CRITICAL, 0o2100);
    restartState = registerRestartPoint(restartState, rImp.coreSetId, RestartGroup.IMPORTANT, 0o3100);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.preserved).toContain(rCrit.coreSetId);
    expect(result.preserved).toContain(rImp.coreSetId);
  });

  it('jobs with no restart point are treated as DEFERRABLE', () => {
    let execState = createExecutiveState();
    const r = novac(execState, 3, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    execState = r.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    // No restart point registered
    const restartState = createRestartState();
    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.discarded).toContain(r.coreSetId);
  });

  it('idle job (core set 0) is always preserved', () => {
    const execState = createExecutiveState();
    const restartState = createRestartState();
    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.execState.coreSets[0].state).not.toBe(JobState.FREE);
    expect(result.discarded).not.toContain(0);
  });

  it('clears the entire Waitlist', () => {
    let waitlistState = createWaitlistState();
    for (let i = 0; i < 5; i++) {
      const r = addWaitlistEntry(waitlistState, (i + 1) * 10, 0o2000 + i);
      if (!('entryId' in r)) throw new Error('expected entryId');
      waitlistState = r.state;
    }
    expect(getActiveEntryCount(waitlistState)).toBe(5);

    const result = bailout(createRestartState(), createExecutiveState(), waitlistState, 1202);
    expect(getActiveEntryCount(result.waitlistState)).toBe(0);
  });

  it('sets preserved jobs to RUNNABLE state', () => {
    let execState = createExecutiveState();
    const r = novac(execState, 1, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    execState = r.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.SLEEPING } : cs,
      ),
    };

    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, r.coreSetId, RestartGroup.CRITICAL, 0o2100);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.execState.coreSets[r.coreSetId].state).toBe(JobState.RUNNABLE);
  });

  it('sets preserved jobs returnAddress to restart address', () => {
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
    restartState = registerRestartPoint(restartState, r.coreSetId, RestartGroup.CRITICAL, 0o2100);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.execState.coreSets[r.coreSetId].returnAddress).toBe(0o2100);
  });

  it('releases VAC areas from discarded jobs', () => {
    let execState = createExecutiveState();
    const r = findvac(execState, 5, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    execState = r.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, r.coreSetId, RestartGroup.DEFERRABLE, 0o2100);

    const vacFreesBefore = execState.vacPool.filter((v) => v).length;
    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    const vacFreesAfter = result.execState.vacPool.filter((v) => v).length;
    expect(vacFreesAfter).toBe(vacFreesBefore + 1);
  });
});

describe('BAILOUT triggers', () => {
  it('records alarm code', () => {
    const result = bailout(createRestartState(), createExecutiveState(), createWaitlistState(), 1202);
    expect(result.restartState.lastAlarmCode).toBe(1202);
  });

  it('increments bailout count', () => {
    const r1 = bailout(createRestartState(), createExecutiveState(), createWaitlistState(), 1202);
    expect(r1.restartState.bailoutCount).toBe(1);
    const r2 = bailout(r1.restartState, r1.execState, r1.waitlistState, 1201);
    expect(r2.restartState.bailoutCount).toBe(2);
  });

  it('works with 1202 alarm code (no core sets)', () => {
    const result = bailout(createRestartState(), createExecutiveState(), createWaitlistState(), 1202);
    expect(result.restartState.lastAlarmCode).toBe(1202);
  });

  it('works with 1201 alarm code (no VAC areas)', () => {
    const result = bailout(createRestartState(), createExecutiveState(), createWaitlistState(), 1201);
    expect(result.restartState.lastAlarmCode).toBe(1201);
  });

  it('works with manual trigger (software-initiated)', () => {
    const result = bailout(createRestartState(), createExecutiveState(), createWaitlistState(), 0);
    expect(result.restartState.lastAlarmCode).toBe(0);
  });
});

describe('state preservation', () => {
  it('getRestartTable returns snapshot of all restart points', () => {
    let state = createRestartState();
    state = registerRestartPoint(state, 1, RestartGroup.CRITICAL, 0o2000);
    state = registerRestartPoint(state, 3, RestartGroup.IMPORTANT, 0o4000);
    const table = getRestartTable(state);
    expect(table.size).toBe(2);
    expect(table.get(1)!.group).toBe(RestartGroup.CRITICAL);
    expect(table.get(3)!.group).toBe(RestartGroup.IMPORTANT);
  });

  it('preserved jobs retain restart registrations', () => {
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
    restartState = registerRestartPoint(restartState, r.coreSetId, RestartGroup.CRITICAL, 0o2100);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.restartState.restartPoints.get(r.coreSetId)).toBeDefined();
    expect(result.restartState.restartPoints.get(r.coreSetId)!.group).toBe(RestartGroup.CRITICAL);
  });

  it('discarded jobs have restart registrations cleared', () => {
    let execState = createExecutiveState();
    const r = novac(execState, 5, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    execState = r.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    let restartState = createRestartState();
    restartState = registerRestartPoint(restartState, r.coreSetId, RestartGroup.DEFERRABLE, 0o2100);

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.restartState.restartPoints.has(r.coreSetId)).toBe(false);
  });
});

describe('edge cases', () => {
  it('BAILOUT with no registered restart points discards all non-idle jobs', () => {
    let execState = createExecutiveState();
    for (let i = 1; i <= 3; i++) {
      const r = novac(execState, i, 0o2000 + i);
      if (!('coreSetId' in r)) throw new Error('expected coreSetId');
      execState = r.state;
    }
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i >= 1 && i <= 3 ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    const result = bailout(createRestartState(), execState, createWaitlistState(), 1202);
    expect(result.discarded).toHaveLength(3);
    expect(result.preserved).toHaveLength(0);
  });

  it('BAILOUT with all jobs CRITICAL preserves everything', () => {
    let execState = createExecutiveState();
    let restartState = createRestartState();
    for (let i = 1; i <= 3; i++) {
      const r = novac(execState, i, 0o2000 + i);
      if (!('coreSetId' in r)) throw new Error('expected coreSetId');
      execState = r.state;
      restartState = registerRestartPoint(restartState, i, RestartGroup.CRITICAL, 0o2100 + i);
    }
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i >= 1 && i <= 3 ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };

    const result = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(result.preserved).toHaveLength(3);
    expect(result.discarded).toHaveLength(0);
  });

  it('multiple BAILOUTs in succession work correctly', () => {
    let execState = createExecutiveState();
    let restartState = createRestartState();

    // First: create and BAILOUT
    const r1 = novac(execState, 1, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    execState = r1.state;
    execState = {
      ...execState,
      coreSets: execState.coreSets.map((cs, i) =>
        i === r1.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };
    restartState = registerRestartPoint(restartState, r1.coreSetId, RestartGroup.CRITICAL, 0o2100);

    const b1 = bailout(restartState, execState, createWaitlistState(), 1202);
    expect(b1.restartState.bailoutCount).toBe(1);

    // Second BAILOUT immediately
    const b2 = bailout(b1.restartState, b1.execState, b1.waitlistState, 1201);
    expect(b2.restartState.bailoutCount).toBe(2);
    // System should still be valid
    expect(b2.execState.coreSets[0].state).not.toBe(JobState.FREE); // idle preserved
  });

  it('BAILOUT with empty Executive (only idle) is essentially a no-op', () => {
    const result = bailout(createRestartState(), createExecutiveState(), createWaitlistState(), 1202);
    expect(result.preserved).toHaveLength(0);
    expect(result.discarded).toHaveLength(0);
    expect(result.execState.coreSets[0].state).not.toBe(JobState.FREE);
  });
});
