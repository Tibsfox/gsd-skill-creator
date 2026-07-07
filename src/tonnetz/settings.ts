/**
 * Tonnetz — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T3 Tonnetz
 * primitive is opted in. Default at every field is FALSE: missing file,
 * malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.tonnetz`.
 *
 * No side effects. Pure function surface.
 *
 * @module tonnetz/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface TonnetzConfig {
  enabled: boolean;
  verbose?: boolean;
}

export const DEFAULT_TONNETZ_CONFIG: TonnetzConfig = {
  enabled: false,
};

/**
 * Read the tonnetz config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readTonnetzConfig(settingsPath?: string): TonnetzConfig {
  const block = readNested(
    ['mathematical-foundations', 'tonnetz'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') return { ...DEFAULT_TONNETZ_CONFIG };

  const out: TonnetzConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (typeof rec.verbose === 'boolean') out.verbose = rec.verbose;
  return out;
}

/**
 * Is the Tonnetz primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isTonnetzEnabled(settingsPath?: string): boolean {
  return readTonnetzConfig(settingsPath).enabled === true;
}
