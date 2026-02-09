/**
 * CLI command for capability manifest generation and display.
 *
 * Subcommands:
 * - generate: Discover capabilities and write CAPABILITIES.md
 * - show (default): Print capability summary to terminal
 *
 * Uses CapabilityDiscovery for scanning and renderManifest for output.
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import matter from 'gray-matter';
import { CapabilityDiscovery, renderManifest } from '../../capabilities/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import { getSkillsBasePath } from '../../types/scope.js';
import type { CapabilityManifest } from '../../capabilities/index.js';

// ============================================================================
// Types
// ============================================================================

interface ScopeDir {
  scope: 'user' | 'project';
  dir: string;
}

export interface CapabilitiesOptions {
  outputDir?: string;
  skillsDirs?: ScopeDir[];
  agentDirs?: ScopeDir[];
  teamDirs?: ScopeDir[];
}

// ============================================================================
// Default Directories
// ============================================================================

function getDefaultSkillsDirs(): ScopeDir[] {
  return [
    { scope: 'user', dir: getSkillsBasePath('user') },
    { scope: 'project', dir: getSkillsBasePath('project') },
  ];
}

function getDefaultAgentDirs(): ScopeDir[] {
  return [
    { scope: 'user', dir: join(homedir(), '.claude', 'agents') },
    { scope: 'project', dir: join('.claude', 'agents') },
  ];
}

function getDefaultTeamDirs(): ScopeDir[] {
  return [
    { scope: 'user', dir: join(homedir(), '.claude', 'teams') },
    { scope: 'project', dir: join('.claude', 'teams') },
  ];
}

// ============================================================================
// Discovery Helper
// ============================================================================

/**
 * Run capability discovery with the given directory configuration.
 */
async function runDiscovery(options: CapabilitiesOptions): Promise<CapabilityManifest> {
  const skillsDirs = options.skillsDirs ?? getDefaultSkillsDirs();
  const agentDirs = options.agentDirs ?? getDefaultAgentDirs();
  const teamDirs = options.teamDirs ?? getDefaultTeamDirs();

  // Build SkillStore instances for each skills directory
  const skillStores = skillsDirs.map(({ scope, dir }) => ({
    scope,
    store: new SkillStore(dir),
  }));

  const discovery = new CapabilityDiscovery(skillStores, agentDirs, teamDirs);
  return discovery.discover();
}

// ============================================================================
// Subcommands
// ============================================================================

/**
 * Generate CAPABILITIES.md file.
 */
async function generateSubcommand(options: CapabilitiesOptions): Promise<number> {
  p.intro(pc.bgCyan(pc.black(' Capability Discovery ')));

  const manifest = await runDiscovery(options);
  const content = renderManifest(manifest);

  const outputDir = options.outputDir ?? '.planning';
  await mkdir(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'CAPABILITIES.md');
  await writeFile(outputPath, content, 'utf-8');

  // Print summary
  p.log.message(pc.bold(`Skills: ${manifest.skills.length} | Agents: ${manifest.agents.length} | Teams: ${manifest.teams.length}`));
  p.log.message(pc.dim(`Content hash: ${manifest.contentHash}`));
  p.log.success(`Wrote ${outputPath}`);

  return 0;
}

/**
 * Show capability summary (default subcommand).
 */
async function showSubcommand(options: CapabilitiesOptions): Promise<number> {
  const outputDir = options.outputDir ?? '.planning';
  const capPath = join(outputDir, 'CAPABILITIES.md');

  let manifest: CapabilityManifest;

  if (existsSync(capPath)) {
    // Parse existing file
    const content = await readFile(capPath, 'utf-8');
    const parsed = matter(content);
    manifest = {
      version: parsed.data.version ?? 1,
      generatedAt: parsed.data.generatedAt ?? '',
      contentHash: parsed.data.contentHash ?? '',
      skills: [],
      agents: [],
      teams: [],
    };

    // Count from content sections
    const body = parsed.content;
    const skillMatches = body.match(/^\| [^|]+ \| (user|project) \|/gm);
    const skillSection = body.indexOf('## Skills');
    const agentSection = body.indexOf('## Agents');
    const teamSection = body.indexOf('## Teams');

    // Count table rows in each section
    const countRows = (text: string, start: number, end: number): number => {
      if (start === -1) return 0;
      const section = text.slice(start, end === -1 ? undefined : end);
      const rows = section.match(/^\| [^|]+ \| (user|project) \|/gm);
      return rows?.length ?? 0;
    };

    const skillCount = countRows(body, skillSection, agentSection);
    const agentCount = countRows(body, agentSection, teamSection);
    const teamCount = countRows(body, teamSection, -1);

    p.log.info(`Skills: ${skillCount} | Agents: ${agentCount} | Teams: ${teamCount}`);
    p.log.message(pc.dim(`Content hash: ${manifest.contentHash}`));
    p.log.message(pc.dim(`Generated: ${manifest.generatedAt}`));
  } else {
    // Run discovery in-memory
    manifest = await runDiscovery(options);
    p.log.info(`Skills: ${manifest.skills.length} | Agents: ${manifest.agents.length} | Teams: ${manifest.teams.length}`);
    p.log.message(pc.dim(`Content hash: ${manifest.contentHash}`));
    p.log.message(pc.dim('(No CAPABILITIES.md on disk. Run "capabilities generate" to create.)'));
  }

  return 0;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Capabilities CLI command handler.
 *
 * @param args - Subcommand arguments: ['generate'] or ['show'] or []
 * @param options - Optional directory configuration (for testing)
 * @returns Exit code (0 success, 1 error)
 */
export async function capabilitiesCommand(
  args: string[],
  options?: CapabilitiesOptions,
): Promise<number> {
  const subcommand = args[0] ?? 'show';
  const opts = options ?? {};

  switch (subcommand) {
    case 'generate':
      return generateSubcommand(opts);
    case 'show':
      return showSubcommand(opts);
    default:
      p.log.error(`Unknown subcommand: "${subcommand}". Use "generate" or "show".`);
      return 1;
  }
}
