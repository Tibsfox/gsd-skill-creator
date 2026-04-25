/**
 * BatchEffect Detector tests — Phase 771 (v1.49.573 UIP-19 T2c).
 *
 * Covers core detection logic: centroid-shift test, Welch t-test, three
 * batch-effect types, edge cases, and report shape.
 *
 * Reference: Tao et al. arXiv:2604.14441.
 * Cross-link: v1.49.571 SSIA at src/skill-isotropy/.
 */

import { describe, expect, it } from 'vitest';
import {
  detectBatchEffects,
  disabledReport,
  DEFAULT_SIGNIFICANCE_LEVEL,
  DEFAULT_NUM_PROJECTION_DIRECTIONS,
} from '../batch-effect-detector.js';
import type { Embedding, BatchKey } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic PRNG (mulberry32) — avoids test-suite non-determinism. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function box(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** N i.i.d. Gaussian embeddings at a given centroid offset. */
function gaussianBatch(
  n: number,
  dim: number,
  offset: number[],
  seed: number,
  prefix: string,
): Embedding[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i}`,
    vector: Array.from({ length: dim }, (_, j) => box(rand) + (offset[j] ?? 0)),
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectBatchEffects — basic shape', () => {
  it('returns a report with the correct structure on valid input', () => {
    const dim = 8;
    const batchA = gaussianBatch(20, dim, Array(dim).fill(0), 1, 'a');
    const batchB = gaussianBatch(20, dim, Array(dim).fill(0), 2, 'b');
    const batchKey: BatchKey = { type: 'model-version', value: 'comparison' };
    const assignment = new Map<string, string>();
    batchA.forEach((e) => assignment.set(e.id, 'v1'));
    batchB.forEach((e) => assignment.set(e.id, 'v2'));
    const all = [...batchA, ...batchB];

    const report = detectBatchEffects(all, batchKey, assignment, 0.05, 4, 42);

    expect(report.embeddingCount).toBe(40);
    expect(report.embeddingDim).toBe(dim);
    expect(report.batchKey.type).toBe('model-version');
    expect(['clean', 'batch-effect-detected']).toContain(report.status);
    expect(report.evidence).toHaveLength(2); // one entry per batch value
    expect(report.maxCentroidShift).toBeGreaterThanOrEqual(0);
    expect(report.meanCentroidShift).toBeGreaterThanOrEqual(0);
    expect(typeof report.reportedAt).toBe('string');
  });

  it('returns clean status when embeddings come from the same distribution', () => {
    const dim = 16;
    const batchA = gaussianBatch(50, dim, Array(dim).fill(0), 10, 'a');
    const batchB = gaussianBatch(50, dim, Array(dim).fill(0), 11, 'b');
    const assignment = new Map<string, string>();
    batchA.forEach((e) => assignment.set(e.id, 'A'));
    batchB.forEach((e) => assignment.set(e.id, 'B'));
    const report = detectBatchEffects(
      [...batchA, ...batchB],
      { type: 'training-distribution', value: 'same-corpus' },
      assignment,
      0.001, // very strict — should still be clean on same-distribution
      8,
      99,
    );
    expect(report.status).toBe('clean');
  });

  it('handles empty embeddings gracefully', () => {
    const report = detectBatchEffects(
      [],
      { type: 'prompt-template', value: 'none' },
      new Map(),
    );
    expect(report.status).toBe('clean');
    expect(report.embeddingCount).toBe(0);
    expect(report.evidence).toHaveLength(0);
  });

  it('handles single-batch input (no comparison) and returns clean', () => {
    const dim = 4;
    const batch = gaussianBatch(10, dim, Array(dim).fill(0), 5, 'solo');
    const assignment = new Map<string, string>();
    batch.forEach((e) => assignment.set(e.id, 'only-batch'));
    const report = detectBatchEffects(
      batch,
      { type: 'model-version', value: 'single' },
      assignment,
    );
    expect(report.status).toBe('clean');
    expect(report.evidence).toHaveLength(0);
    expect(report.maxCentroidShift).toBe(0);
  });

  it('throws on dimension mismatch between embeddings', () => {
    const a: Embedding = { id: 'a', vector: [1, 2, 3] };
    const b: Embedding = { id: 'b', vector: [1, 2] };
    const assignment = new Map([['a', 'g1'], ['b', 'g2']]);
    expect(() =>
      detectBatchEffects(
        [a, b],
        { type: 'model-version', value: 'test' },
        assignment,
      ),
    ).toThrow();
  });
});

describe('detectBatchEffects — model-version batch effect', () => {
  it('detects a large centroid shift between two model versions', () => {
    const dim = 16;
    const shift = Array(dim).fill(3.0); // large constant offset
    const batchV1 = gaussianBatch(30, dim, Array(dim).fill(0), 20, 'v1');
    const batchV2 = gaussianBatch(30, dim, shift, 21, 'v2');
    const assignment = new Map<string, string>();
    batchV1.forEach((e) => assignment.set(e.id, 'model-v1'));
    batchV2.forEach((e) => assignment.set(e.id, 'model-v2'));

    const report = detectBatchEffects(
      [...batchV1, ...batchV2],
      { type: 'model-version', value: 'v1-vs-v2' },
      assignment,
      0.05,
      8,
      7,
    );

    expect(report.status).toBe('batch-effect-detected');
    expect(report.maxCentroidShift).toBeGreaterThan(1);
    expect(report.evidence.length).toBe(2);
    // At least one evidence item should have a small p-value
    const minP = Math.min(...report.evidence.map((e) => e.pValue));
    expect(minP).toBeLessThan(0.05);
  });
});

describe('detectBatchEffects — training-distribution batch effect', () => {
  it('detects distribution shift across training corpora', () => {
    const dim = 12;
    // Corpus A: zero-mean; Corpus B: offset by 2 in every dim
    const corpusA = gaussianBatch(40, dim, Array(dim).fill(0), 30, 'ca');
    const corpusB = gaussianBatch(40, dim, Array(dim).fill(2.0), 31, 'cb');
    const assignment = new Map<string, string>();
    corpusA.forEach((e) => assignment.set(e.id, 'corpus-v1'));
    corpusB.forEach((e) => assignment.set(e.id, 'corpus-v2'));

    const report = detectBatchEffects(
      [...corpusA, ...corpusB],
      { type: 'training-distribution', value: 'corpus-comparison' },
      assignment,
      0.05,
      8,
      13,
    );
    expect(report.status).toBe('batch-effect-detected');
    expect(report.batchKey.type).toBe('training-distribution');
  });
});

describe('detectBatchEffects — prompt-template batch effect', () => {
  it('detects systematic shift from different prompt templates', () => {
    const dim = 10;
    const templateA = gaussianBatch(25, dim, Array(dim).fill(0), 40, 'ta');
    const templateB = gaussianBatch(25, dim, Array(dim).fill(2.5), 41, 'tb');
    const assignment = new Map<string, string>();
    templateA.forEach((e) => assignment.set(e.id, 'template-base'));
    templateB.forEach((e) => assignment.set(e.id, 'template-instruct'));

    const report = detectBatchEffects(
      [...templateA, ...templateB],
      { type: 'prompt-template', value: 'template-comparison' },
      assignment,
      0.05,
      8,
      19,
    );
    expect(report.status).toBe('batch-effect-detected');
    expect(report.batchKey.type).toBe('prompt-template');
  });
});

describe('disabledReport', () => {
  it('returns status: disabled with empty evidence', () => {
    const r = disabledReport({ type: 'model-version', value: 'none' });
    expect(r.status).toBe('disabled');
    expect(r.evidence).toHaveLength(0);
    expect(r.embeddingCount).toBe(0);
    expect(r.maxCentroidShift).toBe(0);
  });
});

describe('BatchEffectReport JSON round-trip', () => {
  it('serialises and deserialises without loss', () => {
    const dim = 6;
    const batchA = gaussianBatch(15, dim, Array(dim).fill(0), 50, 'ra');
    const batchB = gaussianBatch(15, dim, Array(dim).fill(1.5), 51, 'rb');
    const assignment = new Map<string, string>();
    batchA.forEach((e) => assignment.set(e.id, 'batch1'));
    batchB.forEach((e) => assignment.set(e.id, 'batch2'));

    const report = detectBatchEffects(
      [...batchA, ...batchB],
      { type: 'model-version', value: 'rt-test' },
      assignment,
      0.05,
      4,
      77,
    );

    const json = JSON.stringify(report);
    const parsed = JSON.parse(json) as typeof report;

    expect(parsed.status).toBe(report.status);
    expect(parsed.embeddingCount).toBe(report.embeddingCount);
    expect(parsed.embeddingDim).toBe(report.embeddingDim);
    expect(parsed.batchKey).toEqual(report.batchKey);
    expect(parsed.evidence).toHaveLength(report.evidence.length);
    expect(parsed.maxCentroidShift).toBeCloseTo(report.maxCentroidShift, 8);
    expect(parsed.meanCentroidShift).toBeCloseTo(report.meanCentroidShift, 8);
    expect(typeof parsed.reportedAt).toBe('string');
  });
});

describe('default exported constants', () => {
  it('DEFAULT_SIGNIFICANCE_LEVEL is 0.05', () => {
    expect(DEFAULT_SIGNIFICANCE_LEVEL).toBe(0.05);
  });

  it('DEFAULT_NUM_PROJECTION_DIRECTIONS is 8', () => {
    expect(DEFAULT_NUM_PROJECTION_DIRECTIONS).toBe(8);
  });
});
