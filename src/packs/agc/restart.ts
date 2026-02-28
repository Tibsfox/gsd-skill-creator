/**
 * AGC Block II BAILOUT restart protection.
 *
 * BAILOUT is the AGC's graceful degradation mechanism -- the reason Apollo 11
 * landed safely despite 1202 alarms. When the Executive runs out of resources,
 * BAILOUT performs a controlled restart:
 *   1. Classify all jobs by restart group
 *   2. Preserve CRITICAL jobs (always) and IMPORTANT jobs (if resources allow)
 *   3. Discard DEFERRABLE jobs (free core sets and VAC areas)
 *   4. Clear the entire Waitlist
 *   5. Set preserved jobs to RUNNABLE with execution resuming from restart address
 *
 * Restart groups:
 *   - CRITICAL (0): Always preserved -- guidance, navigation
 *   - IMPORTANT (1): Preserved if fewer than 4 core sets used by CRITICAL
 *   - DEFERRABLE (2): Always discarded -- display updates, background tasks
 *
 * Jobs with no registered restart point are treated as DEFERRABLE.
 *
 * Purely functional: all operations return new state, never mutate.
 */

import type { ExecutiveState } from './executive.js';
import { JobState, CORE_SET_COUNT } from './executive.js';
import type { WaitlistState } from './waitlist.js';
import { createWaitlistState } from './waitlist.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Restart group classification for job criticality. */
export enum RestartGroup {
  CRITICAL = 0,
  IMPORTANT = 1,
  DEFERRABLE = 2,
}

/** Runtime-accessible restart group constants (for use without enum). */
export const RESTART_GROUP = {
  CRITICAL: 0 as RestartGroup,
  IMPORTANT: 1 as RestartGroup,
  DEFERRABLE: 2 as RestartGroup,
} as const;

/** A registered restart point for a job. */
export interface RestartPoint {
  readonly coreSetId: number;
  readonly group: RestartGroup;
  readonly restartAddress: number;
}

/** Restart protection state. */
export interface RestartState {
  readonly restartPoints: ReadonlyMap<number, RestartPoint>;
  readonly lastAlarmCode: number | null;
  readonly bailoutCount: number;
}

/** Result of a BAILOUT operation. */
export interface BailoutResult {
  readonly execState: ExecutiveState;
  readonly waitlistState: WaitlistState;
  readonly restartState: RestartState;
  readonly preserved: readonly number[];
  readonly discarded: readonly number[];
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create the initial restart state.
 * Empty restart points, no alarm history, zero bailouts.
 */
export function createRestartState(): RestartState {
  return {
    restartPoints: new Map(),
    lastAlarmCode: null,
    bailoutCount: 0,
  };
}

/**
 * Register a restart point for a core set's job.
 * Associates the job with a restart group and restart address.
 * Latest registration wins (overwrites previous for same core set).
 */
export function registerRestartPoint(
  state: RestartState,
  coreSetId: number,
  group: RestartGroup,
  restartAddress: number,
): RestartState {
  const newPoints = new Map(state.restartPoints);
  newPoints.set(coreSetId, { coreSetId, group, restartAddress });
  return {
    ...state,
    restartPoints: newPoints,
  };
}

/**
 * Get the restart group for a core set's job.
 * Returns null if no restart point is registered.
 */
export function getRestartGroup(
  state: RestartState,
  coreSetId: number,
): RestartGroup | null {
  const point = state.restartPoints.get(coreSetId);
  return point ? point.group : null;
}

/**
 * Get a snapshot of all registered restart points.
 * Used by Executive Monitor (Phase 218) for diagnostics.
 */
export function getRestartTable(
  state: RestartState,
): ReadonlyMap<number, RestartPoint> {
  return new Map(state.restartPoints);
}

/**
 * BAILOUT -- controlled restart with job preservation.
 *
 * Algorithm:
 * 1. Classify all non-idle core sets by restart group (unregistered = DEFERRABLE)
 * 2. Always preserve CRITICAL jobs
 * 3. If fewer than 4 core sets used by CRITICAL, also preserve IMPORTANT jobs
 * 4. Discard everything else: free core sets, release VAC areas
 * 5. Set preserved jobs to RUNNABLE with returnAddress = restart address
 * 6. Clear the entire Waitlist
 * 7. Increment bailoutCount, record alarmCode
 */
export function bailout(
  restartState: RestartState,
  execState: ExecutiveState,
  waitlistState: WaitlistState,
  alarmCode: number,
): BailoutResult {
  const preserved: number[] = [];
  const discarded: number[] = [];

  // 1. Classify non-idle core sets
  const criticalSets: number[] = [];
  const importantSets: number[] = [];
  const deferrableSets: number[] = [];

  for (let i = 1; i < CORE_SET_COUNT; i++) {
    const cs = execState.coreSets[i];
    if (cs.state === JobState.FREE) {
      continue; // already free, nothing to do
    }

    const point = restartState.restartPoints.get(i);
    const group = point ? point.group : RestartGroup.DEFERRABLE;

    switch (group) {
      case RestartGroup.CRITICAL:
        criticalSets.push(i);
        break;
      case RestartGroup.IMPORTANT:
        importantSets.push(i);
        break;
      case RestartGroup.DEFERRABLE:
        deferrableSets.push(i);
        break;
    }
  }

  // 2-3. Determine which IMPORTANT jobs to preserve
  const preserveImportant = criticalSets.length < 4;

  // Preserved sets
  for (const csId of criticalSets) {
    preserved.push(csId);
  }
  if (preserveImportant) {
    for (const csId of importantSets) {
      preserved.push(csId);
    }
  }

  // Discarded sets
  for (const csId of deferrableSets) {
    discarded.push(csId);
  }
  if (!preserveImportant) {
    for (const csId of importantSets) {
      discarded.push(csId);
    }
  }

  // 4-5. Build new core sets and VAC pool
  let newCoreSets = [...execState.coreSets];
  let newVacPool = [...execState.vacPool];

  // Preserve: set RUNNABLE, update returnAddress to restart address
  for (const csId of preserved) {
    const point = restartState.restartPoints.get(csId);
    newCoreSets[csId] = {
      ...newCoreSets[csId],
      state: JobState.RUNNABLE,
      returnAddress: point ? point.restartAddress : newCoreSets[csId].returnAddress,
    };
  }

  // Discard: free core sets and release VAC areas
  for (const csId of discarded) {
    const cs = newCoreSets[csId];
    if (cs.vacArea !== null) {
      newVacPool[cs.vacArea] = true;
    }
    newCoreSets[csId] = {
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

  // 6. Clear Waitlist
  const newWaitlistState = createWaitlistState();

  // 7. Update restart state: clear discarded restart points, increment count
  const newRestartPoints = new Map(restartState.restartPoints);
  for (const csId of discarded) {
    newRestartPoints.delete(csId);
  }

  const newRestartState: RestartState = {
    restartPoints: newRestartPoints,
    lastAlarmCode: alarmCode,
    bailoutCount: restartState.bailoutCount + 1,
  };

  return {
    execState: {
      ...execState,
      coreSets: newCoreSets,
      vacPool: newVacPool,
    },
    waitlistState: newWaitlistState,
    restartState: newRestartState,
    preserved,
    discarded,
  };
}
