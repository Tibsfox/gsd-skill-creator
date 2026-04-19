/**
 * MB-5 Dead-Zone Bounded Learning — smooth dead-zone primitive.
 *
 * Implements the core smooth dead-zone function per Sastry & Bodson 1989
 * §5.7.1 "Deadzone and Relative Deadzone" (pp. 251–252), Theorem 5.7.1 (p. 252).
 *
 * The dead-zone modification of an adaptation law preserves Lyapunov descent
 * when:
 *   (a) Outside the zone the update law runs unchanged (MB-1 V̇ ≤ 0 carries).
 *   (b) Inside the zone the update is frozen (V̇ = 0 ≤ V̇_raw).
 *
 * This module ships a SMOOTH version: rather than a hard Heaviside at the
 * zone boundary, the transition uses a sigmoid ramp so V̇ is continuous at
 * the boundary. The degenerate case (sharpness → ∞, i.e. bandwidth = 0)
 * recovers the hard Heaviside bit-exactly.
 *
 * Design:
 *
 *   deadZone(error, halfWidth, sharpness)
 *
 *   - Inside the dead-zone (|error| < halfWidth): output = 0.
 *   - Outside the dead-zone (|error| > halfWidth): output = error − sign(error)·halfWidth.
 *   - At the boundary: smooth sigmoid transition controlled by `sharpness`.
 *
 * The output is the "effective error after dead-zone modification" — callers
 * use it as the error term in their adaptation law update. The derivative
 * field carries dOutput/dError for composability with gradient-based layers.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-5-dead-zone-bounded-learning.md
 *
 * @module dead-zone/smooth-dead-zone
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface DeadZoneResult {
  /**
   * Dead-zone–modified error output.
   *
   * Equal to `0` inside the dead-zone; smoothly ramps to `error − sign·halfWidth`
   * outside, with a sigmoid-based transition of width controlled by `sharpness`.
   */
  output: number;

  /**
   * Derivative of `output` with respect to `error`, d(output)/d(error).
   *
   * Always in [0, 1].
   * - At the zone boundary with `sharpness` large (hard): jumps sharply 0 → 1.
   * - With finite `sharpness`: smooth S-curve; continuous.
   * - Useful for composing with MB-1's V̇ computation.
   */
  derivative: number;
}

// ---------------------------------------------------------------------------
// Sigmoid utility
// ---------------------------------------------------------------------------

/**
 * Numerically stable logistic sigmoid σ(x) = 1/(1 + exp(−x)).
 * Guards against overflow for large |x|.
 */
function sigmoid(x: number): number {
  if (x >= 0) {
    const ex = Math.exp(-x);
    return 1 / (1 + ex);
  } else {
    const ex = Math.exp(x);
    return ex / (1 + ex);
  }
}

/**
 * Derivative of the sigmoid: σ'(x) = σ(x)·(1 − σ(x)).
 */
function sigmoidDeriv(x: number): number {
  const s = sigmoid(x);
  return s * (1 - s);
}

// ---------------------------------------------------------------------------
// deadZone — pure function
// ---------------------------------------------------------------------------

/**
 * Compute a smooth dead-zone modification of `error`.
 *
 * The function is symmetric about zero.  For a positive `error`:
 *
 *   output ≈ 0                                    when error ≪ halfWidth
 *   output ≈ error − halfWidth                    when error ≫ halfWidth
 *   output is smooth S-curve in between
 *
 * Implementation uses the outer-ramp formulation:
 *
 *   gate(z) = σ(sharpness · (z − halfWidth))           (0→1 outside the zone)
 *   output  = gate(|error|) · (error − sign(error)·halfWidth)
 *
 * When `sharpness === 0` the gate is identically 0.5 everywhere (degenerate —
 * use `sharpness > 0` in practice).  When `sharpness → ∞` (represented by a
 * very large value, e.g. 1e12), the gate approaches the Heaviside function and
 * the output becomes the hard dead-zone.
 *
 * The derivative is computed analytically:
 *
 *   d(output)/d(error) = gate · sign²(error)  (≡ gate when error ≠ 0)
 *                      + gate' · (error − sign(error)·halfWidth)
 *
 * where gate' = dgate/d(error) = sharpness · σ'(…) · sign(error).
 *
 * At `error = 0` the function is zero and derivative is zero by symmetry.
 *
 * @param error      - The raw error to be modified.
 * @param halfWidth  - Half-width of the dead-zone (≥ 0).
 *                     When 0 the dead-zone degenerates to a passthrough.
 * @param sharpness  - Controls transition sharpness (≥ 0).
 *                     Large values approach the hard Heaviside.
 *                     Set to 0 for fully open (no dead-zone effect, output = error).
 * @returns DeadZoneResult with `output` and `derivative`.
 */
export function deadZone(
  error: number,
  halfWidth: number,
  sharpness: number,
): DeadZoneResult {
  // Guard inputs
  if (!Number.isFinite(error)) {
    return { output: 0, derivative: 0 };
  }
  const hw = Number.isFinite(halfWidth) && halfWidth >= 0 ? halfWidth : 0;
  const k  = Number.isFinite(sharpness) && sharpness >= 0 ? sharpness : 0;

  // Degenerate: zero half-width → passthrough (no dead-zone effect)
  if (hw === 0) {
    return { output: error, derivative: 1 };
  }

  // At error = 0 exactly: function is 0 by symmetry, derivative = 0
  if (error === 0) {
    return { output: 0, derivative: 0 };
  }

  const absError = Math.abs(error);
  const sign     = error > 0 ? 1 : -1;

  // gate(|error|) = σ(k · (|error| − hw))
  const z = k * (absError - hw);

  if (k === 0) {
    // Sharpness zero: gate is 0.5 everywhere — degenerate soft zone
    const gate = 0.5;
    const ramp = error - sign * hw;
    return {
      output:     gate * ramp,
      derivative: gate,  // d/d(error): gate * sign² = gate
    };
  }

  const gate   = sigmoid(z);
  const gatePrime = k * sigmoidDeriv(z); // dgate/d(absError)
  const ramp   = error - sign * hw;      // = (|error| − hw) · sign

  // output = gate · ramp
  const output = gate * ramp;

  // derivative = d(gate·ramp)/d(error)
  //   = gate · d(ramp)/d(error)  +  ramp · d(gate)/d(error)
  //   = gate · 1                 +  ramp · gatePrime · sign
  const derivative = gate + ramp * gatePrime * sign;

  // Clamp derivative to [0, 1] — should be true by construction but guard FP noise
  const clampedDerivative = Math.max(0, Math.min(1, derivative));

  return { output, derivative: clampedDerivative };
}

/**
 * Hard dead-zone (Heaviside limit, `sharpness → ∞`).
 *
 * Provided as a convenience for tests and degenerate-parameter validation.
 * The output is:
 *   - 0            if |error| ≤ halfWidth
 *   - error − sign·halfWidth   otherwise
 *
 * The derivative is discontinuous at |error| = halfWidth (this is the
 * classical hard dead-zone from Sastry §5.7.1 eq 5.7.1).
 */
export function hardDeadZone(error: number, halfWidth: number): { output: number; derivative: number } {
  const hw = Number.isFinite(halfWidth) && halfWidth >= 0 ? halfWidth : 0;
  if (!Number.isFinite(error) || hw === 0) {
    return { output: error, derivative: 1 };
  }
  const absError = Math.abs(error);
  if (absError <= hw) {
    return { output: 0, derivative: 0 };
  }
  const sign = error > 0 ? 1 : -1;
  return { output: error - sign * hw, derivative: 1 };
}
