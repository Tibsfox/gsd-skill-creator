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

import fs from 'node:fs';
import path from 'node:path';

export interface StdCalibrationConfig {
  enabled: boolean;
}

export const DEFAULT_STD_CALIBRATION_CONFIG: StdCalibrationConfig = {
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
 * Read the STD-calibration config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readStdCalibrationConfig(
  settingsPath?: string,
): StdCalibrationConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_STD_CALIBRATION_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_STD_CALIBRATION_CONFIG };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STD_CALIBRATION_CONFIG };
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return { ...DEFAULT_STD_CALIBRATION_CONFIG };
  const sweep = (outer as Record<string, unknown>)['cs25-26-sweep'];
  if (!sweep || typeof sweep !== 'object') return { ...DEFAULT_STD_CALIBRATION_CONFIG };
  const block = (sweep as Record<string, unknown>)['std-calibration'];
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
