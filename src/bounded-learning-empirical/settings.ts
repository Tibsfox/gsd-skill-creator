/**
 * Bounded-Learning Empirical Harness — settings-flag reader.
 *
 * Reads the `gsd-skill-creator.upstream-intelligence.bounded-learning-empirical.enabled`
 * opt-in flag. Default OFF — when off the public API returns byte-identical
 * disabled records with no task evaluation performed.
 *
 * Flag location in `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "bounded-learning-empirical": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * Pattern mirrors `src/dead-zone/settings.ts` and `src/lyapunov/settings.ts`.
 *
 * Phase 766, v1.49.573.
 *
 * @module bounded-learning-empirical/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the bounded-learning-empirical enabled flag from settings.
 *
 * Returns `false` on any read / parse / shape error — the harness must never
 * activate unless the operator has explicitly opted in. This ensures the
 * flag-off byte-identical invariant even when settings files are absent or
 * malformed.
 *
 * Symmetric with `readDeadZoneEnabledFlag()` and `readLyapunovEnabledFlag()`.
 *
 * @param settingsPath - Path to settings; defaults to `.claude/settings.json`.
 * @returns `true` only when the flag is explicitly `true`.
 */
export function readBoundedLearningEmpiricalEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  try {
    const raw = (() => {
      const DEFAULT_PATH = '.claude/settings.json';
      const LIB_PATH = '.claude/gsd-skill-creator.json';
      // When the caller didn't override settingsPath (the default harness path),
      // also check the library-native .claude/gsd-skill-creator.json first,
      // since Claude Code's harness rejects unknown keys in settings.json.
      const paths =
        settingsPath === DEFAULT_PATH ? [LIB_PATH, DEFAULT_PATH] : [settingsPath];
      for (const _p of paths) {
        try {
          const _txt = readFileSync(_p, 'utf8');
          if (_txt) return _txt;
        } catch {
          // intentional: try next path
        }
      }
      throw new Error('no settings file found');
    })();

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;

    const upstream = (scope as Record<string, unknown>)['upstream-intelligence'];
    if (!upstream || typeof upstream !== 'object') return false;

    const ble = (upstream as Record<string, unknown>)['bounded-learning-empirical'];
    if (!ble || typeof ble !== 'object') return false;

    const enabled = (ble as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
