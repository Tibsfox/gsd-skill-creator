/**
 * Hourglass-Persistence Audit — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T2b
 * Hourglass-Persistence Audit primitive is opted in. Default at every field is
 * FALSE: missing file, malformed JSON, missing block, or missing flag all
 * return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.hourglass-persistence`.
 *
 * No side effects. Pure function surface.
 *
 * @module hourglass-persistence/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface HourglassPersistenceConfig {
  enabled: boolean;
  waistThreshold?: number;
  strongWaistThreshold?: number;
  verbose?: boolean;
}

export const DEFAULT_HOURGLASS_PERSISTENCE_CONFIG: HourglassPersistenceConfig = {
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
 * Read the hourglass-persistence config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readHourglassPersistenceConfig(
  settingsPath?: string,
): HourglassPersistenceConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_HOURGLASS_PERSISTENCE_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_HOURGLASS_PERSISTENCE_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_HOURGLASS_PERSISTENCE_CONFIG };

  const out: HourglassPersistenceConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (typeof rec.waistThreshold === 'number' && Number.isFinite(rec.waistThreshold)) {
    out.waistThreshold = rec.waistThreshold;
  }
  if (
    typeof rec.strongWaistThreshold === 'number' &&
    Number.isFinite(rec.strongWaistThreshold)
  ) {
    out.strongWaistThreshold = rec.strongWaistThreshold;
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
  const block = (math as Record<string, unknown>)['hourglass-persistence'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Hourglass-Persistence Audit primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isHourglassPersistenceEnabled(settingsPath?: string): boolean {
  return readHourglassPersistenceConfig(settingsPath).enabled === true;
}
