/**
 * JSONL append-log store for event entries.
 *
 * Tracks inter-skill communication events in pattern envelope format
 * ({timestamp, category: 'events', data: EventEntry}) for consistency
 * with PatternStore, WorkflowRunStore, and BundleProgressStore.
 *
 * Writes are serialized through a write queue to prevent race conditions.
 * Reads are corruption-tolerant (invalid lines are skipped).
 * Each entry is validated via Zod safeParse on read.
 */

import { appendFile, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { EventEntrySchema } from './types.js';
import type { EventEntry } from './types.js';

/** Filename for the event log */
const EVENTS_FILENAME = 'events.jsonl';

export class EventStore {
  private patternsDir: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(patternsDir: string) {
    this.patternsDir = patternsDir;
  }

  private get filePath(): string {
    return join(this.patternsDir, EVENTS_FILENAME);
  }

  /**
   * Append an event entry to the JSONL log.
   * Wraps in pattern envelope format for consistency with PatternStore.
   * Serializes writes through a queue to prevent race conditions.
   */
  async emit(entry: EventEntry): Promise<void> {
    const envelope = {
      timestamp: Date.now(),
      category: 'events' as const,
      data: entry,
    };

    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(this.patternsDir, { recursive: true });
      const line = JSON.stringify(envelope) + '\n';
      await appendFile(this.filePath, line, 'utf-8');
    });

    return this.writeQueue;
  }

  /**
   * Read all event entries from the JSONL log.
   * Returns empty array if file does not exist.
   * Skips corrupted or invalid lines gracefully.
   */
  async readAll(): Promise<EventEntry[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    const entries: EventEntry[] = [];

    for (const line of lines) {
      try {
        const envelope = JSON.parse(line);
        const result = EventEntrySchema.safeParse(envelope.data);
        if (result.success) {
          entries.push(result.data);
        }
      } catch {
        // Skip corrupted lines
      }
    }

    return entries;
  }

  /**
   * Get all pending events that have not exceeded their TTL.
   *
   * An event is considered pending if:
   * - status is 'pending'
   * - (now - emitted_at) < ttl_hours * 3600000
   */
  async getPending(): Promise<EventEntry[]> {
    const all = await this.readAll();
    const now = Date.now();

    return all.filter(entry => {
      if (entry.status !== 'pending') return false;
      const ttlMs = (entry.ttl_hours ?? 24) * 3600000;
      const age = now - new Date(entry.emitted_at).getTime();
      return age < ttlMs;
    });
  }

  /**
   * Consume the first matching pending event.
   *
   * Performs a read-modify-write: reads all lines, finds the first pending
   * event matching the event_name, updates its status to 'consumed' with
   * consumer name and timestamp, then rewrites the entire file.
   *
   * Uses writeQueue for serialization.
   */
  async consume(eventName: string, consumedBy: string): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      let content: string;
      try {
        content = await readFile(this.filePath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return;
        }
        throw error;
      }

      const lines = content.split('\n').filter(line => line.trim() !== '');
      let consumed = false;
      const updatedLines: string[] = [];

      for (const line of lines) {
        if (consumed) {
          updatedLines.push(line);
          continue;
        }

        try {
          const envelope = JSON.parse(line);
          const result = EventEntrySchema.safeParse(envelope.data);

          if (
            result.success &&
            result.data.event_name === eventName &&
            result.data.status === 'pending'
          ) {
            // Consume this event
            envelope.data = {
              ...result.data,
              status: 'consumed',
              consumed_by: consumedBy,
              consumed_at: new Date().toISOString(),
            };
            updatedLines.push(JSON.stringify(envelope));
            consumed = true;
          } else {
            updatedLines.push(line);
          }
        } catch {
          updatedLines.push(line);
        }
      }

      await writeFile(this.filePath, updatedLines.map(l => l + '\n').join(''), 'utf-8');
    });

    return this.writeQueue;
  }

  /**
   * Mark all TTL-exceeded pending events as expired.
   *
   * Performs a read-modify-write: reads all lines, finds all pending
   * events past their TTL, sets status to 'expired', then rewrites file.
   *
   * Uses writeQueue for serialization.
   */
  async markExpired(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      let content: string;
      try {
        content = await readFile(this.filePath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return;
        }
        throw error;
      }

      const lines = content.split('\n').filter(line => line.trim() !== '');
      const now = Date.now();
      const updatedLines: string[] = [];

      for (const line of lines) {
        try {
          const envelope = JSON.parse(line);
          const result = EventEntrySchema.safeParse(envelope.data);

          if (result.success && result.data.status === 'pending') {
            const ttlMs = (result.data.ttl_hours ?? 24) * 3600000;
            const age = now - new Date(result.data.emitted_at).getTime();

            if (age >= ttlMs) {
              envelope.data = {
                ...result.data,
                status: 'expired',
              };
              updatedLines.push(JSON.stringify(envelope));
              continue;
            }
          }

          updatedLines.push(line);
        } catch {
          updatedLines.push(line);
        }
      }

      await writeFile(this.filePath, updatedLines.map(l => l + '\n').join(''), 'utf-8');
    });

    return this.writeQueue;
  }
}
