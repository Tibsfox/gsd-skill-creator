/**
 * MD-3 — Langevin feature flag reader.
 *
 * The `gsd-skill-creator.umwelt.langevin.enabled` flag controls whether
 * MD-3 noise injection is active in the bridge. Default OFF — flag-off
 * MUST be byte-identical to v1.49.561 M7 (SC-MD3-01).
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "umwelt": {
 *       "langevin": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * Symmetric with `readProjectionEnabledFlag()` in `src/projection/settings.ts`.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-3-langevin-noise.md
 *
 * @module langevin/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the MD-3 langevin-enabled flag from settings.json. Returns `false`
 * on any read / parse error — the noise injector must never activate
 * unless the operator has explicitly opted in.
 */
export function readLangevinEnabledFlag(
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
    const umwelt = (scope as Record<string, unknown>).umwelt;
    if (!umwelt || typeof umwelt !== 'object') return false;
    const langevin = (umwelt as Record<string, unknown>).langevin;
    if (!langevin || typeof langevin !== 'object') return false;
    const enabled = (langevin as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
