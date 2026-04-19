/**
 * ME-3 Skill A/B Harness — Feature flag.
 *
 * `gsd-skill-creator.ab_harness.enabled` controls whether the A/B harness
 * is active.  Default is OFF (false) so the harness ships dark and does not
 * alter M4 behaviour in the flag-off state (SC-ME3-01, LS-41).
 *
 * The flag is read from (in priority order):
 *   1. Environment variable `SC_AB_HARNESS_ENABLED=1` (set to '1' to enable).
 *   2. The `settings` object passed directly (programmatic override for tests
 *      and future settings-file integration).
 *
 * When the flag is OFF, the coordinator immediately returns a disabled result
 * and the CLI prints a 'disabled' message.
 *
 * Phase 671, Wave R8 (ME-3).
 *
 * @module ab-harness/settings
 */

/** Environment variable name for enabling the A/B harness. */
export const ENV_FLAG = 'SC_AB_HARNESS_ENABLED';

/** Settings object shape accepted by `isABHarnessEnabled`. */
export interface ABHarnessSettings {
  /** When true, the A/B harness is active. Default: false. */
  enabled?: boolean;
}

/**
 * Return true when the A/B harness feature flag is ON.
 *
 * Checks (in order):
 *   1. `settings.enabled` when provided.
 *   2. `process.env.SC_AB_HARNESS_ENABLED === '1'`.
 *   3. Falls back to false (default OFF).
 */
export function isABHarnessEnabled(settings?: ABHarnessSettings): boolean {
  if (settings !== undefined && settings.enabled !== undefined) {
    return settings.enabled;
  }
  return process.env[ENV_FLAG] === '1';
}

/**
 * Return a human-readable disabled message for CLI output.
 * Used by the CLI and coordinator when the flag is OFF.
 */
export function disabledMessage(): string {
  return (
    'A/B harness is disabled (gsd-skill-creator.ab_harness.enabled = false).\n' +
    `Set ${ENV_FLAG}=1 or enable via settings to activate.`
  );
}
