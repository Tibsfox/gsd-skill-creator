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

// ---------------------------------------------------------------------------
// Bounded-learning citation-anchored constants (v1.49.585 C03)
// ---------------------------------------------------------------------------
//
// These constants ARE citation-anchored architectural invariants. Each value
// is derived from a published paper and CANNOT be changed without amending
// CITATION.md and updating the citation-anchors specification at
// .planning/missions/v1-49-585-concerns-cleanup/work/specs/citation-anchors.md
// in the same commit.
//
// The src/dead-zone/__tests__/citation-invariants.test.ts file asserts on
// these values; changing any value silently will fail CI loudly, forcing
// the author to engage with the citation rationale.
//
// Until v1.49.585 these values existed only as prose mentions across the
// codebase (cli.ts, dashboard/parser.test.ts, skill-creator/roles/types.ts,
// compression-spectrum/types.ts comments) or as documentation-only claims
// in src/dead-zone/CITATION.md (JP-033). v1.49.585 component C03 elevates
// them to real exports with test enforcement.

/**
 * Maximum corrections admitted to a single skill before fidelity threshold
 * is crossed and the skill must be re-derived rather than further corrected.
 *
 * Anchored on arXiv:2604.20874 (Root Theorem of Context Engineering):
 * the bounded-tape framing's C1 monotone-decay consequence implies a finite
 * correction-budget per skill. The third correction is the last admissible
 * fidelity-preserving correction; a fourth correction crosses C1's monotone-
 * decay threshold and the skill must be re-derived.
 *
 * DO NOT change without amending:
 *   .planning/missions/v1-49-585-concerns-cleanup/work/specs/citation-anchors.md
 *   src/dead-zone/CITATION.md
 *
 * @see arXiv:2604.20874
 */
export const MAX_CORRECTIONS_BEFORE_BLOCK = 3 as const;

/**
 * Small-data inductive-bias floor: minimum activation count before a skill
 * may be promoted to a structural-anchor role with confidence-interval-bounded
 * fidelity claims.
 *
 * Anchored on arXiv:2604.21101 (Hybridizable Neural Time Integrator):
 * 12 high-fidelity simulations suffice for reference-accuracy match in
 * conservation-law-structured architectures. This is the tightest published
 * data-efficiency anchor for any system that enforces structural constraints
 * (cf. dead-zone bounded learning's Lyapunov-stable updates).
 *
 * Until v1.49.585, this was citation-only at src/dead-zone/CITATION.md JP-033
 * with no enforcing const in code (the CITATION.md *claimed* smooth-dead-zone.ts
 * enforced it, but no enforcement existed). v1.49.585 component C03 elevates
 * the floor to a real export; future smooth-dead-zone refinements may consume
 * this const to provide the runtime enforcement CITATION.md describes.
 *
 * DO NOT change without amending:
 *   .planning/missions/v1-49-585-concerns-cleanup/work/specs/citation-anchors.md
 *   src/dead-zone/CITATION.md
 *
 * @see arXiv:2604.21101
 */
export const SMALL_DATA_FLOOR = 12 as const;
