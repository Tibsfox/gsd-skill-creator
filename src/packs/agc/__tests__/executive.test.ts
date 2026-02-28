/**
 * AGC Executive scheduler tests.
 *
 * Covers: core set management, NOVAC/FINDVAC job creation, ENDOFJOB termination,
 * priority-based scheduling, changePriority, jobSleep/jobWake, context switching,
 * 1202/1201 alarm conditions.
 */

import { describe, it, expect } from 'vitest';
import {
  JobState,
  createExecutiveState,
  novac,
  findvac,
  endofjob,
  scheduleNext,
  changePriority,
  jobSleep,
  jobWake,
  saveContext,
  restoreContext,
  CORE_SET_COUNT,
  MAX_PRIORITY,
  VAC_AREA_COUNT,
  ALARM_1202,
  ALARM_1201,
} from '../executive.js';
import { createRegisters, setRegister, getRegister } from '../registers.js';
import { RegisterId } from '../types.js';

describe('core set management', () => {
  it('creates state with 8 core sets (0-7)', () => {
    const state = createExecutiveState();
    expect(state.coreSets).toHaveLength(CORE_SET_COUNT);
  });

  it('sets core set 0 as idle job (priority 7, RUNNING)', () => {
    const state = createExecutiveState();
    const idle = state.coreSets[0];
    expect(idle.state).toBe(JobState.RUNNING);
    expect(idle.priority).toBe(MAX_PRIORITY);
    expect(idle.jobId).not.toBeNull();
  });

  it('sets core sets 1-7 as FREE initially', () => {
    const state = createExecutiveState();
    for (let i = 1; i < CORE_SET_COUNT; i++) {
      expect(state.coreSets[i].state).toBe(JobState.FREE);
      expect(state.coreSets[i].jobId).toBeNull();
    }
  });

  it('each core set stores registers snapshot, bank selectors, returnAddress, restartGroup', () => {
    const state = createExecutiveState();
    const cs = state.coreSets[0];
    expect(cs).toHaveProperty('registers');
    expect(cs).toHaveProperty('ebank');
    expect(cs).toHaveProperty('fbank');
    expect(cs).toHaveProperty('superbank');
    expect(cs).toHaveProperty('returnAddress');
    expect(cs).toHaveProperty('restartGroup');
  });

  it('initial running core set is 0', () => {
    const state = createExecutiveState();
    expect(state.runningCoreSet).toBe(0);
  });

  it('has 5 VAC areas all free initially', () => {
    const state = createExecutiveState();
    expect(state.vacPool).toHaveLength(VAC_AREA_COUNT);
    for (let i = 0; i < VAC_AREA_COUNT; i++) {
      expect(state.vacPool[i]).toBe(true); // true = free
    }
  });
});

describe('NOVAC - lightweight job creation', () => {
  it('creates a job in the first free core set (searching 1-7)', () => {
    const state = createExecutiveState();
    const result = novac(state, 2, 0o2000);
    expect('coreSetId' in result).toBe(true);
    if ('coreSetId' in result) {
      expect(result.coreSetId).toBe(1); // first free
      expect(result.state.coreSets[1].state).toBe(JobState.DORMANT);
      expect(result.state.coreSets[1].priority).toBe(2);
    }
  });

  it('stores startAddress as returnAddress', () => {
    const state = createExecutiveState();
    const result = novac(state, 3, 0o3000);
    if ('coreSetId' in result) {
      expect(result.state.coreSets[result.coreSetId].returnAddress).toBe(0o3000);
    }
  });

  it('assigns incrementing job IDs', () => {
    let state = createExecutiveState();
    const r1 = novac(state, 1, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    state = r1.state;
    const r2 = novac(state, 2, 0o2100);
    if (!('coreSetId' in r2)) throw new Error('expected coreSetId');
    expect(r2.state.coreSets[r2.coreSetId].jobId).toBeGreaterThan(
      r1.state.coreSets[r1.coreSetId].jobId!,
    );
  });

  it('fills core sets sequentially (first free)', () => {
    let state = createExecutiveState();
    for (let i = 1; i <= 7; i++) {
      const result = novac(state, i, 0o2000 + i);
      if (!('coreSetId' in result)) throw new Error('expected coreSetId');
      expect(result.coreSetId).toBe(i);
      state = result.state;
    }
  });

  it('triggers 1202 alarm when all core sets occupied', () => {
    let state = createExecutiveState();
    // Fill all 7 non-idle core sets
    for (let i = 1; i <= 7; i++) {
      const result = novac(state, i, 0o2000);
      if (!('coreSetId' in result)) throw new Error('expected coreSetId');
      state = result.state;
    }
    // 8th NOVAC should fail
    const overflow = novac(state, 1, 0o2000);
    expect('alarm' in overflow).toBe(true);
    if ('alarm' in overflow) {
      expect(overflow.alarm).toBe(ALARM_1202);
    }
  });

  it('jobs created by NOVAC have no VAC area', () => {
    const state = createExecutiveState();
    const result = novac(state, 2, 0o2000);
    if ('coreSetId' in result) {
      expect(result.state.coreSets[result.coreSetId].vacArea).toBeNull();
    }
  });
});

describe('FINDVAC - job creation with VAC area', () => {
  it('creates a job like NOVAC but with a VAC area', () => {
    const state = createExecutiveState();
    const result = findvac(state, 1, 0o2000);
    expect('coreSetId' in result).toBe(true);
    if ('coreSetId' in result) {
      expect(result.state.coreSets[result.coreSetId].state).toBe(JobState.DORMANT);
      expect(result.state.coreSets[result.coreSetId].vacArea).not.toBeNull();
    }
  });

  it('allocates VAC area from the pool', () => {
    const state = createExecutiveState();
    const result = findvac(state, 1, 0o2000);
    if ('coreSetId' in result) {
      // One VAC area should now be used
      const freeVacs = result.state.vacPool.filter((v) => v === true).length;
      expect(freeVacs).toBe(VAC_AREA_COUNT - 1);
    }
  });

  it('triggers 1201 alarm when no VAC areas available', () => {
    let state = createExecutiveState();
    // Allocate all 5 VAC areas
    for (let i = 0; i < VAC_AREA_COUNT; i++) {
      const result = findvac(state, 1, 0o2000 + i);
      if (!('coreSetId' in result)) throw new Error('expected coreSetId');
      state = result.state;
    }
    // 6th FINDVAC should get 1201 alarm
    const overflow = findvac(state, 1, 0o3000);
    expect('alarm' in overflow).toBe(true);
    if ('alarm' in overflow) {
      expect(overflow.alarm).toBe(ALARM_1201);
    }
  });

  it('triggers 1202 alarm when no core sets available (before checking VAC)', () => {
    let state = createExecutiveState();
    // Fill all 7 non-idle core sets (some with VAC, some without)
    for (let i = 1; i <= 5; i++) {
      const result = findvac(state, i, 0o2000 + i);
      if (!('coreSetId' in result)) throw new Error('expected coreSetId');
      state = result.state;
    }
    for (let i = 6; i <= 7; i++) {
      const result = novac(state, i, 0o2000 + i);
      if (!('coreSetId' in result)) throw new Error('expected coreSetId');
      state = result.state;
    }
    // No more core sets
    const overflow = findvac(state, 1, 0o4000);
    expect('alarm' in overflow).toBe(true);
    if ('alarm' in overflow) {
      expect(overflow.alarm).toBe(ALARM_1202);
    }
  });
});

describe('ENDOFJOB - job termination', () => {
  it('marks core set FREE and clears job data', () => {
    let state = createExecutiveState();
    const r = novac(state, 2, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    const freed = endofjob(state, r.coreSetId);
    expect(freed.coreSets[r.coreSetId].state).toBe(JobState.FREE);
    expect(freed.coreSets[r.coreSetId].jobId).toBeNull();
  });

  it('releases VAC area if allocated', () => {
    let state = createExecutiveState();
    const r = findvac(state, 1, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    const freeVacsBefore = state.vacPool.filter((v) => v).length;
    const freed = endofjob(state, r.coreSetId);
    const freeVacsAfter = freed.vacPool.filter((v) => v).length;
    expect(freeVacsAfter).toBe(freeVacsBefore + 1);
  });

  it('freed core set is available for subsequent NOVAC', () => {
    let state = createExecutiveState();
    const r1 = novac(state, 2, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    state = endofjob(r1.state, r1.coreSetId);
    const r2 = novac(state, 3, 0o3000);
    expect('coreSetId' in r2).toBe(true);
    if ('coreSetId' in r2) {
      expect(r2.coreSetId).toBe(r1.coreSetId);
    }
  });
});

describe('scheduleNext - priority-based scheduling', () => {
  it('returns the highest-priority RUNNABLE job (lowest priority number)', () => {
    let state = createExecutiveState();
    // Create two jobs
    const r1 = novac(state, 5, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    state = r1.state;
    const r2 = novac(state, 2, 0o3000);
    if (!('coreSetId' in r2)) throw new Error('expected coreSetId');
    state = r2.state;
    // Make both RUNNABLE
    state = {
      ...state,
      coreSets: state.coreSets.map((cs, i) =>
        i === r1.coreSetId || i === r2.coreSetId
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };
    const sched = scheduleNext(state);
    expect(sched.coreSetId).toBe(r2.coreSetId); // priority 2 < 5, so higher
  });

  it('selects lowest core set number on equal priority (deterministic)', () => {
    let state = createExecutiveState();
    const r1 = novac(state, 3, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    state = r1.state;
    const r2 = novac(state, 3, 0o3000);
    if (!('coreSetId' in r2)) throw new Error('expected coreSetId');
    state = r2.state;
    // Make both RUNNABLE
    state = {
      ...state,
      coreSets: state.coreSets.map((cs, i) =>
        i === r1.coreSetId || i === r2.coreSetId
          ? { ...cs, state: JobState.RUNNABLE }
          : cs,
      ),
    };
    const sched = scheduleNext(state);
    expect(sched.coreSetId).toBe(r1.coreSetId); // lower core set number
  });

  it('returns core set 0 (idle) if no RUNNABLE jobs', () => {
    const state = createExecutiveState();
    const sched = scheduleNext(state);
    expect(sched.coreSetId).toBe(0);
  });

  it('changes selected job to RUNNING, previously RUNNING to RUNNABLE', () => {
    let state = createExecutiveState();
    const r1 = novac(state, 1, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    state = r1.state;
    // Make it RUNNABLE
    state = {
      ...state,
      coreSets: state.coreSets.map((cs, i) =>
        i === r1.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };
    const sched = scheduleNext(state);
    expect(sched.state.coreSets[r1.coreSetId].state).toBe(JobState.RUNNING);
    // Idle job (was RUNNING) should now be RUNNABLE
    expect(sched.state.coreSets[0].state).toBe(JobState.RUNNABLE);
  });
});

describe('changePriority', () => {
  it('updates the priority of a job', () => {
    let state = createExecutiveState();
    const r = novac(state, 5, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    const updated = changePriority(state, r.coreSetId, 1);
    expect(updated.coreSets[r.coreSetId].priority).toBe(1);
  });

  it('does not affect other core sets', () => {
    let state = createExecutiveState();
    const r1 = novac(state, 5, 0o2000);
    if (!('coreSetId' in r1)) throw new Error('expected coreSetId');
    state = r1.state;
    const r2 = novac(state, 3, 0o3000);
    if (!('coreSetId' in r2)) throw new Error('expected coreSetId');
    state = r2.state;
    const updated = changePriority(state, r1.coreSetId, 1);
    expect(updated.coreSets[r2.coreSetId].priority).toBe(3); // unchanged
  });
});

describe('jobSleep and jobWake', () => {
  it('jobSleep marks a job SLEEPING', () => {
    let state = createExecutiveState();
    const r = novac(state, 2, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    // Make it RUNNABLE first
    state = {
      ...state,
      coreSets: state.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs,
      ),
    };
    const sleeping = jobSleep(state, r.coreSetId);
    expect(sleeping.coreSets[r.coreSetId].state).toBe(JobState.SLEEPING);
  });

  it('jobWake marks a SLEEPING job RUNNABLE', () => {
    let state = createExecutiveState();
    const r = novac(state, 2, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    // Make it SLEEPING
    state = {
      ...state,
      coreSets: state.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.SLEEPING } : cs,
      ),
    };
    const woken = jobWake(state, r.coreSetId);
    expect(woken.coreSets[r.coreSetId].state).toBe(JobState.RUNNABLE);
  });

  it('waking a non-sleeping job is a no-op', () => {
    let state = createExecutiveState();
    const r = novac(state, 2, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    // Job is DORMANT (not sleeping)
    const woken = jobWake(state, r.coreSetId);
    expect(woken.coreSets[r.coreSetId].state).toBe(JobState.DORMANT);
  });

  it('sleeping job is not selected by scheduleNext', () => {
    let state = createExecutiveState();
    const r = novac(state, 1, 0o2000); // high priority
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    // Make it SLEEPING
    state = {
      ...state,
      coreSets: state.coreSets.map((cs, i) =>
        i === r.coreSetId ? { ...cs, state: JobState.SLEEPING } : cs,
      ),
    };
    const sched = scheduleNext(state);
    expect(sched.coreSetId).toBe(0); // falls back to idle
  });
});

describe('context switching', () => {
  it('saveContext stores registers into the core set', () => {
    let state = createExecutiveState();
    const r = novac(state, 1, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    const regs = setRegister(
      setRegister(createRegisters(), RegisterId.A, 0o12345),
      RegisterId.L,
      0o54321,
    );
    const saved = saveContext(state, r.coreSetId, regs);
    expect(saved.coreSets[r.coreSetId].registers).not.toBeNull();
    expect(getRegister(saved.coreSets[r.coreSetId].registers!, RegisterId.A)).toBe(0o12345);
    expect(getRegister(saved.coreSets[r.coreSetId].registers!, RegisterId.L)).toBe(
      0o54321 & 0o77777,
    );
  });

  it('restoreContext returns saved registers', () => {
    let state = createExecutiveState();
    const r = novac(state, 1, 0o2000);
    if (!('coreSetId' in r)) throw new Error('expected coreSetId');
    state = r.state;
    const regs = setRegister(createRegisters(), RegisterId.Q, 0o7777);
    state = saveContext(state, r.coreSetId, regs);
    const restored = restoreContext(state, r.coreSetId);
    expect(restored).not.toBeNull();
    expect(getRegister(restored!, RegisterId.Q)).toBe(0o7777);
  });

  it('restoreContext returns null for FREE core set', () => {
    const state = createExecutiveState();
    const restored = restoreContext(state, 1); // FREE core set
    expect(restored).toBeNull();
  });

  it('full context switch: save current, restore next', () => {
    let state = createExecutiveState();

    // Create job A (priority 1)
    const ra = novac(state, 1, 0o2000);
    if (!('coreSetId' in ra)) throw new Error('expected coreSetId');
    state = ra.state;

    // Create job B (priority 3)
    const rb = novac(state, 3, 0o3000);
    if (!('coreSetId' in rb)) throw new Error('expected coreSetId');
    state = rb.state;

    // Save regs for job A
    const regsA = setRegister(createRegisters(), RegisterId.A, 0o11111);
    state = saveContext(state, ra.coreSetId, regsA);

    // Save regs for job B
    const regsB = setRegister(createRegisters(), RegisterId.A, 0o22222);
    state = saveContext(state, rb.coreSetId, regsB);

    // Restore A's registers
    const restoredA = restoreContext(state, ra.coreSetId);
    expect(getRegister(restoredA!, RegisterId.A)).toBe(0o11111);

    // Restore B's registers
    const restoredB = restoreContext(state, rb.coreSetId);
    expect(getRegister(restoredB!, RegisterId.A)).toBe(0o22222);
  });
});

describe('constants', () => {
  it('CORE_SET_COUNT is 8', () => {
    expect(CORE_SET_COUNT).toBe(8);
  });

  it('MAX_PRIORITY is 7', () => {
    expect(MAX_PRIORITY).toBe(7);
  });

  it('VAC_AREA_COUNT is 5', () => {
    expect(VAC_AREA_COUNT).toBe(5);
  });

  it('ALARM_1202 is 1202', () => {
    expect(ALARM_1202).toBe(1202);
  });

  it('ALARM_1201 is 1201', () => {
    expect(ALARM_1201).toBe(1201);
  });
});
