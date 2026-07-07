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

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface ArtifactNetProvenanceConfig {
  enabled: boolean;
}

export const DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG: ArtifactNetProvenanceConfig =
  {
    enabled: false,
  };

/**
 * Read the artifactnet-provenance config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readArtifactNetProvenanceConfig(
  settingsPath?: string,
): ArtifactNetProvenanceConfig {
  const block = readNested(
    ['upstream-intelligence', 'artifactnet-provenance'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG };
  }
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  return { enabled };
}

/**
 * Is ArtifactNet Provenance opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isArtifactNetProvenanceEnabled(settingsPath?: string): boolean {
  return readArtifactNetProvenanceConfig(settingsPath).enabled === true;
}
