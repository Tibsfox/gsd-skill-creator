/**
 * MultiModelBenchmarkRunner -- orchestrates ChipTestRunner across multiple chips.
 *
 * Runs a skill's eval suite against multiple model backends simultaneously,
 * producing a configuration x model matrix with per-model pass rates.
 *
 * IMP-03 constants:
 *   BENCHMARK_PASS_ACCURACY_THRESHOLD = 50  -- accuracy percentage above which
 *   a run is considered "passed" in the benchmark context. Different from skill
 *   activation threshold (similarity scores). This is about whether the model's
 *   overall accuracy on the skill is acceptable.
 */

import type { ChipRegistry } from '../chips/chip-registry.js';
import type { ChipTestRunner, ChipTestRunResult } from '../chips/chip-test-runner.js';
import type { ThresholdsConfigLoader } from './thresholds-config.js';
import type { ModelBenchmarkRun, ModelSummary, MultiModelBenchmark } from './types.js';

// ============================================================================
// IMP-03: Threshold constants (multi-model-benchmark level)
// ============================================================================

/**
 * Accuracy percentage threshold above which a benchmark run is considered "passed".
 *
 * IMP-03: This is distinct from the skill activation threshold (which is about
 * similarity score matching). BENCHMARK_PASS_ACCURACY_THRESHOLD is about
 * whether the model's overall accuracy on the skill is acceptable for
 * production use. 50% represents the minimum bar -- below this, the model is
 * failing more than half the test cases.
 */
export const BENCHMARK_PASS_ACCURACY_THRESHOLD = 50;

// ============================================================================
// MultiModelBenchmarkRunner
// ============================================================================

/**
 * Orchestrates ChipTestRunner across multiple model chips and aggregates
 * results into a MultiModelBenchmark (configuration x model matrix).
 *
 * Usage:
 * ```typescript
 * const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);
 * const benchmark = await runner.benchmarkSkill('my-skill', ['ollama', 'anthropic']);
 * ```
 */
export class MultiModelBenchmarkRunner {
  constructor(
    private readonly registry: ChipRegistry,
    private readonly chipTestRunner: ChipTestRunner,
    private readonly thresholdsLoader: ThresholdsConfigLoader
  ) {}

  /**
   * Run the skill's eval suite across multiple chip backends and aggregate results.
   *
   * @param skillName - Name of the skill to benchmark
   * @param chipNames - Array of chip names to benchmark against
   * @param graderChipName - Optional chip to use for grading responses
   * @returns MultiModelBenchmark with per-model summaries and individual run details
   */
  async benchmarkSkill(
    skillName: string,
    chipNames: string[],
    graderChipName?: string
  ): Promise<MultiModelBenchmark> {
    // Ensure thresholds are loaded before any chip runs
    await this.thresholdsLoader.loadFromFile();

    const runs: ModelBenchmarkRun[] = [];

    // Run each chip in sequence; catch failures so other chips continue
    for (const chipName of chipNames) {
      try {
        const chipResult = await this.chipTestRunner.runForSkill(skillName, {
          chip: chipName,
          graderChip: graderChipName,
        });
        const run = this.convertToModelBenchmarkRun(chipResult, skillName);
        runs.push(run);
      } catch (err) {
        // Failed chip: record error entry without blocking other chips
        const message = err instanceof Error ? err.message : String(err);
        const errorRun: ModelBenchmarkRun = {
          skillName,
          model: chipName,
          runAt: new Date().toISOString(),
          duration: 0,
          metrics: {
            total: 0,
            passed: 0,
            failed: 0,
            accuracy: 0,
            falsePositiveRate: 0,
            truePositives: 0,
            trueNegatives: 0,
            falsePositives: 0,
            falseNegatives: 0,
            edgeCaseCount: 0,
            precision: 0,
            recall: 0,
            f1Score: 0,
          },
          passed: false,
          hints: [`Chip unavailable: ${message}`],
        };
        runs.push(errorRun);
      }
    }

    // Count legacy runs (chipName was undefined -> model defaults to 'unknown')
    const legacyRunCount = runs.filter((r) => r.model === 'unknown').length;

    // Group runs by model and compute per-model summaries
    const modelSummaries = this.computeModelSummaries(runs);

    return {
      skillName,
      benchmarkedAt: new Date().toISOString(),
      models: modelSummaries,
      runs,
      legacyRunCount,
    };
  }

  /**
   * Convert a ChipTestRunResult into a ModelBenchmarkRun.
   *
   * Does not mutate the original ChipTestRunResult (EVAL-02 backward compat).
   * Legacy runs (chipName undefined) get model='unknown' per EVAL-06.
   */
  private convertToModelBenchmarkRun(
    result: ChipTestRunResult,
    skillName: string
  ): ModelBenchmarkRun {
    const model = result.chipName ?? 'unknown';
    const passed = result.metrics.accuracy >= BENCHMARK_PASS_ACCURACY_THRESHOLD;

    return {
      skillName,
      model,
      runAt: result.runAt,
      duration: result.duration,
      metrics: result.metrics,
      passed,
      hints: result.hints ?? [],
    };
  }

  /**
   * Group runs by model and compute per-model aggregate statistics.
   */
  private computeModelSummaries(runs: ModelBenchmarkRun[]): ModelSummary[] {
    // Group by model name
    const byModel = new Map<string, ModelBenchmarkRun[]>();
    for (const run of runs) {
      const existing = byModel.get(run.model) ?? [];
      existing.push(run);
      byModel.set(run.model, existing);
    }

    const summaries: ModelSummary[] = [];

    for (const [model, modelRuns] of byModel.entries()) {
      const runCount = modelRuns.length;
      const passedRuns = modelRuns.filter((r) => r.passed).length;
      const passRate = runCount > 0 ? passedRuns / runCount : 0;

      const avgAccuracy =
        runCount > 0
          ? modelRuns.reduce((sum, r) => sum + r.metrics.accuracy, 0) / runCount
          : 0;

      const avgF1 =
        runCount > 0
          ? modelRuns.reduce((sum, r) => sum + r.metrics.f1Score, 0) / runCount
          : 0;

      // Use ThresholdsConfigLoader.getStatus() for threshold comparison
      const thresholdStatus = this.thresholdsLoader.getStatus(passRate, model);

      summaries.push({
        model,
        runCount,
        passRate,
        avgAccuracy,
        avgF1,
        thresholdStatus,
      });
    }

    return summaries;
  }
}
