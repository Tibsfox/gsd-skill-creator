/**
 * Bus health metrics collection for the GSD Den message bus.
 *
 * Scans the filesystem-based bus directories to produce a health
 * snapshot: queue depths per priority level, total messages in flight,
 * age of the oldest unacknowledged message, and dead-letter count.
 *
 * Provides threshold-based health evaluation and human-readable
 * report formatting for the Monitor agent.
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { parseTimestamp } from './encoder.js';
import type { BusConfig, HealthMetrics } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract the compact timestamp from a message filename.
 *
 * Filenames follow the pattern: YYYYMMDD-HHMMSS-OPCODE-SRC-DST.msg
 * The timestamp is the first 15 characters (YYYYMMDD-HHMMSS).
 *
 * @param filename - Bus message filename
 * @returns Compact timestamp string
 */
export function extractTimestampFromFilename(filename: string): string {
  // Timestamp is first 15 chars: YYYYMMDD-HHMMSS
  return filename.slice(0, 15);
}

/**
 * List .msg files in a directory, returning an empty array if the
 * directory doesn't exist or is empty.
 */
async function listMsgFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath);
    return entries.filter((f) => f.endsWith('.msg'));
  } catch {
    return [];
  }
}

// ============================================================================
// collectHealthMetrics
// ============================================================================

/**
 * Collect a health metrics snapshot from the bus filesystem state.
 *
 * Scans all 8 priority directories for queue depths and oldest message
 * age, and the dead-letter directory for dead letter count.
 *
 * @param config - Bus configuration with busDir path
 * @returns Health metrics snapshot
 */
export async function collectHealthMetrics(config: BusConfig): Promise<HealthMetrics> {
  const queueDepths: Record<string, number> = {};
  let totalMessages = 0;
  let oldestTimestamp: Date | null = null;

  // Scan each priority directory
  for (let i = 0; i < 8; i++) {
    const dirPath = join(config.busDir, `priority-${i}`);
    const msgFiles = await listMsgFiles(dirPath);
    queueDepths[String(i)] = msgFiles.length;
    totalMessages += msgFiles.length;

    // Track oldest message timestamp across all priorities
    for (const filename of msgFiles) {
      try {
        const ts = extractTimestampFromFilename(filename);
        const date = parseTimestamp(ts);
        if (oldestTimestamp === null || date.getTime() < oldestTimestamp.getTime()) {
          oldestTimestamp = date;
        }
      } catch {
        // Skip files with unparseable timestamps
      }
    }
  }

  // Calculate oldest unacknowledged age in milliseconds
  const oldestUnacknowledgedAge = oldestTimestamp !== null
    ? Date.now() - oldestTimestamp.getTime()
    : null;

  // Count dead-letter .msg files (not .meta sidecars)
  const deadLetterDir = join(config.busDir, 'dead-letter');
  const deadLetterFiles = await listMsgFiles(deadLetterDir);
  const deadLetterCount = deadLetterFiles.length;

  return {
    timestamp: new Date().toISOString(),
    queueDepths,
    totalMessages,
    oldestUnacknowledgedAge,
    deadLetterCount,
  };
}

// ============================================================================
// isHealthy
// ============================================================================

/** Dead letter threshold above which the bus is considered unhealthy */
const DEAD_LETTER_THRESHOLD = 10;

/**
 * Evaluate whether the bus is healthy based on threshold checks.
 *
 * Unhealthy conditions:
 * - Any priority queue depth exceeds config.maxQueueDepth
 * - Dead letter count exceeds 10
 * - Oldest unacknowledged message age exceeds config.deliveryTimeoutMs
 *
 * @param metrics - Health metrics snapshot
 * @param config - Bus configuration with thresholds
 * @returns true if all thresholds are within limits
 */
export function isHealthy(metrics: HealthMetrics, config: BusConfig): boolean {
  // Check queue depths
  for (const key of Object.keys(metrics.queueDepths)) {
    if (metrics.queueDepths[key] > config.maxQueueDepth) {
      return false;
    }
  }

  // Check dead letter count
  if (metrics.deadLetterCount > DEAD_LETTER_THRESHOLD) {
    return false;
  }

  // Check oldest unacknowledged age
  if (
    metrics.oldestUnacknowledgedAge !== null &&
    metrics.oldestUnacknowledgedAge > config.deliveryTimeoutMs
  ) {
    return false;
  }

  return true;
}

// ============================================================================
// formatHealthReport
// ============================================================================

/**
 * Format health metrics as a human-readable one-line summary.
 *
 * Output: "Bus: N queued, M dead, oldest: X.Ys" or "oldest: none"
 *
 * @param metrics - Health metrics snapshot
 * @returns Formatted one-line string
 */
export function formatHealthReport(metrics: HealthMetrics): string {
  const oldestStr = metrics.oldestUnacknowledgedAge !== null
    ? `${(metrics.oldestUnacknowledgedAge / 1000).toFixed(1)}s`
    : 'none';

  return `Bus: ${metrics.totalMessages} queued, ${metrics.deadLetterCount} dead, oldest: ${oldestStr}`;
}
