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

import { readBooleanFlag, harnessCandidatePaths } from '../settings/read-settings.js';

/**
 * Read the MD-3 langevin-enabled flag from settings.json. Returns `false`
 * on any read / parse error — the noise injector must never activate
 * unless the operator has explicitly opted in.
 */
export function readLangevinEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  return readBooleanFlag(['umwelt', 'langevin', 'enabled'], harnessCandidatePaths(settingsPath));
}
