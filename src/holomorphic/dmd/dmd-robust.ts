/**
 * BOP-DMD — Bagging, Optimized DMD
 *
 * Uses bootstrap aggregation (bagging) to produce robust DMD estimates
 * from noisy data. Multiple bootstrap subsamples yield a distribution
 * of eigenvalues; the median provides a noise-resistant estimate.
 *
 * Algorithm:
 * 1. Draw nBootstrap random subsamples of the snapshot matrix
 * 2. Run standard DMD on each subsample
 * 3. Aggregate eigenvalues by taking the component-wise median
 * 4. Use the full-data DMD modes with the median eigenvalues
 *
 * Reference: Sashidhar & Kutz (2022) — "BOP-DMD"
 */

import type { SnapshotMatrix, DMDResult } from './types.js';
import type { ComplexNumber } from '../types.js';
import { magnitude, argument } from '../complex/arithmetic.js';
import { dmd } from './dmd-core.js';

/** Simple seeded random for reproducible subsampling */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Compute median of an array of numbers */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute BOP-DMD (Bagging Optimized DMD).
 *
 * Runs DMD on multiple bootstrap subsamples and aggregates the
 * eigenvalues via median, producing a noise-robust decomposition.
 *
 * @param snapshots - SnapshotMatrix of (possibly noisy) measurements
 * @param nBootstrap - Number of bootstrap samples to draw
 * @param rank - Optional SVD truncation rank
 * @returns DMDResult with median-aggregated eigenvalues
 */
export function bopdmd(
  snapshots: SnapshotMatrix,
  nBootstrap: number,
  rank?: number,
): DMDResult {
  const { data, timestamps, labels } = snapshots;
  const nSnapshots = data.length;

  // Run DMD on full data for base modes
  const baseResult = dmd(snapshots, rank);
  if (baseResult.eigenvalues.length === 0) return baseResult;

  const nEigs = baseResult.eigenvalues.length;

  // Collect eigenvalue magnitudes and angles from bootstrap samples
  const magSamples: number[][] = Array.from({ length: nEigs }, () => []);
  const angSamples: number[][] = Array.from({ length: nEigs }, () => []);

  const rng = seededRandom(42);

  for (let b = 0; b < nBootstrap; b++) {
    // Create bootstrap subsample: random indices with replacement
    // Keep at least 60% of snapshots for meaningful DMD
    const sampleSize = Math.max(
      Math.floor(nSnapshots * 0.7),
      Math.min(nSnapshots, 4),
    );
    const indices: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      indices.push(Math.floor(rng() * nSnapshots));
    }
    // Sort indices to maintain temporal order
    indices.sort((a, b) => a - b);
    // Remove duplicates for temporal ordering
    const uniqueIndices = [...new Set(indices)];
    if (uniqueIndices.length < 3) continue; // Need at least 3 snapshots

    const subsample: SnapshotMatrix = {
      data: uniqueIndices.map(i => data[i]),
      timestamps: uniqueIndices.map(i => timestamps[i]),
      labels: uniqueIndices.map(i => labels[i]),
    };

    const subResult = dmd(subsample, rank);

    // Match eigenvalues by index (simplified; production would use Hungarian matching)
    const subCount = Math.min(subResult.eigenvalues.length, nEigs);
    for (let k = 0; k < subCount; k++) {
      magSamples[k].push(magnitude(subResult.eigenvalues[k]));
      angSamples[k].push(argument(subResult.eigenvalues[k]));
    }
  }

  // Aggregate via median
  const medianEigenvalues: ComplexNumber[] = baseResult.eigenvalues.map((eig, k) => {
    if (magSamples[k].length === 0) return eig;

    const medMag = median(magSamples[k]);
    const medAng = median(angSamples[k]);
    return {
      re: medMag * Math.cos(medAng),
      im: medMag * Math.sin(medAng),
    };
  });

  // Recompute growth rates and frequencies from median eigenvalues
  const medianGrowthRates = medianEigenvalues.map(eig => {
    const mag = magnitude(eig);
    return mag > 1e-12 ? Math.log(mag) : -Infinity;
  });

  const medianFrequencies = medianEigenvalues.map(eig => argument(eig));

  return {
    ...baseResult,
    eigenvalues: medianEigenvalues,
    growthRates: medianGrowthRates,
    frequencies: medianFrequencies,
  };
}
