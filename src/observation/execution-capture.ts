import { TranscriptParser } from './transcript-parser.js';
import { PatternStore } from '../storage/pattern-store.js';
import type { TranscriptEntry, ExecutionContext, ToolExecutionPair, StoredExecutionBatch } from '../types/observation.js';

/** Pattern store category for execution pairs */
export const EXECUTIONS_CATEGORY = 'executions' as const;

/**
 * Orchestrates tool execution capture: parsing, pairing, hashing, and storage.
 * Implements CAPT-01 through CAPT-04.
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
   */
  async captureFromFile(transcriptPath: string, context: ExecutionContext): Promise<StoredExecutionBatch> {
    const entries = await this.parser.parse(transcriptPath);
    return this.captureAndStore(entries, context);
  }
}
