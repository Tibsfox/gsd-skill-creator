/**
 * PromptCluster BatchEffect Detector — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-19 T2c
 * PromptCluster BatchEffect Detector is opted in.
 *
 * Config path: `gsd-skill-creator.upstream-intelligence.promptcluster-batcheffect`.
 *
 * Default at every field is FALSE: missing file, malformed JSON, missing
 * block, or missing flag all return disabled (fail-closed).
 *
 * No side effects beyond a single `fs.readFileSync` on the optional path.
 * Pattern matches `src/skilldex-auditor/settings.ts` and
 * `src/activation-steering/settings.ts`.
 *
 * @module promptcluster-batcheffect/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface PromptClusterBatchEffectConfig {
  enabled: boolean;
  /**
   * Significance level for the centroid-shift / Welch t-test.
   * Default: 0.05 (less conservative than SSIA's 0.01 because
   * batch effects tend to have larger effect sizes).
   */
  significanceLevel: number;
  /**
   * Number of random projection directions used to compute the mean
   * per-direction Welch t-statistic. More directions → more robust
   * estimate; default 8 is sufficient for K < 1024.
   */
  numProjectionDirections: number;
  /**
   * Optional PRNG seed for deterministic projection-direction sampling.
   * Unset in production (fresh randomness); set in CI (deterministic).
   */
  seed?: number;
}

export const DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG: PromptClusterBatchEffectConfig =
  {
    enabled: false,
    significanceLevel: 0.05,
    numProjectionDirections: 8,
  };

/**
 * Read the promptcluster-batcheffect config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readPromptClusterBatchEffectConfig(
  settingsPath?: string,
): PromptClusterBatchEffectConfig {
  const block = readNested(
    ['upstream-intelligence', 'promptcluster-batcheffect'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG };
  }

  const rec = block as Record<string, unknown>;
  const out: PromptClusterBatchEffectConfig = {
    ...DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG,
  };
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (
    typeof rec.significanceLevel === 'number' &&
    Number.isFinite(rec.significanceLevel) &&
    rec.significanceLevel > 0 &&
    rec.significanceLevel < 1
  ) {
    out.significanceLevel = rec.significanceLevel;
  }
  if (
    typeof rec.numProjectionDirections === 'number' &&
    Number.isInteger(rec.numProjectionDirections) &&
    (rec.numProjectionDirections as number) >= 1
  ) {
    out.numProjectionDirections = rec.numProjectionDirections as number;
  }
  if (typeof rec.seed === 'number' && Number.isInteger(rec.seed)) {
    out.seed = rec.seed as number;
  }
  return out;
}

/**
 * Is the PromptCluster BatchEffect Detector opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isPromptClusterBatchEffectEnabled(
  settingsPath?: string,
): boolean {
  return readPromptClusterBatchEffectConfig(settingsPath).enabled === true;
}
