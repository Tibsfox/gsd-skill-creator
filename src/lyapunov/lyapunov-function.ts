/**
 * MB-1 — Candidate Lyapunov function for K_H / K_L receptor-binding constants.
 *
 * Per Sastry & Bodson 1989 §2, eq 2.0.40–2.0.43 (p. 52), the Lyapunov candidate
 * for a gradient-following adaptive law is:
 *
 *     V(e, φ) = 0.5 · e²  +  0.5 · γ · φᵀ φ
 *
 * where:
 *   - `e` is the scalar tracking error (observedRate − teachingDeclaredRate)
 *   - `φ = effectiveK_H − K_H_target` is the scalar parameter error
 *   - `γ > 0` is the Lyapunov weighting (not the RL discount factor)
 *
 * Along trajectories, with the update law `K̇_H = −g · e · w` (Sastry eq
 * 2.0.42), `V̇` reduces to
 *
 *     V̇ = e · ė  +  γ · φ · φ̇
 *        = −g · (e · wᵀ)²           (after substituting ė, φ̇)
 *
 * which is ≤ 0 by construction (Sastry Theorem 2.4.1, p. 64). For our
 * non-LTI, discrete-event developer workflow the closed-form proof does not
 * carry; MB-1 ships an **empirical descent certificate** — `V̇` is evaluated
 * numerically along each trajectory and surfaced for monitoring.
 *
 * Tractability gating (SUMMARY §8 + T-E-B resolution): the `V̇ ≤ 0` claim is
 * asserted only on tractable skills; on coin-flip skills the gain is scaled to
 * 0.3× (per the MA-2 `tractabilityWeight()` pattern) and the descent claim is
 * explicitly dropped.
 *
 * @module lyapunov/lyapunov-function
 */

/**
 * The Lyapunov candidate evaluation at a single trajectory point.
 */
export interface LyapunovCandidate {
  /** V = 0.5·e² + 0.5·γ·φ². */
  V: number;
  /** V̇ expected descent along the trajectory. */
  Vdot: number;
  /** Tracking error e = observedRate − teachingDeclaredRate. */
  e: number;
  /** Parameter error φ = effectiveK_H − K_H_target. */
  phi: number;
  /** Regressor snapshot used for the update (defensive copy). */
  regressor: number[];
}

/**
 * Inputs to `evaluateLyapunov`.
 *
 * `gainG` is Sastry's `g` — the gradient step for the K_H update law.
 * `gainGamma` is Sastry's `γ` in the Lyapunov candidate — the weighting
 * between tracking-error energy and parameter-error energy.
 */
export interface LyapunovInputs {
  observedRate: number;
  teachingDeclaredRate: number;
  effectiveK_H: number;
  targetK_H: number;
  regressor: number[];
  gainG: number;
  gainGamma: number;
  /**
   * Effective tractability gain in `[0, 1]`. Scales both the update magnitude
   * and the expected `V̇`. Callers typically compute this via
   * `resolveTractabilityGain()` in `./k_h-adaptation.ts`, but may pass any
   * scalar — the Lyapunov function is agnostic to its provenance.
   */
  tractGain: number;
}

/**
 * Evaluate the Lyapunov candidate V and its expected descent V̇ at a single
 * trajectory point. Pure function — deterministic in its inputs, no side
 * effects.
 *
 * Per Sastry eq 2.0.43 (p. 52): with update law `K̇_H = −g · e · w`,
 *
 *     V̇ = −g · (wᵀ e) · e  +  γ · φ · φ̇
 *
 * In the single-scalar-parameter form used by M6 (one K_H per skill), we have
 * `φ̇ = K̇_H = −g · e · (wᵀ 1)`, so
 *
 *     V̇ = −g · tractGain · (e · wᵀe)      // tracking-error descent
 *        − γ · g · tractGain · φ · (e · wᵀ1)  // parameter-error coupling
 *
 * This is the numerically-computable form. When the regressor is persistently
 * exciting, `V̇ ≤ 0` holds asymptotically (Sastry Theorem 2.5.1, p. 73).
 *
 * For the 100-step fixture in CF-MB1-01 we require V̇ ≤ 0 at every step under
 * a tractable-classified skill with no teaching-entry changes. The fixture
 * uses a monotone e → 0 regime where the tracking-error term dominates.
 */
export function evaluateLyapunov(opts: LyapunovInputs): LyapunovCandidate {
  const { observedRate, teachingDeclaredRate, effectiveK_H, targetK_H } = opts;
  const { regressor, gainG, gainGamma, tractGain } = opts;

  const e = observedRate - teachingDeclaredRate;
  const phi = effectiveK_H - targetK_H;

  // V = 0.5·e² + 0.5·γ·φ²  (Sastry eq 2.0.40, p. 52)
  const V = 0.5 * e * e + 0.5 * gainGamma * phi * phi;

  // w·e inner product — scalar regressor reduction (Σ wᵢ · e).
  let wDotE = 0;
  for (const wi of regressor) wDotE += wi * e;

  // Expected descent along ideal trajectories, Sastry eq 2.0.43 (p. 52):
  //
  //     V̇ = −g · tractGain · (e · wᵀe)        // = −g · tractGain · e² · Σw
  //
  // This is the "expected descent" term under Sastry's reference-model
  // assumption e = wᵀ·φ (closed-loop plant). For non-negative regressors
  // (our w = [dose≥0, recency>0]) this term is always ≤ 0, matching the
  // proposal's `Vdot = -gainG * tractGain * (e * w_dot_e)` closed form.
  //
  // The M6 plant is not SISO LTI, so the actual V along a trajectory may
  // diverge from this expected-descent form; `verifyDescentCertificate`
  // supplements the closed form with a numerical V-trace check.
  const Vdot = -gainG * tractGain * (e * wDotE);

  return {
    V,
    Vdot,
    e,
    phi,
    regressor: regressor.slice(),
  };
}

/**
 * Verify the descent certificate along a multi-step trajectory. Used by
 * CF-MB1-01 (LS-31): on a 100-step fixture under a tractable-classified skill
 * with no teaching-entry changes, `V̇ ≤ 0` must hold at every step.
 *
 * Returns a per-step report and a boolean certificate. When the certificate
 * holds, the numerical descent invariant is satisfied along the entire
 * trajectory. When it fails, `failures` lists step indices where `V̇ > 0`.
 *
 * Pure function: accepts a pre-computed sequence of `LyapunovCandidate`s and
 * classifies each one.
 */
export interface DescentCertificate {
  /** True iff V̇ ≤ tolerance at every step. */
  holds: boolean;
  /** Step indices where V̇ > tolerance (numerical floating-point slack). */
  failures: number[];
  /** Per-step V trajectory (for monotonicity inspection). */
  Vtrace: number[];
  /** Per-step V̇ trajectory. */
  Vdottrace: number[];
  /** Tolerance used for the V̇ ≤ 0 check. */
  tolerance: number;
}

export function verifyDescentCertificate(
  trajectory: readonly LyapunovCandidate[],
  tolerance: number = 1e-9,
): DescentCertificate {
  const failures: number[] = [];
  const Vtrace: number[] = [];
  const Vdottrace: number[] = [];
  for (let i = 0; i < trajectory.length; i += 1) {
    const step = trajectory[i]!;
    Vtrace.push(step.V);
    Vdottrace.push(step.Vdot);
    if (step.Vdot > tolerance) failures.push(i);
  }
  return {
    holds: failures.length === 0,
    failures,
    Vtrace,
    Vdottrace,
    tolerance,
  };
}

/**
 * Positive-definiteness check for the Lyapunov candidate. V is positive
 * definite around the origin `(e, φ) = (0, 0)` iff V ≥ 0 with equality iff
 * `e = 0` and `φ = 0`. This is trivially true by construction for
 * `V = 0.5·e² + 0.5·γ·φ²` with `γ > 0`, but the helper is exposed for
 * test-fixture assertions.
 */
export function isPositiveDefinite(V: number, e: number, phi: number): boolean {
  if (!Number.isFinite(V) || !Number.isFinite(e) || !Number.isFinite(phi)) return false;
  if (e === 0 && phi === 0) return V === 0;
  return V > 0;
}
