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

import fs from 'node:fs';
import path from 'node:path';

export type ToolAttentionModule = 'tool-attention';

export interface ToolAttentionConfig {
  enabled: boolean;
}

export const DEFAULT_TOOL_ATTENTION_CONFIG: ToolAttentionConfig = {
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

export function readToolAttentionConfig(
  settingsPath?: string,
): ToolAttentionConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  const sweep = (outer as Record<string, unknown>)['cs25-26-sweep'];
  if (!sweep || typeof sweep !== 'object') return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  const block = (sweep as Record<string, unknown>)['tool-attention'];
  if (!block || typeof block !== 'object') return { ...DEFAULT_TOOL_ATTENTION_CONFIG };
  const candidate = (block as { enabled?: unknown }).enabled;
  const enabled = typeof candidate === 'boolean' ? candidate : false;
  return { enabled };
}

export function isToolAttentionEnabled(settingsPath?: string): boolean {
  return readToolAttentionConfig(settingsPath).enabled === true;
}
