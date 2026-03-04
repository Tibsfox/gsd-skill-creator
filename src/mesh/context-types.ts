/**
 * Context preservation type system for mesh execution.
 *
 * Zod schemas and TypeScript types for decision records, context summaries,
 * mesh execution results, and GSD state entries. Consumed by
 * transcript-summarizer.ts, result-ingestion.ts, and downstream context
 * integration modules.
 *
 * Pure type definitions -- no IO, no side effects (IMP-06).
 */

import { z } from 'zod';
import { RoutingDecisionSchema } from './routing-types.js';

// ============================================================================
// DecisionRecordSchema
// ============================================================================

/**
 * A single decision captured during mesh task execution.
 * Extracted from transcript lines matching the DECISION format.
 */
export const DecisionRecordSchema = z.object({
  /** Unique identifier for this decision (e.g., dec-0, dec-1) */
  id: z.string(),
  /** What was decided */
  description: z.string(),
  /** Why it was decided */
  rationale: z.string(),
  /** Decision outcome */
  outcome: z.enum(['accepted', 'rejected', 'deferred']),
  /** ISO 8601 timestamp of when the decision was recorded */
  timestamp: z.string(),
});

/** TypeScript type for decision records */
export type DecisionRecord = z.infer<typeof DecisionRecordSchema>;

// ============================================================================
// ContextSummarySchema
// ============================================================================

/**
 * Summary of context preserved from a mesh task execution.
 * Contains decisions, artifacts, routing justification, and a compressed
 * transcript digest for downstream consumption without full transcript.
 */
export const ContextSummarySchema = z.object({
  /** Task ID this summary belongs to */
  taskId: z.string(),
  /** Node ID where the task executed */
  nodeId: z.string(),
  /** Decisions extracted from the execution transcript */
  decisions: z.array(DecisionRecordSchema),
  /** File paths or identifiers of artifacts produced */
  artifacts: z.array(z.string()),
  /** Explanation of why this node was chosen */
  routingJustification: z.string(),
  /** Compressed transcript digest (max MAX_DIGEST_LENGTH chars) */
  transcriptDigest: z.string(),
});

/** TypeScript type for context summaries */
export type ContextSummary = z.infer<typeof ContextSummarySchema>;

// ============================================================================
// MeshExecutionResultSchema
// ============================================================================

/**
 * Full result of a mesh task execution on a specific node.
 * Contains the routing decision, output, full transcript, and artifacts.
 */
export const MeshExecutionResultSchema = z.object({
  /** Task ID that was executed */
  taskId: z.string(),
  /** Node ID where execution occurred */
  nodeId: z.string(),
  /** Human-readable name of the execution node */
  nodeName: z.string(),
  /** Whether the task completed successfully */
  success: z.boolean(),
  /** Routing decision that led to this execution */
  routingDecision: RoutingDecisionSchema,
  /** Task output (stdout or result payload) */
  output: z.string(),
  /** Full execution transcript */
  transcript: z.string(),
  /** File paths or identifiers of artifacts produced */
  artifacts: z.array(z.string()),
  /** ISO 8601 timestamp of completion */
  completedAt: z.string(),
});

/** TypeScript type for mesh execution results */
export type MeshExecutionResult = z.infer<typeof MeshExecutionResultSchema>;

// ============================================================================
// GsdStateEntrySchema
// ============================================================================

/**
 * A single entry in the GSD state store, wrapping a context summary
 * and raw execution result for a completed mesh task.
 */
export const GsdStateEntrySchema = z.object({
  /** Phase identifier (e.g., phase-54) */
  phaseId: z.string(),
  /** Task ID this entry belongs to */
  taskId: z.string(),
  /** Summarized context from execution */
  summary: ContextSummarySchema,
  /** Raw mesh execution result (preserved for audit) */
  rawResult: MeshExecutionResultSchema,
  /** ISO 8601 timestamp of when this entry was ingested */
  ingestedAt: z.string(),
});

/** TypeScript type for GSD state entries */
export type GsdStateEntry = z.infer<typeof GsdStateEntrySchema>;
