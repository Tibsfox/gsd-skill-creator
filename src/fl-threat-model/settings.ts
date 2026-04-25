/**
 * FL Threat-Model Gate — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-16 T1d
 * FL Threat-Model Gate is opted in. Default at every field is FALSE: missing
 * file, malformed JSON, missing block, or missing flag all return disabled.
 *
 * Config path: `gsd-skill-creator.upstream-intelligence.fl-threat-model.enabled`
 *
 * When the flag is false (or unreadable), `gatePreRollout` returns
 * `{ verdict: 'gate-disabled', blocks: [], messages: [] }` — a zero-side-effect
 * passthrough that is byte-identical with the pre-768 tip baseline.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/skilldex-auditor/settings.ts` per Phase 765 plan.
 *
 * @module fl-threat-model/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface FlThreatModelConfig {
  enabled: boolean;
}

export const DEFAULT_FL_THREAT_MODEL_CONFIG: FlThreatModelConfig = {
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
 * Read the fl-threat-model config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readFlThreatModelConfig(
  settingsPath?: string,
): FlThreatModelConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_FL_THREAT_MODEL_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_FL_THREAT_MODEL_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_FL_THREAT_MODEL_CONFIG };
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
  const block = (upstream as Record<string, unknown>)['fl-threat-model'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the FL Threat-Model Gate opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isFlThreatModelEnabled(settingsPath?: string): boolean {
  return readFlThreatModelConfig(settingsPath).enabled === true;
}
