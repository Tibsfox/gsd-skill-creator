import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../storage/pattern-store.js';
import type { StoredExecutionBatch, ToolExecutionPair } from '../types/observation.js';
import { DeterminismAnalyzer } from './determinism-analyzer.js';
import { PromotionDetector } from './promotion-detector.js';

/**
 * Helper: create a complete ToolExecutionPair for test data.
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
 * Helper: create and store a StoredExecutionBatch to PatternStore.
 */
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

describe('PromotionDetector', () => {
  let tmpDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'promotion-detector-test-'));
    store = new PatternStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('identifies deterministic operations as promotion candidates', async () => {
    // 3 batches, each with 1 complete pair: same toolName='Read', same input, same output
    const input = { file_path: '/package.json' };
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'file-contents-abc', 'hash-aaa', sid),
      ]);
    }

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].operation.classification).toBe('deterministic');
    expect(candidates[0].toolName).toBe('Read');
    expect(candidates[0].frequency).toBe(3);
  });

  it('excludes non-deterministic operations', async () => {
    // 3 batches with same tool+input but ALL DIFFERENT outputs (variance 1.0)
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

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(0);
  });

  it('excludes semi-deterministic operations by default', async () => {
    // 10 batches: 9 with same output, 1 with different output
    // determinism ~0.889 (semi-deterministic), below default 0.95 threshold
    const input = { file_path: '/semi.ts' };
    for (let i = 0; i < 9; i++) {
      await storeBatch(store, `sess-same-${i}`, [
        completePair('Read', input, 'output-A', 'hash-A', `sess-same-${i}`),
      ]);
    }
    await storeBatch(store, 'sess-diff', [
      completePair('Read', input, 'output-B', 'hash-B', 'sess-diff'),
    ]);

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(0);
  });

  it('filters out non-tool-based patterns', async () => {
    // 3 batches with toolName='UnknownTool' (not in PROMOTABLE_TOOL_NAMES)
    // Same input, same output -- deterministic but NOT a recognized tool
    const input = { query: 'test' };
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('UnknownTool', input, 'result', 'hash-result', sid),
      ]);
    }

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(0);
  });

  it('includes all recognized promotable tool types', async () => {
    // 3 batches each for 'Read', 'Write', 'Bash' operations (all deterministic)
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', { file_path: '/a.ts' }, 'content-a', 'hash-ra', sid),
        completePair('Write', { file_path: '/b.ts', content: 'data' }, 'ok', 'hash-wa', sid),
        completePair('Bash', { command: 'echo hello' }, 'hello\n', 'hash-ba', sid),
      ]);
    }

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(3);
    const toolNames = candidates.map(c => c.toolName).sort();
    expect(toolNames).toEqual(['Bash', 'Read', 'Write']);
  });

  it('estimates token savings from stored execution pair data', async () => {
    // 3 batches with Read tool, known input and output sizes
    const input = { file_path: '/test.ts' };
    const output = 'x'.repeat(400);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, output, 'hash-400', sid),
      ]);
    }

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].estimatedTokenSavings).toBeGreaterThan(0);
    // Input JSON: {"file_path":"/test.ts"} = ~27 chars, output = 400 chars
    // Total = ~427 chars / 4 charsPerToken = ~107 tokens
    expect(candidates[0].estimatedTokenSavings).toBeGreaterThanOrEqual(100);
    expect(candidates[0].estimatedTokenSavings).toBeLessThanOrEqual(120);
  });

  it('reports frequency as total observation count', async () => {
    // 5 batches with same deterministic Read operation
    const input = { file_path: '/freq.ts' };
    for (let i = 0; i < 5; i++) {
      await storeBatch(store, `sess-${i}`, [
        completePair('Read', input, 'same-output', 'hash-same', `sess-${i}`),
      ]);
    }

    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].frequency).toBe(5);
  });

  it('returns empty array when no stored execution data exists', async () => {
    const detector = new PromotionDetector(store);
    const candidates = await detector.detect();

    expect(candidates).toEqual([]);
  });

  describe('composite scoring and filtering', () => {
    it('computes composite score as weighted combination of determinism, frequency, and token savings', async () => {
      // 5 batches with same deterministic Read operation
      const input = { file_path: '/test.ts' };
      const output = 'x'.repeat(200);
      for (let i = 0; i < 5; i++) {
        await storeBatch(store, `sess-${i}`, [
          completePair('Read', input, output, 'hash-200x', `sess-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store);
      const candidates = await detector.detect();

      expect(candidates).toHaveLength(1);
      expect(candidates[0].compositeScore).toBeGreaterThan(0.0);
      expect(candidates[0].compositeScore).toBeGreaterThanOrEqual(0.0);
      expect(candidates[0].compositeScore).toBeLessThanOrEqual(1.0);
    });

    it('ranks candidates by composite score descending (highest first)', async () => {
      // Operation A: high frequency (5), large output (1000 chars)
      const inputA = { file_path: '/a.ts' };
      for (let i = 0; i < 5; i++) {
        await storeBatch(store, `sess-a-${i}`, [
          completePair('Read', inputA, 'x'.repeat(1000), 'hash-1000x', `sess-a-${i}`),
        ]);
      }

      // Operation B: lower frequency (3), small output (50 chars)
      const inputB = { file_path: '/b.ts' };
      for (let i = 0; i < 3; i++) {
        await storeBatch(store, `sess-b-${i}`, [
          completePair('Read', inputB, 'y'.repeat(50), 'hash-50y', `sess-b-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store);
      const candidates = await detector.detect();

      expect(candidates).toHaveLength(2);
      // Operation A should rank first (higher composite from frequency + token savings)
      expect(candidates[0].toolName).toBe('Read');
      expect(candidates[0].frequency).toBe(5);
      expect(candidates[1].frequency).toBe(3);
      expect(candidates[0].compositeScore).toBeGreaterThan(candidates[1].compositeScore);
    });

    it('higher frequency increases composite score', async () => {
      // Operation A: high frequency (10), same output size
      const inputA = { file_path: '/freq-high.ts' };
      for (let i = 0; i < 10; i++) {
        await storeBatch(store, `sess-fh-${i}`, [
          completePair('Read', inputA, 'a'.repeat(100), 'hash-100a', `sess-fh-${i}`),
        ]);
      }

      // Operation B: low frequency (3), same output size
      const inputB = { file_path: '/freq-low.ts' };
      for (let i = 0; i < 3; i++) {
        await storeBatch(store, `sess-fl-${i}`, [
          completePair('Read', inputB, 'b'.repeat(100), 'hash-100b', `sess-fl-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store);
      const candidates = await detector.detect();

      expect(candidates).toHaveLength(2);
      const highFreq = candidates.find(c => c.frequency === 10)!;
      const lowFreq = candidates.find(c => c.frequency === 3)!;
      expect(highFreq.compositeScore).toBeGreaterThan(lowFreq.compositeScore);
    });

    it('higher token savings increases composite score', async () => {
      // Operation A: large output (2000 chars) = high token savings
      const inputA = { command: 'echo hello' };
      for (let i = 0; i < 3; i++) {
        await storeBatch(store, `sess-ts-a-${i}`, [
          completePair('Bash', inputA, 'x'.repeat(2000), 'hash-2000x', `sess-ts-a-${i}`),
        ]);
      }

      // Operation B: small output (20 chars) = low token savings
      const inputB = { file_path: '/small.ts' };
      for (let i = 0; i < 3; i++) {
        await storeBatch(store, `sess-ts-b-${i}`, [
          completePair('Read', inputB, 'y'.repeat(20), 'hash-20y', `sess-ts-b-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store);
      const candidates = await detector.detect();

      expect(candidates).toHaveLength(2);
      const highSavings = candidates.find(c => c.toolName === 'Bash')!;
      const lowSavings = candidates.find(c => c.toolName === 'Read')!;
      expect(highSavings.compositeScore).toBeGreaterThan(lowSavings.compositeScore);
    });

    it('filters candidates by minimum confidence threshold', async () => {
      // Op A: 10 obs, large output (high composite)
      const inputA = { file_path: '/high.ts' };
      for (let i = 0; i < 10; i++) {
        await storeBatch(store, `sess-cf-a-${i}`, [
          completePair('Read', inputA, 'x'.repeat(1000), 'hash-1000x', `sess-cf-a-${i}`),
        ]);
      }

      // Op B: 5 obs, medium output (medium composite)
      const inputB = { file_path: '/medium.ts' };
      for (let i = 0; i < 5; i++) {
        await storeBatch(store, `sess-cf-b-${i}`, [
          completePair('Read', inputB, 'y'.repeat(200), 'hash-200y', `sess-cf-b-${i}`),
        ]);
      }

      // Op C: 3 obs, small output (low composite)
      const inputC = { file_path: '/low.ts' };
      for (let i = 0; i < 3; i++) {
        await storeBatch(store, `sess-cf-c-${i}`, [
          completePair('Read', inputC, 'z'.repeat(20), 'hash-20z', `sess-cf-c-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store, { minDeterminism: 0.95, minConfidence: 0.5, charsPerToken: 4 });
      const candidates = await detector.detect();

      expect(candidates).toHaveLength(3);
      // All 3 returned, but meetsConfidence should reflect compositeScore >= 0.5
      const meetingConfidence = candidates.filter(c => c.meetsConfidence);
      const notMeeting = candidates.filter(c => !c.meetsConfidence);
      // At least one should meet, and at least one should not (the low scorer)
      expect(meetingConfidence.length).toBeGreaterThan(0);
      expect(notMeeting.length).toBeGreaterThan(0);
    });

    it('returns only candidates meeting confidence when filtering is applied', async () => {
      // Same setup: high, medium, low composite scores
      const inputA = { file_path: '/high2.ts' };
      for (let i = 0; i < 10; i++) {
        await storeBatch(store, `sess-fl-a-${i}`, [
          completePair('Read', inputA, 'x'.repeat(1000), 'hash-1000x', `sess-fl-a-${i}`),
        ]);
      }

      const inputB = { file_path: '/medium2.ts' };
      for (let i = 0; i < 5; i++) {
        await storeBatch(store, `sess-fl-b-${i}`, [
          completePair('Read', inputB, 'y'.repeat(200), 'hash-200y', `sess-fl-b-${i}`),
        ]);
      }

      const inputC = { file_path: '/low2.ts' };
      for (let i = 0; i < 3; i++) {
        await storeBatch(store, `sess-fl-c-${i}`, [
          completePair('Read', inputC, 'z'.repeat(20), 'hash-20z', `sess-fl-c-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store, { minDeterminism: 0.95, minConfidence: 0.5, charsPerToken: 4 });
      const candidates = await detector.detect();

      // Filter with meetsConfidence flag (PRMO-03 API pattern)
      const filtered = candidates.filter(c => c.meetsConfidence);
      expect(filtered.length).toBeLessThan(candidates.length);
      // All filtered candidates should have compositeScore >= 0.5
      for (const c of filtered) {
        expect(c.compositeScore).toBeGreaterThanOrEqual(0.5);
      }
    });

    it('composite score is 0.0-1.0 range regardless of input magnitude', async () => {
      // 100 batches with extreme output size (10000 chars)
      const input = { file_path: '/extreme.ts' };
      for (let i = 0; i < 100; i++) {
        await storeBatch(store, `sess-extreme-${i}`, [
          completePair('Read', input, 'x'.repeat(10000), 'hash-extreme', `sess-extreme-${i}`),
        ]);
      }

      const detector = new PromotionDetector(store);
      const candidates = await detector.detect();

      expect(candidates).toHaveLength(1);
      expect(candidates[0].compositeScore).toBeGreaterThan(0.0);
      expect(candidates[0].compositeScore).toBeLessThanOrEqual(1.0);
    });

    it('exports PromotionDetector and types from observation barrel', async () => {
      const barrel = await import('./index.js');
      expect(barrel.PromotionDetector).toBeDefined();
      expect(barrel.DEFAULT_PROMOTION_DETECTOR_CONFIG).toBeDefined();
      expect(barrel.PROMOTABLE_TOOL_NAMES).toBeDefined();
    });
  });
});
