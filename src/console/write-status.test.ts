/**
 * Integration tests for write-status.sh bash script.
 *
 * Covers PICKUP-03 (status update to outbox/status/current.json):
 * - Creates/overwrites outbox/status/current.json
 * - JSON contains required fields
 * - Exits 0 on successful write
 * - Creates outbox/status/ directory if it doesn't exist
 * - Overwrites existing current.json with new data
 * - Exits 1 when phase argument is missing
 * - Exits 1 when status argument is missing
 * - progress field is a number (not a string)
 *
 * @module console/write-status.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the write-status.sh script. */
const scriptPath = join(__dirname, '..', '..', 'scripts', 'console', 'write-status.sh');

/** Run write-status.sh with the given arguments and return exit code + output. */
function runWriteStatus(
  basePath: string,
  ...args: string[]
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      scriptPath,
      [basePath, ...args],
      { timeout: 5000 },
      (error, stdout, stderr) => {
        resolve({
          code: error ? 1 : 0,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      },
    );
  });
}

// ============================================================================
// Test suite
// ============================================================================

describe('write-status.sh', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'write-status-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // 1. Creates/overwrites outbox/status/current.json
  // --------------------------------------------------------------------------

  it('creates outbox/status/current.json', async () => {
    const result = await runWriteStatus(tmpDir, '130', '02', 'executing', '50');
    expect(result.code).toBe(0);

    const statusFile = join(tmpDir, '.planning', 'console', 'outbox', 'status', 'current.json');
    expect(existsSync(statusFile)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. JSON contains phase, plan, status, progress, and updated_at fields
  // --------------------------------------------------------------------------

  it('contains phase, plan, status, progress, and updated_at fields', async () => {
    await runWriteStatus(tmpDir, '130', '02', 'executing', '75');

    const statusFile = join(tmpDir, '.planning', 'console', 'outbox', 'status', 'current.json');
    const content = JSON.parse(readFileSync(statusFile, 'utf-8'));

    expect(content).toHaveProperty('phase', '130');
    expect(content).toHaveProperty('plan', '02');
    expect(content).toHaveProperty('status', 'executing');
    expect(content).toHaveProperty('progress', 75);
    expect(content).toHaveProperty('updated_at');
  });

  // --------------------------------------------------------------------------
  // 3. Exits 0 on successful write
  // --------------------------------------------------------------------------

  it('exits 0 on successful write', async () => {
    const result = await runWriteStatus(tmpDir, '130', '01', 'planning', '10');
    expect(result.code).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 4. Creates outbox/status/ directory if it doesn't exist
  // --------------------------------------------------------------------------

  it('creates outbox/status/ directory if it does not exist', async () => {
    // tmpDir has no .planning/console/ structure
    const result = await runWriteStatus(tmpDir, '130', '01', 'idle', '0');
    expect(result.code).toBe(0);

    const statusDir = join(tmpDir, '.planning', 'console', 'outbox', 'status');
    expect(existsSync(statusDir)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 5. Overwrites existing current.json with new data (not append)
  // --------------------------------------------------------------------------

  it('overwrites existing current.json with new data', async () => {
    // First write
    await runWriteStatus(tmpDir, '130', '01', 'planning', '10');

    const statusFile = join(tmpDir, '.planning', 'console', 'outbox', 'status', 'current.json');
    const first = JSON.parse(readFileSync(statusFile, 'utf-8'));
    expect(first.status).toBe('planning');

    // Second write -- should overwrite
    await runWriteStatus(tmpDir, '130', '02', 'executing', '50');

    const second = JSON.parse(readFileSync(statusFile, 'utf-8'));
    expect(second.status).toBe('executing');
    expect(second.plan).toBe('02');
    expect(second.progress).toBe(50);
  });

  // --------------------------------------------------------------------------
  // 6. Exits 1 when phase argument is missing
  // --------------------------------------------------------------------------

  it('exits 1 when phase argument is missing', async () => {
    // Only basePath, no phase or other args
    const result = await runWriteStatus(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 7. Exits 1 when status argument is missing
  // --------------------------------------------------------------------------

  it('exits 1 when status argument is missing', async () => {
    // basePath + phase + plan, but no status
    const result = await runWriteStatus(tmpDir, '130', '02');
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 8. progress field is a number (not a string) in the output JSON
  // --------------------------------------------------------------------------

  it('progress field is a number, not a string', async () => {
    await runWriteStatus(tmpDir, '130', '02', 'verifying', '99');

    const statusFile = join(tmpDir, '.planning', 'console', 'outbox', 'status', 'current.json');
    const content = JSON.parse(readFileSync(statusFile, 'utf-8'));

    expect(typeof content.progress).toBe('number');
    expect(content.progress).toBe(99);
  });
});
