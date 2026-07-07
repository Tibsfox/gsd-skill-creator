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

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export type AgentDogModule = 'agentdog-schema';

export interface AgentDogConfig {
  enabled: boolean;
}

export const DEFAULT_AGENTDOG_CONFIG: AgentDogConfig = {
  enabled: false,
};

/**
 * Read the AgentDoG config block, or defaults on any error
 * (missing file / malformed JSON / missing block / wrong shape).
 */
export function readAgentDogConfig(settingsPath?: string): AgentDogConfig {
  const block = readNested(
    ['cs25-26-sweep', 'agentdog-schema'],
    [dedicatedConfigPath(settingsPath)],
  );
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
