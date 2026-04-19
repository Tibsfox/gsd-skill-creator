/**
 * MD-4 Temperature Schedule — Core computation.
 *
 * `computeTemperature` is the primary pure function. It composes:
 *   1. `mapQuintessenceToBaseTemp`  — Quintessence axes → raw base temperature
 *   2. `applyTractTempering`        — tractability factor → tempered temperature
 *   3. Bounded by [T_min, T_max]    — CF-MD4-01 invariant
 *
 * Three-way multiplicative product (Tension 4 resolution, SUMMARY §4):
 *   T_session = clamp(T_base · quintDrive · tractT, T_min, T_max)
 *
 * References:
 *   - Kirkpatrick, Gelatt & Vecchi 1983 (Simulated Annealing)
 *   - Loshchilov & Hutter 2017 SGDR (Warm Restarts)
 *   - MD-4 proposal §Mechanism + §Acceptance gates
 *
 * @module temperature/schedule
 */

import type { QuintessenceSnapshot } from '../types/symbiosis.js';
import { mapQuintessenceToBaseTemp, type QuintessenceSignal } from './quintessence-mapper.js';
import { applyTractTempering, computeTractTempering, type SkillMixEntry } from './tract-tempering.js';
import {
  type TemperatureScheduleSettings,
  DEFAULT_SETTINGS,
  SENTINEL_TEMPERATURE,
} from './settings.js';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/** Full computation result, exposing intermediate values for logging/audit. */
export interface TemperatureResult {
  /** Final bounded session temperature. */
  T_session: number;
  /** Tractability tempering factor applied (before bounding). */
  tract_tempering: number;
  /** Raw temperature after Quintessence + tractability, before bounding. */
  raw: number;
  /** Whether the schedule was enabled for this computation. */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Core pure function
// ---------------------------------------------------------------------------

/**
 * Compute the MD-4 session temperature from a QuintessenceSnapshot and
 * recent skill-mix tractability distribution.
 *
 * When `settings.enabled` is false (default), returns the sentinel temperature
 * (1.0) so consumers know to use their own configured constants. This satisfies
 * SC-MD4-01 and LS-36.
 *
 * @param snapshot - Current M8 Quintessence snapshot (axes consumed: stabilityVsNovelty, fatefulEncounters).
 * @param recentSkillMix - Recent-session skill activations with tractability labels.
 * @param settings - Schedule configuration (defaults to DEFAULT_SETTINGS).
 * @returns TemperatureResult with T_session, intermediate values, and enabled flag.
 */
export function computeTemperature(
  snapshot: QuintessenceSnapshot,
  recentSkillMix: readonly SkillMixEntry[],
  settings: TemperatureScheduleSettings = DEFAULT_SETTINGS,
): TemperatureResult {
  if (!settings.enabled) {
    return {
      T_session: SENTINEL_TEMPERATURE,
      tract_tempering: 1.0,
      raw: SENTINEL_TEMPERATURE,
      enabled: false,
    };
  }

  const signal: QuintessenceSignal = {
    stability: Math.max(0, Math.min(1, snapshot.stabilityVsNovelty)),
    fatefulEncounters: Math.max(0, snapshot.fatefulEncounters),
  };

  const baseTemp = mapQuintessenceToBaseTemp(signal, settings);
  const raw = applyTractTempering(baseTemp, recentSkillMix);
  const T_session = Math.max(settings.T_min, Math.min(settings.T_max, raw));
  const tract_tempering = computeTractTempering(recentSkillMix);

  return { T_session, tract_tempering, raw, enabled: true };
}

/**
 * Reset the temperature to T_base by returning a result equivalent to a
 * warm-restart event (Loshchilov & Hutter 2017 SGDR §warm-restart).
 *
 * This is the minimal warm-restart affordance per MD-4 proposal §Mechanism.
 * Invoked by M8 when FatefulEncounters increments (natural restart trigger).
 * Pure function: returns a result rather than mutating state; the caller
 * (e.g., the `TemperatureApi` class) stores the result.
 *
 * @param settings - Current schedule settings.
 * @returns TemperatureResult with T_session = T_base (no Quintessence, no tractability modulation).
 */
export function resetTemperature(
  settings: TemperatureScheduleSettings = DEFAULT_SETTINGS,
): TemperatureResult {
  return {
    T_session: settings.T_base,
    tract_tempering: 1.0,
    raw: settings.T_base,
    enabled: settings.enabled,
  };
}

// ---------------------------------------------------------------------------
// Re-exports for consumer convenience
// ---------------------------------------------------------------------------

export type { SkillMixEntry, QuintessenceSignal };
export { DEFAULT_SETTINGS, SENTINEL_TEMPERATURE };
