import { readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Pattern } from '../types/pattern.js';
import type { RetentionConfig } from '../types/observation.js';
import { DEFAULT_RETENTION_CONFIG } from '../types/observation.js';

export class RetentionManager {
  private config: RetentionConfig;

  constructor(config: Partial<RetentionConfig> = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? DEFAULT_RETENTION_CONFIG.maxEntries,
      maxAgeDays: config.maxAgeDays ?? DEFAULT_RETENTION_CONFIG.maxAgeDays,
    };
  }

  /**
   * Prune entries from a JSONL file based on retention config
   * Uses atomic write: write to temp file, then rename
   * Returns number of entries pruned
   */
  async prune(filePath: string): Promise<number> {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0;
      }
      throw e;
    }

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
    const cutoffMs = Date.now() - (this.config.maxAgeDays * 24 * 60 * 60 * 1000);
    pruned = pruned.filter(e => e.timestamp >= cutoffMs);

    // Prune by count (keep newest)
    if (pruned.length > this.config.maxEntries) {
      pruned = pruned
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-this.config.maxEntries);
    }

    const prunedCount = originalCount - pruned.length;

    if (prunedCount > 0) {
      // Atomic write: temp file then rename
      const tempPath = join(
        tmpdir(),
        `prune-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`
      );
      const newContent = pruned.map(e => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(tempPath, newContent, 'utf-8');
      await rename(tempPath, filePath);
    }

    return prunedCount;
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
