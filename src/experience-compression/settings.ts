/**
 * Experience Compression — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-17 T2a
 * Experience Compression Layer is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Config path:
 *   `gsd-skill-creator.upstream-intelligence.experience-compression.enabled`
 *
 * When the flag is false (or unreadable), `compress` and `classifyLevel` return
 * byte-identical passthrough results (`{ disabled: true }`), preserving the
 * pre-769 baseline.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/fl-threat-model/settings.ts` per Phase 769 plan.
 *
 * @module experience-compression/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ExperienceCompressionConfig {
  enabled: boolean;
}

export const DEFAULT_EXPERIENCE_COMPRESSION_CONFIG: ExperienceCompressionConfig = {
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
 * Read the experience-compression config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readExperienceCompressionConfig(
  settingsPath?: string,
): ExperienceCompressionConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_EXPERIENCE_COMPRESSION_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_EXPERIENCE_COMPRESSION_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_EXPERIENCE_COMPRESSION_CONFIG };
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
  const block = (upstream as Record<string, unknown>)['experience-compression'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Experience Compression Layer opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isExperienceCompressionEnabled(settingsPath?: string): boolean {
  return readExperienceCompressionConfig(settingsPath).enabled === true;
}
