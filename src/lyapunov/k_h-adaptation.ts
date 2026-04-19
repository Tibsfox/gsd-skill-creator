/**
 * MB-1 — Lyapunov-stable K_H adaptation law.
 *
 * Replaces M6's ad-hoc `kHDecayPerDose = 0.10` rule with a Sastry-1989-shaped
 * update law whose stability is certified by the Lyapunov function in
 * `lyapunov-function.ts`.
 *
 * Core identity (Sastry & Bodson 1989, eq 2.0.42, p. 52):
 *
 *     K̇_H = −g · e · w
 *
 * where:
 *   - `e = observedRate − teachingDeclaredRate` is the tracking error
 *   - `w` is the regressor — for MB-1 Wave R5 a two-component vector
 *     `[doseMagnitude, recencyExponential]` (see `buildRegressor`).
 *   - `g` is the gradient step, scaled by `tractGain ∈ {0.3, 0.6, 1.0}`.
 *
 * Tractability gating (SUMMARY §8 + T-E-B resolution):
 *   - `tractable`  → gain 1.0  (Lyapunov descent claim asserted)
 *   - `unknown`    → gain 0.6  (partial gain; descent claim dropped)
 *   - `coin-flip`  → gain 0.3  (reduced gain; descent claim dropped)
 *
 * Pure function: no side effects, deterministic in its inputs. ME-1
 * consumption is via a scalar `tractGain` — callers derive the gain from the
 * ME-1 `TractabilityClass` using `resolveTractabilityGain()` and pass the
 * resulting scalar down.
 *
 * Source:
 *   .planning/research/living-sensoria-refinement/proposals/MB-1-lyapunov-K_H.md
 *
 * @module lyapunov/k_h-adaptation
 */

import type { TractabilityClass } from '../ace/settings.js';
import { evaluateLyapunov, type LyapunovCandidate } from './lyapunov-function.js';

// ---------------------------------------------------------------------------
// Conservative defaults (proposal §"Gain g, γ hyperparameters")
// ---------------------------------------------------------------------------

/** Default gradient step `g`. Sastry-inherited, conservative for our stack. */
export const DEFAULT_GAIN_G = 0.01;

/** Default Lyapunov weighting `γ` in V = 0.5·e² + 0.5·γ·φ². */
export const DEFAULT_GAIN_GAMMA = 1.0;

/** Default recency timescale `τ` (ms) — one minute. */
export const DEFAULT_RECENCY_TAU_MS = 60_000;

// ---------------------------------------------------------------------------
// Tractability → gain scaling table (LS-29 / MB-1 §"Tractability gating")
// ---------------------------------------------------------------------------

/**
 * Documented gain scaling table (proposal §Mechanism, reused from MA-2).
 *
 * Mirrors the MA-2 tractability-weighting pattern exactly. Coin-flip gets
 * 0.3 (not 0.0) to avoid the eternal-silence bug and preserve the monitoring
 * signal.
 */
export const TRACTABILITY_GAIN_TABLE: Readonly<Record<TractabilityClass, number>> = Object.freeze({
  tractable: 1.0,
  unknown: 0.6,
  'coin-flip': 0.3,
});

/**
 * Map a tractability class (and optional confidence scalar) to an effective
 * gain in `[0.3, 1.0]`. The confidence scalar, when provided, further
 * attenuates the `tractable` slot — consistent with LS-29's confidence-scaled
 * weighting. `coin-flip` and `unknown` ignore the confidence.
 */
export function resolveTractabilityGain(
  cls: TractabilityClass,
  confidence: number = 1,
): number {
  const base = TRACTABILITY_GAIN_TABLE[cls];
  if (cls !== 'tractable') return base;
  const c = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 1;
  // tractable → max(floor, confidence), consistent with MA-2 settings.ts.
  return Math.max(TRACTABILITY_GAIN_TABLE['coin-flip'], c);
}

// ---------------------------------------------------------------------------
// Regressor construction (MB-1 §"Regressor design")
// ---------------------------------------------------------------------------

export interface RegressorInputs {
  /** Normalised teaching-entry strength (≥ 0). */
  doseMagnitude: number;
  /** Milliseconds since the last update (≥ 0). */
  ageMs: number;
  /** Recency timescale τ (ms). Defaults to `DEFAULT_RECENCY_TAU_MS`. */
  tauMs?: number;
}

/**
 * Build the two-component Wave R5 regressor `w = [doseMagnitude, recencyExp]`
 * where `recencyExp = exp(−ageMs / τ)`. Pure function.
 */
export function buildRegressor(opts: RegressorInputs): number[] {
  const dose = Math.max(0, Number.isFinite(opts.doseMagnitude) ? opts.doseMagnitude : 0);
  const age = Math.max(0, Number.isFinite(opts.ageMs) ? opts.ageMs : 0);
  const tau = opts.tauMs !== undefined && Number.isFinite(opts.tauMs) && opts.tauMs > 0
    ? opts.tauMs
    : DEFAULT_RECENCY_TAU_MS;
  const recency = Math.exp(-age / tau);
  return [dose, recency];
}

// ---------------------------------------------------------------------------
// Core adaptation law
// ---------------------------------------------------------------------------

export interface AdaptKHOptions {
  /** Current effective K_H (M6 desensitisation state). */
  currentKH: number;
  /** Target K_H for the reference — typically the authored frontmatter K_H. */
  targetKH: number;
  /** Observed activation rate from M6 / M8 telemetry. */
  observedRate: number;
  /** Teaching-declared target rate from the M8 symbiosis stream. */
  teachingDeclaredRate: number;
  /** Regressor (from `buildRegressor`). */
  regressor: number[];
  /** Tractability gain in `[0.3, 1.0]` (from `resolveTractabilityGain`). */
  tractabilityGain: number;
  /** Integration step size Δt in seconds (for discrete-time update). Default 1. */
  stepSize?: number;
  /** Gradient step `g`. Default `DEFAULT_GAIN_G`. */
  gainG?: number;
  /** Lyapunov weighting `γ`. Default `DEFAULT_GAIN_GAMMA`. */
  gainGamma?: number;
  /**
   * Lower bound on new K_H. `adaptKH` clamps its output below by `floor`
   * (typically `K_L · floorRatio`) and above by `targetKH` (never exceed the
   * authored prior). When omitted, no clamp is applied and the caller is
   * responsible for downstream clamping.
   */
  floor?: number;
  /**
   * Upper bound on new K_H. Defaults to `targetKH` when omitted. Pass
   * `+Infinity` to disable the upper clamp explicitly.
   */
  ceiling?: number;
}

export interface AdaptKHResult {
  /** New K_H after the Lyapunov-stable update (clamped to [floor, ceiling]). */
  newKH: number;
  /** The unclamped K̇_H · Δt increment (for diagnostics). */
  deltaKHRaw: number;
  /** Lyapunov candidate evaluated at the pre-update point. */
  candidate: LyapunovCandidate;
  /** Effective gain actually applied (`gainG · tractabilityGain · stepSize`). */
  effectiveGain: number;
}

/**
 * Apply one step of the Lyapunov-stable K_H adaptation law. Pure function.
 *
 * The update is the discrete-time approximation of Sastry eq 2.0.42:
 *
 *     K_H[t+1] = K_H[t] + Δt · (−g · tractGain · Σ wᵢ · e)
 *
 * Clamping is applied last so the adaptation law's invariants (monotonic
 * response to persistent-error regressors, gain proportionality) hold in the
 * unclamped regime; the clamp guards only the pathological regime where
 * floor/ceiling constraints bite.
 */
export function adaptKH(opts: AdaptKHOptions): AdaptKHResult {
  const {
    currentKH,
    targetKH,
    observedRate,
    teachingDeclaredRate,
    regressor,
    tractabilityGain,
  } = opts;

  const stepSize = opts.stepSize !== undefined && Number.isFinite(opts.stepSize) && opts.stepSize >= 0
    ? opts.stepSize
    : 1;
  const gainG = opts.gainG !== undefined && Number.isFinite(opts.gainG) ? opts.gainG : DEFAULT_GAIN_G;
  const gainGamma = opts.gainGamma !== undefined && Number.isFinite(opts.gainGamma)
    ? opts.gainGamma
    : DEFAULT_GAIN_GAMMA;

  // Clamp tractability gain defensively to the documented range.
  const gainT = Number.isFinite(tractabilityGain)
    ? Math.max(0, Math.min(1, tractabilityGain))
    : 0.3;

  const candidate = evaluateLyapunov({
    observedRate,
    teachingDeclaredRate,
    effectiveK_H: currentKH,
    targetK_H: targetKH,
    regressor,
    gainG,
    gainGamma,
    tractGain: gainT,
  });

  // K̇_H = −g · tractGain · Σ wᵢ · e   (Sastry eq 2.0.42)
  let wDotE = 0;
  for (const wi of regressor) wDotE += wi * candidate.e;
  const KHdot = -gainG * gainT * wDotE;
  const deltaKHRaw = stepSize * KHdot;
  const unclamped = currentKH + deltaKHRaw;

  const ceiling = opts.ceiling !== undefined ? opts.ceiling : targetKH;
  const floor = opts.floor !== undefined ? opts.floor : -Infinity;
  const newKH = Math.max(floor, Math.min(ceiling, unclamped));

  return {
    newKH,
    deltaKHRaw,
    candidate,
    effectiveGain: gainG * gainT * stepSize,
  };
}
