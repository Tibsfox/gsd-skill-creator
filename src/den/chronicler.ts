/**
 * Chronicler agent for the GSD Den (LOG position).
 *
 * The Den's audit trail keeper and mission narrator. Maintains an append-only
 * JSONL audit log of all significant Den events, then generates human-readable
 * briefing documents from those structured entries. Other modules (Dashboard)
 * read from the Chronicler's log to build visualizations.
 *
 * Provides 7 core capabilities:
 *   1. ChroniclerEntrySchema -- validates 14 action types for audit entries
 *   2. BriefingSchema -- validates generated narrative documents
 *   3. appendChroniclerEntry -- append-only JSONL write
 *   4. readChroniclerLog -- reads all entries from JSONL
 *   5. generateBriefing -- transforms entries into readable narrative
 *   6. formatBriefingMarkdown -- renders Briefing to markdown
 *   7. Chronicler class + createChronicler factory
 *
 * Satisfies: SUP-05 (machine-readable audit trail + human-readable narratives)
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { AgentIdSchema } from './types.js';
import { formatTimestamp, parseTimestamp } from './encoder.js';

// ============================================================================
// ChroniclerConfig schema
// ============================================================================

/**
 * Configuration for the Chronicler agent.
 */
export const ChroniclerConfigSchema = z.object({
  /** Bus configuration for message routing */
  busConfig: z.any(),
  /** Path to the JSONL chronicler log file */
  logPath: z.string().default('.planning/den/logs/chronicler.jsonl'),
  /** Agent identifier */
  agentId: z.string().default('chronicler'),
});

/** TypeScript type for chronicler config */
export type ChroniclerConfig = z.infer<typeof ChroniclerConfigSchema>;

// ============================================================================
// ChroniclerEntry schema
// ============================================================================

/**
 * Schema for a single chronicler audit log entry.
 *
 * Each entry represents one significant Den event recorded as a JSONL line.
 * The 14 action types cover the full lifecycle of phase execution, verification,
 * error handling, and operational events.
 */
export const ChroniclerEntrySchema = z.object({
  /** Compact timestamp in YYYYMMDD-HHMMSS format */
  timestamp: z.string(),
  /** Which agent performed the action */
  agent: AgentIdSchema,
  /** Type of action performed */
  action: z.enum([
    'phase_started',
    'phase_completed',
    'plan_started',
    'plan_completed',
    'verification_passed',
    'verification_failed',
    'halt_issued',
    'halt_cleared',
    'error_recovered',
    'decision_made',
    'topology_changed',
    'budget_alert',
    'intake_received',
    'custom',
  ]),
  /** Phase context (e.g., '260' or '260-chronicler-dashboard') */
  phase: z.string(),
  /** Human-readable description of what happened */
  detail: z.string(),
  /** Arbitrary extra data */
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** TypeScript type for chronicler entries */
export type ChroniclerEntry = z.infer<typeof ChroniclerEntrySchema>;

// ============================================================================
// Briefing schema
// ============================================================================

/**
 * Schema for a generated mission briefing document.
 *
 * Briefings are produced from a set of ChroniclerEntry records and
 * present a human-readable narrative of phase operations.
 */
export const BriefingSchema = z.object({
  /** Timestamp when the briefing was generated */
  timestamp: z.string(),
  /** Phase this briefing covers */
  phase: z.string(),
  /** Briefing title (e.g., "Phase 260 Briefing") */
  title: z.string(),
  /** Narrative paragraph lines */
  narrative: z.array(z.string()),
  /** Operational metrics */
  metrics: z.object({
    /** Total number of events in the briefing */
    totalEvents: z.number().int().nonnegative(),
    /** Unique agent IDs that generated events */
    agentsActive: z.array(z.string()),
    /** Duration from first to last event, or 'N/A' */
    duration: z.string(),
  }),
});

/** TypeScript type for briefings */
export type Briefing = z.infer<typeof BriefingSchema>;

// ============================================================================
// JSONL append
// ============================================================================

/**
 * Append a chronicler entry to a JSONL log file.
 *
 * Creates the directory if it does not exist. Each entry is one JSON
 * object per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Chronicler entry to append
 */
export async function appendChroniclerEntry(
  logPath: string,
  entry: ChroniclerEntry,
): Promise<void> {
  const validated = ChroniclerEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

// ============================================================================
// JSONL read
// ============================================================================

/**
 * Read all chronicler entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist or is empty.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated ChroniclerEntry objects
 */
export async function readChroniclerLog(
  logPath: string,
): Promise<ChroniclerEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => ChroniclerEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Briefing generation
// ============================================================================

/**
 * Compute a human-readable duration string from two timestamps.
 *
 * @param first - First timestamp (YYYYMMDD-HHMMSS)
 * @param last - Last timestamp (YYYYMMDD-HHMMSS)
 * @returns Duration string in HH:MM:SS format
 */
function computeDuration(first: string, last: string): string {
  const start = parseTimestamp(first);
  const end = parseTimestamp(last);
  const diffMs = end.getTime() - start.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Generate a mission briefing from chronicler entries.
 *
 * Groups entries by action type, counts events per agent, generates
 * narrative paragraphs with special attention for HALT and verification
 * failure events, and computes operational metrics.
 *
 * @param entries - Array of chronicler entries
 * @param phase - Phase identifier for the briefing title
 * @returns Validated Briefing object
 */
export function generateBriefing(
  entries: ChroniclerEntry[],
  phase: string,
): Briefing {
  const now = formatTimestamp(new Date());

  // Group entries by action type
  const actionGroups = new Map<string, ChroniclerEntry[]>();
  for (const entry of entries) {
    const group = actionGroups.get(entry.action) ?? [];
    group.push(entry);
    actionGroups.set(entry.action, group);
  }

  // Collect unique agent IDs
  const agentSet = new Set<string>();
  for (const entry of entries) {
    agentSet.add(entry.agent);
  }
  const agentsActive = Array.from(agentSet);

  // Build narrative
  const narrative: string[] = [];

  // Opening
  narrative.push(
    `Phase ${phase} operations summary with ${entries.length} events across ${agentsActive.length} agents.`,
  );

  // Action group counts
  for (const [action, group] of actionGroups) {
    narrative.push(`- ${action}: ${group.length} event(s)`);
  }

  // Special attention for HALT events
  const haltEntries = actionGroups.get('halt_issued');
  if (haltEntries && haltEntries.length > 0) {
    narrative.push(
      `ALERT: HALT was issued during this phase. ${haltEntries[0].detail}`,
    );
  }

  // Special attention for verification failures
  const verFailEntries = actionGroups.get('verification_failed');
  if (verFailEntries && verFailEntries.length > 0) {
    narrative.push(
      `ATTENTION: Verification failures detected. ${verFailEntries[0].detail}`,
    );
  }

  // Closing
  narrative.push(`Briefing complete. ${entries.length} events logged.`);

  // Compute duration
  let duration = 'N/A';
  if (entries.length >= 2) {
    const timestamps = entries.map((e) => e.timestamp);
    timestamps.sort();
    duration = computeDuration(timestamps[0], timestamps[timestamps.length - 1]);
  }

  return BriefingSchema.parse({
    timestamp: now,
    phase,
    title: `Phase ${phase} Briefing`,
    narrative,
    metrics: {
      totalEvents: entries.length,
      agentsActive,
      duration,
    },
  });
}

// ============================================================================
// Briefing markdown rendering
// ============================================================================

/**
 * Render a Briefing as a markdown string.
 *
 * Follows the relay.ts formatReportMarkdown pattern: builds a lines array,
 * pushes sections, joins with newlines.
 *
 * @param briefing - Briefing to render
 * @returns Markdown string
 */
export function formatBriefingMarkdown(briefing: Briefing): string {
  const lines: string[] = [];

  // Header
  lines.push(`## Staff Briefing -- ${briefing.timestamp}`);
  lines.push('');
  lines.push(`**Phase:** ${briefing.phase}`);
  lines.push(`**${briefing.title}**`);
  lines.push('');

  // Narrative
  lines.push('### Narrative');
  for (const paragraph of briefing.narrative) {
    lines.push(paragraph);
  }
  lines.push('');

  // Metrics footer
  lines.push('### Metrics');
  lines.push(`- **Agents Active:** ${briefing.metrics.agentsActive.join(', ')}`);
  lines.push(`- **Total Events:** ${briefing.metrics.totalEvents}`);
  lines.push(`- **Duration:** ${briefing.metrics.duration}`);
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Chronicler class (stateful wrapper)
// ============================================================================

/** Entry fields the user provides (timestamp auto-filled) */
type ChroniclerEntryInput = Omit<ChroniclerEntry, 'timestamp'>;

/**
 * Stateful Chronicler wrapping all stateless functions with bound config.
 *
 * Follows the established Den agent pattern: constructor validates config
 * via Zod, methods delegate to stateless functions. Use createChronicler
 * factory for ergonomic creation.
 */
export class Chronicler {
  private readonly chroniclerConfig: ChroniclerConfig;

  /**
   * Create a new Chronicler instance.
   *
   * @param config - Chronicler configuration (validated through Zod)
   */
  constructor(config: ChroniclerConfig) {
    this.chroniclerConfig = ChroniclerConfigSchema.parse(config);
  }

  /**
   * Append an audit entry to the log.
   *
   * Auto-fills the timestamp field via formatTimestamp(new Date()).
   *
   * @param entry - Entry fields (timestamp auto-filled)
   */
  async appendEntry(entry: ChroniclerEntryInput): Promise<void> {
    const fullEntry: ChroniclerEntry = {
      ...entry,
      timestamp: formatTimestamp(new Date()),
    };
    return appendChroniclerEntry(this.chroniclerConfig.logPath, fullEntry);
  }

  /**
   * Read the full chronicler log.
   *
   * @returns Array of all chronicler entries
   */
  async readLog(): Promise<ChroniclerEntry[]> {
    return readChroniclerLog(this.chroniclerConfig.logPath);
  }

  /**
   * Generate a briefing from the current log entries.
   *
   * @param phase - Phase identifier for the briefing
   * @returns Validated Briefing
   */
  async generateBriefing(phase: string): Promise<Briefing> {
    const entries = await this.readLog();
    return generateBriefing(entries, phase);
  }

  /**
   * Render a briefing as markdown.
   *
   * @param briefing - Briefing to render
   * @returns Markdown string
   */
  formatBriefing(briefing: Briefing): string {
    return formatBriefingMarkdown(briefing);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a Chronicler with defaults applied.
 *
 * Synchronous factory -- no directory creation needed (log dirs created
 * on first append).
 *
 * @param config - Chronicler configuration (defaults applied via Zod)
 * @returns Chronicler instance
 */
export function createChronicler(
  config: Partial<ChroniclerConfig> & { busConfig: unknown },
): Chronicler {
  const validated = ChroniclerConfigSchema.parse(config);
  return new Chronicler(validated);
}
