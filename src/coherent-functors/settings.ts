/**
 * Coherent Functors — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T1a Coherent
 * Functors primitive is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.coherent-functors.enabled`.
 *
 * No side effects. Pure function surface.
 *
 * @module coherent-functors/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface CoherentFunctorsConfig {
  enabled: boolean;
}

export const DEFAULT_COHERENT_FUNCTORS_CONFIG: CoherentFunctorsConfig = {
  enabled: false,
};

/**
 * Read the coherent-functors config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readCoherentFunctorsConfig(
  settingsPath?: string,
): CoherentFunctorsConfig {
  const block = readNested(
    ['mathematical-foundations', 'coherent-functors'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') return { ...DEFAULT_COHERENT_FUNCTORS_CONFIG };
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  return { enabled };
}

/**
 * Is the Coherent Functors primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isCoherentFunctorsEnabled(settingsPath?: string): boolean {
  return readCoherentFunctorsConfig(settingsPath).enabled === true;
}
