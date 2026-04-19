/**
 * MA-3 + MD-2 — Sampler tests.
 *
 * Covers:
 *   - Seeded determinism: identical seed + scores + temperature → identical result
 *   - Statistical correctness: 10k samples match softmax probabilities within 2% absolute
 *   - T=0 determinism (CF-MA3-01)
 *   - Empty input guard
 *   - Single-element always returns index 0
 *   - Result fields (index, score, probability) are consistent
 *
 * @module stochastic/__tests__/sampler.test
 */

import { describe, it, expect } from 'vitest';
import { sampleByScore, mulberry32 } from '../sampler.js';
import { softmax } from '../softmax.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Run N samples and return empirical frequency array. */
function empiricalFrequencies(
  scores: readonly number[],
  temperature: number,
  n: number,
  seed: number,
): number[] {
  const rng = mulberry32(seed);
  const counts = new Array(scores.length).fill(0) as number[];
  for (let i = 0; i < n; i++) {
    const result = sampleByScore(scores, temperature, rng);
    counts[result.index]++;
  }
  return counts.map(c => c / n);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('sampleByScore', () => {
  describe('basic contract', () => {
    it('throws for empty scores array', () => {
      const rng = mulberry32(42);
      expect(() => sampleByScore([], 1.0, rng)).toThrow(RangeError);
    });

    it('always returns index 0 for single-element input', () => {
      const rng = mulberry32(1);
      const result = sampleByScore([3.14], 1.0, rng);
      expect(result.index).toBe(0);
      expect(result.score).toBe(3.14);
      expect(result.probability).toBeCloseTo(1.0, 10);
    });

    it('result.index is a valid index into scores', () => {
      const scores = [1, 2, 3, 4, 5];
      const rng = mulberry32(99);
      for (let i = 0; i < 100; i++) {
        const result = sampleByScore(scores, 1.0, rng);
        expect(result.index).toBeGreaterThanOrEqual(0);
        expect(result.index).toBeLessThan(scores.length);
      }
    });

    it('result.score matches scores[result.index]', () => {
      const scores = [0.1, 0.5, 0.9, 0.3];
      const rng = mulberry32(7);
      for (let i = 0; i < 50; i++) {
        const result = sampleByScore(scores, 0.5, rng);
        expect(result.score).toBe(scores[result.index]);
      }
    });

    it('result.probability is in (0, 1]', () => {
      const scores = [1, 2, 3];
      const rng = mulberry32(13);
      for (let i = 0; i < 50; i++) {
        const result = sampleByScore(scores, 1.0, rng);
        expect(result.probability).toBeGreaterThan(0);
        expect(result.probability).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('seeded determinism (SC-MA3-01)', () => {
    it('identical seed produces identical sequence', () => {
      const scores = [1.0, 2.0, 0.5, 3.0];
      const temperature = 0.8;

      const results1: number[] = [];
      const rng1 = mulberry32(12345);
      for (let i = 0; i < 20; i++) {
        results1.push(sampleByScore(scores, temperature, rng1).index);
      }

      const results2: number[] = [];
      const rng2 = mulberry32(12345);
      for (let i = 0; i < 20; i++) {
        results2.push(sampleByScore(scores, temperature, rng2).index);
      }

      expect(results1).toEqual(results2);
    });

    it('different seeds produce different sequences (with high probability)', () => {
      const scores = [1, 2, 3, 4, 5];
      const temperature = 1.0;

      const results1: number[] = [];
      const rng1 = mulberry32(1111);
      for (let i = 0; i < 30; i++) {
        results1.push(sampleByScore(scores, temperature, rng1).index);
      }

      const results2: number[] = [];
      const rng2 = mulberry32(9999);
      for (let i = 0; i < 30; i++) {
        results2.push(sampleByScore(scores, temperature, rng2).index);
      }

      // Seeds should produce different sequences (probability of collision < 5e-46).
      expect(results1).not.toEqual(results2);
    });
  });

  describe('T=0 determinism (CF-MA3-01)', () => {
    it('always returns argmax at T=0 regardless of rng', () => {
      const scores = [1.0, 5.0, 2.0, 3.0];
      // Even if rng always returns 0 (would select first under CDF walk).
      const rngAlwaysZero = () => 0;
      const result = sampleByScore(scores, 0, rngAlwaysZero);
      // argmax of [1, 5, 2, 3] is index 1.
      expect(result.index).toBe(1);
      expect(result.score).toBe(5.0);
    });

    it('returns argmax at T=1e-12 (well below epsilon)', () => {
      const scores = [0.1, 0.9, 0.5];
      const rng = mulberry32(42);
      for (let i = 0; i < 20; i++) {
        const result = sampleByScore(scores, 1e-12, rng);
        expect(result.index).toBe(1);
      }
    });

    it('T=0 is independent of rng calls (no rng consumed)', () => {
      const scores = [2, 1, 3];
      let callCount = 0;
      const countingRng = () => { callCount++; return 0.5; };
      sampleByScore(scores, 0, countingRng);
      // At T=0, the function should not call the rng.
      expect(callCount).toBe(0);
    });
  });

  describe('statistical correctness — 10k samples (SC-MA3-01)', () => {
    it('empirical frequencies match softmax probabilities within 2% absolute at T=1', () => {
      const scores = [1.0, 2.0, 3.0, 4.0];
      const temperature = 1.0;
      const N = 10000;
      const seed = 777;

      const theoretical = softmax(scores, temperature);
      const empirical = empiricalFrequencies(scores, temperature, N, seed);

      for (let i = 0; i < scores.length; i++) {
        const diff = Math.abs(empirical[i] - theoretical[i]);
        expect(diff).toBeLessThan(0.02); // 2% absolute tolerance
      }
    });

    it('empirical frequencies match softmax probabilities within 2% at T=0.5', () => {
      const scores = [0.5, 1.5, 1.0, 2.0];
      const temperature = 0.5;
      const N = 10000;
      const seed = 888;

      const theoretical = softmax(scores, temperature);
      const empirical = empiricalFrequencies(scores, temperature, N, seed);

      for (let i = 0; i < scores.length; i++) {
        const diff = Math.abs(empirical[i] - theoretical[i]);
        expect(diff).toBeLessThan(0.02);
      }
    });

    it('empirical frequencies match softmax probabilities within 2% at T=2', () => {
      const scores = [1.0, 1.5, 2.0, 0.5];
      const temperature = 2.0;
      const N = 10000;
      const seed = 999;

      const theoretical = softmax(scores, temperature);
      const empirical = empiricalFrequencies(scores, temperature, N, seed);

      for (let i = 0; i < scores.length; i++) {
        const diff = Math.abs(empirical[i] - theoretical[i]);
        expect(diff).toBeLessThan(0.02);
      }
    });

    it('all candidates are explored at T=1 over 10k samples', () => {
      // Coverage metric: every candidate should be selected at least once.
      const scores = [1.0, 2.0, 3.0, 4.0, 5.0];
      const rng = mulberry32(555);
      const seen = new Set<number>();
      for (let i = 0; i < 10000; i++) {
        seen.add(sampleByScore(scores, 1.0, rng).index);
      }
      expect(seen.size).toBe(scores.length);
    });
  });

  describe('mulberry32 PRNG quality', () => {
    it('produces values in [0, 1)', () => {
      const rng = mulberry32(42);
      for (let i = 0; i < 1000; i++) {
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('is deterministic for same seed', () => {
      const rng1 = mulberry32(314);
      const rng2 = mulberry32(314);
      for (let i = 0; i < 100; i++) {
        expect(rng1()).toBe(rng2());
      }
    });
  });
});
