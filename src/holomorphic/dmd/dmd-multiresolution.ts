/**
 * mrDMD — Multi-Resolution Dynamic Mode Decomposition
 *
 * Applies DMD recursively at multiple time scales, separating slow
 * (low-frequency) dynamics from fast (high-frequency) dynamics.
 *
 * Algorithm:
 * 1. Apply standard DMD to the full signal
 * 2. Identify slow modes (eigenvalues near 1 on the real axis)
 * 3. Subtract slow mode contribution from the data
 * 4. Recurse on the residual to extract the next resolution level
 *
 * Reference: Kutz, Fu, Brunton (2016) — "Multiresolution DMD"
 */

import type { SnapshotMatrix, DMDResult } from './types.js';
import type { ComplexNumber } from '../types.js';
import { magnitude, argument, mul, add, cexp } from '../complex/arithmetic.js';
import { dmd } from './dmd-core.js';

/** Frequency threshold for slow mode identification (radians) */
const SLOW_MODE_THRESHOLD = 0.3;

/**
 * Compute Multi-Resolution DMD.
 *
 * Decomposes a signal into multiple resolution levels, each capturing
 * dynamics at a different time scale. Level 0 contains the slowest
 * modes; subsequent levels contain progressively faster dynamics.
 *
 * @param snapshots - SnapshotMatrix of measurements
 * @param maxLevels - Maximum number of resolution levels to extract
 * @param rank - Optional SVD truncation rank per level
 * @returns Array of DMDResult, one per resolution level
 */
export function mrdmd(
  snapshots: SnapshotMatrix,
  maxLevels: number,
  rank?: number,
): DMDResult[] {
  const results: DMDResult[] = [];
  let currentData = snapshots.data.map(row => [...row]);

  for (let level = 0; level < maxLevels; level++) {
    const currentSnap: SnapshotMatrix = {
      data: currentData,
      timestamps: snapshots.timestamps,
      labels: snapshots.labels,
    };

    // Check if remaining signal has enough energy
    let energy = 0;
    for (const snap of currentData) {
      for (const val of snap) {
        energy += val * val;
      }
    }
    if (energy < 1e-10) break;

    // Apply DMD at this level
    const result = dmd(currentSnap, rank);
    if (result.eigenvalues.length === 0) break;

    results.push(result);

    // Separate slow and fast modes
    const dim = currentData[0].length;
    const nSnapshots = currentData.length;

    // Subtract the contribution of slow modes from the data
    // Slow modes: eigenvalues with small frequency (near real axis)
    const slowIndices: number[] = [];
    for (let k = 0; k < result.eigenvalues.length; k++) {
      const freq = Math.abs(result.frequencies[k]);
      if (freq < SLOW_MODE_THRESHOLD) {
        slowIndices.push(k);
      }
    }

    // If no slow modes found, use all modes for subtraction and stop
    const indicesToSubtract = slowIndices.length > 0
      ? slowIndices
      : Array.from({ length: result.eigenvalues.length }, (_, i) => i);

    // Reconstruct slow-mode contribution and subtract
    const residual: number[][] = currentData.map(row => [...row]);
    for (let t = 0; t < nSnapshots; t++) {
      for (let d = 0; d < dim; d++) {
        let slowContribution = 0;
        for (const k of indicesToSubtract) {
          const lambdaT = cexp({
            re: result.growthRates[k] * t,
            im: result.frequencies[k] * t,
          });
          const ampMode = mul(result.amplitudes[k], result.modes[k][d]);
          const contribution = mul(ampMode, lambdaT);
          slowContribution += contribution.re;
        }
        residual[t][d] -= slowContribution;
      }
    }

    currentData = residual;

    // If we subtracted all modes, the residual should be small
    if (slowIndices.length === 0) break;
  }

  return results;
}
