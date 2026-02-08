/**
 * Tests for the GSD filesystem scanner.
 *
 * Uses temporary directories as fixtures to test:
 * - scanDirectory: file listing with extension filtering
 * - scanDirectoryForDirs: subdirectory listing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { scanDirectory, scanDirectoryForDirs } from './scanner.js';

describe('scanDirectory', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-scanner-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns only .md files', async () => {
    await writeFile(join(testDir, 'a.md'), 'content a');
    await writeFile(join(testDir, 'b.md'), 'content b');
    await writeFile(join(testDir, 'c.txt'), 'content c');
    await writeFile(join(testDir, 'd.bak'), 'content d');

    const result = await scanDirectory(testDir);
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.endsWith('.md'))).toBe(true);
  });

  it('filters with custom extension', async () => {
    await writeFile(join(testDir, 'a.json'), '{}');
    await writeFile(join(testDir, 'b.md'), 'content');

    const result = await scanDirectory(testDir, '.json');
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('a.json');
  });

  it('returns absolute paths', async () => {
    await writeFile(join(testDir, 'file.md'), 'content');

    const result = await scanDirectory(testDir);
    expect(result).toHaveLength(1);
    expect(result[0].startsWith('/')).toBe(true);
    expect(result[0]).toBe(join(testDir, 'file.md'));
  });

  it('returns empty array for non-existent directory', async () => {
    const result = await scanDirectory('/tmp/gsd-does-not-exist-' + Date.now());
    expect(result).toEqual([]);
  });

  it('returns empty array for empty directory', async () => {
    const result = await scanDirectory(testDir);
    expect(result).toEqual([]);
  });

  it('ignores subdirectories', async () => {
    await writeFile(join(testDir, 'file.md'), 'content');
    await mkdir(join(testDir, 'subdir'));

    const result = await scanDirectory(testDir);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('file.md');
  });

  it('filters .bak files when scanning for .md', async () => {
    await writeFile(join(testDir, 'file.md'), 'content');
    await writeFile(join(testDir, 'file.md.bak'), 'backup');

    const result = await scanDirectory(testDir);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('file.md');
    expect(result[0]).not.toContain('.bak');
  });
});

describe('scanDirectoryForDirs', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-scanner-dirs-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns only directories', async () => {
    await mkdir(join(testDir, 'agents'));
    await mkdir(join(testDir, 'commands'));
    await writeFile(join(testDir, 'file.md'), 'content');
    await writeFile(join(testDir, 'config.json'), '{}');

    const result = await scanDirectoryForDirs(testDir);
    expect(result).toHaveLength(2);
    expect(result.sort()).toEqual(['agents', 'commands']);
  });

  it('returns empty array for non-existent directory', async () => {
    const result = await scanDirectoryForDirs(
      '/tmp/gsd-does-not-exist-dirs-' + Date.now()
    );
    expect(result).toEqual([]);
  });
});
