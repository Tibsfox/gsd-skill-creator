/**
 * MD-4 Temperature Schedule — Read API.
 *
 * `currentTemperature()` is the primary consumer-facing function for
 * MA-3+MD-2 (M5 softmax temperature) and MD-3 (M7 Langevin η_0).
 *
 * Design:
 *   - Caches the last computed T_session.
 *   - Invalidates cache when a new QuintessenceSnapshot is provided via `update()`.
 *   - `currentTemperature()` returns the cached value without recomputing.
 *   - `currentEta0()` returns T_session × 0.02 for MD-3's η_0 (per MD-4 proposal:
 *       "η_0_effective = T_session · 0.02; this matches MD-3 default η_0 = 0.01
 *        at T_session = 0.5").
 *   - When disabled, `currentTemperature()` returns the sentinel (1.0); consumers
 *       treat this as "no schedule" and use their own configured constants.
 *
 * Thread safety: single-threaded JS; no locking required.
 *
 * @module temperature/api
 */

import type { QuintessenceSnapshot } from '../types/symbiosis.js';
import { computeTemperature, type TemperatureResult } from './schedule.js';
import type { SkillMixEntry } from './tract-tempering.js';
import {
  createSettings,
  SENTINEL_TEMPERATURE,
  type TemperatureScheduleSettings,
} from './settings.js';

// ---------------------------------------------------------------------------
// MD-3 scale constant
// ---------------------------------------------------------------------------

/**
 * Scale factor to convert T_session to MD-3's Langevin initial scale η_0.
 * At T_session = 0.5 (T_base default): η_0_effective = 0.5 × 0.02 = 0.01
 * which matches MD-3's own default η_0.
 */
export const ETA0_SCALE = 0.02;

// ---------------------------------------------------------------------------
// TemperatureApi class
// ---------------------------------------------------------------------------

/**
 * Stateful cache for the MD-4 temperature schedule.
 *
 * Typical lifecycle:
 *   1. Construct with settings (or defaults).
 *   2. Call `update(snapshot, skillMix)` whenever M8 Quintessence changes.
 *   3. MA-3+MD-2 calls `currentTemperature()` at selection time.
 *   4. MD-3 calls `currentEta0()` before noise injection.
 *   5. On FatefulEncounters increment, call `warmRestart()`.
 */
export class TemperatureApi {
  private _settings: TemperatureScheduleSettings;
  private _cached: TemperatureResult | null = null;

  constructor(settings: Partial<TemperatureScheduleSettings> = {}) {
    this._settings = createSettings(settings);
  }

  /**
   * Update the cached temperature from a new QuintessenceSnapshot and skill mix.
   * Invalidates any previous cached value.
   *
   * @param snapshot - Current M8 Quintessence snapshot.
   * @param recentSkillMix - Recent-session skill activations (default: empty = neutral).
   * @returns The newly computed TemperatureResult.
   */
  update(
    snapshot: QuintessenceSnapshot,
    recentSkillMix: readonly SkillMixEntry[] = [],
  ): TemperatureResult {
    const result = computeTemperature(snapshot, recentSkillMix, this._settings);
    this._cached = result;
    return result;
  }

  /**
   * Return the currently cached T_session.
   *
   * - If no update has been called yet, returns the sentinel (1.0).
   * - If the schedule is disabled, returns the sentinel (1.0).
   * - Otherwise returns the last computed T_session.
   *
   * Consumers: MA-3+MD-2 reads this for M5 softmax temperature.
   */
  currentTemperature(): number {
    if (this._cached === null) return SENTINEL_TEMPERATURE;
    return this._cached.T_session;
  }

  /**
   * Return the current η_0 for MD-3 Langevin noise injection.
   *
   * η_0_effective = T_session × ETA0_SCALE
   *
   * MD-3's hard tractability gate is preserved: MD-3 itself is responsible
   * for bypassing noise injection on coin-flip skills; this function only
   * supplies the scale value.
   *
   * Consumers: MD-3 reads this before injecting log-space noise.
   */
  currentEta0(): number {
    return this.currentTemperature() * ETA0_SCALE;
  }

  /**
   * Return the full last TemperatureResult, or null if never updated.
   * Useful for logging and the M3 decision-trace ledger.
   */
  lastResult(): TemperatureResult | null {
    return this._cached;
  }

  /**
   * Warm-restart: reset T_session to T_base.
   *
   * Invoked by M8 when FatefulEncounters increments (Loshchilov & Hutter 2017
   * SGDR warm-restart trigger per MD-4 proposal §Mechanism).
   *
   * @returns The reset TemperatureResult (T_session = T_base).
   */
  warmRestart(): TemperatureResult {
    const result: TemperatureResult = {
      T_session: this._settings.T_base,
      tract_tempering: 1.0,
      raw: this._settings.T_base,
      enabled: this._settings.enabled,
    };
    this._cached = result;
    return result;
  }

  /**
   * Reconfigure settings at runtime (e.g., operator enables the schedule).
   * Does NOT invalidate the cache; the new settings apply on the next `update()`.
   */
  configure(overrides: Partial<TemperatureScheduleSettings>): void {
    this._settings = createSettings({ ...this._settings, ...overrides });
  }

  /** Read current settings (for diagnostics). */
  get settings(): Readonly<TemperatureScheduleSettings> {
    return this._settings;
  }
}

// ---------------------------------------------------------------------------
// Module-level default instance (singleton for consumers that don't need isolation)
// ---------------------------------------------------------------------------

/**
 * Default module-level TemperatureApi instance.
 *
 * MA-3+MD-2 and MD-3 import `defaultApi` and call:
 *   - `defaultApi.currentTemperature()` for softmax T
 *   - `defaultApi.currentEta0()` for η_0_effective
 *
 * M8 calls `defaultApi.update(snapshot, skillMix)` on each Quintessence refresh,
 * and `defaultApi.warmRestart()` on FatefulEncounters increment.
 *
 * The singleton starts disabled (schedule OFF by default, SC-MD4-01).
 */
export const defaultApi = new TemperatureApi();

/**
 * Module-level convenience wrapper: returns current T_session from the
 * default instance.
 *
 * This is the primary entrypoint for siblings that want a callable without
 * constructing their own instance.
 */
export function currentTemperature(): number {
  return defaultApi.currentTemperature();
}

/**
 * Module-level convenience wrapper: returns current η_0 from the default instance.
 */
export function currentEta0(): number {
  return defaultApi.currentEta0();
}
