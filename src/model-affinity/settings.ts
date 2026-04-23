/**
 * ME-2 Per-Skill Model Affinity — Settings flag reader.
 *
 * Feature flag: `gsd-skill-creator.model_affinity.enabled`.
 * Default OFF (CF-ME2-01): when false, all policy functions return null
 * suggestions; the CLI returns a "disabled" message. The M5 selector's scoring
 * is byte-identical to v1.49.561 baseline — no affinity penalty applied.
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "model_affinity": { "enabled": true }
 *   }
 * }
 * ```
 *
 * Pattern mirrors `src/orchestration/settings.ts`.
 *
 * @module model-affinity/settings
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Settings shape
// ---------------------------------------------------------------------------

export interface ModelAffinitySettings {
  /**
   * Master gate.  Default false (CF-ME2-01).
   *
   * When false:
   *   - `evaluateMatch` is not called; API returns `null` suggestions.
   *   - CLI prints "model-affinity: feature flag disabled".
   *   - M5 scoring is byte-identical to pre-ME2 baseline.
   */
  enabled: boolean;
}

export const DEFAULT_MODEL_AFFINITY_SETTINGS: ModelAffinitySettings = {
  enabled: false,
};

/**
 * Merge caller-supplied partial settings with defaults.
 */
export function resolveModelAffinitySettings(
  overrides?: Partial<ModelAffinitySettings>,
): ModelAffinitySettings {
  return { ...DEFAULT_MODEL_AFFINITY_SETTINGS, ...overrides };
}

// ---------------------------------------------------------------------------
// File-based flag reader
// ---------------------------------------------------------------------------

/**
 * Read the `gsd-skill-creator.model_affinity.enabled` flag from a settings
 * JSON file.  Returns `false` on any read / parse error — the feature must
 * never activate unless the operator has explicitly opted in.
 */
export function readModelAffinityEnabledFlag(
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
    const block = (scope as Record<string, unknown>)['model_affinity'];
    if (!block || typeof block !== 'object') return false;
    const enabled = (block as Record<string, unknown>)['enabled'];
    return enabled === true;
  } catch {
    return false;
  }
}
