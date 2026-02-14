import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { collectTopologyData } from './topology-collector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDir: string;

/** Create a temp directory for each test. */
async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'topo-collector-'));
}

/** Write a skill file with YAML frontmatter. */
async function writeSkillFile(
  baseDir: string,
  name: string,
  frontmatter: Record<string, string>,
  body = '',
): Promise<void> {
  const dir = join(baseDir, '.claude', 'commands');
  await mkdir(dir, { recursive: true });
  const yaml = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  await writeFile(join(dir, `${name}.md`), `---\n${yaml}\n---\n${body}`);
}

/** Write an agent file with YAML frontmatter. */
async function writeAgentFile(
  baseDir: string,
  name: string,
  frontmatter: Record<string, string>,
  body = '',
): Promise<void> {
  const dir = join(baseDir, '.claude', 'agents');
  await mkdir(dir, { recursive: true });
  const yaml = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  await writeFile(join(dir, `${name}.md`), `---\n${yaml}\n---\n${body}`);
}

/** Write a team config.json. */
async function writeTeamConfig(
  baseDir: string,
  teamName: string,
  config: Record<string, unknown>,
): Promise<void> {
  const dir = join(baseDir, '.claude', 'teams', teamName);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'config.json'), JSON.stringify(config));
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(async () => {
  tempDir = await createTempDir();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectTopologyData', () => {
  // -------------------------------------------------------------------------
  // 1. Reads skill files and returns skill entries with inferred domains
  // -------------------------------------------------------------------------
  it('reads skill files and returns skill entries with inferred domains', async () => {
    await writeSkillFile(tempDir, 'beautiful-commits', {
      name: 'beautiful-commits',
      description: 'Crafts professional git commit messages',
    });
    await writeSkillFile(tempDir, 'code-review', {
      name: 'code-review',
      description: 'Reviews code for quality and correctness',
    });

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.skills).toHaveLength(2);
    const names = result.skills.map((s) => s.name);
    expect(names).toContain('beautiful-commits');
    expect(names).toContain('code-review');

    // Each skill has an id, name, domain
    for (const skill of result.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(typeof skill.domain).toBe('string');
      expect(skill.domain.length).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Reads agent files and returns agent entries with inferred domains
  // -------------------------------------------------------------------------
  it('reads agent files and returns agent entries with inferred domains', async () => {
    await writeAgentFile(tempDir, 'observer', {
      name: 'observer',
      description: 'Passive session observer for pattern detection',
      tools: 'Read, Bash, Glob, Grep',
    });

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].name).toBe('observer');
    expect(result.agents[0].id).toBe('observer');
    expect(typeof result.agents[0].domain).toBe('string');
    expect(Array.isArray(result.agents[0].skills)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 3. Reads team config.json files and returns team entries
  // -------------------------------------------------------------------------
  it('reads team config.json files and returns team entries', async () => {
    await writeTeamConfig(tempDir, 'code-review-team', {
      name: 'code-review-team',
      topology: 'leader-worker',
      members: [
        { name: 'review-coordinator' },
        { name: 'correctness-reviewer' },
      ],
    });

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe('code-review-team');
    expect(result.teams[0].id).toBe('code-review-team');
    expect(result.teams[0].topology).toBe('leader-worker');
    expect(result.teams[0].members).toEqual([
      'review-coordinator',
      'correctness-reviewer',
    ]);
  });

  // -------------------------------------------------------------------------
  // 4. Returns empty arrays when directories are missing
  // -------------------------------------------------------------------------
  it('returns empty arrays when directories are missing', async () => {
    // tempDir has no .claude/ at all
    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.skills).toEqual([]);
    expect(result.agents).toEqual([]);
    expect(result.teams).toEqual([]);
    expect(result.activeAgentIds).toEqual([]);
    expect(result.activeSkillIds).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 5. Skips malformed frontmatter without affecting other entries
  // -------------------------------------------------------------------------
  it('skips malformed frontmatter without affecting other entries', async () => {
    // Write a valid skill
    await writeSkillFile(tempDir, 'valid-skill', {
      name: 'valid-skill',
      description: 'A valid skill',
    });

    // Write a malformed file (no frontmatter delimiters)
    const dir = join(tempDir, '.claude', 'commands');
    await writeFile(join(dir, 'broken.md'), 'no frontmatter here at all');

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('valid-skill');
  });

  // -------------------------------------------------------------------------
  // 6. Returns empty activeAgentIds and activeSkillIds
  // -------------------------------------------------------------------------
  it('returns empty activeAgentIds and activeSkillIds', async () => {
    await writeSkillFile(tempDir, 'test-skill', {
      name: 'test-skill',
      description: 'Test skill for testing',
    });

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.activeAgentIds).toEqual([]);
    expect(result.activeSkillIds).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 7. Associates skills with agents via agent tools
  // -------------------------------------------------------------------------
  it('associates skills with agents via agent tools', async () => {
    await writeSkillFile(tempDir, 'beautiful-commits', {
      name: 'beautiful-commits',
      description: 'Crafts commit messages',
    });
    await writeAgentFile(tempDir, 'observer', {
      name: 'observer',
      description: 'Passive session observer',
      tools: 'Read, Bash, Glob, Grep',
    });

    const result = await collectTopologyData({ cwd: tempDir });

    // Skills and agents should be present
    expect(result.skills).toHaveLength(1);
    expect(result.agents).toHaveLength(1);
    // Agent tools don't match skill names, so agentId should be undefined
    expect(result.skills[0].agentId).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 8. Collects from all three directories in one call
  // -------------------------------------------------------------------------
  it('collects from all three directories in one call', async () => {
    await writeSkillFile(tempDir, 'my-skill', {
      name: 'my-skill',
      description: 'A skill for building features',
    });
    await writeAgentFile(tempDir, 'my-agent', {
      name: 'my-agent',
      description: 'An agent for orchestrating tasks',
    });
    await writeTeamConfig(tempDir, 'my-team', {
      name: 'my-team',
      topology: 'pipeline',
      members: [{ name: 'worker-1' }, { name: 'worker-2' }],
    });

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.skills).toHaveLength(1);
    expect(result.agents).toHaveLength(1);
    expect(result.teams).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // 9. Handles skill files without name in frontmatter (uses filename)
  // -------------------------------------------------------------------------
  it('handles skill files without name in frontmatter by using filename', async () => {
    const dir = join(tempDir, '.claude', 'commands');
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, 'unnamed-skill.md'),
      '---\ndescription: A skill without a name field\n---\nContent here',
    );

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('unnamed-skill');
    expect(result.skills[0].id).toBe('unnamed-skill');
  });

  // -------------------------------------------------------------------------
  // 10. Handles teams with missing members array gracefully
  // -------------------------------------------------------------------------
  it('handles teams with missing members array gracefully', async () => {
    await writeTeamConfig(tempDir, 'bad-team', {
      name: 'bad-team',
      topology: 'single',
      // no members array
    });

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].members).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 11. Only processes .md files from commands/agents dirs
  // -------------------------------------------------------------------------
  it('only processes .md files from commands and agents dirs', async () => {
    const cmdsDir = join(tempDir, '.claude', 'commands');
    await mkdir(cmdsDir, { recursive: true });
    await writeFile(join(cmdsDir, 'valid.md'), '---\nname: valid\ndescription: test\n---\n');
    await writeFile(join(cmdsDir, 'readme.txt'), 'not a skill file');
    await writeFile(join(cmdsDir, 'data.json'), '{}');

    const result = await collectTopologyData({ cwd: tempDir });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('valid');
  });

  // -------------------------------------------------------------------------
  // 12. Handles malformed team config.json gracefully
  // -------------------------------------------------------------------------
  it('handles malformed team config.json gracefully', async () => {
    const teamDir = join(tempDir, '.claude', 'teams', 'bad-json');
    await mkdir(teamDir, { recursive: true });
    await writeFile(join(teamDir, 'config.json'), 'not valid json {{{');

    // Also write a valid team
    await writeTeamConfig(tempDir, 'good-team', {
      name: 'good-team',
      topology: 'single',
      members: [{ name: 'worker' }],
    });

    const result = await collectTopologyData({ cwd: tempDir });

    // Should only return the valid team
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe('good-team');
  });

  // -------------------------------------------------------------------------
  // 13. Result conforms to TopologySource interface
  // -------------------------------------------------------------------------
  it('result conforms to TopologySource interface', async () => {
    await writeSkillFile(tempDir, 'test-skill', {
      name: 'test-skill',
      description: 'Testing infrastructure',
    });

    const result = await collectTopologyData({ cwd: tempDir });

    // Verify TopologySource shape
    expect(Array.isArray(result.agents)).toBe(true);
    expect(Array.isArray(result.skills)).toBe(true);
    expect(Array.isArray(result.teams)).toBe(true);
    expect(Array.isArray(result.activeAgentIds)).toBe(true);
    expect(Array.isArray(result.activeSkillIds)).toBe(true);
  });
});
