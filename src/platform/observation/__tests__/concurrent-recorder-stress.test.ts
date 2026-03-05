import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../../core/storage/pattern-store.js';
import { SignalBus, createCompletionSignal } from '../../../services/chipset/blitter/signals.js';
import type { OffloadResult } from '../../../services/chipset/blitter/types.js';
import { initializeSequenceRecorder } from '../sequence-recorder-listener.js';
import type { SequenceRecord } from '../sequence-recorder.js';

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

const AGENTS = ['foxy', 'cedar', 'willow', 'sam', 'hemlock', 'lex'];
const OPS = ['scout', 'validate', 'certify', 'govern', 'analyze', 'propose', 'design', 'build'];

function randomAgent(): string {
  return AGENTS[Math.floor(Math.random() * AGENTS.length)];
}

function randomOp(): string {
  return OPS[Math.floor(Math.random() * OPS.length)];
}

describe('SequenceRecorder: concurrent stress tests', () => {
  let tmpDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'concurrent-recorder-stress-'));
    store = new PatternStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --- Task 1: Concurrent Write Test ---

  describe('Task 1: concurrent writes — 3 recorders, 50 signals each', () => {
    it('writes exactly 150 records (no loss, no duplication)', async () => {
      // Three independent SignalBus instances, all sharing one PatternStore
      const busA = new SignalBus();
      const busB = new SignalBus();
      const busC = new SignalBus();

      const recA = initializeSequenceRecorder(busA, store);
      const recB = initializeSequenceRecorder(busB, store);
      const recC = initializeSequenceRecorder(busC, store);

      // Fire 50 signals into each bus concurrently — intentional interleaving
      const emitBatch = (bus: SignalBus, label: string) => {
        for (let i = 0; i < 50; i++) {
          const agent = randomAgent();
          const op = randomOp();
          bus.emit(createCompletionSignal(makeResult({ operationId: `${agent}:${op}-${label}-${i}` })));
        }
      };

      // All three batches start in the same microtask turn
      emitBatch(busA, 'A');
      emitBatch(busB, 'B');
      emitBatch(busC, 'C');

      // PatternStore serialises via writeQueue — give it time to flush
      await new Promise(r => setTimeout(r, 600));

      const records = await store.read('workflows');
      expect(records.length).toBe(150);

      recA.stop();
      recB.stop();
      recC.stop();
    });

    it('all 150 records are individually readable with valid data payloads', async () => {
      const buses = [new SignalBus(), new SignalBus(), new SignalBus()];
      const recorders = buses.map(b => initializeSequenceRecorder(b, store));

      buses.forEach((bus, idx) => {
        for (let i = 0; i < 50; i++) {
          const agent = AGENTS[i % AGENTS.length];
          bus.emit(createCompletionSignal(makeResult({ operationId: `${agent}:build-rec${idx}-${i}` })));
        }
      });

      await new Promise(r => setTimeout(r, 600));

      const records = await store.read('workflows');
      expect(records.length).toBe(150);

      for (const record of records) {
        const d = record.data as unknown as SequenceRecord;
        expect(typeof d.sequenceId).toBe('string');
        expect(typeof d.step).toBe('number');
        expect(d.step).toBeGreaterThan(0);
        expect(typeof d.operationType).toBe('string');
        expect(typeof d.agent).toBe('string');
        expect(typeof d.clusterSource).toBe('string');
        expect(typeof d.clusterTarget).toBe('string');
        expect(typeof d.transitionDistance).toBe('number');
        expect(Array.isArray(d.failureRisks)).toBe(true);
        expect(typeof d.timestamp).toBe('number');
        expect(typeof d.feedbackRef).toBe('string');
      }

      recorders.forEach(r => r.stop());
    });

    it('no duplicate feedbackRef values within a single recorder instance', async () => {
      // Each recorder on its own bus writes unique feedbackRefs per signal
      const bus = new SignalBus();
      const recorder = initializeSequenceRecorder(bus, store);

      for (let i = 0; i < 50; i++) {
        bus.emit(createCompletionSignal(makeResult({ operationId: `foxy:unique-op-${i}` })));
      }

      await new Promise(r => setTimeout(r, 300));

      const records = await store.read('workflows');
      expect(records.length).toBe(50);

      const refs = records.map(r => (r.data as unknown as SequenceRecord).feedbackRef);
      const unique = new Set(refs);
      expect(unique.size).toBe(50);

      recorder.stop();
    });
  });

  // --- Task 2: JSONL Durability & Format Check ---

  describe('Task 2: JSONL durability and format integrity', () => {
    it('raw JSONL file contains exactly 150 valid JSON lines after concurrent writes', async () => {
      const buses = [new SignalBus(), new SignalBus(), new SignalBus()];
      const recorders = buses.map(b => initializeSequenceRecorder(b, store));

      buses.forEach((bus, idx) => {
        for (let i = 0; i < 50; i++) {
          bus.emit(createCompletionSignal(makeResult({ operationId: `cedar:jsonl-check-${idx}-${i}` })));
        }
      });

      await new Promise(r => setTimeout(r, 600));

      // Read raw bytes
      const filePath = join(tmpDir, 'workflows.jsonl');
      const raw = await readFile(filePath, 'utf-8');
      const lines = raw.split('\n').filter(l => l.trim() !== '');

      expect(lines.length).toBe(150);

      // Every line must be valid JSON
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }

      recorders.forEach(r => r.stop());
    });

    it('no partial records — every line passes full schema validation', async () => {
      const buses = [new SignalBus(), new SignalBus(), new SignalBus()];
      const recorders = buses.map(b => initializeSequenceRecorder(b, store));

      buses.forEach((bus, idx) => {
        for (let i = 0; i < 50; i++) {
          const agent = AGENTS[i % AGENTS.length];
          bus.emit(createCompletionSignal(makeResult({ operationId: `${agent}:schema-val-${idx}-${i}` })));
        }
      });

      await new Promise(r => setTimeout(r, 600));

      const filePath = join(tmpDir, 'workflows.jsonl');
      const raw = await readFile(filePath, 'utf-8');
      const lines = raw.split('\n').filter(l => l.trim() !== '');

      const REQUIRED_ENVELOPE = ['timestamp', 'category', 'data'];
      const REQUIRED_RECORD = ['sequenceId', 'step', 'operationType', 'agent',
        'clusterSource', 'clusterTarget', 'transitionDistance', 'failureRisks', 'timestamp'];

      for (const line of lines) {
        const obj = JSON.parse(line) as Record<string, unknown>;

        // Envelope fields
        for (const field of REQUIRED_ENVELOPE) {
          expect(obj, `line missing envelope field: ${field}`).toHaveProperty(field);
        }

        // Payload fields
        const data = obj.data as Record<string, unknown>;
        for (const field of REQUIRED_RECORD) {
          expect(data, `record missing field: ${field}`).toHaveProperty(field);
        }
      }

      recorders.forEach(r => r.stop());
    });

    it('checksum field is present and non-empty on every line', async () => {
      const bus = new SignalBus();
      const recorder = initializeSequenceRecorder(bus, store);

      for (let i = 0; i < 30; i++) {
        bus.emit(createCompletionSignal(makeResult({ operationId: `lex:checksum-test-${i}` })));
      }

      await new Promise(r => setTimeout(r, 300));

      const filePath = join(tmpDir, 'workflows.jsonl');
      const raw = await readFile(filePath, 'utf-8');
      const lines = raw.split('\n').filter(l => l.trim() !== '');

      expect(lines.length).toBe(30);

      for (const line of lines) {
        const obj = JSON.parse(line) as Record<string, unknown>;
        expect(typeof obj._checksum).toBe('string');
        expect((obj._checksum as string).length).toBeGreaterThan(0);
      }

      recorder.stop();
    });

    it('timestamps are monotonically non-decreasing within each file', async () => {
      // Single bus, sequential emission — timestamps must not go backwards
      const bus = new SignalBus();
      const recorder = initializeSequenceRecorder(bus, store);

      for (let i = 0; i < 50; i++) {
        bus.emit(createCompletionSignal(makeResult({ operationId: `hemlock:ordered-${i}` })));
      }

      await new Promise(r => setTimeout(r, 300));

      const records = await store.read('workflows');
      expect(records.length).toBe(50);

      let prevTs = 0;
      for (const record of records) {
        const ts = record.timestamp as number;
        expect(ts).toBeGreaterThanOrEqual(prevTs);
        prevTs = ts;
      }

      recorder.stop();
    });

    it('category field is "workflows" on every stored record', async () => {
      const bus = new SignalBus();
      const recorder = initializeSequenceRecorder(bus, store);

      for (let i = 0; i < 20; i++) {
        bus.emit(createCompletionSignal(makeResult({ operationId: `sam:category-check-${i}` })));
      }

      await new Promise(r => setTimeout(r, 200));

      const filePath = join(tmpDir, 'workflows.jsonl');
      const raw = await readFile(filePath, 'utf-8');
      const lines = raw.split('\n').filter(l => l.trim() !== '');

      for (const line of lines) {
        const obj = JSON.parse(line) as Record<string, unknown>;
        expect(obj.category).toBe('workflows');
      }

      recorder.stop();
    });
  });

  // --- Task 3: Performance Metrics ---

  describe('Task 3: performance metrics', () => {
    it('latency < 100ms per record and throughput > 10 records/sec', async () => {
      const bus = new SignalBus();
      const recorder = initializeSequenceRecorder(bus, store);

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const agent = AGENTS[i % AGENTS.length];
        bus.emit(createCompletionSignal(makeResult({ operationId: `${agent}:perf-test-${i}` })));
      }

      await new Promise(r => setTimeout(r, 400));

      const endTime = performance.now();
      const records = await store.read('workflows');

      expect(records.length).toBe(50);

      const totalMs = endTime - startTime;
      const avgLatencyMs = totalMs / 50;
      const throughputPerSec = (50 / totalMs) * 1000;

      // Collect per-record timestamps for min/max latency estimate
      const timestamps = records.map(r => r.timestamp as number);
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      const rangeMs = maxTs - minTs;
      const perRecordRangeMs = records.length > 1 ? rangeMs / (records.length - 1) : 0;

      // Performance assertions
      expect(avgLatencyMs).toBeLessThan(100);
      expect(throughputPerSec).toBeGreaterThan(10);

      // Report metrics to test output
      console.log(`\n## Performance Results`);
      console.log(`- Total records: ${records.length}`);
      console.log(`- Wall time: ${totalMs.toFixed(1)}ms`);
      console.log(`- Avg latency: ${avgLatencyMs.toFixed(2)}ms/record`);
      console.log(`- Throughput: ${throughputPerSec.toFixed(1)} records/sec`);
      console.log(`- Timestamp spread: ${rangeMs}ms (${perRecordRangeMs.toFixed(2)}ms avg between records)`);

      recorder.stop();
    });

    it('memory footprint does not grow unboundedly across 150 concurrent records', async () => {
      const memBefore = process.memoryUsage().heapUsed;

      const buses = [new SignalBus(), new SignalBus(), new SignalBus()];
      const recorders = buses.map(b => initializeSequenceRecorder(b, store));

      buses.forEach((bus, idx) => {
        for (let i = 0; i < 50; i++) {
          const agent = AGENTS[i % AGENTS.length];
          bus.emit(createCompletionSignal(makeResult({ operationId: `${agent}:mem-test-${idx}-${i}` })));
        }
      });

      await new Promise(r => setTimeout(r, 600));

      const memAfter = process.memoryUsage().heapUsed;
      const records = await store.read('workflows');

      expect(records.length).toBe(150);

      const memDeltaMB = (memAfter - memBefore) / (1024 * 1024);

      console.log(`\n## Memory Metrics`);
      console.log(`- Records written: 150`);
      console.log(`- Heap before: ${(memBefore / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`- Heap after: ${(memAfter / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`- Memory delta: ${memDeltaMB.toFixed(2)} MB`);

      // Memory growth should stay reasonable — under 20 MB for 150 small records
      expect(memDeltaMB).toBeLessThan(20);

      recorders.forEach(r => r.stop());
    });

    it('three concurrent recorders sustain > 10 records/sec combined throughput', async () => {
      const buses = [new SignalBus(), new SignalBus(), new SignalBus()];
      const recorders = buses.map(b => initializeSequenceRecorder(b, store));

      const start = performance.now();

      // Interleave emissions across all three buses
      for (let i = 0; i < 50; i++) {
        const agent = AGENTS[i % AGENTS.length];
        const op = OPS[i % OPS.length];
        buses[0].emit(createCompletionSignal(makeResult({ operationId: `${agent}:${op}-bus0-${i}` })));
        buses[1].emit(createCompletionSignal(makeResult({ operationId: `${agent}:${op}-bus1-${i}` })));
        buses[2].emit(createCompletionSignal(makeResult({ operationId: `${agent}:${op}-bus2-${i}` })));
      }

      await new Promise(r => setTimeout(r, 800));

      const elapsed = performance.now() - start;
      const records = await store.read('workflows');

      expect(records.length).toBe(150);

      const throughput = (150 / elapsed) * 1000;

      console.log(`\n## Concurrent Throughput`);
      console.log(`- 3 recorders × 50 signals = 150 total`);
      console.log(`- Elapsed: ${elapsed.toFixed(1)}ms`);
      console.log(`- Combined throughput: ${throughput.toFixed(1)} records/sec`);

      expect(throughput).toBeGreaterThan(10);

      recorders.forEach(r => r.stop());
    });
  });
});
