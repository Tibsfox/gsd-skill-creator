/**
 * HB-01 tool-attention — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the HB-01
 * tool-attention module is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Path: `gsd-skill-creator.cs25-26-sweep.tool-attention.enabled`.
 *
 * No side effects. Pure function surface.
 *
 * @module orchestration/tool-attention/settings
 */

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export type ToolAttentionModule = 'tool-attention';

export interface ToolAttentionConfig {
  enabled: boolean;
}

export const DEFAULT_TOOL_ATTENTION_CONFIG: ToolAttentionConfig = {
  enabled: false,
};

export function readToolAttentionConfig(
  settingsPath?: string,
): ToolAttentionConfig {
  const block = readNested(
    ['cs25-26-sweep', 'tool-attention'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

export function isToolAttentionEnabled(settingsPath?: string): boolean {
  return readToolAttentionConfig(settingsPath).enabled === true;
}
