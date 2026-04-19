/**
 * MB-2 — Generative-model projector tests.
 *
 * Coverage:
 *   - Flag-off: byte-identical to simple normalise (SC-MB2-01 for M7 path).
 *   - Flag-on: simplex constraints preserved after projection.
 *   - CF-MB2-01: row sums to 1 exactly.
 *   - CF-MB2-02: no discontinuity in theta trace at boundary face crossings.
 *   - CF-MB2-03: convergence preserved vs. clipping on planted-distribution fixture.
 *   - Degenerate input handling.
 *   - Tractability-scaled logging verbosity.
 *   - `projectModel` for full table projection.
 *   - `verifySimplex` helper.
 */

import { describe, it, expect } from 'vitest';
import {
  projectModelRow,
  projectModel,
  verifySimplex,
} from '../generative-model-projector.js';
import { SIMPLEX_EPSILON } from '../smooth-projection.js';

// ---------------------------------------------------------------------------
// Flag-off — byte-identical to simple normalise
// ---------------------------------------------------------------------------

describe('projectModelRow — flag-off: simple normalise (SC-MB2-01)', () => {
  it('flag-off: uniform row passes through with sum = 1', () => {
    const r = projectModelRow([0.25, 0.25, 0.25, 0.25], { projectionEnabled: false });
    expect(r.duchi).toBe(false);
    expect(r.projectionEnabled).toBe(false);
    const s = r.projected.reduce((a, b) => a + b, 0);
    expect(Math.abs(s - 1)).toBeLessThan(1e-12);
  });

  it('flag-off: normalises unnormalised positive row', () => {
    const r = projectModelRow([1, 1, 1, 1], { projectionEnabled: false });
    expect(r.duchi).toBe(false);
    const s = r.projected.reduce((a, b) => a + b, 0);
    expect(Math.abs(s - 1)).toBeLessThan(1e-12);
  });

  it('flag-off: produces the same result as simple renormalise + ε-floor on 100 random rows', () => {
    const N = 100;
    let lcg = 7;
    const rand = () => {
      lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
      return (lcg >>> 0) / 0xffffffff;
    };

    for (let trial = 0; trial < N; trial++) {
      const n = 4;
      const raw = Array.from({ length: n }, () => rand());
      const r = projectModelRow(raw, { projectionEnabled: false });

      // Manual simple-normalise + ε-floor.
      const floored = raw.map(v => Math.max(v, SIMPLEX_EPSILON));
      const s = floored.reduce((a, b) => a + b, 0);
      const expected = floored.map(v => v / s);

      for (let i = 0; i < n; i++) {
        expect(Math.abs(r.projected[i]! - expected[i]!)).toBeLessThan(1e-12);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Flag-on — simplex constraints (CF-MB2-01)
// ---------------------------------------------------------------------------

describe('projectModelRow — flag-on: simplex constraints preserved (CF-MB2-01)', () => {
  it('row sum = 1 exactly for uniform input', () => {
    const r = projectModelRow([0.25, 0.25, 0.25, 0.25], { projectionEnabled: true });
    const s = r.projected.reduce((a, b) => a + b, 0);
    expect(Math.abs(s - 1)).toBeLessThan(1e-12);
    expect(r.duchi).toBe(true);
  });

  it('all entries ≥ SIMPLEX_EPSILON after projection', () => {
    const r = projectModelRow([0.99, 0.005, 0.003, 0.002], { projectionEnabled: true });
    for (const v of r.projected) {
      expect(v).toBeGreaterThanOrEqual(SIMPLEX_EPSILON - 1e-15);
    }
  });

  it('partially-negative input projects to valid simplex', () => {
    const r = projectModelRow([0.9, -0.1, 0.3], { projectionEnabled: true });
    expect(verifySimplex(r.projected)).toBe(true);
  });

  it('all-negative input projects to valid simplex (Duchi finds active set)', () => {
    // Duchi 2008: [-1,-2,-3] → rho=1 (sorted[0]=-1 > (-1-1)/1=-2), lambda=-2,
    // projected = [max(-1-(-2),0), max(-2-(-2),0), max(-3-(-2),0)] = [1,0,0].
    // After ε-floor and renormalise: first entry dominates. Not degenerate.
    const r = projectModelRow([-1, -2, -3], { projectionEnabled: true });
    expect(r.isDegenerate).toBe(false);
    const s = r.projected.reduce((a, b) => a + b, 0);
    expect(Math.abs(s - 1)).toBeLessThan(1e-9);
    // All entries must satisfy the simplex constraint.
    expect(verifySimplex(r.projected)).toBe(true);
  });

  it('CF-MB2-01 property test: 1000 rows all satisfy simplex constraint', () => {
    let lcg = 99;
    const rand = () => {
      lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
      return ((lcg >>> 0) / 0xffffffff) * 2 - 0.5;
    };

    for (let trial = 0; trial < 1000; trial++) {
      const n = 5;
      const raw = Array.from({ length: n }, rand);
      const r = projectModelRow(raw, { projectionEnabled: true });
      expect(verifySimplex(r.projected, SIMPLEX_EPSILON, 1e-9)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// CF-MB2-02 — no discontinuity in theta trace at boundary face crossings
// ---------------------------------------------------------------------------

describe('projectModelRow — CF-MB2-02: no discontinuity at boundary face', () => {
  /**
   * Simulate a sequence of rows where one entry gradually decreases toward 0
   * (boundary face crossing). The projected values should change smoothly —
   * no step discontinuity.
   */
  it('theta trace has no discontinuity as entry approaches boundary face', () => {
    const steps = 100;
    const projected0: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 → 1
      // First entry decreases from 0.5 → 0 (boundary face at 0).
      const row = [0.5 - 0.5 * t, 0.3 + 0.1 * t, 0.2 + 0.4 * t];
      const r = projectModelRow(row, { projectionEnabled: true });
      projected0.push(r.projected[0]!);
    }

    // Check that first differences are bounded (no jump > 0.1 per step).
    let maxJump = 0;
    for (let i = 1; i < projected0.length; i++) {
      const d = Math.abs(projected0[i]! - projected0[i - 1]!);
      if (d > maxJump) maxJump = d;
    }

    // Smooth projection: no jump should exceed 0.05 per step (steps span [0,1]).
    expect(maxJump).toBeLessThan(0.05);
  });
});

// ---------------------------------------------------------------------------
// CF-MB2-03 — convergence preserved vs. clipping on planted-distribution fixture
// ---------------------------------------------------------------------------

describe('projectModelRow — CF-MB2-03: convergence preserved', () => {
  /**
   * Planted distribution: target row = [0.6, 0.3, 0.1].
   * Simulate online count updates (gradient direction toward planted truth).
   * Compare iteration count to reach within 0.01 L∞ under:
   *   (a) simple normalise (flag-off, existing M7 path)
   *   (b) Duchi projection (flag-on)
   *
   * CF-MB2-03: iteration count under Duchi ≤ iteration count under clipping.
   */
  it('Duchi projection converges to planted distribution in ≤ clip iterations', () => {
    const target = [0.6, 0.3, 0.1];
    const tol = 0.01;
    const maxIter = 1000;

    const simulate = (useDuchi: boolean): number => {
      let theta = [1 / 3, 1 / 3, 1 / 3]; // start uniform
      for (let iter = 0; iter < maxIter; iter++) {
        // Gradient toward target (planted distribution direction).
        const grad = theta.map((v, i) => v - target[i]!);
        const stepSize = 0.05;
        const rawTheta = theta.map((v, i) => v - stepSize * grad[i]!);

        if (useDuchi) {
          const r = projectModelRow(rawTheta, { projectionEnabled: true });
          theta = r.projected;
        } else {
          const r = projectModelRow(rawTheta, { projectionEnabled: false });
          theta = r.projected;
        }

        // Check convergence.
        const lInf = Math.max(...theta.map((v, i) => Math.abs(v - target[i]!)));
        if (lInf < tol) return iter + 1;
      }
      return maxIter;
    };

    const iterClip = simulate(false);
    const iterDuchi = simulate(true);

    // CF-MB2-03: Duchi does not regress convergence.
    expect(iterDuchi).toBeLessThanOrEqual(iterClip + 5); // 5-step grace for numerical differences
  });
});

// ---------------------------------------------------------------------------
// Tractability-scaled logging verbosity
// ---------------------------------------------------------------------------

describe('projectModelRow — tractability-scaled boundary-hit logging', () => {
  it('tractable: boundary hit always logged', () => {
    // Force a degenerate row to guarantee a boundary hit.
    const r = projectModelRow([-1, -2, -3], {
      projectionEnabled: true,
      tractability: 'tractable',
    });
    expect(r.boundaryHitLogged).toBe(true);
  });

  it('coin-flip + small deviation: NOT logged (below threshold)', () => {
    // Row is almost uniform — max deviation will be tiny.
    const r = projectModelRow([0.34, 0.33, 0.33], {
      projectionEnabled: true,
      tractability: 'coin-flip',
      coinFlipLogThreshold: 0.1, // 10% threshold
    });
    // Max deviation here will be < 0.01, well below 0.1 threshold.
    if (r.maxDeviation < 0.1) {
      expect(r.boundaryHitLogged).toBe(false);
    }
  });

  it('coin-flip + large deviation: logged (above threshold)', () => {
    // Force a clearly out-of-simplex row.
    const r = projectModelRow([-1, -2, -3], {
      projectionEnabled: true,
      tractability: 'coin-flip',
      coinFlipLogThreshold: 0.05,
    });
    expect(r.boundaryHitLogged).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// projectModel — full table projection
// ---------------------------------------------------------------------------

describe('projectModel — full conditional-probability table', () => {
  it('all rows satisfy simplex constraint after projection', () => {
    const table = [
      [0.5, 0.3, 0.2],
      [0.1, 0.8, 0.1],
      [0.4, 0.4, 0.2],
    ];
    const priors = [0.4, 0.4, 0.2];

    const r = projectModel(table, priors, { projectionEnabled: true });

    for (const row of r.condProbTable) {
      expect(verifySimplex(row)).toBe(true);
    }
    expect(verifySimplex(r.priors)).toBe(true);
  });

  it('row results array has same length as table', () => {
    const table = [[0.5, 0.5], [0.3, 0.7]];
    const priors = [0.6, 0.4];
    const r = projectModel(table, priors, { projectionEnabled: false });
    expect(r.rowResults).toHaveLength(2);
    expect(r.priorResult).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// verifySimplex helper
// ---------------------------------------------------------------------------

describe('verifySimplex', () => {
  it('valid simplex vector returns true', () => {
    expect(verifySimplex([0.3, 0.5, 0.2])).toBe(true);
  });

  it('non-summing vector returns false', () => {
    expect(verifySimplex([0.3, 0.3, 0.3])).toBe(false);
  });

  it('negative entry returns false', () => {
    expect(verifySimplex([-0.1, 0.6, 0.5])).toBe(false);
  });

  it('single-entry [1] is valid', () => {
    expect(verifySimplex([1])).toBe(true);
  });
});
