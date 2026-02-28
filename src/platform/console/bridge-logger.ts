/**
 * JSONL append logger for bridge write operations.
 *
 * Records every browser-to-filesystem write (success or failure) to
 * console/logs/bridge.jsonl. Each line is a self-contained JSON object
 * for easy parsing and append-only safety.
 *
 * Concurrent writes are safe because appendFile is atomic for small
 * writes on most filesystems, and each entry is a single line.
 *
 * @module console/bridge-logger
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CONSOLE_DIRS } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single log entry for a bridge write operation. */
export interface BridgeLogEntry {
  /** ISO 8601 timestamp of the operation. */
  timestamp: string;
  /** Target filename. */
  filename: string;
  /** Target subdirectory under .planning/console/. */
  subdirectory: string;
  /** Bytes of content written (0 for errors). */
  contentSize: number;
  /** Whether the write succeeded or failed. */
  status: 'success' | 'error';
  /** Error reason if status === 'error'. */
  error?: string;
  /** Optional source identifier. */
  source?: string;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

/**
 * Append-only JSONL logger for bridge operations.
 *
 * Usage:
 * ```typescript
 * const logger = new BridgeLogger('/path/to/project');
 * await logger.log({ timestamp: new Date().toISOString(), ... });
 * ```
 */
export class BridgeLogger {
  private readonly logFilePath: string;
  private readonly logsDir: string;
  private dirEnsured = false;

  /**
   * @param basePath - Project root (parent of .planning/).
   */
  constructor(basePath: string) {
    this.logsDir = join(basePath, CONSOLE_DIRS.logs);
    this.logFilePath = join(this.logsDir, 'bridge.jsonl');
  }

  /**
   * Append a log entry to bridge.jsonl.
   *
   * Creates the logs directory and file if they don't exist.
   * Each entry is written as a single JSON line followed by a newline.
   */
  async log(entry: BridgeLogEntry): Promise<void> {
    if (!this.dirEnsured) {
      await mkdir(this.logsDir, { recursive: true });
      this.dirEnsured = true;
    }

    const line = JSON.stringify(entry) + '\n';
    await appendFile(this.logFilePath, line, 'utf-8');
  }
}
