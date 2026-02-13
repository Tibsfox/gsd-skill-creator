import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../storage/pattern-store.js';
import type { StoredExecutionBatch, ToolExecutionPair, ExecutionContext } from '../types/observation.js';
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
});
