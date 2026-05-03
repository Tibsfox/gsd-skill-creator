/**
 * C01 T2 + T4 — file walker + binary detection tests.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { walkProject, isBinary } from '../walk.js';

// ─── T2 file walker tests ─────────────────────────────────

describe('walkProject', () => {
  it('respects .gitignore — returns only non-ignored files', async () => {
    const fixtureRoot = new URL('./fixtures/simple-project', import.meta.url).pathname;
    const files = await walkProject(fixtureRoot, {});
    const rel = files.map(f => f.replace(fixtureRoot + '/', ''));
    expect(rel).toContain('src/index.ts');
    expect(rel).toContain('src/helper.ts');
    expect(rel).toContain('src/utils.ts');
    // .gitignore excludes dist/ and secret.ts
    expect(rel).not.toContain('dist/bundle.js');
    expect(rel).not.toContain('secret.ts');
    expect(rel.length).toBe(3);
  });

  it('excludes built-in defaults: node_modules', async () => {
    const tmp = join(tmpdir(), `walker-test-${Date.now()}`);
    await mkdir(join(tmp, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(tmp, 'node_modules', 'pkg', 'index.js'), 'module.exports = {}');
    await writeFile(join(tmp, 'index.ts'), 'export const x = 1;');

    try {
      const files = await walkProject(tmp, {});
      const rel = files.map(f => f.replace(tmp + '/', ''));
      expect(rel).toContain('index.ts');
      expect(rel.every(f => !f.includes('node_modules'))).toBe(true);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('excludes additional built-in defaults: target/, dist/, .git/', async () => {
    const tmp = join(tmpdir(), `walker-defaults-${Date.now()}`);
    await mkdir(join(tmp, 'target', 'debug'), { recursive: true });
    await mkdir(join(tmp, 'dist'), { recursive: true });
    await mkdir(join(tmp, '.git'), { recursive: true });
    await writeFile(join(tmp, 'target', 'debug', 'main'), 'binary');
    await writeFile(join(tmp, 'dist', 'bundle.js'), 'bundled');
    await writeFile(join(tmp, '.git', 'config'), 'config');
    await writeFile(join(tmp, 'main.ts'), 'export const x = 1;');

    try {
      const files = await walkProject(tmp, {});
      const rel = files.map(f => f.replace(tmp + '/', ''));
      expect(rel).toContain('main.ts');
      expect(rel.every(f => !f.startsWith('target/') && !f.startsWith('dist/') && !f.startsWith('.git/'))).toBe(true);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('does not follow symlink loops', async () => {
    const tmp = join(tmpdir(), `walker-symlink-${Date.now()}`);
    await mkdir(join(tmp, 'real'), { recursive: true });
    await writeFile(join(tmp, 'real', 'file.ts'), 'export const x = 1;');
    // Create circular symlink: real/link -> .. (points back to tmp root)
    try {
      await symlink('..', join(tmp, 'real', 'link'));
    } catch {
      // symlink may already exist on retried runs
    }

    const done = new Promise<string[]>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('symlink loop timeout')), 5000);
      walkProject(tmp, {}).then(files => {
        clearTimeout(timeout);
        resolve(files);
      }).catch(reject);
    });

    const files = await done;
    expect(files.some(f => f.includes('file.ts'))).toBe(true);

    await rm(tmp, { recursive: true, force: true });
  });

  it('respects additional excludePatterns passed as options', async () => {
    const tmp = join(tmpdir(), `walker-exclude-${Date.now()}`);
    await mkdir(tmp, { recursive: true });
    await writeFile(join(tmp, 'a.ts'), 'export const a = 1;');
    await writeFile(join(tmp, 'b.generated.ts'), 'export const b = 2;');

    try {
      const files = await walkProject(tmp, { excludePatterns: ['*.generated.ts'] });
      const rel = files.map(f => f.replace(tmp + '/', ''));
      expect(rel).toContain('a.ts');
      expect(rel).not.toContain('b.generated.ts');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('respects .gsdignore', async () => {
    const tmp = join(tmpdir(), `walker-gsdignore-${Date.now()}`);
    await mkdir(tmp, { recursive: true });
    await writeFile(join(tmp, '.gsdignore'), 'ignored.ts\n');
    await writeFile(join(tmp, 'kept.ts'), 'export const kept = true;');
    await writeFile(join(tmp, 'ignored.ts'), 'export const ignored = true;');

    try {
      const files = await walkProject(tmp, {});
      const rel = files.map(f => f.replace(tmp + '/', ''));
      expect(rel).toContain('kept.ts');
      expect(rel).not.toContain('ignored.ts');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('empty directory → returns empty array without crash', async () => {
    const tmp = join(tmpdir(), `walker-empty-${Date.now()}`);
    await mkdir(tmp, { recursive: true });
    try {
      const files = await walkProject(tmp, {});
      expect(files).toEqual([]);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});

// ─── T4 binary detection tests ───────────────────────────

describe('isBinary', () => {
  it('plain text file → false', async () => {
    const fixtureRoot = new URL('./fixtures/simple-project', import.meta.url).pathname;
    const result = await isBinary(join(fixtureRoot, 'src/index.ts'));
    expect(result).toBe(false);
  });

  it('random-bytes fixture → true', async () => {
    const fixtureRoot = new URL('./fixtures/binary-project', import.meta.url).pathname;
    const result = await isBinary(join(fixtureRoot, 'binary.bin'));
    expect(result).toBe(true);
  });

  it('empty file → false (boundary case)', async () => {
    const tmp = join(tmpdir(), `binary-empty-${Date.now()}.txt`);
    await writeFile(tmp, '');
    try {
      const result = await isBinary(tmp);
      expect(result).toBe(false);
    } finally {
      await rm(tmp, { force: true });
    }
  });
});
