/**
 * MB-1 Lyapunov — settings-flag reader.
 *
 * Phase 661 / v1.49.561 Wave R5 Stability Rails. The
 * `gsd-skill-creator.sensoria.lyapunov.enabled` flag controls whether the
 * Lyapunov-stable K_H adaptation law replaces M6's ad-hoc "decay toward K_L"
 * rule. Default OFF — flag-off path MUST be byte-identical to phase-660
 * sensoria behaviour (SC-MB1-01).
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "sensoria": {
 *       "lyapunov": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-1-lyapunov-K_H.md
 *
 * @module lyapunov/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the Lyapunov-enabled flag from settings.json. Returns `false` on any
 * read / parse error — the Lyapunov adaptation law must never activate unless
 * the operator has explicitly opted in.
 *
 * Symmetric with `readAceEnabledFlag()` / `readSensoriaEnabledFlag()`.
 */
export function readLyapunovEnabledFlag(
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
    const sens = (scope as Record<string, unknown>).sensoria;
    if (!sens || typeof sens !== 'object') return false;
    const lyap = (sens as Record<string, unknown>).lyapunov;
    if (!lyap || typeof lyap !== 'object') return false;
    const enabled = (lyap as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
