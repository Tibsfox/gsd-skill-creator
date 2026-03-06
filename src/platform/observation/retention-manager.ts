/**
 * retention-manager.ts — Session Tracking: Observation Lifecycle Management
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * RetentionManager prunes JSONL files by removing entries that are too old
 * or when the total count exceeds the configured maximum. It applies two
 * independent pruning criteria: age-based and count-based.
 *
 * WHY RETENTION MANAGEMENT MATTERS
 * ---------------------------------
 * Observation data accumulates indefinitely without pruning. A year of daily
 * Claude Code sessions would produce thousands of records that grow the
 * 'sessions.jsonl' file without bound. Pattern detection slows as file size grows.
 *
 * Retention management is the "boring is reliable" principle from
 * CENTERCAMP-PERSONAL-JOURNAL, "Technical Wisdom Gained":
 * "Good storage design is boring. Boring is reliable."
 *
 * A 90-day rolling window of sessions with a 1000-entry cap is simple, clear,
 * and sufficient. More sophisticated retention (importance-weighted, tier-aware)
 * can be added later if needed. Simple works first.
 *
 * PRUNING CRITERIA
 * ----------------
 * Age pruning (applied first):
 *   Remove entries with timestamp < (now - maxAgeDays * 24h).
 *   Default: 90 days. Older entries are stale and unlikely to surface new patterns.
 *
 * Count pruning (applied second, on age-pruned result):
 *   If entries.length > maxEntries, keep only the newest maxEntries entries.
 *   Default: 1000 entries. Prevents unbounded growth even within the age window.
 *
 * Both criteria are applied on every prune() call. The order matters:
 * age pruning first, then count pruning on the survivors. This ensures
 * count pruning only removes old entries, not the newest ones.
 *
 * ATOMIC WRITE
 * ------------
 * prune() uses an atomic write pattern to prevent data loss during pruning:
 *   1. Write pruned content to a temp file (.prune-<timestamp>-<random>.jsonl)
 *   2. rename() the temp file to the target file path
 *
 * rename() is atomic on the same filesystem — the target file either contains
 * the old content or the new content, never a partial write. This prevents
 * the scenario where a crash during pruning corrupts the observations file.
 *
 * Temp file is in the same directory as the target file to ensure it's on the
 * same filesystem (rename() across filesystems is not atomic — it would fail).
 *
 * This pattern is used throughout the data lifecycle modules:
 * RetentionManager uses it, JsonlCompactor uses it. Consistent approach.
 *
 * CORRUPTED LINE HANDLING
 * -----------------------
 * prune() skips lines that fail JSON.parse(). A single corrupted line in the
 * sessions file should not block pruning of all other valid entries. The
 * pruned output contains only valid, parseable entries.
 *
 * This is a silent skip — no error is thrown, no warning logged. The corrupted
 * line is gone from the file after pruning. If corruption detection is important,
 * use JsonlCompactor which reports malformed/tampered counts explicitly.
 *
 * SHOULDPRUNE OPTIMIZATION
 * -------------------------
 * shouldPrune() checks if a file exists as a quick pre-check before calling prune().
 * This avoids the overhead of reading and parsing an empty or non-existent file.
 * In practice, RetentionManager.shouldPrune() is rarely called — SessionObserver
 * calls prune() directly after every session end.
 *
 * DEFAULT CONFIGURATION
 * ---------------------
 * See core/types/observation.ts DEFAULT_RETENTION_CONFIG for defaults.
 * Typical values: maxEntries=1000, maxAgeDays=90.
 *
 * These defaults are conservative: 90 days keeps nearly 3 months of history.
 * For most users, this is more than enough for pattern detection.
 *
 * @see SessionObserver (session-observer.ts) — calls prune() after every session
 * @see JsonlCompactor (jsonl-compactor.ts) — more thorough cleanup including
 *   checksum validation and malformed entry reporting
 * @see DEFAULT_RETENTION_CONFIG (core/types/observation.ts) — default values
 */

import { readFile, writeFile, rename } from 'fs/promises';
import { join, dirname } from 'path';
import type { Pattern } from '../../core/types/pattern.js';
import type { RetentionConfig } from '../../core/types/observation.js';
import { DEFAULT_RETENTION_CONFIG } from '../../core/types/observation.js';

/**
 * Manages retention of JSONL observation files by enforcing age and count limits.
 *
 * Construct with optional partial RetentionConfig to override defaults.
 * Call prune(filePath) after every session end to keep files within bounds.
 */
export class RetentionManager {
  private config: RetentionConfig;

  constructor(config: Partial<RetentionConfig> = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? DEFAULT_RETENTION_CONFIG.maxEntries,
      maxAgeDays: config.maxAgeDays ?? DEFAULT_RETENTION_CONFIG.maxAgeDays,
    };
  }

  /**
   * Prune entries from a JSONL file based on retention config.
   * Uses atomic write: write to temp file, then rename.
   *
   * Pruning order:
   *   1. Age filter: remove entries older than maxAgeDays
   *   2. Count filter: keep only newest maxEntries entries
   *
   * Returns the number of entries pruned. Returns 0 if file does not exist
   * or if no entries needed pruning.
   *
   * Silently skips corrupted lines (failed JSON.parse) — they are removed
   * from the output without counting toward prunedCount.
   */
  async prune(filePath: string): Promise<number> {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0; // File doesn't exist — nothing to prune
      }
      throw e;
    }

    const lines = content.split('\n').filter(line => line.trim());
    const entries: Pattern[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip corrupted lines — they will not appear in the pruned output
      }
    }

    const originalCount = entries.length;
    let pruned = entries;

    // Step 1: Prune by age — remove entries older than maxAgeDays
    const cutoffMs = Date.now() - (this.config.maxAgeDays * 24 * 60 * 60 * 1000);
    pruned = pruned.filter(e => e.timestamp >= cutoffMs);

    // Step 2: Prune by count — keep only the newest maxEntries entries
    // Sort ascending by timestamp so slice(-maxEntries) keeps the newest
    if (pruned.length > this.config.maxEntries) {
      pruned = pruned
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-this.config.maxEntries);
    }

    const prunedCount = originalCount - pruned.length;

    // Only write if something was actually pruned — avoid unnecessary I/O
    if (prunedCount > 0) {
      // Atomic write: temp file in same directory (same filesystem), then rename
      const tempPath = join(
        dirname(filePath),
        `.prune-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`
      );
      const newContent = pruned.map(e => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(tempPath, newContent, 'utf-8');
      await rename(tempPath, filePath); // Atomic on same filesystem
    }

    return prunedCount;
  }

  /**
   * Check if pruning is needed (file exists).
   * Quick pre-check before calling prune() — avoids unnecessary parse overhead
   * when the file does not exist.
   */
  async shouldPrune(filePath: string): Promise<boolean> {
    try {
      await readFile(filePath, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current retention configuration.
   * Returns a copy to prevent accidental mutation of internal state.
   */
  getConfig(): RetentionConfig {
    return { ...this.config };
  }
}

/**
 * Convenience function for one-off pruning.
 * Wraps RetentionManager.prune() for callers that don't need a class instance.
 */
export async function prunePatterns(
  filePath: string,
  config?: Partial<RetentionConfig>
): Promise<number> {
  const manager = new RetentionManager(config);
  return manager.prune(filePath);
}
