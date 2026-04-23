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
    const raw = (() => {
      const DEFAULT_PATH = '.claude/settings.json';
      const LIB_PATH = '.claude/gsd-skill-creator.json';
      // When the caller didn't override settingsPath (i.e. it's the default
      // harness path), also check the library-native .claude/gsd-skill-creator.json
      // first, since Claude Code's harness rejects unknown keys in settings.json.
      const paths = settingsPath === DEFAULT_PATH ? [LIB_PATH, DEFAULT_PATH] : [settingsPath];
      for (const _p of paths) {
        try {
          const _txt = readFileSync(_p, 'utf8');
          if (_txt) return _txt;
        } catch {}
      }
      throw new Error('no settings file found');
    })();
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
