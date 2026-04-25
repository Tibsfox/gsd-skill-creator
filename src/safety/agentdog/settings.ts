/**
 * HB-02 agentdog-schema — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the HB-02
 * AgentDoG where/how/what BLOCK schema is opted in. Default at every field
 * is FALSE: missing file, malformed JSON, missing block, or missing flag
 * all return disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.agentdog-schema.enabled`.
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/orchestration/tool-attention/settings.ts` (parallel HB-01).
 *
 * @module safety/agentdog/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export type AgentDogModule = 'agentdog-schema';

export interface AgentDogConfig {
  enabled: boolean;
}

export const DEFAULT_AGENTDOG_CONFIG: AgentDogConfig = {
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
 * Read the AgentDoG config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readAgentDogConfig(settingsPath?: string): AgentDogConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_AGENTDOG_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_AGENTDOG_CONFIG };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AGENTDOG_CONFIG };
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return { ...DEFAULT_AGENTDOG_CONFIG };
  const sweep = (outer as Record<string, unknown>)['cs25-26-sweep'];
  if (!sweep || typeof sweep !== 'object') return { ...DEFAULT_AGENTDOG_CONFIG };
  const block = (sweep as Record<string, unknown>)['agentdog-schema'];
  if (!block || typeof block !== 'object') return { ...DEFAULT_AGENTDOG_CONFIG };
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

/**
 * Is the AgentDoG schema module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isAgentDogEnabled(settingsPath?: string): boolean {
  return readAgentDogConfig(settingsPath).enabled === true;
}
