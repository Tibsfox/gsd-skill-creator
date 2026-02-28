/**
 * AGC Block II Waitlist -- timer-driven deferred task scheduler.
 *
 * The Waitlist is the second tier of AGC scheduling. While the Executive handles
 * priority-based job scheduling, the Waitlist handles time-based task scheduling.
 * Tasks are registered with a delay (centiseconds) and dispatched when that delay
 * expires via T3RUPT interrupt.
 *
 * Waitlist tasks are short-lived (under 5ms) and typically spawn Executive jobs
 * for longer work via NOVAC. Maximum 9 concurrent entries.
 *
 * Timing: centisecond resolution (1/100th second) matching AGC TIME3 counter.
 *
 * Alarm:
 *   - 1203: Waitlist overflow -- 9 entries already active
 *
 * Purely functional: all operations return new state, never mutate.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum concurrent Waitlist entries. */
export const MAX_WAITLIST_ENTRIES = 9;

/** Alarm: Waitlist overflow -- all 9 entries occupied. */
export const ALARM_1203 = 1203;

/** Centiseconds per second (for clarity in timing conversion). */
export const CENTISECONDS_PER_SECOND = 100;

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single Waitlist entry. */
export interface WaitlistEntry {
  readonly entryId: number;
  readonly delay: number;
  readonly fireTime: number;
  readonly taskAddress: number;
  readonly active: boolean;
}

/** Complete Waitlist state. */
export interface WaitlistState {
  readonly entries: readonly WaitlistEntry[];
  readonly currentTime: number;
  readonly nextEntryId: number;
}

/** Result of a dispatch attempt. */
export interface DispatchResult {
  readonly state: WaitlistState;
  readonly dispatched: { entryId: number; taskAddress: number } | null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create the initial Waitlist state.
 * Empty entries, currentTime=0, nextEntryId=1.
 */
export function createWaitlistState(): WaitlistState {
  return {
    entries: [],
    currentTime: 0,
    nextEntryId: 1,
  };
}

/**
 * Add a timer-deferred task entry.
 * Delay is in centiseconds. fireTime = currentTime + delay.
 * Entries are kept sorted by fireTime (earliest first).
 * Returns 1203 alarm if 9 active entries already exist.
 */
export function addWaitlistEntry(
  state: WaitlistState,
  delay: number,
  taskAddress: number,
): { state: WaitlistState; entryId: number } | { state: WaitlistState; alarm: number } {
  const activeCount = state.entries.filter((e) => e.active).length;
  if (activeCount >= MAX_WAITLIST_ENTRIES) {
    return { state, alarm: ALARM_1203 };
  }

  const entryId = state.nextEntryId;
  const fireTime = state.currentTime + delay;

  const newEntry: WaitlistEntry = {
    entryId,
    delay,
    fireTime,
    taskAddress,
    active: true,
  };

  // Insert in sorted position by fireTime (stable: same fireTime preserves insertion order)
  const entries = [...state.entries];
  let insertIdx = entries.length;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].active && entries[i].fireTime > fireTime) {
      insertIdx = i;
      break;
    }
    // Skip inactive entries that are before the insert point
    if (!entries[i].active && i < insertIdx) {
      continue;
    }
  }

  // Find exact insert position: after all active entries with fireTime <= newEntry.fireTime
  // and after all inactive entries interleaved
  let pos = 0;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].active && entries[i].fireTime <= fireTime) {
      pos = i + 1;
    } else if (!entries[i].active && i < pos) {
      // inactive entry before our target, skip
    } else if (entries[i].active && entries[i].fireTime > fireTime) {
      break;
    }
  }

  entries.splice(pos, 0, newEntry);

  return {
    state: {
      ...state,
      entries,
      nextEntryId: entryId + 1,
    },
    entryId,
  };
}

/**
 * Advance the Waitlist's current time.
 * Entries with fireTime <= newTime become eligible for dispatch.
 */
export function advanceWaitlistTime(
  state: WaitlistState,
  newTime: number,
): WaitlistState {
  return {
    ...state,
    currentTime: newTime,
  };
}

/**
 * Dispatch the earliest expired entry (fireTime <= currentTime).
 * Only dispatches ONE entry per call (matching T3RUPT one-task-per-cycle behavior).
 * Returns null if no entries are ready.
 */
export function dispatchWaitlist(state: WaitlistState): DispatchResult {
  // Find the first active entry whose fireTime <= currentTime
  const idx = state.entries.findIndex(
    (e) => e.active && e.fireTime <= state.currentTime,
  );

  if (idx === -1) {
    return { state, dispatched: null };
  }

  const entry = state.entries[idx];
  const newEntries = state.entries.map((e, i) =>
    i === idx ? { ...e, active: false } : e,
  );

  return {
    state: {
      ...state,
      entries: newEntries,
    },
    dispatched: {
      entryId: entry.entryId,
      taskAddress: entry.taskAddress,
    },
  };
}

/**
 * Cancel a pending Waitlist entry by ID.
 * Marks it inactive so it won't be dispatched.
 * No-op if entry doesn't exist.
 */
export function cancelWaitlistEntry(
  state: WaitlistState,
  entryId: number,
): WaitlistState {
  const idx = state.entries.findIndex(
    (e) => e.entryId === entryId && e.active,
  );

  if (idx === -1) {
    return state;
  }

  return {
    ...state,
    entries: state.entries.map((e, i) =>
      i === idx ? { ...e, active: false } : e,
    ),
  };
}

/**
 * Get the fireTime of the earliest active entry.
 * Returns null if no active entries exist.
 * Used for reprogramming the hardware timer (TIME3 via T3RUPT).
 */
export function getNextFireTime(state: WaitlistState): number | null {
  for (const entry of state.entries) {
    if (entry.active) {
      return entry.fireTime;
    }
  }
  return null;
}

/**
 * Count the number of active (non-cancelled, non-dispatched) entries.
 */
export function getActiveEntryCount(state: WaitlistState): number {
  return state.entries.filter((e) => e.active).length;
}
