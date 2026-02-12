/**
 * Accuracy trend renderer for the planning quality metrics section.
 *
 * Renders a CSS-only sparkline bar chart showing rolling accuracy
 * percentages across recent phases. Each phase gets a vertical bar
 * whose height represents the accuracy score (average of plan scores
 * within that phase), color-coded by threshold.
 *
 * Scoring: on_track=100, contracted=75, expanded=50, shifted=25.
 * Color classes: trend-good (>=80%), trend-warn (>=50%), trend-poor (<50%).
 *
 * Pure renderer: typed data in (PlanSummaryDiff[]), HTML string out.
 * No IO or side effects. CSS-only visualization -- no D3, no Chart.js.
 *
 * @module dashboard/metrics/quality/accuracy-trend
 */

import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ============================================================================
// Constants
// ============================================================================

/** Numeric score for each scope classification. */
const SCOPE_SCORE: Record<PlanSummaryDiff['scope_change'], number> = {
  on_track: 100,
  contracted: 75,
  expanded: 50,
  shifted: 25,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determine CSS class based on score threshold.
 */
function scoreColorClass(score: number): string {
  if (score >= 80) return 'trend-good';
  if (score >= 50) return 'trend-warn';
  return 'trend-poor';
}

/**
 * Group diffs by phase number, sorted ascending.
 */
function groupByPhase(diffs: PlanSummaryDiff[]): Map<number, PlanSummaryDiff[]> {
  const map = new Map<number, PlanSummaryDiff[]>();

  for (const diff of diffs) {
    const group = map.get(diff.phase);
    if (group) {
      group.push(diff);
    } else {
      map.set(diff.phase, [diff]);
    }
  }

  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Compute per-phase accuracy scores.
 *
 * For each phase group, averages the SCOPE_SCORE of each plan's
 * scope_change classification. Returns array sorted by ascending phase.
 */
function computePhaseScores(diffs: PlanSummaryDiff[]): Array<{ phase: number; score: number }> {
  const grouped = groupByPhase(diffs);
  const results: Array<{ phase: number; score: number }> = [];

  for (const [phaseNum, phaseDiffs] of grouped) {
    const sum = phaseDiffs.reduce((acc, d) => acc + SCOPE_SCORE[d.scope_change], 0);
    const avg = sum / phaseDiffs.length;
    const rounded = Math.round(avg * 10) / 10;
    results.push({ phase: phaseNum, score: rounded });
  }

  return results;
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a CSS-only sparkline chart of rolling accuracy across phases.
 *
 * @param diffs - Plan-vs-summary diff entries from the planning collector
 * @param windowSize - Number of recent phases to display (default 10)
 * @returns HTML string with sparkline bar chart
 */
export function renderAccuracyTrend(diffs: PlanSummaryDiff[], windowSize: number = 10): string {
  if (diffs.length === 0) {
    return '<div class="quality-card accuracy-trend empty">No planning data available</div>';
  }

  const allScores = computePhaseScores(diffs);
  const displayed = allScores.slice(-windowSize);

  // Overall average of displayed phases
  const avgSum = displayed.reduce((acc, s) => acc + s.score, 0);
  const overallAvg = Math.round((avgSum / displayed.length) * 10) / 10;

  const bars = displayed
    .map(s => {
      const colorClass = scoreColorClass(s.score);
      return `    <div class="trend-bar ${colorClass}" data-phase="${s.phase}" data-score="${s.score}" style="height:${s.score}%"></div>`;
    })
    .join('\n');

  return `<div class="quality-card accuracy-trend">\n` +
    `  <div class="trend-average">Avg: ${overallAvg}%</div>\n` +
    `  <div class="trend-chart">\n` +
    `${bars}\n` +
    `  </div>\n` +
    `</div>`;
}
