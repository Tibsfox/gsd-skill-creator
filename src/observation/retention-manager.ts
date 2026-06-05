import { readFile, writeFile, rename } from 'fs/promises';
import { join, dirname } from 'path';
import type { Pattern } from '../types/pattern.js';
import type { RetentionConfig } from '../types/observation.js';
import { DEFAULT_RETENTION_CONFIG } from '../types/observation.js';

/**
 * Outcome statistics for a single prune sweep (v1.49.982).
 */
export interface PruneStats {
  /** Number of entries the sweep dropped. */
  prunedCount: number;
  /** Number of entries that survived the sweep. */
  retainedCount: number;
  /**
   * Age (in days) of the oldest entry that survived the sweep, or `null`
   * when nothing was retained (no age basis). The retention substrate
   * divides this by `retention_days` to get the age-pressure ratio.
   */
  oldestRetainedAgeDays: number | null;
}

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
   * Returns number of entries pruned.
   *
   * Thin wrapper over {@link pruneWithStats} for callers that only need the
   * count (preserves the pre-v1.49.982 number-returning contract).
   */
  async prune(filePath: string): Promise<number> {
    return (await this.pruneWithStats(filePath)).prunedCount;
  }

  /**
   * Prune entries and return outcome statistics (v1.49.982).
   *
   * Adds `retainedCount` and `oldestRetainedAgeDays` over the bare `prune`
   * count so the retention substrate can derive a real, bidirectional outcome
   * (the age-pressure band) instead of a hardcoded `kind`. See
   * `docs/retention-substrate-outcome-driven-debt.md`.
   */
  async pruneWithStats(filePath: string): Promise<PruneStats> {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return { prunedCount: 0, retainedCount: 0, oldestRetainedAgeDays: null };
      }
      throw e;
    }

    // Single time reference for both the age cutoff and the age-pressure
    // ratio, so a slow read cannot skew one against the other.
    const now = Date.now();

    const lines = content.split('\n').filter(line => line.trim());
    const entries: Pattern[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip corrupted lines
      }
    }

    const originalCount = entries.length;
    let pruned = entries;

    // Prune by age
    const cutoffMs = now - (this.config.maxAgeDays * 24 * 60 * 60 * 1000);
    pruned = pruned.filter(e => e.timestamp >= cutoffMs);

    // Prune by count (keep newest)
    if (pruned.length > this.config.maxEntries) {
      pruned = pruned
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-this.config.maxEntries);
    }

    const prunedCount = originalCount - pruned.length;
    const retainedCount = pruned.length;

    // Age (in days) of the oldest entry that SURVIVED the sweep. null when
    // nothing was retained (no age basis). Drives the age-pressure ratio.
    let oldestRetainedAgeDays: number | null = null;
    if (retainedCount > 0) {
      let oldestTimestamp = pruned[0].timestamp;
      for (const e of pruned) {
        if (e.timestamp < oldestTimestamp) oldestTimestamp = e.timestamp;
      }
      oldestRetainedAgeDays = Math.max(0, now - oldestTimestamp) / (24 * 60 * 60 * 1000);
    }

    if (prunedCount > 0) {
      // Atomic write: temp file then rename
      const tempPath = join(
        dirname(filePath),
        `.prune-${now}-${Math.random().toString(36).slice(2)}.jsonl`
      );
      const newContent = pruned.map(e => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(tempPath, newContent, 'utf-8');
      await rename(tempPath, filePath);
    }

    return { prunedCount, retainedCount, oldestRetainedAgeDays };
  }

  /**
   * Check if pruning is needed
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
   * Get current configuration
   */
  getConfig(): RetentionConfig {
    return { ...this.config };
  }
}

export async function prunePatterns(
  filePath: string,
  config?: Partial<RetentionConfig>
): Promise<number> {
  const manager = new RetentionManager(config);
  return manager.prune(filePath);
}
