import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../core/storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../../services/chipset/blitter/signals.js';
import type { OffloadResult } from '../../services/chipset/blitter/types.js';
import { SequenceRecorder } from './sequence-recorder.js';
import type { SequenceRecord } from './sequence-recorder.js';

function makeResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: overrides.operationId ?? 'lex:validate-plan',
    exitCode: overrides.exitCode ?? 0,
    stdout: overrides.stdout ?? '',
    stderr: overrides.stderr ?? '',
    durationMs: overrides.durationMs ?? 100,
    timedOut: overrides.timedOut ?? false,
  };
}

describe('SequenceRecorder', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'sequence-recorder-test-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('captures signal, classifies, and stores workflow record', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();

    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:validate-plan' })));
    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('workflows');
    expect(entries.length).toBe(1);
    const data = entries[0].data as unknown as SequenceRecord;
    expect(data.operationType).toBe('VALIDATE');
    expect(data.agent).toBe('lex');
    expect(data.clusterSource).toBe('rigor-spine');
    expect(data.feedbackRef).toBe('lex:validate-plan');

    recorder.stop();
  });

  it('predicts communication-failure risk for creative-nexus -> rigor-spine hop', () => {
    const recorder = new SequenceRecorder(bus, store);
    const signal = createCompletionSignal(makeResult());
    const risks = recorder.predictRisks('creative-nexus', 'rigor-spine', signal);
    expect(risks).toContain('communication-failure');
  });

  it('flags no risks for intra-cluster operations', () => {
    const recorder = new SequenceRecorder(bus, store);
    const signal = createCompletionSignal(makeResult());
    const risks = recorder.predictRisks('rigor-spine', 'rigor-spine', signal);
    expect(risks).toEqual([]);
  });

  it('defaults unknown agents to bridge-zone', () => {
    const recorder = new SequenceRecorder(bus, store);
    expect(recorder.resolveCluster('unknown-agent-x')).toBe('bridge-zone');
    expect(recorder.resolveCluster('foxy')).toBe('creative-nexus');
    expect(recorder.resolveCluster('lex')).toBe('rigor-spine');
  });

  it('exports CSV with correct header and data', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();

    bus.emit(createCompletionSignal(makeResult({ operationId: 'sam:scout-recon' })));
    bus.emit(createCompletionSignal(makeResult({ operationId: 'hemlock:validate-gate' })));
    await new Promise(r => setTimeout(r, 100));

    const csv = await SequenceRecorder.exportCsv(store);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('sequenceId,step,operationType,agent,clusterSource,clusterTarget,transitionDistance,failureRisks,timestamp');
    expect(lines.length).toBe(3); // header + 2 rows
    expect(lines[1]).toContain('SCOUT');
    expect(lines[2]).toContain('VALIDATE');

    recorder.stop();
  });

  it('tracks compression across completed arcs', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();

    // First arc: 3 steps
    for (let i = 0; i < 3; i++) {
      bus.emit(createCompletionSignal(makeResult({ operationId: `lex:build-step-${i}` })));
    }
    await new Promise(r => setTimeout(r, 100));
    recorder.completeArc('arc-lex', 'lex');

    // Second arc: step 1 should have compression note
    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:build-next' })));
    await new Promise(r => setTimeout(r, 50));

    const entries = await store.read('workflows');
    const lastEntry = entries[entries.length - 1].data as unknown as SequenceRecord;
    expect(lastEntry.compressionNote).toContain('ratio');
    expect(lastEntry.compressionNote).toContain('/3');

    recorder.stop();
  });

  it('classifies BUILD as default for unknown operation IDs', () => {
    const recorder = new SequenceRecorder(bus, store);
    const signal = createCompletionSignal(makeResult({ operationId: 'agent:random-thing' }));
    const result = recorder.classify(signal);
    expect(result.type).toBe('BUILD');
    expect(result.confidence).toBe(0.3);
  });

  it('classifies BUILD with low confidence for GUID-like operationId with no recognizable pattern', () => {
    const recorder = new SequenceRecorder(bus, store);
    const signal = createCompletionSignal(makeResult({ operationId: 'some-random-guid-12345' }));
    const result = recorder.classify(signal);
    expect(result.type).toBe('BUILD');
    expect(result.confidence).toBe(0.3);
  });
});
