/**
 * Ricci-Curvature Audit — bottleneck detector.
 *
 * Partitions a list of `EdgeCurvature` records into three buckets per M4
 * §sec:m4-ollivier ¶ Expanded implementation notes:
 *
 *   - **bottleneck**: κ < −θ (candidate failure-propagation risk)
 *   - **near-bottleneck**: −θ ≤ κ < 0 (negative but above threshold)
 *   - **healthy**: κ ≥ 0
 *
 * Default threshold θ = 0.1 (matches the M4 fixture application in
 * §sec:m4-pseudocode `alg:ricci-skill-dag`).
 *
 * Pure function; no side effects.
 *
 * @module ricci-curvature-audit/bottleneck-detector
 */

import type { BottleneckReport, EdgeCurvature } from './types.js';

export const DEFAULT_BOTTLENECK_THRESHOLD = 0.1;

export function detectBottlenecks(
  curvatures: ReadonlyArray<EdgeCurvature>,
  threshold: number = DEFAULT_BOTTLENECK_THRESHOLD,
): BottleneckReport {
  const theta = Number.isFinite(threshold) && threshold >= 0
    ? threshold
    : DEFAULT_BOTTLENECK_THRESHOLD;

  const bottlenecks: EdgeCurvature[] = [];
  const nearBottlenecks: EdgeCurvature[] = [];
  const healthy: EdgeCurvature[] = [];

  for (const rec of curvatures) {
    if (rec.kappa < -theta) {
      bottlenecks.push(rec);
    } else if (rec.kappa < 0) {
      nearBottlenecks.push(rec);
    } else {
      healthy.push(rec);
    }
  }

  // Bottlenecks sorted most-negative first, for triage.
  bottlenecks.sort((a, b) => a.kappa - b.kappa);
  nearBottlenecks.sort((a, b) => a.kappa - b.kappa);
  // Healthy sorted by descending κ (most-healthy first).
  healthy.sort((a, b) => b.kappa - a.kappa);

  return { bottlenecks, nearBottlenecks, healthy, threshold: theta };
}
