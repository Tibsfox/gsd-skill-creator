/**
 * Filesystem-based message bus for the GSD Den.
 *
 * All inter-agent communication flows through priority directories on disk.
 * Messages are written as ISA-encoded files, read in strict priority order,
 * acknowledged by moving to acknowledged/, or dead-lettered with metadata.
 *
 * Every function takes a BusConfig as its first parameter -- no global state,
 * no hardcoded paths. This makes testing trivial with temp directories.
 */

import { mkdir, writeFile, readFile, readdir, rename, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

import type { BusConfig, BusMessage, Priority } from './types.js';
import { encodeMessage, decodeMessage, messageFilename } from './encoder.js';

// ============================================================================
// Constants
// ============================================================================

/** Number of priority levels (0-7 inclusive) */
const PRIORITY_COUNT = 8;

/** Names of all bus directories */
const BUS_DIRS = [
  ...Array.from({ length: PRIORITY_COUNT }, (_, i) => `priority-${i}`),
  'acknowledged',
  'dead-letter',
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build the path to a priority directory.
 *
 * @param busDir - Bus root directory
 * @param priority - Priority level (0-7)
 * @returns Absolute path to the priority directory
 */
function priorityDirPath(busDir: string, priority: number): string {
  return join(busDir, `priority-${priority}`);
}

// ============================================================================
// Bus initialization
// ============================================================================

/**
 * Initialize the bus directory structure.
 *
 * Creates priority-0/ through priority-7/, acknowledged/, and dead-letter/
 * under config.busDir. Idempotent -- safe to call multiple times.
 *
 * @param config - Bus configuration with busDir
 */
export async function initBus(config: BusConfig): Promise<void> {
  for (const dir of BUS_DIRS) {
    await mkdir(join(config.busDir, dir), { recursive: true });
  }
}

// ============================================================================
// Send
// ============================================================================

/**
 * Write an encoded message to its priority directory.
 *
 * @param config - Bus configuration
 * @param message - Validated bus message
 * @returns Absolute path to the written message file
 */
export async function sendMessage(config: BusConfig, message: BusMessage): Promise<string> {
  const dir = priorityDirPath(config.busDir, message.header.priority);
  const filename = messageFilename(message.header);
  const filePath = join(dir, filename);

  await writeFile(filePath, encodeMessage(message), 'utf-8');

  return filePath;
}

// ============================================================================
// Receive
// ============================================================================

/** Options for filtering received messages */
export interface ReceiveOptions {
  /** Maximum number of messages to return */
  maxCount?: number;
  /** Only return messages from this priority level */
  priority?: Priority;
  /** Only return messages destined for this agent */
  dst?: string;
}

/**
 * Read messages from the bus in strict priority order.
 *
 * Scans priority-0 through priority-7 in order. Within each priority,
 * messages are sorted chronologically by filename (timestamp prefix).
 *
 * @param config - Bus configuration
 * @param options - Optional filters (maxCount, priority, dst)
 * @returns Array of decoded bus messages in priority order
 */
export async function receiveMessages(
  config: BusConfig,
  options?: ReceiveOptions,
): Promise<BusMessage[]> {
  const results: BusMessage[] = [];
  const maxCount = options?.maxCount ?? Infinity;

  const startPriority = options?.priority ?? 0;
  const endPriority = options?.priority ?? (PRIORITY_COUNT - 1);

  for (let p = startPriority; p <= endPriority; p++) {
    if (results.length >= maxCount) break;

    const dir = priorityDirPath(config.busDir, p);
    let files: string[];

    try {
      files = await readdir(dir);
    } catch {
      continue;
    }

    // Filter to .msg files and sort alphabetically (chronological by timestamp prefix)
    files = files
      .filter((f) => f.endsWith('.msg'))
      .sort();

    for (const file of files) {
      if (results.length >= maxCount) break;

      const content = await readFile(join(dir, file), 'utf-8');
      const msg = decodeMessage(content);

      // Apply destination filter
      if (options?.dst && msg.header.dst !== options.dst) {
        continue;
      }

      results.push(msg);
    }
  }

  return results;
}

// ============================================================================
// Acknowledge
// ============================================================================

/**
 * Acknowledge a message by moving it from its priority directory to acknowledged/.
 *
 * Uses rename for atomic move on the same filesystem.
 *
 * @param config - Bus configuration
 * @param messagePath - Absolute path to the message file
 * @throws Error if the message file does not exist
 */
export async function acknowledgeMessage(config: BusConfig, messagePath: string): Promise<void> {
  // Verify the file exists (throws descriptive error with path)
  try {
    await stat(messagePath);
  } catch {
    throw new Error(`Cannot acknowledge message: file not found at ${messagePath}`);
  }

  const filename = basename(messagePath);
  const destPath = join(config.busDir, 'acknowledged', filename);

  await rename(messagePath, destPath);
}

// ============================================================================
// Dead letter
// ============================================================================

/**
 * Move a message to dead-letter/ with a metadata sidecar file.
 *
 * The sidecar (.meta) records the original path, reason, and timestamp
 * for diagnostic purposes.
 *
 * @param config - Bus configuration
 * @param messagePath - Absolute path to the message file
 * @param reason - Human-readable reason for dead-lettering
 */
export async function deadLetterMessage(
  config: BusConfig,
  messagePath: string,
  reason: string,
): Promise<void> {
  const filename = basename(messagePath);
  const destPath = join(config.busDir, 'dead-letter', filename);
  const metaPath = join(config.busDir, 'dead-letter', `${filename}.meta`);

  await rename(messagePath, destPath);

  const meta = {
    originalPath: messagePath,
    reason,
    timestamp: new Date().toISOString(),
  };

  await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
}

// ============================================================================
// List
// ============================================================================

/**
 * List message filenames, optionally filtered by priority level.
 *
 * Without a priority filter, returns filenames from all priority directories.
 * Results are sorted alphabetically within each priority level.
 *
 * @param config - Bus configuration
 * @param priority - Optional priority level to filter (0-7)
 * @returns Sorted array of .msg filenames
 */
export async function listMessages(config: BusConfig, priority?: Priority): Promise<string[]> {
  const results: string[] = [];

  const startPriority = priority ?? 0;
  const endPriority = priority ?? (PRIORITY_COUNT - 1);

  for (let p = startPriority; p <= endPriority; p++) {
    const dir = priorityDirPath(config.busDir, p);

    try {
      const files = await readdir(dir);
      const msgFiles = files.filter((f) => f.endsWith('.msg')).sort();
      results.push(...msgFiles);
    } catch {
      continue;
    }
  }

  return results;
}

// ============================================================================
// Path resolution
// ============================================================================

/**
 * Resolve the full path to a message file in a priority directory.
 *
 * @param config - Bus configuration
 * @param priority - Priority level (0-7)
 * @param filename - Message filename
 * @returns Absolute path to the message file
 */
export function getMessagePath(config: BusConfig, priority: Priority, filename: string): string {
  return join(priorityDirPath(config.busDir, priority), filename);
}
