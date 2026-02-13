import { createHash } from 'crypto';
import { PatternStore } from '../storage/pattern-store.js';
import { DeterminismAnalyzer } from './determinism-analyzer.js';
import type {
  DeterminismConfig,
  PromotionCandidate,
  PromotionDetectorConfig,
  StoredExecutionBatch,
  ToolExecutionPair,
  ClassifiedOperation,
} from '../types/observation.js';
import {
  DEFAULT_PROMOTION_DETECTOR_CONFIG,
  DEFAULT_DETERMINISM_CONFIG,
  PROMOTABLE_TOOL_NAMES,
} from '../types/observation.js';

/**
 * Detects promotion candidates by consuming DeterminismAnalyzer output,
 * filtering to deterministic tool-based operations, and estimating token savings.
 *
 * Implements PRMO-01 (automatic identification) and PRMO-04 (tool-based vs conversational).
 */
export class PromotionDetector {
  private store: PatternStore;
  private config: PromotionDetectorConfig;
  private analyzer: DeterminismAnalyzer;

  /** Set of promotable tool names for O(1) lookup */
  private promotableTools: Set<string>;

  constructor(
    store: PatternStore,
    config: PromotionDetectorConfig = DEFAULT_PROMOTION_DETECTOR_CONFIG,
    determinismConfig: DeterminismConfig = DEFAULT_DETERMINISM_CONFIG,
  ) {
    this.store = store;
    this.config = config;
    this.analyzer = new DeterminismAnalyzer(store, determinismConfig);
    this.promotableTools = new Set<string>(PROMOTABLE_TOOL_NAMES);
  }

  /**
   * Detect promotion candidates from stored execution data.
   *
   * Steps:
   * 1. Get classified operations from DeterminismAnalyzer
   * 2. Filter to deterministic only (determinism >= minDeterminism)
   * 3. Filter to tool-based patterns only (PROMOTABLE_TOOL_NAMES)
   * 4. Estimate token savings from stored pair data
   * 5. Build and return PromotionCandidate[] sorted by composite score descending
   */
  async detect(): Promise<PromotionCandidate[]> {
    // Step 1: Get classified operations
    const classified = await this.analyzer.classify();

    // Step 2: Filter to deterministic only (PRMO-01)
    const deterministic = classified.filter(
      op => op.determinism >= this.config.minDeterminism,
    );

    // Step 3: Filter to tool-based patterns only (PRMO-04)
    const toolBased = deterministic.filter(
      op => this.promotableTools.has(op.score.operation.toolName),
    );

    // Step 4: Build pair lookup for token savings estimation
    const pairLookup = await this.buildPairLookup();

    // Step 5: Build candidates with composite scoring and confidence filtering
    const candidates: PromotionCandidate[] = [];

    for (const op of toolBased) {
      const key = `${op.score.operation.toolName}:${op.score.operation.inputHash}`;
      const pairs = pairLookup.get(key) ?? [];

      const tokenSavings = this.estimateTokenSavings(pairs);
      const compositeScore = this.computeCompositeScore(
        op.determinism,
        op.score.observationCount,
        tokenSavings,
      );

      candidates.push({
        operation: op,
        toolName: op.score.operation.toolName,
        frequency: op.score.observationCount,
        estimatedTokenSavings: tokenSavings,
        compositeScore,
        meetsConfidence: compositeScore >= this.config.minConfidence,
      });
    }

    // Step 6: Sort by composite score descending (highest first) (PRMO-02)
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);

    return candidates;
  }

  /**
   * Compute composite score combining determinism, frequency, and token savings.
   * Weighted combination normalized to 0.0-1.0 range (PRMO-02).
   *
   * Weights: determinism 0.4, frequency 0.35, token savings 0.25 (sum = 1.0)
   */
  private computeCompositeScore(
    determinism: number,
    frequency: number,
    tokenSavings: number,
  ): number {
    const DETERMINISM_WEIGHT = 0.4;
    const FREQUENCY_WEIGHT = 0.35;
    const TOKEN_SAVINGS_WEIGHT = 0.25;

    const determinismNorm = determinism; // Already 0.0-1.0
    const frequencyNorm = Math.min(frequency / 20, 1.0); // Cap at 20 observations
    const tokenSavingsNorm = Math.min(tokenSavings / 500, 1.0); // Cap at 500 tokens

    return (
      DETERMINISM_WEIGHT * determinismNorm +
      FREQUENCY_WEIGHT * frequencyNorm +
      TOKEN_SAVINGS_WEIGHT * tokenSavingsNorm
    );
  }

  /**
   * Estimate token savings for a set of execution pairs.
   * Uses average input + output character length divided by charsPerToken.
   */
  private estimateTokenSavings(pairs: ToolExecutionPair[]): number {
    if (pairs.length === 0) return 0;

    const avgInputSize = Math.round(
      pairs.reduce((sum, p) => sum + JSON.stringify(p.input).length, 0) / pairs.length,
    );

    const pairsWithOutput = pairs.filter(p => p.output !== null);
    const avgOutputSize = pairsWithOutput.length > 0
      ? Math.round(
          pairsWithOutput.reduce((sum, p) => sum + p.output!.length, 0) / pairsWithOutput.length,
        )
      : 0;

    return Math.round((avgInputSize + avgOutputSize) / this.config.charsPerToken);
  }

  /**
   * Build a lookup map from operation key (toolName:inputHash) to stored pairs.
   * Reads all stored execution batches and groups complete pairs by operation.
   */
  private async buildPairLookup(): Promise<Map<string, ToolExecutionPair[]>> {
    const entries = await this.store.read('executions');
    const lookup = new Map<string, ToolExecutionPair[]>();

    for (const entry of entries) {
      const batch = entry.data as unknown as StoredExecutionBatch;
      for (const pair of batch.pairs) {
        if (pair.status !== 'complete' || pair.outputHash === null) continue;
        const inputHash = this.computeInputHash(pair.input);
        const key = `${pair.toolName}:${inputHash}`;
        if (!lookup.has(key)) lookup.set(key, []);
        lookup.get(key)!.push(pair);
      }
    }

    return lookup;
  }

  /**
   * Compute SHA-256 hash of JSON-serialized input with sorted keys.
   * Must match DeterminismAnalyzer's hashing for consistent operation key lookup.
   */
  private computeInputHash(input: Record<string, unknown>): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }
}

export { DEFAULT_PROMOTION_DETECTOR_CONFIG };
