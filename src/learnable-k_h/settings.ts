/**
 * MD-5 — Learnable K_H settings-flag reader.
 *
 * The `gsd-skill-creator.sensoria.learnable_k_h.enabled` flag controls whether
 * MD-5's per-skill linear head replaces the MB-1 scalar K_H on the read path.
 * Default OFF — when disabled, `resolveKH()` falls back to the MB-1 scalar
 * exactly, so SC-MD5-01 (flag-off byte-identical to the MB-1+MB-2 stack)
 * holds by construction.
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "sensoria": {
 *       "learnable_k_h": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * Shape mirrors `lyapunov/settings.ts` and `projection/settings.ts`.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-5-learnable-K_H.md
 *
 * @module learnable-k_h/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the MD-5 learnable-K_H-enabled flag. Returns `false` on any read /
 * parse error — the learnable head must never activate unless the operator
 * has explicitly opted in. Symmetric with `readLyapunovEnabledFlag()`.
 */
export function readLearnableKHEnabledFlag(
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
    const lk = (sens as Record<string, unknown>).learnable_k_h;
    if (!lk || typeof lk !== 'object') return false;
    const enabled = (lk as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
