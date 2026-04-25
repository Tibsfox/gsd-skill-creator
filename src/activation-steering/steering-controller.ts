/**
 * Steering controller (Phase 767).
 *
 * Classical model-based linear optimal control on the activation-vector
 * space. Under the local-linearity assumption of arXiv:2604.19018 the
 * activation dynamics in a neighbourhood satisfy
 *
 *     x_{n+1} ≈ A x_n + B u_n,
 *
 * and the controller selects `u_n = K (target - x_n)` with `K` a positive
 * scalar gain (i.e. `K * I` matrix; per-axis gains can be added later
 * without changing the API). The output activation is the locally-linear
 * forward step
 *
 *     x_next = x_n + K (target - x_n) = (1 - K) x_n + K * target.
 *
 * For `K ∈ (0, 1]` this is a strictly contractive map toward the target,
 * which is exactly what the local-linearity assumption guarantees is
 * a *correct-shape* control law inside the linear regime.
 *
 * Numerical notes:
 *   - Operates on plain `number[]`; the caller may pass Float64Array
 *     because TypedArray is iterable and indexable as `number[]`.
 *   - Throws on dimension mismatch (the only invariant the controller
 *     itself enforces — settings/flag enforcement lives in `index.ts`).
 *
 * @module activation-steering/steering-controller
 */

import { DEFAULT_STEERING_GAIN } from './settings.js';

export interface ControllerStep {
  /** Output activation = (1 - gain) * current + gain * target. */
  readonly nextActivation: number[];
  /** Control delta = gain * (target - current). */
  readonly delta: number[];
  /** L2 norm of the delta. */
  readonly deltaNorm: number;
  /** The gain that was applied. */
  readonly gain: number;
}

/**
 * One forward step of the controller.
 *
 * @param current Current activation vector.
 * @param target  Desired target vector (same length as current).
 * @param gain    Proportional gain `K ∈ (0, 1]`. Default 0.5.
 */
export function controllerStep(
  current: readonly number[],
  target: readonly number[],
  gain: number = DEFAULT_STEERING_GAIN,
): ControllerStep {
  if (current.length !== target.length) {
    throw new Error(
      `controllerStep: dimension mismatch — current=${current.length} target=${target.length}`,
    );
  }
  if (!Number.isFinite(gain) || gain <= 0 || gain > 1) {
    throw new Error(`controllerStep: gain must lie in (0, 1], got ${gain}`);
  }
  const n = current.length;
  const delta = new Array<number>(n);
  const next = new Array<number>(n);
  let sq = 0;
  for (let i = 0; i < n; i++) {
    const d = gain * (target[i]! - current[i]!);
    delta[i] = d;
    next[i] = current[i]! + d;
    sq += d * d;
  }
  return {
    nextActivation: next,
    delta,
    deltaNorm: Math.sqrt(sq),
    gain,
  };
}

/**
 * Identity / passthrough step — used by the public `steer()` API when the
 * opt-in flag is OFF. Returned shape is byte-stable: same vector reference
 * (cloned shallow to keep `readonly` invariant in the result) and a
 * zero-vector delta.
 */
export function passthroughStep(current: readonly number[]): ControllerStep {
  const next = current.slice();
  const delta = new Array<number>(current.length).fill(0);
  return {
    nextActivation: next,
    delta,
    deltaNorm: 0,
    gain: 0,
  };
}
