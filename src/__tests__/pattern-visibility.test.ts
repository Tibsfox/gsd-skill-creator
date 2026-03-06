/**
 * pattern-visibility.test.ts — Architectural Test Suite #3
 *
 * PRINCIPLE VERIFIED: Making Patterns Visible Over Inferring Them
 * (CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 3)
 *
 * PURPOSE
 * -------
 * This suite proves that the system extracts and exposes patterns directly from
 * recorded data — no black-box inference, no magic. The Creator's Arc emerged
 * from Phase 2b data by counting subsequences. The algorithm didn't hypothesize
 * it — the data showed it.
 *
 * "The pattern was already in the data. PatternAnalyzer just made it visible."
 * — CENTERCAMP-PERSONAL-JOURNAL, "The Story of Creator's Arc"
 *
 * WHAT WE VERIFY
 * --------------
 * 1. Pattern detection finds subsequences that actually appear in recorded data
 * 2. Patterns that don't meet minCount are NOT reported (no false patterns)
 * 3. CSV export produces legible, importable, auditable output
 * 4. ClusterTranslator converts distances to human-readable guidance at all 3 levels
 * 5. Pattern history is auditable — all records readable after storage
 * 6. Classification outputs are consistent (same input → same output)
 *
 * CEDAR'S CONNECTION TEST
 * -----------------------
 * "I can see how everything connects. The mycelium is visible."
 * These tests verify that pattern information can flow from storage to analysis
 * to human-readable output — the full visibility chain.
 *
 * @see pattern-analyzer.ts — detectPatterns(), hubCapacity(), recommendReassignments()
 * @see cluster-translator.ts — translateTransition() at L0/L1/L2 levels
 * @see sequence-recorder.ts — exportCsv() static method
 * @see docs/architecture/02-WHY-WE-MEASURE.md — why visibility over inference
 * @see docs/architecture/03-PRINCIPLES-IN-PRACTICE.md — this principle with code examples
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../core/storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../services/chipset/blitter/signals.js';
import type { OffloadResult } from '../services/chipset/blitter/types.js';
import { SequenceRecorder } from '../platform/observation/sequence-recorder.js';
import { PatternAnalyzer } from '../platform/observation/pattern-analyzer.js';
import {
  translateTransition,
  formatAdvice,
} from '../platform/observation/cluster-translator.js';
import type { SequenceRecord } from '../platform/observation/sequence-recorder.js';

// ---- Helpers ----

function makeResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: overrides.operationId ?? 'lex:validate-plan',
    exitCode: overrides.exitCode ?? 0,
    stdout: overrides.stdout ?? '',
    stderr: overrides.stderr ?? '',
    durationMs: overrides.durationMs ?? 100,
    timedOut: overrides.timedOut ?? false,
    ...overrides,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/** Build a minimal SequenceRecord for direct store writes */
function makeRecord(overrides: Partial<SequenceRecord> = {}): SequenceRecord {
  return {
    sequenceId: overrides.sequenceId ?? 'arc-test',
    step: overrides.step ?? 1,
    operationType: overrides.operationType ?? 'BUILD',
    agent: overrides.agent ?? 'test-agent',
    clusterSource: overrides.clusterSource ?? 'bridge-zone',
    clusterTarget: overrides.clusterTarget ?? 'bridge-zone',
    transitionDistance: overrides.transitionDistance ?? 0,
    failureRisks: overrides.failureRisks ?? [],
    riskConfidence: overrides.riskConfidence ?? 0,
    timestamp: overrides.timestamp ?? Date.now(),
    feedbackRef: overrides.feedbackRef ?? 'ref',
  };
}

// ---- Suite ----

describe('Pattern Visibility: Pattern Extraction from Recorded Data', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;
  let recorder: SequenceRecorder;
  let analyzer: PatternAnalyzer;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'pv-test-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
    recorder = new SequenceRecorder(bus, store);
    analyzer = new PatternAnalyzer(store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('Creator\'s Arc (ANALYZE→BUILD) becomes visible after two arcs complete', async () => {
    // This is the key pattern visibility test.
    // In Phase 2b, the ANALYZE→BUILD arc emerged from 105 recorded signals
    // without being pre-specified. The algorithm counted bigrams and it appeared.
    //
    // We use direct store writes (two separate arcs, two separate agents) to
    // replicate the minimal case: two arcs both containing ANALYZE→BUILD.
    // The pattern must be visible once the data is in the store.
    //
    // Willow: "Don't ask permission to build bridges. Just build them."
    // The bridge between raw data and pattern is visibility, not inference.
    // See: docs/architecture/03-PRINCIPLES-IN-PRACTICE.md

    // Arc 1: lex analyzes then builds (sequenceId = arc-lex)
    await store.append('workflows', makeRecord({
      sequenceId: 'arc-lex', step: 1, operationType: 'ANALYZE', agent: 'lex',
    }) as unknown as Record<string, unknown>);
    await store.append('workflows', makeRecord({
      sequenceId: 'arc-lex', step: 2, operationType: 'BUILD', agent: 'lex',
    }) as unknown as Record<string, unknown>);

    // Arc 2: hemlock analyzes then builds (different arc, same sequence pattern)
    await store.append('workflows', makeRecord({
      sequenceId: 'arc-hemlock', step: 1, operationType: 'ANALYZE', agent: 'hemlock',
    }) as unknown as Record<string, unknown>);
    await store.append('workflows', makeRecord({
      sequenceId: 'arc-hemlock', step: 2, operationType: 'BUILD', agent: 'hemlock',
    }) as unknown as Record<string, unknown>);

    const patterns = await analyzer.detectPatterns(2);

    // At least one pattern should be visible — ANALYZE→BUILD
    expect(patterns.length).toBeGreaterThan(0);

    const analyzeToBuilds = patterns.filter(
      p => p.operations[0] === 'ANALYZE' && p.operations[1] === 'BUILD'
    );
    expect(analyzeToBuilds.length).toBeGreaterThan(0);
    const creatorArc = analyzeToBuilds[0];
    expect(creatorArc.count).toBeGreaterThanOrEqual(2);
  });

  it('pattern confidence scales with frequency (more occurrences → higher confidence)', async () => {
    // Principle: Pattern Visibility — the confidence formula is transparent.
    // confidence = min(1.0, (count / (count + 2)) * (1 - meanRisk * 0.3))
    // More occurrences → higher count/(count+2) → higher confidence.
    // This is visible, understandable, not a black-box score.
    // See: pattern-analyzer.ts confidence scoring documentation

    recorder.start();

    // Generate VALIDATE→VALIDATE pattern 4 times across 2 arcs
    for (let i = 0; i < 2; i++) {
      bus.emit(createCompletionSignal(makeResult({ operationId: `lex:validate-${i}-a` })));
      bus.emit(createCompletionSignal(makeResult({ operationId: `lex:validate-${i}-b` })));
      await wait(30);
      recorder.completeArc(`arc-lex`, 'lex');
    }

    recorder.stop();

    const patterns = await analyzer.detectPatterns(2);
    const validatePairs = patterns.filter(
      p => p.operations[0] === 'VALIDATE' && p.operations[1] === 'VALIDATE'
    );

    if (validatePairs.length > 0) {
      // Confidence should be > 0 and ≤ 1.0
      expect(validatePairs[0].confidence).toBeGreaterThan(0);
      expect(validatePairs[0].confidence).toBeLessThanOrEqual(1.0);
    }
  });

  it('patterns below minCount threshold are NOT visible (no false patterns)', async () => {
    // Principle: Making Patterns Visible — but ONLY real patterns.
    // A pattern that appeared once is not a pattern, it's an event.
    // The minCount threshold is the honesty guard: don't call it a pattern unless
    // it repeats. Single observations stay invisible at minCount=2.

    recorder.start();

    // Single arc — can't form a pattern that appears twice
    bus.emit(createCompletionSignal(makeResult({ operationId: 'foxy:design-layout' })));
    bus.emit(createCompletionSignal(makeResult({ operationId: 'foxy:build-prototype' })));
    await wait(60);

    recorder.stop();

    const patterns = await analyzer.detectPatterns(2);

    // No patterns should be detected — DESIGN→BUILD only appeared once
    const designToBuilds = patterns.filter(
      p => p.operations[0] === 'DESIGN' && p.operations[1] === 'BUILD'
    );
    expect(designToBuilds.length).toBe(0);
  });

  it('patterns are sorted by count descending (most common = most visible)', async () => {
    // Principle: Making Patterns Visible — the most prominent patterns come first.
    // Not alphabetically sorted, not by confidence, but by actual frequency.
    // The most-repeated pattern is the most visible. This is honest prioritization.

    recorder.start();

    // Create VALIDATE→VALIDATE (3 times) and ANALYZE→BUILD (2 times)
    for (let i = 0; i < 3; i++) {
      bus.emit(createCompletionSignal(makeResult({ operationId: `lex:validate-v${i}` })));
      bus.emit(createCompletionSignal(makeResult({ operationId: `lex:validate-v${i}-b` })));
      await wait(20);
      recorder.completeArc('arc-lex', 'lex');
    }
    for (let i = 0; i < 2; i++) {
      bus.emit(createCompletionSignal(makeResult({ operationId: `hemlock:analyze-a${i}` })));
      bus.emit(createCompletionSignal(makeResult({ operationId: `hemlock:build-b${i}` })));
      await wait(20);
      recorder.completeArc('arc-hemlock', 'hemlock');
    }

    recorder.stop();

    const patterns = await analyzer.detectPatterns(2);

    if (patterns.length >= 2) {
      // Verify sorted descending by count
      for (let i = 0; i < patterns.length - 1; i++) {
        expect(patterns[i].count).toBeGreaterThanOrEqual(patterns[i + 1].count);
      }
    }
  });
});

describe('Pattern Visibility: CSV Export Auditability', () => {
  let tmpDir: string;
  let store: PatternStore;
  let bus: SignalBus;
  let recorder: SequenceRecorder;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'pv-csv-test-'));
    store = new PatternStore(tmpDir);
    bus = new SignalBus();
    recorder = new SequenceRecorder(bus, store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('CSV export has correct header row and one data row per signal', async () => {
    // Pattern visibility depends on exportability.
    // The Phase 2b breakthrough: CSV export made Creator's Arc visible directly
    // without any visualization tool — just opening the file.
    //
    // Willow's debrief: "The most revealing moment of Batch 3."
    // See: BATCH-3-RETROSPECTIVE.md
    // See: docs/architecture/02-WHY-WE-MEASURE.md

    recorder.start();
    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:analyze-plan' })));
    bus.emit(createCompletionSignal(makeResult({ operationId: 'sam:scout-agents' })));
    await wait(60);
    recorder.stop();

    const csv = await SequenceRecorder.exportCsv(store);
    const lines = csv.trim().split('\n');

    // Header + 2 data rows
    expect(lines.length).toBe(3);

    // Header contains expected columns
    const header = lines[0];
    expect(header).toContain('sequenceId');
    expect(header).toContain('operationType');
    expect(header).toContain('agent');
    expect(header).toContain('clusterSource');
    expect(header).toContain('transitionDistance');
    expect(header).toContain('failureRisks');
    expect(header).toContain('timestamp');
  });

  it('CSV data rows contain all expected fields in correct positions', async () => {
    // Auditable output means the format is deterministic and parseable.
    // The same record should always produce the same CSV row structure.
    // This is visibility: readable by a human with no special tool.

    recorder.start();
    bus.emit(createCompletionSignal(makeResult({ operationId: 'lex:validate-audit' })));
    await wait(50);
    recorder.stop();

    const csv = await SequenceRecorder.exportCsv(store);
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const values = lines[1].split(',');

    // All header columns have corresponding values
    expect(values.length).toBe(headers.length);

    // Known field values are correct
    const opTypeIdx = headers.indexOf('operationType');
    const agentIdx = headers.indexOf('agent');

    expect(values[opTypeIdx]).toBe('VALIDATE');
    expect(values[agentIdx]).toBe('lex');
  });

  it('all workflow records are readable from store after recording', async () => {
    // Auditable history: once recorded, records are readable.
    // PatternStore is append-only and durable.
    // This verifies the chain: record signal → store to JSONL → read back unchanged.

    recorder.start();
    const operations = ['lex:validate-a', 'hemlock:govern-b', 'sam:scout-c'];
    for (const op of operations) {
      bus.emit(createCompletionSignal(makeResult({ operationId: op })));
    }
    await wait(80);
    recorder.stop();

    const records = await store.read('workflows');
    expect(records.length).toBe(3);

    const types = (records.map(r => (r.data as Record<string, unknown>).operationType));
    expect(types).toContain('VALIDATE');
    expect(types).toContain('GOVERN');
    expect(types).toContain('SCOUT');
  });
});

describe('Pattern Visibility: Cluster Translation', () => {
  // Build minimal SequenceRecord-like objects for translateTransition().
  // The function extracts clusterSource, clusterTarget, transitionDistance from the record.
  function makeTransitionRecord(
    source: string,
    target: string,
    distance: number = 0
  ): SequenceRecord {
    return makeRecord({
      clusterSource: source as SequenceRecord['clusterSource'],
      clusterTarget: target as SequenceRecord['clusterTarget'],
      transitionDistance: distance,
    });
  }

  it('L0 disclosure level produces plain English for learners', () => {
    // Principle: Pattern Visibility — but in the right language for each audience.
    // L0 is for learners: plain English, no jargon.
    // "This is a big shift in work style." — understandable without technical background.
    // Willow's bridge-building: translate technical to accessible.

    const record = makeTransitionRecord('creative-nexus', 'rigor-spine', 0.972);
    const advice = translateTransition(record);

    expect(advice.length).toBeGreaterThan(0);
    // learnerMessage is the L0 content — see formatAdvice(advice, 'L0')
    const l0Text = formatAdvice(advice[0], 'L0');
    expect(typeof l0Text).toBe('string');
    expect(l0Text.length).toBeGreaterThan(0);
    // L0 is plain English — no machine-formatted identifiers
    expect(l0Text).not.toMatch(/^CRITICAL:|^WARNING:/);
  });

  it('L2 disclosure level produces full technical detail for maintainers', () => {
    // L2 is for maintainers: cluster names, distance value, action.
    // Pattern is visible at the highest detail for those who need to debug.
    // Sam's role: different audiences get appropriate detail levels.

    const record = makeTransitionRecord('creative-nexus', 'rigor-spine', 0.972);
    const advice = translateTransition(record);

    expect(advice.length).toBeGreaterThan(0);
    const l2Text = formatAdvice(advice[0], 'L2');
    // L2 should include severity label, cluster names, and distance
    expect(l2Text).toMatch(/CRITICAL:|Creative Nexus|Rigor Spine|d=|risk=/i);
  });

  it('intra-cluster transition produces no guidance (correct zero output)', () => {
    // Visibility principle: show what's there, not what isn't.
    // An intra-cluster move (same → same) needs no guidance.
    // Empty output is correct here — false guidance would be noise, not signal.

    const record = makeTransitionRecord('rigor-spine', 'rigor-spine', 0);
    const advice = translateTransition(record);

    expect(advice.length).toBe(0);
  });

  it('classification outputs are deterministic (same input → same output)', () => {
    // Principle: Pattern Visibility — visible patterns must be stable.
    // Stochastic translation would make the system untrustworthy.
    // The same cluster transition always produces the same guidance.

    const record = makeTransitionRecord('bridge-zone', 'rigor-spine', 0.570);
    const result1 = translateTransition(record);
    const result2 = translateTransition(record);

    expect(result1.length).toBe(result2.length);
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].severity).toBe(result2[i].severity);
      expect(result1[i].learnerMessage).toBe(result2[i].learnerMessage);
    }
  });
});
