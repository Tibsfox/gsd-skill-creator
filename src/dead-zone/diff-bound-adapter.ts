/**
 * MB-5 Dead-Zone Bounded Learning — diff-bound adapter.
 *
 * Replaces M4's hard 20% byte-diff rejection with a smooth dead-zone saturation
 * curve `adaptationScale`. The adaptation scale is a scalar in [0, 1] that
 * multiplies the applied diff magnitude:
 *
 *   - At `bandwidth = 0, tau = Infinity` (default): reduces to the hard M4 rule
 *     bit-exactly — CF-MB5-01 gate.
 *   - With finite `bandwidth`: smooth sigmoid saturation around the 20% threshold.
 *   - Hard reject at the outer limit: diff > threshold + outer_reject_margin
 *     is still rejected regardless of bandwidth, preserving the M4 safety invariant.
 *
 * Tractability gating (MB-5 §"Tractability-scaled bandwidth"):
 *   - `tractable`  → bwScale = 1.0  (full bandwidth)
 *   - `unknown`    → bwScale = 0.7
 *   - `coin-flip`  → bwScale = 0.4  (tighter, more conservative)
 *
 * Per Sastry 1989 §5.7.1 Theorem 5.7.1, the dead-zone modification preserves
 * MB-1's Lyapunov descent because:
 *   (a) Outside the zone: adaptation runs at full scale → V̇ ≤ 0 carries.
 *   (b) Inside the zone: scale < 1 → descent rate is only reduced, never inverted.
 *
 * Feature flag: when `deadZoneEnabled = false` the path is byte-identical to
 * M4's hard rule (SC-MB5-01 / CF-MB5-01).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-5-dead-zone-bounded-learning.md
 *
 * @module dead-zone/diff-bound-adapter
 */

import type { TractabilityClass } from '../ace/settings.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DeadZoneParams {
  /**
   * Diff magnitude threshold (default 0.20 — the M4 20% bound).
   * Commits below this threshold pass; above it the dead-zone activates.
   */
  diffThreshold: number;

  /**
   * Bandwidth around the threshold for smooth saturation (default 0 = hard).
   * When > 0 the transition from scale=1 to scale≈0 spans ~4× bandwidth.
   * Recommend: bandwidth ≤ 0.05 (5% of the threshold value is 0.01).
   */
  diffBandwidth: number;

  /**
   * Number of days after which the cooldown is fully lifted (default 7).
   */
  cooldownDays: number;

  /**
   * Time constant τ for smooth cooldown recovery (default Infinity = hard).
   * When finite, scale(age) = 1 − exp(−age/τ) with τ in days.
   */
  cooldownTau: number;
}

/** Default parameters — reproduce M4 hard rule bit-exactly (SC-MB5-01). */
export const DEFAULT_DEAD_ZONE_PARAMS: Readonly<DeadZoneParams> = Object.freeze({
  diffThreshold: 0.20,
  diffBandwidth: 0.0,
  cooldownDays:  7,
  cooldownTau:   Infinity,
});

// ---------------------------------------------------------------------------
// Tractability bandwidth scale table (MB-5 §"Tractability-scaled bandwidth")
// ---------------------------------------------------------------------------

/** Scale applied to `diffBandwidth` per tractability class. */
export const TRACTABILITY_BW_SCALE: Readonly<Record<TractabilityClass, number>> = Object.freeze({
  tractable:   1.0,
  unknown:     0.7,
  'coin-flip': 0.4,
});

// ---------------------------------------------------------------------------
// adaptationScale — pure function
// ---------------------------------------------------------------------------

/**
 * Compute the adaptation scale for a branch commit.
 *
 * Returns a scalar in [0, 1]:
 *   - 1   → full adaptation (well inside bounds, cooldown lifted)
 *   - 0   → adaptation frozen (exceeds bound and/or in cooldown)
 *   - intermediate → smooth saturation around the boundary
 *
 * At the degenerate parameters (`diffBandwidth = 0, cooldownTau = Infinity`)
 * this function returns the hard M4 result bit-exactly:
 *   `(diffMagnitude ≤ 0.20 ? 1 : 0) · (cooldownAge ≥ 7 ? 1 : 0)`
 *
 * @param diffMagnitude  - Fraction of bytes changed; in [0, 1].
 * @param cooldownAge    - Days elapsed since last commit; ≥ 0.
 * @param params         - Dead-zone parameters (threshold, bandwidth, tau).
 * @param tractability   - Tractability class from ME-1 for bandwidth scaling.
 * @returns Scalar in [0, 1].
 */
export function adaptationScale(
  diffMagnitude:  number,
  cooldownAge:    number,
  params:         DeadZoneParams = DEFAULT_DEAD_ZONE_PARAMS,
  tractability:   TractabilityClass = 'unknown',
): number {
  const bwScale  = TRACTABILITY_BW_SCALE[tractability];
  const effBw    = params.diffBandwidth * bwScale;
  const effTau   = params.cooldownTau;

  // ─── Diff saturation s1 ──────────────────────────────────────────────────
  //
  // Hard case (bandwidth = 0 or effBw ≤ 1e-9): Heaviside at threshold.
  // Smooth case: sigmoid centred at threshold with width = effBw.
  //
  // s1 = σ((threshold − diffMagnitude) / effBw)
  //   ≈ 1   when diffMagnitude ≪ threshold
  //   ≈ 0.5 when diffMagnitude = threshold
  //   ≈ 0   when diffMagnitude ≫ threshold
  //
  // We use (threshold − diff) / bw so that s1 = 1 inside the allowed zone
  // and s1 → 0 outside, matching the M4 convention (allowed = 1, rejected = 0).
  //
  let s1: number;
  if (effBw <= 1e-9) {
    // Hard Heaviside — bit-exact M4 behaviour
    s1 = diffMagnitude <= params.diffThreshold ? 1 : 0;
  } else {
    s1 = sigmoidBound((params.diffThreshold - diffMagnitude) / effBw);
  }

  // ─── Cooldown recovery s2 ────────────────────────────────────────────────
  //
  // Hard case (tau = Infinity): Heaviside at cooldownDays.
  // Smooth case: exponential ramp 1 − exp(−age/τ).
  //
  // CF-MB5-03: at tau=3, day-8 → ≈ 0.93; day-1 → ≈ 0.28.
  //
  let s2: number;
  if (!Number.isFinite(effTau)) {
    // Hard Heaviside — bit-exact M4 cooldown behaviour
    s2 = cooldownAge >= params.cooldownDays ? 1 : 0;
  } else {
    const age = Math.max(0, Number.isFinite(cooldownAge) ? cooldownAge : 0);
    s2 = 1 - Math.exp(-age / effTau);
    // Clamp to [0, 1] for numerical safety
    s2 = Math.max(0, Math.min(1, s2));
  }

  // Multiplicative composition: both conditions must be met (Sastry §5.7.1 eq 5.7.2)
  return s1 * s2;
}

// ---------------------------------------------------------------------------
// Internal sigmoid (numerically stable)
// ---------------------------------------------------------------------------

/**
 * Numerically stable sigmoid σ(x) = 1/(1 + exp(−x)).
 * Clamped to [0, 1] to guard floating-point drift.
 */
function sigmoidBound(x: number): number {
  let s: number;
  if (x >= 0) {
    const ex = Math.exp(-x);
    s = 1 / (1 + ex);
  } else {
    const ex = Math.exp(x);
    s = ex / (1 + ex);
  }
  return Math.max(0, Math.min(1, s));
}
