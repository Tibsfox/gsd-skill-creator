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

import fs from 'node:fs';
import path from 'node:path';

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

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

/**
 * Read the koopman-memory config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readKoopmanMemoryConfig(
  settingsPath?: string,
): KoopmanMemoryConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_KOOPMAN_MEMORY_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_KOOPMAN_MEMORY_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_KOOPMAN_MEMORY_CONFIG };

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

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const math = (outer as Record<string, unknown>)['mathematical-foundations'];
  if (!math || typeof math !== 'object') return null;
  const block = (math as Record<string, unknown>)['koopman-memory'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Koopman-Memory primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isKoopmanMemoryEnabled(settingsPath?: string): boolean {
  return readKoopmanMemoryConfig(settingsPath).enabled === true;
}
