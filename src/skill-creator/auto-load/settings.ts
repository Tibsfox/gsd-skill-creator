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

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export interface AelBanditConfigBlock {
  enabled: boolean;
}

export const DEFAULT_AEL_BANDIT_CONFIG: AelBanditConfigBlock = {
  enabled: false,
};

/**
 * Read the AEL-bandit config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readAelBanditConfig(settingsPath?: string): AelBanditConfigBlock {
  const block = readNested(['cs25-26-sweep', 'ael-bandit'], [dedicatedConfigPath(settingsPath)]);
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
