/**
 * Experience Compression — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-17 T2a
 * Experience Compression Layer is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Config path:
 *   `gsd-skill-creator.upstream-intelligence.experience-compression.enabled`
 *
 * When the flag is false (or unreadable), `compress` and `classifyLevel` return
 * byte-identical passthrough results (`{ disabled: true }`), preserving the
 * pre-769 baseline.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/fl-threat-model/settings.ts` per Phase 769 plan.
 *
 * @module experience-compression/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface ExperienceCompressionConfig {
  enabled: boolean;
}

export const DEFAULT_EXPERIENCE_COMPRESSION_CONFIG: ExperienceCompressionConfig = {
  enabled: false,
};

/**
 * Read the experience-compression config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readExperienceCompressionConfig(
  settingsPath?: string,
): ExperienceCompressionConfig {
  const block = readNested(
    ['upstream-intelligence', 'experience-compression'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_EXPERIENCE_COMPRESSION_CONFIG };
  }
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  return { enabled };
}

/**
 * Is the Experience Compression Layer opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isExperienceCompressionEnabled(settingsPath?: string): boolean {
  return readExperienceCompressionConfig(settingsPath).enabled === true;
}
