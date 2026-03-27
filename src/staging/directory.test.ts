/**
 * TDD tests for staging directory creation function.
 *
 * Covers ensureStagingDirectory: creates subdirectories,
 * idempotent, nested structure, returns root path,
 * does not create queue.jsonl.
 *
 * @module staging/directory.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureStagingDirectory } from './directory.js';
import { STAGING_DIRS } from './types.js';

describe('ensureStagingDirectory', () => {
  const tempDirs: string[] = [];

  function createTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'staging-test-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  // --------------------------------------------------------------------------
  // Creates all 5 staging subdirectories
  // --------------------------------------------------------------------------

  it('creates all 5 staging subdirectories', async () => {
    const base = createTempDir();
    await ensureStagingDirectory(base);

    expect(existsSync(join(base, STAGING_DIRS.inbox))).toBe(true);
    expect(existsSync(join(base, STAGING_DIRS.checking))).toBe(true);
    expect(existsSync(join(base, STAGING_DIRS.attention))).toBe(true);
    expect(existsSync(join(base, STAGING_DIRS.ready))).toBe(true);
    expect(existsSync(join(base, STAGING_DIRS.aside))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Idempotent -- calling twice does not error
  // --------------------------------------------------------------------------

  it('is idempotent -- calling twice does not error', async () => {
    const base = createTempDir();

    await ensureStagingDirectory(base);
    await expect(ensureStagingDirectory(base)).resolves.toBeDefined();

    // All directories still exist
    expect(existsSync(join(base, STAGING_DIRS.inbox))).toBe(true);
    expect(existsSync(join(base, STAGING_DIRS.checking))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Creates nested structure under .planning/staging/
  // --------------------------------------------------------------------------

  it('creates nested structure under .planning/staging/', async () => {
    const base = createTempDir();
    await ensureStagingDirectory(base);

    // Root staging directory exists
    expect(existsSync(join(base, STAGING_DIRS.root))).toBe(true);

    // All subdirs are under root
    expect(existsSync(join(base, '.planning', 'staging', 'inbox'))).toBe(true);
    expect(existsSync(join(base, '.planning', 'staging', 'checking'))).toBe(true);
    expect(existsSync(join(base, '.planning', 'staging', 'attention'))).toBe(true);
    expect(existsSync(join(base, '.planning', 'staging', 'ready'))).toBe(true);
    expect(existsSync(join(base, '.planning', 'staging', 'aside'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Returns the absolute path to the staging root directory
  // --------------------------------------------------------------------------

  it('returns the absolute path to the staging root directory', async () => {
    const base = createTempDir();
    const result = await ensureStagingDirectory(base);

    expect(result).toBe(join(base, STAGING_DIRS.root));
    expect(existsSync(result)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Does NOT create queue.jsonl
  // --------------------------------------------------------------------------

  it('does NOT create queue.jsonl (file created by queue module later)', async () => {
    const base = createTempDir();
    await ensureStagingDirectory(base);

    expect(existsSync(join(base, STAGING_DIRS.queue))).toBe(false);
  });
});
