/**
 * Dynamic Mode Decomposition — Educational Implementation
 *
 * This is a pedagogical implementation of the standard DMD algorithm,
 * designed for clarity rather than production performance. It uses
 * explicit power iteration for SVD and direct eigensolvers for small
 * matrices, making each algorithmic step transparent.
 *
 * Algorithm overview:
 * 1. Form X (snapshots 0..n-2) and X' (snapshots 1..n-1)
 * 2. Compute SVD of X via power iteration
 * 3. Project to reduced space: A_tilde = U^T X' V Sigma^{-1}
 * 4. Compute eigenvalues/eigenvectors of A_tilde
 * 5. Recover modes, amplitudes, frequencies, growth rates
 */

import type { ComplexNumber } from '../types.js';
import { magnitude, argument, mul, add, cexp } from '../complex/arithmetic.js';
import type { SnapshotMatrix, DMDResult, DMDEigenvalueClassification } from './types.js';

/** Tolerance for near-zero checks */
const EPS = 1e-12;

/** Angle threshold for oscillatory classification (radians) */
const OSCILLATION_ANGLE_THRESHOLD = 0.1;

/** Magnitude tolerance for unit circle proximity */
const UNIT_CIRCLE_TOLERANCE = 0.01;

/* ------------------------------------------------------------------ */
/*  Matrix utilities                                                    */
/* ------------------------------------------------------------------ */

/** Transpose a real matrix */
function transpose(A: number[][]): number[][] {
  if (A.length === 0) return [];
  const rows = A.length;
  const cols = A[0].length;
  const result: number[][] = Array.from({ length: cols }, () => new Array(rows));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

/** Multiply two real matrices */
function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B[0].length;
  const k = B.length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let p = 0; p < k; p++) {
        sum += A[i][p] * B[p][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

/** Multiply matrix by vector */
function matVecMul(A: number[][], v: number[]): number[] {
  return A.map(row => row.reduce((sum, val, j) => sum + val * v[j], 0));
}

/** Vector dot product */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Vector L2 norm */
function vecNorm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

/** Normalize a vector in-place, returns its original norm */
function normalize(v: number[]): number {
  const n = vecNorm(v);
  if (n > EPS) {
    for (let i = 0; i < v.length; i++) v[i] /= n;
  }
  return n;
}

/** Frobenius norm of a matrix */
function frobeniusNorm(A: number[][]): number {
  let sum = 0;
  for (const row of A) {
    for (const val of row) {
      sum += val * val;
    }
  }
  return Math.sqrt(sum);
}

/* ------------------------------------------------------------------ */
/*  SVD via power iteration (educational quality)                       */
/* ------------------------------------------------------------------ */

/**
 * Compute the Singular Value Decomposition of a real matrix via
 * repeated power iteration with deflation.
 *
 * Returns U, S, V such that A ~ U * diag(S) * V^T.
 *
 * Designed for small matrices (up to ~10x10). For larger matrices
 * a proper Householder bidiagonalization + QR iteration would be used.
 */
export function svd(
  matrix: number[][],
): { U: number[][]; S: number[]; V: number[][] } {
  const m = matrix.length;
  if (m === 0) return { U: [], S: [], V: [] };
  const n = matrix[0].length;
  const rank = Math.min(m, n);

  // Work on a copy for deflation
  let A = matrix.map(row => [...row]);

  const U: number[][] = [];
  const S: number[] = [];
  const V: number[][] = [];

  for (let k = 0; k < rank; k++) {
    // Power iteration to find dominant singular triplet
    let v = new Array(n).fill(0).map(() => Math.random() - 0.5);
    normalize(v);

    let sigma = 0;
    let u = new Array(m).fill(0);

    for (let iter = 0; iter < 200; iter++) {
      // u = A * v
      u = matVecMul(A, v);
      sigma = normalize(u);

      if (sigma < EPS) break;

      // v = A^T * u
      const At = transpose(A);
      v = matVecMul(At, u);
      normalize(v);
    }

    if (sigma < EPS) break;

    U.push(u);
    S.push(sigma);
    V.push(v);

    // Deflate: A = A - sigma * u * v^T
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        A[i][j] -= sigma * u[i] * v[j];
      }
    }
  }

  return { U, S, V };
}

/* ------------------------------------------------------------------ */
/*  2x2 eigenvalue solver                                               */
/* ------------------------------------------------------------------ */

/**
 * Solve eigenvalues of a 2x2 real matrix via the quadratic formula.
 *
 * For [[a, b], [c, d]], the characteristic polynomial is
 * lambda^2 - (a+d)*lambda + (ad - bc) = 0
 */
function eigen2x2(
  M: number[][],
): { eigenvalues: ComplexNumber[]; eigenvectors: ComplexNumber[][] } {
  const a = M[0][0], b = M[0][1];
  const c = M[1][0], d = M[1][1];

  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  const eigenvalues: ComplexNumber[] = [];
  const eigenvectors: ComplexNumber[][] = [];

  if (disc >= 0) {
    const sqrtDisc = Math.sqrt(disc);
    const l1 = (trace + sqrtDisc) / 2;
    const l2 = (trace - sqrtDisc) / 2;
    eigenvalues.push({ re: l1, im: 0 }, { re: l2, im: 0 });

    // Eigenvectors
    for (const lam of [l1, l2]) {
      if (Math.abs(b) > EPS) {
        eigenvectors.push([
          { re: b, im: 0 },
          { re: lam - a, im: 0 },
        ]);
      } else if (Math.abs(c) > EPS) {
        eigenvectors.push([
          { re: lam - d, im: 0 },
          { re: c, im: 0 },
        ]);
      } else {
        // Diagonal matrix
        if (Math.abs(lam - a) < EPS) {
          eigenvectors.push([{ re: 1, im: 0 }, { re: 0, im: 0 }]);
        } else {
          eigenvectors.push([{ re: 0, im: 0 }, { re: 1, im: 0 }]);
        }
      }
    }
  } else {
    const realPart = trace / 2;
    const imagPart = Math.sqrt(-disc) / 2;
    eigenvalues.push(
      { re: realPart, im: imagPart },
      { re: realPart, im: -imagPart },
    );

    // Complex conjugate eigenvectors
    if (Math.abs(b) > EPS) {
      eigenvectors.push(
        [{ re: b, im: 0 }, { re: realPart - a, im: imagPart }],
        [{ re: b, im: 0 }, { re: realPart - a, im: -imagPart }],
      );
    } else {
      eigenvectors.push(
        [{ re: 1, im: 0 }, { re: 0, im: 1 }],
        [{ re: 1, im: 0 }, { re: 0, im: -1 }],
      );
    }
  }

  return { eigenvalues, eigenvectors };
}

/* ------------------------------------------------------------------ */
/*  General eigenvalue solver (QR iteration for small matrices)         */
/* ------------------------------------------------------------------ */

/**
 * Compute eigenvalues of a small real square matrix via QR iteration.
 *
 * Uses a simplified QR algorithm with Gram-Schmidt orthogonalization.
 * For 1x1 or 2x2, uses direct formulas. For larger matrices (up to ~10x10),
 * runs QR iteration to converge to a quasi-upper-triangular form, then
 * extracts eigenvalues from the 1x1 and 2x2 diagonal blocks.
 */
function eigensolve(
  M: number[][],
): { eigenvalues: ComplexNumber[]; eigenvectors: ComplexNumber[][] } {
  const n = M.length;

  if (n === 0) return { eigenvalues: [], eigenvectors: [] };

  if (n === 1) {
    return {
      eigenvalues: [{ re: M[0][0], im: 0 }],
      eigenvectors: [[{ re: 1, im: 0 }]],
    };
  }

  if (n === 2) return eigen2x2(M);

  // QR iteration for larger matrices
  let A = M.map(row => [...row]);
  const maxIter = 300;

  for (let iter = 0; iter < maxIter; iter++) {
    // QR decomposition via Gram-Schmidt
    const { Q, R } = qrDecompose(A);
    // A = R * Q (reverse multiply for QR iteration)
    A = matMul(R, Q);

    // Check convergence: sub-diagonal elements should be small
    let converged = true;
    for (let i = 1; i < n; i++) {
      if (Math.abs(A[i][i - 1]) > 1e-10) {
        converged = false;
        break;
      }
    }
    if (converged) break;
  }

  // Extract eigenvalues from quasi-upper-triangular form
  const eigenvalues: ComplexNumber[] = [];
  const eigenvectors: ComplexNumber[][] = [];
  let i = 0;
  while (i < n) {
    if (i + 1 < n && Math.abs(A[i + 1][i]) > 1e-10) {
      // 2x2 block on diagonal
      const block = [
        [A[i][i], A[i][i + 1]],
        [A[i + 1][i], A[i + 1][i + 1]],
      ];
      const blockResult = eigen2x2(block);
      eigenvalues.push(...blockResult.eigenvalues);
      // Approximate eigenvectors (identity-like for educational purposes)
      for (let k = 0; k < 2; k++) {
        const ev: ComplexNumber[] = new Array(n).fill(null).map(() => ({ re: 0, im: 0 }));
        ev[i] = { re: 1, im: 0 };
        if (i + 1 < n) ev[i + 1] = blockResult.eigenvectors[k][1];
        eigenvectors.push(ev);
      }
      i += 2;
    } else {
      // 1x1 block
      eigenvalues.push({ re: A[i][i], im: 0 });
      const ev: ComplexNumber[] = new Array(n).fill(null).map(() => ({ re: 0, im: 0 }));
      ev[i] = { re: 1, im: 0 };
      eigenvectors.push(ev);
      i++;
    }
  }

  return { eigenvalues, eigenvectors };
}

/**
 * QR decomposition via modified Gram-Schmidt.
 */
function qrDecompose(A: number[][]): { Q: number[][]; R: number[][] } {
  const m = A.length;
  const n = A[0].length;
  const Q: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  const R: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  // Extract columns
  const columns: number[][] = [];
  for (let j = 0; j < n; j++) {
    columns.push(A.map(row => row[j]));
  }

  const basis: number[][] = [];

  for (let j = 0; j < n; j++) {
    let v = [...columns[j]];

    // Subtract projections onto previous basis vectors
    for (let k = 0; k < basis.length; k++) {
      const proj = dot(v, basis[k]);
      R[k][j] = proj;
      for (let i = 0; i < m; i++) {
        v[i] -= proj * basis[k][i];
      }
    }

    const norm = vecNorm(v);
    R[j][j] = norm;

    if (norm > EPS) {
      for (let i = 0; i < m; i++) v[i] /= norm;
    }
    basis.push(v);

    // Write into Q columns
    for (let i = 0; i < m; i++) {
      Q[i][j] = v[i];
    }
  }

  return { Q, R };
}

/* ------------------------------------------------------------------ */
/*  Standard DMD                                                        */
/* ------------------------------------------------------------------ */

/**
 * Compute the Dynamic Mode Decomposition of a snapshot matrix.
 *
 * The standard DMD algorithm:
 * 1. Form X (snapshots 0..n-2) and X' (snapshots 1..n-1)
 * 2. SVD: X = U * Sigma * V^T
 * 3. Project: A_tilde = U^T * X' * V * Sigma^{-1}
 * 4. Eigendecompose A_tilde to get eigenvalues and modes
 *
 * @param snapshots - SnapshotMatrix where data[i] is snapshot i
 * @param rank - Optional SVD truncation rank (defaults to full rank)
 * @returns DMDResult with modes, eigenvalues, amplitudes, frequencies, growth rates
 */
export function dmd(snapshots: SnapshotMatrix, rank?: number): DMDResult {
  const { data } = snapshots;
  const nSnapshots = data.length;

  if (nSnapshots < 2) {
    return {
      modes: [],
      eigenvalues: [],
      amplitudes: [],
      frequencies: [],
      growthRates: [],
      svdRank: 0,
      residual: 0,
    };
  }

  // Form X (snapshots 0..n-2) and X' (snapshots 1..n-1) as column matrices
  // data[i] is a column vector (snapshot i)
  const dim = data[0].length;

  // Build X: each column is a snapshot, so X is dim x (nSnapshots-1)
  const X: number[][] = Array.from({ length: dim }, () => []);
  const Xprime: number[][] = Array.from({ length: dim }, () => []);

  for (let t = 0; t < nSnapshots - 1; t++) {
    for (let d = 0; d < dim; d++) {
      X[d].push(data[t][d]);
      Xprime[d].push(data[t + 1][d]);
    }
  }

  // SVD of X
  const svdResult = svd(X);
  const r = rank ?? svdResult.S.filter(s => s > EPS).length;
  const actualRank = Math.min(r, svdResult.S.length);

  if (actualRank === 0) {
    return {
      modes: [],
      eigenvalues: [],
      amplitudes: [],
      frequencies: [],
      growthRates: [],
      svdRank: 0,
      residual: frobeniusNorm(Xprime),
    };
  }

  // Truncate SVD to rank r
  // svdResult.U[k] is the k-th left singular vector (length m = dim)
  // svdResult.V[k] is the k-th right singular vector (length n = nSnapshots-1)
  // We need U as dim x r matrix, V as (nSnapshots-1) x r matrix
  const Ur: number[][] = Array.from({ length: dim }, (_, i) =>
    Array.from({ length: actualRank }, (_, k) => svdResult.U[k][i]),
  );
  const Vr: number[][] = Array.from({ length: nSnapshots - 1 }, (_, i) =>
    Array.from({ length: actualRank }, (_, k) => svdResult.V[k][i]),
  );
  const SigmaInv: number[] = svdResult.S.slice(0, actualRank).map(s => 1 / s);

  // A_tilde = U^T * X' * V * Sigma^{-1}   (r x r matrix)
  const UtXprime = matMul(transpose(Ur), Xprime); // r x (nSnapshots-1)
  const UtXprimeV = matMul(UtXprime, Vr);          // r x r

  // Scale by Sigma^{-1}: multiply each column j by SigmaInv[j]
  const Atilde: number[][] = UtXprimeV.map(row =>
    row.map((val, j) => val * SigmaInv[j]),
  );

  // Eigendecompose A_tilde
  const { eigenvalues, eigenvectors } = eigensolve(Atilde);

  // Compute DMD modes: Phi = X' * V * Sigma^{-1} * W
  // where W is the eigenvector matrix of A_tilde
  // For educational simplicity, compute modes in reduced space first
  const modes: ComplexNumber[][] = [];
  const amplitudes: ComplexNumber[] = [];
  const frequencies: number[] = [];
  const growthRates: number[] = [];

  for (let k = 0; k < eigenvalues.length; k++) {
    const eig = eigenvalues[k];

    // Mode as a complex vector in the original space
    // Simplified: project eigenvector through U to get mode shape
    const mode: ComplexNumber[] = new Array(dim).fill(null).map(() => ({ re: 0, im: 0 }));
    const ev = eigenvectors[k];

    for (let i = 0; i < dim; i++) {
      let re = 0, im = 0;
      for (let j = 0; j < Math.min(ev.length, actualRank); j++) {
        re += Ur[i][j] * ev[j].re;
        im += Ur[i][j] * ev[j].im;
      }
      mode[i] = { re, im };
    }
    modes.push(mode);

    // Amplitude from initial snapshot projection
    const x0 = data[0];
    let ampRe = 0, ampIm = 0;
    for (let i = 0; i < dim; i++) {
      // conjugate dot product with mode
      const modeNormSq = mode[i].re * mode[i].re + mode[i].im * mode[i].im;
      if (modeNormSq > EPS) {
        ampRe += x0[i] * mode[i].re;
        ampIm += -x0[i] * mode[i].im; // conjugate
      }
    }
    const modeNorm = Math.sqrt(mode.reduce((s, m) => s + m.re * m.re + m.im * m.im, 0));
    if (modeNorm > EPS) {
      ampRe /= modeNorm * modeNorm;
      ampIm /= modeNorm * modeNorm;
    }
    amplitudes.push({ re: ampRe, im: ampIm });

    // Frequency = Im(log(lambda)) and growth rate = Re(log(lambda))
    const mag_eig = magnitude(eig);
    const arg_eig = argument(eig);
    growthRates.push(mag_eig > EPS ? Math.log(mag_eig) : -Infinity);
    frequencies.push(arg_eig);
  }

  // Compute reconstruction residual
  let residual = 0;
  for (let t = 0; t < nSnapshots - 1; t++) {
    for (let d = 0; d < dim; d++) {
      let reconRe = 0;
      for (let k = 0; k < eigenvalues.length; k++) {
        // x(t) ~ sum_k amplitude_k * mode_k * lambda_k^t
        const lambdaT = cexp({
          re: growthRates[k] * t,
          im: frequencies[k] * t,
        });
        const ampMode = mul(amplitudes[k], modes[k][d]);
        const contribution = mul(ampMode, lambdaT);
        reconRe += contribution.re;
      }
      const diff = data[t][d] - reconRe;
      residual += diff * diff;
    }
  }
  residual = Math.sqrt(residual);

  return {
    modes,
    eigenvalues,
    amplitudes,
    frequencies,
    growthRates,
    svdRank: actualRank,
    residual,
  };
}

/* ------------------------------------------------------------------ */
/*  Eigenvalue classification                                           */
/* ------------------------------------------------------------------ */

/**
 * Classify a DMD eigenvalue based on its position relative to the
 * unit circle and its oscillatory behavior.
 *
 * - |lambda| < 1, small angle: attracting (decaying, non-oscillatory)
 * - |lambda| > 1, small angle: repelling (growing, non-oscillatory)
 * - |lambda| ~ 1, small angle: neutral (persistent)
 * - |lambda| < 1, large angle: oscillating_decay
 * - |lambda| > 1, large angle: oscillating_growth
 */
export function classifyDMDEigenvalue(
  eigenvalue: ComplexNumber,
): DMDEigenvalueClassification {
  const mag = magnitude(eigenvalue);
  const angle = Math.abs(argument(eigenvalue));
  const isOscillatory = angle > OSCILLATION_ANGLE_THRESHOLD;

  if (mag < 1 - UNIT_CIRCLE_TOLERANCE) {
    return isOscillatory ? 'oscillating_decay' : 'attracting';
  }

  if (mag > 1 + UNIT_CIRCLE_TOLERANCE) {
    return isOscillatory ? 'oscillating_growth' : 'repelling';
  }

  return 'neutral';
}

/* ------------------------------------------------------------------ */
/*  Signal reconstruction                                               */
/* ------------------------------------------------------------------ */

/**
 * Reconstruct the system state at time t from a DMD decomposition.
 *
 * x(t) = sum_k amplitude_k * mode_k * lambda_k^t
 *       = sum_k amplitude_k * mode_k * exp((growthRate_k + i*frequency_k) * t)
 */
export function reconstructFromDMD(
  result: DMDResult,
  t: number,
): ComplexNumber[] {
  if (result.modes.length === 0) return [];

  const dim = result.modes[0].length;
  const reconstruction: ComplexNumber[] = new Array(dim)
    .fill(null)
    .map(() => ({ re: 0, im: 0 }));

  for (let k = 0; k < result.eigenvalues.length; k++) {
    const lambdaT = cexp({
      re: result.growthRates[k] * t,
      im: result.frequencies[k] * t,
    });

    for (let d = 0; d < dim; d++) {
      const ampMode = mul(result.amplitudes[k], result.modes[k][d]);
      const contribution = mul(ampMode, lambdaT);
      reconstruction[d] = add(reconstruction[d], contribution);
    }
  }

  return reconstruction;
}
