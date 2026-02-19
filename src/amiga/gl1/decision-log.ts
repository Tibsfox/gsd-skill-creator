/**
 * GL-1 append-only decision log.
 *
 * Stores all governance evaluation results with full reasoning chains,
 * timestamps, plan IDs, and verdicts (GOVR-04). The log is append-only
 * by design -- no entries can be removed, updated, or cleared.
 *
 * Query capabilities:
 * - getByPlanId: filter entries by distribution plan ID
 * - getByVerdict: filter entries by verdict (COMPLIANT, NON_COMPLIANT, ADVISORY)
 * - getAll: retrieve all entries in insertion order
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { TimestampSchema } from '../types.js';
import { EvaluationResultSchema } from './rules-engine.js';
import type { EvaluationResult } from './rules-engine.js';

// ============================================================================
// DecisionEntrySchema
// ============================================================================

/**
 * Validates a single decision log entry.
 *
 * Each entry records:
 * - entry_id: unique identifier (auto-generated)
 * - logged_at: timestamp of when the entry was logged
 * - query_type: type of governance query that produced this entry
 * - query_subject: human-readable subject of the query
 * - evaluation: full EvaluationResult with reasoning chain
 * - requestor: agent ID or "human" who made the query
 */
export const DecisionEntrySchema = z.object({
  entry_id: z.string().min(1),
  logged_at: TimestampSchema,
  query_type: z.string().min(1),
  query_subject: z.string().min(1),
  evaluation: EvaluationResultSchema,
  requestor: z.string().min(1),
}).passthrough();

export type DecisionEntry = z.infer<typeof DecisionEntrySchema>;

// ============================================================================
// DecisionLog
// ============================================================================

/**
 * Append-only decision log for governance evaluations.
 *
 * All governance evaluations are stored with full reasoning chains.
 * The log supports querying by plan ID and verdict. No mutation
 * methods (remove, delete, clear, update) exist by design.
 */
export class DecisionLog {
  private readonly entries: DecisionEntry[] = [];

  /** Number of entries in the log. */
  get size(): number {
    return this.entries.length;
  }

  /**
   * Appends a new evaluation to the log.
   *
   * @param evaluation - Full evaluation result from the rules engine
   * @param queryType - Type of governance query (e.g., "compliance_check")
   * @param subject - Human-readable subject of the query
   * @param requestor - Agent ID or "human" who made the query
   * @returns A copy of the created DecisionEntry
   */
  append(
    evaluation: EvaluationResult,
    queryType: string,
    subject: string,
    requestor: string,
  ): DecisionEntry {
    const entry: DecisionEntry = {
      entry_id: `decision-${Date.now()}-${randomUUID().slice(0, 8)}`,
      logged_at: new Date().toISOString(),
      query_type: queryType,
      query_subject: subject,
      evaluation: { ...evaluation },
      requestor,
    };

    DecisionEntrySchema.parse(entry);
    this.entries.push(entry);

    // Return a copy, not a reference to internal state
    return { ...entry, evaluation: { ...entry.evaluation } };
  }

  /**
   * Returns all entries for a specific plan ID.
   *
   * @param planId - Distribution plan ID to filter by
   * @returns Array of matching entries (copies)
   */
  getByPlanId(planId: string): DecisionEntry[] {
    return this.entries
      .filter((e) => e.evaluation.plan_id === planId)
      .map((e) => ({ ...e, evaluation: { ...e.evaluation } }));
  }

  /**
   * Returns all entries with a specific verdict.
   *
   * @param verdict - Verdict to filter by (COMPLIANT, NON_COMPLIANT, ADVISORY)
   * @returns Array of matching entries (copies)
   */
  getByVerdict(verdict: string): DecisionEntry[] {
    return this.entries
      .filter((e) => e.evaluation.verdict === verdict)
      .map((e) => ({ ...e, evaluation: { ...e.evaluation } }));
  }

  /**
   * Returns all entries in insertion order (oldest first).
   *
   * Returns a shallow copy -- modifying the returned array does not
   * affect the internal log state.
   *
   * @returns Array of all entries (copies)
   */
  getAll(): DecisionEntry[] {
    return this.entries.map((e) => ({ ...e, evaluation: { ...e.evaluation } }));
  }
}
