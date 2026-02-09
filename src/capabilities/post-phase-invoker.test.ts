/**
 * Tests for PostPhaseInvoker service.
 *
 * Validates after-verb capability resolution to invocation instructions,
 * verb filtering (only after-verb produces instructions), team ref filtering,
 * skill/agent resolution via stores and directories, unresolved tracking,
 * deterministic ordering, and description format.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import { PostPhaseInvoker } from './post-phase-invoker.js';
import { SkillStore } from '../storage/skill-store.js';
import type { CapabilityRef } from './types.js';

describe('PostPhaseInvoker', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = join(
      tmpdir(),
      `post-phase-invoker-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
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
  // Test 1: Filters to only after-verb refs (use/create/adapt ignored)
  // --------------------------------------------------------------------------

  it('filters to only after-verb refs (use/create/adapt produce no instructions)', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'my-skill', 'A skill');

    const store = new SkillStore(skillsDir);
    const invoker = new PostPhaseInvoker(
      [{ scope: 'project', store }],
      []
    );

    const result = await invoker.resolveAfterHooks({
      capabilities: [
        { verb: 'use', type: 'skill', name: 'my-skill' },
        { verb: 'create', type: 'skill', name: 'my-skill' },
        { verb: 'adapt', type: 'skill', name: 'my-skill' },
      ],
    });

    expect(result.instructions).toHaveLength(0);
    expect(result.unresolved).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 2: Filters out team refs (teams not invocable)
  // --------------------------------------------------------------------------

  it('filters out team refs (teams not invocable)', async () => {
    const invoker = new PostPhaseInvoker([], []);

    const result = await invoker.resolveAfterHooks({
      capabilities: [
        { verb: 'after', type: 'team', name: 'my-team' },
      ],
    });

    expect(result.instructions).toHaveLength(0);
    expect(result.unresolved).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 3: Resolves skill refs via SkillStore.read() to get sourcePath
  // --------------------------------------------------------------------------

  it('resolves after-verb skill refs via SkillStore to sourcePath', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'test-generator', 'Test generation skill');

    const store = new SkillStore(skillsDir);
    const invoker = new PostPhaseInvoker(
      [{ scope: 'project', store }],
      []
    );

    const result = await invoker.resolveAfterHooks({
      capabilities: [{ verb: 'after', type: 'skill', name: 'test-generator' }],
    });

    expect(result.instructions).toHaveLength(1);
    expect(result.instructions[0].name).toBe('test-generator');
    expect(result.instructions[0].type).toBe('skill');
    expect(result.instructions[0].verb).toBe('after');
    expect(result.instructions[0].sourcePath).toContain('SKILL.md');
    expect(result.unresolved).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 4: Resolves agent refs via agentDirs file existence check
  // --------------------------------------------------------------------------

  it('resolves after-verb agent refs via agentDirs file existence', async () => {
    const agentDir = join(baseDir, 'agents');
    await createAgent(agentDir, 'gsd-collector.md', '---\nname: gsd-collector\n---\nCollector agent.');

    const invoker = new PostPhaseInvoker(
      [],
      [{ scope: 'project', dir: agentDir }]
    );

    const result = await invoker.resolveAfterHooks({
      capabilities: [{ verb: 'after', type: 'agent', name: 'gsd-collector' }],
    });

    expect(result.instructions).toHaveLength(1);
    expect(result.instructions[0].name).toBe('gsd-collector');
    expect(result.instructions[0].type).toBe('agent');
    expect(result.instructions[0].verb).toBe('after');
    expect(result.instructions[0].sourcePath).toContain('gsd-collector.md');
    expect(result.unresolved).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 5: Unresolved refs listed with "not found" reason
  // --------------------------------------------------------------------------

  it('reports unresolved refs with "not found" reason', async () => {
    const skillsDir = join(baseDir, 'skills');
    await mkdir(skillsDir, { recursive: true });

    const store = new SkillStore(skillsDir);
    const invoker = new PostPhaseInvoker(
      [{ scope: 'project', store }],
      []
    );

    const result = await invoker.resolveAfterHooks({
      capabilities: [{ verb: 'after', type: 'skill', name: 'nonexistent-skill' }],
    });

    expect(result.instructions).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0].ref.name).toBe('nonexistent-skill');
    expect(result.unresolved[0].reason).toContain('not found');
  });

  // --------------------------------------------------------------------------
  // Test 6: Empty capabilities produces empty result
  // --------------------------------------------------------------------------

  it('produces empty result for empty capabilities', async () => {
    const invoker = new PostPhaseInvoker([], []);

    const result = await invoker.resolveAfterHooks({
      capabilities: [],
    });

    expect(result.instructions).toHaveLength(0);
    expect(result.unresolved).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 7: Mixed verbs: only after-verb refs produce instructions
  // --------------------------------------------------------------------------

  it('only after-verb refs produce instructions in mixed-verb input', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'post-hook', 'Post-hook skill');
    await createSkill(skillsDir, 'loadable', 'Loadable skill');

    const store = new SkillStore(skillsDir);
    const invoker = new PostPhaseInvoker(
      [{ scope: 'project', store }],
      []
    );

    const result = await invoker.resolveAfterHooks({
      capabilities: [
        { verb: 'use', type: 'skill', name: 'loadable' },
        { verb: 'after', type: 'skill', name: 'post-hook' },
        { verb: 'create', type: 'skill', name: 'new-thing' },
      ],
    });

    expect(result.instructions).toHaveLength(1);
    expect(result.instructions[0].name).toBe('post-hook');
    expect(result.unresolved).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Test 8: Instructions sorted by type (skills first, then agents)
  // --------------------------------------------------------------------------

  it('sorts instructions by type: skills first, then agents', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'skill-hook', 'A skill hook');

    const agentDir = join(baseDir, 'agents');
    await createAgent(agentDir, 'agent-hook.md', '---\nname: agent-hook\n---\nAgent hook.');

    const store = new SkillStore(skillsDir);
    const invoker = new PostPhaseInvoker(
      [{ scope: 'project', store }],
      [{ scope: 'project', dir: agentDir }]
    );

    // Pass agent first, skill second — output should reverse to skill first
    const result = await invoker.resolveAfterHooks({
      capabilities: [
        { verb: 'after', type: 'agent', name: 'agent-hook' },
        { verb: 'after', type: 'skill', name: 'skill-hook' },
      ],
    });

    expect(result.instructions).toHaveLength(2);
    expect(result.instructions[0].type).toBe('skill');
    expect(result.instructions[1].type).toBe('agent');
  });

  // --------------------------------------------------------------------------
  // Test 9: Description format: "Invoke {type}/{name} after phase completion"
  // --------------------------------------------------------------------------

  it('generates description: "Invoke {type}/{name} after phase completion"', async () => {
    const skillsDir = join(baseDir, 'skills');
    await createSkill(skillsDir, 'test-generator', 'Test gen skill');

    const store = new SkillStore(skillsDir);
    const invoker = new PostPhaseInvoker(
      [{ scope: 'project', store }],
      []
    );

    const result = await invoker.resolveAfterHooks({
      capabilities: [{ verb: 'after', type: 'skill', name: 'test-generator' }],
    });

    expect(result.instructions).toHaveLength(1);
    expect(result.instructions[0].description).toBe(
      'Invoke skill/test-generator after phase completion'
    );
  });
});
