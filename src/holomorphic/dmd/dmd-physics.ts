/**
 * piDMD — Physics-Informed Dynamic Mode Decomposition
 *
 * Constrains DMD eigenvalues to respect known physical properties,
 * particularly stability bounds. This mirrors skill-creator's bounded
 * learning principle: no unbounded growth is allowed.
 *
 * Algorithm:
 * 1. Compute standard DMD
 * 2. For each eigenvalue with |lambda| > stabilityBound:
 *    project onto the boundary circle of radius stabilityBound
 * 3. Recompute growth rates from constrained eigenvalues
 *
 * The piDMD constraint |lambda| <= 1 + epsilon directly parallels
 * skill-creator's 20% content change limit per refinement cycle.
 *
 * Reference: Baddoo et al. (2023) — "Physics-informed DMD"
 */

import type { SnapshotMatrix, DMDResult, DMDConstraints } from './types.js';
import type { ComplexNumber } from '../types.js';
import { magnitude, argument } from '../complex/arithmetic.js';
import { dmd } from './dmd-core.js';

/**
 * Compute Physics-Informed DMD with stability constraints.
 *
 * Enforces that all eigenvalues satisfy |lambda| <= stabilityBound.
 * Eigenvalues exceeding the bound are projected to the boundary
 * while preserving their phase (oscillatory character).
 *
 * @param snapshots - SnapshotMatrix of measurements
 * @param constraints - Stability and learning bounds
 * @param rank - Optional SVD truncation rank
 */
export function pidmd(
  snapshots: SnapshotMatrix,
  constraints: DMDConstraints,
  rank?: number,
): DMDResult {
  // Step 1: Standard DMD
  const result = dmd(snapshots, rank);

  if (result.eigenvalues.length === 0) return result;

  // Step 2: Constrain eigenvalues to stability bound
  const constrainedEigenvalues: ComplexNumber[] = result.eigenvalues.map(eig => {
    const mag = magnitude(eig);
    const ang = argument(eig);

    if (mag > constraints.stabilityBound) {
      // Project onto the boundary circle: preserve angle, clamp magnitude
      return {
        re: constraints.stabilityBound * Math.cos(ang),
        im: constraints.stabilityBound * Math.sin(ang),
      };
    }

    return { ...eig };
  });

  // Step 3: Recompute growth rates from constrained eigenvalues
  const constrainedGrowthRates = constrainedEigenvalues.map(eig => {
    const mag = magnitude(eig);
    return mag > 1e-12 ? Math.log(mag) : -Infinity;
  });

  // Enforce maxGrowthRate constraint
  const clampedGrowthRates = constrainedGrowthRates.map(gr =>
    gr > constraints.maxGrowthRate ? constraints.maxGrowthRate : gr,
  );

  // Recompute frequencies from constrained eigenvalues
  const constrainedFrequencies = constrainedEigenvalues.map(eig =>
    argument(eig),
  );

  return {
    ...result,
    eigenvalues: constrainedEigenvalues,
    growthRates: clampedGrowthRates,
    frequencies: constrainedFrequencies,
  };
}
