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

import fs from 'node:fs';
import path from 'node:path';

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

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

/**
 * Read the promptcluster-batcheffect config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readPromptClusterBatchEffectConfig(
  settingsPath?: string,
): PromptClusterBatchEffectConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG };

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

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const upstream = (outer as Record<string, unknown>)['upstream-intelligence'];
  if (!upstream || typeof upstream !== 'object') return null;
  const block = (upstream as Record<string, unknown>)[
    'promptcluster-batcheffect'
  ];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
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
