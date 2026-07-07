/**
 * MA-3 + MD-2 — Stochastic Selection Settings Flag Reader.
 *
 * Reads `gsd-skill-creator.orchestration.stochastic.enabled` from
 * `.claude/settings.json`. Default: OFF.
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "orchestration": {
 *       "stochastic": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * When OFF (the default), the selector-bridge short-circuits to M5's
 * deterministic top-k, preserving byte-identical v1.49.561 behaviour (SC-MA3-01).
 *
 * @module stochastic/settings
 */

import { readBooleanFlag, harnessCandidatePaths } from '../settings/read-settings.js';

/**
 * Read the stochastic-selection enabled flag from settings.json.
 *
 * Returns `false` on any read / parse error — the stochastic path must never
 * activate unless the operator has explicitly opted in.
 *
 * @param settingsPath  Path to settings.json. Defaults to `.claude/settings.json`.
 */
export function readStochasticEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  return readBooleanFlag(['orchestration', 'stochastic', 'enabled'], harnessCandidatePaths(settingsPath));
}
