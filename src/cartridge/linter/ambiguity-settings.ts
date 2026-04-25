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

import fs from 'node:fs';
import path from 'node:path';

export interface AmbiguityLintConfig {
  enabled: boolean;
}

export const DEFAULT_AMBIGUITY_LINT_CONFIG: AmbiguityLintConfig = {
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
 * Read the ambiguity-lint config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readAmbiguityLintConfig(
  settingsPath?: string,
): AmbiguityLintConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_AMBIGUITY_LINT_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_AMBIGUITY_LINT_CONFIG };
  }
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AMBIGUITY_LINT_CONFIG };
  }
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') {
    return { ...DEFAULT_AMBIGUITY_LINT_CONFIG };
  }
  const sweep = (outer as Record<string, unknown>)['cs25-26-sweep'];
  if (!sweep || typeof sweep !== 'object') {
    return { ...DEFAULT_AMBIGUITY_LINT_CONFIG };
  }
  const block = (sweep as Record<string, unknown>)['ambiguity-lint'];
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
