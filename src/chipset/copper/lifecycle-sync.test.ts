/**
 * Tests for the Pipeline lifecycle sync bridge.
 *
 * Verifies that LifecycleSync correctly bridges GSD lifecycle events
 * to WAIT instruction promises: emit fires waiters, timeouts reject,
 * reset clears all pending, and events are not retroactively stored.
 */

import { describe, it, expect } from 'vitest';
import { LifecycleSync } from './lifecycle-sync.js';

describe('LifecycleSync', () => {
  it('emit() fires pending waiters for that event', async () => {
    const sync = new LifecycleSync();
    const promise = sync.waitFor('phase-start');
    sync.emit('phase-start');
    await expect(promise).resolves.toBeDefined();
  });

  it('waitFor() returns a promise that resolves with the event name', async () => {
    const sync = new LifecycleSync();
    const promise = sync.waitFor('tests-passing');
    sync.emit('tests-passing');
    const result = await promise;
    expect(result).toBe('tests-passing');
  });

  it('waitFor() with timeout rejects if event does not fire', async () => {
    const sync = new LifecycleSync();
    const promise = sync.waitFor('code-complete', { timeoutMs: 100 });
    // Do NOT emit -- the event never fires
    await expect(promise).rejects.toThrow(/timeout/i);
  });

  it('waitFor() with timeout resolves if event fires before timeout', async () => {
    const sync = new LifecycleSync();
    const promise = sync.waitFor('phase-planned', { timeoutMs: 500 });
    setTimeout(() => sync.emit('phase-planned'), 50);
    const result = await promise;
    expect(result).toBe('phase-planned');
  });

  it('multiple waiters on same event all resolve', async () => {
    const sync = new LifecycleSync();
    const promise1 = sync.waitFor('end-of-frame');
    const promise2 = sync.waitFor('end-of-frame');
    sync.emit('end-of-frame');
    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toBe('end-of-frame');
    expect(r2).toBe('end-of-frame');
  });

  it('emit() with no pending waiters does not throw', () => {
    const sync = new LifecycleSync();
    expect(() => sync.emit('session-start')).not.toThrow();
  });

  it('waitFor() after emit does NOT retroactively resolve (events are not stored)', async () => {
    const sync = new LifecycleSync();
    sync.emit('phase-start');
    // Now wait for the already-emitted event -- should timeout since no waiter was registered
    const promise = sync.waitFor('phase-start', { timeoutMs: 100 });
    await expect(promise).rejects.toThrow(/timeout/i);
  });

  it('reset() clears all pending waiters', async () => {
    const sync = new LifecycleSync();
    const promise = sync.waitFor('milestone-start', { timeoutMs: 200 });
    sync.reset();
    // The waiter was rejected by reset; emit after reset should not resolve it
    sync.emit('milestone-start');
    await expect(promise).rejects.toThrow(/reset/i);
  });
});
