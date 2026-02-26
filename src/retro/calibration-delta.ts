/**
 * Self-Improvement Lifecycle -- calibration delta computation.
 *
 * Computes estimated-vs-actual ratios for milestone metrics. The built-in
 * metric pair is wall_time_minutes / estimated_wall_time_minutes. Additional
 * metric pairs can be supplied via an optional `estimates` parameter.
 *
 * Pure functions: no side effects, no I/O.
 *
 * @module retro/calibration-delta
 */

import type { MilestoneMetrics, CalibrationDelta } from './types.js';

// ============================================================================
// Direction classification
// ============================================================================

/**
 * Classify a ratio into 'over', 'under', or 'accurate'.
 *
 * - over: ratio > 1.1 (actual exceeded estimate)
 * - under: ratio < 0.9 (actual fell short of estimate)
 * - accurate: 0.9 <= ratio <= 1.1 (estimate was on target)
 *
 * Special case: Infinity ratio is classified as 'over'.
 */
export function classifyDirection(ratio: number): 'over' | 'under' | 'accurate' {
  if (ratio === Infinity || ratio > 1.1) return 'over';
  if (ratio < 0.9) return 'under';
  return 'accurate';
}

// ============================================================================
// Delta computation
// ============================================================================

/**
 * Compute ratio safely, handling zero-estimated case.
 *
 * - estimated === 0, actual > 0: returns Infinity
 * - estimated === 0, actual === 0: returns 1.0 (both are zero = accurate)
 * - otherwise: actual / estimated
 */
function safeRatio(actual: number, estimated: number): number {
  if (estimated === 0) {
    return actual > 0 ? Infinity : 1.0;
  }
  return actual / estimated;
}

/**
 * Compute calibration deltas for all metric pairs.
 *
 * Built-in pair: wall_time_minutes / estimated_wall_time_minutes.
 * Custom estimates: any key in the `estimates` Record that matches a field
 * on MilestoneMetrics produces a delta.
 *
 * Returns CalibrationDelta[] with ratio and direction for each pair.
 */
export function computeCalibrationDeltas(
  metrics: MilestoneMetrics,
  estimates?: Record<string, number>,
): CalibrationDelta[] {
  const deltas: CalibrationDelta[] = [];

  // Built-in pair: wall_time_minutes
  const wallRatio = safeRatio(metrics.wall_time_minutes, metrics.estimated_wall_time_minutes);
  deltas.push({
    metric_name: 'wall_time_minutes',
    estimated: metrics.estimated_wall_time_minutes,
    actual: metrics.wall_time_minutes,
    ratio: wallRatio,
    direction: classifyDirection(wallRatio),
  });

  // Custom estimates
  if (estimates) {
    const metricsRecord = metrics as unknown as Record<string, unknown>;

    for (const [key, estimatedValue] of Object.entries(estimates)) {
      // Skip wall_time since it's already handled as built-in
      if (key === 'wall_time_minutes') continue;

      const actualValue = metricsRecord[key];
      if (typeof actualValue !== 'number') continue;

      const ratio = safeRatio(actualValue, estimatedValue);
      deltas.push({
        metric_name: key,
        estimated: estimatedValue,
        actual: actualValue,
        ratio,
        direction: classifyDirection(ratio),
      });
    }
  }

  return deltas;
}
