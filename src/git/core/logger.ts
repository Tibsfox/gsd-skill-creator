/**
 * JSONL operation logger for sc-git.
 *
 * Appends structured log entries to operations.jsonl for every
 * git operation, providing a complete audit trail with before/after
 * state snapshots for debugging and accountability.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GitOperationLog, GitStateReport } from '../types.js';

/**
 * Append a git operation log entry to the JSONL log file.
 *
 * Creates the config directory and operations.jsonl file if they
 * do not exist. Each entry is a single JSON line containing the
 * operation name, commands executed, before/after state, and success status.
 *
 * @param configDir - Path to the .sc-git configuration directory
 * @param operation - Name of the operation (e.g. 'sync', 'merge', 'install')
 * @param commands - Git commands that were executed
 * @param stateBefore - Repository state before the operation
 * @param stateAfter - Repository state after the operation
 * @param success - Whether the operation completed successfully
 * @param error - Optional error message if the operation failed
 */
export async function logOperation(
  configDir: string,
  operation: string,
  commands: string[],
  stateBefore: GitStateReport,
  stateAfter: GitStateReport,
  success: boolean,
  error?: string,
): Promise<void> {
  const entry: GitOperationLog = {
    timestamp: new Date().toISOString(),
    operation,
    commands,
    stateBefore,
    stateAfter,
    success,
  };

  if (error !== undefined) {
    entry.error = error;
  }

  // Ensure config directory exists
  fs.mkdirSync(configDir, { recursive: true });

  // Append JSONL entry
  const logPath = path.join(configDir, 'operations.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
}
