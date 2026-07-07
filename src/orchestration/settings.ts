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

import { readBooleanFlag, harnessCandidatePaths } from '../settings/read-settings.js';

/**
 * Read the orchestration-enabled flag from settings.json. Returns `false`
 * on any read / parse error — the orchestration path must never activate
 * unless the operator has explicitly opted in.
 */
export function readOrchestrationEnabledFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  return readBooleanFlag(['orchestration', 'enabled'], harnessCandidatePaths(settingsPath));
}
