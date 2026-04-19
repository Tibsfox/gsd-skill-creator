/**
 * MB-2 — Projection-enabled flag reader.
 *
 * The `gsd-skill-creator.lyapunov.projection.enabled` flag controls whether
 * the smooth projection operators replace ad-hoc clipping in M6 (K_H) and
 * M7 (simplex). Default OFF — flag-off path MUST be byte-identical to
 * phase-660 sensoria + phase-647 M7 behaviour (SC-MB2-01).
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "lyapunov": {
 *       "projection": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * The flag nests under `lyapunov` (not `sensoria.lyapunov`) because MB-2
 * projection applies to both M6 (sensoria) and M7 (umwelt) — a shared scope
 * avoids M6-only path confusion.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-2-projection-operators.md
 *
 * @module projection/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the MB-2 projection-enabled flag from settings.json. Returns `false`
 * on any read / parse error — the projection operators must never activate
 * unless the operator has explicitly opted in.
 *
 * Symmetric with `readLyapunovEnabledFlag()` in `../lyapunov/settings.ts`.
 */
export function readProjectionEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;
    const lyap = (scope as Record<string, unknown>).lyapunov;
    if (!lyap || typeof lyap !== 'object') return false;
    const proj = (lyap as Record<string, unknown>).projection;
    if (!proj || typeof proj !== 'object') return false;
    const enabled = (proj as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
