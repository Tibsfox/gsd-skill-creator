/**
 * Tests for SkillInjector service.
 *
 * Validates capability-to-content resolution, verb filtering (use/adapt loaded,
 * create/after filtered), budget tier assignment, token estimation, deterministic
 * ordering, and phase capability inheritance using real temp directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import { SkillInjector } from './skill-injector.js';
import { SkillStore } from '../storage/skill-store.js';
import type { CapabilityRef } from './types.js';

describe('SkillInjector', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = join(
      tmpdir(),
      `skill-injector-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
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
    description: string,
    body: string = `Skill body for ${name}`
  ): Promise<void> {
    const skillDir = join(skillsDir, name);
    await mkdir(skillDir, { recursive: true });
    const content = matter.stringify(body, { name, description });
    await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
  }

  /**
   * Helper: create a valid agent .md file with content.
   */
  async function createAgent(
    agentDir: string,
    fileName: string,
    content: string
  ): Promise<void> {
    await mkdir(agentDir, { recursive: true });
    await writeFile(join(agentDir, fileName), content, 'utf-8');
  }

  // --------------------------------------------------------------------------
  // Test 1: inject() with use-verb skill refs resolves to skill content
  // --------------------------------------------------------------------------

  it('resolves use-verb skill refs to skill content with critical tier', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'beautiful-commits', 'Commit formatting skill');

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'use', type: 'skill', name: 'beautiful-commits' }],
    });

    expect(result.injected).toHaveLength(1);
    expect(result.injected[0].name).toBe('beautiful-commits');
    expect(result.injected[0].type).toBe('skill');
    expect(result.injected[0].tier).toBe('critical');
    expect(result.injected[0].content).toContain('beautiful-commits');
    expect(result.injected[0].sourcePath).toContain('SKILL.md');
    expect(result.notFound).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 2: inject() with use-verb agent refs resolves to agent file content
  // --------------------------------------------------------------------------

  it('resolves use-verb agent refs to agent file content with critical tier', async () => {
    const agentDir = join(baseDir, 'agents');
    const agentContent = '---\nname: gsd-executor\n---\nExecutor instructions here.';
    await createAgent(agentDir, 'gsd-executor.md', agentContent);

    const injector = new SkillInjector(
      [],
      [{ scope: 'project', dir: agentDir }]
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'use', type: 'agent', name: 'gsd-executor' }],
    });

    expect(result.injected).toHaveLength(1);
    expect(result.injected[0].name).toBe('gsd-executor');
    expect(result.injected[0].type).toBe('agent');
    expect(result.injected[0].tier).toBe('critical');
    expect(result.injected[0].content).toContain('Executor instructions here');
    expect(result.injected[0].sourcePath).toContain('gsd-executor.md');
    expect(result.notFound).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 3: inject() with create-verb refs filters them out
  // --------------------------------------------------------------------------

  it('filters out create-verb refs (empty injected)', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'new-skill', 'Will be created');

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'create', type: 'skill', name: 'new-skill' }],
    });

    expect(result.injected).toHaveLength(0);
    expect(result.notFound).toHaveLength(0);
    expect(result.totalEstimatedTokens).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Test 4: inject() with after-verb refs filters them out
  // --------------------------------------------------------------------------

  it('filters out after-verb refs', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'post-skill', 'Post-completion skill');

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'after', type: 'skill', name: 'post-skill' }],
    });

    expect(result.injected).toHaveLength(0);
    expect(result.notFound).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 5: inject() with adapt-verb refs resolves (adapt is loadable)
  // --------------------------------------------------------------------------

  it('resolves adapt-verb refs (adapt is loadable like use)', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'adaptable-skill', 'Can be adapted');

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'adapt', type: 'skill', name: 'adaptable-skill' }],
    });

    expect(result.injected).toHaveLength(1);
    expect(result.injected[0].name).toBe('adaptable-skill');
    expect(result.injected[0].tier).toBe('critical');
  });

  // --------------------------------------------------------------------------
  // Test 6: inject() with unknown skill ref appears in notFound
  // --------------------------------------------------------------------------

  it('reports unknown skill ref in notFound', async () => {
    const skillsDir = join(baseDir, 'skills');
    await mkdir(skillsDir, { recursive: true });

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'use', type: 'skill', name: 'nonexistent-skill' }],
    });

    expect(result.injected).toHaveLength(0);
    expect(result.notFound).toHaveLength(1);
    expect(result.notFound[0].name).toBe('nonexistent-skill');
  });

  // --------------------------------------------------------------------------
  // Test 7: inject() with mixed found/not-found populates both
  // --------------------------------------------------------------------------

  it('populates both injected and notFound for mixed refs', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'found-skill', 'This one exists');

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [
        { verb: 'use', type: 'skill', name: 'found-skill' },
        { verb: 'use', type: 'skill', name: 'missing-skill' },
      ],
    });

    expect(result.injected).toHaveLength(1);
    expect(result.injected[0].name).toBe('found-skill');
    expect(result.notFound).toHaveLength(1);
    expect(result.notFound[0].name).toBe('missing-skill');
  });

  // --------------------------------------------------------------------------
  // Test 8: inject() returns correct estimatedTokens (content.length / 4)
  // --------------------------------------------------------------------------

  it('calculates correct estimatedTokens (content.length / 4 rounded up)', async () => {
    const skillsDir = join(baseDir, 'skills');
    // Create a skill with known body length
    const body = 'A'.repeat(100);
    await createSkill(skillsDir, 'token-test', 'Token test', body);

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      []
    );

    const result = await injector.inject({
      capabilities: [{ verb: 'use', type: 'skill', name: 'token-test' }],
    });

    expect(result.injected).toHaveLength(1);
    // Token estimate is content.length / 4, rounded up
    const expectedTokens = Math.ceil(result.injected[0].content.length / 4);
    expect(result.injected[0].estimatedTokens).toBe(expectedTokens);
    expect(result.totalEstimatedTokens).toBe(expectedTokens);
  });

  // --------------------------------------------------------------------------
  // Test 9: inject() sorts skills before agents in result
  // --------------------------------------------------------------------------

  it('sorts skills before agents in result', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'my-skill', 'A skill');

    const agentDir = join(baseDir, 'agents');
    await createAgent(agentDir, 'my-agent.md', '---\nname: my-agent\n---\nAgent body.');

    const store = new SkillStore(skillsDir);
    const injector = new SkillInjector(
      [{ scope: 'project', store }],
      [{ scope: 'project', dir: agentDir }]
    );

    const result = await injector.inject({
      capabilities: [
        { verb: 'use', type: 'agent', name: 'my-agent' },
        { verb: 'use', type: 'skill', name: 'my-skill' },
      ],
    });

    expect(result.injected).toHaveLength(2);
    expect(result.injected[0].type).toBe('skill');
    expect(result.injected[1].type).toBe('agent');
  });

  // --------------------------------------------------------------------------
  // Test 10: inject() with team ref filters it out (teams not injectable)
  // --------------------------------------------------------------------------

  it('filters out team refs (teams not injectable as context)', async () => {
    const injector = new SkillInjector([], []);

    const result = await injector.inject({
      capabilities: [{ verb: 'use', type: 'team', name: 'some-team' }],
    });

    expect(result.injected).toHaveLength(0);
    expect(result.notFound).toHaveLength(0);
    expect(result.totalEstimatedTokens).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Test 11: resolveCapabilities() with plan capabilities returns plan's refs
  // --------------------------------------------------------------------------

  it('resolveCapabilities with plan capabilities returns plan refs (selective override)', () => {
    const planCapabilities: Record<string, string[]> = {
      use: ['skill/beautiful-commits', 'agent/gsd-executor'],
      create: ['skill/new-skill'],
    };
    const phaseCapabilities: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'phase-skill' },
    ];

    const result = SkillInjector.resolveCapabilities(planCapabilities, phaseCapabilities);

    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ verb: 'use', type: 'skill', name: 'beautiful-commits' });
    expect(result).toContainEqual({ verb: 'use', type: 'agent', name: 'gsd-executor' });
    expect(result).toContainEqual({ verb: 'create', type: 'skill', name: 'new-skill' });
    // Phase capabilities are NOT included (plan overrides)
  });

  // --------------------------------------------------------------------------
  // Test 12: resolveCapabilities() with undefined plan capabilities inherits
  // --------------------------------------------------------------------------

  it('resolveCapabilities with undefined plan capabilities returns phase capabilities', () => {
    const phaseCapabilities: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'phase-skill' },
      { verb: 'use', type: 'agent', name: 'phase-agent' },
    ];

    const result = SkillInjector.resolveCapabilities(undefined, phaseCapabilities);

    expect(result).toEqual(phaseCapabilities);
  });

  // --------------------------------------------------------------------------
  // Test 13: resolveCapabilities() with empty plan capabilities inherits
  // --------------------------------------------------------------------------

  it('resolveCapabilities with empty plan capabilities returns phase capabilities', () => {
    const phaseCapabilities: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'inherited-skill' },
    ];

    const result = SkillInjector.resolveCapabilities({}, phaseCapabilities);

    expect(result).toEqual(phaseCapabilities);
  });
});
