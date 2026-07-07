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

import { readBooleanFlag, harnessCandidatePaths } from '../settings/read-settings.js';

/**
 * Read the MD-5 learnable-K_H-enabled flag. Returns `false` on any read /
 * parse error — the learnable head must never activate unless the operator
 * has explicitly opted in. Symmetric with `readLyapunovEnabledFlag()`.
 */
export function readLearnableKHEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  return readBooleanFlag(['sensoria', 'learnable_k_h', 'enabled'], harnessCandidatePaths(settingsPath));
}
