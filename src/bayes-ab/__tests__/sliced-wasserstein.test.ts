/**
 * v1.49.580 W2 — Sliced-Wasserstein primitive tests.
 *
 * Coverage:
 *   - identical → 0 (within MC tolerance)
 *   - symmetric: SW(P, Q) ≈ SW(Q, P)
 *   - reduces to W1 in d=1 (within MC tolerance)
 *   - monotone in mean separation (translating Q's centre away from P's increases SW)
 *   - dimensionality mismatch throws
 */

import { describe, it, expect } from 'vitest';
import { slicedWasserstein, type MvEmpiricalDistribution } from '../sliced-wasserstein.js';
import { wasserstein1d } from '../../ab-harness/wasserstein-boed.js';
import { mulberry32 } from '../ipm-boed.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a regular grid in R^2 (for deterministic small fixtures). */
function gridR2(): MvEmpiricalDistribution {
  return {
    samples: [
      [0, 0], [0, 1], [1, 0], [1, 1],
      [0.5, 0.5], [0.25, 0.25], [0.75, 0.75],
    ],
  };
}

describe('slicedWasserstein — identical → 0', () => {
  it('SW(P, P) = 0 for any P (within MC tolerance)', () => {
    const p = gridR2();
    const sw = slicedWasserstein(p, p, { projections: 64, rng: mulberry32(7) });
    expect(sw).toBeCloseTo(0, 6);
  });
});

describe('slicedWasserstein — symmetry', () => {
  it('SW(P, Q) ≈ SW(Q, P) within MC tolerance (same RNG seed)', () => {
    const p = gridR2();
    const q: MvEmpiricalDistribution = {
      samples: [[2, 2], [2, 3], [3, 2], [3, 3], [2.5, 2.5]],
    };
    // Same RNG seed → same projection directions → same W1 sum, just argument order swapped
    const a = slicedWasserstein(p, q, { projections: 32, rng: mulberry32(11) });
    const b = slicedWasserstein(q, p, { projections: 32, rng: mulberry32(11) });
    // wasserstein1d is exactly symmetric, so SW with the same projections must agree exactly.
    expect(a).toBeCloseTo(b, 12);
  });
});

describe('slicedWasserstein — d=1 reduces to W1', () => {
  it('matches wasserstein1d on identical 1-D samples (within MC tolerance)', () => {
    // Wrap 1-D scalars as singleton arrays.
    const samples1d = [0, 1, 2, 3, 4];
    const samples1dShifted = [3, 4, 5, 6, 7];
    const wrapAs1d = (xs: number[]): MvEmpiricalDistribution => ({
      samples: xs.map(x => [x]),
    });
    const sw = slicedWasserstein(
      wrapAs1d(samples1d),
      wrapAs1d(samples1dShifted),
      { projections: 64, rng: mulberry32(13) },
    );
    const w1 = wasserstein1d({ samples: samples1d }, { samples: samples1dShifted });
    // In d=1, every random unit vector is ±1; projecting flips signs by the
    // unit vector's sign, but |u·x_i − u·y_i| = |x_i − y_i| so W1 contribution
    // is invariant. So SW = W1 in expectation, up to MC noise from how many
    // ±1 directions get drawn (binomial-like).
    expect(Math.abs(sw - w1)).toBeLessThan(0.01);
  });
});

describe('slicedWasserstein — monotone in mean separation', () => {
  it('translating Q\'s centre away from P\'s increases SW', () => {
    const p = gridR2();
    const closeQ: MvEmpiricalDistribution = {
      samples: gridR2().samples.map(([x, y]) => [x + 1, y + 1]),
    };
    const farQ: MvEmpiricalDistribution = {
      samples: gridR2().samples.map(([x, y]) => [x + 5, y + 5]),
    };
    const swClose = slicedWasserstein(p, closeQ, { projections: 64, rng: mulberry32(17) });
    const swFar = slicedWasserstein(p, farQ, { projections: 64, rng: mulberry32(17) });
    expect(swFar).toBeGreaterThan(swClose);
    // Far is roughly 5× the displacement, so SW should grow accordingly.
    expect(swFar / swClose).toBeGreaterThan(3);
  });
});

describe('slicedWasserstein — defensive errors', () => {
  it('throws on empty distribution', () => {
    expect(() => slicedWasserstein(
      { samples: [] },
      { samples: [[0, 0]] },
    )).toThrow(RangeError);
  });

  it('throws on dimensionality mismatch (R^2 vs R^3)', () => {
    const p: MvEmpiricalDistribution = { samples: [[0, 0]] };
    const q: MvEmpiricalDistribution = { samples: [[0, 0, 0]] };
    expect(() => slicedWasserstein(p, q)).toThrow(RangeError);
  });

  it('throws on inconsistent row dimensions within a single distribution', () => {
    const p: MvEmpiricalDistribution = { samples: [[0, 0], [1, 1, 1]] };
    const q: MvEmpiricalDistribution = { samples: [[0, 0], [1, 1]] };
    expect(() => slicedWasserstein(p, q)).toThrow(RangeError);
  });

  it('throws on invalid projection count', () => {
    const p = gridR2();
    expect(() => slicedWasserstein(p, p, { projections: 0 })).toThrow(RangeError);
    expect(() => slicedWasserstein(p, p, { projections: -1 })).toThrow(RangeError);
    expect(() => slicedWasserstein(p, p, { projections: 1.5 })).toThrow(RangeError);
  });
});

describe('slicedWasserstein — determinism', () => {
  it('same seed → same SW value (full determinism)', () => {
    const p = gridR2();
    const q: MvEmpiricalDistribution = {
      samples: [[2, 1], [3, 2], [1, 3], [2.5, 2.5]],
    };
    const a = slicedWasserstein(p, q, { projections: 32, rng: mulberry32(42) });
    const b = slicedWasserstein(p, q, { projections: 32, rng: mulberry32(42) });
    expect(a).toBe(b);
  });
});
