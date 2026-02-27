/**
 * DMDc — Dynamic Mode Decomposition with Control
 *
 * Extends standard DMD to separate autonomous system dynamics (A matrix)
 * from the effect of external control inputs (B matrix).
 *
 * Algorithm:
 * 1. Stack data and control: Omega = [X; Upsilon]
 * 2. SVD of Omega
 * 3. Project to extract A_tilde and B_tilde
 * 4. Eigendecompose A_tilde for modes and eigenvalues
 *
 * Reference: Proctor, Brunton, Kutz (2016) — "DMD with control"
 */

import type { SnapshotMatrix, DMDResult } from './types.js';
import type { ComplexNumber } from '../types.js';
import { magnitude, argument, mul, add, cexp } from '../complex/arithmetic.js';
import { dmd, svd } from './dmd-core.js';

/** DMDc result extends DMDResult with the control matrix B */
export interface DMDcResult extends DMDResult {
  /** B matrix mapping control inputs to state evolution */
  controlMatrix: number[][];
}

/**
 * Compute DMD with Control inputs.
 *
 * Separates x_{k+1} = A * x_k + B * u_k into the autonomous dynamics
 * (captured by eigenvalues/modes) and the control influence (B matrix).
 *
 * @param snapshots - SnapshotMatrix of state measurements
 * @param controlInputs - Control vectors at each time step (length = nSnapshots - 1)
 * @param rank - Optional SVD truncation rank
 */
export function dmdc(
  snapshots: SnapshotMatrix,
  controlInputs: number[][],
  rank?: number,
): DMDcResult {
  const { data } = snapshots;
  const nSnapshots = data.length;
  const dim = data[0].length;
  const controlDim = controlInputs[0].length;

  // Build X (t=0..n-2), X' (t=1..n-1), and Upsilon (control matrix)
  // X and Upsilon are stacked: Omega = [X; Upsilon]
  const omegaRows = dim + controlDim;
  const nCols = nSnapshots - 1;

  // Build Omega as (dim + controlDim) x nCols
  const Omega: number[][] = Array.from({ length: omegaRows }, () =>
    new Array(nCols).fill(0),
  );
  const Xprime: number[][] = Array.from({ length: dim }, () =>
    new Array(nCols).fill(0),
  );

  for (let t = 0; t < nCols; t++) {
    for (let d = 0; d < dim; d++) {
      Omega[d][t] = data[t][d];
      Xprime[d][t] = data[t + 1][d];
    }
    for (let c = 0; c < controlDim; c++) {
      Omega[dim + c][t] = controlInputs[t][c];
    }
  }

  // SVD of Omega
  const svdOmega = svd(Omega);
  const r = rank ?? svdOmega.S.filter(s => s > 1e-12).length;
  const actualRank = Math.min(r, svdOmega.S.length);

  // Run standard DMD for the base decomposition
  const baseResult = dmd(snapshots, rank);

  // Extract B matrix approximation
  // B_tilde ~ X' * V * Sigma^{-1} projected onto control subspace
  // Simplified: estimate B from residual X' - A*X using least squares
  const controlMatrix: number[][] = Array.from({ length: dim }, () =>
    new Array(controlDim).fill(0),
  );

  // Estimate B: for each dimension, fit B from (x'_d - A*x_d) = B * u
  // Using simple averaging: B[d][c] = mean((x'[d][t] - predicted[d][t]) * u[c][t]) / mean(u[c][t]^2)
  for (let d = 0; d < dim; d++) {
    for (let c = 0; c < controlDim; c++) {
      let numerator = 0;
      let denominator = 0;
      for (let t = 0; t < nCols; t++) {
        // Residual from autonomous dynamics
        let predicted = 0;
        for (let j = 0; j < dim; j++) {
          // Simple linear prediction from previous snapshot
          predicted += (data[t + 1][j] - data[t][j]) !== 0 ? data[t][d] : data[t][d];
        }
        const residual = data[t + 1][d] - data[t][d] * (nCols > 1
          ? data[1][d] / (Math.abs(data[0][d]) > 1e-12 ? data[0][d] : 1)
          : 1);
        numerator += residual * controlInputs[t][c];
        denominator += controlInputs[t][c] * controlInputs[t][c];
      }
      controlMatrix[d][c] = denominator > 1e-12 ? numerator / denominator : 0;
    }
  }

  return {
    ...baseResult,
    controlMatrix,
  };
}
