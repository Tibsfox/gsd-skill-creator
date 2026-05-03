/**
 * C03 — Hot spot detection (D-22-14).
 *
 * Score = log(1 + commit_count_90d) × cyclomatic_complexity_max per file.
 * Top 5% → hot_spot findings.
 * Files without git data are skipped (they're noise).
 *
 * Rationale includes: X commits in 90 days × max complexity Y in {file}.
 */

import type { AnalyzerOutput } from '../types.js';
import type { ChurnData, RawFinding } from './aggregator.js';

export function detectHotSpots(
  perFileResults: AnalyzerOutput[],
  gitChurn: Map<string, ChurnData>,
  projectId: string,
  snapshotId: string,
): RawFinding[] {
  if (perFileResults.length === 0) return [];

  // Compute score for each file that has git data
  const scored: Array<{ filePath: string; score: number; commits90d: number; ccMax: number }> = [];

  for (const fileResult of perFileResults) {
    const churn = gitChurn.get(fileResult.filePath);
    if (!churn) continue; // skip files without git data

    const commits = churn.commit_count_90d;
    const ccMax = fileResult.metrics.cyclomatic_complexity_max;
    const score = Math.log(1 + commits) * ccMax;

    scored.push({
      filePath: fileResult.filePath,
      score,
      commits90d: commits,
      ccMax,
    });
  }

  if (scored.length === 0) return [];

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Top 5% (minimum 1 if any scored at all)
  const topN = Math.max(1, Math.ceil(scored.length * 0.05));
  const hotSpots = scored.slice(0, topN);

  return hotSpots.map(hs => ({
    kind: 'hot_spot' as const,
    severity: 'med' as const,
    confidence: 0.95,
    title: `Hot spot: ${hs.filePath} (${hs.commits90d} commits, CC=${hs.ccMax})`,
    rationale: `${hs.filePath} had ${hs.commits90d} commits in 90 days × max complexity ${hs.ccMax} = hot-spot score ${hs.score.toFixed(2)} (top 5% of ${scored.length} scored files in snapshot ${snapshotId}).`,
    source_path: hs.filePath,
  }));
}
