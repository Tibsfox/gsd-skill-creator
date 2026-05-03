/**
 * Phase 827 / C02 — IntelligenceEventBus unit tests.
 *
 * TDD: RED phase — these tests are written before the implementation.
 *
 * Covers:
 * T1 — subscribe returns an unsubscribe handle (function).
 * T2 — publish notifies all subscribers synchronously, in subscription order.
 * T3 — calling the returned unsubscribe handle stops further notifications.
 * T4 — errors thrown in one subscriber do not break sibling subscribers.
 * T5 — multiple subscribers each receive each event exactly once.
 * T6 — getIntelligenceEventBus() returns the same singleton across calls.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IntelligenceEvent } from '../types.js';

// Helpers

function makeStatusEvent(id = 'req-1'): IntelligenceEvent {
  return {
    type: 'intelligence:status_update',
    payload: {
      request_id: id,
      status: 'in_progress',
      message: 'testing',
      at: '2026-05-03T12:00:00.000Z',
    },
  };
}

// Isolate singleton between tests — module isolation not available in vitest
// project config, so use the exported test-hook instead.
let resetBus: () => void;

beforeEach(async () => {
  // Re-import to get fresh module reference; reset the singleton.
  const mod = await import('../bus.js');
  resetBus = mod._resetIntelligenceEventBusForTesting;
  resetBus();
});

describe('Phase 827 / C02 — IntelligenceEventBus', () => {
  it('T1 — subscribe returns a callable unsubscribe handle', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();
    const handle = bus.subscribe((_e) => {});
    expect(typeof handle).toBe('function');
  });

  it('T2 — publish notifies all subscribers synchronously in subscription order', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();
    const order: number[] = [];
    bus.subscribe((_e) => order.push(1));
    bus.subscribe((_e) => order.push(2));
    bus.subscribe((_e) => order.push(3));
    bus.publish(makeStatusEvent());
    expect(order).toEqual([1, 2, 3]);
  });

  it('T3 — calling the unsubscribe handle stops further notifications', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();
    const received: IntelligenceEvent[] = [];
    const unsubscribe = bus.subscribe((e) => received.push(e));
    bus.publish(makeStatusEvent('before'));
    expect(received).toHaveLength(1);
    unsubscribe();
    bus.publish(makeStatusEvent('after'));
    expect(received).toHaveLength(1); // second publish not delivered
  });

  it('T4 — throwing subscriber does not break sibling subscribers', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();
    const results: string[] = [];
    bus.subscribe((_e) => { results.push('A'); });
    bus.subscribe((_e) => { throw new Error('subscriber B explodes'); });
    bus.subscribe((_e) => { results.push('C'); });
    // Should not throw even though subscriber B throws
    expect(() => bus.publish(makeStatusEvent())).not.toThrow();
    expect(results).toEqual(['A', 'C']);
  });

  it('T5 — multiple subscribers each receive each event exactly once', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();
    const counterA: IntelligenceEvent[] = [];
    const counterB: IntelligenceEvent[] = [];
    const counterC: IntelligenceEvent[] = [];
    bus.subscribe((e) => counterA.push(e));
    bus.subscribe((e) => counterB.push(e));
    bus.subscribe((e) => counterC.push(e));
    bus.publish(makeStatusEvent('e1'));
    bus.publish(makeStatusEvent('e2'));
    expect(counterA).toHaveLength(2);
    expect(counterB).toHaveLength(2);
    expect(counterC).toHaveLength(2);
    // Each subscriber gets distinct event objects
    expect(counterA[0]).toBe(counterB[0]);
    expect(counterA[1]).toBe(counterC[1]);
  });

  it('T6 — getIntelligenceEventBus() returns the same singleton instance across calls', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const busA = getIntelligenceEventBus();
    const busB = getIntelligenceEventBus();
    expect(busA).toBe(busB);
  });

  it('publish 100 events in tight loop — all delivered to each subscriber', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();
    const received: IntelligenceEvent[] = [];
    bus.subscribe((e) => received.push(e));
    const N = 100;
    for (let i = 0; i < N; i++) {
      bus.publish(makeStatusEvent(`req-${i}`));
    }
    expect(received).toHaveLength(N);
  });
});
