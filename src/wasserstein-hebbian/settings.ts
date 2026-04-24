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

import fs from 'node:fs';
import path from 'node:path';

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

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

/**
 * Read the wasserstein-hebbian config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readWassersteinHebbianConfig(
  settingsPath?: string,
): WassersteinHebbianConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_WASSERSTEIN_HEBBIAN_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_WASSERSTEIN_HEBBIAN_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_WASSERSTEIN_HEBBIAN_CONFIG };

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

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const math = (outer as Record<string, unknown>)['mathematical-foundations'];
  if (!math || typeof math !== 'object') return null;
  const block = (math as Record<string, unknown>)['wasserstein-hebbian'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Wasserstein-Hebbian adapter-stack audit primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isWassersteinHebbianEnabled(settingsPath?: string): boolean {
  return readWassersteinHebbianConfig(settingsPath).enabled === true;
}
