/**
 * Reads pending messages from the console inbox.
 *
 * Scans inbox/pending/ for JSON files, parses each through
 * the envelope schema, and moves processed files to
 * inbox/acknowledged/ to prevent double-processing.
 *
 * @module console/reader
 */

import { readdir, readFile, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { MessageEnvelopeSchema } from './schema.js';
import { CONSOLE_DIRS } from './types.js';
import type { MessageEnvelope } from './types.js';

/**
 * Reads and acknowledges pending messages from the inbox.
 *
 * Scans inbox/pending/ for .json files, validates each through
 * the envelope schema, moves processed files to inbox/acknowledged/,
 * and returns an array of valid parsed envelopes.
 *
 * Malformed files (invalid JSON or invalid schema) are moved to
 * acknowledged/ to prevent infinite retry loops.
 */
export class MessageReader {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Read all pending messages from inbox/pending/.
   *
   * Each message file is:
   * 1. Read and parsed as JSON
   * 2. Validated through the envelope schema
   * 3. Moved from pending/ to acknowledged/
   *
   * Invalid files (bad JSON, schema failure) are moved to acknowledged/
   * without being included in the results.
   *
   * @returns Array of valid MessageEnvelope objects, sorted chronologically
   */
  async readPending(): Promise<MessageEnvelope[]> {
    const pendingDir = join(this.basePath, CONSOLE_DIRS.inboxPending);
    const ackDir = join(this.basePath, CONSOLE_DIRS.inboxAcknowledged);

    // Ensure acknowledged directory exists
    await mkdir(ackDir, { recursive: true });

    // Read directory listing -- handle ENOENT gracefully
    let entries: string[];
    try {
      entries = await readdir(pendingDir);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }

    // Filter for .json files only and sort alphabetically (chronological by timestamp prefix)
    const jsonFiles = entries
      .filter((f) => f.endsWith('.json'))
      .sort();

    const results: MessageEnvelope[] = [];

    for (const filename of jsonFiles) {
      const srcPath = join(pendingDir, filename);
      const destPath = join(ackDir, filename);

      try {
        // Read file content
        const raw = await readFile(srcPath, 'utf-8');

        // Parse JSON -- may throw on malformed content
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          // Malformed JSON -- move to acknowledged to prevent retry loops
          await rename(srcPath, destPath);
          continue;
        }

        // Validate through schema
        const result = MessageEnvelopeSchema.safeParse(data);
        if (!result.success) {
          // Invalid schema -- move to acknowledged to prevent retry loops
          await rename(srcPath, destPath);
          continue;
        }

        // Valid message -- add to results and move to acknowledged
        results.push(result.data as MessageEnvelope);
        await rename(srcPath, destPath);
      } catch {
        // Unexpected error processing file -- skip but don't crash
        continue;
      }
    }

    return results;
  }
}
