/**
 * Heuristics-Free Skill Space — settings reader.
 *
 * Reads `.claude/gsd-skill-creator.json` and exposes per-module opt-in state
 * for the Half B modules. Pure function: no side effects.
 *
 * Default at every flag is FALSE. The config file must explicitly opt-in any
 * module. Missing file, missing block, or missing flag → false.
 *
 * @module heuristics-free-skill-space/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export type HeuristicsFreeModule =
  | 'skill_isotropy_audit'
  | 'sigreg'
  | 'mission_world_model';

export interface HeuristicsFreeSkillSpaceConfig {
  skill_isotropy_audit: { enabled: boolean };
  sigreg: { enabled: boolean };
  mission_world_model: {
    enabled: boolean;
    latentDim: number;
    cemSamples: number;
    cemIterations: number;
    planningHorizon: number;
  };
}

const DEFAULTS: HeuristicsFreeSkillSpaceConfig = {
  skill_isotropy_audit: { enabled: false },
  sigreg: { enabled: false },
  mission_world_model: {
    enabled: false,
    latentDim: 128,
    cemSamples: 64,
    cemIterations: 3,
    planningHorizon: 3,
  },
};

function projectRoot(): string {
  // Tests can override via env var for deterministic reads.
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

export function readHeuristicsFreeConfig(): HeuristicsFreeSkillSpaceConfig {
  const configPath = path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
  if (!fs.existsSync(configPath)) return DEFAULTS;
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return DEFAULTS;
  }
  const block = extractBlock(raw);
  if (!block) return DEFAULTS;
  return {
    skill_isotropy_audit: {
      enabled: Boolean(block.skill_isotropy_audit?.enabled ?? false),
    },
    sigreg: {
      enabled: Boolean(block.sigreg?.enabled ?? false),
    },
    mission_world_model: {
      enabled: Boolean(block.mission_world_model?.enabled ?? false),
      latentDim: Number(block.mission_world_model?.latentDim ?? DEFAULTS.mission_world_model.latentDim),
      cemSamples: Number(block.mission_world_model?.cemSamples ?? DEFAULTS.mission_world_model.cemSamples),
      cemIterations: Number(
        block.mission_world_model?.cemIterations ?? DEFAULTS.mission_world_model.cemIterations,
      ),
      planningHorizon: Number(
        block.mission_world_model?.planningHorizon ?? DEFAULTS.mission_world_model.planningHorizon,
      ),
    },
  };
}

function extractBlock(raw: unknown): any | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return undefined;
  const block = (outer as Record<string, unknown>)['heuristics-free-skill-space'];
  if (!block || typeof block !== 'object') return undefined;
  return block;
}

export function isModuleEnabled(name: HeuristicsFreeModule): boolean {
  const cfg = readHeuristicsFreeConfig();
  return cfg[name].enabled;
}
