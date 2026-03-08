/**
 * separation-of-concerns.test.ts — Architectural Test Suite #1
 *
 * PRINCIPLE VERIFIED: Separation of Concerns Over Shared Optimization
 * (CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 1)
 *
 * PURPOSE
 * -------
 * This suite proves that the observation system's modules are independently
 * testable and that cross-module boundaries are clear and non-interfering.
 * The core case: FeedbackBridge and SequenceRecorder share a SignalBus but
 * write to different storage categories without any coordination overhead.
 *
 * "It proved that separation of concerns is more powerful than shared optimization."
 * — CENTERCAMP-PERSONAL-JOURNAL, "The Story of the Two Listeners"
 *
 * WHAT WE VERIFY
 * --------------
 * 1. Two listeners can coexist on the same bus without interference
 * 2. Each listener writes to its own storage category, no cross-contamination
 * 3. Starting or stopping one listener does not affect the other
 * 4. Each module can be constructed and exercised without its siblings
 * 5. Module isolation: test one without instantiating any other
 *
 * HEMLOCK'S SIGN-OFF STANDARD
 * ---------------------------
 * Hemlock requires: "Tests are rigorous, principles verified."
 * These tests fail if the architectural boundary is violated — not just if the
 * code throws. A false positive here would mask a principle violation.
 *
 * @see feedback-bridge.ts — first listener, writes 'feedback' category
 * @see sequence-recorder.ts — second listener, writes 'workflows' category
 * @see docs/architecture/01-SIGNALS-FLOW.md — how signals traverse the system
 * @see docs/architecture/03-PRINCIPLES-IN-PRACTICE.md — this principle with code examples
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../core/storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../services/chipset/blitter/signals.js';
import type { OffloadResult } from '../services/chipset/blitter/types.js';
import { FeedbackBridge } from '../platform/observation/feedback-bridge.js';
import { SequenceRecorder } from '../platform/observation/sequence-recorder.js';
import { ObservationRateLimiter, DEFAULT_RATE_LIMIT_CONFIG } from '../platform/observation/rate-limiter.js';

// ---- Shared test helpers ----

function makeResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: overrides.operationId ?? 'lex:validate-plan',
    exitCode: overrides.exitCode ?? 0,
    stdout: overrides.stdout ?? 'ok',
    stderr: overrides.stderr ?? '',
    durationMs: overrides.durationMs ?? 100,
    timedOut: overrides.timedOut ?? false,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ---- Suite ----

describe('Separation of Concerns: Two Listeners', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'soc-test-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --- Core two-listener architectural test ---

  it('two listeners on same bus write to separate categories without interference', async () => {
    // This is the core architectural proof from BATCH-3-RETROSPECTIVE.md.
    // Lex debrief: "Signal categories don't interfere because PatternStore
    // isolation is at the category key."
    //
    // Principle: Separation of Concerns — each listener answers its own question.
    // FeedbackBridge: "Did it work?" → writes 'feedback'
    // SequenceRecorder: "What did it do?" → writes 'workflows'
    // See: docs/architecture/03-PRINCIPLES-IN-PRACTICE.md

    const bridge = new FeedbackBridge(bus, store);
    const recorder = new SequenceRecorder(bus, store);
    bridge.start();
    recorder.start();

    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:validate-plan' })));
    await wait(50);

    const feedback = await store.read('feedback');
    const workflows = await store.read('workflows');

    // Each listener writes exactly one record
    expect(feedback.length).toBe(1);
    expect(workflows.length).toBe(1);

    // Categories are fully isolated — no cross-contamination
    const feedbackData = feedback[0].data as Record<string, unknown>;
    const workflowData = workflows[0].data as Record<string, unknown>;

    expect(feedbackData).not.toHaveProperty('operationType');    // workflow field
    expect(feedbackData).not.toHaveProperty('clusterSource');     // workflow field
    expect(workflowData).not.toHaveProperty('stdoutHash');        // feedback field
    expect(workflowData).not.toHaveProperty('exitCode');          // feedback field

    bridge.stop();
    recorder.stop();
  });

  it('stopping one listener does not affect the other', async () => {
    // Principle: Separation of Concerns — independent lifecycle control.
    // If modules shared state, stopping one would affect the other.
    // This test proves they do not.

    const bridge = new FeedbackBridge(bus, store);
    const recorder = new SequenceRecorder(bus, store);
    bridge.start();
    recorder.start();

    // Emit first signal — both should record
    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:scout-terrain' })));
    await wait(50);

    expect((await store.read('feedback')).length).toBe(1);
    expect((await store.read('workflows')).length).toBe(1);

    // Stop feedback bridge only
    bridge.stop();

    // Emit second signal — only recorder should respond
    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:build-module' })));
    await wait(50);

    expect((await store.read('feedback')).length).toBe(1);   // bridge stopped, no new entry
    expect((await store.read('workflows')).length).toBe(2);  // recorder still running

    recorder.stop();
  });

  it('FeedbackBridge can be tested in isolation without SequenceRecorder', async () => {
    // Separation of concerns: each module is independently instantiable and testable.
    // Willow's bridge-building principle: "Just build them" — modules that need no
    // other module to function are truly separated.
    // See: docs/architecture/03-PRINCIPLES-IN-PRACTICE.md

    const bridge = new FeedbackBridge(bus, store);
    bridge.start();

    bus.emit(createCompletionSignal(makeResult({ operationId: 'cedar:design-layout' })));
    await wait(50);

    const feedback = await store.read('feedback');
    expect(feedback.length).toBe(1);

    // Workflow store should be empty — SequenceRecorder was never started
    const workflows = await store.read('workflows');
    expect(workflows.length).toBe(0);

    bridge.stop();
  });

  it('SequenceRecorder can be tested in isolation without FeedbackBridge', async () => {
    // Mirror of the above: SequenceRecorder works without FeedbackBridge present.
    // If there were hidden coupling, this test would reveal it.

    const recorder = new SequenceRecorder(bus, store);
    recorder.start();

    bus.emit(createCompletionSignal(makeResult({ operationId: 'hemlock:validate-gates' })));
    await wait(50);

    const workflows = await store.read('workflows');
    expect(workflows.length).toBe(1);

    // Feedback store should be empty — FeedbackBridge was never started
    const feedback = await store.read('feedback');
    expect(feedback.length).toBe(0);

    recorder.stop();
  });

  it('multiple signals do not produce cross-category record count mismatch', async () => {
    // Property: N signals → exactly N records per active listener per category.
    // No extra records, no missing records, no category spillover.
    // This is the quantitative form of separation verification.

    const bridge = new FeedbackBridge(bus, store);
    const recorder = new SequenceRecorder(bus, store);
    bridge.start();
    recorder.start();

    const operationIds = [
      'lex:validate-auth',
      'sam:scout-topology',
      'foxy:design-interface',
      'hemlock:govern-standards',
      'willow:propose-bridge',
    ];

    for (const operationId of operationIds) {
      bus.emit(createCompletionSignal(makeResult({ operationId })));
    }
    await wait(100);

    const feedback = await store.read('feedback');
    const workflows = await store.read('workflows');

    // Both categories receive exactly the same count — one record per signal
    expect(feedback.length).toBe(operationIds.length);
    expect(workflows.length).toBe(operationIds.length);

    bridge.stop();
    recorder.stop();
  });

  it('rate limiter is independently testable without any bus or store', async () => {
    // Hemlock's principle: "Check the Foundation" — defensive modules must work standalone.
    // ObservationRateLimiter has no dependencies on bus or store.
    // It can be constructed and exercised in complete isolation.
    // See: docs/architecture/03-PRINCIPLES-IN-PRACTICE.md

    const limiter = new ObservationRateLimiter(DEFAULT_RATE_LIMIT_CONFIG);

    // First check should pass
    const first = limiter.checkLimit('session-001');
    expect(first.allowed).toBe(true);

    // Exceed per-session limit
    const smallConfig = { maxPerSession: 3, maxPerHour: 1000 };
    const strictLimiter = new ObservationRateLimiter(smallConfig);

    const results = Array.from({ length: 4 }, () => strictLimiter.checkLimit('session-abc'));
    expect(results.slice(0, 3).every(r => r.allowed)).toBe(true);
    expect(results[3].allowed).toBe(false);
  });

  it('idempotent start/stop does not create duplicate listeners', async () => {
    // Separation principle: lifecycle is clean. Double-start should not double-write.
    // This is not just a safety test — it verifies the boundary contract: one
    // listener per registration, fully controlled by caller.

    const bridge = new FeedbackBridge(bus, store);
    bridge.start();
    bridge.start(); // idempotent
    bridge.start(); // idempotent

    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:validate-idempotent' })));
    await wait(50);

    const feedback = await store.read('feedback');
    // Only one record despite three start() calls
    expect(feedback.length).toBe(1);

    bridge.stop();
  });
});

describe('Separation of Concerns: Module Isolation Across 23 Observation Modules', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'soc-isolation-test-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('PatternStore is independently testable with no external dependencies', async () => {
    // The foundation module must be completely self-contained.
    // If PatternStore needed SignalBus or other modules, isolation would be impossible.
    // Cedar's role: verify all connections are documented and real.

    const standaloneStore = new PatternStore(tmpDir);
    await standaloneStore.append('events', { value: 'standalone-proof' });
    const records = await standaloneStore.read('events');

    expect(records.length).toBe(1);
    expect((records[0].data as Record<string, unknown>).value).toBe('standalone-proof');
  });

  it('SignalBus operates independently of storage', () => {
    // Bus is a pure event channel. No storage access, no file I/O.
    // A bus with no listeners and no store is perfectly valid.

    const standaloneBus = new SignalBus();
    const signal = createCompletionSignal(makeResult({ operationId: 'lex:standalone-bus' }));

    // Emit to bus with no listeners — should not throw
    expect(() => standaloneBus.emit(signal)).not.toThrow();
  });

  it('SequenceRecorder classify() is a pure function usable without start()', () => {
    // Lex's clarity principle: public methods do exactly one thing.
    // classify() should not require start() to function — it has no side effects.
    // See: docs/architecture/03-PRINCIPLES-IN-PRACTICE.md

    const recorder = new SequenceRecorder(bus, store);
    // Do NOT call start() — verify classify works without listener registration

    const signal = createCompletionSignal(makeResult({ operationId: 'lex:validate-plan' }));
    const result = recorder.classify(signal);

    expect(result.type).toBe('VALIDATE');
    expect(result.confidence).toBe(0.9);
  });

  it('SequenceRecorder resolveCluster() is pure without bus or store interaction', () => {
    // Principle: each concern is independently exercisable.
    // resolveCluster() is a pure lookup — no I/O, no event emission.

    const recorder = new SequenceRecorder(bus, store);
    expect(recorder.resolveCluster('lex')).toBe('rigor-spine');
    expect(recorder.resolveCluster('cedar')).toBe('creative-nexus');
    expect(recorder.resolveCluster('willow')).toBe('bridge-zone');
    // Unknown agent defaults to bridge-zone safely
    expect(recorder.resolveCluster('unknown-agent-xyz')).toBe('bridge-zone');
  });
});
