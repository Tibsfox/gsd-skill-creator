/**
 * A/B evaluator for comparing two skill variants using statistical significance.
 *
 * Uses a two-sample t-test from simple-statistics to determine whether the
 * difference in activation scores between two skill variants is statistically
 * significant. Enforces a minimum sample size of N >= 10 per variant before
 * declaring significance, and uses a lookup table of critical t-values for
 * small samples (df < 30) rather than the large-sample approximation of 1.96.
 */
import { tTestTwoSample, mean, sampleStandardDeviation } from 'simple-statistics';
import type { ABResult } from '../types/evaluator.js';

export class ABEvaluator {
  private readonly MIN_ACTIVATIONS = 10;

  /**
   * Critical t-values for two-tailed test at alpha = 0.05.
   * For df < 30, use the tabulated value. For df >= 30, use 1.96.
   */
  private readonly CRITICAL_VALUES: Record<number, number> = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
    16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
    26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045,
  };

  /**
   * Get the critical t-value for the given degrees of freedom.
   *
   * Uses the t-distribution lookup table for df < 30, or the
   * normal approximation (1.96) for df >= 30.
   */
  private getCriticalValue(df: number): number {
    if (df >= 30) return 1.96;
    return this.CRITICAL_VALUES[df] ?? 1.96;
  }

  /**
   * Compare two skill variants by their activation score arrays.
   *
   * Returns an ABResult with statistical significance testing.
   * Refuses to declare a winner when either variant has fewer than
   * MIN_ACTIVATIONS scores. Null-checks tTestTwoSample return value.
   *
   * @param nameA - Name of variant A
   * @param scoresA - Activation scores for variant A
   * @param nameB - Name of variant B
   * @param scoresB - Activation scores for variant B
   * @returns ABResult with winner, significance, and descriptive statistics
   */
  compare(
    nameA: string,
    scoresA: number[],
    nameB: string,
    scoresB: number[]
  ): ABResult {
    const minimumMet =
      scoresA.length >= this.MIN_ACTIVATIONS &&
      scoresB.length >= this.MIN_ACTIVATIONS;

    if (!minimumMet) {
      return {
        variantA: {
          name: nameA,
          scores: scoresA,
          meanScore: scoresA.length > 0 ? mean(scoresA) : 0,
          stdDev: scoresA.length > 1 ? sampleStandardDeviation(scoresA) : 0,
        },
        variantB: {
          name: nameB,
          scores: scoresB,
          meanScore: scoresB.length > 0 ? mean(scoresB) : 0,
          stdDev: scoresB.length > 1 ? sampleStandardDeviation(scoresB) : 0,
        },
        tStatistic: null,
        significant: false,
        winner: 'insufficient_data',
        sampleSize: { a: scoresA.length, b: scoresB.length },
        minimumMet: false,
      };
    }

    // Two-sample t-test (testing H0: meanA = meanB, difference = 0)
    // tTestTwoSample returns null for empty/invalid samples
    const tStat = tTestTwoSample(scoresA, scoresB, 0);

    // Degrees of freedom for equal-variance t-test
    const df = scoresA.length + scoresB.length - 2;

    // Use proper critical value from t-distribution table
    const criticalValue = this.getCriticalValue(df);

    // Null-check tStat before arithmetic
    const significant = tStat !== null && Math.abs(tStat) > criticalValue;

    let winner: ABResult['winner'] = 'no_significant_difference';
    if (significant && tStat !== null) {
      // Positive t means A > B (A has higher mean)
      winner = tStat > 0 ? 'A' : 'B';
    }

    return {
      variantA: {
        name: nameA,
        scores: scoresA,
        meanScore: mean(scoresA),
        stdDev: sampleStandardDeviation(scoresA),
      },
      variantB: {
        name: nameB,
        scores: scoresB,
        meanScore: mean(scoresB),
        stdDev: sampleStandardDeviation(scoresB),
      },
      tStatistic: tStat,
      significant,
      winner,
      sampleSize: { a: scoresA.length, b: scoresB.length },
      minimumMet: true,
    };
  }
}
