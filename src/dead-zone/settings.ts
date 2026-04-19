/**
 * MB-5 Dead-Zone Bounded Learning — settings-flag reader.
 *
 * The `gsd-skill-creator.lyapunov.dead_zone.enabled` flag controls whether
 * MB-5's smooth dead-zone adaptation scale replaces M4's hard 20%-diff bound
 * and 7-day cooldown. Default OFF — flag-off path MUST be byte-identical to
 * M4 phase-645 behaviour (SC-MB5-01).
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "lyapunov": {
 *       "dead_zone": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * The nesting mirrors the MB-1 flag (`sensoria.lyapunov.enabled`) but uses
 * the `lyapunov.dead_zone` sub-path so each component can be toggled
 * independently.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-5-dead-zone-bounded-learning.md
 *
 * @module dead-zone/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the dead-zone–enabled flag from settings.json.
 *
 * Returns `false` on any read / parse / shape error — the smooth dead-zone
 * must never activate unless the operator has explicitly opted in. This
 * ensures SC-MB5-01 (flag-off byte-identical to phase-645) even if the
 * settings file is absent or malformed.
 *
 * Symmetric with `readLyapunovEnabledFlag()` and `readAceEnabledFlag()`.
 *
 * @param settingsPath - Path to settings.json; defaults to `.claude/settings.json`.
 * @returns `true` only when the flag is explicitly `true`.
 */
export function readDeadZoneEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;

    const lyap = (scope as Record<string, unknown>).lyapunov;
    if (!lyap || typeof lyap !== 'object') return false;

    const dz = (lyap as Record<string, unknown>).dead_zone;
    if (!dz || typeof dz !== 'object') return false;

    const enabled = (dz as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
