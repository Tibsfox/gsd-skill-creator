/**
 * @file Batch detection heuristic functions
 * @description Pure functions implementing the four batch detection heuristics:
 *              timestamp clustering, session compression, content depth, and template similarity.
 *              Each returns a BatchHeuristicResult that gets composed into the combined
 *              BatchDetectionResult by the batch runner (Phase 558-03).
 * @module core/validation/batch-detection
 */
import type { BatchDetectionConfig, BatchHeuristicResult } from './batch-types.js';
import type { ArtifactTimestamp } from '../pacing-gate/pacing-types.js';

/**
 * Detect timestamp clustering: flags when multiple artifacts are created
 * within a configurable time window, indicating batch production.
 *
 * Uses a sliding window approach: for each artifact (sorted by time),
 * counts how many subsequent artifacts fall within windowSeconds.
 * Reports the largest cluster found.
 */
export function detectTimestampClustering(
  config: BatchDetectionConfig,
  artifacts: ArtifactTimestamp[]
): BatchHeuristicResult {
  if (artifacts.length < config.timestampClusteringMinCount) {
    return {
      detected: false,
      severity: 'info',
      details: `Timestamp clustering: ${artifacts.length} artifacts checked, below minimum threshold of ${config.timestampClusteringMinCount}`,
      artifacts: [],
    };
  }

  // Sort artifacts by creation time
  const sorted = [...artifacts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const windowMs = config.timestampClusteringWindowSeconds * 1000;
  let largestCluster: ArtifactTimestamp[] = [];

  // Sliding window: for each artifact, find all within windowMs after it
  for (let i = 0; i < sorted.length; i++) {
    const windowStart = new Date(sorted[i].createdAt).getTime();
    const cluster: ArtifactTimestamp[] = [sorted[i]];

    for (let j = i + 1; j < sorted.length; j++) {
      const t = new Date(sorted[j].createdAt).getTime();
      if (t - windowStart <= windowMs) {
        cluster.push(sorted[j]);
      } else {
        break; // sorted, so no point continuing
      }
    }

    if (cluster.length > largestCluster.length) {
      largestCluster = cluster;
    }
  }

  const detected = largestCluster.length >= config.timestampClusteringMinCount;

  return {
    detected,
    severity: detected ? 'warn' : 'info',
    details: detected
      ? `Timestamp clustering: ${largestCluster.length} artifacts created within ${config.timestampClusteringWindowSeconds}s window`
      : `Timestamp clustering: no cluster of ${config.timestampClusteringMinCount}+ artifacts within ${config.timestampClusteringWindowSeconds}s window`,
    artifacts: detected ? largestCluster.map((a) => a.path) : [],
  };
}

/**
 * Detect session compression: flags when completed subversions
 * exceed the plan's per-session budget.
 *
 * Simple threshold check: detected when completedSubversions > sessionBudget.
 * At exact boundary (===), considered within budget.
 */
export function detectSessionCompression(
  completedSubversions: number,
  sessionBudget: number
): BatchHeuristicResult {
  const detected = completedSubversions > sessionBudget;

  return {
    detected,
    severity: detected ? 'warn' : 'info',
    details: detected
      ? `Session compression: ${completedSubversions}/${sessionBudget} subversions completed (exceeds budget)`
      : `Session pacing: ${completedSubversions}/${sessionBudget} subversions completed (within budget)`,
    artifacts: [],
  };
}
