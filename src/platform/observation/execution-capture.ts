/**
 * execution-capture.ts — Signal Intake: Tool Execution Pipeline
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * ExecutionCapture orchestrates the full tool execution capture pipeline:
 *   1. Parse transcript entries (via TranscriptParser)
 *   2. Pair tool_use with tool_result (pairing logic in TranscriptParser)
 *   3. Hash tool outputs (SHA-256, for determinism analysis)
 *   4. Store the batch to PatternStore 'executions' category (durable JSONL)
 *
 * This is the signal intake for the determinism analysis pipeline. Every stored
 * batch becomes data that DeterminismAnalyzer reads to compute operation variance.
 *
 * WHY THIS PIPELINE EXISTS
 * -------------------------
 * The observation system needs to know: "Does this tool always produce the same
 * output for the same input?" If yes, it's a candidate for script promotion —
 * the operation can be offloaded to a pre-generated bash script instead of
 * requiring a full LLM invocation.
 *
 * ExecutionCapture is the first step: capture what happened. DeterminismAnalyzer
 * is the second step: classify what was deterministic. PromotionDetector is the
 * third step: identify what's worth promoting. ScriptGenerator is the fourth:
 * generate the actual scripts.
 *
 * CAPTURE VS STORE SEPARATION
 * ---------------------------
 * Two methods exist for this reason:
 *   captureFromEntries() — parse and pair WITHOUT storing. Returns batch for inspection.
 *   captureAndStore()    — parse, pair, AND store to PatternStore. Full pipeline.
 *
 * The split enables callers to inspect a batch before committing it to storage.
 * Tests can use captureFromEntries() to verify pairing logic without touching disk.
 * Production code uses captureAndStore() or the convenience captureFromFile().
 *
 * STORAGE DECISION
 * ----------------
 * captureAndStore() only writes to PatternStore if there are pairs to store
 * (batch.pairs.length > 0). This prevents writing empty batches for sessions
 * with no tool calls — a minor storage efficiency and a cleaner query result.
 *
 * The 'executions' category is read by DeterminismAnalyzer.analyze() which
 * builds the determinism score model. Every batch added increases the confidence
 * of determinism scores (more observations = more reliable variance calculation).
 *
 * COMPLETE VS PARTIAL PAIRS
 * -------------------------
 * Each stored batch includes both complete and partial pairs. The counts are
 * recorded separately for monitoring:
 *   completeCount: pairs where both tool_use and tool_result were captured
 *   partialCount: pairs where only tool_use was captured (interrupted/incomplete)
 *
 * DeterminismAnalyzer only uses complete pairs for variance scoring. Partial pairs
 * are stored for completeness but excluded from scoring (they lack outputHash).
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "Lex: Clarity First, Always":
 * The Phase 0 audit of this pipeline identified exactly which fields were needed
 * and which were noise. The slim batch structure (no verbatim output, only hashes)
 * reflects that audit's findings.
 *
 * SATISFIES
 * ---------
 * CAPT-01: Capture tool execution pairs from transcripts
 * CAPT-02: Store pairs to durable JSONL
 * CAPT-03: Convenience file-based capture
 * CAPT-04: Partial pair handling for incomplete captures
 *
 * @see TranscriptParser (transcript-parser.ts) — pairing and hashing logic
 * @see DeterminismAnalyzer (determinism-analyzer.ts) — primary consumer of
 *   'executions' category data
 * @see PatternStore (core/storage/pattern-store.ts) — durable JSONL backing store
 * @see StoredExecutionBatch (core/types/observation.ts) — the stored data shape
 */

import { TranscriptParser } from './transcript-parser.js';
import { PatternStore } from '../../core/storage/pattern-store.js';
import type { TranscriptEntry, ExecutionContext, ToolExecutionPair, StoredExecutionBatch } from '../../core/types/observation.js';

/**
 * PatternStore category where execution batches are written.
 * Exported as a constant for consistent reference across DeterminismAnalyzer,
 * PromotionDetector, and any future consumers of execution data.
 */
export const EXECUTIONS_CATEGORY = 'executions' as const;

/**
 * Orchestrates tool execution capture: parsing, pairing, hashing, and storage.
 * Implements CAPT-01 through CAPT-04.
 *
 * All analysis starts here: one ExecutionCapture call per session creates
 * the raw data that the rest of the observation pipeline analyses.
 */
export class ExecutionCapture {
  private parser: TranscriptParser;
  private store: PatternStore;

  constructor(patternsDir: string = '.planning/patterns') {
    this.parser = new TranscriptParser();
    this.store = new PatternStore(patternsDir);
  }

  /**
   * Capture tool execution pairs from parsed transcript entries.
   * Does NOT store -- returns the batch for inspection or manual storage.
   *
   * Useful for:
   * - Testing: verify pairing logic without touching disk
   * - Preview: inspect what would be stored before committing
   * - Custom storage: caller handles where/how to persist
   *
   * The batch includes summary counts (completeCount, partialCount) and
   * the full pair array. DeterminismAnalyzer only uses complete pairs,
   * but partial pairs are preserved for completeness.
   */
  captureFromEntries(entries: TranscriptEntry[], context: ExecutionContext): StoredExecutionBatch {
    const pairs = this.parser.pairToolExecutions(entries, context);
    const completeCount = pairs.filter(p => p.status === 'complete').length;
    const partialCount = pairs.filter(p => p.status === 'partial').length;

    return {
      sessionId: context.sessionId,
      context,
      pairs,
      completeCount,
      partialCount,
      capturedAt: Date.now(),
    };
  }

  /**
   * Capture from entries AND store to pattern store JSONL.
   * Full pipeline: parse -> pair -> hash -> store.
   *
   * Only stores if there are pairs to store (empty sessions produce no batch).
   * This prevents cluttering the 'executions' store with empty records.
   *
   * Returns the batch regardless of whether storage occurred, allowing callers
   * to inspect results even when nothing was written.
   */
  async captureAndStore(entries: TranscriptEntry[], context: ExecutionContext): Promise<StoredExecutionBatch> {
    const batch = this.captureFromEntries(entries, context);

    // Only store if there are any pairs (complete or partial)
    if (batch.pairs.length > 0) {
      await this.store.append(EXECUTIONS_CATEGORY, batch as unknown as Record<string, unknown>);
    }

    return batch;
  }

  /**
   * Convenience: parse a transcript file and capture execution pairs.
   * Combines TranscriptParser.parse() + captureAndStore() into a single call.
   *
   * This is the standard production usage pattern:
   *   const batch = await capture.captureFromFile(transcriptPath, context);
   *
   * If the transcript file does not exist, returns a batch with 0 pairs.
   * No error is thrown — missing transcripts are treated as empty sessions.
   */
  async captureFromFile(transcriptPath: string, context: ExecutionContext): Promise<StoredExecutionBatch> {
    const entries = await this.parser.parse(transcriptPath);
    return this.captureAndStore(entries, context);
  }
}
