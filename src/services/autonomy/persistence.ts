/**
 * Persistence layer for the autonomy execution engine.
 *
 * Provides atomic write (temp file + rename) and validated read
 * for execution-state.json. Ensures execution state survives
 * process crashes and restarts.
 *
 * Uses real filesystem I/O (no abstractions) for reliability.
 * Reads are validated against the ExecutionState Zod schema.
 *
 * @module autonomy/persistence
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ExecutionState } from './types.js';
import { validateExecutionState, type ValidationResult } from './schema-validation.js';

// ============================================================================
// Write
// ============================================================================

/**
 * Write execution state to a JSON file atomically.
 *
 * Uses the temp-file-then-rename pattern to prevent corruption:
 * 1. Serialize state as JSON with 2-space indentation
 * 2. Write to `filePath.tmp`
 * 3. Rename `filePath.tmp` to `filePath` (atomic on most filesystems)
 *
 * Creates parent directories if they don't exist.
 *
 * @param state - The execution state to persist
 * @param filePath - Absolute path to the target JSON file
 */
export async function writeExecutionState(
  state: ExecutionState,
  filePath: string,
): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });

  const json = JSON.stringify(state, null, 2) + '\n';
  const tmpPath = filePath + '.tmp';

  await writeFile(tmpPath, json, 'utf-8');
  await rename(tmpPath, filePath);
}

// ============================================================================
// Read
// ============================================================================

/**
 * Read and validate execution state from a JSON file.
 *
 * Handles three failure modes gracefully:
 * 1. File not found (ENOENT) -> structured error
 * 2. Invalid JSON syntax -> structured error
 * 3. Valid JSON but invalid schema -> field-level errors from Zod
 *
 * On success, returns the parsed ExecutionState with Zod defaults applied.
 *
 * @param filePath - Absolute path to the execution-state.json file
 * @returns Structured validation result
 */
export async function readExecutionState(
  filePath: string,
): Promise<ValidationResult<ExecutionState>> {
  let raw: string;

  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errors: [`File not found or unreadable: ${message}`],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errors: [`JSON parse error: ${message}`],
    };
  }

  return validateExecutionState(parsed);
}
