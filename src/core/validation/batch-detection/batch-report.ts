/**
 * @file Batch detection advisory report formatter
 * @description Formats a BatchDetectionResult into a human-readable
 *              multi-line advisory report with per-heuristic status indicators.
 * @module core/validation/batch-detection
 */
import type { BatchDetectionResult, BatchHeuristicResult } from './batch-types.js';

/**
 * Determine the display indicator for a heuristic result.
 * Non-detected always shows [PASS], detected shows severity.
 */
function severityIndicator(result: BatchHeuristicResult): string {
  if (!result.detected) return '[PASS]';
  if (result.severity === 'critical') return '[CRITICAL]';
  return '[WARN]';
}

/**
 * Format a BatchDetectionResult into a human-readable advisory report.
 *
 * The report includes:
 * - Header: "Batch Detection Advisory Report"
 * - Four labeled sections (one per heuristic) with [PASS]/[WARN]/[CRITICAL] prefix
 * - Detected heuristics include their details message indented below
 * - Overall summary line: PASS/WARN/CRITICAL with explanation
 */
export function formatBatchReport(result: BatchDetectionResult): string {
  const lines: string[] = ['Batch Detection Advisory Report', '='.repeat(40)];

  const sections: Array<{ label: string; heuristic: BatchHeuristicResult }> = [
    { label: 'Timestamp Clustering', heuristic: result.timestampClustering },
    { label: 'Session Compression', heuristic: result.sessionCompression },
    { label: 'Content Depth', heuristic: result.contentDepth },
    { label: 'Template Similarity', heuristic: result.templateSimilarity },
  ];

  for (const section of sections) {
    const indicator = severityIndicator(section.heuristic);
    lines.push('');
    lines.push(`${indicator} ${section.label}`);
    if (section.heuristic.detected) {
      lines.push(`  - ${section.heuristic.details}`);
    }
  }

  lines.push('');
  lines.push('-'.repeat(40));

  const summaryMap: Record<string, string> = {
    pass: 'Overall: PASS - No batch production signals detected',
    warn: 'Overall: WARN - Batch production signals detected',
    critical: 'Overall: CRITICAL - Strong batch production signals detected',
  };
  lines.push(summaryMap[result.overallStatus]);

  return lines.join('\n');
}
