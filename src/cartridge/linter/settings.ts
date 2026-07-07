/**
 * HB-05 Five-Principle Structural-Completeness Linter — settings reader.
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the
 * structural-completeness lint is opted in. Default at every field is
 * FALSE: missing file, malformed JSON, missing block, or missing flag
 * all return disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.structural-completeness-lint.enabled`.
 *
 * Pattern matches `src/safety/agentdog/settings.ts` (parallel HB-02).
 *
 * @module cartridge/linter/settings
 */

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export interface StructuralCompletenessConfig {
  enabled: boolean;
}

export const DEFAULT_STRUCTURAL_COMPLETENESS_CONFIG: StructuralCompletenessConfig = {
  enabled: false,
};

/**
 * Read the structural-completeness lint config block, or defaults on
 * any error (missing file / malformed JSON / missing block / wrong shape).
 */
export function readStructuralCompletenessConfig(
  settingsPath?: string,
): StructuralCompletenessConfig {
  const block = readNested(
    ['cs25-26-sweep', 'structural-completeness-lint'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_STRUCTURAL_COMPLETENESS_CONFIG };
  }
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

/**
 * Is the structural-completeness lint module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isStructuralCompletenessEnabled(settingsPath?: string): boolean {
  return readStructuralCompletenessConfig(settingsPath).enabled === true;
}
