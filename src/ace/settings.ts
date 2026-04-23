/**
 * MA-2 ACE — settings-flag reader.
 *
 * Phase 655 / v1.49.561 Refinement R2. The
 * `gsd-skill-creator.orchestration.ace.enabled` flag controls whether the
 * actor-critic loop runs and emits actor updates. Default OFF — flag-off path
 * MUST be byte-identical to v1.49.561 pre-refinement (SC-MA2-01).
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "orchestration": {
 *       "ace": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * Source proposal: .planning/research/living-sensoria-refinement/proposals/MA-2-ace-reinforcement.md
 *
 * @module ace/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the ACE-enabled flag from settings.json. Returns `false` on any read /
 * parse error — the actor-critic wire must never activate unless the operator
 * has explicitly opted in.
 */
export function readAceEnabledFlag(
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
    const orch = (scope as Record<string, unknown>).orchestration;
    if (!orch || typeof orch !== 'object') return false;
    const ace = (orch as Record<string, unknown>).ace;
    if (!ace || typeof ace !== 'object') return false;
    const enabled = (ace as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Tractability weighting (LS-29)
// ---------------------------------------------------------------------------

/**
 * ME-1 tractability classes consumed by the ACE weighting function.
 *
 * ME-1 ships `{tractable, coin-flip, unknown}` (NOT the proposal's discrete
 * `{tractable, partial, coin-flip}`). The weighting below accepts the ME-1
 * surface and produces a continuous scalar per LS-29.
 */
export type TractabilityClass = 'tractable' | 'coin-flip' | 'unknown';

/**
 * Floor below which no tractability weight may fall.
 *
 * Prevents the "eternal-silence bug": even on `coin-flip`/`unknown` regimes
 * the TD signal is weighted DOWN, not GATED to zero. This is the deliberate
 * resolution of SUMMARY §4 Tension 1 / T-E-A (scale the learning rate for
 * noisy reward; do not discard directional information).
 */
export const TRACTABILITY_WEIGHT_FLOOR = 0.3;

/**
 * Map a `(class, confidence)` pair to a continuous tractability weight in
 * `[TRACTABILITY_WEIGHT_FLOOR, 1]`.
 *
 * Suggested mapping (per phase 655 briefing):
 *   - `tractable` → `max(floor, confidence)`   (confidence-scaled, ≤ 1)
 *   - `coin-flip` → `floor`                    (noisy regime)
 *   - `unknown`   → `floor`                    (conservative)
 *
 * `confidence` clamps to `[0, 1]`. Non-finite or missing confidence is
 * treated as `1.0` for the `tractable` class (backward-compat with the
 * unconfidenced ME-1 API shape).
 */
export function tractabilityWeight(
  cls: TractabilityClass,
  confidence: number = 1,
): number {
  const c = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 1;
  switch (cls) {
    case 'tractable':
      return Math.max(TRACTABILITY_WEIGHT_FLOOR, c);
    case 'coin-flip':
    case 'unknown':
      return TRACTABILITY_WEIGHT_FLOOR;
    default: {
      const _exhaustive: never = cls;
      void _exhaustive;
      return TRACTABILITY_WEIGHT_FLOOR;
    }
  }
}

// ---------------------------------------------------------------------------
// Discount factor γ (Barto 1983 p. 844 col. 1)
// ---------------------------------------------------------------------------

/**
 * Default TD discount γ. Barto, Sutton & Anderson 1983 p. 844 col. 1 use 0.95
 * on their pole-balancer fixture; we inherit the default here and expose it
 * as a config knob so operators can tune per-session.
 *
 * Open question T-3 (`open-questions.md`): derive γ from M6 K_H recovery
 * timescale via `γ = exp(−Δt / τ_recovery)`. Deferred — Wave 1 ships 0.95.
 */
export const DEFAULT_GAMMA = 0.95;
