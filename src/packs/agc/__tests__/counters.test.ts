/**
 * AGC involuntary counter system tests.
 *
 * Covers: counter definitions, increment, overflow, cascade,
 * interrupt generation, tick accumulation, TIME6 enable/disable.
 */

import { describe, it, expect } from 'vitest';
import {
  CounterId,
  COUNTER_ADDRESSES,
  COUNTER_INTERRUPTS,
  createCounterState,
  incrementCounter,
  tickCounters,
  getCounterValue,
  setCounterValue,
  setTime6Enable,
  pulseCounter,
} from '../counters.js';
import { InterruptId } from '../interrupts.js';

describe('counter definitions', () => {
  it('defines all AGC involuntary counters', () => {
    expect(CounterId.TIME1).toBeDefined();
    expect(CounterId.TIME2).toBeDefined();
    expect(CounterId.TIME3).toBeDefined();
    expect(CounterId.TIME4).toBeDefined();
    expect(CounterId.TIME5).toBeDefined();
    expect(CounterId.TIME6).toBeDefined();
    expect(CounterId.CDUX).toBeDefined();
    expect(CounterId.CDUY).toBeDefined();
    expect(CounterId.CDUZ).toBeDefined();
  });

  it('maps counters to correct erasable memory addresses', () => {
    expect(COUNTER_ADDRESSES[CounterId.TIME1]).toBe(0o24);
    expect(COUNTER_ADDRESSES[CounterId.TIME2]).toBe(0o25);
    expect(COUNTER_ADDRESSES[CounterId.TIME3]).toBe(0o26);
    expect(COUNTER_ADDRESSES[CounterId.TIME4]).toBe(0o27);
    expect(COUNTER_ADDRESSES[CounterId.TIME5]).toBe(0o30);
    expect(COUNTER_ADDRESSES[CounterId.TIME6]).toBe(0o31);
    expect(COUNTER_ADDRESSES[CounterId.CDUX]).toBe(0o32);
    expect(COUNTER_ADDRESSES[CounterId.CDUY]).toBe(0o33);
    expect(COUNTER_ADDRESSES[CounterId.CDUZ]).toBe(0o34);
  });

  it('maps overflow interrupts correctly', () => {
    expect(COUNTER_INTERRUPTS[CounterId.TIME3]).toBe(InterruptId.T3RUPT);
    expect(COUNTER_INTERRUPTS[CounterId.TIME4]).toBe(InterruptId.T4RUPT);
    expect(COUNTER_INTERRUPTS[CounterId.TIME5]).toBe(InterruptId.T5RUPT);
    expect(COUNTER_INTERRUPTS[CounterId.TIME6]).toBe(InterruptId.T6RUPT);
    // TIME1, TIME2, CDU counters have no direct interrupt
    expect(COUNTER_INTERRUPTS[CounterId.TIME1]).toBeUndefined();
    expect(COUNTER_INTERRUPTS[CounterId.TIME2]).toBeUndefined();
    expect(COUNTER_INTERRUPTS[CounterId.CDUX]).toBeUndefined();
  });
});

describe('counter state', () => {
  it('createCounterState returns all counters at zero, TIME6 disabled', () => {
    const state = createCounterState();
    expect(getCounterValue(state, CounterId.TIME1)).toBe(0);
    expect(getCounterValue(state, CounterId.TIME2)).toBe(0);
    expect(getCounterValue(state, CounterId.TIME3)).toBe(0);
    expect(getCounterValue(state, CounterId.TIME6)).toBe(0);
    expect(getCounterValue(state, CounterId.CDUX)).toBe(0);
    expect(state.time6Enabled).toBe(false);
  });
});

describe('counter increment', () => {
  it('incrementCounter adds 1 to TIME1', () => {
    let state = createCounterState();
    const result = incrementCounter(state, CounterId.TIME1);
    expect(getCounterValue(result.counterState, CounterId.TIME1)).toBe(1);
    expect(result.overflow).toBe(false);
  });

  it('incrementCounter detects overflow at max positive value (0o37777)', () => {
    let state = createCounterState();
    state = setCounterValue(state, CounterId.TIME1, 0o37777);
    const result = incrementCounter(state, CounterId.TIME1);
    expect(result.overflow).toBe(true);
    // After overflow, counter resets to 0
    expect(getCounterValue(result.counterState, CounterId.TIME1)).toBe(0);
  });

  it('TIME1 overflow cascades to TIME2', () => {
    let state = createCounterState();
    state = setCounterValue(state, CounterId.TIME1, 0o37777);
    state = setCounterValue(state, CounterId.TIME2, 5);
    const result = incrementCounter(state, CounterId.TIME1);
    expect(result.overflow).toBe(true);
    // TIME2 should have incremented
    expect(getCounterValue(result.counterState, CounterId.TIME2)).toBe(6);
  });

  it('TIME6 increment is a no-op when TIME6 is disabled', () => {
    let state = createCounterState();
    const result = incrementCounter(state, CounterId.TIME6);
    expect(getCounterValue(result.counterState, CounterId.TIME6)).toBe(0);
    expect(result.overflow).toBe(false);
  });

  it('TIME6 increments when enabled', () => {
    let state = createCounterState();
    state = setTime6Enable(state, true);
    const result = incrementCounter(state, CounterId.TIME6);
    expect(getCounterValue(result.counterState, CounterId.TIME6)).toBe(1);
  });

  it('CDU counters increment on pulse', () => {
    let state = createCounterState();
    const result = pulseCounter(state, CounterId.CDUX);
    expect(getCounterValue(result.counterState, CounterId.CDUX)).toBe(1);
  });
});

describe('tickCounters (batch update)', () => {
  it('TIME1-TIME5 increment every ~853 MCTs (10ms / 11.72us)', () => {
    let state = createCounterState();
    // Accumulate 854 MCTs -- should trigger exactly 1 increment (threshold ~853.24)
    const result = tickCounters(state, 854);
    expect(getCounterValue(result.counterState, CounterId.TIME1)).toBe(1);
    expect(getCounterValue(result.counterState, CounterId.TIME3)).toBe(1);
  });

  it('TIME6 increments every ~27 MCTs when enabled', () => {
    let state = createCounterState();
    state = setTime6Enable(state, true);
    const result = tickCounters(state, 27);
    expect(getCounterValue(result.counterState, CounterId.TIME6)).toBe(1);
  });

  it('TIME6 does not increment when disabled', () => {
    let state = createCounterState();
    const result = tickCounters(state, 100);
    expect(getCounterValue(result.counterState, CounterId.TIME6)).toBe(0);
  });

  it('returns interrupt requests on overflow', () => {
    let state = createCounterState();
    state = setCounterValue(state, CounterId.TIME3, 0o37777);
    const result = tickCounters(state, 854);
    expect(result.interruptRequests).toContain(InterruptId.T3RUPT);
  });

  it('CDU counters do not increment on time-based ticks', () => {
    let state = createCounterState();
    const result = tickCounters(state, 10000);
    expect(getCounterValue(result.counterState, CounterId.CDUX)).toBe(0);
    expect(getCounterValue(result.counterState, CounterId.CDUY)).toBe(0);
    expect(getCounterValue(result.counterState, CounterId.CDUZ)).toBe(0);
  });

  it('accumulates fractional MCTs across multiple calls', () => {
    let state = createCounterState();
    // 427 MCTs is not enough for an increment (needs ~853.24)
    let result = tickCounters(state, 427);
    expect(getCounterValue(result.counterState, CounterId.TIME1)).toBe(0);
    // Another 427 MCTs should push it over (total 854 > 853.24)
    result = tickCounters(result.counterState, 427);
    expect(getCounterValue(result.counterState, CounterId.TIME1)).toBe(1);
  });
});

describe('counter read/write', () => {
  it('getCounterValue returns the current value', () => {
    let state = createCounterState();
    state = setCounterValue(state, CounterId.TIME1, 0o12345);
    expect(getCounterValue(state, CounterId.TIME1)).toBe(0o12345);
  });

  it('setCounterValue presets the counter value', () => {
    let state = createCounterState();
    state = setCounterValue(state, CounterId.TIME3, 0o77777);
    expect(getCounterValue(state, CounterId.TIME3)).toBe(0o77777);
  });

  it('setTime6Enable toggles TIME6 operation', () => {
    let state = createCounterState();
    expect(state.time6Enabled).toBe(false);
    state = setTime6Enable(state, true);
    expect(state.time6Enabled).toBe(true);
    state = setTime6Enable(state, false);
    expect(state.time6Enabled).toBe(false);
  });
});
