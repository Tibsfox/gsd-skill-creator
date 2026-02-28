/**
 * Message pruning and archival for the GSD Den message bus.
 *
 * Manages acknowledged message lifecycle by enforcing count and age
 * thresholds. Manages dead-letter lifecycle by enforcing retention
 * periods with sidecar cleanup.
 *
 * Prevents unbounded growth of the filesystem-based bus by removing
 * stale messages while preserving recent ones for debugging.
 */

import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { parseTimestamp } from './encoder.js';
import { extractTimestampFromFilename } from './health.js';
import type { BusConfig } from './types.js';

// ============================================================================
// PruneResult type
// ============================================================================

/**
 * Result of a pruning operation, providing clear accounting
 * of what was removed and why.
 */
export interface PruneResult {
  /** Number of messages removed */
  pruned: number;
  /** Number of messages remaining after pruning */
  remaining: number;
  /** Reasons why pruning occurred (empty if nothing pruned) */
  reasons: string[];
}

// ============================================================================
// pruneAcknowledged
// ============================================================================

/**
 * Prune old acknowledged messages by count and age thresholds.
 *
 * Two independent thresholds are applied simultaneously:
 * 1. **Count:** If more than config.archiveMaxMessages, remove oldest first
 * 2. **Age:** If any message is older than config.archiveMaxAgeDays, remove it
 *
 * The union of both removal sets is deleted.
 *
 * @param config - Bus configuration with archival thresholds
 * @returns Pruning result with counts and reasons
 */
export async function pruneAcknowledged(config: BusConfig): Promise<PruneResult> {
  const ackDir = join(config.busDir, 'acknowledged');
  const entries = await readdir(ackDir);
  const msgFiles = entries.filter((f) => f.endsWith('.msg'));

  if (msgFiles.length === 0) {
    return { pruned: 0, remaining: 0, reasons: [] };
  }

  // Parse timestamps and sort by age (newest first)
  const withTimestamps = msgFiles.map((filename) => {
    try {
      const ts = extractTimestampFromFilename(filename);
      const date = parseTimestamp(ts);
      return { filename, date };
    } catch {
      // Files with unparseable timestamps get epoch 0 (treated as very old)
      return { filename, date: new Date(0) };
    }
  });

  // Sort newest first
  withTimestamps.sort((a, b) => b.date.getTime() - a.date.getTime());

  const now = Date.now();
  const maxAgeMs = config.archiveMaxAgeDays * 24 * 60 * 60 * 1000;
  const toRemove = new Set<string>();
  const reasons: string[] = [];

  // Age-based removals: anything older than archiveMaxAgeDays
  let hasAgePrunes = false;
  for (const entry of withTimestamps) {
    const ageMs = now - entry.date.getTime();
    if (ageMs > maxAgeMs) {
      toRemove.add(entry.filename);
      hasAgePrunes = true;
    }
  }
  if (hasAgePrunes) {
    reasons.push('age');
  }

  // Count-based removals: beyond archiveMaxMessages (from oldest, after sorting newest-first)
  if (withTimestamps.length > config.archiveMaxMessages) {
    const excess = withTimestamps.slice(config.archiveMaxMessages);
    for (const entry of excess) {
      toRemove.add(entry.filename);
    }
    if (excess.some((e) => !toRemove.has(e.filename) || true)) {
      // Only add 'count' reason if count threshold was actually exceeded
      if (!reasons.includes('count')) {
        reasons.push('count');
      }
    }
  }

  // Delete all files in the removal set
  for (const filename of toRemove) {
    await unlink(join(ackDir, filename));
  }

  return {
    pruned: toRemove.size,
    remaining: msgFiles.length - toRemove.size,
    reasons,
  };
}

// ============================================================================
// pruneDeadLetters
// ============================================================================

/**
 * Prune old dead-letter messages by retention period.
 *
 * Removes both .msg and .meta sidecar files for messages older
 * than config.deadLetterRetentionDays.
 *
 * @param config - Bus configuration with retention period
 * @returns Pruning result with counts and reasons
 */
export async function pruneDeadLetters(config: BusConfig): Promise<PruneResult> {
  const dlDir = join(config.busDir, 'dead-letter');
  const entries = await readdir(dlDir);
  const msgFiles = entries.filter((f) => f.endsWith('.msg'));

  if (msgFiles.length === 0) {
    return { pruned: 0, remaining: 0, reasons: [] };
  }

  const now = Date.now();
  const maxAgeMs = config.deadLetterRetentionDays * 24 * 60 * 60 * 1000;
  const toRemove: string[] = [];

  for (const filename of msgFiles) {
    try {
      const ts = extractTimestampFromFilename(filename);
      const date = parseTimestamp(ts);
      const ageMs = now - date.getTime();

      if (ageMs > maxAgeMs) {
        toRemove.push(filename);
      }
    } catch {
      // Files with unparseable timestamps are left in place
    }
  }

  // Delete .msg and .meta sidecar for each removal
  for (const filename of toRemove) {
    await unlink(join(dlDir, filename));
    // Also try to remove the .meta sidecar
    const metaFilename = filename.replace('.msg', '.meta');
    try {
      await unlink(join(dlDir, metaFilename));
    } catch {
      // .meta may not exist -- that's OK
    }
  }

  return {
    pruned: toRemove.length,
    remaining: msgFiles.length - toRemove.length,
    reasons: toRemove.length > 0 ? ['age'] : [],
  };
}
