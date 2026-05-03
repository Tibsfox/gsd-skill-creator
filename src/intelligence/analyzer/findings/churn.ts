/**
 * C03 — Churn outlier detection (T6).
 *
 * Files where commit_count_90d > 5× project median commit count → churn_outlier.
 */

import type { AnalyzerOutput } from '../types.js';
import type { ChurnData, RawFinding } from './aggregator.js';

export function detectChurnOutliers(
  perFileResults: AnalyzerOutput[],
  gitChurn: Map<string, ChurnData>,
  snapshotId: string,
): RawFinding[] {
  if (perFileResults.length === 0) return [];

  // Collect commit counts for files that have git data
  const churnCounts: Array<{ filePath: string; count: number }> = [];
  for (const fileResult of perFileResults) {
    const churn = gitChurn.get(fileResult.filePath);
    if (churn) {
      churnCounts.push({ filePath: fileResult.filePath, count: churn.commit_count_90d });
    }
  }

  if (churnCounts.length === 0) return [];

  const counts = churnCounts.map(c => c.count);
  const median = computeMedian(counts);
  if (median === 0) return []; // avoid division by zero / all-zero churn

  const findings: RawFinding[] = [];
  for (const { filePath, count } of churnCounts) {
    if (count > 5 * median) {
      findings.push({
        kind: 'churn_outlier',
        severity: 'high',
        confidence: 0.85,
        title: `Churn outlier: ${filePath} (${count} commits in 90 days, median ${median})`,
        rationale: `${filePath} had ${count} commits in the last 90 days, which is ${(count / median).toFixed(1)}× the project median of ${median} commits (threshold: 5×). Snapshot ${snapshotId}.`,
        source_path: filePath,
      });
    }
  }

  return findings;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}
