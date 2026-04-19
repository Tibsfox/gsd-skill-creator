/**
 * MB-5 Dead-Zone Bounded Learning — cooldown adapter.
 *
 * Smooth recovery from the 7-day refinement cooldown. Replaces the binary
 * on/off at the cooldown boundary with an exponential ramp:
 *
 *   recoveryScale(age, tau) = 1 − exp(−age / tau)
 *
 * At `tau = Infinity` the ramp degenerates to the hard Heaviside used by M4:
 *   - 0 for age < cooldownDays
 *   - 1 for age ≥ cooldownDays
 *
 * This matches the `adaptationScale` cooldown component (s2) from
 * `diff-bound-adapter.ts`, but exposed as a standalone pure function for
 * callers that only need the time-recovery aspect (e.g. `refinement-engine.ts`
 * eligibility checks under the dead-zone opt-in path).
 *
 * Sastry connection: the exponential ramp is a time-variant dead-zone width —
 * the effective dead-zone narrows as age grows. Theorem 5.7.1 applies because
 * at any fixed instant the dead-zone width is bounded and the update magnitude
 * is scaled to ≤ its hard-rule value, preserving V̇ ≤ 0 (MB-1 descent argument
 * carries, same reasoning as `lyapunov-composer.ts`).
 *
 * Feature flag: callers MUST check `readDeadZoneEnabledFlag()` before using
 * the smooth path; the hard Heaviside path remains byte-identical to M4 when
 * the flag is off (SC-MB5-01).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-5-dead-zone-bounded-learning.md
 *
 * @module dead-zone/cooldown-adapter
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CooldownAdapterParams {
  /**
   * Hard cooldown threshold in days (default 7 — matches M4 hard rule).
   */
  cooldownDays: number;

  /**
   * Time constant τ for smooth recovery (days). Default Infinity = hard.
   * With tau = 3, day-1 ≈ 0.28, day-8 ≈ 0.93 (CF-MB5-03).
   */
  tau: number;
}

export const DEFAULT_COOLDOWN_ADAPTER_PARAMS: Readonly<CooldownAdapterParams> = Object.freeze({
  cooldownDays: 7,
  tau: Infinity,
});

// ---------------------------------------------------------------------------
// recoveryScale — pure function
// ---------------------------------------------------------------------------

/**
 * Compute the recovery scale for a skill that last refined `ageInDays` ago.
 *
 * Returns a scalar in [0, 1]:
 *   - 0   → fully inside cooldown (newly refined, not allowed)
 *   - 1   → cooldown fully lifted (long time elapsed)
 *   - intermediate (only when tau is finite) → smooth ramp
 *
 * Degenerate case (`tau = Infinity`):
 *   Returns exactly 0 when `ageInDays < cooldownDays`, exactly 1 otherwise.
 *   This is bit-identical to the M4 hard cooldown rule.
 *
 * Smooth case (finite `tau`):
 *   Returns `1 − exp(−ageInDays / tau)` — grows from 0 at age=0 toward 1
 *   asymptotically. The cooldownDays parameter is only consulted for the
 *   hard-case; in smooth mode the ramp is continuous from age=0.
 *
 * CF-MB5-03 fixtures (tau=3):
 *   - ageInDays=1: 1 − exp(−1/3) ≈ 0.283
 *   - ageInDays=8: 1 − exp(−8/3) ≈ 0.931
 *
 * @param ageInDays  - Days elapsed since last refinement commit; ≥ 0.
 * @param params     - Cooldown parameters.
 * @returns Scalar in [0, 1].
 */
export function recoveryScale(
  ageInDays: number,
  params: CooldownAdapterParams = DEFAULT_COOLDOWN_ADAPTER_PARAMS,
): number {
  const age = Number.isFinite(ageInDays) && ageInDays >= 0 ? ageInDays : 0;
  const { cooldownDays, tau } = params;

  if (!Number.isFinite(tau)) {
    // Hard Heaviside — bit-exact M4 cooldown
    return age >= cooldownDays ? 1 : 0;
  }

  // Smooth exponential ramp, guarded for tau ≤ 0
  if (tau <= 0) {
    // Degenerate: tau ≤ 0 → instant recovery (passthrough)
    return 1;
  }

  const scale = 1 - Math.exp(-age / tau);
  // Clamp to [0, 1] for numerical safety
  return Math.max(0, Math.min(1, scale));
}

// ---------------------------------------------------------------------------
// daysRemaining — smooth equivalent for eligibility UX
// ---------------------------------------------------------------------------

/**
 * Return the "effective days remaining" in the cooldown for UX display.
 *
 * In hard mode: `max(0, cooldownDays − ageInDays)` — same as M4.
 * In smooth mode: effective days remaining is the age at which `recoveryScale`
 *   would equal some threshold (default 0.9), minus current age.
 *   age₀.₉ = −tau · ln(1 − 0.9) ≈ 2.303 · tau.
 *   daysRemaining ≈ max(0, age₀.₉ − currentAge).
 *
 * This is advisory only — the actual gate is `recoveryScale > 0` for any
 * commit under smooth mode.
 *
 * @param ageInDays   - Days elapsed since last refinement.
 * @param params      - Cooldown parameters.
 * @param threshold   - Recovery fraction considered "full" for display (default 0.9).
 * @returns Non-negative number of effective days remaining.
 */
export function smoothDaysRemaining(
  ageInDays: number,
  params: CooldownAdapterParams = DEFAULT_COOLDOWN_ADAPTER_PARAMS,
  threshold: number = 0.9,
): number {
  const age = Number.isFinite(ageInDays) && ageInDays >= 0 ? ageInDays : 0;
  const { cooldownDays, tau } = params;

  if (!Number.isFinite(tau)) {
    // Hard mode: same as M4
    return Math.max(0, cooldownDays - age);
  }

  if (tau <= 0) {
    return 0;
  }

  // Clamp threshold
  const t = Math.max(0.01, Math.min(0.9999, threshold));
  // age at which scale = t: t = 1 − exp(−age/τ) → age = −τ·ln(1−t)
  const targetAge = -tau * Math.log(1 - t);
  return Math.max(0, targetAge - age);
}
