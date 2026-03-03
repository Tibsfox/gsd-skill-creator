/**
 * EvalViewer -- multi-model benchmark display engine.
 *
 * Formats MultiModelBenchmark objects for terminal display and JSON output.
 * Provides multi-model summary tables, single-model detail views, legacy
 * fallback notes, and filtered JSON output.
 *
 * IMP-03: Threshold constants defined here for color-coding pass rate display.
 *
 * EVAL-06: Legacy runs without a model field appear under 'unknown' model column.
 */

import pc from 'picocolors';
import type { MultiModelBenchmark, ModelSummary, ModelBenchmarkRun } from './types.js';

// ============================================================================
// Constants (IMP-03: Threshold registry -- Wave 2 viewer constants)
// ============================================================================

/**
 * Pass rate at or above this threshold is displayed in green.
 * A pass rate >= 75% indicates the model is performing above the default quality bar.
 *
 * IMP-03: Rationale -- matches DEFAULT_PASS_RATE_THRESHOLD. Green = passing.
 */
export const VIEWER_PASS_RATE_GREEN_THRESHOLD = 0.75;

/**
 * Pass rate at or above this threshold (but below green) is displayed in yellow.
 * A pass rate >= 50% but < 75% indicates marginal performance.
 *
 * IMP-03: Rationale -- 50% is the midpoint; below it the model fails more than it passes.
 */
export const VIEWER_PASS_RATE_YELLOW_THRESHOLD = 0.50;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Pad a string to a fixed width (left-aligned).
 */
function padRight(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, width - stripped.length);
  return str + ' '.repeat(padding);
}

/**
 * Color-code a pass rate value based on viewer thresholds.
 */
function colorPassRate(passRate: number): string {
  const pct = `${(passRate * 100).toFixed(1)}%`;
  if (passRate >= VIEWER_PASS_RATE_GREEN_THRESHOLD) {
    return pc.green(pct);
  } else if (passRate >= VIEWER_PASS_RATE_YELLOW_THRESHOLD) {
    return pc.yellow(pct);
  } else {
    return pc.red(pct);
  }
}

/**
 * Color-code a threshold status value.
 */
function colorStatus(status: 'above' | 'below' | 'at'): string {
  switch (status) {
    case 'above': return pc.green(status);
    case 'below': return pc.red(status);
    case 'at': return pc.yellow(status);
  }
}

// ============================================================================
// EvalViewer
// ============================================================================

/**
 * Formats MultiModelBenchmark data for terminal display and JSON output.
 *
 * Usage:
 * ```typescript
 * const viewer = new EvalViewer();
 * console.log(viewer.formatMultiModelSummary(benchmark));
 * console.log(viewer.formatModelDetail(benchmark, 'ollama-llama3'));
 * console.log(viewer.formatJSON(benchmark));
 * console.log(viewer.formatJSON(benchmark, 'ollama-llama3')); // filtered
 * ```
 */
export class EvalViewer {
  /**
   * Format a multi-model summary table for terminal display.
   *
   * Shows all models side-by-side sorted by passRate descending (best model first).
   * Color-codes pass rate: green >= 75%, yellow >= 50%, red < 50%.
   * Color-codes threshold status: green='above', red='below', yellow='at'.
   * Appends legacy run note when legacyRunCount > 0.
   *
   * @param benchmark - The multi-model benchmark to display.
   * @returns Formatted terminal string.
   */
  formatMultiModelSummary(benchmark: MultiModelBenchmark): string {
    if (benchmark.models.length === 0) {
      return 'No benchmark data available';
    }

    const lines: string[] = [];

    // Header
    lines.push(`Eval Results: ${pc.bold(benchmark.skillName)}`);
    lines.push(`Benchmarked: ${pc.dim(benchmark.benchmarkedAt)}`);
    lines.push('');

    // Sort models by passRate descending (best first)
    const sortedModels = [...benchmark.models].sort((a, b) => b.passRate - a.passRate);

    // Column widths
    const modelWidth = Math.max(10, ...sortedModels.map(m => m.model.length)) + 2;
    const runsWidth = 6;
    const passRateWidth = 12;
    const accuracyWidth = 10;
    const f1Width = 8;
    const statusWidth = 8;

    // Header row
    const headerRow = [
      padRight('Model', modelWidth),
      padRight('Runs', runsWidth),
      padRight('Pass Rate', passRateWidth),
      padRight('Accuracy', accuracyWidth),
      padRight('F1', f1Width),
      'Status',
    ].join('');
    lines.push(pc.bold(headerRow));

    // Separator
    const totalWidth = modelWidth + runsWidth + passRateWidth + accuracyWidth + f1Width + statusWidth;
    lines.push('\u2500'.repeat(totalWidth));

    // Data rows
    for (const model of sortedModels) {
      const row = [
        padRight(model.model, modelWidth),
        padRight(String(model.runCount), runsWidth),
        padRight(colorPassRate(model.passRate), passRateWidth),
        padRight(`${model.avgAccuracy.toFixed(1)}%`, accuracyWidth),
        padRight(model.avgF1.toFixed(2), f1Width),
        colorStatus(model.thresholdStatus),
      ].join('');
      lines.push(row);
    }

    // Legacy note
    if (benchmark.legacyRunCount > 0) {
      lines.push('');
      lines.push(pc.dim(`${benchmark.legacyRunCount} legacy run(s) displayed under 'unknown' model`));
    }

    return lines.join('\n');
  }

  /**
   * Format a detail view for a single model's runs.
   *
   * Shows the model summary (pass rate, accuracy, F1, threshold status) and
   * each individual run with runAt, duration, passed status, accuracy, and hints.
   *
   * @param benchmark - The benchmark to filter.
   * @param modelName - The model to show details for.
   * @returns Formatted detail string, or "No results for model: {modelName}" if not found.
   */
  formatModelDetail(benchmark: MultiModelBenchmark, modelName: string): string {
    const modelSummary = benchmark.models.find(m => m.model === modelName);
    const modelRuns = benchmark.runs.filter(r => r.model === modelName);

    if (!modelSummary && modelRuns.length === 0) {
      return `No results for model: ${modelName}`;
    }

    const lines: string[] = [];

    // Header
    lines.push(`Model Detail: ${pc.bold(modelName)}`);
    lines.push(`Skill: ${pc.dim(benchmark.skillName)}`);
    lines.push('');

    // Summary
    if (modelSummary) {
      lines.push(pc.bold('Summary'));
      lines.push('\u2500'.repeat(20));
      lines.push(`  Pass Rate:  ${colorPassRate(modelSummary.passRate)}`);
      lines.push(`  Accuracy:   ${modelSummary.avgAccuracy.toFixed(1)}%`);
      lines.push(`  F1:         ${modelSummary.avgF1.toFixed(2)}`);
      lines.push(`  Status:     ${colorStatus(modelSummary.thresholdStatus)}`);
      lines.push(`  Runs:       ${modelSummary.runCount}`);
      lines.push('');
    }

    // Individual runs
    if (modelRuns.length > 0) {
      lines.push(pc.bold('Runs'));
      lines.push('\u2500'.repeat(20));
      for (const run of modelRuns) {
        const passedStr = run.passed ? pc.green('passed') : pc.red('failed');
        lines.push(`  ${pc.dim(run.runAt)} -- ${passedStr}`);
        lines.push(`    Duration: ${run.duration}ms`);
        lines.push(`    Accuracy: ${run.metrics.accuracy.toFixed(1)}%`);
        if (run.hints.length > 0) {
          lines.push(`    Hints:`);
          for (const hint of run.hints) {
            lines.push(`      \u2022 ${hint}`);
          }
        }
        lines.push('');
      }
    }

    return lines.join('\n').trimEnd();
  }

  /**
   * Format a legacy fallback note for runs attributed to 'unknown' model.
   *
   * Returns an empty string when legacyRunCount is 0, so callers can
   * conditionally append it without special-casing.
   *
   * @param benchmark - The benchmark to check legacy run count for.
   * @returns Note string, or empty string if no legacy runs.
   */
  formatLegacyFallback(benchmark: MultiModelBenchmark): string {
    if (benchmark.legacyRunCount === 0) {
      return '';
    }
    return `${benchmark.legacyRunCount} legacy run(s) displayed under 'unknown' model`;
  }

  /**
   * Format the benchmark as pretty JSON.
   *
   * If modelFilter is provided, filters models[] and runs[] to only include
   * the specified model before serializing.
   *
   * @param benchmark - The benchmark to serialize.
   * @param modelFilter - Optional model name to filter results to.
   * @returns JSON string with 2-space indentation.
   */
  formatJSON(benchmark: MultiModelBenchmark, modelFilter?: string): string {
    if (modelFilter !== undefined) {
      const filtered: MultiModelBenchmark = {
        ...benchmark,
        models: benchmark.models.filter(m => m.model === modelFilter),
        runs: benchmark.runs.filter(r => r.model === modelFilter),
      };
      return JSON.stringify(filtered, null, 2);
    }
    return JSON.stringify(benchmark, null, 2);
  }
}
