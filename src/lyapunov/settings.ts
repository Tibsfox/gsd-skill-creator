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

import { readBooleanFlag, harnessCandidatePaths } from '../settings/read-settings.js';

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
  return readBooleanFlag(['sensoria', 'lyapunov', 'enabled'], harnessCandidatePaths(settingsPath));
}
