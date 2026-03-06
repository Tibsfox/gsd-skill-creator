/**
 * determinism-analyzer.ts — Pattern Intelligence: Operation Variance Scoring
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * DeterminismAnalyzer reads stored ExecutionBatch records from PatternStore
 * and computes variance scores for each unique tool operation. Operations that
 * always produce the same output are classified as 'deterministic'. Those with
 * varying outputs are 'non-deterministic'.
 *
 * This classification is the prerequisite for script promotion: only deterministic
 * operations are candidates for offloading to pre-generated bash scripts.
 *
 * WHY DETERMINISM ANALYSIS EXISTS
 * --------------------------------
 * Reading a file is deterministic: given the same file path, the output is
 * always the same file content. But "summarize this codebase" is non-deterministic:
 * the output varies because language model generation varies.
 *
 * Script promotion only makes sense for deterministic operations. If an operation's
 * output changes every time it runs, a cached script would return stale results —
 * worse than no caching at all.
 *
 * DeterminismAnalyzer is the classifier that separates "safe to cache" from
 * "must stay dynamic." This is Hemlock's analytical approach: "Check the Foundation."
 * Verify that an operation is truly reliable before promoting it.
 *
 * THE VARIANCE SCORE
 * ------------------
 * Variance score = (uniqueCount - 1) / (total - 1)
 *
 * Interpretation:
 *   0.0 → all observations produced identical output (fully deterministic)
 *   1.0 → every observation produced different output (fully non-deterministic)
 *   0.5 → half the observations varied (semi-deterministic)
 *
 * Examples:
 *   3 observations, all same hash → uniqueCount=1, score = (1-1)/(3-1) = 0
 *   3 observations, all different → uniqueCount=3, score = (3-1)/(3-1) = 1
 *   4 observations, 2 unique      → uniqueCount=2, score = (2-1)/(4-1) = 0.33
 *
 * The determinism score (used in classification) = 1 - varianceScore.
 * So a varianceScore=0 → determinism=1.0 (fully deterministic).
 *
 * CLASSIFICATION TIERS
 * --------------------
 * classify() maps determinism scores to three tiers:
 *   determinism >= deterministicThreshold     → 'deterministic'    (promote-eligible)
 *   determinism >= semiDeterministicThreshold → 'semi-deterministic' (watch, don't promote)
 *   determinism < semiDeterministicThreshold  → 'non-deterministic' (do not promote)
 *
 * Default thresholds are defined in DEFAULT_DETERMINISM_CONFIG.
 * Calibrate these based on acceptable false-positive promotion rate.
 *
 * OPERATION KEY (DTRM-01)
 * -----------------------
 * Each unique operation is identified by (toolName, inputHash):
 *   toolName: the Claude tool invoked (Read, Bash, Write, etc.)
 *   inputHash: SHA-256 of the JSON-serialized input with sorted keys
 *
 * Sorted keys ensure the hash is deterministic regardless of property insertion
 * order in the input object. "{ a: 1, b: 2 }" and "{ b: 2, a: 1 }" hash the same.
 *
 * This means: "Read /path/to/file" is a single operation key, regardless of which
 * session or timestamp it was called in. Multiple calls to the same file contribute
 * to the same variance calculation.
 *
 * MINIMUM SAMPLE SIZE (DTRM-04)
 * ------------------------------
 * Operations with fewer than minSampleSize observations are filtered out.
 * Default is 2 — we need at least 2 observations to compute meaningful variance.
 *
 * With only 1 observation, variance is always 0 (trivially "deterministic").
 * The minimum sample size prevents this trivial case from polluting promotion candidates.
 *
 * STORED-DATA-ONLY ANALYSIS (DTRM-05)
 * -------------------------------------
 * DeterminismAnalyzer only reads from PatternStore — it does not re-execute any tools.
 * This is a critical safety property: the analysis is purely retrospective.
 *
 * Analysis on stored data means:
 * - No side effects (no files read/written during analysis)
 * - Fast (no network or disk I/O beyond PatternStore reads)
 * - Safe (analysis cannot trigger unintended operations)
 * - Historical (analysis improves as more executions accumulate)
 *
 * CROSS-SESSION ANALYSIS
 * ----------------------
 * The analyze() method tracks which sessions contributed to each operation's
 * variance score (via sessionIds set). This enables PromotionDetector to
 * use cross-session frequency as a confidence signal:
 * "Read /src/file.ts was observed in 5 different sessions, always same output."
 *
 * @see ExecutionCapture (execution-capture.ts) — writes the execution batches analyzed here
 * @see PromotionDetector (promotion-detector.ts) — consumes classify() output to find candidates
 * @see DEFAULT_DETERMINISM_CONFIG (core/types/observation.ts) — threshold defaults
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Hemlock: Check the Foundation" on verification
 */

import { createHash } from 'crypto';
import { PatternStore } from '../../core/storage/pattern-store.js';
import type {
  StoredExecutionBatch,
  ToolExecutionPair,
  DeterminismScore,
  DeterminismConfig,
  DeterminismClassification,
  ClassifiedOperation,
  OperationKey,
} from '../../core/types/observation.js';
import { DEFAULT_DETERMINISM_CONFIG } from '../../core/types/observation.js';

/**
 * Analyzes determinism of tool operations by reading stored execution batches
 * from PatternStore and computing variance scores per operation.
 *
 * Implements DTRM-01 (input hashing), DTRM-02 (variance scoring),
 * DTRM-04 (sample size filtering), DTRM-05 (stored-data-only analysis).
 *
 * Stateless: each analyze() and classify() call reads fresh data.
 * Safe as a singleton — no internal state between calls.
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
   *
   * Returns DeterminismScore[] sorted by varianceScore ascending (most deterministic first).
   * Lower varianceScore = more consistent output = better promotion candidate.
   *
   * Pipeline:
   *   1. Read all execution batches from PatternStore 'executions'
   *   2. Group complete pairs by (toolName, inputHash) operation key
   *   3. Skip partial pairs (no outputHash to compare)
   *   4. Filter by minimum sample size
   *   5. Compute variance score for each operation group
   *   6. Return sorted results
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
        // Sorted keys ensure hash is stable regardless of property insertion order
        const inputHash = this.computeInputHash(pair.input);

        // Step 4: Build composite key — unique per (tool, input) combination
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
    // Operations seen < minSampleSize times cannot reliably compute variance
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

    // Sort by variance score ascending — most deterministic (score=0) first
    results.sort((a, b) => a.varianceScore - b.varianceScore);

    return results;
  }

  /**
   * Analyze and classify all operations by determinism tier (DTRM-03).
   * Returns ClassifiedOperation[] sorted by determinism descending (most deterministic first).
   *
   * determinism = 1 - varianceScore
   * Thresholds from DeterminismConfig control tier boundaries.
   *
   * This is what PromotionDetector calls — it needs classified operations,
   * not raw scores. classify() wraps analyze() with the tier mapping.
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
   *
   * Must match PromotionDetector and ScriptGenerator hashing for consistent key lookup.
   * Any inconsistency in hash computation would cause the pipeline to treat the same
   * operation as different operations.
   */
  private computeInputHash(input: Record<string, unknown>): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Compute variance score using (uniqueCount - 1) / (totalCount - 1).
   *
   * Edge cases:
   * - total === 1: only one observation — variance is trivially 0 (shouldn't reach here
   *   due to minSampleSize filter, but safe to handle)
   * - total > 1, uniqueCount === 1: all outputs identical — variance = 0.0 (deterministic)
   * - total > 1, uniqueCount === total: all outputs different — variance = 1.0 (random)
   *
   * Returns both score and uniqueCount for storage in DeterminismScore.
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
