/**
 * Threshold optimizer for finding optimal activation thresholds.
 *
 * Uses F1 score optimization via grid search to find the threshold that
 * maximizes balanced accuracy between precision (avoiding false activations)
 * and recall (catching correct activations).
 *
 * Per RESEARCH.md Pattern 4: Grid search 0.50-0.95 in 0.01 steps
 * Per CONTEXT.md: Optimize for balanced accuracy (F1 score)
 */
import type { CalibrationEvent } from './calibration-types.js';

/**
 * Metrics for a single threshold candidate.
 */
export interface ThresholdCandidate {
  /** The threshold value being evaluated */
  threshold: number;
  /** F1 score (harmonic mean of precision and recall) */
  f1: number;
  /** Precision: TP / (TP + FP) */
  precision: number;
  /** Recall: TP / (TP + FN) */
  recall: number;
  /** Accuracy: (TP + TN) / total */
  accuracy: number;
}

/**
 * Result of threshold optimization.
 */
export interface OptimizationResult {
  /** Optimal threshold found by grid search */
  optimalThreshold: number;
  /** F1 score at optimal threshold */
  optimalF1: number;
  /** Current threshold for comparison */
  currentThreshold: number;
  /** F1 score at current threshold */
  currentF1: number;
  /** Improvement in F1: optimalF1 - currentF1 */
  improvement: number;
  /** Number of calibration events used */
  dataPoints: number;
  /** All evaluated threshold candidates */
  allCandidates: ThresholdCandidate[];
}

/**
 * Optimizer for finding activation thresholds that maximize F1 score.
 */
export class ThresholdOptimizer {
  /** Grid search parameters */
  private static readonly GRID_MIN = 0.5;
  private static readonly GRID_MAX = 0.95;
  private static readonly GRID_STEP = 0.01;

  /**
   * Find optimal threshold using grid search over calibration data.
   *
   * Per CONTEXT.md: Optimize for balanced accuracy (F1 score)
   * Per RESEARCH.md: Grid search 0.50-0.95 in 0.01 steps
   *
   * @param events - Calibration events with known outcomes
   * @param currentThreshold - Starting threshold for comparison
   * @returns Optimization result with optimal threshold and metrics
   */
  findOptimalThreshold(
    events: CalibrationEvent[],
    currentThreshold: number
  ): OptimizationResult {
    // Generate all threshold candidates
    const candidates: ThresholdCandidate[] = [];

    for (
      let threshold = ThresholdOptimizer.GRID_MIN;
      threshold <= ThresholdOptimizer.GRID_MAX;
      threshold = Math.round((threshold + ThresholdOptimizer.GRID_STEP) * 100) / 100
    ) {
      candidates.push(this.evaluateThreshold(events, threshold));
    }

    // Sort by F1 descending to find optimal
    const sortedCandidates = [...candidates].sort((a, b) => b.f1 - a.f1);
    const optimal = sortedCandidates[0];

    // Evaluate current threshold for comparison
    const current = this.evaluateThreshold(events, currentThreshold);

    return {
      optimalThreshold: optimal?.threshold ?? currentThreshold,
      optimalF1: optimal?.f1 ?? 0,
      currentThreshold,
      currentF1: current.f1,
      improvement: (optimal?.f1 ?? 0) - current.f1,
      dataPoints: events.length,
      allCandidates: candidates,
    };
  }

  /**
   * Evaluate a specific threshold against calibration data.
   *
   * Classification logic:
   * - predicted = bestScore >= threshold (would activate)
   * - actual = outcome === 'continued' (user accepted activation)
   *
   * @param events - Calibration events with known outcomes
   * @param threshold - Threshold to evaluate
   * @returns Metrics for this threshold
   */
  evaluateThreshold(
    events: CalibrationEvent[],
    threshold: number
  ): ThresholdCandidate {
    let tp = 0; // True Positive: predicted activate, actually accepted
    let fp = 0; // False Positive: predicted activate, actually rejected
    let tn = 0; // True Negative: predicted no activate, actually would reject
    let fn = 0; // False Negative: predicted no activate, actually would accept

    for (const event of events) {
      // Get best skill score (max similarity)
      const bestScore = this.getBestScore(event);

      // Predicted: would this threshold activate?
      const predicted = bestScore >= threshold;

      // Actual: was the activation correct?
      // 'continued' = user accepted = correct activation
      // 'corrected' = user rejected = incorrect activation
      const actual = event.outcome === 'continued';

      if (predicted && actual) {
        tp++;
      } else if (predicted && !actual) {
        fp++;
      } else if (!predicted && !actual) {
        tn++;
      } else if (!predicted && actual) {
        fn++;
      }
    }

    // Calculate metrics with safe division
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;
    const total = tp + fp + tn + fn;
    const accuracy = total > 0 ? (tp + tn) / total : 0;

    return {
      threshold,
      f1,
      precision,
      recall,
      accuracy,
    };
  }

  /**
   * Get the best (highest) skill score from an event.
   */
  private getBestScore(event: CalibrationEvent): number {
    if (event.skillScores.length === 0) {
      return 0;
    }
    return Math.max(...event.skillScores.map(s => s.similarity));
  }
}
