import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../core/storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../../services/chipset/blitter/signals.js';
import type { OffloadResult } from '../../services/chipset/blitter/types.js';
import { FeedbackBridge } from './feedback-bridge.js';
import { SequenceRecorder } from './sequence-recorder.js';
import { initializeSequenceRecorder } from './sequence-recorder-listener.js';

function makeResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: overrides.operationId ?? 'foxy:build-op',
    exitCode: overrides.exitCode ?? 0,
    stdout: overrides.stdout ?? '',
    stderr: overrides.stderr ?? '',
    durationMs: overrides.durationMs ?? 100,
    timedOut: overrides.timedOut ?? false,
  };
}

describe('SequenceRecorder integration: listener wiring', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'seq-recorder-integration-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('initializeSequenceRecorder registers listener on completion channel', async () => {
    const recorder = initializeSequenceRecorder(bus, store);

    const result = makeResult({ operationId: 'foxy:validate-op' });
    bus.emit(createCompletionSignal(result));

    await new Promise(r => setTimeout(r, 50));

    const records = await store.read('workflows');
    expect(records.length).toBe(1);

    recorder.stop();
  });

  it('50 emitted CompletionSignals produce 50 workflow records', async () => {
    const recorder = initializeSequenceRecorder(bus, store);

    for (let i = 0; i < 50; i++) {
      const result = makeResult({ operationId: `foxy:op-${i}` });
      bus.emit(createCompletionSignal(result));
    }

    // Allow all async store.append() calls to settle
    await new Promise(r => setTimeout(r, 200));

    const records = await store.read('workflows');
    expect(records.length).toBe(50);

    recorder.stop();
  });

  it('workflow records have expected shape', async () => {
    const recorder = initializeSequenceRecorder(bus, store);

    const result = makeResult({ operationId: 'cedar:scout-mission' });
    bus.emit(createCompletionSignal(result));

    await new Promise(r => setTimeout(r, 50));

    const records = await store.read('workflows');
    expect(records.length).toBe(1);

    const data = records[0].data as Record<string, unknown>;
    expect(typeof data.sequenceId).toBe('string');
    expect(typeof data.step).toBe('number');
    expect(data.step).toBe(1);
    expect(typeof data.operationType).toBe('string');
    expect(data.agent).toBe('cedar');
    expect(typeof data.clusterSource).toBe('string');
    expect(typeof data.clusterTarget).toBe('string');
    expect(typeof data.transitionDistance).toBe('number');
    expect(Array.isArray(data.failureRisks)).toBe(true);
    expect(typeof data.timestamp).toBe('number');
    expect(data.feedbackRef).toBe('cedar:scout-mission');

    recorder.stop();
  });

  it('CSV export is readable and contains 50 data rows', async () => {
    const recorder = initializeSequenceRecorder(bus, store);

    for (let i = 0; i < 50; i++) {
      const result = makeResult({ operationId: `hemlock:analyze-${i}` });
      bus.emit(createCompletionSignal(result));
    }

    await new Promise(r => setTimeout(r, 200));

    const csv = await SequenceRecorder.exportCsv(store);
    const lines = csv.trim().split('\n');

    // First line is header
    expect(lines[0]).toContain('sequenceId');
    expect(lines[0]).toContain('operationType');
    expect(lines[0]).toContain('agent');

    // 50 data rows after the header
    expect(lines.length).toBe(51);

    recorder.stop();
  });

  it('FeedbackBridge data stays in feedback category — does not appear in workflows', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const result = makeResult({ operationId: 'lex:certify-phase' });
    bus.emit(createCompletionSignal(result));

    await new Promise(r => setTimeout(r, 50));

    // FeedbackBridge writes to 'feedback', SequenceRecorder is not running
    const feedbackRecords = await store.read('feedback');
    const workflowRecords = await store.read('workflows');

    expect(feedbackRecords.length).toBe(1);
    expect(workflowRecords.length).toBe(0);

    bridge.stop();
  });

  it('SequenceRecorder and FeedbackBridge coexist — both receive the same signal', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const recorder = initializeSequenceRecorder(bus, store);

    const result = makeResult({ operationId: 'sam:govern-standards' });
    bus.emit(createCompletionSignal(result));

    await new Promise(r => setTimeout(r, 100));

    const feedbackRecords = await store.read('feedback');
    const workflowRecords = await store.read('workflows');

    // Each listener independently wrote to its own category
    expect(feedbackRecords.length).toBe(1);
    expect(workflowRecords.length).toBe(1);

    // FeedbackBridge data is intact
    expect(feedbackRecords[0].data.operationId).toBe('sam:govern-standards');
    expect(feedbackRecords[0].data.status).toBe('success');

    // SequenceRecorder data is intact
    const wData = workflowRecords[0].data as Record<string, unknown>;
    expect(wData.agent).toBe('sam');
    expect(wData.feedbackRef).toBe('sam:govern-standards');

    bridge.stop();
    recorder.stop();
  });

  it('category isolation holds: 50 signals, both listeners active, counts match independently', async () => {
    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    const recorder = initializeSequenceRecorder(bus, store);

    for (let i = 0; i < 50; i++) {
      const result = makeResult({ operationId: `willow:propose-${i}` });
      bus.emit(createCompletionSignal(result));
    }

    await new Promise(r => setTimeout(r, 300));

    const feedbackRecords = await store.read('feedback');
    const workflowRecords = await store.read('workflows');

    expect(feedbackRecords.length).toBe(50);
    expect(workflowRecords.length).toBe(50);

    bridge.stop();
    recorder.stop();
  });

  it('stop() prevents further workflow records from being written', async () => {
    const recorder = initializeSequenceRecorder(bus, store);

    bus.emit(createCompletionSignal(makeResult({ operationId: 'foxy:build-1' })));
    await new Promise(r => setTimeout(r, 50));

    recorder.stop();

    bus.emit(createCompletionSignal(makeResult({ operationId: 'foxy:build-2' })));
    await new Promise(r => setTimeout(r, 50));

    const records = await store.read('workflows');
    expect(records.length).toBe(1);
  });
});
