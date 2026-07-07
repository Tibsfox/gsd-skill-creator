/**
 * HB-03 std-calibration — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the HB-03
 * STD calibration module is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.std-calibration.enabled`.
 *
 * Pattern matches `src/safety/agentdog/settings.ts` (parallel HB-02).
 *
 * @module safety/std-calibration/settings
 */

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export interface StdCalibrationConfig {
  enabled: boolean;
}

export const DEFAULT_STD_CALIBRATION_CONFIG: StdCalibrationConfig = {
  enabled: false,
};

/**
 * Read the STD-calibration config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readStdCalibrationConfig(
  settingsPath?: string,
): StdCalibrationConfig {
  const block = readNested(['cs25-26-sweep', 'std-calibration'], [dedicatedConfigPath(settingsPath)]);
  if (!block || typeof block !== 'object') return { ...DEFAULT_STD_CALIBRATION_CONFIG };
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

/**
 * Is the STD-calibration module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isStdCalibrationEnabled(settingsPath?: string): boolean {
  return readStdCalibrationConfig(settingsPath).enabled === true;
}
