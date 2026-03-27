/**
 * AGC Block II Executive Monitor -- read-only state observer.
 *
 * The Executive Monitor is the data backbone for visualizing AGC internals.
 * It extracts structured snapshots from the Executive (core sets, jobs,
 * priorities), Waitlist (timer entries), interrupt controller
 * (pending/servicing), counters (TIME1-TIME6), and restart system
 * (BAILOUT history).
 *
 * Snapshots are deeply frozen: they never modify the underlying AGC state
 * and cannot be mutated after creation.
 *
 * Phase 218, Plan 01.
 */

import type { AgcState } from './cpu.js';
import {
  type ExecutiveState,
  JobState,
  CORE_SET_COUNT,
} from './executive.js';
import type { WaitlistState } from './waitlist.js';
import { type InterruptId } from './interrupts.js';
import { CounterId } from './counters.js';
import {
  type RestartState,
  RestartGroup,
} from './restart.js';

// ─── View Types ──────────────────────────────────────────────────────────

/** Read-only view of a single core set's state. */
export interface CoreSetView {
  readonly coreSetId: number;
  readonly jobId: number | null;
  readonly priority: number;
  readonly state: string;
  readonly hasVacArea: boolean;
  readonly restartGroup: string | null;
}

/** Read-only view of a single Waitlist entry. */
export interface WaitlistEntryView {
  readonly entryId: number;
  readonly fireTime: number;
  readonly taskAddress: number;
  readonly timeUntilFire: number;
  readonly active: boolean;
}

/** Read-only view of the interrupt controller state. */
export interface InterruptView {
  readonly pendingBitmask: number;
  readonly pendingList: readonly InterruptId[];
  readonly isServicing: boolean;
  readonly isInhibited: boolean;
  readonly currentlyServicing: InterruptId | null;
}

/** Read-only view of the counter state. */
export interface CounterView {
  readonly values: Readonly<Record<CounterId, number>>;
  readonly time6Enabled: boolean;
}

/** Read-only view of the restart protection state. */
export interface RestartView {
  readonly registeredCount: number;
  readonly restartPoints: readonly { coreSetId: number; group: string; restartAddress: number }[];
  readonly bailoutCount: number;
  readonly lastAlarmCode: number | null;
}

/** Derived metrics computed from a snapshot. */
export interface MonitorMetrics {
  readonly coreSetUtilization: number;
  readonly highestActivePriority: number | null;
  readonly nextWaitlistFireTime: number | null;
  readonly pendingInterruptCount: number;
  readonly totalJobs: number;
  readonly sleepingJobs: number;
  readonly activeWaitlistEntries: number;
}

/** Complete read-only snapshot of all AGC scheduling subsystems. */
export interface MonitorSnapshot {
  readonly timestamp: number;
  readonly coreSets: readonly CoreSetView[];
  readonly waitlistEntries: readonly WaitlistEntryView[];
  readonly interrupts: InterruptView;
  readonly counters: CounterView;
  readonly restart: RestartView;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Map RestartGroup enum value to string label. */
function restartGroupToString(group: RestartGroup): string {
  switch (group) {
    case RestartGroup.CRITICAL: return 'CRITICAL';
    case RestartGroup.IMPORTANT: return 'IMPORTANT';
    case RestartGroup.DEFERRABLE: return 'DEFERRABLE';
  }
}

/** Decode a pending bitmask into an ordered array of InterruptIds. */
function decodePendingBitmask(bitmask: number): InterruptId[] {
  const list: InterruptId[] = [];
  for (let bit = 0; bit < 10; bit++) {
    if (bitmask & (1 << bit)) {
      list.push((bit + 1) as InterruptId);
    }
  }
  return list;
}

/** Recursively freeze an object and all nested objects/arrays. */
function deepFreeze<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  const values = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
  for (const value of values) {
    if (value !== null && value !== undefined && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Capture a complete read-only snapshot of all AGC scheduling subsystems.
 *
 * Extracts core sets, waitlist entries, interrupt state, counter values,
 * and restart information into frozen view objects.
 */
export function captureSnapshot(
  agcState: AgcState,
  execState: ExecutiveState,
  waitlistState: WaitlistState,
  restartState: RestartState,
): MonitorSnapshot {
  // 1. Timestamp from timing
  const timestamp = agcState.timing.totalMCTs;

  // 2. Map core sets to views, enriching with restart group
  const coreSets: CoreSetView[] = [];
  for (let i = 0; i < CORE_SET_COUNT; i++) {
    const cs = execState.coreSets[i];
    const restartPoint = restartState.restartPoints.get(i);
    const restartGroup = restartPoint
      ? restartGroupToString(restartPoint.group)
      : null;

    coreSets.push({
      coreSetId: i,
      jobId: cs.jobId,
      priority: cs.priority,
      state: cs.state,
      hasVacArea: cs.vacArea !== null,
      restartGroup,
    });
  }

  // 3. Map active waitlist entries to views
  const waitlistEntries: WaitlistEntryView[] = [];
  for (const entry of waitlistState.entries) {
    if (entry.active) {
      waitlistEntries.push({
        entryId: entry.entryId,
        fireTime: entry.fireTime,
        taskAddress: entry.taskAddress,
        timeUntilFire: Math.max(0, entry.fireTime - waitlistState.currentTime),
        active: entry.active,
      });
    }
  }

  // 4. Build interrupt view
  const pendingBitmask = agcState.interrupts.pending;
  const pendingList = decodePendingBitmask(pendingBitmask);
  const interrupts: InterruptView = {
    pendingBitmask,
    pendingList,
    isServicing: agcState.interrupts.servicing,
    isInhibited: agcState.interrupts.inhibited,
    currentlyServicing: null,
  };

  // 5. Build counter view
  const counterValues = {} as Record<CounterId, number>;
  for (const id of Object.values(CounterId)) {
    counterValues[id] = agcState.counters.values[id];
  }
  const counters: CounterView = {
    values: counterValues,
    time6Enabled: agcState.counters.time6Enabled,
  };

  // 6. Build restart view
  const restartPoints: { coreSetId: number; group: string; restartAddress: number }[] = [];
  restartState.restartPoints.forEach((point) => {
    restartPoints.push({
      coreSetId: point.coreSetId,
      group: restartGroupToString(point.group),
      restartAddress: point.restartAddress,
    });
  });
  const restart: RestartView = {
    registeredCount: restartState.restartPoints.size,
    restartPoints,
    bailoutCount: restartState.bailoutCount,
    lastAlarmCode: restartState.lastAlarmCode,
  };

  // 7. Assemble and deep-freeze
  const snapshot: MonitorSnapshot = {
    timestamp,
    coreSets,
    waitlistEntries,
    interrupts,
    counters,
    restart,
  };

  return deepFreeze(snapshot);
}

/**
 * Compute derived metrics from a monitor snapshot.
 *
 * Provides utilization, priority, and activity metrics for dashboard display.
 */
export function computeMetrics(snapshot: MonitorSnapshot): MonitorMetrics {
  // coreSetUtilization: non-FREE core sets / total
  const nonFreeCount = snapshot.coreSets.filter(cs => cs.state !== JobState.FREE).length;
  const coreSetUtilization = nonFreeCount / CORE_SET_COUNT;

  // highestActivePriority: lowest priority number among RUNNING/RUNNABLE (excluding idle at core set 0)
  let highestActivePriority: number | null = null;
  for (const cs of snapshot.coreSets) {
    if (cs.coreSetId === 0) continue; // skip idle job
    if (cs.state === JobState.RUNNING || cs.state === JobState.RUNNABLE) {
      if (highestActivePriority === null || cs.priority < highestActivePriority) {
        highestActivePriority = cs.priority;
      }
    }
  }

  // nextWaitlistFireTime: earliest fireTime among active entries
  let nextWaitlistFireTime: number | null = null;
  for (const entry of snapshot.waitlistEntries) {
    if (entry.active) {
      if (nextWaitlistFireTime === null || entry.fireTime < nextWaitlistFireTime) {
        nextWaitlistFireTime = entry.fireTime;
      }
    }
  }

  // pendingInterruptCount
  const pendingInterruptCount = snapshot.interrupts.pendingList.length;

  // totalJobs: non-FREE, non-idle core sets
  const totalJobs = snapshot.coreSets.filter(
    cs => cs.state !== JobState.FREE && cs.coreSetId !== 0,
  ).length;

  // sleepingJobs
  const sleepingJobs = snapshot.coreSets.filter(
    cs => cs.state === JobState.SLEEPING,
  ).length;

  // activeWaitlistEntries
  const activeWaitlistEntries = snapshot.waitlistEntries.filter(e => e.active).length;

  return deepFreeze({
    coreSetUtilization,
    highestActivePriority,
    nextWaitlistFireTime,
    pendingInterruptCount,
    totalJobs,
    sleepingJobs,
    activeWaitlistEntries,
  });
}
