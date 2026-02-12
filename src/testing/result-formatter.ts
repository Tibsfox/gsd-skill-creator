/**
 * Result formatting utilities for test execution output.
 *
 * Provides terminal display (grouped, colored) and JSON export (compact/pretty)
 * for test run results following CONTEXT.md decisions (RUN-05, RUN-06).
 */

import pc from 'picocolors';
import type {
  TestRunResult,
  TestCaseResult,
  RunMetrics,
} from '../types/test-run.js';
import type { TestExpectation } from '../types/testing.js';

/**
 * Options for formatting test results.
 */
export interface FormatOptions {
  /** Show confidence scores on all results (default: false) */
  verbose?: boolean;
  /** Show improvement hints section (default: true) */
  showHints?: boolean;
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 */
function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 3) + '...' : text;
}

/**
 * Format pass/fail indicator with color.
 */
function formatPassFail(passed: boolean): string {
  return passed ? pc.green('PASS') : pc.red('FAIL');
}

/**
 * Format expected behavior as human-readable text.
 */
function formatExpected(expected: TestExpectation): string {
  switch (expected) {
    case 'positive':
      return 'should activate';
    case 'negative':
      return 'should not activate';
    case 'edge-case':
      return 'borderline scenario';
  }
}

/**
 * Format actual outcome as human-readable text with score.
 */
function formatActual(result: TestCaseResult): string {
  const score = (result.actualScore * 100).toFixed(1);
  if (result.wouldActivate) {
    return `activated (${score}%)`;
  }
  return `did not activate (${score}%)`;
}

/**
 * Deduplicate an array of strings while preserving order.
 */
function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

/**
 * Result formatter for terminal display and JSON export.
 */
export class ResultFormatter {
  /**
   * Format test results for terminal display.
   *
   * Structure:
   * - Header with skill name
   * - Positive tests section
   * - Negative tests section
   * - Edge cases section (borderline language)
   * - Summary metrics
   * - Improvement hints (if any)
   */
  formatTerminal(result: TestRunResult, options: FormatOptions = {}): string {
    const { verbose = false, showHints = true } = options;
    const lines: string[] = [];

    // Header
    lines.push(`Test Results: ${pc.bold(result.skillName)}`);
    lines.push('\u2550'.repeat(40));
    lines.push('');

    // Positive tests
    if (result.positiveResults.length > 0) {
      lines.push(pc.bold(`Positive Tests (${result.positiveResults.length})`));
      lines.push('\u2500'.repeat(20));
      lines.push(...this.formatTestGroup(result.positiveResults, { verbose }));
      lines.push('');
    }

    // Negative tests
    if (result.negativeResults.length > 0) {
      lines.push(pc.bold(`Negative Tests (${result.negativeResults.length})`));
      lines.push('\u2500'.repeat(20));
      lines.push(...this.formatTestGroup(result.negativeResults, { verbose }));
      lines.push('');
    }

    // Edge cases
    if (result.edgeCaseResults.length > 0) {
      lines.push(pc.bold(`Edge Cases (${result.edgeCaseResults.length})`));
      lines.push('\u2500'.repeat(20));
      lines.push(pc.dim('(borderline scenarios - not counted in accuracy)'));
      lines.push(...this.formatEdgeCases(result.edgeCaseResults, { verbose }));
      lines.push('');
    }

    // Summary
    lines.push('\u2550'.repeat(40));
    lines.push(pc.bold('Summary'));
    lines.push('\u2500'.repeat(10));
    lines.push(this.formatMetrics(result.metrics, result.duration));
    lines.push('');

    // Hints
    if (showHints && result.hints.length > 0) {
      lines.push(this.formatHints(result.hints));
    }

    return lines.join('\n');
  }

  /**
   * Format a group of test results (positive or negative).
   */
  formatTestGroup(
    results: TestCaseResult[],
    options: FormatOptions = {}
  ): string[] {
    const { verbose = false } = options;
    const lines: string[] = [];

    for (const result of results) {
      const status = formatPassFail(result.passed);
      const prompt = truncate(result.prompt, 60);

      if (verbose) {
        const score = (result.actualScore * 100).toFixed(1);
        lines.push(`${status}  "${prompt}" ${pc.dim(`[${score}%]`)}`);
      } else {
        lines.push(`${status}  "${prompt}"`);
      }

      // Show failure details
      if (!result.passed) {
        lines.push(`      Expected: ${formatExpected(result.expected)}`);
        lines.push(`      Actual: ${formatActual(result)}`);
        lines.push(`      ${pc.dim(result.explanation)}`);
      }
    }

    return lines;
  }

  /**
   * Format edge case results with softer "borderline" language.
   */
  formatEdgeCases(
    results: TestCaseResult[],
    options: FormatOptions = {}
  ): string[] {
    const { verbose = false } = options;
    const lines: string[] = [];

    for (const result of results) {
      const prompt = truncate(result.prompt, 60);
      const score = (result.actualScore * 100).toFixed(1);
      const status = result.wouldActivate ? 'activated' : 'did not activate';

      // Use yellow circle for borderline, softer language
      const marker = pc.yellow('\u25cb');

      if (verbose) {
        lines.push(`${marker}  "${prompt}" - ${status} at ${score}%`);
      } else {
        lines.push(`${marker}  "${prompt}" - ${status} (${score}%)`);
      }
    }

    return lines;
  }

  /**
   * Format run metrics as summary section.
   */
  formatMetrics(metrics: RunMetrics, duration?: number): string {
    const lines: string[] = [];

    // Count breakdown
    const breakdown: string[] = [];
    if (metrics.truePositives + metrics.falseNegatives > 0) {
      breakdown.push(`${metrics.truePositives + metrics.falseNegatives} positive`);
    }
    if (metrics.trueNegatives + metrics.falsePositives > 0) {
      breakdown.push(`${metrics.trueNegatives + metrics.falsePositives} negative`);
    }
    if (metrics.edgeCaseCount > 0) {
      breakdown.push(`${metrics.edgeCaseCount} edge cases`);
    }

    const total = metrics.total;
    const breakdownStr = breakdown.length > 0 ? ` (${breakdown.join(', ')})` : '';
    lines.push(`Total: ${total} tests${breakdownStr}`);

    // Pass rate with color coding
    const accuracy = metrics.accuracy;
    let accuracyStr: string;
    if (accuracy >= 90) {
      accuracyStr = pc.green(`${metrics.passed}/${metrics.passed + metrics.failed} (${accuracy.toFixed(1)}%)`);
    } else if (accuracy >= 70) {
      accuracyStr = pc.yellow(`${metrics.passed}/${metrics.passed + metrics.failed} (${accuracy.toFixed(1)}%)`);
    } else {
      accuracyStr = pc.red(`${metrics.passed}/${metrics.passed + metrics.failed} (${accuracy.toFixed(1)}%)`);
    }
    lines.push(`Passed: ${accuracyStr}`);

    // False positive rate
    const fpr = metrics.falsePositiveRate;
    const fprStr = fpr <= 5 ? pc.green(`${fpr.toFixed(1)}%`) : pc.yellow(`${fpr.toFixed(1)}%`);
    lines.push(`False Positive Rate: ${fprStr}`);

    // Precision
    const precisionPct = (metrics.precision * 100).toFixed(1);
    const precisionStr = metrics.precision >= 0.9 ? pc.green(`${precisionPct}%`)
      : metrics.precision >= 0.7 ? pc.yellow(`${precisionPct}%`)
      : pc.red(`${precisionPct}%`);
    lines.push(`Precision: ${precisionStr}`);

    // Recall
    const recallPct = (metrics.recall * 100).toFixed(1);
    const recallStr = metrics.recall >= 0.9 ? pc.green(`${recallPct}%`)
      : metrics.recall >= 0.7 ? pc.yellow(`${recallPct}%`)
      : pc.red(`${recallPct}%`);
    lines.push(`Recall: ${recallStr}`);

    // F1 Score
    const f1Pct = (metrics.f1Score * 100).toFixed(1);
    const f1Str = metrics.f1Score >= 0.9 ? pc.green(`${f1Pct}%`)
      : metrics.f1Score >= 0.7 ? pc.yellow(`${f1Pct}%`)
      : pc.red(`${f1Pct}%`);
    lines.push(`F1 Score: ${f1Str}`);

    // Duration
    if (duration !== undefined) {
      lines.push(`Duration: ${duration}ms`);
    }

    return lines.join('\n');
  }

  /**
   * Format improvement hints section.
   */
  formatHints(hints: string[]): string {
    if (hints.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push(pc.bold('Improvement Hints'));
    lines.push('\u2500'.repeat(20));

    // Deduplicate hints
    const uniqueHints = dedupe(hints);
    for (const hint of uniqueHints) {
      lines.push(`\u2022 ${hint}`);
    }

    return lines.join('\n');
  }

  /**
   * Format test results as JSON.
   *
   * @param mode - 'compact' for machine-parseable (one line per entry),
   *               'pretty' for human-readable nested structure
   */
  formatJSON(result: TestRunResult, mode: 'compact' | 'pretty'): string {
    if (mode === 'compact') {
      return this.formatCompactJSON(result);
    }
    return this.formatPrettyJSON(result);
  }

  /**
   * Format as compact JSON - one line summary + one line per test.
   * Designed for grep/jq processing.
   */
  private formatCompactJSON(result: TestRunResult): string {
    const lines: string[] = [];

    // Summary line
    lines.push(
      JSON.stringify({
        skill: result.skillName,
        accuracy: Number(result.metrics.accuracy.toFixed(1)),
        fpr: Number(result.metrics.falsePositiveRate.toFixed(1)),
        precision: Number(result.metrics.precision.toFixed(3)),
        recall: Number(result.metrics.recall.toFixed(3)),
        f1Score: Number(result.metrics.f1Score.toFixed(3)),
        passed: result.metrics.passed,
        failed: result.metrics.failed,
        duration: result.duration,
      })
    );

    // One line per test result
    for (const test of result.results) {
      lines.push(
        JSON.stringify({
          test: test.testId,
          passed: test.passed,
          expected: test.expected,
          actual: Number(test.actualScore.toFixed(3)),
        })
      );
    }

    return lines.join('\n');
  }

  /**
   * Format as pretty JSON - nested structure for human reading.
   */
  private formatPrettyJSON(result: TestRunResult): string {
    const output = {
      skill: result.skillName,
      runAt: result.runAt,
      metrics: {
        total: result.metrics.total,
        passed: result.metrics.passed,
        failed: result.metrics.failed,
        accuracy: Number(result.metrics.accuracy.toFixed(1)),
        falsePositiveRate: Number(result.metrics.falsePositiveRate.toFixed(1)),
        precision: Number(result.metrics.precision.toFixed(3)),
        recall: Number(result.metrics.recall.toFixed(3)),
        f1Score: Number(result.metrics.f1Score.toFixed(3)),
        confusion: {
          truePositives: result.metrics.truePositives,
          trueNegatives: result.metrics.trueNegatives,
          falsePositives: result.metrics.falsePositives,
          falseNegatives: result.metrics.falseNegatives,
        },
        edgeCaseCount: result.metrics.edgeCaseCount,
      },
      results: {
        positive: result.positiveResults.map((r) => this.formatResultForJSON(r)),
        negative: result.negativeResults.map((r) => this.formatResultForJSON(r)),
        edgeCases: result.edgeCaseResults.map((r) => this.formatResultForJSON(r)),
      },
      hints: result.hints,
      duration: result.duration,
    };

    return JSON.stringify(output, null, 2);
  }

  /**
   * Format a single test result for JSON output.
   */
  private formatResultForJSON(result: TestCaseResult): object {
    return {
      testId: result.testId,
      prompt: result.prompt,
      passed: result.passed,
      expected: result.expected,
      actualScore: Number(result.actualScore.toFixed(3)),
      wouldActivate: result.wouldActivate,
      explanation: result.explanation,
    };
  }
}

/**
 * Convenience function to format test results for terminal.
 */
export function formatTestResults(
  result: TestRunResult,
  options?: FormatOptions
): string {
  const formatter = new ResultFormatter();
  return formatter.formatTerminal(result, options);
}

/**
 * Convenience function to format test results as JSON.
 */
export function formatJSON(
  result: TestRunResult,
  mode: 'compact' | 'pretty' = 'pretty'
): string {
  const formatter = new ResultFormatter();
  return formatter.formatJSON(result, mode);
}
