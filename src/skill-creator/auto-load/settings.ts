/**
 * HB-07 AEL fast/slow bandit — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the AEL bandit
 * extension is opted in. Default at every field is FALSE: missing file,
 * malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.ael-bandit.enabled`.
 *
 * Pattern matches `src/skill-creator/roles/settings.ts` (HB-04 sister).
 *
 * @module skill-creator/auto-load/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface AelBanditConfigBlock {
  enabled: boolean;
}

export const DEFAULT_AEL_BANDIT_CONFIG: AelBanditConfigBlock = {
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
 * Read the AEL-bandit config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readAelBanditConfig(settingsPath?: string): AelBanditConfigBlock {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_AEL_BANDIT_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_AEL_BANDIT_CONFIG };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AEL_BANDIT_CONFIG };
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return { ...DEFAULT_AEL_BANDIT_CONFIG };
  const sweep = (outer as Record<string, unknown>)['cs25-26-sweep'];
  if (!sweep || typeof sweep !== 'object') return { ...DEFAULT_AEL_BANDIT_CONFIG };
  const block = (sweep as Record<string, unknown>)['ael-bandit'];
  if (!block || typeof block !== 'object') return { ...DEFAULT_AEL_BANDIT_CONFIG };
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

/**
 * Is the AEL bandit module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isAelBanditEnabled(settingsPath?: string): boolean {
  return readAelBanditConfig(settingsPath).enabled === true;
}
