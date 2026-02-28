/**
 * Tests for Offload signal system: completion signal creation,
 * signal bus event emission, and listener management.
 */

import { describe, it, expect, vi } from 'vitest';
import { createCompletionSignal, SignalBus } from './signals.js';
import type { OffloadResult, CompletionSignal } from './types.js';

/**
 * Helper: create a OffloadResult fixture.
 */
function makeResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: 'test:op',
    exitCode: 0,
    stdout: '',
    stderr: '',
    durationMs: 100,
    timedOut: false,
    ...overrides,
  };
}

describe('createCompletionSignal', () => {
  it('creates success signal from exitCode 0 result', () => {
    const result = makeResult({ exitCode: 0 });
    const signal = createCompletionSignal(result);

    expect(signal.status).toBe('success');
    expect(signal.operationId).toBe('test:op');
    expect(signal.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(signal.result).toEqual(result);
    expect(signal.error).toBeUndefined();
  });

  it('creates failure signal from nonzero exit code', () => {
    const result = makeResult({ exitCode: 1 });
    const signal = createCompletionSignal(result);

    expect(signal.status).toBe('failure');
  });

  it('creates timeout signal when timedOut is true (precedence over exit code)', () => {
    const result = makeResult({ timedOut: true, exitCode: 143 });
    const signal = createCompletionSignal(result);

    expect(signal.status).toBe('timeout');
  });

  it('creates error signal when error option is provided', () => {
    const result = makeResult({ exitCode: -1 });
    const signal = createCompletionSignal(result, { error: 'spawn failed' });

    expect(signal.status).toBe('error');
    expect(signal.error).toBe('spawn failed');
  });
});

describe('SignalBus', () => {
  it('calls listeners when signal is emitted', () => {
    const bus = new SignalBus();
    const callback = vi.fn();

    bus.on('completion', callback);

    const signal = createCompletionSignal(makeResult());
    bus.emit(signal);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(signal);
  });

  it('notifies multiple listeners on same event', () => {
    const bus = new SignalBus();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    bus.on('completion', cb1);
    bus.on('completion', cb2);

    const signal = createCompletionSignal(makeResult());
    bus.emit(signal);

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('off() removes a listener so it is not called', () => {
    const bus = new SignalBus();
    const callback = vi.fn();

    bus.on('completion', callback);
    bus.off('completion', callback);

    const signal = createCompletionSignal(makeResult());
    bus.emit(signal);

    expect(callback).not.toHaveBeenCalled();
  });

  it('once() listener fires only on first emission', () => {
    const bus = new SignalBus();
    const callback = vi.fn();

    bus.once('completion', callback);

    const signal1 = createCompletionSignal(makeResult({ operationId: 'op1' }));
    const signal2 = createCompletionSignal(makeResult({ operationId: 'op2' }));
    bus.emit(signal1);
    bus.emit(signal2);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(signal1);
  });

  it('waitFor() returns a promise that resolves on next signal', async () => {
    const bus = new SignalBus();

    const promise = bus.waitFor('completion');

    const signal = createCompletionSignal(makeResult({ operationId: 'waited' }));
    bus.emit(signal);

    const received = await promise;
    expect(received.operationId).toBe('waited');
  });
});
