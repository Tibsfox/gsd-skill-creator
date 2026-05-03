/**
 * C03 — Complexity outlier detection (project scope, T5).
 *
 * Files in the top 1% of cyclomatic_complexity_max across the project → finding.
 */

import type { AnalyzerOutput } from '../types.js';
import type { RawFinding } from './aggregator.js';

export function detectComplexityOutliers(
  perFileResults: AnalyzerOutput[],
  snapshotId: string,
): RawFinding[] {
  if (perFileResults.length === 0) return [];

  // Sort by max complexity descending
  const sorted = [...perFileResults].sort(
    (a, b) => b.metrics.cyclomatic_complexity_max - a.metrics.cyclomatic_complexity_max,
  );

  const topN = Math.max(1, Math.ceil(sorted.length * 0.01)); // top 1%
  const allComplexities = perFileResults.map(r => r.metrics.cyclomatic_complexity_max);
  const median = computeMedian(allComplexities);

  return sorted.slice(0, topN).map(fileResult => ({
    kind: 'complexity_outlier' as const,
    severity: 'high' as const,
    confidence: 0.9,
    title: `Complexity outlier: ${fileResult.filePath} (CC=${fileResult.metrics.cyclomatic_complexity_max})`,
    rationale: `${fileResult.filePath} has cyclomatic complexity ${fileResult.metrics.cyclomatic_complexity_max} (project median: ${median}, top 1% of ${perFileResults.length} files in snapshot ${snapshotId}).`,
    source_path: fileResult.filePath,
  }));
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}
