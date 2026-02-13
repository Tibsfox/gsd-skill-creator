import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../storage/pattern-store.js';
import type { StoredExecutionBatch, ToolExecutionPair, ExecutionContext, DeterminismClassification, ClassifiedOperation, DeterminismConfig } from '../types/observation.js';
import { DeterminismAnalyzer } from './determinism-analyzer.js';

/**
 * Helper: create a complete ToolExecutionPair for test data.
 * Uses a predictable id format for clarity.
 */
function completePair(
  toolName: string,
  input: Record<string, unknown>,
  output: string,
  outputHash: string,
  sessionId: string,
): ToolExecutionPair {
  return {
    id: `pair-${toolName}-${sessionId}-${Date.now()}`,
    toolName,
    input,
    output,
    outputHash,
    status: 'complete',
    timestamp: '2026-02-13T00:00:00Z',
    context: { sessionId },
  };
}

/**
 * Helper: create a partial ToolExecutionPair (no output).
 */
function partialPair(
  toolName: string,
  input: Record<string, unknown>,
  sessionId: string,
): ToolExecutionPair {
  return {
    id: `pair-${toolName}-${sessionId}-partial`,
    toolName,
    input,
    output: null,
    outputHash: null,
    status: 'partial',
    timestamp: '2026-02-13T00:00:00Z',
    context: { sessionId },
  };
}

/**
 * Helper: create and store a StoredExecutionBatch to PatternStore.
 */
async function storeBatch(
  store: PatternStore,
  sessionId: string,
  pairs: ToolExecutionPair[],
): Promise<void> {
  const completeCount = pairs.filter(p => p.status === 'complete').length;
  const partialCount = pairs.filter(p => p.status === 'partial').length;
  const batch: StoredExecutionBatch = {
    sessionId,
    context: { sessionId },
    pairs,
    completeCount,
    partialCount,
    capturedAt: Date.now(),
  };
  await store.append('executions', batch as unknown as Record<string, unknown>);
}

describe('DeterminismAnalyzer', () => {
  let tmpDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'determinism-test-'));
    store = new PatternStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('computes variance score 0.0 for identical outputs across sessions', async () => {
    // 3 sessions, same tool+input, same output hash each time
    const input = { file_path: '/package.json' };
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'file-contents-abc', 'hash-aaa', sid),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    expect(results).toHaveLength(1);
    expect(results[0].varianceScore).toBe(0.0);
    expect(results[0].observationCount).toBe(3);
    expect(results[0].uniqueOutputs).toBe(1);
  });

  it('computes variance score 1.0 when all outputs are different', async () => {
    // 3 sessions, same tool+input, different output hash each time
    const input = { file_path: '/package.json' };
    await storeBatch(store, 'sess-1', [
      completePair('Read', input, 'output-a', 'hash-a', 'sess-1'),
    ]);
    await storeBatch(store, 'sess-2', [
      completePair('Read', input, 'output-b', 'hash-b', 'sess-2'),
    ]);
    await storeBatch(store, 'sess-3', [
      completePair('Read', input, 'output-c', 'hash-c', 'sess-3'),
    ]);

    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    expect(results).toHaveLength(1);
    expect(results[0].varianceScore).toBe(1.0);
    expect(results[0].uniqueOutputs).toBe(3);
  });

  it('computes intermediate variance score for mixed outputs', async () => {
    // 4 sessions: 3 have same output, 1 different
    // Expected variance: (2-1)/(4-1) = 1/3
    const input = { file_path: '/package.json' };
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'same', 'hash-same', sid),
      ]);
    }
    await storeBatch(store, 'sess-4', [
      completePair('Read', input, 'different', 'hash-different', 'sess-4'),
    ]);

    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    expect(results).toHaveLength(1);
    expect(results[0].varianceScore).toBeCloseTo(1 / 3, 5);
    expect(results[0].observationCount).toBe(4);
    expect(results[0].uniqueOutputs).toBe(2);
  });

  it('excludes operations below minimum sample size', async () => {
    // Only 2 batches -- below default minSampleSize of 3
    const input = { file_path: '/package.json' };
    await storeBatch(store, 'sess-1', [
      completePair('Read', input, 'output', 'hash-x', 'sess-1'),
    ]);
    await storeBatch(store, 'sess-2', [
      completePair('Read', input, 'output', 'hash-x', 'sess-2'),
    ]);

    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    expect(results).toHaveLength(0);
  });

  it('respects custom minimum sample size', async () => {
    // 2 batches with custom minSampleSize of 2 -- should now meet threshold
    const input = { file_path: '/package.json' };
    await storeBatch(store, 'sess-1', [
      completePair('Read', input, 'output', 'hash-x', 'sess-1'),
    ]);
    await storeBatch(store, 'sess-2', [
      completePair('Read', input, 'output', 'hash-x', 'sess-2'),
    ]);

    const analyzer = new DeterminismAnalyzer(store, { minSampleSize: 2 });
    const results = await analyzer.analyze();

    expect(results).toHaveLength(1);
  });

  it('groups by tool name AND input hash -- different inputs are separate operations', async () => {
    // 3 sessions, each with 2 different Read operations
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', { file_path: '/a.ts' }, 'content-a', 'hash-ca', sid),
        completePair('Read', { file_path: '/b.ts' }, 'content-b', 'hash-cb', sid),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    expect(results).toHaveLength(2);
    // Both should be fully deterministic (same output each time)
    expect(results[0].varianceScore).toBe(0.0);
    expect(results[1].varianceScore).toBe(0.0);
  });

  it('skips partial pairs (null outputHash)', async () => {
    // 3 sessions: each has 1 complete pair and 1 partial pair with same tool+input
    const completeInput = { file_path: '/complete.ts' };
    const partialInput = { file_path: '/partial.ts' };

    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', completeInput, 'output', 'hash-out', sid),
        partialPair('Read', partialInput, sid),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    // Only the complete pairs' operation should appear
    expect(results).toHaveLength(1);
    expect(results[0].observationCount).toBe(3);
  });

  it('reads from PatternStore only -- never touches transcript files', async () => {
    // Analyzer constructor takes PatternStore, not file paths or TranscriptParser
    // This test verifies the API surface: PatternStore is the sole data source (DTRM-05)
    const input = { file_path: '/test.ts' };
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'content', 'hash-c', sid),
      ]);
    }

    // Constructing with PatternStore only -- no transcript parser, no file paths
    const analyzer = new DeterminismAnalyzer(store);
    const results = await analyzer.analyze();

    expect(results).toHaveLength(1);
    expect(results[0].varianceScore).toBe(0.0);
  });

  describe('classify', () => {
    it('classifies operation with variance 0.0 as deterministic', async () => {
      // 3 batches with same tool+input+output (all identical)
      const input = { file_path: '/deterministic.ts' };
      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Read', input, 'same-content', 'hash-same', sid),
        ]);
      }

      const analyzer = new DeterminismAnalyzer(store);
      const results = await analyzer.classify();

      expect(results).toHaveLength(1);
      expect(results[0].classification).toBe('deterministic');
      expect(results[0].determinism).toBe(1.0);
    });

    it('classifies operation with variance 1.0 as non-deterministic', async () => {
      // 3 batches with same tool+input but all different outputs
      const input = { file_path: '/nondeterministic.ts' };
      await storeBatch(store, 'sess-1', [
        completePair('Read', input, 'output-a', 'hash-a', 'sess-1'),
      ]);
      await storeBatch(store, 'sess-2', [
        completePair('Read', input, 'output-b', 'hash-b', 'sess-2'),
      ]);
      await storeBatch(store, 'sess-3', [
        completePair('Read', input, 'output-c', 'hash-c', 'sess-3'),
      ]);

      const analyzer = new DeterminismAnalyzer(store);
      const results = await analyzer.classify();

      expect(results).toHaveLength(1);
      expect(results[0].classification).toBe('non-deterministic');
    });

    it('classifies semi-deterministic for intermediate variance', async () => {
      // 10 observations: 9 with output 'A', 1 with output 'B' (same tool+input)
      // variance = (2-1)/(10-1) = 1/9 = 0.111 -> determinism = 0.889 -> semi-deterministic
      const input = { file_path: '/semi.ts' };
      for (let i = 0; i < 9; i++) {
        await storeBatch(store, `sess-same-${i}`, [
          completePair('Read', input, 'output-A', 'hash-A', `sess-same-${i}`),
        ]);
      }
      await storeBatch(store, 'sess-diff', [
        completePair('Read', input, 'output-B', 'hash-B', 'sess-diff'),
      ]);

      const analyzer = new DeterminismAnalyzer(store);
      const results = await analyzer.classify();

      expect(results).toHaveLength(1);
      expect(results[0].classification).toBe('semi-deterministic');
      expect(results[0].determinism).toBeCloseTo(1 - 1 / 9, 5);
    });

    it('uses custom classification thresholds', async () => {
      // 5 batches: 4 with output 'same', 1 with output 'diff'
      // Variance = (2-1)/(5-1) = 0.25, determinism = 0.75
      const input = { file_path: '/custom-threshold.ts' };
      for (let i = 0; i < 4; i++) {
        await storeBatch(store, `sess-s-${i}`, [
          completePair('Read', input, 'same', 'hash-same', `sess-s-${i}`),
        ]);
      }
      await storeBatch(store, 'sess-d', [
        completePair('Read', input, 'diff', 'hash-diff', 'sess-d'),
      ]);

      // With default thresholds (0.95/0.7): determinism 0.75 is semi-deterministic
      const defaultAnalyzer = new DeterminismAnalyzer(store);
      const defaultResults = await defaultAnalyzer.classify();
      expect(defaultResults).toHaveLength(1);
      expect(defaultResults[0].classification).toBe('semi-deterministic');

      // With custom thresholds { deterministicThreshold: 0.7, semiDeterministicThreshold: 0.5 }: deterministic
      const customAnalyzer = new DeterminismAnalyzer(store, {
        minSampleSize: 3,
        deterministicThreshold: 0.7,
        semiDeterministicThreshold: 0.5,
      });
      const customResults = await customAnalyzer.classify();
      expect(customResults).toHaveLength(1);
      expect(customResults[0].classification).toBe('deterministic');
    });

    it('classify returns results sorted by determinism descending (most deterministic first)', async () => {
      // Create 2 operations: one deterministic (all same outputs), one non-deterministic (all different)
      const deterministicInput = { file_path: '/stable.ts' };
      const nonDeterministicInput = { file_path: '/unstable.ts' };

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Read', deterministicInput, 'stable-output', 'hash-stable', sid),
          completePair('Read', nonDeterministicInput, `output-${sid}`, `hash-${sid}`, sid),
        ]);
      }

      const analyzer = new DeterminismAnalyzer(store);
      const results = await analyzer.classify();

      expect(results).toHaveLength(2);
      // First result should be deterministic (highest determinism)
      expect(results[0].classification).toBe('deterministic');
      expect(results[0].determinism).toBe(1.0);
      // Second result should be non-deterministic (lowest determinism)
      expect(results[1].classification).toBe('non-deterministic');
      expect(results[1].determinism).toBe(0.0);
    });

    it('exports DeterminismAnalyzer and types from observation barrel', async () => {
      // Import from observation barrel to verify exports are wired
      const barrel = await import('./index.js');
      expect(barrel.DeterminismAnalyzer).toBeDefined();

      // Type imports verified at compile time via the import statement at the top
      // Runtime check that DEFAULT_DETERMINISM_CONFIG is exported
      expect(barrel.DEFAULT_DETERMINISM_CONFIG).toBeDefined();
      expect(barrel.DEFAULT_DETERMINISM_CONFIG.minSampleSize).toBe(3);
    });
  });
});
