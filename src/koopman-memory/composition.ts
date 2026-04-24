/**
 * Koopman-Memory — operator composition (honest truncation).
 *
 * # Koopman-class closure
 *
 * The bilinear update `h → A h + h^⊤ K u` is **not closed under ordinary
 * function composition**: substituting the update into itself produces
 * quadratic-in-`h` terms of the form `(A h + h^⊤ K u)^⊤ K u'`, which
 * no longer match the `h^⊤ K u` shape. A rigorous Koopman lift would
 * embed `h` in a higher-dimensional observable space, composing there;
 * that lift is out of scope for this primitive.
 *
 * `compose(g, f)` therefore returns a **principled truncation** rather
 * than a silent closure violation:
 *
 *   - The linear part is exact: `A_composed = A_g · A_f`.
 *   - The bilinear part keeps only the dominant cross term
 *     `K_composed[i,j,k] = Σ_p A_g[i,p] · K_f[p,j,k]`, i.e. the
 *     linear-after-bilinear contribution. The bilinear-after-linear term
 *     (`K_g · (A_f h)` shape) and any purely-quadratic-in-`h` terms are
 *     dropped.
 *   - A warning is emitted when this truncation is non-trivial (i.e. `K_g`
 *     is not identically zero) and when the spectral product of the
 *     composition exceeds 1 (instability risk).
 *
 * Callers receive the operator and the warnings and can decide whether to
 * promote the warning into a refusal, logging, or advisory telemetry.
 *
 * @module koopman-memory/composition
 */

import { spectralData, validate } from './koopman-operator.js';
import type { CompositionResult, KoopmanOperator } from './types.js';

const ZERO_TOL = 1e-12;

/**
 * Compose two Koopman operators, ordered `g` after `f`:
 *
 *   (g ∘ f)(h, u) ≈ A_g A_f h + (A_g K_f)(h ⊗ u)       (truncation)
 *
 * Requires `g.stateDim === f.stateDim` and `g.inputDim === f.inputDim`.
 */
export function compose(
  g: KoopmanOperator,
  f: KoopmanOperator,
): CompositionResult {
  const warnings: string[] = [];

  const gVal = validate(g);
  const fVal = validate(f);
  if (!gVal.ok) {
    throw new Error(`koopman-memory: g invalid: ${gVal.violations.join('; ')}`);
  }
  if (!fVal.ok) {
    throw new Error(`koopman-memory: f invalid: ${fVal.violations.join('; ')}`);
  }
  if (g.stateDim !== f.stateDim) {
    throw new Error(
      `koopman-memory: composition requires equal stateDim, got g=${g.stateDim} f=${f.stateDim}`,
    );
  }
  if (g.inputDim !== f.inputDim) {
    throw new Error(
      `koopman-memory: composition requires equal inputDim, got g=${g.inputDim} f=${f.inputDim}`,
    );
  }

  const d = g.stateDim;
  const m = g.inputDim;

  // Linear part: A_composed = A_g * A_f
  const A = new Array<number>(d * d).fill(0);
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let acc = 0;
      for (let p = 0; p < d; p++) {
        acc += g.A[i * d + p] * f.A[p * d + j];
      }
      A[i * d + j] = acc;
    }
  }

  // Bilinear truncation: K_composed[i,j,k] = Σ_p A_g[i,p] * K_f[p,j,k]
  const K = new Array<number>(d * d * m).fill(0);
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      for (let k = 0; k < m; k++) {
        let acc = 0;
        for (let p = 0; p < d; p++) {
          acc += g.A[i * d + p] * f.K[p * d * m + j * m + k];
        }
        K[i * d * m + j * m + k] = acc;
      }
    }
  }

  // Warn when g.K is non-zero → the bilinear-after-linear term we dropped
  // is non-trivial, meaning the truncation lost information.
  let gKNonZero = false;
  for (let idx = 0; idx < g.K.length; idx++) {
    if (Math.abs(g.K[idx]) > ZERO_TOL) {
      gKNonZero = true;
      break;
    }
  }
  if (gKNonZero) {
    warnings.push(
      'Koopman bilinear class is not closed under composition; ' +
        'outer operator g has non-trivial K — the K_g·A_f·h cross term and ' +
        'all purely-quadratic-in-h terms have been dropped (principled truncation).',
    );
  }

  const composed: KoopmanOperator = Object.freeze({
    stateDim: d,
    inputDim: m,
    A: Object.freeze(A),
    K: Object.freeze(K),
    name: `(${g.name} ∘ ${f.name})`,
  });

  // Instability warning on the truncated operator.
  const spec = spectralData(composed);
  if (!spec.stable) {
    warnings.push(
      `composition spectral-max ${spec.maxSingularValue.toFixed(6)} > 1; ` +
        `iterated application will amplify state norm (instability).`,
    );
  }

  return { op: composed, warnings: Object.freeze(warnings) };
}
