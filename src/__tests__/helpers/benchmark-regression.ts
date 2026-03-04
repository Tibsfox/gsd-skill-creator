/**
 * BenchmarkRegressionChecker — compares current benchmark results against
 * a known-good baseline to detect performance regressions.
 *
 * Pure — no IO, fully testable with synthetic data.
 */

import type { MultiModelBenchmark } from '../../eval/types.js';

// ============================================================================
// Types
// ============================================================================

export interface Regression {
  model: string;
  baselinePassRate: number;
  currentPassRate: number;
  dropPercent: number;
}

export interface RegressionResult {
  passed: boolean;
  regressions: Regression[];
  modelsChecked: number;
}

// ============================================================================
// BenchmarkRegressionChecker
// ============================================================================

export class BenchmarkRegressionChecker {
  /**
   * Check for regressions by comparing current vs baseline pass rates.
   *
   * @param maxDropPercent Maximum allowed pass rate drop as percentage (default 5)
   */
  check(
    current: MultiModelBenchmark,
    baseline: MultiModelBenchmark,
    maxDropPercent = 5,
  ): RegressionResult {
    const regressions: Regression[] = [];
    let modelsChecked = 0;

    // Build lookup for baseline models
    const baselineMap = new Map(
      baseline.models.map((m) => [m.model, m.passRate]),
    );

    for (const currentModel of current.models) {
      const baselineRate = baselineMap.get(currentModel.model);
      if (baselineRate === undefined) continue;

      modelsChecked++;

      if (baselineRate === 0) continue; // Can't compute drop percent from 0

      const dropPercent = ((baselineRate - currentModel.passRate) / baselineRate) * 100;
      if (dropPercent > maxDropPercent) {
        regressions.push({
          model: currentModel.model,
          baselinePassRate: baselineRate,
          currentPassRate: currentModel.passRate,
          dropPercent: Math.round(dropPercent * 100) / 100,
        });
      }
    }

    return {
      passed: regressions.length === 0,
      regressions,
      modelsChecked,
    };
  }
}
