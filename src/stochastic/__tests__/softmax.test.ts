/**
 * MA-3 + MD-2 — Softmax tests.
 *
 * Covers:
 *   - Numerical stability (large score magnitudes, no NaN/Inf in output)
 *   - Temperature → 0 returns one-hot argmax (CF-MA3-01 / CF-MD2-01)
 *   - Temperature → ∞ returns near-uniform distribution
 *   - Probabilities sum to 1 across all cases
 *   - Correct argmax selection with ties
 *
 * @module stochastic/__tests__/softmax.test
 */

import { describe, it, expect } from 'vitest';
import { softmax, TEMPERATURE_EPSILON } from '../softmax.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function isNormalized(probs: number[], tol = 1e-10): boolean {
  return Math.abs(sum(probs) - 1.0) < tol;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('softmax', () => {
  describe('basic contract', () => {
    it('returns empty array for empty input', () => {
      expect(softmax([], 1.0)).toEqual([]);
    });

    it('returns [1] for single-element input', () => {
      const probs = softmax([42], 1.0);
      expect(probs).toHaveLength(1);
      expect(probs[0]).toBeCloseTo(1.0, 10);
    });

    it('probabilities sum to 1.0 for typical inputs', () => {
      const probs = softmax([1, 2, 3, 4], 1.0);
      expect(isNormalized(probs)).toBe(true);
    });

    it('all probabilities are in [0, 1]', () => {
      const probs = softmax([0.5, -1.0, 2.3, 0.0], 0.5);
      for (const p of probs) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });

    it('higher-scored candidates receive higher probability at T=1', () => {
      const probs = softmax([1, 2, 3], 1.0);
      expect(probs[2]).toBeGreaterThan(probs[1]);
      expect(probs[1]).toBeGreaterThan(probs[0]);
    });
  });

  describe('numerical stability', () => {
    it('handles very large positive scores without NaN or Inf', () => {
      // Without max-subtraction, exp(1000) would overflow.
      const probs = softmax([1000, 999, 998], 1.0);
      for (const p of probs) {
        expect(Number.isFinite(p)).toBe(true);
        expect(Number.isNaN(p)).toBe(false);
      }
      expect(isNormalized(probs)).toBe(true);
    });

    it('handles very large negative scores without NaN or zero-sum', () => {
      const probs = softmax([-1000, -999, -998], 1.0);
      for (const p of probs) {
        expect(Number.isFinite(p)).toBe(true);
      }
      expect(isNormalized(probs)).toBe(true);
    });

    it('handles scores of extreme spread [0, 1000]', () => {
      const probs = softmax([0, 500, 1000], 1.0);
      // The score=1000 candidate should have nearly all probability.
      expect(probs[2]).toBeGreaterThan(0.999);
      expect(isNormalized(probs)).toBe(true);
    });

    it('replaces non-finite input scores with 0', () => {
      const probs = softmax([NaN, Infinity, -Infinity, 1.0], 1.0);
      expect(probs).toHaveLength(4);
      for (const p of probs) {
        expect(Number.isFinite(p)).toBe(true);
      }
      expect(isNormalized(probs)).toBe(true);
    });
  });

  describe('temperature → 0 (CF-MA3-01 / CF-MD2-01)', () => {
    it('returns one-hot at T = TEMPERATURE_EPSILON (boundary)', () => {
      const probs = softmax([1, 3, 2], TEMPERATURE_EPSILON);
      // argmax is index 1 (score=3)
      expect(probs[1]).toBe(1);
      expect(probs[0]).toBe(0);
      expect(probs[2]).toBe(0);
    });

    it('returns one-hot at T = 0', () => {
      const probs = softmax([0.5, -1.0, 2.0], 0);
      expect(probs[2]).toBe(1);
      expect(probs[0]).toBe(0);
      expect(probs[1]).toBe(0);
    });

    it('returns one-hot at T = 1e-12 (well below epsilon)', () => {
      const probs = softmax([10, 20, 5], 1e-12);
      expect(probs[1]).toBe(1);
      expect(probs[0]).toBe(0);
      expect(probs[2]).toBe(0);
    });

    it('breaks ties on first occurrence (lowest index)', () => {
      // Tied max: indices 0 and 2 both have score=5
      const probs = softmax([5, 3, 5], 0);
      // First occurrence of max (index 0) wins.
      expect(probs[0]).toBe(1);
      expect(probs[1]).toBe(0);
      expect(probs[2]).toBe(0);
    });

    it('very small T (1e-8) concentrates mass near argmax', () => {
      const probs = softmax([1, 3, 2], 1e-8);
      expect(probs[1]).toBeGreaterThan(0.999);
    });
  });

  describe('temperature → ∞', () => {
    it('returns near-uniform at very high temperature', () => {
      // At T=1e9 all scores look equal ⇒ uniform over 4 candidates.
      const probs = softmax([1, 2, 3, 4], 1e9);
      for (const p of probs) {
        expect(p).toBeCloseTo(0.25, 2);
      }
      expect(isNormalized(probs)).toBe(true);
    });

    it('is monotonic in T: higher T → more uniform distribution', () => {
      const scores = [1, 5, 2, 3];
      const probsLowT = softmax(scores, 0.1);
      const probsHighT = softmax(scores, 10.0);

      // Entropy of low-T distribution should be lower than high-T.
      function entropy(ps: number[]): number {
        return -ps.reduce((acc, p) => (p > 0 ? acc + p * Math.log(p) : acc), 0);
      }

      expect(entropy(probsHighT)).toBeGreaterThan(entropy(probsLowT));
    });
  });

  describe('equal scores', () => {
    it('returns uniform distribution for equal scores at T=1', () => {
      const probs = softmax([2, 2, 2, 2], 1.0);
      for (const p of probs) {
        expect(p).toBeCloseTo(0.25, 10);
      }
    });

    it('equal scores at T=0 returns one-hot on first index', () => {
      const probs = softmax([3, 3, 3], 0);
      expect(probs[0]).toBe(1);
      expect(probs[1]).toBe(0);
      expect(probs[2]).toBe(0);
    });
  });

  describe('correct magnitude ordering', () => {
    it('softmax probabilities preserve rank order at T=1', () => {
      const scores = [1.0, 2.0, 3.0, 4.0, 5.0];
      const probs = softmax(scores, 1.0);
      for (let i = 1; i < probs.length; i++) {
        expect(probs[i]).toBeGreaterThan(probs[i - 1]);
      }
    });
  });
});
