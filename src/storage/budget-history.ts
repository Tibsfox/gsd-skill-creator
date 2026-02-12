/**
 * JSONL budget history storage with automatic retention.
 *
 * Stores snapshots of budget usage over time, enabling trend analysis.
 * Each status invocation appends a snapshot. History is capped at 365 entries.
 *
 * File format: one JSON object per line (JSONL)
 * Default location: .planning/patterns/budget-history.jsonl
 */

import { readFile, writeFile, appendFile, rename, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

/**
 * A point-in-time snapshot of budget usage.
 */
export interface BudgetSnapshot {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Total characters across all skills */
  totalChars: number;
  /** Number of skills */
  skillCount: number;
}

/**
 * Trend data computed from recent snapshots.
 */
export interface BudgetTrend {
  /** Change in characters over the period */
  charDelta: number;
  /** Change in skill count over the period */
  skillDelta: number;
  /** Number of snapshots in the analysis window */
  periodSnapshots: number;
}

/** Maximum number of history entries to retain */
const MAX_ENTRIES = 365;

/**
 * Manages JSONL budget history with append, read, and trend analysis.
 */
export class BudgetHistory {
  private filePath: string;

  /**
   * @param filePath - Path to the JSONL history file
   */
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Append a snapshot to the history file.
   *
   * Creates parent directories if needed. After appending, prunes
   * if total entries exceed MAX_ENTRIES (365).
   *
   * @param snapshot - Budget snapshot to record
   */
  async append(snapshot: BudgetSnapshot): Promise<void> {
    // Ensure directory exists
    await mkdir(dirname(this.filePath), { recursive: true });

    const line = JSON.stringify(snapshot) + '\n';
    await appendFile(this.filePath, line, 'utf-8');

    // Check if pruning is needed
    const entries = await this.read();
    if (entries.length > MAX_ENTRIES) {
      const pruned = entries.slice(-MAX_ENTRIES);
      // Atomic rewrite: write to temp, then rename
      const tempPath = join(
        tmpdir(),
        `budget-history-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
      );
      const content = pruned.map(e => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(tempPath, content, 'utf-8');
      await rename(tempPath, this.filePath);
    }
  }

  /**
   * Read all snapshots from the history file.
   *
   * Skips corrupted/malformed lines. Returns empty array if file
   * does not exist.
   *
   * @returns Array of valid snapshots in chronological order
   */
  async read(): Promise<BudgetSnapshot[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch {
      return [];
    }

    const lines = content.split('\n').filter(line => line.trim());
    const entries: BudgetSnapshot[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip corrupted lines
      }
    }

    return entries;
  }

  /**
   * Calculate trend from recent snapshots.
   *
   * Takes the last `recentCount` entries and computes the delta
   * between the first and last in that window.
   *
   * @param snapshots - Array of snapshots (chronological order)
   * @param recentCount - Number of recent entries to analyze (default: 7)
   * @returns Trend data, or null if insufficient data (< 2 entries)
   */
  static getTrend(snapshots: BudgetSnapshot[], recentCount = 7): BudgetTrend | null {
    if (snapshots.length < 2) {
      return null;
    }

    const recent = snapshots.slice(-recentCount);
    const first = recent[0];
    const last = recent[recent.length - 1];

    return {
      charDelta: last.totalChars - first.totalChars,
      skillDelta: last.skillCount - first.skillCount,
      periodSnapshots: recent.length,
    };
  }
}
