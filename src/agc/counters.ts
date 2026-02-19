/**
 * AGC Block II involuntary counter system.
 *
 * Counters TIME1-TIME6 increment automatically on hardware clock pulses.
 * CDU counters (CDUX/Y/Z) increment on external IMU pulses.
 * Overflow triggers associated interrupts (T3RUPT, T4RUPT, T5RUPT, T6RUPT).
 * TIME1 overflow cascades to TIME2 (forming a 30-bit timer pair).
 *
 * All functions are pure (no mutation of input state).
 */

import { WORD15_MASK } from './types.js';
import { onesIncrement } from './alu.js';
import { InterruptId } from './interrupts.js';

// ─── Counter Definitions ────────────────────────────────────────────────────

/** AGC involuntary counter identifiers. */
export enum CounterId {
  TIME1 = 'TIME1',
  TIME2 = 'TIME2',
  TIME3 = 'TIME3',
  TIME4 = 'TIME4',
  TIME5 = 'TIME5',
  TIME6 = 'TIME6',
  CDUX = 'CDUX',
  CDUY = 'CDUY',
  CDUZ = 'CDUZ',
}

/** Counter erasable memory addresses. */
export const COUNTER_ADDRESSES: Record<CounterId, number> = {
  [CounterId.TIME1]: 0o24,
  [CounterId.TIME2]: 0o25,
  [CounterId.TIME3]: 0o26,
  [CounterId.TIME4]: 0o27,
  [CounterId.TIME5]: 0o30,
  [CounterId.TIME6]: 0o31,
  [CounterId.CDUX]: 0o32,
  [CounterId.CDUY]: 0o33,
  [CounterId.CDUZ]: 0o34,
};

/** Mapping from counter to its overflow interrupt (if any). */
export const COUNTER_INTERRUPTS: Partial<Record<CounterId, InterruptId>> = {
  [CounterId.TIME3]: InterruptId.T3RUPT,
  [CounterId.TIME4]: InterruptId.T4RUPT,
  [CounterId.TIME5]: InterruptId.T5RUPT,
  [CounterId.TIME6]: InterruptId.T6RUPT,
};

// ─── Timing Constants ───────────────────────────────────────────────────────

/** MCTs per TIME1-TIME5 increment (~10ms / 11.72us). */
const TIMER_MCT_THRESHOLD = 853.24;

/** MCTs per TIME6 increment (~312.5us / 11.72us). */
const TIME6_MCT_THRESHOLD = 26.66;

// ─── Counter State ──────────────────────────────────────────────────────────

/** All counter IDs for iteration. */
const ALL_COUNTER_IDS: readonly CounterId[] = [
  CounterId.TIME1, CounterId.TIME2, CounterId.TIME3,
  CounterId.TIME4, CounterId.TIME5, CounterId.TIME6,
  CounterId.CDUX, CounterId.CDUY, CounterId.CDUZ,
];

/** Timer counter IDs (TIME1-TIME5, auto-increment on clock). */
const TIMER_COUNTER_IDS: readonly CounterId[] = [
  CounterId.TIME1, CounterId.TIME2, CounterId.TIME3,
  CounterId.TIME4, CounterId.TIME5,
];

/** Immutable counter state. */
export interface CounterState {
  /** 15-bit counter values indexed by CounterId. */
  readonly values: Readonly<Record<CounterId, number>>;
  /** Whether TIME6 is enabled (digital autopilot timer). */
  readonly time6Enabled: boolean;
  /** Internal accumulators for fractional MCT-to-increment conversion. */
  readonly accumulators: Readonly<Record<string, number>>;
}

/** Create initial counter state: all zeros, TIME6 disabled. */
export function createCounterState(): CounterState {
  const values = {} as Record<CounterId, number>;
  for (const id of ALL_COUNTER_IDS) {
    values[id] = 0;
  }

  return {
    values,
    time6Enabled: false,
    accumulators: {
      timer: 0,   // shared accumulator for TIME1-TIME5
      time6: 0,   // accumulator for TIME6
    },
  };
}

// ─── Counter Operations ─────────────────────────────────────────────────────

/** Get the current value of a counter. */
export function getCounterValue(state: CounterState, id: CounterId): number {
  return state.values[id];
}

/** Set a counter value (for software preset of timers). */
export function setCounterValue(state: CounterState, id: CounterId, value: number): CounterState {
  return {
    ...state,
    values: { ...state.values, [id]: value & WORD15_MASK },
  };
}

/** Enable or disable TIME6. */
export function setTime6Enable(state: CounterState, enabled: boolean): CounterState {
  if (state.time6Enabled === enabled) return state;
  return { ...state, time6Enabled: enabled };
}

/** Result of incrementing a counter. */
export interface IncrementResult {
  readonly counterState: CounterState;
  readonly overflow: boolean;
}

/**
 * Increment a counter by 1 using ones' complement arithmetic.
 *
 * - TIME6: no-op if disabled
 * - TIME1 overflow cascades to TIME2
 * - Overflow detected when value wraps from 0o37777 (max positive 15-bit)
 */
export function incrementCounter(state: CounterState, id: CounterId): IncrementResult {
  // TIME6 no-op when disabled
  if (id === CounterId.TIME6 && !state.time6Enabled) {
    return { counterState: state, overflow: false };
  }

  const currentValue = state.values[id];
  const result = onesIncrement(currentValue);
  const overflowed = result.overflow;

  let newValues = { ...state.values };

  if (overflowed) {
    // Reset counter to 0 on overflow
    newValues[id] = 0;

    // TIME1 overflow cascades to TIME2
    if (id === CounterId.TIME1) {
      const time2Result = onesIncrement(newValues[CounterId.TIME2]);
      newValues[CounterId.TIME2] = time2Result.overflow ? 0 : time2Result.value;
    }
  } else {
    newValues[id] = result.value;
  }

  return {
    counterState: { ...state, values: newValues },
    overflow: overflowed,
  };
}

/**
 * Pulse a counter (external trigger, used for CDU counters from IMU).
 * Same as incrementCounter but doesn't check TIME6 enable.
 */
export function pulseCounter(state: CounterState, id: CounterId): IncrementResult {
  const currentValue = state.values[id];
  const result = onesIncrement(currentValue);
  const overflowed = result.overflow;

  const newValues = { ...state.values };
  newValues[id] = overflowed ? 0 : result.value;

  return {
    counterState: { ...state, values: newValues },
    overflow: overflowed,
  };
}

// ─── Tick (batch time advancement) ──────────────────────────────────────────

/** Result of ticking all counters. */
export interface TickResult {
  readonly counterState: CounterState;
  readonly interruptRequests: readonly InterruptId[];
}

/**
 * Advance all active counters by the MCTs elapsed.
 *
 * Uses accumulator pattern for fractional MCT-to-increment conversion:
 * - TIME1-TIME5: 1 increment per ~853.24 MCTs (10ms period)
 * - TIME6: 1 increment per ~26.66 MCTs (312.5us period) when enabled
 * - CDU counters: external pulse only, not time-based
 */
export function tickCounters(state: CounterState, mctsElapsed: number): TickResult {
  const interruptRequests: InterruptId[] = [];
  let currentState = state;
  let accumulators = { ...state.accumulators };

  // Advance timer accumulator
  accumulators.timer = (accumulators.timer ?? 0) + mctsElapsed;

  // Process TIME1-TIME5 increments
  while (accumulators.timer >= TIMER_MCT_THRESHOLD) {
    accumulators.timer -= TIMER_MCT_THRESHOLD;

    // Increment each timer counter (TIME1-TIME5, but not TIME2 -- it cascades from TIME1)
    for (const id of [CounterId.TIME1, CounterId.TIME3, CounterId.TIME4, CounterId.TIME5]) {
      const result = incrementCounter(currentState, id);
      currentState = result.counterState;

      if (result.overflow) {
        const interrupt = COUNTER_INTERRUPTS[id];
        if (interrupt !== undefined) {
          interruptRequests.push(interrupt);
        }
      }
    }
  }

  // Advance TIME6 accumulator (only if enabled)
  if (currentState.time6Enabled) {
    accumulators.time6 = (accumulators.time6 ?? 0) + mctsElapsed;

    while (accumulators.time6 >= TIME6_MCT_THRESHOLD) {
      accumulators.time6 -= TIME6_MCT_THRESHOLD;

      const result = incrementCounter(currentState, CounterId.TIME6);
      currentState = result.counterState;

      if (result.overflow) {
        const interrupt = COUNTER_INTERRUPTS[CounterId.TIME6];
        if (interrupt !== undefined) {
          interruptRequests.push(interrupt);
        }
      }
    }
  }

  return {
    counterState: { ...currentState, accumulators },
    interruptRequests,
  };
}
