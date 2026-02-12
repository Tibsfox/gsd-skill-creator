/**
 * Formatter for skill health dashboard output.
 *
 * Renders health scores as:
 * - Terminal table with color-coded metrics
 * - Machine-readable JSON with summary
 * - Detailed single-skill view
 *
 * Follows patterns from ResultFormatter and BenchmarkReporter.
 */

import pc from 'picocolors';
import type { HealthScore } from '../types/evaluator.js';

/**
 * Format options for terminal output.
 */
export interface HealthFormatOptions {
  /** Show improvement suggestions for flagged skills (default: false) */
  verbose?: boolean;
}

/**
 * Color-code a numeric score.
 * Green >= 80, Yellow >= 50, Red < 50.
 */
function colorScore(score: number): string {
  const str = String(score);
  if (score >= 80) return pc.green(str);
  if (score >= 50) return pc.yellow(str);
  return pc.red(str);
}

/**
 * Format a metric value as percentage, or N/A if null.
 */
function fmtPct(value: number | null, decimals = 1): string {
  if (value === null) return pc.dim('N/A');
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Pad string to a minimum width (right-padded).
 */
function pad(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  const diff = width - stripped.length;
  return diff > 0 ? str + ' '.repeat(diff) : str;
}

export class HealthFormatter {
  /**
   * Format health scores as a terminal table.
   *
   * Shows tabular view with columns: Skill, Precision, Success, Efficiency,
   * Staleness, Score, Status. Optionally shows suggestions for flagged skills.
   *
   * @param scores - Array of health scores to display
   * @param options - Formatting options
   * @returns Formatted terminal string
   */
  formatTerminal(scores: HealthScore[], options: HealthFormatOptions = {}): string {
    const { verbose = false } = options;
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(pc.bold('Skill Health Dashboard'));
    lines.push('\u2550'.repeat(80));

    // Column widths
    const cols = {
      skill: 20,
      precision: 12,
      success: 12,
      efficiency: 12,
      staleness: 10,
      score: 8,
      status: 10,
    };

    // Table header
    const header = [
      pad('Skill', cols.skill),
      pad('Precision', cols.precision),
      pad('Success', cols.success),
      pad('Efficiency', cols.efficiency),
      pad('Staleness', cols.staleness),
      pad('Score', cols.score),
      pad('Status', cols.status),
    ].join('');
    lines.push(pc.dim(header));
    lines.push(pc.dim('\u2500'.repeat(80)));

    // Data rows
    for (const score of scores) {
      const row = [
        pad(score.skillName.length > cols.skill - 2
          ? score.skillName.slice(0, cols.skill - 5) + '...'
          : score.skillName, cols.skill),
        pad(fmtPct(score.precision), cols.precision),
        pad(fmtPct(score.successRate), cols.success),
        pad(`${(score.tokenEfficiency * 100).toFixed(0)}%`, cols.efficiency),
        pad(score.staleness !== null ? `${score.staleness}d` : pc.dim('N/A'), cols.staleness),
        pad(colorScore(score.overallScore), cols.score),
        score.flagged ? pc.red('FLAGGED') : pc.green('OK'),
      ].join('');
      lines.push(row);

      // Show suggestions in verbose mode
      if (verbose && score.flagged && score.suggestions.length > 0) {
        for (const suggestion of score.suggestions) {
          lines.push(`  ${pc.dim('\u2514')} ${pc.dim(suggestion)}`);
        }
      }
    }

    // Footer
    lines.push(pc.dim('\u2500'.repeat(80)));
    const flaggedCount = scores.filter(s => s.flagged).length;
    lines.push(`${scores.length} skills, ${flaggedCount} flagged`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Format health scores as JSON.
   *
   * @param scores - Array of health scores
   * @returns JSON string with skills array and summary
   */
  formatJSON(scores: HealthScore[]): string {
    const flaggedCount = scores.filter(s => s.flagged).length;
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)
      : 0;

    return JSON.stringify(
      {
        skills: scores,
        summary: {
          total: scores.length,
          flagged: flaggedCount,
          averageScore: avgScore,
        },
      },
      null,
      2,
    );
  }

  /**
   * Format a single skill's health in detail.
   *
   * Shows each metric with explanation, color coding, and full suggestions.
   *
   * @param score - Single health score to display
   * @returns Formatted terminal string
   */
  formatSingle(score: HealthScore): string {
    const lines: string[] = [];

    lines.push('');
    lines.push(pc.bold(`Health Report: ${score.skillName}`));
    lines.push('\u2550'.repeat(50));

    // Precision
    lines.push('');
    const precisionLabel = score.precision !== null
      ? fmtPct(score.precision)
      : pc.dim('N/A (no test data)');
    lines.push(`  Precision:        ${precisionLabel}`);

    // Success Rate
    const successLabel = score.successRate !== null
      ? fmtPct(score.successRate)
      : pc.dim('N/A (no signals)');
    lines.push(`  Success Rate:     ${successLabel}`);

    // Token Efficiency
    lines.push(`  Token Efficiency: ${(score.tokenEfficiency * 100).toFixed(0)}%`);

    // Staleness
    const stalenessLabel = score.staleness !== null
      ? `${score.staleness} days`
      : pc.dim('N/A (unknown)');
    lines.push(`  Staleness:        ${stalenessLabel}`);

    // Overall Score
    lines.push('');
    lines.push(`  Overall Score:    ${colorScore(score.overallScore)}/100`);
    lines.push(`  Status:           ${score.flagged ? pc.red('FLAGGED') : pc.green('OK')}`);

    // Suggestions
    lines.push('');
    if (score.suggestions.length > 0) {
      lines.push(pc.bold('  Suggestions:'));
      for (const suggestion of score.suggestions) {
        lines.push(`    \u2022 ${suggestion}`);
      }
    } else {
      lines.push(pc.dim('  No improvement suggestions.'));
    }

    lines.push('');
    return lines.join('\n');
  }
}
