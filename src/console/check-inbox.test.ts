/**
 * Integration tests for check-inbox.sh bash script.
 *
 * Covers BRIDGE-05 (session-side inbox polling):
 * - Exits 0 when pending messages exist
 * - Outputs JSON with message summaries
 * - Exits 1 when inbox is empty
 * - Exits 1 when inbox directory does not exist
 * - Moves messages from pending to acknowledged
 * - Handles multiple messages
 * - Ignores non-JSON files
 * - Handles malformed JSON gracefully
 *
 * @module console/check-inbox.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the check-inbox.sh script. */
const scriptPath = join(__dirname, '..', '..', 'scripts', 'console', 'check-inbox.sh');

/** Run check-inbox.sh with a given base path and return exit code + output. */
function runCheckInbox(basePath: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      scriptPath,
      [basePath],
      { timeout: 5000 },
      (error, stdout, stderr) => {
        resolve({
          code: (error as NodeJS.ErrnoException | null)?.code !== undefined
            ? (error as { code: number }).code
            : error
              ? 1
              : 0,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      },
    );
  });
}

/** Write a test message envelope JSON file to a directory. */
function writeTestMessage(dir: string, filename: string, envelope: object): void {
  writeFileSync(join(dir, filename), JSON.stringify(envelope, null, 2));
}

/** Create the inbox directory structure under a temp dir. */
function createInboxDirs(basePath: string): { pending: string; acknowledged: string } {
  const pending = join(basePath, '.planning', 'console', 'inbox', 'pending');
  const acknowledged = join(basePath, '.planning', 'console', 'inbox', 'acknowledged');
  mkdirSync(pending, { recursive: true });
  mkdirSync(acknowledged, { recursive: true });
  return { pending, acknowledged };
}

/** A valid message envelope for test reuse. */
const validMessage = {
  id: 'msg-20260213-001',
  type: 'milestone-submit',
  timestamp: '2026-02-13T14:30:00Z',
  source: 'dashboard',
  payload: { name: 'v2.0' },
};

const configUpdateMessage = {
  id: 'msg-20260213-002',
  type: 'config-update',
  timestamp: '2026-02-13T14:31:00Z',
  source: 'dashboard',
  payload: { key: 'theme', value: 'dark' },
};

const thirdMessage = {
  id: 'msg-20260213-003',
  type: 'question-response',
  timestamp: '2026-02-13T14:32:00Z',
  source: 'session',
  payload: { answer: 'yes' },
};

// ============================================================================
// Test suite
// ============================================================================

describe('check-inbox.sh', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'check-inbox-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // 1. Exits 0 when pending messages exist
  // --------------------------------------------------------------------------

  it('exits 0 when pending messages exist', async () => {
    const { pending } = createInboxDirs(tmpDir);
    writeTestMessage(pending, '1707849000000-milestone-submit.json', validMessage);

    const result = await runCheckInbox(tmpDir);
    expect(result.code).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 2. Outputs JSON with message summaries
  // --------------------------------------------------------------------------

  it('outputs JSON with message summaries', async () => {
    const { pending } = createInboxDirs(tmpDir);
    writeTestMessage(pending, '1707849000000-milestone-submit.json', validMessage);
    writeTestMessage(pending, '1707849001000-config-update.json', configUpdateMessage);

    const result = await runCheckInbox(tmpDir);
    expect(result.code).toBe(0);

    const output = JSON.parse(result.stdout);
    expect(output.count).toBe(2);
    expect(output.messages).toHaveLength(2);

    // Each message should have id, type, and filename
    for (const msg of output.messages) {
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('type');
      expect(msg).toHaveProperty('filename');
    }
  });

  // --------------------------------------------------------------------------
  // 3. Exits 1 when inbox is empty
  // --------------------------------------------------------------------------

  it('exits 1 when inbox is empty', async () => {
    createInboxDirs(tmpDir);
    // pending/ exists but is empty

    const result = await runCheckInbox(tmpDir);
    expect(result.code).toBe(1);
    expect(result.stdout.trim()).toBe('');
  });

  // --------------------------------------------------------------------------
  // 4. Exits 1 when inbox directory does not exist
  // --------------------------------------------------------------------------

  it('exits 1 when inbox directory does not exist', async () => {
    // tmpDir has no .planning/console/ at all
    const result = await runCheckInbox(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 5. Moves messages from pending to acknowledged
  // --------------------------------------------------------------------------

  it('moves messages from pending to acknowledged', async () => {
    const { pending, acknowledged } = createInboxDirs(tmpDir);
    const filename = '1707849000000-milestone-submit.json';
    writeTestMessage(pending, filename, validMessage);

    await runCheckInbox(tmpDir);

    // File should no longer be in pending
    expect(existsSync(join(pending, filename))).toBe(false);
    // File should be in acknowledged
    expect(existsSync(join(acknowledged, filename))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 6. Handles multiple messages
  // --------------------------------------------------------------------------

  it('handles multiple messages', async () => {
    const { pending, acknowledged } = createInboxDirs(tmpDir);
    writeTestMessage(pending, '1707849000000-milestone-submit.json', validMessage);
    writeTestMessage(pending, '1707849001000-config-update.json', configUpdateMessage);
    writeTestMessage(pending, '1707849002000-question-response.json', thirdMessage);

    const result = await runCheckInbox(tmpDir);
    expect(result.code).toBe(0);

    const output = JSON.parse(result.stdout);
    expect(output.count).toBe(3);
    expect(output.messages).toHaveLength(3);

    // All 3 files should be moved to acknowledged
    const ackFiles = readdirSync(acknowledged);
    expect(ackFiles).toHaveLength(3);

    // pending should be empty
    const pendingFiles = readdirSync(pending);
    expect(pendingFiles).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 7. Ignores non-JSON files
  // --------------------------------------------------------------------------

  it('ignores non-JSON files', async () => {
    const { pending } = createInboxDirs(tmpDir);
    writeFileSync(join(pending, 'notes.txt'), 'some text');
    writeTestMessage(pending, '1707849000000-milestone-submit.json', validMessage);

    const result = await runCheckInbox(tmpDir);
    expect(result.code).toBe(0);

    const output = JSON.parse(result.stdout);
    expect(output.count).toBe(1);

    // .txt file should still be in pending (not moved)
    expect(existsSync(join(pending, 'notes.txt'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. Handles malformed JSON gracefully
  // --------------------------------------------------------------------------

  it('handles malformed JSON gracefully', async () => {
    const { pending, acknowledged } = createInboxDirs(tmpDir);
    // Write a .json file with invalid JSON content
    writeFileSync(join(pending, 'bad-message.json'), '{not valid json!!!}');

    const result = await runCheckInbox(tmpDir);
    // Should not crash -- exits 1 because no valid messages found
    expect(result.code).toBe(1);

    // Malformed file should be moved to acknowledged to prevent infinite retry
    expect(existsSync(join(acknowledged, 'bad-message.json'))).toBe(true);
    expect(existsSync(join(pending, 'bad-message.json'))).toBe(false);
  });
});
