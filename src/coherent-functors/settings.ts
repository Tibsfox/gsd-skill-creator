/**
 * Coherent Functors — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T1a Coherent
 * Functors primitive is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.coherent-functors.enabled`.
 *
 * No side effects. Pure function surface.
 *
 * @module coherent-functors/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface CoherentFunctorsConfig {
  enabled: boolean;
}

export const DEFAULT_COHERENT_FUNCTORS_CONFIG: CoherentFunctorsConfig = {
  enabled: false,
};

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
 * Read the coherent-functors config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readCoherentFunctorsConfig(
  settingsPath?: string,
): CoherentFunctorsConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) return { ...DEFAULT_COHERENT_FUNCTORS_CONFIG };
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_COHERENT_FUNCTORS_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_COHERENT_FUNCTORS_CONFIG };
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  return { enabled };
}

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const math = (outer as Record<string, unknown>)['mathematical-foundations'];
  if (!math || typeof math !== 'object') return null;
  const block = (math as Record<string, unknown>)['coherent-functors'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Coherent Functors primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isCoherentFunctorsEnabled(settingsPath?: string): boolean {
  return readCoherentFunctorsConfig(settingsPath).enabled === true;
}
