import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportCommand } from './export.js';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import matter from 'gray-matter';

/**
 * Create a temp directory with unique name.
 */
function makeTempDir(): string {
  return join(tmpdir(), `export-test-${randomUUID()}`);
}

/**
 * Write a SKILL.md file with frontmatter into a skill directory.
 */
async function writeSkill(
  skillsDir: string,
  skillName: string,
  metadata: Record<string, unknown>,
  body: string,
): Promise<void> {
  const skillDir = join(skillsDir, skillName);
  await mkdir(skillDir, { recursive: true });
  const content = matter.stringify(body, metadata);
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

describe('exportCommand', () => {
  let tempDir: string;
  let skillsDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tempDir = makeTempDir();
    skillsDir = join(tempDir, 'skills');
    outputDir = join(tempDir, 'output');
    await mkdir(skillsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // ----------------------------------------------------------------
  // Error cases
  // ----------------------------------------------------------------

  it('returns 1 when no skill name provided', async () => {
    const exitCode = await exportCommand(undefined, {
      portable: true,
      skillsDir,
    });
    expect(exitCode).toBe(1);
  });

  it('returns 1 when neither --portable nor --platform specified', async () => {
    const exitCode = await exportCommand('my-skill', {
      skillsDir,
    });
    expect(exitCode).toBe(1);
  });

  it('returns 1 when both --portable and --platform specified', async () => {
    const exitCode = await exportCommand('my-skill', {
      portable: true,
      platform: 'cursor',
      skillsDir,
    });
    expect(exitCode).toBe(1);
  });

  it('returns 1 for unknown platform', async () => {
    const exitCode = await exportCommand('my-skill', {
      platform: 'nonexistent',
      skillsDir,
    });
    expect(exitCode).toBe(1);
  });

  it('returns 1 when skill not found', async () => {
    const exitCode = await exportCommand('nonexistent-skill', {
      portable: true,
      skillsDir,
    });
    expect(exitCode).toBe(1);
  });

  // ----------------------------------------------------------------
  // Portable export
  // ----------------------------------------------------------------

  it('portable export strips extension fields', async () => {
    await writeSkill(skillsDir, 'test-skill', {
      name: 'test-skill',
      description: 'A test skill',
      context: 'fork',
      agent: 'researcher',
      model: 'opus',
      'allowed-tools': ['Read', 'Write'],
      license: 'MIT',
    }, 'This is the skill body.');

    const exitCode = await exportCommand('test-skill', {
      portable: true,
      output: outputDir,
      skillsDir,
    });

    expect(exitCode).toBe(0);

    // Verify output exists
    const outputContent = await readFile(join(outputDir, 'SKILL.md'), 'utf-8');
    const parsed = matter(outputContent);

    // Standard fields preserved
    expect(parsed.data.name).toBe('test-skill');
    expect(parsed.data.description).toBe('A test skill');
    expect(parsed.data.license).toBe('MIT');

    // Extension fields stripped
    expect(parsed.data.context).toBeUndefined();
    expect(parsed.data.agent).toBeUndefined();
    expect(parsed.data.model).toBeUndefined();

    // allowed-tools converted to space-delimited string
    expect(parsed.data['allowed-tools']).toBe('Read Write');
  });

  // ----------------------------------------------------------------
  // Platform exports
  // ----------------------------------------------------------------

  it('platform export (cursor) strips extension fields', async () => {
    await writeSkill(skillsDir, 'cursor-skill', {
      name: 'cursor-skill',
      description: 'For cursor',
      context: 'fork',
      'allowed-tools': ['Read', 'Bash'],
    }, 'Cursor skill body.');

    const exitCode = await exportCommand('cursor-skill', {
      platform: 'cursor',
      output: outputDir,
      skillsDir,
    });

    expect(exitCode).toBe(0);

    const outputContent = await readFile(join(outputDir, 'SKILL.md'), 'utf-8');
    const parsed = matter(outputContent);

    expect(parsed.data.name).toBe('cursor-skill');
    expect(parsed.data.description).toBe('For cursor');
    expect(parsed.data.context).toBeUndefined();
    // Non-claude platforms get space-delimited allowed-tools
    expect(parsed.data['allowed-tools']).toBe('Read Bash');
  });

  it('platform export (claude) preserves extension fields', async () => {
    await writeSkill(skillsDir, 'claude-skill', {
      name: 'claude-skill',
      description: 'For claude',
      context: 'fork',
      agent: 'researcher',
      'allowed-tools': ['Read', 'Write'],
    }, 'Claude skill body.');

    const exitCode = await exportCommand('claude-skill', {
      platform: 'claude',
      output: outputDir,
      skillsDir,
    });

    expect(exitCode).toBe(0);

    const outputContent = await readFile(join(outputDir, 'SKILL.md'), 'utf-8');
    const parsed = matter(outputContent);

    expect(parsed.data.name).toBe('claude-skill');
    expect(parsed.data.description).toBe('For claude');
    // Claude preserves extension fields
    expect(parsed.data.context).toBe('fork');
    expect(parsed.data.agent).toBe('researcher');
    // Claude keeps allowed-tools as array
    expect(parsed.data['allowed-tools']).toEqual(['Read', 'Write']);
  });

  // ----------------------------------------------------------------
  // Progressive disclosure export
  // ----------------------------------------------------------------

  it('portable export copies subdirectories for progressive disclosure skills', async () => {
    // Create skill with references/ subdirectory
    await writeSkill(skillsDir, 'disc-skill', {
      name: 'disc-skill',
      description: 'A disclosure skill',
    }, 'See @references/REF.md for details.');

    const refsDir = join(skillsDir, 'disc-skill', 'references');
    await mkdir(refsDir, { recursive: true });
    await writeFile(join(refsDir, 'REF.md'), '# Reference\n\nSome content.', 'utf-8');

    const exitCode = await exportCommand('disc-skill', {
      portable: true,
      output: outputDir,
      skillsDir,
    });

    expect(exitCode).toBe(0);

    // Verify SKILL.md exists
    const skillMd = await readFile(join(outputDir, 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('disc-skill');

    // Verify references/REF.md was copied
    const refMd = await readFile(join(outputDir, 'references', 'REF.md'), 'utf-8');
    expect(refMd).toContain('Reference');
  });

  it('platform export copies subdirectories', async () => {
    // Create skill with references/ and scripts/ subdirectories
    await writeSkill(skillsDir, 'full-skill', {
      name: 'full-skill',
      description: 'A full skill',
    }, 'Body with @references/guide.md and @scripts/setup.sh');

    const refsDir = join(skillsDir, 'full-skill', 'references');
    const scriptsDir = join(skillsDir, 'full-skill', 'scripts');
    await mkdir(refsDir, { recursive: true });
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(join(refsDir, 'guide.md'), '# Guide', 'utf-8');
    await writeFile(join(scriptsDir, 'setup.sh'), '#!/bin/bash\necho "hello"', 'utf-8');

    const exitCode = await exportCommand('full-skill', {
      platform: 'codex',
      output: outputDir,
      skillsDir,
    });

    expect(exitCode).toBe(0);

    // Verify all files copied
    const skillMd = await readFile(join(outputDir, 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('full-skill');

    const guideMd = await readFile(join(outputDir, 'references', 'guide.md'), 'utf-8');
    expect(guideMd).toContain('Guide');

    const setupSh = await readFile(join(outputDir, 'scripts', 'setup.sh'), 'utf-8');
    expect(setupSh).toContain('echo "hello"');
  });
});
