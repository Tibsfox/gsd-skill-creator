/**
 * Tests for JP-022: Wasserstein BOED skill scoring primitive.
 *
 * Verifies:
 *  - W1 distance is finite and non-negative on synthetic distributions.
 *  - BOED utility is finite and non-negative.
 *  - BOED ranking differs from naive EIG ranking under prior misspecification
 *    (the distinguishing property of IPM-based BOED per arXiv:2604.21849).
 *  - Utility is monotone in observation count: more outcome samples with
 *    the same information content should not decrease the score.
 */

import { describe, it, expect } from 'vitest';
import {
  wasserstein1d,
  wassersteinExpectedUtility,
  type EmpiricalDistribution,
  type ExperimentDesign,
} from '../wasserstein-boed.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a uniform grid distribution. */
function uniformGrid(lo: number, hi: number, n: number): EmpiricalDistribution {
  const step = (hi - lo) / (n - 1);
  return { samples: Array.from({ length: n }, (_, i) => lo + i * step) };
}

/** Naive EIG proxy: mean squared distance from prior mean (as a stand-in). */
function naiveEIG(design: ExperimentDesign, prior: EmpiricalDistribution): number {
  const priorMean = prior.samples.reduce((s, x) => s + x, 0) / prior.samples.length;
  const msd =
    design.outcomeSamples.reduce((s, y) => s + (y - priorMean) ** 2, 0) /
    design.outcomeSamples.length;
  return msd;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('wasserstein1d', () => {
  it('returns 0 for identical distributions', () => {
    const d: EmpiricalDistribution = { samples: [1, 2, 3, 4, 5] };
    expect(wasserstein1d(d, d)).toBeCloseTo(0, 6);
  });

  it('returns a positive finite value for disjoint distributions', () => {
    const p: EmpiricalDistribution = { samples: [0, 1, 2] };
    const q: EmpiricalDistribution = { samples: [5, 6, 7] };
    const w = wasserstein1d(p, q);
    expect(Number.isFinite(w)).toBe(true);
    expect(w).toBeGreaterThan(0);
  });

  it('is symmetric: W1(P,Q) == W1(Q,P)', () => {
    const p: EmpiricalDistribution = { samples: [0, 0.5, 1] };
    const q: EmpiricalDistribution = { samples: [2, 2.5, 3] };
    expect(wasserstein1d(p, q)).toBeCloseTo(wasserstein1d(q, p), 10);
  });
});

describe('wassersteinExpectedUtility', () => {
  it('returns a finite, non-negative score for a synthetic design', () => {
    const prior = uniformGrid(0, 1, 20);
    const design: ExperimentDesign = {
      label: 'arm-A',
      outcomeSamples: [0.1, 0.3, 0.7, 0.9],
    };
    const score = wassersteinExpectedUtility(design, prior);
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  /**
   * KEY test: BOED ranking differs from EIG ranking under prior misspecification.
   *
   * Setup: two designs —
   *   - design-A: outcomes tightly clustered near the prior mean (low EIG,
   *     but the cluster is at the edge of the prior support so Wasserstein
   *     displacement is non-trivial).
   *   - design-B: one extreme outlier (high EIG / squared deviation) but
   *     the bulk of outcomes are near the prior mean, giving a low
   *     Wasserstein average displacement.
   *
   * Under naive EIG (mean squared distance), design-B ranks higher because
   * the outlier inflates the squared term.  Under Wasserstein BOED, design-A
   * ranks higher because its cluster systematically displaces the posterior
   * in a coherent direction.
   */
  it('BOED ranking differs from naive EIG ranking under prior misspecification', () => {
    // Prior: uniform on [0, 1], 30 samples.
    const prior = uniformGrid(0, 1, 30);

    // design-A: 8 outcomes near upper edge — systematic posterior shift.
    const designA: ExperimentDesign = {
      label: 'arm-A-systematic',
      outcomeSamples: [0.85, 0.88, 0.90, 0.87, 0.92, 0.86, 0.89, 0.91],
    };

    // design-B: 7 near-mean outcomes + 1 extreme outlier.
    const designB: ExperimentDesign = {
      label: 'arm-B-outlier',
      outcomeSamples: [0.48, 0.51, 0.50, 0.49, 0.52, 0.50, 0.51, 5.0],
    };

    const boedA = wassersteinExpectedUtility(designA, prior);
    const boedB = wassersteinExpectedUtility(designB, prior);
    const eigA = naiveEIG(designA, prior);
    const eigB = naiveEIG(designB, prior);

    // Wasserstein BOED prefers design-A (coherent shift beats noisy outlier).
    expect(boedA).toBeGreaterThan(boedB);

    // Naive EIG prefers design-B (outlier inflates squared deviation).
    expect(eigB).toBeGreaterThan(eigA);

    // Rankings are opposite — this is the distinguishing property of IPM-BOED.
    const boedRankA = boedA > boedB ? 'A' : 'B';
    const eigRankA = eigA > eigB ? 'A' : 'B';
    expect(boedRankA).not.toBe(eigRankA);
  });

  it('utility is non-decreasing when outcome samples are doubled (same distribution)', () => {
    const prior = uniformGrid(0, 1, 20);
    const outcomes = [0.2, 0.4, 0.6, 0.8];
    const designSmall: ExperimentDesign = { label: 'small', outcomeSamples: outcomes };
    const designLarge: ExperimentDesign = {
      label: 'large',
      outcomeSamples: [...outcomes, ...outcomes],
    };
    const scoreSmall = wassersteinExpectedUtility(designSmall, prior);
    const scoreLarge = wassersteinExpectedUtility(designLarge, prior);
    // Same distribution doubles should yield the same score (Monte-Carlo average is stable).
    expect(Math.abs(scoreSmall - scoreLarge)).toBeLessThan(1e-9);
  });
});
