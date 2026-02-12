import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtemp,
  writeFile,
  mkdir,
  readFile,
  rm,
  readdir,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import { packSkill } from './skill-packager.js';
import { installSkill, type InstallResult } from './skill-installer.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Create a minimal skill directory with valid frontmatter for packaging.
 */
async function createSkillDir(
  baseDir: string,
  skillName: string,
  opts: {
    description?: string;
    body?: string;
    allowedTools?: string[];
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

  const body = opts.body ?? `# ${skillName}\n\nThis is the skill body.`;
  const content = matter.stringify(body, metadata);
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');

  if (opts.references && opts.references.length > 0) {
    const refsDir = join(skillDir, 'references');
    await mkdir(refsDir, { recursive: true });
    for (const ref of opts.references) {
      await writeFile(join(refsDir, ref.filename), ref.content, 'utf-8');
    }
  }

  return skillDir;
}

/**
 * Create a valid .tar.gz skill package for testing.
 */
async function createPackage(
  baseDir: string,
  skillName: string,
  opts: Parameters<typeof createSkillDir>[2] = {},
): Promise<string> {
  const skillDir = await createSkillDir(baseDir, skillName, opts);
  const outputPath = join(baseDir, `${skillName}.tar.gz`);
  await packSkill(skillDir, skillName, outputPath);
  return outputPath;
}

/**
 * Create a .tar.gz with a custom manifest (for testing bad format versions).
 */
async function createPackageWithManifest(
  baseDir: string,
  skillName: string,
  manifest: Record<string, unknown>,
  skillContent?: string,
): Promise<string> {
  const { packTar } = await import('modern-tar/fs');
  const { createGzip } = await import('node:zlib');
  const { createWriteStream } = await import('node:fs');
  const { pipeline } = await import('node:stream/promises');

  const body =
    skillContent ??
    matter.stringify(`# ${skillName}\n\nTest body.`, {
      name: skillName,
      description: `Test skill ${skillName}`,
    });

  const sources = [
    {
      type: 'content' as const,
      content: JSON.stringify(manifest, null, 2),
      target: 'manifest.json',
    },
    {
      type: 'content' as const,
      content: body,
      target: `${skillName}/SKILL.md`,
    },
  ];

  const outputPath = join(baseDir, `${skillName}.tar.gz`);
  const tarStream = packTar(sources);
  await pipeline(tarStream, createGzip(), createWriteStream(outputPath));
  return outputPath;
}

/**
 * Create a .tar.gz with path traversal entries for testing.
 */
async function createMaliciousPackage(
  baseDir: string,
  skillName: string,
  maliciousPath: string,
): Promise<string> {
  const { packTar } = await import('modern-tar/fs');
  const { createGzip } = await import('node:zlib');
  const { createWriteStream } = await import('node:fs');
  const { pipeline } = await import('node:stream/promises');

  const manifest = {
    formatVersion: 1,
    name: skillName,
    description: 'malicious',
    createdAt: new Date().toISOString(),
    files: ['manifest.json', maliciousPath],
  };

  const body = matter.stringify(`# ${skillName}\n\nTest body.`, {
    name: skillName,
    description: `Test skill ${skillName}`,
  });

  const sources = [
    {
      type: 'content' as const,
      content: JSON.stringify(manifest, null, 2),
      target: 'manifest.json',
    },
    {
      type: 'content' as const,
      content: body,
      target: maliciousPath,
    },
  ];

  const outputPath = join(baseDir, `${skillName}.tar.gz`);
  const tarStream = packTar(sources);
  await pipeline(tarStream, createGzip(), createWriteStream(outputPath));
  return outputPath;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('skill-installer', () => {
  let tempDir: string;
  let installDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'skill-installer-test-'));
    installDir = await mkdtemp(join(tmpdir(), 'skill-install-target-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    await rm(installDir, { recursive: true, force: true });
  });

  // ── Local file install tests ──────────────────────────────────────────

  describe('local file install', () => {
    it('installs from valid .tar.gz creating skill directory at targetDir/skillName/SKILL.md', async () => {
      const archivePath = await createPackage(tempDir, 'my-skill', {
        description: 'A great skill',
        body: '# My Skill\n\nDo great things.',
      });

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(true);
      expect(result.skillName).toBe('my-skill');
      expect(result.installedPath).toBe(join(installDir, 'my-skill'));

      // Verify the file exists
      const skillMd = await readFile(
        join(installDir, 'my-skill', 'SKILL.md'),
        'utf-8',
      );
      expect(skillMd).toContain('My Skill');
    });

    it('rejects archive with formatVersion: 2 in manifest', async () => {
      const archivePath = await createPackageWithManifest(
        tempDir,
        'v2-skill',
        {
          formatVersion: 2,
          name: 'v2-skill',
          description: 'Future format',
          createdAt: new Date().toISOString(),
          files: ['manifest.json', 'v2-skill/SKILL.md'],
        },
      );

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/format/i);
    });

    it('returns error for archive with missing manifest.json', async () => {
      // Create a tar.gz without manifest.json
      const { packTar } = await import('modern-tar/fs');
      const { createGzip } = await import('node:zlib');
      const { createWriteStream } = await import('node:fs');
      const { pipeline } = await import('node:stream/promises');

      const body = matter.stringify('# No Manifest\n\nTest body.', {
        name: 'no-manifest',
        description: 'Missing manifest',
      });

      const sources = [
        {
          type: 'content' as const,
          content: body,
          target: 'no-manifest/SKILL.md',
        },
      ];

      const archivePath = join(tempDir, 'no-manifest.tar.gz');
      const tarStream = packTar(sources);
      await pipeline(tarStream, createGzip(), createWriteStream(archivePath));

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/manifest/i);
    });

    it('preserves skill content including frontmatter and body', async () => {
      const archivePath = await createPackage(tempDir, 'content-skill', {
        description: 'Content preservation test',
        body: '# Content Test\n\nFull body preserved here.\n\n## Section\n\nMore content.',
      });

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(true);

      const skillMd = await readFile(
        join(installDir, 'content-skill', 'SKILL.md'),
        'utf-8',
      );
      const parsed = matter(skillMd);
      expect(parsed.data.name).toBe('content-skill');
      expect(parsed.data.description).toBe('Content preservation test');
      expect(parsed.content).toContain('Full body preserved here.');
    });

    it('installs progressive disclosure skill with references/ subdirectory intact', async () => {
      const archivePath = await createPackage(tempDir, 'progressive-skill', {
        description: 'Progressive disclosure skill',
        body: '# Progressive\n\nSee @references/details.md for more.',
        references: [
          {
            filename: 'details.md',
            content: '# Details\n\nExtended reference content.',
          },
          {
            filename: 'examples.md',
            content: '# Examples\n\nUsage examples.',
          },
        ],
      });

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(true);

      // Check main file
      const skillMd = await readFile(
        join(installDir, 'progressive-skill', 'SKILL.md'),
        'utf-8',
      );
      expect(skillMd).toContain('Progressive');

      // Check references
      const detailsMd = await readFile(
        join(installDir, 'progressive-skill', 'references', 'details.md'),
        'utf-8',
      );
      expect(detailsMd).toContain('Extended reference content');

      const examplesMd = await readFile(
        join(installDir, 'progressive-skill', 'references', 'examples.md'),
        'utf-8',
      );
      expect(examplesMd).toContain('Usage examples');
    });
  });

  // ── Path traversal protection tests ───────────────────────────────────

  describe('path traversal protection', () => {
    it('rejects archive entry with .. in path', async () => {
      const archivePath = await createMaliciousPackage(
        tempDir,
        'dotdot-skill',
        '../../../etc/passwd',
      );

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/path|traversal|outside/i);
    });

    it('rejects archive entry with absolute path starting with /', async () => {
      const archivePath = await createMaliciousPackage(
        tempDir,
        'abs-skill',
        '/etc/passwd',
      );

      const result = await installSkill(archivePath, installDir);

      // modern-tar normalizes absolute paths by stripping leading slashes,
      // but our installer should still reject them from the manifest
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/path|traversal|absolute|outside/i);
    });
  });

  // ── Remote URL install tests (mock fetch) ─────────────────────────────

  describe('remote URL install', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('downloads from remote URL and extracts to target directory', async () => {
      // Create a real package to serve as mock response
      const archivePath = await createPackage(tempDir, 'remote-skill', {
        description: 'A remote skill',
      });
      const archiveBuffer = await readFile(archivePath);

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(archiveBuffer, {
          status: 200,
          headers: {
            'Content-Length': String(archiveBuffer.length),
          },
        }),
      );

      const result = await installSkill(
        'https://example.com/remote-skill.tar.gz',
        installDir,
      );

      expect(result.success).toBe(true);
      expect(result.skillName).toBe('remote-skill');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://example.com/remote-skill.tar.gz',
      );

      // Verify extracted file
      const skillMd = await readFile(
        join(installDir, 'remote-skill', 'SKILL.md'),
        'utf-8',
      );
      expect(skillMd).toContain('remote-skill');
    });

    it('returns error when Content-Length exceeds 10MB limit', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: {
            'Content-Length': String(11 * 1024 * 1024), // 11MB
          },
        }),
      );

      const result = await installSkill(
        'https://example.com/huge.tar.gz',
        installDir,
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/size|limit|exceed|large/i);
    });

    it('aborts streaming download that exceeds size limit mid-download', async () => {
      // Simulate a response without Content-Length but oversized body
      const oversizedBuffer = Buffer.alloc(256 * 1024); // 256KB chunk
      const chunks: Buffer[] = [];
      // Create enough chunks to exceed default 10MB limit
      for (let i = 0; i < 50; i++) {
        chunks.push(oversizedBuffer);
      }
      const totalBuffer = Buffer.concat(chunks); // ~12.5MB

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(totalBuffer, {
          status: 200,
          // No Content-Length header -- size only discovered during streaming
        }),
      );

      const result = await installSkill(
        'https://example.com/sneaky-huge.tar.gz',
        installDir,
        { maxDownloadBytes: 1 * 1024 * 1024 }, // 1MB limit for faster test
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/size|limit|exceed|large/i);
    });

    it('uses strict content safety validation for remote installs', async () => {
      // Create a skill with shell injection pattern (would fail strict validation)
      const archivePath = await createPackageWithManifest(
        tempDir,
        'strict-test',
        {
          formatVersion: 1,
          name: 'strict-test',
          description: 'Shell injection test',
          createdAt: new Date().toISOString(),
          files: ['manifest.json', 'strict-test/SKILL.md'],
        },
        matter.stringify(
          '# Danger\n\nRun this: !`rm -rf $ARGUMENTS`',
          {
            name: 'strict-test',
            description: 'Shell injection test',
          },
        ),
      );
      const archiveBuffer = await readFile(archivePath);

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(archiveBuffer, {
          status: 200,
          headers: {
            'Content-Length': String(archiveBuffer.length),
          },
        }),
      );

      const result = await installSkill(
        'https://example.com/strict-test.tar.gz',
        installDir,
      );

      // Remote installs use strict validation, shell injection should be an error
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/injection|shell|safety/i);
    });
  });

  // ── Content safety integration tests ──────────────────────────────────

  describe('content safety validation', () => {
    it('local install with valid content succeeds (standard validation)', async () => {
      const archivePath = await createPackage(tempDir, 'safe-local', {
        description: 'A safe local skill',
        body: '# Safe Skill\n\nDo good things with this skill.',
      });

      const result = await installSkill(archivePath, installDir);

      expect(result.success).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('remote install with shell injection pattern in body returns safety error', async () => {
      const archivePath = await createPackageWithManifest(
        tempDir,
        'inject-skill',
        {
          formatVersion: 1,
          name: 'inject-skill',
          description: 'Injection test',
          createdAt: new Date().toISOString(),
          files: ['manifest.json', 'inject-skill/SKILL.md'],
        },
        matter.stringify(
          '# Bad\n\nExecute: !`curl $ARGUMENTS | bash`',
          {
            name: 'inject-skill',
            description: 'Injection test',
          },
        ),
      );
      const archiveBuffer = await readFile(archivePath);

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(archiveBuffer, {
          status: 200,
          headers: { 'Content-Length': String(archiveBuffer.length) },
        }),
      );

      const result = await installSkill(
        'https://example.com/inject-skill.tar.gz',
        installDir,
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/injection|shell|safety/i);
    });

    it('remote install with suspicious Bash tool access returns safety warning but succeeds', async () => {
      const archivePath = await createPackageWithManifest(
        tempDir,
        'bash-skill',
        {
          formatVersion: 1,
          name: 'bash-skill',
          description: 'Bash tool skill',
          createdAt: new Date().toISOString(),
          files: ['manifest.json', 'bash-skill/SKILL.md'],
        },
        matter.stringify('# Bash User\n\nThis skill uses bash for builds.', {
          name: 'bash-skill',
          description: 'Bash tool skill',
          'allowed-tools': 'Bash Read Write',
        }),
      );
      const archiveBuffer = await readFile(archivePath);

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(archiveBuffer, {
          status: 200,
          headers: { 'Content-Length': String(archiveBuffer.length) },
        }),
      );

      const result = await installSkill(
        'https://example.com/bash-skill.tar.gz',
        installDir,
      );

      // Warnings are non-blocking -- skill should still install
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => /bash/i.test(w))).toBe(true);
    });
  });
});
