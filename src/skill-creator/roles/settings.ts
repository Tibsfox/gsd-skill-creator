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

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export interface WelerRolesConfig {
  enabled: boolean;
}

export const DEFAULT_WELER_ROLES_CONFIG: WelerRolesConfig = {
  enabled: false,
};

/**
 * Read the W/E/E roles config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readWelerRolesConfig(settingsPath?: string): WelerRolesConfig {
  const block = readNested(['cs25-26-sweep', 'weler-roles'], [dedicatedConfigPath(settingsPath)]);
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
