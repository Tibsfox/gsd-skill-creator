/**
 * GSD Den Relay agent -- sole communication channel between Den staff and user.
 *
 * The Relay consolidates questions from positions, classifies them by priority,
 * batches related questions, generates status reports, and ensures the user
 * receives clear, non-overwhelming information. Without the Relay, the user
 * receives raw technical output from every position -- a firehose of internal
 * chatter. The Relay translates, consolidates, and prioritizes so the user
 * gets actionable information and clear questions.
 *
 * Provides both stateless utility functions and a stateful Relay class that
 * wraps them with configuration and an internal question queue.
 */

import { z } from 'zod';

import { AgentIdSchema, BusConfigSchema } from './types.js';
import type { AgentId, BusConfig } from './types.js';
import { formatTimestamp } from './encoder.js';

// ============================================================================
// Priority classification
// ============================================================================

/** Keywords that trigger IMMEDIATE priority (case insensitive) */
const IMMEDIATE_KEYWORDS = new Set([
  'critical',
  'budget_critical',
  'halt',
  'emergency',
  'data_loss',
  'verification_failed',
]);

/** Keywords that trigger SOON priority (case insensitive) */
const SOON_KEYWORDS = new Set([
  'blocking',
  'blocked',
  'no-go',
  'nogo',
  'decision_required',
  'scope_change',
]);

/** Priority ordering for comparison (lower = higher priority) */
const PRIORITY_ORDER: Record<string, number> = {
  IMMEDIATE: 0,
  SOON: 1,
  BATCH: 2,
};

/**
 * Classify input keywords into a priority level.
 *
 * Lowercases the input and checks for substring matches against each
 * keyword set (IMMEDIATE first, then SOON, default BATCH).
 *
 * @param keywords - Space-separated keyword string to classify
 * @returns Priority level: 'IMMEDIATE', 'SOON', or 'BATCH'
 */
export function classifyPriority(keywords: string): 'IMMEDIATE' | 'SOON' | 'BATCH' {
  const lower = keywords.toLowerCase();

  for (const kw of IMMEDIATE_KEYWORDS) {
    if (lower.includes(kw)) return 'IMMEDIATE';
  }

  for (const kw of SOON_KEYWORDS) {
    if (lower.includes(kw)) return 'SOON';
  }

  return 'BATCH';
}

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for a question entry in the relay queue.
 */
export const QuestionEntrySchema = z.object({
  /** Unique question identifier */
  id: z.string(),
  /** Agent that submitted the question */
  from: AgentIdSchema,
  /** Topic for consolidation grouping (exact match) */
  topic: z.string(),
  /** The question text */
  question: z.string(),
  /** Classified priority */
  priority: z.enum(['IMMEDIATE', 'SOON', 'BATCH']),
  /** Timestamp when the question was received (YYYYMMDD-HHMMSS) */
  receivedAt: z.string(),
});

/** TypeScript type for question entries */
export type QuestionEntry = z.infer<typeof QuestionEntrySchema>;

/**
 * Schema for a batched set of questions ready for user presentation.
 */
export const QuestionBatchSchema = z.object({
  /** Questions in this batch (max maxCount) */
  questions: z.array(QuestionEntrySchema),
  /** Number of questions held back from this batch */
  held: z.number().int().nonnegative(),
  /** Total number of pending questions */
  totalPending: z.number().int().nonnegative(),
});

/** TypeScript type for question batches */
export type QuestionBatch = z.infer<typeof QuestionBatchSchema>;

/**
 * Schema for a single position's status report entry.
 */
export const PositionStatusSchema = z.object({
  /** Agent position identifier */
  position: AgentIdSchema,
  /** Current status text */
  status: z.string(),
  /** Optional detail text */
  detail: z.string().optional(),
});

/** TypeScript type for position status entries */
export type PositionStatus = z.infer<typeof PositionStatusSchema>;

/**
 * Schema for a complete status report.
 */
export const StatusReportSchema = z.object({
  /** Report timestamp in YYYYMMDD-HHMMSS format */
  timestamp: z.string(),
  /** Current milestone name */
  milestone: z.string(),
  /** Current phase name */
  phase: z.string(),
  /** Total number of phases in milestone */
  totalPhases: z.number().int().positive(),
  /** Overall status indicator */
  overallStatus: z.enum(['on_track', 'deviation', 'ahead', 'behind']),
  /** Budget utilization percentage (0-100+) */
  budgetUtilization: z.number().nonnegative(),
  /** Quality indicator */
  quality: z.enum(['healthy', 'warning', 'degraded']),
  /** Per-position status reports */
  positionReports: z.array(PositionStatusSchema),
  /** Items requiring user attention */
  attentionItems: z.array(z.string()),
  /** Planned next actions */
  nextActions: z.array(z.string()),
});

/** TypeScript type for status reports */
export type StatusReport = z.infer<typeof StatusReportSchema>;

/**
 * Schema for Relay configuration.
 */
export const RelayConfigSchema = z.object({
  /** Bus configuration for message routing */
  busConfig: BusConfigSchema,
  /** Maximum questions per batch (default 3) */
  maxQuestionsPerBatch: z.number().int().positive().default(3),
});

/** TypeScript type for relay configuration */
export type RelayConfig = z.infer<typeof RelayConfigSchema>;

// ============================================================================
// Question consolidation
// ============================================================================

/**
 * Consolidate questions by topic.
 *
 * Groups questions by exact topic match. When 2+ questions share the same
 * topic, merges them into a single entry with combined question text
 * (joined by " | "), keeps the highest priority, and keeps the earliest
 * receivedAt timestamp.
 *
 * Output is sorted by priority (IMMEDIATE first, BATCH last), then by
 * receivedAt ascending within the same priority.
 *
 * @param questions - Array of question entries to consolidate
 * @returns Consolidated and sorted array of question entries
 */
export function consolidateQuestions(questions: QuestionEntry[]): QuestionEntry[] {
  const groups = new Map<string, QuestionEntry>();

  for (const q of questions) {
    const existing = groups.get(q.topic);

    if (existing) {
      // Merge: combine question text, keep highest priority, earliest receivedAt
      const mergedPriority =
        PRIORITY_ORDER[q.priority] < PRIORITY_ORDER[existing.priority]
          ? q.priority
          : existing.priority;

      const mergedReceivedAt =
        q.receivedAt < existing.receivedAt ? q.receivedAt : existing.receivedAt;

      groups.set(q.topic, {
        ...existing,
        question: `${existing.question} | ${q.question}`,
        priority: mergedPriority,
        receivedAt: mergedReceivedAt,
      });
    } else {
      groups.set(q.topic, { ...q });
    }
  }

  // Sort by priority order, then by receivedAt ascending
  return Array.from(groups.values()).sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.receivedAt.localeCompare(b.receivedAt);
  });
}

// ============================================================================
// Batch for user
// ============================================================================

/**
 * Batch consolidated questions for user presentation.
 *
 * Selects the top maxCount questions from a consolidated list (IMMEDIATE first).
 * Never presents more than maxCount questions at once.
 *
 * @param questions - Consolidated question entries (pre-sorted by consolidateQuestions)
 * @param maxCount - Maximum questions to present (default 3)
 * @returns Question batch with held count and total pending
 */
export function batchForUser(questions: QuestionEntry[], maxCount: number = 3): QuestionBatch {
  const selected = questions.slice(0, maxCount);
  return {
    questions: selected,
    held: questions.length - selected.length,
    totalPending: questions.length,
  };
}

// ============================================================================
// Status report generation
// ============================================================================

/** Parameters for generating a status report */
export interface StatusReportParams {
  milestone: string;
  phase: string;
  totalPhases: number;
  overallStatus: 'on_track' | 'deviation' | 'ahead' | 'behind';
  budgetUtilization: number;
  quality: 'healthy' | 'warning' | 'degraded';
  positionReports: PositionStatus[];
  attentionItems?: string[];
  nextActions?: string[];
}

/**
 * Generate a structured status report.
 *
 * Fills in the timestamp automatically via formatTimestamp(new Date()).
 *
 * @param params - Report parameters
 * @returns Validated StatusReport object
 */
export function generateStatusReport(params: StatusReportParams): StatusReport {
  return StatusReportSchema.parse({
    timestamp: formatTimestamp(new Date()),
    milestone: params.milestone,
    phase: params.phase,
    totalPhases: params.totalPhases,
    overallStatus: params.overallStatus,
    budgetUtilization: params.budgetUtilization,
    quality: params.quality,
    positionReports: params.positionReports,
    attentionItems: params.attentionItems ?? [],
    nextActions: params.nextActions ?? [],
  });
}

// ============================================================================
// Report markdown rendering
// ============================================================================

/**
 * Render a StatusReport as a markdown string.
 *
 * Follows the Den spec template: header with project/phase/status/budget/quality,
 * summary derived from position reports, per-position detail, attention items
 * (only if non-empty), and next actions.
 *
 * @param report - StatusReport to render
 * @returns Markdown string
 */
export function formatReportMarkdown(report: StatusReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`## Status Report -- ${report.timestamp}`);
  lines.push('');
  lines.push(`**Project:** ${report.milestone} | **Phase:** ${report.phase}/${report.totalPhases}`);
  lines.push(`**Status:** ${report.overallStatus}`);
  lines.push(`**Budget:** ${report.budgetUtilization}% | **Quality:** ${report.quality}`);
  lines.push('');

  // Summary derived from position reports
  lines.push('### Summary');
  if (report.positionReports.length === 0) {
    lines.push('No position reports available.');
  } else {
    const activeCount = report.positionReports.filter(
      (p) => p.status !== 'idle',
    ).length;
    lines.push(
      `${activeCount} of ${report.positionReports.length} positions active.`,
    );
  }
  lines.push('');

  // Position reports
  lines.push('### Position Reports');
  for (const pr of report.positionReports) {
    const detail = pr.detail ? ` ${pr.detail}` : '';
    lines.push(`- **${pr.position}:** ${pr.status}${detail}`);
  }
  lines.push('');

  // Attention items (only if non-empty)
  if (report.attentionItems.length > 0) {
    lines.push('### Requires Your Attention');
    for (const item of report.attentionItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Next actions
  lines.push('### Up Next');
  if (report.nextActions.length === 0) {
    lines.push('No actions queued.');
  } else {
    for (const action of report.nextActions) {
      lines.push(`- ${action}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Relay class (stateful wrapper)
// ============================================================================

/** Simple counter for generating unique question IDs */
let questionCounter = 0;

/**
 * Stateful Relay agent wrapping stateless functions with configuration.
 *
 * Maintains an internal question queue and delegates to the stateless
 * classification, consolidation, batching, and reporting functions.
 */
export class Relay {
  private readonly config: RelayConfig;
  private questions: QuestionEntry[] = [];

  constructor(config: RelayConfig) {
    this.config = config;
  }

  /**
   * Classify keywords, create a question entry, and add to queue.
   *
   * @param from - Agent submitting the question
   * @param topic - Topic for consolidation grouping
   * @param question - The question text
   * @param keywords - Optional keywords for priority classification
   * @returns The created QuestionEntry
   */
  classifyAndQueue(
    from: AgentId,
    topic: string,
    question: string,
    keywords?: string,
  ): QuestionEntry {
    questionCounter++;
    const priority = classifyPriority(keywords ?? '');
    const entry: QuestionEntry = {
      id: `relay-q-${questionCounter}`,
      from,
      topic,
      question,
      priority,
      receivedAt: formatTimestamp(new Date()),
    };

    this.questions.push(entry);
    return entry;
  }

  /**
   * Get consolidated view of the current question queue.
   *
   * @returns Consolidated and sorted questions
   */
  getConsolidatedQueue(): QuestionEntry[] {
    return consolidateQuestions(this.questions);
  }

  /**
   * Get a batch of questions ready for user presentation.
   *
   * Consolidates the queue and then batches to maxQuestionsPerBatch.
   *
   * @returns Question batch
   */
  getBatch(): QuestionBatch {
    const consolidated = consolidateQuestions(this.questions);
    return batchForUser(consolidated, this.config.maxQuestionsPerBatch);
  }

  /**
   * Generate a structured status report.
   *
   * @param params - Report parameters
   * @returns Validated StatusReport
   */
  generateReport(params: StatusReportParams): StatusReport {
    return generateStatusReport(params);
  }

  /**
   * Render a status report as markdown.
   *
   * @param report - StatusReport to render
   * @returns Markdown string
   */
  formatReport(report: StatusReport): string {
    return formatReportMarkdown(report);
  }

  /**
   * Clear the internal question queue.
   */
  clearQueue(): void {
    this.questions = [];
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a configured Relay instance.
 *
 * @param config - Relay configuration (busConfig + maxQuestionsPerBatch)
 * @returns Configured Relay instance
 */
export function createRelay(config: { busConfig: BusConfig; maxQuestionsPerBatch?: number }): Relay {
  const parsed = RelayConfigSchema.parse(config);
  return new Relay(parsed);
}
