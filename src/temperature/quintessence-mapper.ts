/**
 * MD-4 Temperature Schedule — Quintessence Mapper.
 *
 * Maps M8 QuintessenceSnapshot axes to a base temperature before
 * tractability tempering. Pure function; no side effects.
 *
 * Formula (MD-4 proposal §Mechanism):
 *   stabSafe       = max(stabilityVsNovelty, 0.01)           // divide-by-zero guard
 *   novelty        = 1 - stabilityVsNovelty                  // invert: low stability = high novelty
 *   quintDrive     = exp(λ₁ · novelty/stabSafe − λ₂ · fatefulEncounters_norm)
 *   baseTemp       = T_base · quintDrive                      // before tract_tempering
 *
 * Axis interpretation:
 *   - stabilityVsNovelty ∈ [0, 1]:  1.0 = all trunk-preserved (stable),
 *       0.0 = all branch-committed (novel). High novelty → temperature UP.
 *   - fatefulEncounters ∈ [0, ∞):   high count → temperature DOWN (consolidate).
 *       Normalised by dividing by (1 + raw) so it stays finite.
 *
 * Axes are clamped on read (failure mode guard per MD-4 proposal §Failure modes 1).
 *
 * @module temperature/quintessence-mapper
 */

import type { QuintessenceSnapshot } from '../types/symbiosis.js';
import type { TemperatureScheduleSettings } from './settings.js';

/**
 * Minimal quintessence signal consumed by MD-4.
 * Uses only the three axes defined as necessary by SUMMARY §5 Thread D Q3.
 */
export interface QuintessenceSignal {
  /** Stability-vs-Novelty axis [0, 1]. 1 = stable, 0 = novel. */
  stability: number;
  /**
   * Fateful Encounters count [0, ∞). Raw count from M8; normalised internally.
   */
  fatefulEncounters: number;
}

/**
 * Extract the MD-4-relevant signal from a full QuintessenceSnapshot.
 * Clamps axes to expected domains (failure mode guard).
 */
export function extractQuintessenceSignal(
  snapshot: QuintessenceSnapshot,
): QuintessenceSignal {
  return {
    stability: Math.max(0, Math.min(1, snapshot.stabilityVsNovelty)),
    fatefulEncounters: Math.max(0, snapshot.fatefulEncounters),
  };
}

/**
 * Compute the base temperature from a QuintessenceSignal.
 *
 * The "base" is T_base × quintDrive; tract_tempering is applied separately
 * in `tract-tempering.ts`. This decomposition keeps the Quintessence
 * contribution auditable independently.
 *
 * @param signal - MD-4-relevant quintessence axes (clamped on read).
 * @param settings - Schedule settings supplying T_base, lambda1, lambda2.
 * @returns Positive base temperature (not yet clamped to [T_min, T_max]).
 */
export function mapQuintessenceToBaseTemp(
  signal: QuintessenceSignal,
  settings: Pick<TemperatureScheduleSettings, 'T_base' | 'lambda1' | 'lambda2'>,
): number {
  // stabSafe: clamp to avoid divide-by-zero when stability collapses to 0
  const stabSafe = Math.max(signal.stability, 0.01);

  // novelty is the complement of stability: low stability = high novelty = higher temperature
  const novelty = 1 - signal.stability;

  // Normalise fateful encounters to [0, 1) range: n/(1+n)
  // This keeps the exponent finite regardless of raw count magnitude
  const fatefulNorm = signal.fatefulEncounters / (1 + signal.fatefulEncounters);

  // Quintessence drive: novelty/stability ratio drives up; fateful encounters dampen
  const quintDrive = Math.exp(
    settings.lambda1 * (novelty / stabSafe) - settings.lambda2 * fatefulNorm,
  );

  return settings.T_base * quintDrive;
}

/**
 * Convenience overload: extract signal from a full snapshot and compute base temp.
 */
export function mapSnapshotToBaseTemp(
  snapshot: QuintessenceSnapshot,
  settings: Pick<TemperatureScheduleSettings, 'T_base' | 'lambda1' | 'lambda2'>,
): number {
  return mapQuintessenceToBaseTemp(extractQuintessenceSignal(snapshot), settings);
}
