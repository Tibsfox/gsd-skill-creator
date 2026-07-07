/**
 * Semantic Channel DACP formalism — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T1c
 * Semantic Channel primitive is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.semantic-channel`.
 *
 * No side effects. Pure function surface.
 *
 * @module semantic-channel/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface SemanticChannelConfig {
  enabled: boolean;
  driftThreshold?: number;
  verbose?: boolean;
}

export const DEFAULT_SEMANTIC_CHANNEL_CONFIG: SemanticChannelConfig = {
  enabled: false,
};

/** Drift-checker default threshold — fraction of bits-changed per component. */
export const DEFAULT_DRIFT_THRESHOLD = 0.25;

/**
 * Read the semantic-channel config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readSemanticChannelConfig(
  settingsPath?: string,
): SemanticChannelConfig {
  const block = readNested(
    ['mathematical-foundations', 'semantic-channel'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_SEMANTIC_CHANNEL_CONFIG };
  }

  const out: SemanticChannelConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (
    typeof rec.driftThreshold === 'number' &&
    Number.isFinite(rec.driftThreshold) &&
    rec.driftThreshold >= 0 &&
    rec.driftThreshold <= 1
  ) {
    out.driftThreshold = rec.driftThreshold;
  }
  if (typeof rec.verbose === 'boolean') out.verbose = rec.verbose;
  return out;
}

/**
 * Is the Semantic Channel primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isSemanticChannelEnabled(settingsPath?: string): boolean {
  return readSemanticChannelConfig(settingsPath).enabled === true;
}
