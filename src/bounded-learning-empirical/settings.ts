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

import { readBooleanFlag, harnessCandidatePaths } from '../settings/read-settings.js';

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
  return readBooleanFlag(['upstream-intelligence', 'bounded-learning-empirical', 'enabled'], harnessCandidatePaths(settingsPath));
}
