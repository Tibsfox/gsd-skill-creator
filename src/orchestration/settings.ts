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
    const raw = readFileSync(settingsPath, 'utf8');
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
