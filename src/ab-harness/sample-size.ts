/**
 * ME-3 Skill A/B Harness — Required sample size calculator.
 *
 * `requiredSampleSize(tractabilityClass, effectSize, alpha)` returns the
 * recommended per-variant sample count for a significance test to have
 * adequate power.  The heuristic is derived from Zhang 2026 §4.3 and the
 * tractability-weighted noise floor:
 *
 * Base rule (Zhang §6 Stage 2 headroom test):
 *   10–20 candidate prompts × 20 held-out questions = recommended minimum.
 *   We treat 30 per variant as the practitioner default (Zhang §6 note:
 *   "recommend N ≥ 30" for reliable sign-test results).
 *
 * Tractability scaling:
 *   - `tractable`  (structured output): signal is clean → N = 20.  Effect
 *     size is reliable; fewer samples needed to detect a real signal.
 *   - `unknown`    (unclassified):       conservative → N = 30.  Default
 *     assumption is noisy; extra samples reduce false-positive risk.
 *   - `coin-flip`  (prose output):       noisy signal → N = 50.  Higher
 *     floor means deltas cluster near the threshold; more samples needed
 *     to reliably distinguish "large delta" from "delta ≈ floor".
 *
 * Alpha scaling (finer-grained):
 *   Tighter alpha requires more evidence, so N scales inversely with alpha.
 *   We multiply the base N by log(0.1/alpha)/log(2) at alpha < 0.10.
 *   At alpha = 0.05 this doubles N; at alpha = 0.01 it roughly triples.
 *   At alpha ≥ 0.10 no adjustment (Zhang's default).
 *
 * Effect size interaction:
 *   Large claimed effect sizes can justify fewer samples.  For effectSize > 1
 *   (caller signals they expect a decisive effect), N is halved (floor: minN).
 *   For effectSize ≤ 0 or not supplied, no reduction.
 *
 * Zero external dependencies; pure synchronous function.
 *
 * Phase 671, Wave R8 (ME-3).
 *
 * @module ab-harness/sample-size
 */

import type { TractabilityClass } from '../tractability/selector-api.js';

// ─── Table ───────────────────────────────────────────────────────────────────

/**
 * Base per-variant sample sizes by tractability class.
 *
 * | Class      | Base N | Noise floor multiplier | Rationale                          |
 * |------------|--------|------------------------|------------------------------------|
 * | tractable  |     20 | ×1.0                   | Clean signal; small N sufficient   |
 * | unknown    |     30 | ×1.5                   | Conservative default               |
 * | coin-flip  |     50 | ×2.5                   | Noisy signal; large N to clear floor |
 */
const BASE_N: Record<TractabilityClass, number> = {
  tractable: 20,
  unknown: 30,
  'coin-flip': 50,
};

/** Absolute minimum N regardless of any downward adjustments. */
const MIN_N = 10;

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Return the recommended per-variant sample size for an A/B comparison.
 *
 * @param tractabilityClass — ME-1 classification of the skill under test.
 * @param effectSize        — Anticipated normalised effect size (|Δ|/noiseFloor).
 *                            Pass 0 when unknown.  Values > 1 indicate a large
 *                            expected effect and allow a reduced sample count.
 * @param alpha             — Desired significance level (default 0.10 per spec).
 *
 * @returns Recommended per-variant sample count (integer, ≥ MIN_N).
 */
export function requiredSampleSize(
  tractabilityClass: TractabilityClass,
  effectSize: number = 0,
  alpha: number = 0.10,
): number {
  let n = BASE_N[tractabilityClass];

  // ── Alpha adjustment ──────────────────────────────────────────────────────
  // Tighter alpha → more evidence needed → larger N.
  // Adjustment kicks in only below the Zhang default of 0.10.
  if (alpha > 0 && alpha < 0.10) {
    const alphaFactor = Math.log(0.10 / alpha) / Math.log(2);
    n = Math.ceil(n * (1 + alphaFactor));
  }

  // ── Effect-size adjustment ────────────────────────────────────────────────
  // Large anticipated effect → fewer samples needed, halved at effectSize > 1.
  // We do NOT allow this to push below MIN_N.
  if (effectSize > 1) {
    n = Math.ceil(n / 2);
  }

  return Math.max(n, MIN_N);
}

/**
 * Return the full sample-size table for all tractability classes at a given
 * alpha and effect size.  Useful for reporting.
 */
export function sampleSizeTable(
  alpha: number = 0.10,
  effectSize: number = 0,
): Record<TractabilityClass, number> {
  return {
    tractable: requiredSampleSize('tractable', effectSize, alpha),
    unknown: requiredSampleSize('unknown', effectSize, alpha),
    'coin-flip': requiredSampleSize('coin-flip', effectSize, alpha),
  };
}

/**
 * Return the minimum per-variant count below which the harness will emit
 * `insufficient-data` regardless of any other criterion.
 * Exposed so callers can surface this constant without hardcoding it.
 */
export const ABSOLUTE_MIN_SAMPLES: number = MIN_N;
