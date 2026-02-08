/**
 * Tests for CapabilityDiscovery service.
 *
 * Validates dual-scope skill/agent/team discovery, content hashing,
 * deterministic output, sorting, and edge cases using real temp directories
 * and real SkillStore instances (no mocks).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import { CapabilityDiscovery } from './capability-discovery.js';
import { SkillStore } from '../storage/skill-store.js';
import type { CapabilityManifest } from './types.js';

describe('CapabilityDiscovery', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = join(
      tmpdir(),
      `cap-discovery-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(baseDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  /**
   * Helper: create a valid SKILL.md file in a skill subdirectory.
   */
  async function createSkill(
    skillsDir: string,
    name: string,
    description: string
  ): Promise<void> {
    const skillDir = join(skillsDir, name);
    await mkdir(skillDir, { recursive: true });
    const content = matter.stringify(`Skill body for ${name}`, {
      name,
      description,
    });
    await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
  }

  /**
   * Helper: create a valid agent .md file with frontmatter.
   */
  async function createAgent(
    agentDir: string,
    fileName: string,
    meta: { name: string; description: string; tools?: string; model?: string }
  ): Promise<void> {
    await mkdir(agentDir, { recursive: true });
    const content = matter.stringify(`Agent instructions for ${meta.name}`, {
      name: meta.name,
      description: meta.description,
      ...(meta.tools ? { tools: meta.tools } : {}),
      ...(meta.model ? { model: meta.model } : {}),
    });
    await writeFile(join(agentDir, fileName), content, 'utf-8');
  }

  /**
   * Helper: create a valid team config.json in a team subdirectory.
   */
  async function createTeam(
    teamsDir: string,
    name: string,
    meta: { description?: string; topology?: string; members: unknown[] }
  ): Promise<void> {
    const teamDir = join(teamsDir, name);
    await mkdir(teamDir, { recursive: true });
    const config = {
      name,
      ...(meta.description ? { description: meta.description } : {}),
      ...(meta.topology ? { topology: meta.topology } : {}),
      members: meta.members,
    };
    await writeFile(
      join(teamDir, 'config.json'),
      JSON.stringify(config, null, 2),
      'utf-8'
    );
  }

  // --------------------------------------------------------------------------
  // Test 1: Discovers skills from a single scope
  // --------------------------------------------------------------------------

  it('discovers skills from a single scope', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'alpha-skill', 'Alpha description');
    await createSkill(skillsDir, 'beta-skill', 'Beta description');

    const store = new SkillStore(skillsDir);
    const discovery = new CapabilityDiscovery(
      [{ scope: 'project', store }],
      [],
      []
    );

    const manifest = await discovery.discover();

    expect(manifest.skills).toHaveLength(2);
    expect(manifest.skills[0].name).toBe('alpha-skill');
    expect(manifest.skills[0].description).toBe('Alpha description');
    expect(manifest.skills[0].scope).toBe('project');
    expect(manifest.skills[0].contentHash).toMatch(/^[0-9a-f]{16}$/);
    expect(manifest.skills[1].name).toBe('beta-skill');
  });

  // --------------------------------------------------------------------------
  // Test 2: Discovers skills from both user and project scopes
  // --------------------------------------------------------------------------

  it('discovers skills from both user and project scopes', async () => {
    const userSkillsDir = join(baseDir, 'user-skills');
    const projectSkillsDir = join(baseDir, 'project-skills');

    await createSkill(userSkillsDir, 'user-skill', 'User scope skill');
    await createSkill(projectSkillsDir, 'project-skill', 'Project scope skill');

    const userStore = new SkillStore(userSkillsDir);
    const projectStore = new SkillStore(projectSkillsDir);

    const discovery = new CapabilityDiscovery(
      [
        { scope: 'user', store: userStore },
        { scope: 'project', store: projectStore },
      ],
      [],
      []
    );

    const manifest = await discovery.discover();

    expect(manifest.skills).toHaveLength(2);
    const scopes = manifest.skills.map((s) => s.scope);
    expect(scopes).toContain('user');
    expect(scopes).toContain('project');
  });

  // --------------------------------------------------------------------------
  // Test 3: Discovers agents (all agents, not just gsd-* prefix)
  // --------------------------------------------------------------------------

  it('discovers agents from filesystem (all agents, not just gsd-* prefix)', async () => {
    const agentDir = join(baseDir, 'agents');

    await createAgent(agentDir, 'gsd-executor.md', {
      name: 'gsd-executor',
      description: 'GSD executor agent',
      tools: 'Read, Write, Bash',
      model: 'sonnet',
    });
    await createAgent(agentDir, 'custom-reviewer.md', {
      name: 'custom-reviewer',
      description: 'Custom code review agent',
    });

    const discovery = new CapabilityDiscovery(
      [],
      [{ scope: 'project', dir: agentDir }],
      []
    );

    const manifest = await discovery.discover();

    expect(manifest.agents).toHaveLength(2);
    const names = manifest.agents.map((a) => a.name);
    expect(names).toContain('gsd-executor');
    expect(names).toContain('custom-reviewer');

    const executor = manifest.agents.find((a) => a.name === 'custom-reviewer');
    expect(executor?.contentHash).toMatch(/^[0-9a-f]{16}$/);
  });

  // --------------------------------------------------------------------------
  // Test 4: Discovers teams from filesystem
  // --------------------------------------------------------------------------

  it('discovers teams from filesystem', async () => {
    const teamsDir = join(baseDir, 'teams');

    await createTeam(teamsDir, 'research-team', {
      description: 'Research and analysis team',
      topology: 'leader-worker',
      members: [
        { name: 'lead', role: 'leader' },
        { name: 'worker1', role: 'researcher' },
        { name: 'worker2', role: 'researcher' },
      ],
    });

    const discovery = new CapabilityDiscovery(
      [],
      [],
      [{ scope: 'project', dir: teamsDir }]
    );

    const manifest = await discovery.discover();

    expect(manifest.teams).toHaveLength(1);
    expect(manifest.teams[0].name).toBe('research-team');
    expect(manifest.teams[0].topology).toBe('leader-worker');
    expect(manifest.teams[0].memberCount).toBe(3);
    expect(manifest.teams[0].contentHash).toMatch(/^[0-9a-f]{16}$/);
  });

  // --------------------------------------------------------------------------
  // Test 5: Produces deterministic output
  // --------------------------------------------------------------------------

  it('produces deterministic output', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'det-skill', 'Deterministic skill');

    const agentDir = join(baseDir, 'agents');
    await createAgent(agentDir, 'det-agent.md', {
      name: 'det-agent',
      description: 'Deterministic agent',
    });

    const store = new SkillStore(skillsDir);
    const discovery = new CapabilityDiscovery(
      [{ scope: 'project', store }],
      [{ scope: 'project', dir: agentDir }],
      []
    );

    const manifest1 = await discovery.discover();
    const manifest2 = await discovery.discover();

    expect(manifest1.contentHash).toBe(manifest2.contentHash);

    // Compare everything except generatedAt
    const normalize = (m: CapabilityManifest) => ({
      ...m,
      generatedAt: 'REMOVED',
    });
    expect(JSON.stringify(normalize(manifest1))).toBe(
      JSON.stringify(normalize(manifest2))
    );
  });

  // --------------------------------------------------------------------------
  // Test 6: Handles empty directories gracefully
  // --------------------------------------------------------------------------

  it('handles empty directories gracefully', async () => {
    const emptySkills = join(baseDir, 'empty-skills');
    const emptyAgents = join(baseDir, 'empty-agents');
    const emptyTeams = join(baseDir, 'empty-teams');
    await mkdir(emptySkills, { recursive: true });
    await mkdir(emptyAgents, { recursive: true });
    await mkdir(emptyTeams, { recursive: true });

    const store = new SkillStore(emptySkills);
    const discovery = new CapabilityDiscovery(
      [{ scope: 'project', store }],
      [{ scope: 'project', dir: emptyAgents }],
      [{ scope: 'project', dir: emptyTeams }]
    );

    const manifest = await discovery.discover();

    expect(manifest.version).toBe(1);
    expect(manifest.generatedAt).toBeTruthy();
    expect(manifest.contentHash).toMatch(/^[0-9a-f]{16}$/);
    expect(manifest.skills).toEqual([]);
    expect(manifest.agents).toEqual([]);
    expect(manifest.teams).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 7: Sorts entries by scope priority (project first) then alphabetically
  // --------------------------------------------------------------------------

  it('sorts entries by scope priority (project first) then alphabetically', async () => {
    const userSkillsDir = join(baseDir, 'user-skills');
    const projectSkillsDir = join(baseDir, 'project-skills');

    await createSkill(userSkillsDir, 'zeta', 'Zeta skill');
    await createSkill(projectSkillsDir, 'alpha', 'Alpha skill');
    await createSkill(projectSkillsDir, 'beta', 'Beta skill');

    const userStore = new SkillStore(userSkillsDir);
    const projectStore = new SkillStore(projectSkillsDir);

    const discovery = new CapabilityDiscovery(
      [
        { scope: 'user', store: userStore },
        { scope: 'project', store: projectStore },
      ],
      [],
      []
    );

    const manifest = await discovery.discover();

    expect(manifest.skills).toHaveLength(3);
    expect(manifest.skills[0].name).toBe('alpha');
    expect(manifest.skills[0].scope).toBe('project');
    expect(manifest.skills[1].name).toBe('beta');
    expect(manifest.skills[1].scope).toBe('project');
    expect(manifest.skills[2].name).toBe('zeta');
    expect(manifest.skills[2].scope).toBe('user');
  });

  // --------------------------------------------------------------------------
  // Test 8: Whole-manifest contentHash excludes generatedAt timestamp
  // --------------------------------------------------------------------------

  it('whole-manifest contentHash computed from entry data, not from generatedAt', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'hash-test', 'Hash test skill');

    const store = new SkillStore(skillsDir);
    const discovery = new CapabilityDiscovery(
      [{ scope: 'project', store }],
      [],
      []
    );

    // First call at one point in time
    const manifest1 = await discovery.discover();

    // Simulate time passing by waiting a tick
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Second call at a different time
    const manifest2 = await discovery.discover();

    // generatedAt should differ (or at least the hash should not depend on it)
    // The critical assertion: contentHash must be identical
    expect(manifest1.contentHash).toBe(manifest2.contentHash);

    // And generatedAt could differ (they're separate timestamps)
    // Even if they happen to be the same millisecond, the hash independence is
    // guaranteed by the implementation not including generatedAt in the hash
  });
});
