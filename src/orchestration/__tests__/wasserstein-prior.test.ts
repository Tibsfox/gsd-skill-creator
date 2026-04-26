/**
 * Tests for JP-037: Wasserstein-robust prior construction.
 *
 * Verifies:
 *  - robustifyPrior returns a distribution that integrates to 1.
 *  - ambiguityRadius=0 returns the normalised nominal prior unchanged.
 *  - Large ambiguityRadius converges toward the uniform distribution.
 *  - The robust prior is strictly less peaked than the nominal (entropy increases).
 *  - wasserstein1dDiscrete satisfies W1(P, P) = 0.
 */

import { describe, it, expect } from 'vitest';
import {
  robustifyPrior,
  wasserstein1dDiscrete,
  type DiscretePrior,
} from '../wasserstein-prior.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shannon entropy of a weight vector (for measuring peakedness). */
function entropy(weights: number[]): number {
  return -weights.reduce((s, w) => (w > 0 ? s + w * Math.log(w) : s), 0);
}

/** Sum of weight array. */
function sumWeights(weights: number[]): number {
  return weights.reduce((s, w) => s + w, 0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('robustifyPrior', () => {
  const nominalSkewed: DiscretePrior = {
    support: [0, 1, 2, 3, 4],
    weights: [0.5, 0.3, 0.1, 0.07, 0.03],
  };

  it('returns a distribution that integrates to 1', () => {
    const robust = robustifyPrior(nominalSkewed, 0.5);
    expect(sumWeights(robust.weights)).toBeCloseTo(1, 10);
  });

  it('ambiguityRadius=0 returns the normalised nominal prior', () => {
    const robust = robustifyPrior(nominalSkewed, 0);
    const totalNom = sumWeights(nominalSkewed.weights);
    nominalSkewed.weights.forEach((w, i) => {
      expect(robust.weights[i]).toBeCloseTo(w / totalNom, 10);
    });
  });

  it('large ambiguityRadius converges toward the uniform distribution', () => {
    const robust = robustifyPrior(nominalSkewed, 1000);
    const n = nominalSkewed.support.length;
    robust.weights.forEach((w) => {
      expect(w).toBeCloseTo(1 / n, 6);
    });
  });

  it('robust prior has higher entropy than the nominal (more uncertainty)', () => {
    const totalNom = sumWeights(nominalSkewed.weights);
    const normNom = nominalSkewed.weights.map((w) => w / totalNom);
    const robust = robustifyPrior(nominalSkewed, 0.3);
    expect(entropy(robust.weights)).toBeGreaterThan(entropy(normNom));
  });

  it('supports the ambiguityRadius parameter in the returned structure', () => {
    // The returned DiscretePrior should have the same support length.
    const robust = robustifyPrior(nominalSkewed, 0.2);
    expect(robust.support.length).toBe(nominalSkewed.support.length);
    expect(robust.weights.length).toBe(nominalSkewed.support.length);
  });

  it('Wasserstein distance from robust prior to nominal is ≤ ambiguityRadius', () => {
    const epsilon = 0.3;
    const totalNom = sumWeights(nominalSkewed.weights);
    const normNominal: DiscretePrior = {
      support: [...nominalSkewed.support],
      weights: nominalSkewed.weights.map((w) => w / totalNom),
    };
    const robust = robustifyPrior(nominalSkewed, epsilon);
    const dist = wasserstein1dDiscrete(normNominal, robust);
    // Allow small floating-point slack.
    expect(dist).toBeLessThanOrEqual(epsilon + 1e-9);
  });
});

describe('wasserstein1dDiscrete', () => {
  it('W1(P, P) = 0 for any distribution', () => {
    const p: DiscretePrior = { support: [0, 1, 2], weights: [0.2, 0.5, 0.3] };
    expect(wasserstein1dDiscrete(p, p)).toBeCloseTo(0, 10);
  });

  it('returns a positive finite value for separated distributions', () => {
    const p: DiscretePrior = { support: [0, 1], weights: [1, 0] };
    const q: DiscretePrior = { support: [0, 1], weights: [0, 1] };
    const d = wasserstein1dDiscrete(p, q);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(0);
  });
});
