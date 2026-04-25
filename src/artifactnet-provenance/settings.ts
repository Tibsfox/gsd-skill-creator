/**
 * ArtifactNet Provenance — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` at
 * `gsd-skill-creator.upstream-intelligence.artifactnet-provenance.enabled`
 * and returns whether UIP-20 T2d Provenance is opted in. Default is FALSE
 * on every error path (missing file, malformed JSON, missing block, missing
 * flag) — this is the Gate G13 fail-closed invariant.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/skilldex-auditor/settings.ts` per Phase 772 plan.
 *
 * @module artifactnet-provenance/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ArtifactNetProvenanceConfig {
  enabled: boolean;
}

export const DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG: ArtifactNetProvenanceConfig =
  {
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
 * Read the artifactnet-provenance config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readArtifactNetProvenanceConfig(
  settingsPath?: string,
): ArtifactNetProvenanceConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG };
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
  const block = (upstream as Record<string, unknown>)['artifactnet-provenance'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is ArtifactNet Provenance opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isArtifactNetProvenanceEnabled(settingsPath?: string): boolean {
  return readArtifactNetProvenanceConfig(settingsPath).enabled === true;
}
