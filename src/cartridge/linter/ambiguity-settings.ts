/**
 * HB-06 Four-Type Ambiguity Linter — settings reader.
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the
 * ambiguity lint is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all
 * return disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.ambiguity-lint.enabled`.
 *
 * Pattern matches `src/cartridge/linter/settings.ts` (parallel HB-05)
 * and `src/safety/agentdog/settings.ts` (HB-02).
 *
 * @module cartridge/linter/ambiguity-settings
 */

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export interface AmbiguityLintConfig {
  enabled: boolean;
}

export const DEFAULT_AMBIGUITY_LINT_CONFIG: AmbiguityLintConfig = {
  enabled: false,
};

/**
 * Read the ambiguity-lint config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readAmbiguityLintConfig(
  settingsPath?: string,
): AmbiguityLintConfig {
  const block = readNested(
    ['cs25-26-sweep', 'ambiguity-lint'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_AMBIGUITY_LINT_CONFIG };
  }
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

/**
 * Is the ambiguity-lint module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isAmbiguityLintEnabled(settingsPath?: string): boolean {
  return readAmbiguityLintConfig(settingsPath).enabled === true;
}
