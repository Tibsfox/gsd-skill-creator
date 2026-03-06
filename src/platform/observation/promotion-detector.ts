/**
 * promotion-detector.ts — Pattern Intelligence: Promotion Candidate Identification
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * PromotionDetector reads DeterminismAnalyzer's classified operations and filters
 * them to find the best candidates for script promotion. It applies two additional
 * filters (determinism threshold, tool-based only) and computes a composite score
 * that combines determinism, frequency, and estimated token savings.
 *
 * The output is a ranked list of PromotionCandidate objects, ready for
 * PromotionGatekeeper to evaluate against configured quality thresholds.
 *
 * WHY DETECTION IS SEPARATE FROM CLASSIFICATION
 * -----------------------------------------------
 * DeterminismAnalyzer classifies operations by their output variance.
 * PromotionDetector applies additional criteria: not everything deterministic
 * should be promoted. An operation that runs once deterministically isn't worth
 * promoting. One that runs 50 times with the same output is an excellent candidate.
 *
 * The additional criteria reflect practical promotion value:
 *   - High frequency: more promotional benefit (50 promotions = 50x token savings)
 *   - Tool-based: only promotable tools support bash script generation
 *   - Token savings: large operations save more than small ones
 *
 * This is the pipeline pattern: each stage adds value without replacing the previous.
 * Classify → Detect → Gate → Generate is the promotion pipeline.
 *
 * PROMOTABLE TOOLS (PRMO-04)
 * --------------------------
 * Not all tools can be represented as bash scripts. Only tool-based operations
 * with deterministic, scriptable behavior are promotable:
 *
 *   Read  → cat "${file_path}"
 *   Bash  → the command verbatim
 *   Write → cat << EOF > file
 *   Glob  → find equivalent
 *   Grep  → grep -r equivalent
 *
 * Conversational tools (natural language exchanges) cannot be promoted —
 * their "output" is language-model generation, inherently non-deterministic
 * and impossible to script faithfully.
 *
 * The PROMOTABLE_TOOL_NAMES constant in observation.ts defines the allowed set.
 * This is checked via Set lookup for O(1) membership testing.
 *
 * COMPOSITE SCORE (PRMO-02)
 * -------------------------
 * compositeScore = (0.4 * determinism) + (0.35 * frequencyNorm) + (0.25 * tokenSavingsNorm)
 *
 * Weights reflect promotion priorities:
 *   - Determinism (0.4): highest weight — reliability is the prerequisite
 *   - Frequency (0.35): second — frequent operations benefit most from promotion
 *   - Token savings (0.25): third — large operations save more context
 *
 * Normalization:
 *   frequencyNorm = min(frequency / 20, 1.0)   — capped at 20 observations
 *   tokenSavingsNorm = min(savings / 500, 1.0) — capped at 500 tokens
 *
 * The caps prevent outlier frequency/savings from dominating the score.
 * An operation seen 1000 times doesn't get 50x the frequency score of one seen 20 times.
 *
 * TOKEN SAVINGS ESTIMATION
 * -------------------------
 * Savings are estimated from the average input + output character length,
 * divided by charsPerToken (default 4, from ScriptGeneratorConfig).
 *
 * This is an approximation, not a precise measurement. The actual token savings
 * depend on the model's tokenizer. 4 chars/token is a reasonable average for
 * code and English text in Claude's tokenizer.
 *
 * PAIR LOOKUP
 * -----------
 * buildPairLookup() reads all stored execution batches and creates a lookup map
 * from (toolName:inputHash) → [ToolExecutionPair]. This enables token savings
 * estimation from the actual stored pair data.
 *
 * The inputHash computation must match DeterminismAnalyzer exactly — both use
 * SHA-256 with sorted JSON keys. A mismatch would cause pairs to not be found.
 *
 * SORTING
 * -------
 * Candidates are sorted by compositeScore descending. The highest-value candidate
 * appears first. PromotionGatekeeper evaluates them in this order.
 *
 * meetsConfidence field pre-computes whether a candidate passes the minConfidence
 * threshold configured in PromotionDetectorConfig. Gatekeeper may apply additional
 * criteria beyond this initial flag.
 *
 * @see DeterminismAnalyzer (determinism-analyzer.ts) — produces classify() output consumed here
 * @see PromotionGatekeeper (promotion-gatekeeper.ts) — evaluates candidates from this detector
 * @see ScriptGenerator (script-generator.ts) — generates scripts for approved candidates
 * @see DEFAULT_PROMOTION_DETECTOR_CONFIG — default threshold and weight values
 */

import { createHash } from 'crypto';
import { PatternStore } from '../../core/storage/pattern-store.js';
import { DeterminismAnalyzer } from './determinism-analyzer.js';
import type {
  DeterminismConfig,
  PromotionCandidate,
  PromotionDetectorConfig,
  StoredExecutionBatch,
  ToolExecutionPair,
  ClassifiedOperation,
} from '../../core/types/observation.js';
import {
  DEFAULT_PROMOTION_DETECTOR_CONFIG,
  DEFAULT_DETERMINISM_CONFIG,
  PROMOTABLE_TOOL_NAMES,
} from '../../core/types/observation.js';

/**
 * Detects promotion candidates by consuming DeterminismAnalyzer output,
 * filtering to deterministic tool-based operations, and estimating token savings.
 *
 * Implements PRMO-01 (automatic identification) and PRMO-04 (tool-based vs conversational).
 *
 * Pipeline stage: DeterminismAnalyzer → PromotionDetector → PromotionGatekeeper → ScriptGenerator
 */
export class PromotionDetector {
  private store: PatternStore;
  private config: PromotionDetectorConfig;
  private analyzer: DeterminismAnalyzer;

  /** Set of promotable tool names for O(1) lookup — faster than array.includes() */
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
    // Step 1: Get classified operations — includes determinism tier and score
    const classified = await this.analyzer.classify();

    // Step 2: Filter to deterministic only (PRMO-01)
    // Only operations above the determinism threshold are promotion candidates
    const deterministic = classified.filter(
      op => op.determinism >= this.config.minDeterminism,
    );

    // Step 3: Filter to tool-based patterns only (PRMO-04)
    // Conversational patterns cannot be represented as bash scripts
    const toolBased = deterministic.filter(
      op => this.promotableTools.has(op.score.operation.toolName),
    );

    // Step 4: Build pair lookup for token savings estimation
    // Reads execution batches once and indexes by (toolName:inputHash)
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
        // Pre-compute whether candidate passes confidence threshold for Gatekeeper
        meetsConfidence: compositeScore >= this.config.minConfidence,
      });
    }

    // Step 6: Sort by composite score descending — highest value first (PRMO-02)
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);

    return candidates;
  }

  /**
   * Compute composite score combining determinism, frequency, and token savings.
   * Weighted combination normalized to 0.0-1.0 range (PRMO-02).
   *
   * Weights: determinism 0.4, frequency 0.35, token savings 0.25 (sum = 1.0)
   *
   * Frequency and savings are normalized with caps to prevent outlier dominance:
   *   frequency: capped at 20 observations
   *   savings: capped at 500 tokens
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
   *
   * charsPerToken defaults to 4 — a reasonable approximation for code/English text.
   * Returns 0 if no complete pairs are available (no output data to measure).
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
   *
   * Only complete pairs are indexed — partial pairs lack outputHash and cannot
   * be used for token savings estimation.
   *
   * The inputHash computation must match DeterminismAnalyzer's exactly.
   * Both use SHA-256 with sorted JSON keys for canonical serialization.
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
   *
   * Consistency across all pipeline stages (DeterminismAnalyzer, PromotionDetector,
   * ScriptGenerator) is critical — any divergence breaks cross-stage lookups.
   */
  private computeInputHash(input: Record<string, unknown>): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }
}

export { DEFAULT_PROMOTION_DETECTOR_CONFIG };
