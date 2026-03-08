/**
 * Tests for phase-complete listener wiring (Batch 3 retro item #7).
 *
 * Validates:
 *   1. startPhaseCompleteListener subscribes to 'phase-complete' events
 *   2. Phase-complete signal completes all active arcs
 *   3. Arc step counts are recorded to history for compression tracking
 *   4. Subsequent signals start fresh arcs (step resets to 1)
 *   5. Compression ratios appear on second arc run
 *   6. initializeSequenceRecorder wires the listener automatically
 *   7. stop() tears down both completion and phase-complete listeners
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../../core/storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../../../services/chipset/blitter/signals.js';
import type { OffloadResult } from '../../../services/chipset/blitter/types.js';
import { SequenceRecorder } from '../sequence-recorder.js';
import { initializeSequenceRecorder } from '../sequence-recorder-listener.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(operationId: string, exitCode = 0): OffloadResult {
  return {
    operationId,
    exitCode,
    stdout: '',
    stderr: '',
    durationMs: 100,
    timedOut: false,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('phase-complete listener', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'phase-complete-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('completeAllArcs finalizes active arcs and resets step counters', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();

    // Emit signals to create active arcs
    bus.emit(createCompletionSignal(makeResult('lex:build-module')));
    bus.emit(createCompletionSignal(makeResult('lex:validate-module')));
    bus.emit(createCompletionSignal(makeResult('hemlock:certify-output')));

    // Arcs should have steps accumulated
    expect(recorder.getArcStepCount('arc-lex')).toBe(2);
    expect(recorder.getArcStepCount('arc-hemlock')).toBe(1);

    // Complete all arcs
    recorder.completeAllArcs();

    // Steps should be reset
    expect(recorder.getArcStepCount('arc-lex')).toBe(0);
    expect(recorder.getArcStepCount('arc-hemlock')).toBe(0);

    // Allow async store writes to settle before teardown
    await new Promise(r => setTimeout(r, 100));
    recorder.stop();
  });

  it('phase-complete event triggers completeAllArcs via listener', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();
    recorder.startPhaseCompleteListener();

    // Emit signals to create active arcs
    bus.emit(createCompletionSignal(makeResult('lex:build-module')));
    bus.emit(createCompletionSignal(makeResult('lex:validate-module')));

    expect(recorder.getArcStepCount('arc-lex')).toBe(2);

    // Emit phase-complete signal
    bus.emit(createCompletionSignal(makeResult('phase:complete')), 'phase-complete');

    // Arcs should be finalized
    expect(recorder.getArcStepCount('arc-lex')).toBe(0);

    // Allow async store writes to settle before teardown
    await new Promise(r => setTimeout(r, 100));
    recorder.stop();
  });

  it('compression notes appear on second arc after phase-complete', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();
    recorder.startPhaseCompleteListener();

    // Arc 1: 3 operations
    bus.emit(createCompletionSignal(makeResult('lex:build-step-a')));
    bus.emit(createCompletionSignal(makeResult('lex:build-step-b')));
    bus.emit(createCompletionSignal(makeResult('lex:build-step-c')));

    // Complete arc 1
    bus.emit(createCompletionSignal(makeResult('phase:done')), 'phase-complete');

    // Arc 2: 2 operations (fewer steps = learning)
    bus.emit(createCompletionSignal(makeResult('lex:build-step-a')));
    bus.emit(createCompletionSignal(makeResult('lex:build-step-b')));

    // Wait for async store.append calls to settle
    await new Promise(r => setTimeout(r, 300));

    const records = await store.read('workflows');
    const lexRecords = records
      .map(r => r.data as Record<string, unknown>)
      .filter(d => d.agent === 'lex');

    // Arc 2 records should have compressionNote (comparing to baseline of 3)
    const arc2Records = lexRecords.filter(d => d.compressionNote !== undefined);
    expect(arc2Records.length).toBeGreaterThan(0);

    // The note should reference the baseline step count
    const note = arc2Records[0].compressionNote as string;
    expect(note).toMatch(/\/3/); // baseline was 3 steps
    expect(note).toMatch(/ratio/);

    recorder.stop();
  });

  it('initializeSequenceRecorder wires phase-complete listener automatically', () => {
    const recorder = initializeSequenceRecorder(bus, store);

    // Emit signals then a phase-complete
    bus.emit(createCompletionSignal(makeResult('sam:scout-deps')));
    expect(recorder.getArcStepCount('arc-sam')).toBe(1);

    bus.emit(createCompletionSignal(makeResult('phase:end')), 'phase-complete');
    expect(recorder.getArcStepCount('arc-sam')).toBe(0);

    recorder.stop();
  });

  it('stop() removes both completion and phase-complete listeners', () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();
    recorder.startPhaseCompleteListener();

    // Verify listeners are working
    bus.emit(createCompletionSignal(makeResult('lex:build-test')));
    expect(recorder.getArcStepCount('arc-lex')).toBe(1);

    // Stop everything
    recorder.stop();

    // Phase-complete should have no effect now
    bus.emit(createCompletionSignal(makeResult('phase:end')), 'phase-complete');
    // Step count should still be 1 (listener was removed, but so was completion listener)
    // Actually step is still 1 because the completion listener was also stopped
    expect(recorder.getArcStepCount('arc-lex')).toBe(1);
  });

  it('startPhaseCompleteListener is idempotent', () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();

    // Call twice — should not register duplicate listeners
    recorder.startPhaseCompleteListener();
    recorder.startPhaseCompleteListener();

    bus.emit(createCompletionSignal(makeResult('lex:build-test')));
    bus.emit(createCompletionSignal(makeResult('phase:end')), 'phase-complete');

    // Should have been completed exactly once (step = 0, not double-completed)
    expect(recorder.getArcStepCount('arc-lex')).toBe(0);

    recorder.stop();
  });

  it('phase-complete with no active arcs is a no-op', () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();
    recorder.startPhaseCompleteListener();

    // No signals emitted — no active arcs
    // Phase-complete should not throw
    bus.emit(createCompletionSignal(makeResult('phase:end')), 'phase-complete');

    // Verify nothing broke
    expect(recorder.getArcStepCount('arc-nonexistent')).toBe(0);

    recorder.stop();
  });

  it('multiple phase-complete cycles track compression across runs', async () => {
    const recorder = new SequenceRecorder(bus, store);
    recorder.start();
    recorder.startPhaseCompleteListener();

    // Run 1: 4 steps
    for (let i = 0; i < 4; i++) {
      bus.emit(createCompletionSignal(makeResult(`willow:build-step-${i}`)));
    }
    bus.emit(createCompletionSignal(makeResult('phase:1')), 'phase-complete');

    // Run 2: 3 steps (ratio 0.75)
    for (let i = 0; i < 3; i++) {
      bus.emit(createCompletionSignal(makeResult(`willow:build-step-${i}`)));
    }
    bus.emit(createCompletionSignal(makeResult('phase:2')), 'phase-complete');

    // Run 3: 2 steps (ratio 0.50)
    for (let i = 0; i < 2; i++) {
      bus.emit(createCompletionSignal(makeResult(`willow:build-step-${i}`)));
    }

    await new Promise(r => setTimeout(r, 300));

    const records = await store.read('workflows');
    const willowRecords = records
      .map(r => r.data as Record<string, unknown>)
      .filter(d => d.agent === 'willow');

    // Run 3 records should have compression notes referencing baseline of 4
    const run3 = willowRecords.filter(d =>
      d.compressionNote !== undefined &&
      (d.compressionNote as string).includes('/4'),
    );
    expect(run3.length).toBeGreaterThan(0);

    recorder.stop();
  });
});
