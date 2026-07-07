/**
 * Wasserstein-Hebbian adapter — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T2c
 * Wasserstein-Hebbian adapter-stack audit primitive is opted in. Default at
 * every field is FALSE: missing file, malformed JSON, missing block, or
 * missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.wasserstein-hebbian`.
 *
 * No side effects. Pure function surface.
 *
 * @module wasserstein-hebbian/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface WassersteinHebbianConfig {
  enabled: boolean;
  /** Upper bound on σ accepted by `checkBoundedVariance`. Optional. */
  varianceThreshold?: number;
  /** Verbose-audit hint for downstream emitters. Optional. */
  verbose?: boolean;
}

export const DEFAULT_WASSERSTEIN_HEBBIAN_CONFIG: WassersteinHebbianConfig = {
  enabled: false,
};

/**
 * Read the wasserstein-hebbian config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readWassersteinHebbianConfig(
  settingsPath?: string,
): WassersteinHebbianConfig {
  const block = readNested(
    ['mathematical-foundations', 'wasserstein-hebbian'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_WASSERSTEIN_HEBBIAN_CONFIG };
  }

  const out: WassersteinHebbianConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (
    typeof rec.varianceThreshold === 'number' &&
    Number.isFinite(rec.varianceThreshold)
  ) {
    out.varianceThreshold = rec.varianceThreshold;
  }
  if (typeof rec.verbose === 'boolean') out.verbose = rec.verbose;
  return out;
}

/**
 * Is the Wasserstein-Hebbian adapter-stack audit primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isWassersteinHebbianEnabled(settingsPath?: string): boolean {
  return readWassersteinHebbianConfig(settingsPath).enabled === true;
}
