/**
 * Formatter for conflict detection output.
 *
 * Provides multiple output formats for displaying conflict results:
 * - Text: Human-readable with severity grouping and colors
 * - Quiet: CSV-like format for scripting
 * - JSON: Structured output for programmatic use
 */

import pc from 'picocolors';
import type { ConflictPair, ConflictResult } from '../types/conflicts.js';

/**
 * Options for text formatting.
 */
export interface FormatOptions {
  /**
   * Show the threshold value in output.
   * Only set to true when a non-default threshold is used.
   */
  showThreshold?: boolean;

  /**
   * Minimal output for scripting.
   * When true, uses formatQuiet instead of formatText.
   */
  quiet?: boolean;
}

/**
 * Formatter for conflict detection results.
 *
 * Provides three output modes:
 * - formatText: Human-readable with colors and grouping
 * - formatQuiet: CSV-like for piping to other tools
 * - formatJson: Pretty-printed JSON structure
 */
export class ConflictFormatter {
  /**
   * Format conflict result as human-readable text.
   *
   * Groups conflicts by severity (HIGH first, then MEDIUM).
   * Uses colors for visual distinction.
   *
   * @param result - Conflict detection result
   * @param options - Formatting options
   * @returns Formatted text string
   */
  formatText(result: ConflictResult, options?: FormatOptions): string {
    const lines: string[] = [];

    // No conflicts case
    if (result.conflicts.length === 0) {
      lines.push(
        pc.green(`No conflicts detected among ${result.skillCount} skills`)
      );
      return lines.join('\n');
    }

    // Separate conflicts by severity
    const highConflicts = result.conflicts.filter((c) => c.severity === 'high');
    const mediumConflicts = result.conflicts.filter(
      (c) => c.severity === 'medium'
    );

    // HIGH severity section
    if (highConflicts.length > 0) {
      lines.push(pc.red(pc.bold('HIGH CONFLICT')));
      lines.push('');
      for (const conflict of highConflicts) {
        lines.push(...this.formatConflictPair(conflict));
        lines.push('');
      }
    }

    // MEDIUM severity section
    if (mediumConflicts.length > 0) {
      lines.push(pc.yellow(pc.bold('MEDIUM CONFLICT')));
      lines.push('');
      for (const conflict of mediumConflicts) {
        lines.push(...this.formatConflictPair(conflict));
        lines.push('');
      }
    }

    // Analysis method
    const methodLabel =
      result.analysisMethod === 'model'
        ? 'Analysis: model'
        : 'Analysis: heuristic (fallback)';
    lines.push(pc.dim(methodLabel));

    // Threshold (only when showThreshold is true)
    if (options?.showThreshold) {
      lines.push(pc.dim(`Threshold: ${result.threshold}`));
    }

    return lines.join('\n');
  }

  /**
   * Format a single conflict pair for text output.
   *
   * @param conflict - Conflict pair to format
   * @returns Array of formatted lines
   */
  private formatConflictPair(conflict: ConflictPair): string[] {
    const lines: string[] = [];

    // Skill names
    lines.push(
      `  ${pc.bold(conflict.skillA)} ${pc.dim('<->')} ${pc.bold(conflict.skillB)}`
    );

    // Similarity percentage
    const similarityPercent = Math.round(conflict.similarity * 100);
    lines.push(`  Similarity: ${similarityPercent}%`);

    // Overlapping terms
    if (conflict.overlappingTerms.length > 0) {
      lines.push(`  Common terms: ${conflict.overlappingTerms.join(', ')}`);
    }

    // Descriptions (truncated)
    lines.push(pc.dim(`  A: ${this.truncate(conflict.descriptionA, 80)}`));
    lines.push(pc.dim(`  B: ${this.truncate(conflict.descriptionB, 80)}`));

    return lines;
  }

  /**
   * Truncate a string to a maximum length.
   *
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text with "..." if needed
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }

  /**
   * Format conflict result as CSV-like output for scripting.
   *
   * Each line: "skillA,skillB,similarity,severity"
   * No headers, no extra formatting.
   *
   * @param result - Conflict detection result
   * @returns CSV-like string, empty if no conflicts
   */
  formatQuiet(result: ConflictResult): string {
    if (result.conflicts.length === 0) {
      return '';
    }

    return result.conflicts
      .map(
        (c) =>
          `${c.skillA},${c.skillB},${c.similarity.toFixed(2)},${c.severity}`
      )
      .join('\n');
  }

  /**
   * Format conflict result as pretty-printed JSON.
   *
   * @param result - Conflict detection result
   * @returns JSON string with 2-space indentation
   */
  formatJson(result: ConflictResult): string {
    return JSON.stringify(result, null, 2);
  }
}
