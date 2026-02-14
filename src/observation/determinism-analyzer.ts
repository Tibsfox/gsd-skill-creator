import { createHash } from 'crypto';
import { PatternStore } from '../storage/pattern-store.js';
import type {
  StoredExecutionBatch,
  ToolExecutionPair,
  DeterminismScore,
  DeterminismConfig,
  DeterminismClassification,
  ClassifiedOperation,
  OperationKey,
} from '../types/observation.js';
import { DEFAULT_DETERMINISM_CONFIG } from '../types/observation.js';

/**
 * Analyzes determinism of tool operations by reading stored execution batches
 * from PatternStore and computing variance scores per operation.
 *
 * Implements DTRM-01 (input hashing), DTRM-02 (variance scoring),
 * DTRM-04 (sample size filtering), DTRM-05 (stored-data-only analysis).
 */
export class DeterminismAnalyzer {
  private store: PatternStore;
  private config: DeterminismConfig;

  constructor(store: PatternStore, config: DeterminismConfig = DEFAULT_DETERMINISM_CONFIG) {
    this.store = store;
    this.config = config;
  }

  /**
   * Analyze all stored execution batches and compute determinism scores.
   * Returns scores sorted by varianceScore ascending (most deterministic first).
   */
  async analyze(): Promise<DeterminismScore[]> {
    // Step 1: Read stored execution batches from PatternStore (DTRM-05)
    const entries = await this.store.read('executions');

    // Step 2: Group complete pairs by operation key (tool + inputHash)
    const groups = new Map<
      string,
      { key: OperationKey; outputHashes: string[]; sessionIds: Set<string> }
    >();

    for (const entry of entries) {
      const batch = entry.data as unknown as StoredExecutionBatch;

      for (const pair of batch.pairs) {
        // Skip partial pairs (CAPT-04: partial pairs have null outputHash)
        if (pair.status !== 'complete' || pair.outputHash === null) {
          continue;
        }

        // Step 3: Compute input hash (DTRM-01)
        const inputHash = this.computeInputHash(pair.input);

        // Step 4: Build composite key
        const compositeKey = `${pair.toolName}:${inputHash}`;

        if (!groups.has(compositeKey)) {
          groups.set(compositeKey, {
            key: { toolName: pair.toolName, inputHash },
            outputHashes: [],
            sessionIds: new Set(),
          });
        }

        const group = groups.get(compositeKey)!;
        group.outputHashes.push(pair.outputHash);
        group.sessionIds.add(pair.context.sessionId);
      }
    }

    // Step 5: Filter by minimum sample size (DTRM-04)
    const results: DeterminismScore[] = [];

    for (const [, group] of groups) {
      if (group.outputHashes.length < this.config.minSampleSize) {
        continue;
      }

      // Step 6: Compute variance score (DTRM-02)
      const { score, uniqueCount } = this.computeVariance(group.outputHashes);

      results.push({
        operation: group.key,
        varianceScore: score,
        observationCount: group.outputHashes.length,
        uniqueOutputs: uniqueCount,
        sessionIds: [...group.sessionIds].sort(),
      });
    }

    // Step 7: Sort by variance score ascending (most deterministic first)
    results.sort((a, b) => a.varianceScore - b.varianceScore);

    return results;
  }

  /**
   * Analyze and classify all operations by determinism tier (DTRM-03).
   * Returns ClassifiedOperation[] sorted by determinism descending (most deterministic first).
   */
  async classify(): Promise<ClassifiedOperation[]> {
    const deterministicThreshold = this.config.deterministicThreshold ?? DEFAULT_DETERMINISM_CONFIG.deterministicThreshold!;
    const semiDeterministicThreshold = this.config.semiDeterministicThreshold ?? DEFAULT_DETERMINISM_CONFIG.semiDeterministicThreshold!;

    const scores = await this.analyze();
    return scores
      .map(score => {
        const determinism = 1 - score.varianceScore;
        let classification: DeterminismClassification;
        if (determinism >= deterministicThreshold) {
          classification = 'deterministic';
        } else if (determinism >= semiDeterministicThreshold) {
          classification = 'semi-deterministic';
        } else {
          classification = 'non-deterministic';
        }
        return { score, classification, determinism };
      })
      .sort((a, b) => b.determinism - a.determinism);
  }

  /**
   * Compute SHA-256 hash of JSON-serialized input with sorted keys.
   * Sorted keys ensure deterministic hashing regardless of property insertion order.
   */
  private computeInputHash(input: Record<string, unknown>): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Compute variance score using (uniqueCount - 1) / (totalCount - 1).
   * - 0.0 when all outputs are identical (1 unique hash)
   * - 1.0 when all outputs are different (N unique hashes for N observations)
   */
  private computeVariance(outputHashes: string[]): { score: number; uniqueCount: number } {
    const uniqueHashes = new Set(outputHashes);
    const uniqueCount = uniqueHashes.size;
    const total = outputHashes.length;

    if (total <= 1) {
      return { score: 0, uniqueCount };
    }

    const score = (uniqueCount - 1) / (total - 1);
    return { score, uniqueCount };
  }
}

export { DEFAULT_DETERMINISM_CONFIG };
