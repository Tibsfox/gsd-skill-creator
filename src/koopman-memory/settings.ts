/**
 * Koopman-Memory — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T2a
 * Koopman-Memory primitive is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.koopman-memory`.
 *
 * No side effects. Pure function surface.
 *
 * @module koopman-memory/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface KoopmanMemoryConfig {
  enabled: boolean;
  stateDim?: number;
  verbose?: boolean;
}

export const DEFAULT_KOOPMAN_MEMORY_CONFIG: KoopmanMemoryConfig = {
  enabled: false,
};

/** Boundary default state dimension when caller omits it. */
export const DEFAULT_STATE_DIM = 8;

/**
 * Read the koopman-memory config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readKoopmanMemoryConfig(
  settingsPath?: string,
): KoopmanMemoryConfig {
  const block = readNested(
    ['mathematical-foundations', 'koopman-memory'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_KOOPMAN_MEMORY_CONFIG };
  }

  const out: KoopmanMemoryConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (
    typeof rec.stateDim === 'number' &&
    Number.isFinite(rec.stateDim) &&
    rec.stateDim > 0 &&
    Number.isInteger(rec.stateDim)
  ) {
    out.stateDim = rec.stateDim;
  }
  if (typeof rec.verbose === 'boolean') out.verbose = rec.verbose;
  return out;
}

/**
 * Is the Koopman-Memory primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isKoopmanMemoryEnabled(settingsPath?: string): boolean {
  return readKoopmanMemoryConfig(settingsPath).enabled === true;
}
