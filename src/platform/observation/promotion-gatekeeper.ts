/**
 * promotion-gatekeeper.ts — Pattern Intelligence: Promotion Quality Gates
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * PromotionGatekeeper evaluates PromotionCandidate objects against configurable
 * quality thresholds. Each candidate passes up to 6 gates. The gate result
 * includes the approved/rejected decision, reasoning text for each gate,
 * evidence (actual scores vs thresholds), and an optional audit trail entry.
 *
 * WHY QUALITY GATES EXIST
 * -----------------------
 * Promotion is irreversible without manual intervention. A promoted script
 * runs in place of a live tool call — if the script is wrong, it produces
 * incorrect results silently. Quality gates are the safeguard.
 *
 * This is Hemlock's role in the system — from CENTERCAMP-PERSONAL-JOURNAL:
 * "It is better to spend an hour validating the foundation than weeks fixing the collapse."
 * Gatekeeper is that hour of validation, applied systematically to every candidate.
 *
 * THE 6 GATES
 * -----------
 * Gates 1-3 are always evaluated (no report required):
 *
 *   Gate 1 — Determinism: candidate.operation.determinism >= minDeterminism
 *     The operation must be reliably deterministic. A semi-deterministic operation
 *     that occasionally varies its output should not be promoted.
 *
 *   Gate 2 — Confidence: candidate.compositeScore >= minConfidence
 *     The composite score (frequency + determinism + token savings) must be high enough.
 *     This is the holistic quality threshold.
 *
 *   Gate 3 — Observation count: observationCount >= minObservations
 *     We must have seen this operation enough times to be confident in its determinism.
 *     A single deterministic observation is not sufficient evidence.
 *
 * Gates 4-6 are conditional (only when config threshold is set AND BenchmarkReport provided):
 *
 *   Gate 4 — F1 score: report.metrics.f1Score >= minF1
 *     Calibration metric from benchmark runs. Requires active benchmarking.
 *
 *   Gate 5 — Accuracy: report.metrics.accuracy >= minAccuracy
 *     Overall prediction accuracy from benchmarks.
 *
 *   Gate 6 — MCC: calculateMCC(...) >= minMCC
 *     Matthews Correlation Coefficient — more robust than F1 for imbalanced datasets.
 *
 * All gates must pass for approval. One failure = rejection.
 *
 * REASONING AND EVIDENCE
 * ----------------------
 * Every gate produces a reasoning string: "Determinism 0.950 >= 0.9 threshold: passed"
 * The evidence object records actual vs threshold values for every evaluated gate.
 *
 * Together, reasoning and evidence make rejection decisions transparent and debuggable.
 * If a candidate is rejected, the caller can read the reasoning to understand why
 * and adjust thresholds or wait for more data.
 *
 * This reflects the principle from CENTERCAMP-PERSONAL-JOURNAL:
 * "Showing Your Work Is the Gift."
 * The gatekeeper doesn't just say "rejected" — it says exactly why,
 * with the numbers that drove the decision.
 *
 * AUDIT TRAIL
 * -----------
 * When a PatternStore is provided, every decision is persisted to 'decisions' category.
 * The stored record includes: approved, reasoning, evidence, candidateToolName,
 * candidateInputHash, timestamp.
 *
 * This audit trail enables:
 * - Reviewing historical promotion decisions
 * - Debugging why specific operations were rejected
 * - Monitoring gate pass rates over time
 * - Satisfying compliance requirements
 *
 * The PatternStore is optional — if not provided, decisions are not persisted.
 * This allows lightweight usage without storage overhead.
 *
 * GATE FAILURE BEHAVIOR
 * ---------------------
 * Gates are evaluated in order. When a gate fails, passed = false, but evaluation
 * continues through all remaining gates. The final decision considers all gate
 * results, not just the first failure.
 *
 * This "continue on failure" approach provides complete diagnostic information:
 * the caller knows which gates failed, not just that the first one did.
 *
 * SATISFIES
 * ---------
 * GATE-01: Configurable thresholds for each gate
 * GATE-02: Default thresholds (from DEFAULT_GATEKEEPER_CONFIG)
 * GATE-03: Calibration metric gates (F1, accuracy, MCC) when BenchmarkReport provided
 * GATE-04: Reasoning + evidence + audit trail on every decision
 *
 * @see PromotionDetector (promotion-detector.ts) — produces candidates evaluated here
 * @see ScriptGenerator (script-generator.ts) — receives approved candidates
 * @see DEFAULT_GATEKEEPER_CONFIG (core/types/observation.ts) — default thresholds
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Hemlock: Check the Foundation" on why
 *   rigorous validation matters before promotion
 */

import type {
  PromotionCandidate,
  GatekeeperConfig,
  GatekeeperDecision,
  GatekeeperEvidence,
} from '../../core/types/observation.js';
import { DEFAULT_GATEKEEPER_CONFIG } from '../../core/types/observation.js';
import type { BenchmarkReport } from '../calibration/benchmark-reporter.js';
import { calculateMCC } from '../calibration/mcc-calculator.js';
import { PatternStore } from '../../core/storage/pattern-store.js';

/**
 * Evaluates promotion candidates against configurable thresholds.
 *
 * The gatekeeper checks determinism, confidence (compositeScore), and
 * observation count gates. When a BenchmarkReport is provided, it also
 * checks F1, accuracy, and MCC calibration gates. Every decision includes
 * reasoning text per gate check and evidence with actual scores vs thresholds.
 *
 * Optionally persists every decision to a PatternStore 'decisions' category
 * for audit trail purposes.
 *
 * Satisfies: GATE-01 (configurable thresholds), GATE-02 (default thresholds),
 * GATE-03 (calibration wiring), GATE-04 (reasoning + evidence + audit trail).
 */
export class PromotionGatekeeper {
  private config: GatekeeperConfig;
  /** Optional PatternStore for audit trail persistence. Null = no audit trail. */
  private store: PatternStore | null;

  constructor(
    config: GatekeeperConfig = DEFAULT_GATEKEEPER_CONFIG,
    store?: PatternStore,
  ) {
    this.config = config;
    this.store = store ?? null;
  }

  /**
   * Evaluate a promotion candidate against configured thresholds.
   *
   * Evaluation is exhaustive: all gates are checked even after a failure.
   * This provides complete diagnostic information rather than stopping at first failure.
   *
   * The returned GatekeeperDecision includes:
   *   approved: boolean — true only if all evaluated gates passed
   *   reasoning: string[] — one entry per gate, with pass/fail and actual values
   *   evidence: GatekeeperEvidence — actual vs threshold values for all gates
   *   candidate: the evaluated PromotionCandidate (for correlation)
   *   timestamp: ISO string when evaluation occurred
   *
   * @param candidate - The promotion candidate to evaluate
   * @param report - Optional BenchmarkReport for calibration metric gates
   * @returns A GatekeeperDecision with approved/rejected status, reasoning, and evidence
   */
  async evaluate(
    candidate: PromotionCandidate,
    report?: BenchmarkReport,
  ): Promise<GatekeeperDecision> {
    const reasoning: string[] = [];
    let passed = true;

    const determinism = candidate.operation.determinism;
    const compositeScore = candidate.compositeScore;
    const observationCount = candidate.operation.score.observationCount;

    // Gate 1: Determinism check (GATE-01)
    // Is this operation reliably deterministic?
    if (determinism >= this.config.minDeterminism) {
      reasoning.push(
        `Determinism ${determinism.toFixed(3)} >= ${this.config.minDeterminism} threshold: passed`
      );
    } else {
      reasoning.push(
        `Determinism ${determinism.toFixed(3)} < ${this.config.minDeterminism} threshold: failed`
      );
      passed = false;
    }

    // Gate 2: Confidence (compositeScore) check (GATE-01)
    // Is the holistic quality score high enough?
    if (compositeScore >= this.config.minConfidence) {
      reasoning.push(
        `Confidence ${compositeScore.toFixed(3)} >= ${this.config.minConfidence} threshold: passed`
      );
    } else {
      reasoning.push(
        `Confidence ${compositeScore.toFixed(3)} < ${this.config.minConfidence} threshold: failed`
      );
      passed = false;
    }

    // Gate 3: Observation count check (GATE-02)
    // Have we seen this operation enough times to trust the determinism score?
    if (observationCount >= this.config.minObservations) {
      reasoning.push(
        `Observations ${observationCount} >= ${this.config.minObservations} threshold: passed`
      );
    } else {
      reasoning.push(
        `Observations ${observationCount} < ${this.config.minObservations} threshold: failed`
      );
      passed = false;
    }

    // Build evidence record — actual values vs thresholds for all gates
    const evidence: GatekeeperEvidence = {
      determinism,
      compositeScore,
      observationCount,
      thresholdDeterminism: this.config.minDeterminism,
      thresholdConfidence: this.config.minConfidence,
      thresholdMinObservations: this.config.minObservations,
    };

    // Gate 4: F1 score check (GATE-03) — only when threshold configured AND report provided
    // F1 score requires active benchmarking — not available in passive observation mode
    if (this.config.minF1 !== undefined && report) {
      const f1Score = report.metrics.f1Score;
      evidence.f1Score = f1Score;
      evidence.thresholdF1 = this.config.minF1;
      if (f1Score >= this.config.minF1) {
        reasoning.push(
          `F1 score ${f1Score.toFixed(3)} >= ${this.config.minF1} threshold: passed`
        );
      } else {
        reasoning.push(
          `F1 score ${f1Score.toFixed(3)} < ${this.config.minF1} threshold: failed`
        );
        passed = false;
      }
    }

    // Gate 5: Accuracy check (GATE-03) — only when threshold configured AND report provided
    if (this.config.minAccuracy !== undefined && report) {
      const accuracy = report.metrics.accuracy;
      evidence.accuracy = accuracy;
      evidence.thresholdAccuracy = this.config.minAccuracy;
      if (accuracy >= this.config.minAccuracy) {
        reasoning.push(
          `Accuracy ${accuracy.toFixed(3)} >= ${this.config.minAccuracy} threshold: passed`
        );
      } else {
        reasoning.push(
          `Accuracy ${accuracy.toFixed(3)} < ${this.config.minAccuracy} threshold: failed`
        );
        passed = false;
      }
    }

    // Gate 6: MCC check (GATE-03) — only when threshold configured AND report provided
    // MCC is more robust than F1 for imbalanced promotion/rejection distributions
    if (this.config.minMCC !== undefined && report) {
      const mcc = calculateMCC(
        report.metrics.truePositives,
        report.metrics.trueNegatives,
        report.metrics.falsePositives,
        report.metrics.falseNegatives,
      );
      evidence.mcc = mcc;
      evidence.thresholdMCC = this.config.minMCC;
      if (mcc >= this.config.minMCC) {
        reasoning.push(
          `MCC ${mcc.toFixed(3)} >= ${this.config.minMCC} threshold: passed`
        );
      } else {
        reasoning.push(
          `MCC ${mcc.toFixed(3)} < ${this.config.minMCC} threshold: failed`
        );
        passed = false;
      }
    }

    const decision: GatekeeperDecision = {
      approved: passed,
      reasoning,
      evidence,
      candidate,
      timestamp: new Date().toISOString(),
    };

    // Persist decision for audit trail (GATE-04) — only if store was provided
    if (this.store) {
      await this.store.append('decisions', {
        approved: decision.approved,
        reasoning: decision.reasoning,
        evidence: decision.evidence as unknown as Record<string, unknown>,
        candidateToolName: candidate.toolName,
        candidateInputHash: candidate.operation.score.operation.inputHash,
        timestamp: decision.timestamp,
      });
    }

    return decision;
  }
}

export { DEFAULT_GATEKEEPER_CONFIG };
