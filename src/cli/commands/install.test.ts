import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtemp,
  writeFile,
  mkdir,
  readFile,
  rm,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import { packSkill } from '../../mcp/skill-packager.js';
import { installCommand } from './install.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Create a minimal skill directory with valid frontmatter for packaging.
 */
async function createSkillDir(
  baseDir: string,
  skillName: string,
  opts: { description?: string; body?: string } = {},
): Promise<string> {
  const skillDir = join(baseDir, skillName);
  await mkdir(skillDir, { recursive: true });

  const metadata: Record<string, unknown> = {
    name: skillName,
    description: opts.description ?? `A test skill called ${skillName}`,
  };

  const body = opts.body ?? `# ${skillName}\n\nThis is the skill body.`;
  const content = matter.stringify(body, metadata);
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');

  return skillDir;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('install CLI command', () => {
  let tempDir: string;
  let installDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'install-cmd-test-'));
    installDir = await mkdtemp(join(tmpdir(), 'install-cmd-target-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    await rm(installDir, { recursive: true, force: true });
  });

  it('installs a packaged skill end-to-end via CLI command', async () => {
    // 1. Create a skill and package it
    const skillDir = await createSkillDir(tempDir, 'cli-test-skill', {
      description: 'CLI integration test skill',
      body: '# CLI Test\n\nEnd-to-end test content.',
    });
    const archivePath = join(tempDir, 'cli-test-skill.tar.gz');
    await packSkill(skillDir, 'cli-test-skill', archivePath);

    // 2. Install via the CLI command
    const exitCode = await installCommand(archivePath, {
      skillsDir: installDir,
    });

    // 3. Verify success
    expect(exitCode).toBe(0);

    // 4. Verify skill was installed
    const installed = await readFile(
      join(installDir, 'cli-test-skill', 'SKILL.md'),
      'utf-8',
    );
    expect(installed).toContain('CLI Test');
    expect(installed).toContain('End-to-end test content');
  });

  it('returns 1 when invoked without source argument (shows help)', async () => {
    const exitCode = await installCommand(undefined, {});
    expect(exitCode).toBe(1);
  });

  it('returns 1 when installing from nonexistent file', async () => {
    const exitCode = await installCommand(
      join(tempDir, 'nonexistent.tar.gz'),
      { skillsDir: installDir },
    );
    expect(exitCode).toBe(1);
  });
});
