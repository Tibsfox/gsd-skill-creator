/**
 * HB-04 W/E/E roles — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the HB-04
 * role-split module is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.weler-roles.enabled`.
 *
 * Pattern matches `src/safety/std-calibration/settings.ts` (parallel HB-03).
 *
 * @module skill-creator/roles/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface WelerRolesConfig {
  enabled: boolean;
}

export const DEFAULT_WELER_ROLES_CONFIG: WelerRolesConfig = {
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
 * Read the W/E/E roles config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readWelerRolesConfig(settingsPath?: string): WelerRolesConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_WELER_ROLES_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_WELER_ROLES_CONFIG };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_WELER_ROLES_CONFIG };
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return { ...DEFAULT_WELER_ROLES_CONFIG };
  const sweep = (outer as Record<string, unknown>)['cs25-26-sweep'];
  if (!sweep || typeof sweep !== 'object') return { ...DEFAULT_WELER_ROLES_CONFIG };
  const block = (sweep as Record<string, unknown>)['weler-roles'];
  if (!block || typeof block !== 'object') return { ...DEFAULT_WELER_ROLES_CONFIG };
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

/**
 * Is the W/E/E roles module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isWelerRolesEnabled(settingsPath?: string): boolean {
  return readWelerRolesConfig(settingsPath).enabled === true;
}
