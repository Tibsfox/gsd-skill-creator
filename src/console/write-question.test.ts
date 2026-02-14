/**
 * Integration tests for write-question.sh bash script.
 *
 * Covers PICKUP-02 (question emission to outbox/questions/):
 * - Creates a JSON file in outbox/questions/ directory
 * - JSON file contains required fields
 * - Filename follows timestamp-questionId pattern
 * - Exits 0 on successful write
 * - Creates outbox/questions/ directory if it doesn't exist
 * - Exits 1 when question_id argument is missing
 * - Exits 1 when question_text argument is missing
 * - Includes options array when options_json argument provided
 *
 * @module console/write-question.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the write-question.sh script. */
const scriptPath = join(__dirname, '..', '..', 'scripts', 'console', 'write-question.sh');

/** Run write-question.sh with the given arguments and return exit code + output. */
function runWriteQuestion(
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

describe('write-question.sh', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'write-question-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // 1. Creates a JSON file in outbox/questions/ directory
  // --------------------------------------------------------------------------

  it('creates a JSON file in outbox/questions/ directory', async () => {
    const result = await runWriteQuestion(tmpDir, 'q-001', 'Continue with phase?', 'binary');
    expect(result.code).toBe(0);

    const questionsDir = join(tmpDir, '.planning', 'console', 'outbox', 'questions');
    const files = readdirSync(questionsDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.json$/);
  });

  // --------------------------------------------------------------------------
  // 2. JSON file contains required fields
  // --------------------------------------------------------------------------

  it('contains question_id, text, type, timestamp, and status fields', async () => {
    await runWriteQuestion(tmpDir, 'q-002', 'Approve changes?', 'confirmation');

    const questionsDir = join(tmpDir, '.planning', 'console', 'outbox', 'questions');
    const files = readdirSync(questionsDir);
    const content = JSON.parse(readFileSync(join(questionsDir, files[0]), 'utf-8'));

    expect(content).toHaveProperty('question_id', 'q-002');
    expect(content).toHaveProperty('text', 'Approve changes?');
    expect(content).toHaveProperty('type', 'confirmation');
    expect(content).toHaveProperty('timestamp');
    expect(content).toHaveProperty('status', 'pending');
  });

  // --------------------------------------------------------------------------
  // 3. Filename follows pattern: {timestamp}-{question_id}.json
  // --------------------------------------------------------------------------

  it('filename contains the question_id and ends in .json', async () => {
    await runWriteQuestion(tmpDir, 'my-question', 'Pick a color', 'choice');

    const questionsDir = join(tmpDir, '.planning', 'console', 'outbox', 'questions');
    const files = readdirSync(questionsDir);
    expect(files[0]).toContain('my-question');
    expect(files[0]).toMatch(/\.json$/);
  });

  // --------------------------------------------------------------------------
  // 4. Exits 0 on successful write
  // --------------------------------------------------------------------------

  it('exits 0 on successful write', async () => {
    const result = await runWriteQuestion(tmpDir, 'q-003', 'Ready?', 'binary');
    expect(result.code).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 5. Creates outbox/questions/ directory if it doesn't exist
  // --------------------------------------------------------------------------

  it('creates outbox/questions/ directory if it does not exist', async () => {
    // tmpDir has no .planning/console/ structure at all
    const result = await runWriteQuestion(tmpDir, 'q-004', 'Create dirs?', 'binary');
    expect(result.code).toBe(0);

    const questionsDir = join(tmpDir, '.planning', 'console', 'outbox', 'questions');
    const files = readdirSync(questionsDir);
    expect(files).toHaveLength(1);
  });

  // --------------------------------------------------------------------------
  // 6. Exits 1 when question_id argument is missing
  // --------------------------------------------------------------------------

  it('exits 1 when question_id argument is missing', async () => {
    // Only basePath, no question_id or other args
    const result = await runWriteQuestion(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 7. Exits 1 when question_text argument is missing
  // --------------------------------------------------------------------------

  it('exits 1 when question_text argument is missing', async () => {
    // basePath + question_id, but no text
    const result = await runWriteQuestion(tmpDir, 'q-005');
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 8. Includes options array in JSON when options_json argument provided
  // --------------------------------------------------------------------------

  it('includes options array when options_json argument provided', async () => {
    const options = JSON.stringify(['option-a', 'option-b', 'option-c']);
    await runWriteQuestion(tmpDir, 'q-006', 'Pick one', 'choice', options);

    const questionsDir = join(tmpDir, '.planning', 'console', 'outbox', 'questions');
    const files = readdirSync(questionsDir);
    const content = JSON.parse(readFileSync(join(questionsDir, files[0]), 'utf-8'));

    expect(content).toHaveProperty('options');
    expect(content.options).toEqual(['option-a', 'option-b', 'option-c']);
  });
});
