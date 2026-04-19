/**
 * MD-4 Temperature Schedule — Tractability Tempering.
 *
 * Computes the `tract_tempering` multiplicative factor that resolves SUMMARY §4
 * Tension 4: "Thread D wants temperature up; Thread E wants temperature down."
 *
 * Resolution: multiplicative composition `T_session = T_base · quintDrive · tractT`
 * so both Quintessence (exploration) and tractability (coin-flip caution) compose
 * without either suppressing the other.
 *
 * Per-class factors (MD-4 proposal §Mechanism):
 *   tractable  → 1.0  (full temperature; structured-output skills benefit from exploration)
 *   unknown    → 0.6  (moderate; conservative until classification is available)
 *   coin-flip  → 0.3  (suppressed; coin-flip sessions amplify noise, not signal)
 *
 * Floor at 0.2 prevents degenerate collapse (CF-MD4-01 + E-6 resolution).
 * Empty skill-mix returns 0.7 (neutral default, neither full nor suppressed).
 *
 * @module temperature/tract-tempering
 */

import type { TractabilityClass } from '../tractability/selector-api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One entry in the recent-session skill mix, as provided by ME-1/M5. */
export interface SkillMixEntry {
  skillId: string;
  tractability: TractabilityClass;
}

// ---------------------------------------------------------------------------
// Per-class factor constants
// ---------------------------------------------------------------------------

/** Raw per-class factor before mean aggregation and floor clamp. */
const TRACT_FACTORS: Record<TractabilityClass, number> = {
  tractable: 1.0,
  unknown: 0.6,
  'coin-flip': 0.3,
};

/** Neutral default returned when skill-mix is empty (unknown session profile). */
export const EMPTY_MIX_DEFAULT = 0.7;

/** Floor: prevents degenerate collapse on 100% coin-flip sessions (E-6 resolution). */
export const TRACT_TEMPERING_FLOOR = 0.2;

/** Ceiling: tractable sessions get full temperature multiplier. */
export const TRACT_TEMPERING_CEILING = 1.0;

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Compute the tract_tempering factor from a recent-session skill mix.
 *
 * Algorithm:
 *   1. Empty mix → return EMPTY_MIX_DEFAULT (0.7).
 *   2. Map each entry to its per-class factor.
 *   3. Compute arithmetic mean.
 *   4. Clamp to [TRACT_TEMPERING_FLOOR, TRACT_TEMPERING_CEILING].
 *
 * @param recentSkillMix - Skill activations from the current session window.
 *   Typically the last 20 activations (configurable by the consumer).
 * @returns Scalar in [0.2, 1.0] to multiply against base temperature.
 */
export function computeTractTempering(
  recentSkillMix: readonly SkillMixEntry[],
): number {
  if (recentSkillMix.length === 0) return EMPTY_MIX_DEFAULT;

  const sum = recentSkillMix.reduce(
    (acc, entry) => acc + TRACT_FACTORS[entry.tractability],
    0,
  );
  const mean = sum / recentSkillMix.length;

  return Math.max(TRACT_TEMPERING_FLOOR, Math.min(TRACT_TEMPERING_CEILING, mean));
}

/**
 * Apply tract_tempering to a base temperature value.
 *
 * This is the second step of the three-way product:
 *   T_session = T_base · quintDrive · tractT
 *
 * The `baseTemp` argument already includes the T_base × quintDrive factor
 * from `mapQuintessenceToBaseTemp`; this function multiplies by tractT.
 * Bounding to [T_min, T_max] is the caller's responsibility (done in `schedule.ts`).
 *
 * @param baseTemp - Temperature before tractability tempering (> 0).
 * @param recentSkillMix - Recent-session skill mix for tractability mean.
 * @returns Raw temperature after tractability factor applied (not yet bounded).
 */
export function applyTractTempering(
  baseTemp: number,
  recentSkillMix: readonly SkillMixEntry[],
): number {
  const tractT = computeTractTempering(recentSkillMix);
  return baseTemp * tractT;
}

/**
 * Retrieve the per-class factor for a single tractability class.
 * Exposed for testing and logging.
 */
export function factorForClass(cls: TractabilityClass): number {
  return TRACT_FACTORS[cls];
}
