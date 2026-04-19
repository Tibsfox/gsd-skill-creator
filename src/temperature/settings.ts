/**
 * MD-4 Temperature Schedule — Feature flag settings.
 *
 * `gsd-skill-creator.temperature.schedule.enabled` controls whether the
 * Quintessence-driven temperature schedule is active. Default is OFF: when
 * disabled, `currentTemperature()` returns the sentinel default (1.0) and
 * sibling consumers (MA-3+MD-2, MD-3) apply their own configured constants.
 *
 * Implementation constraints (from MD-4 proposal, LS-36):
 *   - Zero external dependencies.
 *   - Flag default OFF: the schedule ships dark; operators opt in.
 *   - Sentinel default 1.0 is treated as "no schedule" by consumers.
 *
 * @module temperature/settings
 */

export interface TemperatureScheduleSettings {
  /** Master enable/disable for the MD-4 temperature schedule. Default: false. */
  enabled: boolean;

  /**
   * Base temperature before Quintessence and tractability modulation.
   * Default: 0.5 (per MD-4 proposal).
   */
  T_base: number;

  /**
   * Minimum allowed T_session (floor). Default: 0.05.
   * Prevents degenerate collapse to deterministic even in coin-flip sessions.
   */
  T_min: number;

  /**
   * Maximum allowed T_session (ceiling). Default: 2.0.
   * Prevents runaway exploration when Novelty/Stability spikes.
   */
  T_max: number;

  /**
   * Response coefficient for Novelty/Stability ratio in the quintDrive exponent.
   * Higher values → stronger exploration when Novelty dominates. Default: 0.8.
   */
  lambda1: number;

  /**
   * Response coefficient for FatefulEncounters dampening. Default: 0.5.
   * Higher values → stronger consolidation on fateful-encounter sessions.
   */
  lambda2: number;
}

/**
 * Default settings. All defaults match the MD-4 proposal canonical values.
 * These can be overridden via `createSettings()`.
 */
export const DEFAULT_SETTINGS: Readonly<TemperatureScheduleSettings> = {
  enabled: false,
  T_base: 0.5,
  T_min: 0.05,
  T_max: 2.0,
  lambda1: 0.8,
  lambda2: 0.5,
};

/**
 * The sentinel temperature returned when the schedule is disabled.
 * Consumers treat this as "no schedule" and apply their own defaults.
 */
export const SENTINEL_TEMPERATURE = 1.0;

/**
 * Create a settings object with any fields overridden from `overrides`.
 * All unspecified fields fall back to `DEFAULT_SETTINGS`.
 */
export function createSettings(
  overrides: Partial<TemperatureScheduleSettings> = {},
): TemperatureScheduleSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}
