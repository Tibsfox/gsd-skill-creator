/**
 * Koopman-Memory — operator core.
 *
 * Implements the M5 §m5-mamba bilinear update
 *
 *     h_{t+1} = A · h_t + h_t^⊤ K u_t
 *
 * per arXiv:2604.17221 (Fujii 2026). Pure functions; every output is a
 * fresh frozen array — callers may pass states between modules without
 * defensive copying.
 *
 * @module koopman-memory/koopman-operator
 */

import type {
  KoopmanOperator,
  KoopmanState,
  KoopmanInput,
  OperatorSpectrum,
  ValidationResult,
} from './types.js';

/**
 * Evaluate one Koopman step.
 *
 *   out[i] = Σ_j A[i,j] · h[j]  +  Σ_{j,k} K[i,j,k] · h[j] · u[k]
 *
 * @throws if `op` / `h` / `u` shapes are incompatible.
 */
export function step(
  op: KoopmanOperator,
  h: KoopmanState,
  u: KoopmanInput,
): KoopmanState {
  const { stateDim: d, inputDim: m, A, K } = op;
  if (h.length !== d) {
    throw new Error(
      `koopman-memory: state length ${h.length} ≠ stateDim ${d}`,
    );
  }
  if (u.length !== m) {
    throw new Error(
      `koopman-memory: input length ${u.length} ≠ inputDim ${m}`,
    );
  }
  const out = new Array<number>(d);
  for (let i = 0; i < d; i++) {
    // Linear term.
    let acc = 0;
    const rowBase = i * d;
    for (let j = 0; j < d; j++) {
      acc += A[rowBase + j] * h[j];
    }
    // Bilinear term: Σ_{j,k} K[i,j,k] · h[j] · u[k].
    const kBase = i * d * m;
    for (let j = 0; j < d; j++) {
      const hj = h[j];
      if (hj === 0) continue;
      const kjBase = kBase + j * m;
      for (let k = 0; k < m; k++) {
        acc += K[kjBase + k] * hj * u[k];
      }
    }
    out[i] = acc;
  }
  return Object.freeze(out);
}

/**
 * Identity operator of dimension `d`: `A = I_d`, `K = 0`, single dummy
 * input channel so `step(identity(d), h, [0]) ≡ h`.
 */
export function identity(stateDim: number): KoopmanOperator {
  if (!Number.isInteger(stateDim) || stateDim <= 0) {
    throw new Error(`koopman-memory: invalid stateDim ${stateDim}`);
  }
  const A = new Array<number>(stateDim * stateDim).fill(0);
  for (let i = 0; i < stateDim; i++) A[i * stateDim + i] = 1;
  const K = new Array<number>(stateDim * stateDim * 1).fill(0);
  return Object.freeze({
    stateDim,
    inputDim: 1,
    A: Object.freeze(A),
    K: Object.freeze(K),
    name: `I_${stateDim}`,
  });
}

/** Shape + finite-value validation. */
export function validate(op: KoopmanOperator): ValidationResult {
  const violations: string[] = [];
  const { stateDim: d, inputDim: m, A, K, name } = op;
  if (!Number.isInteger(d) || d <= 0) violations.push(`stateDim must be positive integer, got ${d}`);
  if (!Number.isInteger(m) || m <= 0) violations.push(`inputDim must be positive integer, got ${m}`);
  if (d > 0 && A.length !== d * d) {
    violations.push(`A.length ${A.length} ≠ stateDim² ${d * d}`);
  }
  if (d > 0 && m > 0 && K.length !== d * d * m) {
    violations.push(`K.length ${K.length} ≠ stateDim²·inputDim ${d * d * m}`);
  }
  for (let i = 0; i < A.length; i++) {
    if (!Number.isFinite(A[i])) {
      violations.push(`A[${i}] non-finite`);
      break;
    }
  }
  for (let i = 0; i < K.length; i++) {
    if (!Number.isFinite(K[i])) {
      violations.push(`K[${i}] non-finite`);
      break;
    }
  }
  if (typeof name !== 'string' || name.length === 0) {
    violations.push('name must be a non-empty string');
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Approximate spectral data for `A` via power iteration on `A^T A`.
 *
 * We only need the max singular value for the stability flag; `σ_min` is
 * not cheap to extract from power iteration alone so we return 0 as a
 * safe lower-bound proxy. Callers treating `minSingularValue` as exact are
 * explicitly out of scope.
 */
export function spectralData(op: KoopmanOperator): OperatorSpectrum {
  const { stateDim: d, A } = op;
  if (d === 0) return { maxSingularValue: 0, minSingularValue: 0, stable: true };

  // Power-iteration on A^T A; the leading eigenvalue is σ_max(A)².
  const maxIter = 50;
  const tol = 1e-10;

  let v = new Array<number>(d).fill(0);
  // Deterministic non-zero seed: all ones / sqrt(d).
  const seed = 1 / Math.sqrt(d);
  for (let i = 0; i < d; i++) v[i] = seed;

  let lambda = 0;
  for (let iter = 0; iter < maxIter; iter++) {
    // w = A v
    const w = new Array<number>(d).fill(0);
    for (let i = 0; i < d; i++) {
      let acc = 0;
      const rowBase = i * d;
      for (let j = 0; j < d; j++) acc += A[rowBase + j] * v[j];
      w[i] = acc;
    }
    // z = A^T w  ⇒  z = (A^T A) v
    const z = new Array<number>(d).fill(0);
    for (let j = 0; j < d; j++) {
      let acc = 0;
      for (let i = 0; i < d; i++) acc += A[i * d + j] * w[i];
      z[j] = acc;
    }
    // Rayleigh quotient λ = v^T z  (v is unit-norm).
    let newLambda = 0;
    for (let i = 0; i < d; i++) newLambda += v[i] * z[i];
    // Normalise z to get next v.
    let norm = 0;
    for (let i = 0; i < d; i++) norm += z[i] * z[i];
    norm = Math.sqrt(norm);
    if (norm === 0) {
      lambda = 0;
      break;
    }
    for (let i = 0; i < d; i++) v[i] = z[i] / norm;
    if (Math.abs(newLambda - lambda) < tol) {
      lambda = newLambda;
      break;
    }
    lambda = newLambda;
  }
  const maxSingularValue = Math.sqrt(Math.max(0, lambda));
  return {
    maxSingularValue,
    minSingularValue: 0,
    stable: maxSingularValue <= 1 + 1e-9,
  };
}
