/**
 * TDD tests for the console directory creation function.
 *
 * Covers BRIDGE-01 (directory structure):
 * - Creates all required directories
 * - Idempotent (calling twice does not error)
 * - Nested structure correct (inbox/outbox grouping)
 * - Returns the root console path
 *
 * @module console/directory.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureConsoleDirectory } from './directory.js';
import { CONSOLE_DIRS } from './types.js';

describe('ensureConsoleDirectory', () => {
  const tempDirs: string[] = [];

  function createTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'console-test-'));
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
  // Creates all required directories
  // --------------------------------------------------------------------------

  it('creates all 8 required subdirectories', async () => {
    const base = createTempDir();
    await ensureConsoleDirectory(base);

    // Check every directory in CONSOLE_DIRS exists
    for (const relPath of Object.values(CONSOLE_DIRS)) {
      const fullPath = join(base, relPath);
      expect(existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // Idempotent -- calling twice does not error
  // --------------------------------------------------------------------------

  it('is idempotent -- calling twice does not error', async () => {
    const base = createTempDir();

    // First call creates directories
    await ensureConsoleDirectory(base);

    // Second call should not throw
    await expect(ensureConsoleDirectory(base)).resolves.toBeDefined();

    // All directories still exist
    for (const relPath of Object.values(CONSOLE_DIRS)) {
      expect(existsSync(join(base, relPath))).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // Creates nested structure correctly
  // --------------------------------------------------------------------------

  it('creates nested structure correctly', async () => {
    const base = createTempDir();
    await ensureConsoleDirectory(base);

    // inbox contains pending and acknowledged
    expect(existsSync(join(base, CONSOLE_DIRS.inboxPending))).toBe(true);
    expect(existsSync(join(base, CONSOLE_DIRS.inboxAcknowledged))).toBe(true);

    // outbox contains questions, status, notifications
    expect(existsSync(join(base, CONSOLE_DIRS.outboxQuestions))).toBe(true);
    expect(existsSync(join(base, CONSOLE_DIRS.outboxStatus))).toBe(true);
    expect(existsSync(join(base, CONSOLE_DIRS.outboxNotifications))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Returns the root console path
  // --------------------------------------------------------------------------

  it('returns the absolute path to the console root directory', async () => {
    const base = createTempDir();
    const result = await ensureConsoleDirectory(base);

    expect(result).toBe(join(base, CONSOLE_DIRS.root));
    expect(existsSync(result)).toBe(true);
  });
});
