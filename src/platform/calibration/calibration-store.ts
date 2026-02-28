/**
 * Store for persisting calibration events to JSONL files.
 *
 * Calibration events record skill activation decisions and user outcomes
 * to enable threshold calibration and accuracy benchmarking.
 *
 * Storage location: ~/.gsd-skill/calibration/events.jsonl (global)
 *
 * Uses JSONL format (one JSON object per line) for efficient append operations
 * and easy streaming reads. Write queue serializes concurrent writes to prevent
 * interleaving of JSON objects.
 */
import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import type {
  CalibrationEvent,
  CalibrationEventInput,
  CalibrationOutcome,
} from './calibration-types.js';

export class CalibrationStore {
  private eventsPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  /**
   * Create a new CalibrationStore instance.
   *
   * @param basePath - Optional override for storage directory (default: ~/.gsd-skill/calibration)
   */
  constructor(basePath?: string) {
    const baseDir = basePath ?? join(homedir(), '.gsd-skill', 'calibration');
    this.eventsPath = join(baseDir, 'events.jsonl');
  }

  /**
   * Record a new calibration event.
   *
   * Adds id (UUID) and timestamp automatically.
   *
   * @param input - Event data without id/timestamp
   * @returns The complete event with id and timestamp
   */
  async record(input: CalibrationEventInput): Promise<CalibrationEvent> {
    const event: CalibrationEvent = {
      ...input,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    await this.appendLine(event);
    return event;
  }

  /**
   * Update the outcome of an existing event (for deferred outcome inference).
   *
   * Reads file, finds event, updates outcome, writes entire file.
   * Use sparingly - prefer recording with known outcome when possible.
   *
   * @param eventId - UUID of the event to update
   * @param outcome - New outcome value
   * @returns true if event was found and updated, false otherwise
   */
  async updateOutcome(
    eventId: string,
    outcome: CalibrationOutcome
  ): Promise<boolean> {
    const events = await this.readAll();
    const index = events.findIndex(e => e.id === eventId);

    if (index === -1) {
      return false;
    }

    events[index].outcome = outcome;

    // Serialize the full rewrite to prevent race conditions
    await this.writeAll(events);
    return true;
  }

  /**
   * Get all calibration events.
   *
   * @returns Array of all calibration events
   */
  async getAll(): Promise<CalibrationEvent[]> {
    return this.readAll();
  }

  /**
   * Get events with known outcomes only (for calibration).
   *
   * Filters to outcome !== 'unknown'.
   *
   * @returns Array of events with known (continued/corrected) outcomes
   */
  async getKnownOutcomes(): Promise<CalibrationEvent[]> {
    const events = await this.readAll();
    return events.filter(e => e.outcome !== 'unknown');
  }

  /**
   * Get count of events, optionally filtering known outcomes only.
   *
   * @param knownOnly - If true, count only events with known outcomes
   * @returns Number of events
   */
  async count(knownOnly?: boolean): Promise<number> {
    if (knownOnly) {
      return (await this.getKnownOutcomes()).length;
    }
    return (await this.readAll()).length;
  }

  /**
   * Clear all calibration data.
   *
   * Primarily for testing purposes.
   */
  async clear(): Promise<void> {
    await this.ensureDir();

    // Serialize the clear operation
    this.writeQueue = this.writeQueue.then(async () => {
      await writeFile(this.eventsPath, '', 'utf-8');
    });

    await this.writeQueue;
  }

  /**
   * Ensure the calibration directory exists.
   */
  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.eventsPath), { recursive: true });
  }

  /**
   * Read all events from JSONL file.
   */
  private async readAll(): Promise<CalibrationEvent[]> {
    try {
      const content = await readFile(this.eventsPath, 'utf-8');
      const events: CalibrationEvent[] = [];

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          events.push(JSON.parse(line) as CalibrationEvent);
        } catch {
          // Skip corrupted lines but warn
          console.warn('Skipping corrupted line in calibration events.jsonl');
        }
      }

      return events;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Append a single event to the JSONL file with write serialization.
   */
  private async appendLine(event: CalibrationEvent): Promise<void> {
    await this.ensureDir();

    // Serialize writes to prevent interleaving
    this.writeQueue = this.writeQueue.then(async () => {
      const line = JSON.stringify(event) + '\n';
      await appendFile(this.eventsPath, line, 'utf-8');
    });

    await this.writeQueue;
  }

  /**
   * Write all events to the file (used by updateOutcome).
   *
   * Serializes with write queue to prevent race conditions.
   */
  private async writeAll(events: CalibrationEvent[]): Promise<void> {
    await this.ensureDir();

    // Serialize the full write
    this.writeQueue = this.writeQueue.then(async () => {
      const content = events.map(e => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(this.eventsPath, content, 'utf-8');
    });

    await this.writeQueue;
  }
}
