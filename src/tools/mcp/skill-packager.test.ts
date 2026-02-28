import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import { packSkill, type SkillPackageManifest } from './skill-packager.js';

/**
 * Helper: create a minimal skill directory with valid frontmatter.
 */
async function createSkillDir(
  baseDir: string,
  skillName: string,
  opts: {
    description?: string;
    body?: string;
    allowedTools?: string[];
    extensionFields?: Record<string, unknown>;
    references?: Array<{ filename: string; content: string }>;
  } = {},
): Promise<string> {
  const skillDir = join(baseDir, skillName);
  await mkdir(skillDir, { recursive: true });

  const metadata: Record<string, unknown> = {
    name: skillName,
    description: opts.description ?? `A test skill called ${skillName}`,
  };

  if (opts.allowedTools) {
    metadata['allowed-tools'] = opts.allowedTools;
  }

  // Add extension fields to simulate non-portable content
  if (opts.extensionFields) {
    Object.assign(metadata, opts.extensionFields);
  }

  const body = opts.body ?? `# ${skillName}\n\nThis is the skill body.`;
  const content = matter.stringify(body, metadata);
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');

  // Create references/ subdirectory if specified
  if (opts.references && opts.references.length > 0) {
    const refsDir = join(skillDir, 'references');
    await mkdir(refsDir, { recursive: true });
    for (const ref of opts.references) {
      await writeFile(join(refsDir, ref.filename), ref.content, 'utf-8');
    }
  }

  return skillDir;
}

describe('skill-packager', () => {
  let tempDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'skill-packager-test-'));
    outputDir = await mkdtemp(join(tmpdir(), 'skill-packager-out-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    await rm(outputDir, { recursive: true, force: true });
  });

  describe('manifest tests', () => {
    it('returns a SkillPackageManifest with formatVersion: 1', async () => {
      const skillDir = await createSkillDir(tempDir, 'test-skill');
      const outputPath = join(outputDir, 'test-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'test-skill', outputPath);

      expect(manifest.formatVersion).toBe(1);
    });

    it('manifest name matches skill directory name', async () => {
      const skillDir = await createSkillDir(tempDir, 'my-awesome-skill');
      const outputPath = join(outputDir, 'my-awesome-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'my-awesome-skill', outputPath);

      expect(manifest.name).toBe('my-awesome-skill');
    });

    it('manifest description comes from skill frontmatter', async () => {
      const skillDir = await createSkillDir(tempDir, 'described-skill', {
        description: 'A skill with a custom description',
      });
      const outputPath = join(outputDir, 'described-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'described-skill', outputPath);

      expect(manifest.description).toBe('A skill with a custom description');
    });

    it('manifest createdAt is a valid ISO 8601 timestamp', async () => {
      const skillDir = await createSkillDir(tempDir, 'timed-skill');
      const outputPath = join(outputDir, 'timed-skill.tar.gz');

      const before = new Date().toISOString();
      const manifest = await packSkill(skillDir, 'timed-skill', outputPath);
      const after = new Date().toISOString();

      // Verify it's a valid ISO date
      const parsed = new Date(manifest.createdAt);
      expect(parsed.toISOString()).toBe(manifest.createdAt);

      // Verify it's within the test execution window
      expect(manifest.createdAt >= before).toBe(true);
      expect(manifest.createdAt <= after).toBe(true);
    });

    it('manifest files array lists all files in the archive', async () => {
      const skillDir = await createSkillDir(tempDir, 'listed-skill');
      const outputPath = join(outputDir, 'listed-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'listed-skill', outputPath);

      expect(manifest.files).toContain('manifest.json');
      expect(manifest.files).toContain('listed-skill/SKILL.md');
      expect(manifest.files.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('archive creation tests', () => {
    it('output file exists and is a valid .tar.gz (gzip magic bytes)', async () => {
      const skillDir = await createSkillDir(tempDir, 'archive-skill');
      const outputPath = join(outputDir, 'archive-skill.tar.gz');

      await packSkill(skillDir, 'archive-skill', outputPath);

      const buffer = await readFile(outputPath);
      expect(buffer.length).toBeGreaterThan(0);

      // Gzip magic bytes: 0x1f 0x8b
      expect(buffer[0]).toBe(0x1f);
      expect(buffer[1]).toBe(0x8b);
    });

    it('simple skill produces archive with manifest.json + skill-name/SKILL.md', async () => {
      const skillDir = await createSkillDir(tempDir, 'simple-skill');
      const outputPath = join(outputDir, 'simple-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'simple-skill', outputPath);

      // Simple skill has exactly manifest.json + skill-name/SKILL.md
      expect(manifest.files).toEqual(
        expect.arrayContaining(['manifest.json', 'simple-skill/SKILL.md']),
      );
      expect(manifest.files).toHaveLength(2);
    });

    it('progressive disclosure skill produces archive with all files under skill-name/', async () => {
      const skillDir = await createSkillDir(tempDir, 'progressive-skill', {
        body: '# Progressive\n\nSee @references/details.md for more.',
        references: [
          { filename: 'details.md', content: '# Details\n\nExtended content here.' },
          { filename: 'examples.md', content: '# Examples\n\nUsage examples.' },
        ],
      });
      const outputPath = join(outputDir, 'progressive-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'progressive-skill', outputPath);

      expect(manifest.files).toContain('manifest.json');
      expect(manifest.files).toContain('progressive-skill/SKILL.md');
      expect(manifest.files).toContain('progressive-skill/references/details.md');
      expect(manifest.files).toContain('progressive-skill/references/examples.md');
      expect(manifest.files).toHaveLength(4);
    });
  });

  describe('portable format tests', () => {
    it('packaged SKILL.md uses portable format (extension fields stripped)', async () => {
      const skillDir = await createSkillDir(tempDir, 'portable-skill', {
        description: 'A portable skill',
        extensionFields: {
          'user-invocable': true,
          'disable-model-invocation': false,
          'argument-hint': 'some hint',
          model: 'claude-sonnet-4-20250514',
          context: 'fork',
          metadata: {
            extensions: {
              'gsd-skill-creator': {
                enabled: true,
                version: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            },
          },
        },
      });
      const outputPath = join(outputDir, 'portable-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'portable-skill', outputPath);

      // Verify the archive was created
      expect(manifest.formatVersion).toBe(1);

      // To verify portable format, we need to extract and check the content.
      // We'll use a decompression approach to read the tar.gz.
      const { createGunzip } = await import('zlib');
      const { Readable } = await import('stream');
      const archiveBuffer = await readFile(outputPath);

      // Decompress gzip
      const decompressed = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const gunzip = createGunzip();
        gunzip.on('data', (chunk: Buffer) => chunks.push(chunk));
        gunzip.on('end', () => resolve(Buffer.concat(chunks)));
        gunzip.on('error', reject);
        Readable.from(archiveBuffer).pipe(gunzip);
      });

      // Parse tar: find SKILL.md entry
      // TAR format: 512-byte header blocks followed by file content padded to 512 bytes
      let offset = 0;
      let skillContent: string | null = null;

      while (offset < decompressed.length) {
        const header = decompressed.subarray(offset, offset + 512);

        // Check for end-of-archive marker (512 null bytes)
        if (header.every((b) => b === 0)) break;

        // Extract filename (bytes 0-99, null-terminated)
        const nameEnd = header.indexOf(0);
        const name = header.subarray(0, Math.min(nameEnd, 100)).toString('utf-8');

        // Extract file size (bytes 124-135, octal ASCII)
        const sizeStr = header.subarray(124, 136).toString('utf-8').trim();
        const size = parseInt(sizeStr, 8) || 0;

        offset += 512; // Move past header

        if (name === 'portable-skill/SKILL.md' || name === './portable-skill/SKILL.md') {
          skillContent = decompressed.subarray(offset, offset + size).toString('utf-8');
          break;
        }

        // Skip to next 512-byte boundary
        offset += Math.ceil(size / 512) * 512;
      }

      expect(skillContent).not.toBeNull();

      // Parse the extracted SKILL.md frontmatter
      const parsed = matter(skillContent!);
      const fm = parsed.data;

      // Portable format should have name and description
      expect(fm.name).toBe('portable-skill');
      expect(fm.description).toBe('A portable skill');

      // Extension fields should be stripped
      expect(fm['user-invocable']).toBeUndefined();
      expect(fm['disable-model-invocation']).toBeUndefined();
      expect(fm['argument-hint']).toBeUndefined();
      expect(fm.model).toBeUndefined();
      expect(fm.context).toBeUndefined();
      expect(fm.metadata).toBeUndefined();
    });

    it('packaged SKILL.md converts allowed-tools to space-delimited string', async () => {
      const skillDir = await createSkillDir(tempDir, 'tools-skill', {
        description: 'Skill with tools',
        allowedTools: ['Read', 'Write', 'Bash'],
      });
      const outputPath = join(outputDir, 'tools-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'tools-skill', outputPath);
      expect(manifest.formatVersion).toBe(1);

      // Extract and verify SKILL.md
      const { createGunzip } = await import('zlib');
      const { Readable } = await import('stream');
      const archiveBuffer = await readFile(outputPath);

      const decompressed = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const gunzip = createGunzip();
        gunzip.on('data', (chunk: Buffer) => chunks.push(chunk));
        gunzip.on('end', () => resolve(Buffer.concat(chunks)));
        gunzip.on('error', reject);
        Readable.from(archiveBuffer).pipe(gunzip);
      });

      // Parse tar to find SKILL.md
      let offset = 0;
      let skillContent: string | null = null;

      while (offset < decompressed.length) {
        const header = decompressed.subarray(offset, offset + 512);
        if (header.every((b) => b === 0)) break;

        const nameEnd = header.indexOf(0);
        const name = header.subarray(0, Math.min(nameEnd, 100)).toString('utf-8');
        const sizeStr = header.subarray(124, 136).toString('utf-8').trim();
        const size = parseInt(sizeStr, 8) || 0;

        offset += 512;

        if (name === 'tools-skill/SKILL.md' || name === './tools-skill/SKILL.md') {
          skillContent = decompressed.subarray(offset, offset + size).toString('utf-8');
          break;
        }

        offset += Math.ceil(size / 512) * 512;
      }

      expect(skillContent).not.toBeNull();

      const parsed = matter(skillContent!);
      // Per agentskills.io spec, allowed-tools in portable format is space-delimited string
      expect(parsed.data['allowed-tools']).toBe('Read Write Bash');
    });
  });

  // ========================================================================
  // YAML safety validation (72-02)
  // ========================================================================

  describe('YAML safety validation', () => {
    it('rejects skill with !!js/function in frontmatter', async () => {
      const skillDir = join(tempDir, 'evil-func');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        [
          '---',
          'name: evil-func',
          'description: !!js/function "function() { return 1; }"',
          '---',
          'body content',
        ].join('\n'),
        'utf-8',
      );
      const outputPath = join(outputDir, 'evil-func.tar.gz');

      await expect(
        packSkill(skillDir, 'evil-func', outputPath),
      ).rejects.toThrow(/[Dd]angerous YAML tag/);
    });

    it('rejects skill with missing required name field', async () => {
      const skillDir = join(tempDir, 'no-name');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        [
          '---',
          'description: A valid description',
          '---',
          'body content',
        ].join('\n'),
        'utf-8',
      );
      const outputPath = join(outputDir, 'no-name.tar.gz');

      await expect(
        packSkill(skillDir, 'no-name', outputPath),
      ).rejects.toThrow(/name/i);
    });

    it('rejects skill with wrong type for description', async () => {
      const skillDir = join(tempDir, 'bad-desc');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        [
          '---',
          'name: bad-desc',
          'description: 42',
          '---',
          'body content',
        ].join('\n'),
        'utf-8',
      );
      const outputPath = join(outputDir, 'bad-desc.tar.gz');

      await expect(
        packSkill(skillDir, 'bad-desc', outputPath),
      ).rejects.toThrow();
    });

    it('succeeds for valid skill (regression check)', async () => {
      const skillDir = await createSkillDir(tempDir, 'valid-skill', {
        description: 'A perfectly valid skill',
        body: '# Valid\n\nValid body.',
      });
      const outputPath = join(outputDir, 'valid-skill.tar.gz');

      const manifest = await packSkill(skillDir, 'valid-skill', outputPath);
      expect(manifest.formatVersion).toBe(1);
      expect(manifest.name).toBe('valid-skill');
    });
  });
});
