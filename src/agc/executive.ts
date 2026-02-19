/**
 * AGC Block II Executive -- priority-based cooperative job scheduler.
 *
 * The Executive is the AGC's operating system kernel. It manages all computational
 * tasks through 8 core sets (numbered 0-7), each storing the complete context for
 * one job. Core set 0 is reserved for the idle job (always exists, lowest priority).
 *
 * Job creation:
 *   - NOVAC: lightweight job (no VAC area)
 *   - FINDVAC: job with 44-word VAC area for sustained computation
 *
 * Scheduling:
 *   - Priority 0 = highest (guidance), Priority 7 = lowest (display updates)
 *   - scheduleNext always selects the lowest priority number among RUNNABLE jobs
 *   - Ties broken by lowest core set number (deterministic)
 *
 * Alarms:
 *   - 1202: no free core sets (Executive overflow)
 *   - 1201: no free VAC areas (VAC overflow)
 *
 * Purely functional: all operations return new state, never mutate.
 */

import type { AgcRegisters } from './registers.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Number of core sets in the Executive (0-7). */
export const CORE_SET_COUNT = 8;

/** Lowest priority level (least critical). */
export const MAX_PRIORITY = 7;

/** Number of VAC areas available for FINDVAC. */
export const VAC_AREA_COUNT = 5;

/** Size of each VAC area in words. */
export const VAC_AREA_SIZE = 44;

/** Alarm: Executive overflow -- no free core sets. */
export const ALARM_1202 = 1202;

/** Alarm: VAC overflow -- no free VAC areas. */
export const ALARM_1201 = 1201;

// ─── Types ───────────────────────────────────────────────────────────────────

/** Job lifecycle state within a core set. */
export enum JobState {
  FREE = 'FREE',
  DORMANT = 'DORMANT',
  RUNNABLE = 'RUNNABLE',
  RUNNING = 'RUNNING',
  SLEEPING = 'SLEEPING',
}

/** A single core set storing one job's complete context. */
export interface CoreSet {
  readonly jobId: number | null;
  readonly priority: number;
  readonly state: JobState;
  readonly registers: AgcRegisters | null;
  readonly ebank: number;
  readonly fbank: number;
  readonly superbank: number;
  readonly returnAddress: number;
  readonly restartGroup: number;
  readonly vacArea: number | null;
}

/** Complete Executive state. */
export interface ExecutiveState {
  readonly coreSets: readonly CoreSet[];
  readonly runningCoreSet: number;
  readonly vacPool: readonly boolean[];
  readonly nextJobId: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a FREE core set with no job. */
function freeCoreSet(): CoreSet {
  return {
    jobId: null,
    priority: 0,
    state: JobState.FREE,
    registers: null,
    ebank: 0,
    fbank: 0,
    superbank: 0,
    returnAddress: 0,
    restartGroup: 0,
    vacArea: null,
  };
}

/** Replace a single core set in the array immutably. */
function updateCoreSet(
  coreSets: readonly CoreSet[],
  index: number,
  update: Partial<CoreSet>,
): CoreSet[] {
  return coreSets.map((cs, i) => (i === index ? { ...cs, ...update } : cs));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create the initial Executive state.
 * Core set 0 = idle job (priority 7, RUNNING). Core sets 1-7 = FREE.
 * All 5 VAC areas free.
 */
export function createExecutiveState(): ExecutiveState {
  const coreSets: CoreSet[] = [];

  // Core set 0: idle job
  coreSets.push({
    jobId: 0,
    priority: MAX_PRIORITY,
    state: JobState.RUNNING,
    registers: null,
    ebank: 0,
    fbank: 0,
    superbank: 0,
    returnAddress: 0,
    restartGroup: 0,
    vacArea: null,
  });

  // Core sets 1-7: free
  for (let i = 1; i < CORE_SET_COUNT; i++) {
    coreSets.push(freeCoreSet());
  }

  return {
    coreSets,
    runningCoreSet: 0,
    vacPool: Array(VAC_AREA_COUNT).fill(true),
    nextJobId: 1,
  };
}

/**
 * NOVAC -- create a lightweight job (no VAC area).
 * Finds the first FREE core set (1-7), marks it DORMANT.
 * Returns 1202 alarm if no free core sets.
 */
export function novac(
  state: ExecutiveState,
  priority: number,
  startAddress: number,
): { state: ExecutiveState; coreSetId: number } | { state: ExecutiveState; alarm: number } {
  // Find first free core set (skip 0 = idle)
  const freeIdx = state.coreSets.findIndex(
    (cs, i) => i > 0 && cs.state === JobState.FREE,
  );

  if (freeIdx === -1) {
    return { state, alarm: ALARM_1202 };
  }

  const jobId = state.nextJobId;
  const newCoreSets = updateCoreSet(state.coreSets, freeIdx, {
    jobId,
    priority,
    state: JobState.DORMANT,
    returnAddress: startAddress,
    vacArea: null,
  });

  return {
    state: {
      ...state,
      coreSets: newCoreSets,
      nextJobId: jobId + 1,
    },
    coreSetId: freeIdx,
  };
}

/**
 * FINDVAC -- create a job with a VAC area (44 words of erasable memory).
 * Returns 1202 alarm if no free core sets, 1201 if no free VAC areas.
 */
export function findvac(
  state: ExecutiveState,
  priority: number,
  startAddress: number,
): { state: ExecutiveState; coreSetId: number } | { state: ExecutiveState; alarm: number } {
  // Find first free core set (skip 0 = idle)
  const freeIdx = state.coreSets.findIndex(
    (cs, i) => i > 0 && cs.state === JobState.FREE,
  );

  if (freeIdx === -1) {
    return { state, alarm: ALARM_1202 };
  }

  // Find first free VAC area
  const vacIdx = state.vacPool.findIndex((free) => free);
  if (vacIdx === -1) {
    return { state, alarm: ALARM_1201 };
  }

  const jobId = state.nextJobId;
  const newCoreSets = updateCoreSet(state.coreSets, freeIdx, {
    jobId,
    priority,
    state: JobState.DORMANT,
    returnAddress: startAddress,
    vacArea: vacIdx,
  });

  const newVacPool = state.vacPool.map((free, i) => (i === vacIdx ? false : free));

  return {
    state: {
      ...state,
      coreSets: newCoreSets,
      vacPool: newVacPool,
      nextJobId: jobId + 1,
    },
    coreSetId: freeIdx,
  };
}

/**
 * ENDOFJOB -- release a core set and its VAC area (if any).
 * Marks the core set FREE and returns it to the available pool.
 */
export function endofjob(state: ExecutiveState, coreSetId: number): ExecutiveState {
  const cs = state.coreSets[coreSetId];
  if (!cs || cs.state === JobState.FREE) {
    return state;
  }

  const newCoreSets = updateCoreSet(state.coreSets, coreSetId, {
    ...freeCoreSet(),
  });

  // Release VAC area if one was allocated
  let newVacPool = state.vacPool;
  if (cs.vacArea !== null) {
    newVacPool = state.vacPool.map((free, i) => (i === cs.vacArea ? true : free));
  }

  return {
    ...state,
    coreSets: newCoreSets,
    vacPool: newVacPool,
  };
}

/**
 * Select the highest-priority RUNNABLE job.
 * Lower priority number = higher importance.
 * Ties broken by lowest core set number.
 * If no RUNNABLE jobs, returns core set 0 (idle).
 * Transitions: selected -> RUNNING, previously RUNNING -> RUNNABLE.
 */
export function scheduleNext(
  state: ExecutiveState,
): { state: ExecutiveState; coreSetId: number } {
  let bestIdx = -1;
  let bestPriority = MAX_PRIORITY + 1;

  for (let i = 0; i < state.coreSets.length; i++) {
    const cs = state.coreSets[i];
    if (cs.state === JobState.RUNNABLE && cs.priority < bestPriority) {
      bestPriority = cs.priority;
      bestIdx = i;
    }
  }

  // Fall back to idle job (core set 0)
  if (bestIdx === -1) {
    bestIdx = 0;
  }

  // Transition: previously RUNNING -> RUNNABLE, selected -> RUNNING
  const currentRunning = state.runningCoreSet;
  let newCoreSets = state.coreSets.map((cs, i) => {
    if (i === currentRunning && cs.state === JobState.RUNNING && i !== bestIdx) {
      return { ...cs, state: JobState.RUNNABLE };
    }
    if (i === bestIdx) {
      return { ...cs, state: JobState.RUNNING };
    }
    return cs;
  });

  return {
    state: {
      ...state,
      coreSets: newCoreSets,
      runningCoreSet: bestIdx,
    },
    coreSetId: bestIdx,
  };
}

/**
 * Change the priority of a job in a specific core set.
 */
export function changePriority(
  state: ExecutiveState,
  coreSetId: number,
  newPriority: number,
): ExecutiveState {
  if (coreSetId < 0 || coreSetId >= CORE_SET_COUNT) {
    return state;
  }
  return {
    ...state,
    coreSets: updateCoreSet(state.coreSets, coreSetId, { priority: newPriority }),
  };
}

/**
 * Mark a job as SLEEPING -- it won't be scheduled until woken.
 */
export function jobSleep(state: ExecutiveState, coreSetId: number): ExecutiveState {
  if (coreSetId < 0 || coreSetId >= CORE_SET_COUNT) {
    return state;
  }
  const cs = state.coreSets[coreSetId];
  if (cs.state === JobState.FREE) {
    return state;
  }
  return {
    ...state,
    coreSets: updateCoreSet(state.coreSets, coreSetId, { state: JobState.SLEEPING }),
  };
}

/**
 * Wake a SLEEPING job, making it RUNNABLE again.
 * Waking a non-sleeping job is a no-op.
 */
export function jobWake(state: ExecutiveState, coreSetId: number): ExecutiveState {
  if (coreSetId < 0 || coreSetId >= CORE_SET_COUNT) {
    return state;
  }
  const cs = state.coreSets[coreSetId];
  if (cs.state !== JobState.SLEEPING) {
    return state;
  }
  return {
    ...state,
    coreSets: updateCoreSet(state.coreSets, coreSetId, { state: JobState.RUNNABLE }),
  };
}

/**
 * Save current CPU registers into a core set's register snapshot.
 */
export function saveContext(
  state: ExecutiveState,
  coreSetId: number,
  registers: AgcRegisters,
): ExecutiveState {
  if (coreSetId < 0 || coreSetId >= CORE_SET_COUNT) {
    return state;
  }
  return {
    ...state,
    coreSets: updateCoreSet(state.coreSets, coreSetId, { registers }),
  };
}

/**
 * Restore saved registers from a core set.
 * Returns null if the core set has no saved registers (FREE or never saved).
 */
export function restoreContext(
  state: ExecutiveState,
  coreSetId: number,
): AgcRegisters | null {
  if (coreSetId < 0 || coreSetId >= CORE_SET_COUNT) {
    return null;
  }
  return state.coreSets[coreSetId].registers;
}
