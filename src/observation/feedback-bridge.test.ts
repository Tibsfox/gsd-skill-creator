import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import { PatternStore } from '../storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../chipset/blitter/signals.js';
import type { OffloadResult, CompletionSignal } from '../chipset/blitter/types.js';
import { FeedbackBridge } from './feedback-bridge.js';

function makeResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: overrides.operationId ?? 'Read:abc123',
    exitCode: overrides.exitCode ?? 0,
    stdout: overrides.stdout ?? 'file contents here',
    stderr: overrides.stderr ?? '',
    durationMs: overrides.durationMs ?? 150,
    timedOut: overrides.timedOut ?? false,
  };
}

describe('FeedbackBridge', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'feedback-bridge-test-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('captures completion signal and stores feedback to PatternStore', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult({ operationId: 'Read:abc123', stdout: 'hello' });
    const signal = createCompletionSignal(result);
    bus.emit(signal);

    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries.length).toBe(1);
    expect(entries[0].data.operationId).toBe('Read:abc123');
    expect(entries[0].data.status).toBe('success');
    expect(entries[0].data.exitCode).toBe(0);
    expect(entries[0].data.durationMs).toBe(150);
    expect(typeof entries[0].data.stdoutHash).toBe('string');

    bridge.stop();
  });

  it('stores stdout hash as SHA-256 of the stdout content', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult({ stdout: 'deterministic output' });
    const signal = createCompletionSignal(result);
    bus.emit(signal);

    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    const expectedHash = createHash('sha256').update('deterministic output').digest('hex');
    expect(entries[0].data.stdoutHash).toBe(expectedHash);

    bridge.stop();
  });

  it('captures failure signals with correct status and exit code', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult({ exitCode: 1 });
    const signal = createCompletionSignal(result);
    bus.emit(signal);

    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries[0].data.status).toBe('failure');
    expect(entries[0].data.exitCode).toBe(1);

    bridge.stop();
  });

  it('captures timeout signals', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult({ timedOut: true, exitCode: -1 });
    const signal = createCompletionSignal(result);
    bus.emit(signal);

    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries[0].data.status).toBe('timeout');

    bridge.stop();
  });

  it('captures error signals with error message', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult();
    const signal = createCompletionSignal(result, { error: 'spawn failed' });
    bus.emit(signal);

    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries[0].data.status).toBe('error');
    expect(entries[0].data.error).toBe('spawn failed');

    bridge.stop();
  });

  it('captures multiple signals sequentially', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    for (let i = 0; i < 3; i++) {
      const result = makeResult({ operationId: `Op:${i}` });
      const signal = createCompletionSignal(result);
      bus.emit(signal);
    }

    await new Promise(r => setTimeout(r, 100));

    const entries = await store.read('feedback');
    expect(entries.length).toBe(3);
    expect(entries[0].data.operationId).toBe('Op:0');
    expect(entries[1].data.operationId).toBe('Op:1');
    expect(entries[2].data.operationId).toBe('Op:2');

    bridge.stop();
  });

  it('stop() unregisters listener from SignalBus', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result1 = makeResult({ operationId: 'Op:1' });
    bus.emit(createCompletionSignal(result1));
    await new Promise(r => setTimeout(r, 50));

    bridge.stop();

    const result2 = makeResult({ operationId: 'Op:2' });
    bus.emit(createCompletionSignal(result2));
    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries.length).toBe(1);
  });

  it('feedback entries are readable by Copper (PatternStore category is feedback)', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult();
    bus.emit(createCompletionSignal(result));
    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries.length).toBeGreaterThanOrEqual(1);

    const data = entries[0].data as Record<string, unknown>;
    expect(typeof data.operationId).toBe('string');
    expect(['success', 'failure', 'timeout', 'error']).toContain(data.status);
    expect(typeof data.durationMs).toBe('number');
    expect(typeof data.stdoutHash).toBe('string');
    expect(typeof data.timestamp).toBe('string');

    bridge.stop();
  });

  it('does not store events when not started', async () => {
    const bridge = new FeedbackBridge(bus, store);
    // Do NOT call start()

    const result = makeResult();
    bus.emit(createCompletionSignal(result));
    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('feedback');
    expect(entries.length).toBe(0);
  });

  it('can be started and stopped multiple times', async () => {
    const bridge = new FeedbackBridge(bus, store);

    bridge.start();
    bus.emit(createCompletionSignal(makeResult({ operationId: 'Op:1' })));
    await new Promise(r => setTimeout(r, 50));
    bridge.stop();

    bridge.start();
    bus.emit(createCompletionSignal(makeResult({ operationId: 'Op:2' })));
    await new Promise(r => setTimeout(r, 50));
    bridge.stop();

    const entries = await store.read('feedback');
    expect(entries.length).toBe(2);
  });

  it('exports DriftMonitor, FeedbackBridge, and feedback types from observation barrel', async () => {
    const barrel = await import('./index.js');
    expect(barrel.DriftMonitor).toBeDefined();
    expect(barrel.FeedbackBridge).toBeDefined();
    expect(barrel.DEFAULT_DRIFT_MONITOR_CONFIG).toBeDefined();
  });
});
