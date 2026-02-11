/**
 * Capability discovery service.
 *
 * Composes existing SkillStore, scanDirectory, parseAgentFile, and
 * parseTeamConfig to enumerate all available capabilities from both
 * user (~/.claude/) and project (.claude/) scopes. Produces a typed
 * CapabilityManifest with per-entry content hashes and a whole-manifest
 * contentHash for deterministic staleness detection.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { scanDirectory } from '../orchestrator/discovery/scanner.js';
import { scanDirectoryForDirs } from '../orchestrator/discovery/scanner.js';
import { parseAgentFile } from '../orchestrator/discovery/agent-parser.js';
import { parseTeamConfig } from '../orchestrator/discovery/team-parser.js';
import { computeContentHash } from './types.js';
import type { SkillStore } from '../storage/skill-store.js';
import type {
  SkillCapability,
  AgentCapability,
  TeamCapability,
  CapabilityManifest,
} from './types.js';

// ============================================================================
// CapabilityDiscovery
// ============================================================================

/**
 * Discovers all available capabilities (skills, agents, teams) from
 * configured stores and directories.
 *
 * Constructor accepts explicit stores/directories rather than resolving
 * paths internally, enabling easy testing with temp directories.
 */
export class CapabilityDiscovery {
  constructor(
    private skillStores: { scope: 'user' | 'project'; store: SkillStore }[],
    private agentDirs: { scope: 'user' | 'project'; dir: string }[],
    private teamDirs: { scope: 'user' | 'project'; dir: string }[],
  ) {}

  /**
   * Discover all capabilities and return a typed manifest.
   *
   * The manifest's contentHash is computed from entry data only
   * (excludes generatedAt), ensuring deterministic output for
   * identical filesystem state.
   */
  async discover(): Promise<CapabilityManifest> {
    const skills = await this.discoverSkills();
    const agents = await this.discoverAgents();
    const teams = await this.discoverTeams();

    const sortedSkills = this.sortCapabilities(skills);
    const sortedAgents = this.sortCapabilities(agents);
    const sortedTeams = this.sortCapabilities(teams);

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      contentHash: this.computeManifestHash(sortedSkills, sortedAgents, sortedTeams),
      skills: sortedSkills,
      agents: sortedAgents,
      teams: sortedTeams,
    };
  }

  // --------------------------------------------------------------------------
  // Skills
  // --------------------------------------------------------------------------

  /**
   * Discover skills from all configured SkillStore instances.
   *
   * For each store, lists skill names then reads each skill to extract
   * metadata. Content hash is computed from the raw SKILL.md file content
   * (not the parsed object) for stability.
   */
  private async discoverSkills(): Promise<SkillCapability[]> {
    const skills: SkillCapability[] = [];

    for (const { scope, store } of this.skillStores) {
      const names = await store.list();
      for (const name of names) {
        try {
          const skill = await store.read(name);
          // Read raw file content for stable hashing
          const rawContent = await readFile(skill.path, 'utf-8');
          skills.push({
            name,
            description: String(skill.metadata.description ?? ''),
            scope,
            contentHash: computeContentHash(rawContent),
          });
        } catch {
          // Skip unreadable skills silently
        }
      }
    }

    return skills;
  }

  // --------------------------------------------------------------------------
  // Agents
  // --------------------------------------------------------------------------

  /**
   * Discover agents from all configured agent directories.
   *
   * Scans each directory for .md files (ALL agents, not just gsd-* prefix),
   * parses frontmatter via parseAgentFile, and computes content hash from
   * the raw file content.
   */
  private async discoverAgents(): Promise<AgentCapability[]> {
    const agents: AgentCapability[] = [];

    for (const { scope, dir } of this.agentDirs) {
      const files = await scanDirectory(dir, '.md');
      for (const filePath of files) {
        try {
          const content = await readFile(filePath, 'utf-8');
          const metadata = parseAgentFile(content, filePath);
          if (metadata) {
            agents.push({
              name: metadata.name,
              description: metadata.description,
              scope,
              tools: metadata.tools,
              model: metadata.model,
              contentHash: computeContentHash(content),
            });
          }
        } catch {
          // Skip unreadable agents silently
        }
      }
    }

    return agents;
  }

  // --------------------------------------------------------------------------
  // Teams
  // --------------------------------------------------------------------------

  /**
   * Discover teams from all configured team directories.
   *
   * Scans each directory for subdirectories containing config.json,
   * parses via parseTeamConfig, and computes content hash from the
   * raw config.json content.
   */
  private async discoverTeams(): Promise<TeamCapability[]> {
    const teams: TeamCapability[] = [];

    for (const { scope, dir } of this.teamDirs) {
      const teamNames = await scanDirectoryForDirs(dir);
      for (const teamName of teamNames) {
        try {
          const configPath = join(dir, teamName, 'config.json');
          const content = await readFile(configPath, 'utf-8');
          const metadata = parseTeamConfig(content, configPath);
          if (metadata) {
            teams.push({
              name: metadata.name,
              description: metadata.description,
              scope,
              topology: metadata.topology,
              memberCount: metadata.memberCount,
              contentHash: computeContentHash(content),
            });
          }
        } catch {
          // Skip unreadable teams silently
        }
      }
    }

    return teams;
  }

  // --------------------------------------------------------------------------
  // Sorting
  // --------------------------------------------------------------------------

  /**
   * Sort capabilities by scope priority (project first) then alphabetically by name.
   */
  private sortCapabilities<T extends { name: string; scope: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      if (a.scope !== b.scope) {
        return a.scope === 'project' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // --------------------------------------------------------------------------
  // Manifest Hash
  // --------------------------------------------------------------------------

  /**
   * Compute a whole-manifest content hash from sorted entry data.
   *
   * Uses JSON.stringify with sorted keys on each entry to produce
   * a canonical string. The generatedAt timestamp is NOT included,
   * ensuring identical filesystem state produces identical hashes.
   */
  private computeManifestHash(
    skills: SkillCapability[],
    agents: AgentCapability[],
    teams: TeamCapability[],
  ): string {
    const canonical = JSON.stringify({
      skills: skills.map((s) => this.canonicalEntry(s)),
      agents: agents.map((a) => this.canonicalEntry(a)),
      teams: teams.map((t) => this.canonicalEntry(t)),
    });
    return computeContentHash(canonical);
  }

  /**
   * Create a canonical representation of an entry with sorted keys.
   * Accepts strictly-typed objects by casting through unknown first.
   */
  private canonicalEntry(entry: Record<string, unknown> | SkillCapability | AgentCapability | TeamCapability): Record<string, unknown> {
    const entryAsRecord = entry as unknown as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(entryAsRecord).sort()) {
      if (entryAsRecord[key] !== undefined) {
        sorted[key] = entryAsRecord[key];
      }
    }
    return sorted;
  }
}
