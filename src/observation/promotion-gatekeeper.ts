import type {
  PromotionCandidate,
  GatekeeperConfig,
  GatekeeperDecision,
  GatekeeperEvidence,
} from '../types/observation.js';
import { DEFAULT_GATEKEEPER_CONFIG } from '../types/observation.js';
import type { BenchmarkReport } from '../calibration/benchmark-reporter.js';
import { calculateMCC } from '../calibration/mcc-calculator.js';
import { PatternStore } from '../storage/pattern-store.js';

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

    // Build evidence (GATE-04)
    const evidence: GatekeeperEvidence = {
      determinism,
      compositeScore,
      observationCount,
      thresholdDeterminism: this.config.minDeterminism,
      thresholdConfidence: this.config.minConfidence,
      thresholdMinObservations: this.config.minObservations,
    };

    // Gate 4: F1 score check (GATE-03) -- only when threshold configured AND report provided
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

    // Gate 5: Accuracy check (GATE-03) -- only when threshold configured AND report provided
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

    // Gate 6: MCC check (GATE-03) -- only when threshold configured AND report provided
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

    // Persist decision for audit trail (GATE-04)
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
