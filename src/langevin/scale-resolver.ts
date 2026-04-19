/**
 * MD-3 — Noise Scale Resolver.
 *
 * Maps a base Langevin noise scale through ME-1 tractability classification
 * to produce the effective scale used by `injectLangevinNoise`.
 *
 * Per Thread E T-E-D resolution (SUMMARY §4 Tension 4): noise variance is
 * GATED on tractability. The proposal's strict reading is a hard binary
 * gate (skip on coin-flip / unknown). MD-3 acceptance gate LS-35 instead
 * directs us to keep the gate as a continuous gain so callers can
 * downstream-mute exploration on weak-signal skills without a code branch:
 *
 *   - tractable  → 1.0  (full noise)
 *   - unknown    → 0.5  (half noise; conservative middle)
 *   - coin-flip  → 0.2  (heavily attenuated; near-no-op)
 *
 * The gain is multiplicative on the variance interpretation; pass the
 * resolved scale through to `injectLangevinNoise` directly. A
 * `confidence ∈ [0, 1]` further attenuates the resolved scale so a
 * low-confidence classification falls back toward the more conservative
 * bucket regardless of the nominal class.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-3-langevin-noise.md
 *
 * @module langevin/scale-resolver
 */

import type { TractabilityClass } from '../tractability/selector-api.js';

export type { TractabilityClass };

/**
 * Tractability → noise gain table per MD-3 / LS-35.
 *
 * Exposed so tests and downstream modules can introspect the canonical
 * coefficients without reaching into resolver internals.
 */
export const TRACTABILITY_NOISE_GAIN: Readonly<Record<TractabilityClass, number>> =
  Object.freeze({
    tractable: 1.0,
    unknown: 0.5,
    'coin-flip': 0.2,
  });

/**
 * Resolve the effective Langevin noise scale.
 *
 * @param baseScale - Caller-provided base scale (e.g. SGLD schedule output).
 *   Negative or non-finite inputs collapse to 0 (safety valve).
 * @param tractabilityClass - ME-1 classification.
 * @param confidence - Optional `[0, 1]` confidence on the classification.
 *   When omitted, treated as 1.0. Out-of-range values are clamped.
 * @returns Effective scale; 0 when the safety valve trips.
 */
export function resolveNoiseScale(
  baseScale: number,
  tractabilityClass: TractabilityClass,
  confidence: number = 1,
): number {
  if (!(baseScale > 0) || !Number.isFinite(baseScale)) return 0;

  const gain = TRACTABILITY_NOISE_GAIN[tractabilityClass];
  if (gain === undefined) return 0;

  // Clamp confidence to [0, 1] and treat NaN as 0.
  let c: number;
  if (!Number.isFinite(confidence)) {
    c = 0;
  } else if (confidence < 0) {
    c = 0;
  } else if (confidence > 1) {
    c = 1;
  } else {
    c = confidence;
  }

  return baseScale * gain * c;
}
