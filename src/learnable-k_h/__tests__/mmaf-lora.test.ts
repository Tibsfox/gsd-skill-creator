/**
 * JP-023 — MMAF-guided LoRA smoke tests.
 *
 * Verifies the MMAF LoRA adapter primitive from
 * src/learnable-k_h/mmaf-lora.ts (arXiv:2603.15055).
 *
 * @module learnable-k_h/__tests__/mmaf-lora.test
 */

import { describe, it, expect } from 'vitest';
import {
  createMMAFLoRA,
  computeRankNorms,
  mmafStep,
  applyDelta,
  type MMAFLoRAState,
} from '../mmaf-lora.js';

describe('createMMAFLoRA', () => {
  it('creates state with correct dimensions', () => {
    const s = createMMAFLoRA({ dim: 8, rank: 2 });
    expect(s.dim).toBe(8);
    expect(s.rank).toBe(2);
    expect(s.B.length).toBe(8 * 2);
    expect(s.A.length).toBe(2);
  });

  it('A is zero-initialised (no adapter effect at start)', () => {
    const s = createMMAFLoRA({ dim: 6, rank: 2 });
    expect(Array.from(s.A).every((v) => v === 0)).toBe(true);
  });

  it('applies default rank = floor(dim/4)', () => {
    const s = createMMAFLoRA({ dim: 16 });
    expect(s.rank).toBe(4);
  });

  it('throws when rank > dim', () => {
    expect(() => createMMAFLoRA({ dim: 4, rank: 8 })).toThrow(RangeError);
  });

  it('throws when rank < 1', () => {
    expect(() => createMMAFLoRA({ dim: 4, rank: 0 })).toThrow(RangeError);
  });
});

describe('computeRankNorms', () => {
  it('returns rank-length norms', () => {
    const s = createMMAFLoRA({ dim: 4, rank: 2 });
    const norms = computeRankNorms(s);
    expect(norms.length).toBe(2);
  });

  it('all norms are non-negative', () => {
    const s = createMMAFLoRA({ dim: 8, rank: 3 });
    const norms = computeRankNorms(s);
    for (const n of norms) expect(n).toBeGreaterThanOrEqual(0);
  });

  it('zero B produces zero norms', () => {
    const s: MMAFLoRAState = {
      B: new Float64Array(6), // all zeros
      A: new Float64Array(2),
      dim: 3,
      rank: 2,
      maskFloor: 0.01,
      lr: 0.01,
      updateCount: 0,
    };
    const norms = computeRankNorms(s);
    expect(Array.from(norms).every((v) => v === 0)).toBe(true);
  });
});

describe('mmafStep', () => {
  it('returns delta of length dim', () => {
    const s = createMMAFLoRA({ dim: 4, rank: 2, maskFloor: 0.0 });
    const grad = [0.1, -0.2, 0.3, 0.0];
    const result = mmafStep(s, grad);
    expect(result.delta.length).toBe(4);
  });

  it('rankMask has length = rank', () => {
    const s = createMMAFLoRA({ dim: 4, rank: 2 });
    const result = mmafStep(s, [1, 1, 1, 1]);
    expect(result.rankMask.length).toBe(2);
  });

  it('activeRanks + masked = total ranks', () => {
    const s = createMMAFLoRA({ dim: 4, rank: 3 });
    const result = mmafStep(s, [0.5, 0.5, 0.5, 0.5]);
    const masked = result.rankMask.filter((m) => !m).length;
    expect(result.activeRanks + masked).toBe(3);
  });

  it('all ranks masked when maskFloor is very high → delta is all zero', () => {
    const s: MMAFLoRAState = {
      B: new Float64Array([1, 0, 0, 1, 0, 0, 0, 0]), // 4×2
      A: new Float64Array(2),
      dim: 4,
      rank: 2,
      maskFloor: 1000, // nothing passes
      lr: 0.01,
      updateCount: 0,
    };
    const result = mmafStep(s, [1, 1, 1, 1]);
    expect(result.activeRanks).toBe(0);
    expect(result.delta.every((d) => d === 0)).toBe(true);
  });

  it('throws when grad.length != dim', () => {
    const s = createMMAFLoRA({ dim: 4, rank: 2 });
    expect(() => mmafStep(s, [1, 2])).toThrow(RangeError);
  });
});

describe('applyDelta', () => {
  it('applies gradient-descent step in-place', () => {
    const weights = [1.0, 2.0, 3.0];
    applyDelta(weights, [0.1, 0.2, 0.3]);
    expect(weights[0]).toBeCloseTo(0.9);
    expect(weights[1]).toBeCloseTo(1.8);
    expect(weights[2]).toBeCloseTo(2.7);
  });

  it('throws when lengths mismatch', () => {
    expect(() => applyDelta([1, 2, 3], [0.1, 0.2])).toThrow(RangeError);
  });
});
