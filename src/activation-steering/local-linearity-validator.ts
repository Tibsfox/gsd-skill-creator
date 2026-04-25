/**
 * Local-linearity validator (Phase 767).
 *
 * Runtime check that the local-linearity assumption from arXiv:2604.19018
 * (Skifstad, Yang, Chou) holds across an activation-vector regime. The
 * paper's central empirical claim is that LLM activations are well-
 * approximated by an affine map within a neighbourhood of the operating
 * point. We test this by fitting a least-squares linear model
 *
 *     y_i ≈ a + b · x_i
 *
 * over a sample of (current, next) activation pairs and computing the
 * normalised residual:
 *
 *     normalisedResidual = (Σ_i ‖y_i − ŷ_i‖² / N) / (Var(y) + ε)
 *
 * If the residual exceeds a configurable threshold the validator emits
 * a warning. The result is advisory-only; it never throws and never
 * blocks downstream control flow.
 *
 * Numerical notes:
 *   - All work is done elementwise on flat `number[]`/`Float64Array`;
 *     no matrix library is needed.
 *   - Variance uses an unbiased estimator (N−1) when N ≥ 2; when N == 1
 *     the residual is reported as 0 with a warning that the sample is
 *     too small to be meaningful.
 *
 * @module activation-steering/local-linearity-validator
 */

import { DEFAULT_LINEARITY_THRESHOLD } from './settings.js';
import type { LinearityFit } from './types.js';

/** A single observation pair in the local neighbourhood. */
export interface LinearitySample {
  /** Vector at step n (input activation). */
  readonly x: readonly number[];
  /** Vector at step n+1 (observed next activation). */
  readonly y: readonly number[];
}

/**
 * Fit a per-coordinate affine model `y_i = a_i + b_i * x_i` over the
 * supplied samples and return the normalised residual + warning flag.
 *
 * Per-coordinate fits make the validator robust to high-dimensional
 * vectors: each component is fit independently and the residuals are
 * averaged at the end. This matches the local-linearity argument in
 * §3 of arXiv:2604.19018 — the linearisation is taken with respect to
 * the joint operating point, but residuals are aggregated coordinate-
 * wise to give a single scalar.
 *
 * @param samples  Two or more (x, y) pairs (same length each)
 * @param threshold Residual threshold in (0, 1]; default 0.1.
 */
export function validateLocalLinearity(
  samples: readonly LinearitySample[],
  threshold: number = DEFAULT_LINEARITY_THRESHOLD,
): LinearityFit {
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
    throw new Error(
      `validateLocalLinearity: threshold must be in (0,1], got ${threshold}`,
    );
  }
  const n = samples.length;
  if (n === 0) {
    return {
      normalisedResidual: 0,
      withinThreshold: true,
      threshold,
      samples: 0,
      warning: 'no samples — local-linearity could not be validated',
    };
  }
  if (n === 1) {
    return {
      normalisedResidual: 0,
      withinThreshold: true,
      threshold,
      samples: 1,
      warning: 'single sample — local-linearity could not be validated',
    };
  }

  const dim = samples[0]!.x.length;
  if (dim === 0) {
    return {
      normalisedResidual: 0,
      withinThreshold: true,
      threshold,
      samples: n,
      warning: 'zero-dimensional samples',
    };
  }
  for (const s of samples) {
    if (s.x.length !== dim || s.y.length !== dim) {
      throw new Error(
        `validateLocalLinearity: inconsistent sample dimensionality`,
      );
    }
  }

  // Per-coordinate ordinary least squares on (x_i, y_i) pairs.
  let totalResidualSq = 0;
  let totalVariance = 0;
  for (let d = 0; d < dim; d++) {
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += samples[i]!.x[d]!;
      sumY += samples[i]!.y[d]!;
    }
    const meanX = sumX / n;
    const meanY = sumY / n;

    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = samples[i]!.x[d]! - meanX;
      const dy = samples[i]!.y[d]! - meanY;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    }

    // Slope: b = sxy / sxx (zero if x has no variance — flat line).
    const b = sxx > 1e-12 ? sxy / sxx : 0;
    const a = meanY - b * meanX;

    let residualSq = 0;
    for (let i = 0; i < n; i++) {
      const yhat = a + b * samples[i]!.x[d]!;
      const r = samples[i]!.y[d]! - yhat;
      residualSq += r * r;
    }

    totalResidualSq += residualSq / n; // mean-squared residual per coord
    totalVariance += syy / Math.max(1, n - 1); // unbiased variance per coord
  }

  const eps = 1e-12;
  const normalisedResidual = totalResidualSq / (totalVariance + eps);
  const withinThreshold = normalisedResidual <= threshold;
  const warning = withinThreshold
    ? undefined
    : `local-linearity residual ${normalisedResidual.toFixed(4)} exceeds threshold ${threshold}; controller delta may be unreliable`;
  return {
    normalisedResidual,
    withinThreshold,
    threshold,
    samples: n,
    warning,
  };
}
