/**
 * v1.49.579 W1 — Beta-Bernoulli conjugate update tests.
 *
 * Reference values for betaMean / betaVariance pinned against scipy.stats.beta:
 *
 *   from scipy.stats import beta
 *   beta(2, 5).mean()   # 0.2857142857142857
 *   beta(2, 5).var()    # 0.025510204081632654
 *   beta(10, 10).mean() # 0.5
 *   beta(10, 10).var()  # 0.011904761904761904
 *   beta(0.5, 0.5).mean()  # 0.5
 *   beta(0.5, 0.5).var()   # 0.125
 *
 * These are cross-checked against the closed-form formulae in
 * src/bayes-ab/conjugate.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  posteriorBeta,
  betaMean,
  betaVariance,
  summariseOutcomes,
} from '../conjugate.js';
import type { BetaPrior } from '../index.js';

describe('posteriorBeta — closed-form Beta-Bernoulli update', () => {
  it('vacuous outcome is identity: Beta(2, 5) | (0, 0) = Beta(2, 5)', () => {
    const prior: BetaPrior = { alpha: 2, beta: 5 };
    const post = posteriorBeta(prior, { successes: 0, failures: 0 });
    expect(post).toEqual(prior);
  });

  it('Beta(1, 1) | (5, 3) = Beta(6, 4) — exact integer round-trip', () => {
    const post = posteriorBeta({ alpha: 1, beta: 1 }, { successes: 5, failures: 3 });
    expect(post).toEqual({ alpha: 6, beta: 4 });
  });

  it('Beta(2, 5) | (7, 2) = Beta(9, 7)', () => {
    const post = posteriorBeta({ alpha: 2, beta: 5 }, { successes: 7, failures: 2 });
    expect(post).toEqual({ alpha: 9, beta: 7 });
  });

  it('property: posterior α + β = prior α + β + s + f for 12 random tuples', () => {
    // Deterministic pseudo-random tuples — no Math.random in test bodies.
    const tuples = [
      [1, 1, 5, 3],
      [2, 5, 7, 2],
      [10, 10, 100, 100],
      [0.5, 0.5, 0, 0],
      [3.14, 2.71, 6, 4],
      [1, 99, 0, 5],
      [99, 1, 5, 0],
      [1, 1, 0, 0],
      [4, 4, 1, 1],
      [50, 50, 25, 25],
      [0.1, 0.1, 1, 1],
      [1000, 1000, 0, 0],
    ];
    for (const [a, b, s, f] of tuples) {
      const post = posteriorBeta({ alpha: a, beta: b }, { successes: s, failures: f });
      expect(post.alpha + post.beta).toBeCloseTo(a + b + s + f, 9);
    }
  });

  it('throws on invalid prior (α ≤ 0)', () => {
    expect(() => posteriorBeta({ alpha: 0, beta: 1 }, { successes: 0, failures: 0 })).toThrow(RangeError);
    expect(() => posteriorBeta({ alpha: -1, beta: 1 }, { successes: 0, failures: 0 })).toThrow(RangeError);
  });

  it('throws on negative outcome counts', () => {
    expect(() => posteriorBeta({ alpha: 1, beta: 1 }, { successes: -1, failures: 0 })).toThrow(RangeError);
  });
});

describe('betaMean — α / (α + β)', () => {
  it('Beta(2, 5).mean ≈ 0.2857142857 (scipy reference)', () => {
    expect(betaMean({ alpha: 2, beta: 5 })).toBeCloseTo(0.2857142857142857, 12);
  });

  it('Beta(10, 10).mean = 0.5 exactly', () => {
    expect(betaMean({ alpha: 10, beta: 10 })).toBe(0.5);
  });

  it('Beta(0.5, 0.5).mean = 0.5 (Jeffreys prior — symmetric)', () => {
    expect(betaMean({ alpha: 0.5, beta: 0.5 })).toBe(0.5);
  });

  it('Beta(1, 99).mean = 0.01 (heavily-skewed toward 0)', () => {
    expect(betaMean({ alpha: 1, beta: 99 })).toBeCloseTo(0.01, 12);
  });
});

describe('betaVariance — αβ / ((α + β)² (α + β + 1))', () => {
  it('Beta(2, 5).var ≈ 0.0255102041 (scipy reference)', () => {
    expect(betaVariance({ alpha: 2, beta: 5 })).toBeCloseTo(0.025510204081632654, 12);
  });

  it('Beta(10, 10).var ≈ 0.0119047619 (scipy reference)', () => {
    expect(betaVariance({ alpha: 10, beta: 10 })).toBeCloseTo(0.011904761904761904, 12);
  });

  it('Beta(0.5, 0.5).var = 0.125 (scipy reference; Jeffreys variance)', () => {
    expect(betaVariance({ alpha: 0.5, beta: 0.5 })).toBeCloseTo(0.125, 12);
  });

  it('variance shrinks as concentration grows: Beta(100, 100).var < Beta(10, 10).var < Beta(2, 2).var', () => {
    const v100 = betaVariance({ alpha: 100, beta: 100 });
    const v10 = betaVariance({ alpha: 10, beta: 10 });
    const v2 = betaVariance({ alpha: 2, beta: 2 });
    expect(v100).toBeLessThan(v10);
    expect(v10).toBeLessThan(v2);
  });
});

describe('summariseOutcomes — tally a 0/1 stream', () => {
  it('counts 1s as successes and 0s as failures', () => {
    expect(summariseOutcomes([1, 0, 1, 1, 0])).toEqual({ successes: 3, failures: 2 });
  });

  it('empty stream → (0, 0)', () => {
    expect(summariseOutcomes([])).toEqual({ successes: 0, failures: 0 });
  });

  it('non-zero non-1 values count as successes (any truthy finite value)', () => {
    expect(summariseOutcomes([0.5, 0, 1, -1])).toEqual({ successes: 3, failures: 1 });
  });

  it('throws on non-finite values', () => {
    expect(() => summariseOutcomes([1, 0, NaN])).toThrow(RangeError);
    expect(() => summariseOutcomes([1, 0, Infinity])).toThrow(RangeError);
  });
});
