/**
 * Barrel export and assembly function for planning quality metrics.
 *
 * Re-exports all four quality renderers and provides an
 * `assembleQualitySection` function that combines them into a single
 * HTML section suitable for warm-tier refresh.
 *
 * @module dashboard/metrics/quality
 */

import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';
import { renderAccuracyScores } from './accuracy-score.js';
import { renderEmergentRatio } from './emergent-ratio.js';
import { renderDeviationSummary } from './deviation-summary.js';
import { renderAccuracyTrend } from './accuracy-trend.js';

// ============================================================================
// Re-exports
// ============================================================================

export { renderAccuracyScores } from './accuracy-score.js';
export { renderEmergentRatio } from './emergent-ratio.js';
export { renderDeviationSummary } from './deviation-summary.js';
export { renderAccuracyTrend } from './accuracy-trend.js';

// ============================================================================
// Assembly
// ============================================================================

/**
 * Assemble all four quality renderers into a single section.
 *
 * @param diffs - Plan-vs-summary diff entries from the planning collector
 * @returns HTML string wrapping all quality cards in a `<section>`
 */
export function assembleQualitySection(diffs: PlanSummaryDiff[]): string {
  return `<section class="quality-section">${renderAccuracyScores(diffs)}${renderEmergentRatio(diffs)}${renderDeviationSummary(diffs)}${renderAccuracyTrend(diffs)}</section>`;
}
