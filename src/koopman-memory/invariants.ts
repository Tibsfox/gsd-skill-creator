/**
 * Koopman-Memory — memory-retention invariants.
 *
 * Predicates over {@link KoopmanOperator} that surface "information does
 * not vanish under nil input" and related Lipschitz properties. All
 * predicates are pure read-only checks; none mutate state.
 *
 * @module koopman-memory/invariants
 */

import { identity, spectralData, step } from './koopman-operator.js';
import type {
  KoopmanInput,
  KoopmanOperator,
  KoopmanState,
  RetentionResult,
} from './types.js';

function l2Norm(v: readonly number[]): number {
  let acc = 0;
  for (let i = 0; i < v.length; i++) acc += v[i] * v[i];
  return Math.sqrt(acc);
}

function zeros(n: number): readonly number[] {
  return Object.freeze(new Array<number>(n).fill(0));
}

/**
 * Zero-input retention: with `u_t ≡ 0`, the state evolves as `h_{t+1} = A h_t`.
 *
 * The state norm must stay bounded by the spectral-max-raised-to-steps
 * envelope: `||h_T|| ≤ σ_max(A)^T · ||h_0|| · (1 + ε)`. For stable operators
 * (σ_max ≤ 1) the envelope reduces to `||h_T|| ≤ ||h_0|| · (1 + ε)`.
 */
export function checkZeroInputRetention(
  op: KoopmanOperator,
  h0: KoopmanState,
  steps: number,
): RetentionResult {
  if (!Number.isInteger(steps) || steps < 0) {
    return { ok: false, violations: [`steps must be non-negative integer, got ${steps}`] };
  }
  const u0 = zeros(op.inputDim);
  let h: KoopmanState = h0;
  for (let t = 0; t < steps; t++) {
    h = step(op, h, u0);
  }
  const finalNorm = l2Norm(h);
  const initialNorm = l2Norm(h0);

  const spec = spectralData(op);
  const tol = 1e-6;
  // Envelope: σ_max^steps * ||h_0|| * (1 + tol)
  const envelope = Math.pow(Math.max(spec.maxSingularValue, 0), steps) * initialNorm * (1 + tol);
  // Guard against numerical noise when initialNorm is zero.
  const ok = initialNorm === 0
    ? finalNorm <= tol
    : finalNorm <= envelope + tol;
  const violations = ok
    ? []
    : [
        `zero-input retention violated: ||h_T||=${finalNorm.toExponential(3)} ` +
          `> envelope ${envelope.toExponential(3)}`,
      ];
  return { ok, finalNorm, violations };
}

/**
 * Lipschitz bound: small input perturbation → bounded state perturbation.
 *
 * Checks `||step(op, h, u) - step(op, h, 0)|| ≤ bound`.
 */
export function checkLipschitzBound(
  op: KoopmanOperator,
  h: KoopmanState,
  u: KoopmanInput,
  bound: number,
): RetentionResult {
  if (!Number.isFinite(bound) || bound < 0) {
    return { ok: false, violations: [`bound must be non-negative finite, got ${bound}`] };
  }
  const u0 = zeros(op.inputDim);
  const withInput = step(op, h, u);
  const withoutInput = step(op, h, u0);
  let diffSq = 0;
  for (let i = 0; i < withInput.length; i++) {
    const d = withInput[i] - withoutInput[i];
    diffSq += d * d;
  }
  const diff = Math.sqrt(diffSq);
  const ok = diff <= bound + 1e-12;
  const violations = ok
    ? []
    : [`Lipschitz bound violated: ||Δh||=${diff.toExponential(3)} > bound ${bound}`];
  return { ok, finalNorm: diff, violations };
}

/**
 * Identity retention: the identity operator preserves state exactly under
 * zero input.
 */
export function checkIdentityRetention(
  stateDim: number,
  h: KoopmanState,
): RetentionResult {
  if (h.length !== stateDim) {
    return {
      ok: false,
      violations: [`state length ${h.length} ≠ stateDim ${stateDim}`],
    };
  }
  const id = identity(stateDim);
  const out = step(id, h, [0]);
  let worst = 0;
  for (let i = 0; i < stateDim; i++) {
    worst = Math.max(worst, Math.abs(out[i] - h[i]));
  }
  const ok = worst === 0; // exact; no floating-point slack expected for identity
  const violations = ok ? [] : [`identity retention violated: worst-Δ=${worst}`];
  return { ok, finalNorm: worst, violations };
}
