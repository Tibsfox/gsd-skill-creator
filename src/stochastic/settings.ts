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

import { readFileSync } from 'node:fs';

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
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;
    const orch = (scope as Record<string, unknown>).orchestration;
    if (!orch || typeof orch !== 'object') return false;
    const stochastic = (orch as Record<string, unknown>).stochastic;
    if (!stochastic || typeof stochastic !== 'object') return false;
    const enabled = (stochastic as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
