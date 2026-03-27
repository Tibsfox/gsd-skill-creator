/**
 * Benchmark reporter for simulator fidelity measurement.
 *
 * Computes metrics from calibration events and generates formatted reports
 * showing correlation between simulator predictions and actual outcomes.
 *
 * Per CONTEXT.md:
 * - Headline correlation percentage plus detailed accuracy breakdown (TP, FP, TN, FN)
 * - Summary view by default, --verbose for per-skill breakdown
 * - Actionable recommendations for improvement (not just statistics)
 * - Always write JSON file alongside terminal output for CI/tooling integration
 */
import pc from 'picocolors';
import { join } from 'path';
import { homedir } from 'os';
import { calculateMCC, mccToPercentage } from './mcc-calculator.js';
import type { CalibrationEvent } from './calibration-types.js';

/**
 * Metrics for a single skill in verbose breakdown.
 */
export interface SkillMetrics {
  skillName: string;
  dataPoints: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  f1Score: number;
}

/**
 * Complete benchmark report structure.
 */
export interface BenchmarkReport {
  /** Headline metric: MCC as percentage */
  correlation: number;

  /** Detailed breakdown */
  metrics: {
    truePositives: number;
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
    accuracy: number;            // (TP + TN) / total
    precision: number;           // TP / (TP + FP)
    recall: number;              // TP / (TP + FN)
    f1Score: number;             // 2 * (P * R) / (P + R)
    falsePositiveRate: number;   // FP / (FP + TN)
  };

  /** Context */
  dataPoints: number;
  dateRange: { from: string; to: string };
  currentThreshold: number;

  /** Actionable recommendations */
  recommendations: string[];

  /** Per-skill breakdown (verbose mode) */
  skillBreakdown?: SkillMetrics[];
}

/**
 * Reporter for generating benchmark reports from calibration data.
 */
export class BenchmarkReporter {
  /**
   * Compute benchmark report from calibration events.
   *
   * @param events - Calibration events (will filter to known outcomes)
   * @param threshold - Current threshold being evaluated
   * @param verbose - Include per-skill breakdown
   */
  computeReport(
    events: CalibrationEvent[],
    threshold: number,
    verbose?: boolean
  ): BenchmarkReport {
    // Filter to known outcomes only
    const validEvents = events.filter(e => e.outcome !== 'unknown');

    if (validEvents.length === 0) {
      return this.emptyReport(threshold);
    }

    // Compute confusion matrix
    let tp = 0, tn = 0, fp = 0, fn = 0;

    for (const event of validEvents) {
      // Predicted: would any skill activate based on current threshold?
      const bestScore = Math.max(
        ...event.skillScores.map(s => s.similarity),
        0
      );
      const predicted = bestScore >= threshold;

      // Actual: did user continue with the activation (accept) or correct (reject)?
      const actual = event.outcome === 'continued';

      if (predicted && actual) tp++;
      else if (predicted && !actual) fp++;
      else if (!predicted && actual) fn++;
      else tn++;
    }

    // Calculate metrics
    const total = tp + tn + fp + fn;
    const accuracy = total > 0 ? (tp + tn) / total : 0;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;
    const falsePositiveRate = (fp + tn) > 0 ? fp / (fp + tn) : 0;

    // Calculate MCC for correlation
    const mcc = calculateMCC(tp, tn, fp, fn);
    const correlation = mccToPercentage(mcc);

    // Date range
    const timestamps = validEvents.map(e => e.timestamp).sort();
    const dateRange = {
      from: timestamps[0] || '',
      to: timestamps[timestamps.length - 1] || '',
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      correlation,
      falsePositiveRate,
      recall,
      f1Score,
      validEvents.length
    );

    // Build report
    const report: BenchmarkReport = {
      correlation,
      metrics: {
        truePositives: tp,
        trueNegatives: tn,
        falsePositives: fp,
        falseNegatives: fn,
        accuracy,
        precision,
        recall,
        f1Score,
        falsePositiveRate,
      },
      dataPoints: validEvents.length,
      dateRange,
      currentThreshold: threshold,
      recommendations,
    };

    // Add skill breakdown if verbose
    if (verbose) {
      report.skillBreakdown = this.computeSkillBreakdown(validEvents, threshold);
    }

    return report;
  }

  /**
   * Format report for terminal display.
   * Per CONTEXT.md: Headline correlation + detailed breakdown
   */
  formatTerminal(report: BenchmarkReport, verbose: boolean): string {
    const lines: string[] = [];

    // Header
    lines.push(pc.bold('Simulator Benchmark Report'));
    lines.push('');

    // Headline metric with color coding
    const correlationColor = report.correlation >= 85 ? pc.green :
                            report.correlation >= 70 ? pc.yellow : pc.red;
    lines.push(`Correlation: ${correlationColor(report.correlation + '%')}`);
    lines.push(`Data points: ${report.dataPoints}`);
    lines.push('');

    // Confusion matrix
    lines.push(pc.dim('Confusion Matrix:'));
    lines.push(`  TP: ${report.metrics.truePositives}  FP: ${report.metrics.falsePositives}`);
    lines.push(`  FN: ${report.metrics.falseNegatives}  TN: ${report.metrics.trueNegatives}`);
    lines.push('');

    // Derived metrics
    lines.push(`Accuracy: ${(report.metrics.accuracy * 100).toFixed(1)}%`);
    lines.push(`Precision: ${(report.metrics.precision * 100).toFixed(1)}%`);
    lines.push(`Recall: ${(report.metrics.recall * 100).toFixed(1)}%`);
    lines.push(`F1 Score: ${(report.metrics.f1Score * 100).toFixed(1)}%`);

    // False positive rate with color coding
    const fprColor = report.metrics.falsePositiveRate <= 0.05 ? pc.green :
                    report.metrics.falsePositiveRate <= 0.10 ? pc.yellow : pc.red;
    lines.push(`False Positive Rate: ${fprColor((report.metrics.falsePositiveRate * 100).toFixed(1) + '%')}`);
    lines.push('');

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push(pc.bold('Recommendations:'));
      for (const rec of report.recommendations) {
        lines.push(`  - ${rec}`);
      }
      lines.push('');
    }

    // Verbose per-skill breakdown
    if (verbose && report.skillBreakdown && report.skillBreakdown.length > 0) {
      lines.push(pc.bold('Per-Skill Breakdown:'));
      lines.push('');

      for (const skill of report.skillBreakdown) {
        const skillAccuracy = (skill.accuracy * 100).toFixed(1);
        const skillF1 = (skill.f1Score * 100).toFixed(1);
        lines.push(`  ${pc.cyan(skill.skillName)} (${skill.dataPoints} events)`);
        lines.push(`    TP: ${skill.truePositives}  FP: ${skill.falsePositives}  FN: ${skill.falseNegatives}  TN: ${skill.trueNegatives}`);
        lines.push(`    Accuracy: ${skillAccuracy}%  F1: ${skillF1}%`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Format report as JSON.
   * Per CONTEXT.md: Always write JSON alongside terminal output
   */
  formatJSON(report: BenchmarkReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get the JSON file path for benchmark output.
   */
  getJSONPath(): string {
    return join(homedir(), '.gsd-skill', 'calibration', 'benchmark.json');
  }

  /**
   * Generate actionable recommendations based on metrics.
   */
  private generateRecommendations(
    correlation: number,
    falsePositiveRate: number,
    recall: number,
    f1Score: number,
    dataPoints: number
  ): string[] {
    const recommendations: string[] = [];

    // Data sufficiency check first
    if (dataPoints < 100) {
      recommendations.push(
        `More data needed for reliable metrics (have ${dataPoints}, recommend 100+)`
      );
    }

    // Correlation target
    if (correlation < 85) {
      recommendations.push(
        'Collect more calibration data to improve accuracy'
      );
    }

    // False positive rate check
    if (falsePositiveRate > 0.10) {
      recommendations.push(
        'Consider raising threshold to reduce false activations'
      );
    }

    // Recall check
    if (recall < 0.70) {
      recommendations.push(
        'Consider lowering threshold to catch more valid prompts'
      );
    }

    // F1 score check
    if (f1Score < 0.70) {
      recommendations.push(
        'Consider refining skill descriptions for better differentiation'
      );
    }

    return recommendations;
  }

  /**
   * Compute per-skill breakdown for verbose output.
   */
  private computeSkillBreakdown(
    events: CalibrationEvent[],
    threshold: number
  ): SkillMetrics[] {
    // Group events by activated skill
    const skillGroups = new Map<string, CalibrationEvent[]>();

    for (const event of events) {
      // Track which skill would have won (highest score)
      const bestScore = event.skillScores.reduce(
        (best, s) => s.similarity > best.similarity ? s : best,
        { skillName: '', similarity: 0 }
      );

      const skillName = bestScore.skillName || 'none';
      const group = skillGroups.get(skillName) || [];
      group.push(event);
      skillGroups.set(skillName, group);
    }

    // Compute metrics for each skill
    const breakdown: SkillMetrics[] = [];

    for (const [skillName, skillEvents] of skillGroups) {
      if (skillName === 'none') continue;

      let tp = 0, tn = 0, fp = 0, fn = 0;

      for (const event of skillEvents) {
        const bestScore = Math.max(
          ...event.skillScores.map(s => s.similarity),
          0
        );
        const predicted = bestScore >= threshold;
        const actual = event.outcome === 'continued';

        if (predicted && actual) tp++;
        else if (predicted && !actual) fp++;
        else if (!predicted && actual) fn++;
        else tn++;
      }

      const total = tp + tn + fp + fn;
      const accuracy = total > 0 ? (tp + tn) / total : 0;
      const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
      const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
      const f1Score = (precision + recall) > 0
        ? 2 * (precision * recall) / (precision + recall)
        : 0;

      breakdown.push({
        skillName,
        dataPoints: skillEvents.length,
        truePositives: tp,
        trueNegatives: tn,
        falsePositives: fp,
        falseNegatives: fn,
        accuracy,
        f1Score,
      });
    }

    // Sort by data points (most active skills first)
    breakdown.sort((a, b) => b.dataPoints - a.dataPoints);

    return breakdown;
  }

  /**
   * Create an empty report for when there's no data.
   */
  private emptyReport(threshold: number): BenchmarkReport {
    return {
      correlation: 0,
      metrics: {
        truePositives: 0,
        trueNegatives: 0,
        falsePositives: 0,
        falseNegatives: 0,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        falsePositiveRate: 0,
      },
      dataPoints: 0,
      dateRange: { from: '', to: '' },
      currentThreshold: threshold,
      recommendations: ['No calibration data available. Use skills to collect data.'],
    };
  }
}
