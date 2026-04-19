/**
 * MA-3 + MD-2 — Temperature Resolver.
 *
 * Maps ME-1 `TractabilityClass` to a temperature scaling factor, then
 * multiplies by the caller-supplied base temperature to produce the effective
 * Boltzmann temperature for stochastic selection.
 *
 * Gain table (per proposal §Implementation Constraints and SUMMARY §4 T-E-D):
 *   tractable   → 1.0  (full exploration; gradient signal is reliable)
 *   unknown     → 0.5  (conservative; signal reliability unverified)
 *   coin-flip   → 0.3  (reduced exploration; gradient signal is noisier)
 *
 * Rationale (Thread E T-E-D resolution, Proposal §Mechanism):
 *   In coin-flip regimes, more temperature is more noise, not more signal.
 *   Scaling T down bounds exploration variance without suppressing it to zero.
 *   Coin-flip skills receive T·0.3, NOT T·0, preserving exploration capacity.
 *
 * @module stochastic/temperature-resolver
 */

import type { TractabilityClass } from '../tractability/selector-api.js';

/** Temperature scale factors per tractability class. */
export const TRACTABILITY_TEMPERATURE_SCALE: Record<TractabilityClass, number> = {
  tractable: 1.0,
  unknown: 0.5,
  'coin-flip': 0.3,
} as const;

/**
 * Resolve the effective Boltzmann temperature for a candidate given its
 * tractability class.
 *
 * @param baseTemp          Base temperature in [0, ∞). 0 → deterministic.
 * @param tractabilityClass ME-1 classification for the candidate.
 * @param _confidence       Reserved for future use (e.g. confidence-weighted
 *                          interpolation between classes). Currently unused;
 *                          accepted to avoid breaking callers that pass it.
 * @returns  Effective temperature T_eff = baseTemp × tractabilityScale.
 */
export function resolveTemperature(
  baseTemp: number,
  tractabilityClass: TractabilityClass,
  _confidence?: number,
): number {
  const scale = TRACTABILITY_TEMPERATURE_SCALE[tractabilityClass] ?? 0.5;
  return baseTemp * scale;
}
