/**
 * Communication log visualization for the GSD Den (COMMS position).
 *
 * Scans the priority-based filesystem message bus, decodes ISA-encoded
 * messages, builds a chronological timeline with priority breakdown,
 * supports filtering by priority/agent, and renders as markdown.
 *
 * Provides 9 core capabilities:
 *   1. CommsLogConfigSchema -- configuration with bus config and max entries
 *   2. TimelineEntrySchema -- single timeline entry with decoded message fields
 *   3. CommsTimelineSchema -- full timeline with priority breakdown
 *   4. scanBusMessages -- async scan of all bus directories for .msg files
 *   5. buildTimeline -- pure function from messages to sorted timeline
 *   6. filterTimeline -- filter by priority, src, dst with AND semantics
 *   7. formatTimelineMarkdown -- render timeline as markdown table
 *   8. CommsLog class -- stateful wrapper with bound config
 *   9. createCommsLog factory -- ergonomic creation with defaults
 *
 * Satisfies: DASH-02 (bus activity visualization as timeline)
 */

import { z } from 'zod';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PRIORITY_NAMES } from './types.js';
import type { BusConfig, BusMessage } from './types.js';
import { decodeMessage, formatTimestamp } from './encoder.js';

// ============================================================================
// CommsLogConfig schema
// ============================================================================

/**
 * Configuration for the CommsLog module.
 */
export const CommsLogConfigSchema = z.object({
  /** Bus configuration for scanning directories */
  busConfig: z.any(),
  /** Maximum number of timeline entries (default 200) */
  maxEntries: z.number().int().positive().default(200),
});

/** TypeScript type for CommsLog config (output — all defaults resolved) */
export type CommsLogConfig = z.infer<typeof CommsLogConfigSchema>;

/** TypeScript type for CommsLog config input (defaults optional) */
export type CommsLogConfigInput = z.input<typeof CommsLogConfigSchema>;

// ============================================================================
// TimelineEntry schema
// ============================================================================

/**
 * Schema for a single timeline entry.
 *
 * Each entry represents one decoded bus message with human-readable fields
 * extracted from the ISA message header and payload.
 */
export const TimelineEntrySchema = z.object({
  /** Compact timestamp from message header (YYYYMMDD-HHMMSS) */
  timestamp: z.string(),
  /** Numeric priority level (0-7) */
  priority: z.number().int().min(0).max(7),
  /** Human-readable priority name from PRIORITY_NAMES */
  priorityName: z.string(),
  /** ISA opcode from message header */
  opcode: z.string(),
  /** Source agent ID */
  src: z.string(),
  /** Destination agent ID */
  dst: z.string(),
  /** First 80 chars of first payload line, or '(empty)' if no payload */
  payloadSummary: z.string(),
  /** The .msg filename for reference */
  filename: z.string(),
});

/** TypeScript type for timeline entries */
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

// ============================================================================
// CommsTimeline schema
// ============================================================================

/**
 * Schema for the full communication timeline.
 *
 * Contains sorted entries, total message count, and a breakdown
 * of how many messages exist at each priority level.
 */
export const CommsTimelineSchema = z.object({
  /** Timestamp when the timeline was generated */
  generatedAt: z.string(),
  /** Total number of messages in the timeline */
  totalMessages: z.number().int().nonnegative(),
  /** Timeline entries sorted newest-first */
  entries: z.array(TimelineEntrySchema),
  /** Count of messages per priority level (key = priority number as string) */
  priorityBreakdown: z.record(z.string(), z.number()),
});

/** TypeScript type for the full timeline */
export type CommsTimeline = z.infer<typeof CommsTimelineSchema>;

// ============================================================================
// scanBusMessages
// ============================================================================

/** Number of priority levels (0-7 inclusive) */
const PRIORITY_COUNT = 8;

/** Result of scanning a single message file */
interface ScannedMessage {
  message: BusMessage;
  filename: string;
}

/**
 * Scan all bus directories for .msg files.
 *
 * Iterates priority-0 through priority-7 and the acknowledged/ directory.
 * Reads each .msg file, decodes it via decodeMessage, and returns the
 * decoded message with its source filename. Corrupt or unreadable files
 * are silently skipped.
 *
 * @param busConfig - Bus configuration with busDir
 * @returns Array of {message, filename} tuples
 */
export async function scanBusMessages(
  busConfig: BusConfig,
): Promise<ScannedMessage[]> {
  const results: ScannedMessage[] = [];

  // Scan all 8 priority directories + acknowledged
  const dirs: string[] = [
    ...Array.from({ length: PRIORITY_COUNT }, (_, i) => `priority-${i}`),
    'acknowledged',
  ];

  for (const dirName of dirs) {
    const dirPath = join(busConfig.busDir, dirName);

    let files: string[];
    try {
      files = await readdir(dirPath);
    } catch {
      // Directory does not exist -- skip gracefully
      continue;
    }

    // Filter to .msg files and sort for deterministic order
    const msgFiles = files.filter((f) => f.endsWith('.msg')).sort();

    for (const file of msgFiles) {
      try {
        const content = await readFile(join(dirPath, file), 'utf-8');
        const message = decodeMessage(content);
        results.push({ message, filename: file });
      } catch {
        // Corrupt or unreadable file -- skip without throwing
        continue;
      }
    }
  }

  return results;
}

// ============================================================================
// buildTimeline
// ============================================================================

/**
 * Build a communication timeline from scanned messages.
 *
 * Maps each message to a TimelineEntry, sorts newest-first by timestamp,
 * truncates to maxEntries, and computes a priority breakdown.
 *
 * @param messages - Array of {message, filename} from scanBusMessages
 * @param maxEntries - Maximum entries in the timeline (default 200)
 * @returns Validated CommsTimeline
 */
export function buildTimeline(
  messages: ScannedMessage[],
  maxEntries: number = 200,
): CommsTimeline {
  // Map to timeline entries
  let entries: TimelineEntry[] = messages.map(({ message, filename }) => {
    const { header, payload } = message;

    // Compute payload summary
    let payloadSummary: string;
    if (payload.length === 0) {
      payloadSummary = '(empty)';
    } else {
      const firstLine = payload[0];
      payloadSummary = firstLine.length > 80 ? firstLine.slice(0, 80) : firstLine;
    }

    return {
      timestamp: header.timestamp,
      priority: header.priority,
      priorityName: PRIORITY_NAMES[header.priority] ?? `UNKNOWN-${header.priority}`,
      opcode: header.opcode,
      src: header.src,
      dst: header.dst,
      payloadSummary,
      filename,
    };
  });

  // Sort newest-first (descending by timestamp string -- YYYYMMDD-HHMMSS sorts lexically)
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Truncate to maxEntries
  entries = entries.slice(0, maxEntries);

  // Compute priority breakdown
  const priorityBreakdown: Record<string, number> = {};
  for (const entry of entries) {
    const key = String(entry.priority);
    priorityBreakdown[key] = (priorityBreakdown[key] ?? 0) + 1;
  }

  return CommsTimelineSchema.parse({
    generatedAt: formatTimestamp(new Date()),
    totalMessages: entries.length,
    entries,
    priorityBreakdown,
  });
}

// ============================================================================
// filterTimeline
// ============================================================================

/** Filters for narrowing a timeline */
interface TimelineFilters {
  /** Filter by priority level */
  priority?: number;
  /** Filter by source agent ID */
  src?: string;
  /** Filter by destination agent ID */
  dst?: string;
}

/**
 * Filter a timeline by priority, source, and/or destination.
 *
 * Multiple filters are AND-ed: all specified filters must match.
 * Recalculates totalMessages and priorityBreakdown for the filtered set.
 *
 * @param timeline - Source timeline to filter
 * @param filters - Filter criteria (all optional, AND semantics)
 * @returns New CommsTimeline with only matching entries
 */
export function filterTimeline(
  timeline: CommsTimeline,
  filters: TimelineFilters,
): CommsTimeline {
  let entries = timeline.entries;

  if (filters.priority !== undefined) {
    entries = entries.filter((e) => e.priority === filters.priority);
  }
  if (filters.src !== undefined) {
    entries = entries.filter((e) => e.src === filters.src);
  }
  if (filters.dst !== undefined) {
    entries = entries.filter((e) => e.dst === filters.dst);
  }

  // Recalculate priority breakdown
  const priorityBreakdown: Record<string, number> = {};
  for (const entry of entries) {
    const key = String(entry.priority);
    priorityBreakdown[key] = (priorityBreakdown[key] ?? 0) + 1;
  }

  return {
    generatedAt: timeline.generatedAt,
    totalMessages: entries.length,
    entries,
    priorityBreakdown,
  };
}

// ============================================================================
// formatTimelineMarkdown
// ============================================================================

/**
 * Render a communication timeline as a markdown string.
 *
 * Follows the relay.ts formatReportMarkdown pattern: builds a lines array,
 * pushes sections, joins with newlines. Produces a header, summary,
 * priority breakdown, and a table of timeline entries.
 *
 * @param timeline - Timeline to render
 * @returns Markdown string
 */
export function formatTimelineMarkdown(timeline: CommsTimeline): string {
  const lines: string[] = [];

  // Header
  lines.push(`## Communication Log -- ${timeline.generatedAt}`);
  lines.push('');
  lines.push(`**Total Messages:** ${timeline.totalMessages}`);
  lines.push('');

  // Priority breakdown (only non-zero priorities)
  const sortedPriorities = Object.keys(timeline.priorityBreakdown)
    .map(Number)
    .sort((a, b) => a - b);

  for (const p of sortedPriorities) {
    const count = timeline.priorityBreakdown[String(p)];
    const name = PRIORITY_NAMES[p] ?? `UNKNOWN-${p}`;
    lines.push(`Priority ${p} (${name}): ${count}`);
  }
  lines.push('');

  // Timeline table
  lines.push('| Time | Pri | Opcode | From | To | Payload |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const entry of timeline.entries) {
    lines.push(
      `| ${entry.timestamp} | ${entry.priority} | ${entry.opcode} | ${entry.src} | ${entry.dst} | ${entry.payloadSummary} |`,
    );
  }

  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// CommsLog class (stateful wrapper)
// ============================================================================

/**
 * Stateful CommsLog wrapping all stateless functions with bound config.
 *
 * Follows the established Den agent pattern: constructor validates config
 * via Zod, methods delegate to stateless functions. Use createCommsLog
 * factory for ergonomic creation.
 */
export class CommsLog {
  private readonly commsConfig: CommsLogConfig;

  /**
   * Create a new CommsLog instance.
   *
   * @param config - CommsLog configuration (validated through Zod)
   */
  constructor(config: CommsLogConfigInput) {
    this.commsConfig = CommsLogConfigSchema.parse(config);
  }

  /**
   * Scan all bus directories for messages.
   *
   * @returns Array of {message, filename} tuples
   */
  async scan(): Promise<ScannedMessage[]> {
    return scanBusMessages(this.commsConfig.busConfig as BusConfig);
  }

  /**
   * Build a timeline from scanned messages.
   *
   * @param messages - Scanned messages (from scan())
   * @returns Validated CommsTimeline
   */
  timeline(messages: ScannedMessage[]): CommsTimeline {
    return buildTimeline(messages, this.commsConfig.maxEntries);
  }

  /**
   * Filter a timeline by criteria.
   *
   * @param timeline - Source timeline
   * @param filters - Filter criteria
   * @returns Filtered CommsTimeline
   */
  filter(timeline: CommsTimeline, filters: TimelineFilters): CommsTimeline {
    return filterTimeline(timeline, filters);
  }

  /**
   * Render a timeline as markdown.
   *
   * @param timeline - Timeline to render
   * @returns Markdown string
   */
  format(timeline: CommsTimeline): string {
    return formatTimelineMarkdown(timeline);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a CommsLog with defaults applied.
 *
 * Synchronous factory -- no directory creation needed (bus dirs managed
 * by initBus).
 *
 * @param config - CommsLog configuration (defaults applied via Zod)
 * @returns CommsLog instance
 */
export function createCommsLog(
  config: Partial<CommsLogConfig> & { busConfig: unknown },
): CommsLog {
  const validated = CommsLogConfigSchema.parse(config);
  return new CommsLog(validated);
}
