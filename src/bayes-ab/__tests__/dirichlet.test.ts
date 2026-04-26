/**
 * v1.49.580 W1 — Dirichlet conjugate update tests.
 *
 * Reference values (scipy.stats.dirichlet):
 *   from scipy.stats import dirichlet
 *   import numpy as np
 *   dirichlet([1, 1, 1]).mean()       # array([0.333..., 0.333..., 0.333...])
 *   dirichlet([1, 2, 7]).mean()       # array([0.1, 0.2, 0.7])
 *   dirichlet([2, 5]).mean()          # array([0.286..., 0.714...]) — 2-class is Beta(2,5)
 *
 *   np.random.seed(42)
 *   np.mean(dirichlet([1, 2, 7]).rvs(2000), axis=0)  # ≈ [0.1, 0.2, 0.7]
 */

import { describe, it, expect } from 'vitest';
import {
  posteriorDirichlet,
  dirichletMean,
  sampleDirichlet,
  summariseMultinomial,
} from '../dirichlet.js';
import { mulberry32 } from '../ipm-boed.js';
import { betaMean } from '../conjugate.js';
import type { DirichletPrior } from '../index.js';

describe('posteriorDirichlet — closed-form Dirichlet-Multinomial update', () => {
  it('vacuous outcome is identity: Dirichlet([1,1,1]) | counts=[0,0,0] = Dirichlet([1,1,1])', () => {
    const prior: DirichletPrior = { alphas: [1, 1, 1] };
    const post = posteriorDirichlet(prior, { counts: [0, 0, 0] });
    expect(post.alphas).toEqual([1, 1, 1]);
  });

  it('integer round-trip: Dirichlet([1,1,1]) | counts=[5,3,2] = Dirichlet([6,4,3])', () => {
    const post = posteriorDirichlet({ alphas: [1, 1, 1] }, { counts: [5, 3, 2] });
    expect(post.alphas).toEqual([6, 4, 3]);
  });

  it('K=2 case reduces to Beta-Bernoulli: Dirichlet([2,5]) | counts=[3,1] = Dirichlet([5,6]) ↔ Beta(5,6)', () => {
    const post = posteriorDirichlet({ alphas: [2, 5] }, { counts: [3, 1] });
    expect(post.alphas).toEqual([5, 6]);
    // Cross-check against Beta mean: Beta(5,6).mean = 5/11
    expect(dirichletMean(post)[0]).toBeCloseTo(betaMean({ alpha: 5, beta: 6 }), 12);
  });

  it('property: posterior alpha-sum = prior alpha-sum + count-sum (over 8 random tuples)', () => {
    const tuples: Array<{ alphas: number[]; counts: number[] }> = [
      { alphas: [1, 1, 1], counts: [5, 3, 2] },
      { alphas: [2, 2, 2, 2], counts: [1, 1, 1, 1] },
      { alphas: [10, 1], counts: [0, 5] },
      { alphas: [0.5, 0.5, 0.5], counts: [0, 0, 0] },
      { alphas: [3, 7], counts: [10, 0] },
      { alphas: [1, 2, 3, 4, 5], counts: [0, 0, 0, 0, 0] },
      { alphas: [100, 100], counts: [50, 50] },
      { alphas: [0.1, 0.1, 0.1], counts: [1, 1, 1] },
    ];
    for (const { alphas, counts } of tuples) {
      const post = posteriorDirichlet({ alphas }, { counts });
      const priorSum = alphas.reduce((a, b) => a + b, 0);
      const countsSum = counts.reduce((a, b) => a + b, 0);
      const postSum = post.alphas.reduce((a, b) => a + b, 0);
      expect(postSum).toBeCloseTo(priorSum + countsSum, 9);
    }
  });

  it('throws on dimension mismatch', () => {
    expect(() => posteriorDirichlet({ alphas: [1, 1, 1] }, { counts: [0, 0] })).toThrow(RangeError);
  });

  it('throws on invalid alpha (≤ 0)', () => {
    expect(() => posteriorDirichlet({ alphas: [1, 0, 1] }, { counts: [0, 0, 0] })).toThrow(RangeError);
    expect(() => posteriorDirichlet({ alphas: [1, -1, 1] }, { counts: [0, 0, 0] })).toThrow(RangeError);
  });

  it('throws on negative or non-finite counts', () => {
    expect(() => posteriorDirichlet({ alphas: [1, 1] }, { counts: [-1, 0] })).toThrow(RangeError);
    expect(() => posteriorDirichlet({ alphas: [1, 1] }, { counts: [NaN, 0] })).toThrow(RangeError);
  });
});

describe('dirichletMean — α_k / Σα', () => {
  it('Dirichlet([1,1,1]).mean = [1/3, 1/3, 1/3]', () => {
    const m = dirichletMean({ alphas: [1, 1, 1] });
    for (const v of m) expect(v).toBeCloseTo(1 / 3, 12);
    expect(m.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('Dirichlet([1,2,7]).mean = [0.1, 0.2, 0.7] (scipy reference)', () => {
    const m = dirichletMean({ alphas: [1, 2, 7] });
    expect(m[0]).toBeCloseTo(0.1, 12);
    expect(m[1]).toBeCloseTo(0.2, 12);
    expect(m[2]).toBeCloseTo(0.7, 12);
  });

  it('K=2 case matches Beta mean: Dirichlet([2,5]).mean[0] = Beta(2,5).mean = 2/7', () => {
    const m = dirichletMean({ alphas: [2, 5] });
    expect(m[0]).toBeCloseTo(2 / 7, 12);
    expect(m[1]).toBeCloseTo(5 / 7, 12);
  });

  it('asymmetric concentration: Dirichlet([100,1,1]).mean[0] ≈ 0.98', () => {
    const m = dirichletMean({ alphas: [100, 1, 1] });
    expect(m[0]).toBeCloseTo(100 / 102, 12);
  });
});

describe('sampleDirichlet — K independent Gamma draws normalised', () => {
  it('samples lie on the simplex (sum to 1, all in [0, 1])', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const s = sampleDirichlet({ alphas: [2, 5, 3] }, rng);
      expect(s.length).toBe(3);
      expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      for (const v of s) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('MC mean over 2000 draws within 0.03 of dirichletMean for Dirichlet([1,2,7])', () => {
    const rng = mulberry32(42);
    const N = 2000;
    const sums = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      const s = sampleDirichlet({ alphas: [1, 2, 7] }, rng);
      for (let k = 0; k < 3; k++) sums[k] += s[k];
    }
    const mcMean = sums.map(s => s / N);
    const expected = [0.1, 0.2, 0.7];
    for (let k = 0; k < 3; k++) {
      expect(Math.abs(mcMean[k] - expected[k])).toBeLessThan(0.03);
    }
  });

  it('K=2 case: sample[0] mean ≈ Beta mean', () => {
    const rng = mulberry32(7);
    const N = 2000;
    let sum0 = 0;
    for (let i = 0; i < N; i++) {
      sum0 += sampleDirichlet({ alphas: [2, 5] }, rng)[0];
    }
    const mcMean0 = sum0 / N;
    expect(Math.abs(mcMean0 - 2 / 7)).toBeLessThan(0.03);
  });

  it('throws on empty alphas', () => {
    expect(() => sampleDirichlet({ alphas: [] }, mulberry32(0))).toThrow(RangeError);
  });
});

describe('summariseMultinomial — tally a category-index stream', () => {
  it('counts category indices into per-category bins', () => {
    expect(summariseMultinomial([0, 1, 2, 1, 0, 2, 2], 3)).toEqual({ counts: [2, 2, 3] });
  });

  it('empty stream → all zeros', () => {
    expect(summariseMultinomial([], 4)).toEqual({ counts: [0, 0, 0, 0] });
  });

  it('throws on out-of-range index', () => {
    expect(() => summariseMultinomial([0, 1, 3], 3)).toThrow(RangeError);
    expect(() => summariseMultinomial([0, -1, 1], 3)).toThrow(RangeError);
    expect(() => summariseMultinomial([0, 1.5, 2], 3)).toThrow(RangeError);
  });

  it('throws on invalid K', () => {
    expect(() => summariseMultinomial([0, 1], 0)).toThrow(RangeError);
    expect(() => summariseMultinomial([0, 1], -1)).toThrow(RangeError);
    expect(() => summariseMultinomial([0, 1], 2.5)).toThrow(RangeError);
  });
});
