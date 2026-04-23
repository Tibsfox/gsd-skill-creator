/**
 * M5 Agentic Orchestration — settings-flag reader.
 *
 * Wave 2 integration: the `gsd-skill-creator.orchestration.enabled` flag
 * controls whether the applicator routes through the M5 `ActivationSelector`
 * path (composing M1+M2+M6) instead of the legacy pipeline. Default OFF —
 * byte-identical v1.49.560 behaviour preserved (SC-FLAG-OFF).
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "orchestration": { "enabled": true }
 *   }
 * }
 * ```
 *
 * @module orchestration/settings
 */

import { readFileSync } from 'node:fs';

/**
 * Read the orchestration-enabled flag from settings.json. Returns `false`
 * on any read / parse error — the orchestration path must never activate
 * unless the operator has explicitly opted in.
 */
export function readOrchestrationEnabledFlag(
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
    const enabled = (orch as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}
