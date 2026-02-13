import type {
  PromotionCandidate,
  GatekeeperConfig,
  GatekeeperDecision,
  GatekeeperEvidence,
} from '../types/observation.js';
import { DEFAULT_GATEKEEPER_CONFIG } from '../types/observation.js';

/**
 * Evaluates promotion candidates against configurable thresholds.
 *
 * The gatekeeper checks determinism, confidence (compositeScore), and
 * observation count gates. Every decision includes reasoning text per
 * gate check and evidence with actual scores vs thresholds.
 *
 * Satisfies: GATE-01 (configurable thresholds), GATE-02 (default thresholds),
 * partial GATE-04 (reasoning + evidence on every decision).
 */
export class PromotionGatekeeper {
  private config: GatekeeperConfig;

  constructor(config: GatekeeperConfig = DEFAULT_GATEKEEPER_CONFIG) {
    this.config = config;
  }

  /**
   * Evaluate a promotion candidate against configured thresholds.
   *
   * @param candidate - The promotion candidate to evaluate
   * @returns A GatekeeperDecision with approved/rejected status, reasoning, and evidence
   */
  evaluate(candidate: PromotionCandidate): GatekeeperDecision {
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

    return {
      approved: passed,
      reasoning,
      evidence,
      candidate,
      timestamp: new Date().toISOString(),
    };
  }
}

export { DEFAULT_GATEKEEPER_CONFIG };
