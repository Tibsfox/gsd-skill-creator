/**
 * Append-only JSONL event store for skill usage telemetry.
 *
 * Writes are serialized through a queue to prevent corruption.
 * File rotation trims oldest entries when the size ceiling is reached.
 * Follows the BudgetHistory atomic-rename pattern (src/storage/budget-history.ts).
 */

import { readFile, writeFile, appendFile, rename, mkdir, stat } from 'fs/promises';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import type { UsageEvent, EventStoreConfig } from './types.js';
import { DEFAULT_MAX_SIZE_BYTES } from './types.js';

export class EventStore {
  private filePath: string;
  private maxSizeBytes: number;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(config: EventStoreConfig) {
    this.filePath = config.filePath;
    this.maxSizeBytes = config.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  }

  /**
   * Append a single usage event as a JSONL line.
   *
   * After appending, checks the file size. If it exceeds the ceiling,
   * reads all events, drops the oldest half, and rewrites atomically.
   * Writes are serialized through writeQueue to prevent corruption.
   */
  async append(event: UsageEvent): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });

      const line = JSON.stringify(event) + '\n';
      await appendFile(this.filePath, line, 'utf-8');

      // Rotate if over ceiling
      const size = await this.getFileSizeBytes();
      if (size > this.maxSizeBytes) {
        await this.rotate();
      }
    });

    return this.writeQueue;
  }

  /**
   * Read all events from the store in chronological order.
   *
   * Skips malformed lines without throwing. Returns empty array if
   * file does not exist.
   */
  async read(): Promise<UsageEvent[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }

    const events: UsageEvent[] = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        events.push(JSON.parse(trimmed) as UsageEvent);
      } catch {
        // Skip malformed lines
      }
    }

    return events;
  }

  /**
   * Return the current file size in bytes. Returns 0 if file does not exist.
   */
  async getFileSizeBytes(): Promise<number> {
    try {
      const s = await stat(this.filePath);
      return s.size;
    } catch {
      return 0;
    }
  }

  /**
   * Rotate: keep the newest half of events, rewrite atomically.
   * Called automatically by append() when the ceiling is exceeded.
   */
  private async rotate(): Promise<void> {
    const events = await this.read();
    if (events.length === 0) return;

    // Keep the newest half (drop the oldest half)
    const keepFrom = Math.ceil(events.length / 2);
    const kept = events.slice(keepFrom);

    const tempPath = join(
      tmpdir(),
      `skill-events-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
    );

    const content = kept.map(e => JSON.stringify(e)).join('\n') + '\n';
    await writeFile(tempPath, content, 'utf-8');
    await rename(tempPath, this.filePath);
  }
}
