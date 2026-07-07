/**
 * Skilldex Auditor — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-13 T1a
 * Skilldex Auditor is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.upstream-intelligence.skilldex-auditor.enabled`.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/coherent-functors/settings.ts` per Phase 765 plan.
 *
 * @module skilldex-auditor/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface SkilldexAuditorConfig {
  enabled: boolean;
}

export const DEFAULT_SKILLDEX_AUDITOR_CONFIG: SkilldexAuditorConfig = {
  enabled: false,
};

/**
 * Read the skilldex-auditor config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readSkilldexAuditorConfig(
  settingsPath?: string,
): SkilldexAuditorConfig {
  const block = readNested(
    ['upstream-intelligence', 'skilldex-auditor'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_SKILLDEX_AUDITOR_CONFIG };
  }
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  return { enabled };
}

/**
 * Is the Skilldex Auditor opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isSkilldexAuditorEnabled(settingsPath?: string): boolean {
  return readSkilldexAuditorConfig(settingsPath).enabled === true;
}
