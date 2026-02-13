import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../storage/pattern-store.js';
import { DeterminismAnalyzer } from '../../observation/determinism-analyzer.js';
import type { DeterminismViewData, DeterminismSortField } from '../../types/dashboard.js';
import type { StoredExecutionBatch, ToolExecutionPair } from '../../types/observation.js';
import { DeterminismViewCollector } from './determinism-view.js';

function completePair(
  toolName: string,
  input: Record<string, unknown>,
  output: string,
  outputHash: string,
  sessionId: string,
): ToolExecutionPair {
  return {
    id: `pair-${toolName}-${sessionId}-${Date.now()}-${Math.random()}`,
    toolName,
    input,
    output,
    outputHash,
    status: 'complete',
    timestamp: '2026-02-13T00:00:00Z',
    context: { sessionId },
  };
}

async function storeBatch(
  store: PatternStore,
  sessionId: string,
  pairs: ToolExecutionPair[],
): Promise<void> {
  const batch: StoredExecutionBatch = {
    sessionId,
    context: { sessionId },
    pairs,
    completeCount: pairs.filter(p => p.status === 'complete').length,
    partialCount: pairs.filter(p => p.status === 'partial').length,
    capturedAt: Date.now(),
  };
  await store.append('executions', batch as unknown as Record<string, unknown>);
}

describe('DeterminismViewCollector', () => {
  let tmpDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'determinism-view-test-'));
    store = new PatternStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty operations when no execution data exists', async () => {
    const analyzer = new DeterminismAnalyzer(store);
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    expect(result.operations).toHaveLength(0);
    expect(result.totalOperations).toBe(0);
    expect(new Date(result.collectedAt).getTime()).not.toBeNaN();
  });

  it('returns per-operation breakdown with score, classification, and sampleCount', async () => {
    // Deterministic Read: same input, same outputHash across 3 sessions
    for (const sessId of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sessId, [
        completePair('Read', { file_path: '/src/a.ts' }, 'content-a', 'hash-aaa', sessId),
      ]);
    }

    // Non-deterministic Bash: same input, DIFFERENT outputHash each session
    for (const [sessId, hash] of [['sess-1', 'hash-x'], ['sess-2', 'hash-y'], ['sess-3', 'hash-z']] as const) {
      await storeBatch(store, sessId, [
        completePair('Bash', { command: 'npm test' }, `out-${hash}`, hash, sessId),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    expect(result.operations).toHaveLength(2);

    const readRow = result.operations.find(op => op.toolName === 'Read');
    expect(readRow).toBeDefined();
    expect(readRow!.score).toBeCloseTo(1.0);
    expect(readRow!.classification).toBe('deterministic');
    expect(readRow!.sampleCount).toBe(3);

    const bashRow = result.operations.find(op => op.toolName === 'Bash');
    expect(bashRow).toBeDefined();
    expect(bashRow!.score).toBeCloseTo(0.0);
    expect(bashRow!.classification).toBe('non-deterministic');
    expect(bashRow!.sampleCount).toBe(3);
  });

  it('operations are sorted by score descending by default', async () => {
    // Deterministic Read
    for (const sessId of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sessId, [
        completePair('Read', { file_path: '/src/a.ts' }, 'content-a', 'hash-aaa', sessId),
      ]);
    }

    // Non-deterministic Bash
    for (const [sessId, hash] of [['sess-1', 'hash-x'], ['sess-2', 'hash-y'], ['sess-3', 'hash-z']] as const) {
      await storeBatch(store, sessId, [
        completePair('Bash', { command: 'npm test' }, `out-${hash}`, hash, sessId),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    expect(result.operations[0].score).toBeGreaterThanOrEqual(result.operations[1].score);
  });

  it('each row contains toolName, inputHash, score, classification, sampleCount, uniqueOutputs', async () => {
    // 3 sessions with deterministic Read
    for (const sessId of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sessId, [
        completePair('Read', { file_path: '/src/a.ts' }, 'content-a', 'hash-aaa', sessId),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    const row = result.operations[0];
    expect(typeof row.toolName).toBe('string');
    expect(row.toolName).toBe('Read');
    expect(typeof row.inputHash).toBe('string');
    expect(row.inputHash.length).toBeGreaterThan(0);
    expect(typeof row.score).toBe('number');
    expect(row.score).toBeGreaterThanOrEqual(0);
    expect(row.score).toBeLessThanOrEqual(1);
    expect(['deterministic', 'semi-deterministic', 'non-deterministic']).toContain(row.classification);
    expect(typeof row.sampleCount).toBe('number');
    expect(row.sampleCount).toBeGreaterThan(0);
    expect(typeof row.uniqueOutputs).toBe('number');
    expect(row.uniqueOutputs).toBeGreaterThan(0);
  });

  it('sortBy() returns operations sorted by specified field', async () => {
    // Store data for 2 operations with different characteristics
    // Read: deterministic, 3 samples
    for (const sessId of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sessId, [
        completePair('Read', { file_path: '/src/a.ts' }, 'content-a', 'hash-aaa', sessId),
      ]);
    }

    // Bash: non-deterministic, 5 samples
    for (const [sessId, hash] of [['sess-1', 'hash-x'], ['sess-2', 'hash-y'], ['sess-3', 'hash-z'], ['sess-4', 'hash-w'], ['sess-5', 'hash-v']] as const) {
      await storeBatch(store, sessId, [
        completePair('Bash', { command: 'npm test' }, `out-${hash}`, hash, sessId),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    // Sort by sampleCount descending
    const bySampleDesc = collector.sortBy(result, 'sampleCount', 'desc');
    expect(bySampleDesc.operations[0].sampleCount).toBeGreaterThanOrEqual(bySampleDesc.operations[1].sampleCount);

    // Sort by toolName ascending
    const byToolAsc = collector.sortBy(result, 'toolName', 'asc');
    expect(byToolAsc.operations[0].toolName.localeCompare(byToolAsc.operations[1].toolName)).toBeLessThanOrEqual(0);
  });

  it('totalOperations matches operations array length', async () => {
    // 3 unique operations with 3+ observations each
    for (const sessId of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sessId, [
        completePair('Read', { file_path: '/src/a.ts' }, 'content-a', 'hash-aaa', sessId),
        completePair('Bash', { command: 'npm test' }, 'ok', 'hash-bbb', sessId),
        completePair('Grep', { pattern: 'TODO' }, 'matches', 'hash-ccc', sessId),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store);
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    expect(result.totalOperations).toBe(result.operations.length);
    expect(result.totalOperations).toBe(3);
  });

  it('respects DeterminismAnalyzer config (minSampleSize threshold)', async () => {
    // Only 2 observations for Read (below default minSampleSize of 3)
    for (const sessId of ['sess-1', 'sess-2']) {
      await storeBatch(store, sessId, [
        completePair('Read', { file_path: '/src/a.ts' }, 'content-a', 'hash-aaa', sessId),
      ]);
    }

    // 3 observations for Bash (meets threshold)
    for (const sessId of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sessId, [
        completePair('Bash', { command: 'npm test' }, 'ok', 'hash-bbb', sessId),
      ]);
    }

    const analyzer = new DeterminismAnalyzer(store, { minSampleSize: 3 });
    const collector = new DeterminismViewCollector(analyzer);
    const result = await collector.collect();

    expect(result.totalOperations).toBe(1);
    expect(result.operations[0].toolName).toBe('Bash');
  });
});
