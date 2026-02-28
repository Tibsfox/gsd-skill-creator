/**
 * Append-only JSONL audit logger for the staging queue.
 *
 * Records every queue state change to queue.jsonl for full
 * traceability. Uses appendFile for atomic writes (one JSON
 * line per entry) and supports dependency injection for testing.
 *
 * @module staging/queue/audit-logger
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { join } from 'node:path';
import { STAGING_DIRS } from '../types.js';
import type { QueueAuditEntry } from './types.js';

// ============================================================================
// DI Interface
// ============================================================================

/** Dependency injection interface for filesystem operations. */
export interface AuditLoggerDeps {
  appendFile: (path: string, data: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  mkdir: (path: string, options?: { recursive: boolean }) => Promise<unknown>;
}

// ============================================================================
// Default deps (real filesystem)
// ============================================================================

const defaultDeps: AuditLoggerDeps = {
  appendFile: (path, data) => appendFile(path, data, 'utf-8'),
  readFile: (path) => readFile(path, 'utf-8'),
  mkdir: (path, options) => mkdir(path, options),
};

// ============================================================================
// Options
// ============================================================================

/** Options for appendAuditEntry. */
export interface AppendAuditOptions {
  /** Project root (parent of .planning/). */
  basePath: string;
}

/** Options for readAuditLog. */
export interface ReadAuditOptions {
  /** Project root (parent of .planning/). */
  basePath: string;
  /** Optional callback for malformed lines. */
  onError?: (line: string, error: Error) => void;
}

// ============================================================================
// Cached mkdir
// ============================================================================

/** Tracks whether directory has been ensured per basePath. */
const dirEnsuredCache = new Map<string, boolean>();

/**
 * Reset the directory cache. Useful for testing.
 * @internal
 */
export function _resetDirCache(): void {
  dirEnsuredCache.clear();
}

// ============================================================================
// Append
// ============================================================================

/**
 * Append a single audit entry to queue.jsonl.
 *
 * Creates the parent directory if it does not exist (cached).
 * Each entry is written as a single JSON line followed by a newline.
 *
 * @param entry - The audit entry to append.
 * @param options - Options including basePath.
 * @param deps - Optional DI for filesystem operations.
 */
export async function appendAuditEntry(
  entry: QueueAuditEntry,
  options: AppendAuditOptions,
  deps: AuditLoggerDeps = defaultDeps,
): Promise<void> {
  const filePath = join(options.basePath, STAGING_DIRS.queue);

  // Ensure directory exists (cached per basePath)
  if (!dirEnsuredCache.get(options.basePath)) {
    await deps.mkdir(dirname(filePath), { recursive: true });
    dirEnsuredCache.set(options.basePath, true);
  }

  const line = JSON.stringify(entry) + '\n';
  await deps.appendFile(filePath, line);
}

// ============================================================================
// Read
// ============================================================================

/**
 * Read all audit entries from queue.jsonl.
 *
 * Parses each line as JSON. Skips empty lines and malformed lines
 * (calling onError if provided). Returns empty array for nonexistent
 * or empty files.
 *
 * @param options - Options including basePath and optional onError callback.
 * @param deps - Optional DI for filesystem operations.
 * @returns Array of parsed QueueAuditEntry objects.
 */
export async function readAuditLog(
  options: ReadAuditOptions,
  deps: AuditLoggerDeps = defaultDeps,
): Promise<QueueAuditEntry[]> {
  const filePath = join(options.basePath, STAGING_DIRS.queue);

  let content: string;
  try {
    content = await deps.readFile(filePath);
  } catch (error: unknown) {
    // Return empty array for nonexistent file
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }

  if (!content.trim()) {
    return [];
  }

  const lines = content.split('\n');
  const entries: QueueAuditEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      entries.push(JSON.parse(trimmed) as QueueAuditEntry);
    } catch (error: unknown) {
      if (options.onError) {
        options.onError(trimmed, error as Error);
      }
      // Skip malformed line (do not throw)
    }
  }

  return entries;
}
