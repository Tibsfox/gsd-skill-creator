/**
 * Result ingestion for mesh execution context preservation.
 *
 * Transforms raw MeshExecutionResult into structured ContextSummary
 * and GsdStateEntry for consumption by downstream planning and
 * state management modules.
 *
 * Pure functions -- no IO, no side effects (IMP-06).
 */

import type { MeshExecutionResult, ContextSummary, GsdStateEntry } from './context-types.js';
import { summarizeTranscript } from './transcript-summarizer.js';

/**
 * Build a context summary from a mesh execution result.
 *
 * Extracts decisions from the transcript, builds a compressed digest,
 * and assembles the ContextSummary with routing justification and artifacts.
 *
 * @param result - Raw mesh execution result
 * @returns Structured context summary
 */
export function buildContextSummary(result: MeshExecutionResult): ContextSummary {
  const { decisions, digest } = summarizeTranscript(result.transcript);

  return {
    taskId: result.taskId,
    nodeId: result.nodeId,
    decisions,
    artifacts: result.artifacts,
    routingJustification: result.routingDecision.routingJustification,
    transcriptDigest: digest,
  };
}

/**
 * Ingest a mesh execution result into a GSD state entry.
 *
 * Wraps buildContextSummary() output and the raw result into a
 * GsdStateEntry with the current timestamp as ingestedAt.
 *
 * @param result - Raw mesh execution result
 * @param phaseId - Phase identifier (e.g., "phase-54")
 * @returns GSD state entry ready for storage
 */
export function ingestMeshResult(result: MeshExecutionResult, phaseId: string): GsdStateEntry {
  const summary = buildContextSummary(result);

  return {
    phaseId,
    taskId: result.taskId,
    summary,
    rawResult: result,
    ingestedAt: new Date().toISOString(),
  };
}
