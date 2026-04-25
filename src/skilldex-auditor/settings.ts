/**
 * Skilldex Auditor — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-13 T1a
 * Skilldex Auditor is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.upstream-intelligence.skilldex-auditor.enabled`.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/coherent-functors/settings.ts` per Phase 765 plan.
 *
 * @module skilldex-auditor/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface SkilldexAuditorConfig {
  enabled: boolean;
}

export const DEFAULT_SKILLDEX_AUDITOR_CONFIG: SkilldexAuditorConfig = {
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
 * Read the skilldex-auditor config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readSkilldexAuditorConfig(
  settingsPath?: string,
): SkilldexAuditorConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_SKILLDEX_AUDITOR_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_SKILLDEX_AUDITOR_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_SKILLDEX_AUDITOR_CONFIG };
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
  const upstream = (outer as Record<string, unknown>)['upstream-intelligence'];
  if (!upstream || typeof upstream !== 'object') return null;
  const block = (upstream as Record<string, unknown>)['skilldex-auditor'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Skilldex Auditor opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isSkilldexAuditorEnabled(settingsPath?: string): boolean {
  return readSkilldexAuditorConfig(settingsPath).enabled === true;
}
