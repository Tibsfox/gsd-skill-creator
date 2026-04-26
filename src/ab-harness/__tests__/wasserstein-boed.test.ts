/**
 * Tests for JP-022: Wasserstein BOED scoring primitive (post v1.49.579 W4 rewrite).
 *
 * Verifies:
 *  - W1 distance is finite, non-negative, symmetric, and zero on identical
 *    distributions (the primitive — kept exactly as before).
 *  - wassersteinExpectedUtility honestly delegates to the conjugate
 *    Beta-Bernoulli update + W1 sample-bag distance — no hand-picked
 *    constants, no simulated posterior shift.
 *  - The historical MAX_SHIFT_STDS / VAR_SHRINK constants are GONE from
 *    the file (grep test); the heuristic that used them is no longer the
 *    function body.
 *  - More-shifted observations produce a larger W1 score than near-prior
 *    observations (the honest property the heuristic was approximating).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  wasserstein1d,
  wassersteinExpectedUtility,
  type EmpiricalDistribution,
  type ExperimentDesign,
} from '../wasserstein-boed.js';
import { mulberry32 } from '../../bayes-ab/ipm-boed.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a uniform grid distribution. */
function uniformGrid(lo: number, hi: number, n: number): EmpiricalDistribution {
  const step = (hi - lo) / (n - 1);
  return { samples: Array.from({ length: n }, (_, i) => lo + i * step) };
}

// ---------------------------------------------------------------------------
// wasserstein1d primitive (unchanged from pre-W4)
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

// ---------------------------------------------------------------------------
// wassersteinExpectedUtility — honest one-step adapter
// ---------------------------------------------------------------------------

describe('wassersteinExpectedUtility — honest delegation', () => {
  it('returns a finite, non-negative score for a synthetic design', () => {
    const prior = uniformGrid(0, 1, 30);
    const design: ExperimentDesign = {
      label: 'arm-A',
      outcomeSamples: [0.1, 0.3, 0.7, 0.9],
    };
    const score = wassersteinExpectedUtility(design, prior, mulberry32(7));
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('design with all-success outcomes shifts the posterior more than 50/50 outcomes', () => {
    // Prior: uniform on [0, 1] — empirical mean ≈ 0.5
    const prior = uniformGrid(0, 1, 50);
    const allHigh: ExperimentDesign = {
      label: 'all-high',
      // all > 0.5 ⇒ all binarised as success ⇒ posterior shifts strongly upward
      outcomeSamples: [0.7, 0.8, 0.9, 0.85, 0.75, 0.95, 0.78, 0.82, 0.88, 0.91],
    };
    const balanced: ExperimentDesign = {
      label: 'balanced',
      // half above, half below ⇒ posterior shift ≈ 0
      outcomeSamples: [0.1, 0.2, 0.3, 0.4, 0.45, 0.55, 0.6, 0.7, 0.8, 0.9],
    };
    const scoreHigh = wassersteinExpectedUtility(allHigh, prior, mulberry32(11));
    const scoreBalanced = wassersteinExpectedUtility(balanced, prior, mulberry32(11));
    expect(scoreHigh).toBeGreaterThan(scoreBalanced);
  });

  it('determinism: same RNG seed ⇒ same score', () => {
    const prior = uniformGrid(0, 1, 30);
    const design: ExperimentDesign = {
      label: 'arm',
      outcomeSamples: [0.1, 0.3, 0.7, 0.9, 0.5, 0.4],
    };
    const a = wassersteinExpectedUtility(design, prior, mulberry32(42));
    const b = wassersteinExpectedUtility(design, prior, mulberry32(42));
    expect(a).toBe(b);
  });

  it('throws on empty inputs', () => {
    const prior = uniformGrid(0, 1, 5);
    expect(() => wassersteinExpectedUtility(
      { label: 'empty', outcomeSamples: [] },
      prior,
    )).toThrow(RangeError);
    expect(() => wassersteinExpectedUtility(
      { label: 'd', outcomeSamples: [0.5] },
      { samples: [] },
    )).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Honesty audit — the v1.49.578 footnote constants are gone
// ---------------------------------------------------------------------------

describe('honesty audit — historical heuristic constants are gone', () => {
  const SOURCE_PATH = resolve(__dirname, '../wasserstein-boed.ts');
  const source = readFileSync(SOURCE_PATH, 'utf8');

  it('MAX_SHIFT_STDS is no longer in the source file', () => {
    expect(source).not.toContain('MAX_SHIFT_STDS');
  });

  it('VAR_SHRINK is no longer in the source file', () => {
    expect(source).not.toContain('VAR_SHRINK');
  });

  it('module no longer claims to be an "illustrative IPM-aware heuristic"', () => {
    expect(source).not.toContain('illustrative IPM-aware heuristic');
    // Contains the new framing:
    expect(source).toContain('Verified-against arXiv:2604.21849');
  });

  it('multivariate extension is wired (v1.49.580): docs point to src/bayes-ab/{sliced-wasserstein,ipm-boed-mv}', () => {
    // v1.49.579 trimmed Limitations to just the multivariate gap. v1.49.580
    // closes that gap by adding src/bayes-ab/sliced-wasserstein.ts +
    // src/bayes-ab/ipm-boed-mv.ts; the Limitations block was replaced by a
    // 'Multivariate extension' pointer.
    expect(source).toContain('Multivariate extension');
    expect(source).toContain('sliced-Wasserstein');
    expect(source).toContain('src/bayes-ab/sliced-wasserstein.ts');
    expect(source).toContain('src/bayes-ab/ipm-boed-mv.ts');
  });
});
