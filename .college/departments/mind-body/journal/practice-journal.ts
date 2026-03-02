/**
 * Practice Journal -- filesystem-based persistence for mind-body practice sessions.
 *
 * Uses the filesystem-as-data pattern: each journal entry is stored as a JSON
 * file named by date (YYYY-MM-DD.json) in a configurable data directory.
 *
 * Design principles:
 * - Private by default
 * - Missing days are gaps, not failures
 * - No guilt language anywhere in the system
 *
 * @module departments/mind-body/journal/practice-journal
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { JournalEntry, MindBodyWingId } from '../types.js';

// ─── Serialization Helpers ──────────────────────────────────────────────────

/** JSON-safe representation of a JournalEntry (date stored as ISO string). */
interface SerializedEntry {
  date: string;
  durationMinutes: number;
  modules: MindBodyWingId[];
  energyBefore: 1 | 2 | 3 | 4 | 5;
  energyAfter: 1 | 2 | 3 | 4 | 5;
  observation?: string;
}

function serializeEntry(entry: JournalEntry): SerializedEntry {
  return {
    date: entry.date instanceof Date ? entry.date.toISOString() : String(entry.date),
    durationMinutes: entry.durationMinutes,
    modules: [...entry.modules],
    energyBefore: entry.energyBefore,
    energyAfter: entry.energyAfter,
    ...(entry.observation !== undefined ? { observation: entry.observation } : {}),
  };
}

function deserializeEntry(raw: SerializedEntry): JournalEntry {
  return {
    date: new Date(raw.date),
    durationMinutes: raw.durationMinutes,
    modules: raw.modules,
    energyBefore: raw.energyBefore,
    energyAfter: raw.energyAfter,
    ...(raw.observation !== undefined ? { observation: raw.observation } : {}),
  };
}

/** Format a Date as YYYY-MM-DD for use as a filename key. */
function dateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── PracticeJournal ────────────────────────────────────────────────────────

/**
 * Filesystem-backed practice journal.
 *
 * Each entry is a JSON file named `YYYY-MM-DD.json` in the data directory.
 * Handles missing directories and files gracefully.
 */
export class PracticeJournal {
  private dataDir: string;

  constructor(dataDir: string = '.college/departments/mind-body/journal/data') {
    this.dataDir = dataDir;
  }

  /**
   * Ensure the data directory exists, creating it if needed.
   */
  private async ensureDir(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
  }

  /**
   * Add a journal entry, writing it to the filesystem.
   * Overwrites any existing entry for the same date.
   */
  async addEntry(entry: JournalEntry): Promise<void> {
    await this.ensureDir();
    const key = dateToKey(entry.date);
    const filePath = join(this.dataDir, `${key}.json`);
    const data = JSON.stringify(serializeEntry(entry), null, 2);
    await writeFile(filePath, data, 'utf-8');
  }

  /**
   * Get all entries, optionally filtered by date range.
   * Returns entries sorted by date ascending.
   */
  async getEntries(startDate?: Date, endDate?: Date): Promise<JournalEntry[]> {
    const files = await this.listFiles();
    const entries: JournalEntry[] = [];

    for (const file of files) {
      const entry = await this.readEntryFile(file);
      if (!entry) continue;

      if (startDate && entry.date < startDate) continue;
      if (endDate && entry.date > endDate) continue;

      entries.push(entry);
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    return entries;
  }

  /**
   * Get a single entry by date, or null if none exists.
   */
  async getEntry(date: Date): Promise<JournalEntry | null> {
    const key = dateToKey(date);
    const filePath = join(this.dataDir, `${key}.json`);
    return this.readEntryFile(filePath);
  }

  /**
   * Calculate the current practice streak -- consecutive days ending today or
   * the most recent entry date.
   */
  async getStreak(): Promise<number> {
    const entries = await this.getEntries();
    if (entries.length === 0) return 0;

    // Build set of date keys for O(1) lookup
    const dateSet = new Set(entries.map((e) => dateToKey(e.date)));

    // Start from most recent entry and count backwards
    const sorted = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
    let current = new Date(sorted[0].date);
    let streak = 0;

    while (dateSet.has(dateToKey(current))) {
      streak++;
      current = new Date(current);
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }

  /**
   * Get the date of the most recent practice session, or null if no entries.
   */
  async getLastSessionDate(): Promise<Date | null> {
    const entries = await this.getEntries();
    if (entries.length === 0) return null;

    const sorted = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
    return sorted[0].date;
  }

  /**
   * Get the total number of practice sessions recorded.
   */
  async getTotalSessions(): Promise<number> {
    const files = await this.listFiles();
    return files.length;
  }

  /**
   * List all .json files in the data directory.
   */
  private async listFiles(): Promise<string[]> {
    try {
      const items = await readdir(this.dataDir);
      return items
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(this.dataDir, f));
    } catch {
      // Directory doesn't exist yet -- no entries
      return [];
    }
  }

  /**
   * Read and deserialize a single entry file. Returns null on any error.
   */
  private async readEntryFile(filePath: string): Promise<JournalEntry | null> {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as SerializedEntry;
      return deserializeEntry(parsed);
    } catch {
      return null;
    }
  }
}
