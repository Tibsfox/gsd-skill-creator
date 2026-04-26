/**
 * v1.49.580 W2 — Sliced-Wasserstein primitive (multivariate IPM).
 *
 * Anchors:
 *   - Rabin et al. (2011), "Wasserstein Barycenter and Its Application
 *     to Texture Mixing" — original sliced-Wasserstein construction
 *   - Kolouri et al. (2019), "Generalized Sliced Wasserstein Distances"
 *     — modern survey
 *
 * Algorithm: SW(P, Q) = E_{u ~ Uniform(S^(d-1))} [W1(P_u, Q_u)]
 * where P_u, Q_u are the 1-D projections of P, Q onto the unit vector u.
 *
 * Approximated by Monte-Carlo: sample M random unit vectors, compute W1
 * along each direction, average. Reduces to W1 in d=1 (the only direction
 * is ±1; any unit vector projects identity).
 *
 * Reuses `wasserstein1d` from `src/ab-harness/wasserstein-boed.ts` (the
 * 1-D primitive — correct as authored, used directly).
 *
 * @module bayes-ab/sliced-wasserstein
 */

import { wasserstein1d } from '../ab-harness/wasserstein-boed.js';
import { mulberry32 } from './ipm-boed.js';
import type { SeedableRng } from './types.js';

/**
 * A multivariate empirical distribution: array of points in R^d.
 * Each row is one sample. All rows must have the same length d.
 */
export interface MvEmpiricalDistribution {
  /** Each row is one point in R^d. */
  samples: number[][];
}

export interface SlicedWassersteinOptions {
  /** Number of random projection directions to average. Default 64. */
  projections?: number;
  /** Seedable RNG (defaults to mulberry32(0)). */
  rng?: SeedableRng;
}

/**
 * Sliced-Wasserstein-1 distance between two multivariate empirical
 * distributions in R^d. Monte-Carlo estimate over `projections` random
 * unit-vector directions.
 *
 * Throws on dimensionality mismatch (P samples are R^d_p, Q samples are
 * R^d_q with d_p ≠ d_q).
 */
export function slicedWasserstein(
  p: MvEmpiricalDistribution,
  q: MvEmpiricalDistribution,
  opts: SlicedWassersteinOptions = {},
): number {
  if (p.samples.length === 0 || q.samples.length === 0) {
    throw new RangeError('slicedWasserstein: both distributions must have at least one sample');
  }
  const dp = p.samples[0].length;
  const dq = q.samples[0].length;
  if (dp !== dq) {
    throw new RangeError(`slicedWasserstein: dimensionality mismatch (P is R^${dp}, Q is R^${dq})`);
  }
  // Verify all rows have consistent dimensionality (defensive).
  for (const row of p.samples) {
    if (row.length !== dp) {
      throw new RangeError(`slicedWasserstein: P has rows of differing dimensions (${dp} vs ${row.length})`);
    }
  }
  for (const row of q.samples) {
    if (row.length !== dq) {
      throw new RangeError(`slicedWasserstein: Q has rows of differing dimensions (${dq} vs ${row.length})`);
    }
  }

  const M = opts.projections ?? 64;
  if (!Number.isInteger(M) || M < 1) {
    throw new RangeError(`slicedWasserstein: projections must be a positive integer (got ${M})`);
  }
  const rng = opts.rng ?? mulberry32(0);

  let total = 0;
  for (let m = 0; m < M; m++) {
    const u = randomUnitVector(dp, rng);
    const pProj = projectAll(p.samples, u);
    const qProj = projectAll(q.samples, u);
    total += wasserstein1d({ samples: pProj }, { samples: qProj });
  }
  return total / M;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Sample one uniform draw from the unit sphere S^(d-1) via standard normals + L2 normalisation. */
function randomUnitVector(d: number, rng: SeedableRng): number[] {
  const v = new Array<number>(d);
  let normSq = 0;
  for (let i = 0; i < d; i++) {
    const x = standardNormal(rng);
    v[i] = x;
    normSq += x * x;
  }
  let norm = Math.sqrt(normSq);
  // Defensive: if all draws were ~0 (vanishingly rare), retry by perturbing.
  // In practice the standard normal sampler returns finite values so this is a guard.
  if (norm === 0) {
    v[0] = 1;
    norm = 1;
  }
  for (let i = 0; i < d; i++) v[i] /= norm;
  return v;
}

/** Project every row of `points` onto direction `u` (returns length-N array of dot products). */
function projectAll(points: number[][], u: number[]): number[] {
  const out = new Array<number>(points.length);
  for (let i = 0; i < points.length; i++) {
    let s = 0;
    for (let j = 0; j < u.length; j++) s += points[i][j] * u[j];
    out[i] = s;
  }
  return out;
}

/** Standard normal via Box-Muller, single draw. */
function standardNormal(rng: SeedableRng): number {
  let u1 = rng.next();
  if (u1 < 1e-300) u1 = 1e-300;
  const u2 = rng.next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
