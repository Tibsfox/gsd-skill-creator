/**
 * Companion-file generator for department cartridges.
 *
 * Reads a cartridge from disk, finds every skill / agent / team, and writes
 * a stub markdown file under `skills/`, `agents/`, `teams/` for every
 * entry that does not already have one. Existing files are never
 * overwritten — the generator is additive only.
 *
 * This closes the forge-loop gap where a human (or another agent) had to
 * hand-write 20+ companion markdown files after a department scaffold.
 * Stubs are intentionally tight: one paragraph per entity, pulled from
 * the chipset `description:` / `role:` fields. Hand-authoring is still
 * expected for the entries that need richer prose — but the generator
 * removes the mechanical step.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { loadCartridge } from './loader.js';
import { findChipsets } from './types.js';

export interface ScaffoldCompanionsOptions {
  /** Path to `cartridge.yaml` (or its directory). */
  path: string;
  /** If true, overwrite existing files. Default: false (skip existing). */
  overwrite?: boolean;
}

export interface ScaffoldCompanionsResult {
  cartridgeId: string;
  filesWritten: string[];
  filesSkipped: string[];
}

export function scaffoldCompanions(
  options: ScaffoldCompanionsOptions,
): ScaffoldCompanionsResult {
  const { path: inputPath, overwrite = false } = options;
  const cartridge = loadCartridge(inputPath);
  const cartridgeDir = resolve(cartridgeDirFrom(inputPath));

  const filesWritten: string[] = [];
  const filesSkipped: string[] = [];

  for (const dept of findChipsets(cartridge, 'department')) {
    for (const [key, skill] of Object.entries(dept.skills)) {
      const rel = `skills/${key}.md`;
      writeIfAbsent(
        cartridgeDir,
        rel,
        renderSkillStub(key, skill),
        overwrite,
        filesWritten,
        filesSkipped,
      );
    }
    for (const agent of dept.agents.agents) {
      const rel = `agents/${agent.name}.md`;
      writeIfAbsent(
        cartridgeDir,
        rel,
        renderAgentStub(agent),
        overwrite,
        filesWritten,
        filesSkipped,
      );
    }
    for (const [key, team] of Object.entries(dept.teams ?? {})) {
      const rel = `teams/${key}.md`;
      writeIfAbsent(
        cartridgeDir,
        rel,
        renderTeamStub(key, team),
        overwrite,
        filesWritten,
        filesSkipped,
      );
    }
  }

  return {
    cartridgeId: cartridge.id,
    filesWritten,
    filesSkipped,
  };
}

function cartridgeDirFrom(input: string): string {
  // `input` may be either the cartridge.yaml path or its enclosing dir.
  if (input.endsWith('.yaml') || input.endsWith('.yml')) {
    return dirname(input);
  }
  return input;
}

function writeIfAbsent(
  root: string,
  relPath: string,
  content: string,
  overwrite: boolean,
  written: string[],
  skipped: string[],
): void {
  const abs = join(root, relPath);
  if (existsSync(abs) && !overwrite) {
    skipped.push(relPath);
    return;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf8');
  written.push(relPath);
}

function renderSkillStub(
  key: string,
  skill: { description: string; triggers?: string[]; agent_affinity?: string | string[] },
): string {
  const triggersLine =
    skill.triggers && skill.triggers.length > 0
      ? `\n**Triggers:** ${skill.triggers.map((t) => `\`${t}\``).join(', ')}\n`
      : '';
  const affinity = skill.agent_affinity;
  const affinityLine = affinity
    ? `\n**Affinity:** ${(Array.isArray(affinity) ? affinity : [affinity]).map((a) => `\`${a}\``).join(', ')}\n`
    : '';
  return `# ${key}\n\n${skill.description.trim()}\n${triggersLine}${affinityLine}`;
}

function renderAgentStub(agent: {
  name: string;
  role: string;
  model?: string;
  tools?: string[];
  is_capcom?: boolean;
}): string {
  const capcomNote = agent.is_capcom ? ' (**capcom**)' : '';
  const modelLine = agent.model ? `\n**Model:** \`${agent.model}\`` : '';
  const toolsLine =
    agent.tools && agent.tools.length > 0
      ? `\n**Tools:** ${agent.tools.map((t) => `\`${t}\``).join(', ')}`
      : '';
  return `# ${agent.name}${capcomNote}\n\n${agent.role.trim()}\n${modelLine}${toolsLine}\n`;
}

function renderTeamStub(
  key: string,
  team: { description: string; agents: string[]; use_when?: string },
): string {
  const roster = team.agents.map((a) => `\`${a}\``).join(', ');
  const useWhen = team.use_when ? `\n**Use when:** ${team.use_when.trim()}\n` : '';
  return `# ${key}\n\n${team.description.trim()}\n\n**Roster:** ${roster}.\n${useWhen}`;
}
