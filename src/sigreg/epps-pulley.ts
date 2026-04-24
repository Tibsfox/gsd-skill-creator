/**
 * Epps-Pulley empirical characteristic function test — ≤80-LOC core.
 *
 * Portions of this function's quadrature + ECF structure are derived from
 * rbalestr-lab/lejepa (MIT, © Randall Balestriero and LeJEPA Contributors).
 * See ../../license_notices.md for the full attribution.
 *
 * Implementation strategy (per LeJEPA §4.2.3):
 *   EP = N · ∫ |φ̂(t) − φ(t)|² w(t) dt,   w(t) = e^{−t²/σ²}
 * with Gauss-Hermite-style quadrature sampling of the weighted integral at
 * `numPoints` evaluation points. Linear O(N · numPoints) time; naturally
 * differentiable (no order statistics); multi-GPU friendly (ECF is an average).
 *
 * @module sigreg/epps-pulley
 */

import type { EppsPulleyConfig } from './types.js';

/** Standard-normal target characteristic function: φ(t) = e^{-t²/2}. */
function targetEcf(t: number): { re: number; im: number } {
  return { re: Math.exp(-0.5 * t * t), im: 0 };
}

/**
 * Epps-Pulley statistic for a 1-D sample against the standard-normal target.
 *
 * Quadrature points are fixed, symmetric, and evenly spaced on the σ window;
 * this trades theoretical optimality for determinism and cache friendliness.
 * Acceptable because LeJEPA notes the sweet spot is broad, not knife-edge.
 */
export function eppsPulley(
  samples: ReadonlyArray<number>,
  config: EppsPulleyConfig,
): number {
  const n = samples.length;
  if (n === 0) return 0;
  const { numPoints, sigma } = config;
  // Standardize so the target is N(0,1) — mirrors the reference implementation.
  let mean = 0;
  for (const v of samples) mean += v;
  mean /= n;
  let var0 = 0;
  for (const v of samples) var0 += (v - mean) * (v - mean);
  const std = Math.sqrt(var0 / Math.max(1, n)) || 1;
  // Quadrature grid over [-3σ, 3σ] excluding 0 (the ECF at 0 is always 1).
  const span = 3 * sigma;
  const step = (2 * span) / (numPoints + 1);
  let stat = 0;
  for (let p = 1; p <= numPoints; p++) {
    const t = -span + p * step;
    // ECF of the standardized sample.
    let cosSum = 0;
    let sinSum = 0;
    for (const v of samples) {
      const z = (v - mean) / std;
      const tz = t * z;
      cosSum += Math.cos(tz);
      sinSum += Math.sin(tz);
    }
    const ecfRe = cosSum / n;
    const ecfIm = sinSum / n;
    const tgt = targetEcf(t);
    const dre = ecfRe - tgt.re;
    const dim = ecfIm - tgt.im;
    const weight = Math.exp(-(t * t) / (sigma * sigma));
    stat += (dre * dre + dim * dim) * weight;
  }
  // Scale by step (discretized integral) and by N (Epps-Pulley normalization).
  return n * stat * step;
}
