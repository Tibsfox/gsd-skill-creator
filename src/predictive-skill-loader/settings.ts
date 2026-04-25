/**
 * Predictive Skill Loader — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether UIP-18 T2b
 * Predictive Skill Loader is opted in. Default at every field is FALSE.
 * Path: `gsd-skill-creator.upstream-intelligence.predictive-skill-loader`.
 *
 * Pattern matches `src/skilldex-auditor/settings.ts` per Phase 770 plan.
 *
 * @module predictive-skill-loader/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface PredictiveSkillLoaderConfig {
  enabled: boolean;
  /** Top-K predictions returned. Default 5. */
  topK: number;
  /** Multi-hop depth. Default 2. */
  hops: number;
  /** Per-hop decay (0,1]. Default 0.5. */
  decay: number;
}

export const DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG: PredictiveSkillLoaderConfig = {
  enabled: false,
  topK: 5,
  hops: 2,
  decay: 0.5,
};

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/**
 * Read the predictive-skill-loader config block, or defaults on any error.
 */
export function readPredictiveSkillLoaderConfig(
  settingsPath?: string,
): PredictiveSkillLoaderConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG };
  const enabled =
    typeof (block as Record<string, unknown>).enabled === 'boolean'
      ? ((block as Record<string, unknown>).enabled as boolean)
      : false;
  const topK = asNumber((block as Record<string, unknown>).topK, DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG.topK);
  const hops = asNumber((block as Record<string, unknown>).hops, DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG.hops);
  const decay = asNumber((block as Record<string, unknown>).decay, DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG.decay);
  return { enabled, topK, hops, decay };
}

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const upstream = (outer as Record<string, unknown>)['upstream-intelligence'];
  if (!upstream || typeof upstream !== 'object') return null;
  const block = (upstream as Record<string, unknown>)['predictive-skill-loader'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Predictive Skill Loader opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isPredictiveSkillLoaderEnabled(settingsPath?: string): boolean {
  return readPredictiveSkillLoaderConfig(settingsPath).enabled === true;
}
