/**
 * Formatter for activation score output.
 *
 * Provides multiple output formats:
 * - Text: Human-readable with colors
 * - Verbose: Full factor breakdown
 * - Quiet: CSV-like for scripting
 * - JSON: Structured output
 */

import pc from 'picocolors';
import type { ActivationScore } from '../types/activation.js';

export interface FormatOptions {
  /** Show full factor breakdown */
  verbose?: boolean;
}

export interface BatchFormatOptions extends FormatOptions {
  /** Sort by score ascending (worst first) */
  sortAscending?: boolean;
}

export class ActivationFormatter {
  /**
   * Format a single score as human-readable text.
   *
   * Standard: "Activation score: 72/100 (Likely)"
   * Verbose: includes factor breakdown
   */
  formatText(result: ActivationScore, options?: FormatOptions): string {
    const lines: string[] = [];

    // Main score line with color based on label
    const colorFn = this.getLabelColor(result.label);
    lines.push(`Activation score: ${colorFn(`${result.score}/100`)} (${result.label})`);

    // Verbose mode: show factor breakdown
    if (options?.verbose) {
      lines.push('');
      lines.push('Factor breakdown:');
      lines.push(this.formatFactor('Specificity', result.factors.specificityScore,
        this.getSpecificityHint(result)));
      lines.push(this.formatFactor('Activation', result.factors.activationPatternScore,
        result.factors.activationPatternScore < 0.5 ? 'no explicit trigger phrases found' : undefined));
      lines.push(this.formatFactor('Length', result.factors.lengthScore,
        this.getLengthHint(result.description.length)));
      lines.push(this.formatFactor('Imperative verbs', result.factors.imperativeVerbScore));
      lines.push(this.formatFactor('Generic penalty', result.factors.genericPenalty));
    }

    return lines.join('\n');
  }

  /**
   * Format batch results as human-readable text.
   *
   * Lists all skills with scores, sorted by score.
   * Includes summary counts by label.
   */
  formatBatchText(results: ActivationScore[], options?: BatchFormatOptions): string {
    const lines: string[] = [];

    // Sort results
    const sorted = [...results].sort((a, b) =>
      options?.sortAscending !== false ? a.score - b.score : b.score - a.score
    );

    lines.push('Activation Scores (sorted by score, ascending):');
    lines.push('');

    for (const result of sorted) {
      const colorFn = this.getLabelColor(result.label);
      const paddedScore = result.score.toString().padStart(3, ' ');
      lines.push(`  ${colorFn(`${paddedScore}/100`)} (${result.label.padEnd(9)}) ${result.skillName}`);
    }

    // Summary
    const counts = this.countByLabel(results);
    lines.push('');
    lines.push(`Summary: ${results.length} skills analyzed`);
    lines.push(`  Reliable (90+): ${counts.Reliable}`);
    lines.push(`  Likely (70-89): ${counts.Likely}`);
    lines.push(`  Uncertain (50-69): ${counts.Uncertain}`);
    lines.push(`  Unlikely (<50): ${counts.Unlikely}`);

    return lines.join('\n');
  }

  /**
   * Format as CSV-like output for scripting.
   * Format: skillName,score,label
   */
  formatQuiet(result: ActivationScore): string {
    return `${result.skillName},${result.score},${result.label}`;
  }

  /**
   * Format batch as CSV-like output.
   */
  formatBatchQuiet(results: ActivationScore[]): string {
    return results.map(r => this.formatQuiet(r)).join('\n');
  }

  /**
   * Format as pretty-printed JSON.
   */
  formatJson(result: ActivationScore): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Format batch as JSON array.
   */
  formatBatchJson(results: ActivationScore[]): string {
    return JSON.stringify(results, null, 2);
  }

  private getLabelColor(label: string): (s: string) => string {
    switch (label) {
      case 'Reliable': return pc.green;
      case 'Likely': return pc.blue;
      case 'Uncertain': return pc.yellow;
      case 'Unlikely': return pc.red;
      default: return (s: string) => s;
    }
  }

  private formatFactor(name: string, score: number, hint?: string): string {
    const percent = Math.round(score * 100);
    const padded = name.padEnd(16);
    const hintText = hint ? pc.dim(` (${hint})`) : '';
    return `  ${padded} ${percent}%${hintText}`;
  }

  private getSpecificityHint(result: ActivationScore): string | undefined {
    if (result.factors.specificityScore < 0.5) {
      return 'many generic terms';
    }
    return undefined;
  }

  private getLengthHint(length: number): string {
    if (length < 20) return `${length} chars - too short`;
    if (length < 50) return `${length} chars - add more context`;
    if (length <= 150) return `${length} chars - optimal range`;
    if (length <= 300) return `${length} chars - could be shorter`;
    return `${length} chars - too long`;
  }

  private countByLabel(results: ActivationScore[]): Record<string, number> {
    const counts: Record<string, number> = { Reliable: 0, Likely: 0, Uncertain: 0, Unlikely: 0 };
    for (const r of results) {
      counts[r.label]++;
    }
    return counts;
  }
}
