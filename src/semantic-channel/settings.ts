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

import fs from 'node:fs';
import path from 'node:path';

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

function projectRoot(): string {
  // Tests may override via env var for deterministic reads.
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

/**
 * Read the semantic-channel config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readSemanticChannelConfig(
  settingsPath?: string,
): SemanticChannelConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_SEMANTIC_CHANNEL_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_SEMANTIC_CHANNEL_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_SEMANTIC_CHANNEL_CONFIG };

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

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const math = (outer as Record<string, unknown>)['mathematical-foundations'];
  if (!math || typeof math !== 'object') return null;
  const block = (math as Record<string, unknown>)['semantic-channel'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Semantic Channel primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isSemanticChannelEnabled(settingsPath?: string): boolean {
  return readSemanticChannelConfig(settingsPath).enabled === true;
}
