/**
 * Hourglass-Persistence Audit — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T2b
 * Hourglass-Persistence Audit primitive is opted in. Default at every field is
 * FALSE: missing file, malformed JSON, missing block, or missing flag all
 * return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.hourglass-persistence`.
 *
 * No side effects. Pure function surface.
 *
 * @module hourglass-persistence/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface HourglassPersistenceConfig {
  enabled: boolean;
  waistThreshold?: number;
  strongWaistThreshold?: number;
  verbose?: boolean;
}

export const DEFAULT_HOURGLASS_PERSISTENCE_CONFIG: HourglassPersistenceConfig = {
  enabled: false,
};

/**
 * Read the hourglass-persistence config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readHourglassPersistenceConfig(
  settingsPath?: string,
): HourglassPersistenceConfig {
  const block = readNested(
    ['mathematical-foundations', 'hourglass-persistence'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_HOURGLASS_PERSISTENCE_CONFIG };
  }
  const rec = block as Record<string, unknown>;

  const out: HourglassPersistenceConfig = { enabled: false };
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (typeof rec.waistThreshold === 'number' && Number.isFinite(rec.waistThreshold)) {
    out.waistThreshold = rec.waistThreshold;
  }
  if (
    typeof rec.strongWaistThreshold === 'number' &&
    Number.isFinite(rec.strongWaistThreshold)
  ) {
    out.strongWaistThreshold = rec.strongWaistThreshold;
  }
  if (typeof rec.verbose === 'boolean') out.verbose = rec.verbose;
  return out;
}

/**
 * Is the Hourglass-Persistence Audit primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isHourglassPersistenceEnabled(settingsPath?: string): boolean {
  return readHourglassPersistenceConfig(settingsPath).enabled === true;
}
