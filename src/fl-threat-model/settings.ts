/**
 * FL Threat-Model Gate — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-16 T1d
 * FL Threat-Model Gate is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Config path: `gsd-skill-creator.upstream-intelligence.fl-threat-model.enabled`
 *
 * When the flag is false (or unreadable), `gatePreRollout` returns
 * `{ verdict: 'gate-disabled', blocks: [], messages: [] }` — a zero-side-effect
 * passthrough that is byte-identical with the pre-768 tip baseline.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/skilldex-auditor/settings.ts` per Phase 765 plan.
 *
 * @module fl-threat-model/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface FlThreatModelConfig {
  enabled: boolean;
}

export const DEFAULT_FL_THREAT_MODEL_CONFIG: FlThreatModelConfig = {
  enabled: false,
};

/**
 * Read the fl-threat-model config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readFlThreatModelConfig(
  settingsPath?: string,
): FlThreatModelConfig {
  const BLOCK_KEYPATH = ['upstream-intelligence', 'fl-threat-model'];
  const block = readNested(BLOCK_KEYPATH, [dedicatedConfigPath(settingsPath)]);
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_FL_THREAT_MODEL_CONFIG };
  }
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  return { enabled };
}

/**
 * Is the FL Threat-Model Gate opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isFlThreatModelEnabled(settingsPath?: string): boolean {
  return readFlThreatModelConfig(settingsPath).enabled === true;
}
