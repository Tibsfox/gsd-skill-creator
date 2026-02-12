/**
 * Emergent work ratio renderer for the planning quality metrics section.
 *
 * Renders per-phase emergent work percentages (unplanned files as a fraction
 * of total actual files) with CSS bar visualizations and a rolling average
 * across all phases. Groups PlanSummaryDiff entries by phase number and
 * sums file counts across plans within each phase.
 *
 * Pure renderer: typed data in (PlanSummaryDiff[]), HTML string out.
 * No IO or side effects.
 *
 * @module dashboard/metrics/quality/emergent-ratio
 */

import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ============================================================================
// Types
// ============================================================================

/** Computed emergent work metrics for a single phase. */
interface PhaseEmergentData {
  phase: number;
  totalActual: number;
  totalEmergent: number;
  ratio: number; // 0-100 percentage
}

// ============================================================================
// Helpers
// ============================================================================

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
 * Compute per-phase emergent work ratios.
 *
 * For each phase group, sums actual_files.length and emergent_work.length
 * across all plans, then computes the percentage. Returns 0% when
 * totalActual is 0 (avoids division by zero).
 */
function computePhaseRatios(diffs: PlanSummaryDiff[]): PhaseEmergentData[] {
  const grouped = groupByPhase(diffs);
  const results: PhaseEmergentData[] = [];

  for (const [phaseNum, phaseDiffs] of grouped) {
    let totalActual = 0;
    let totalEmergent = 0;

    for (const diff of phaseDiffs) {
      totalActual += diff.actual_files.length;
      totalEmergent += diff.emergent_work.length;
    }

    const ratio = totalActual === 0
      ? 0
      : Math.round((totalEmergent / totalActual) * 1000) / 10;

    results.push({ phase: phaseNum, totalActual, totalEmergent, ratio });
  }

  return results;
}

/**
 * Compute rolling average of per-phase ratios, rounded to one decimal place.
 */
function computeRollingAverage(phases: PhaseEmergentData[]): number {
  if (phases.length === 0) return 0;

  const sum = phases.reduce((acc, p) => acc + p.ratio, 0);
  return Math.round((sum / phases.length) * 10) / 10;
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render per-phase emergent work ratio display with CSS bar visualizations.
 *
 * @param diffs - Plan-vs-summary diff entries from the planning collector
 * @returns HTML string with per-phase emergent percentages and rolling average
 */
export function renderEmergentRatio(diffs: PlanSummaryDiff[]): string {
  if (diffs.length === 0) {
    return '<div class="quality-card emergent-ratio empty">No planning data available</div>';
  }

  const phases = computePhaseRatios(diffs);
  const rollingAvg = computeRollingAverage(phases);

  const rows: string[] = [];

  for (const p of phases) {
    const clampedWidth = Math.min(p.ratio, 100);

    rows.push(
      `  <div class="emergent-row">` +
      `<span class="emergent-phase">Phase ${p.phase}</span>` +
      `<span class="emergent-files">${p.totalEmergent}/${p.totalActual} files</span>` +
      `<span class="emergent-pct">${p.ratio}%</span>` +
      `<div class="emergent-bar"><div class="emergent-fill" style="width:${clampedWidth}%"></div></div>` +
      `</div>`
    );
  }

  return `<div class="quality-card emergent-ratio">\n` +
    `  <div class="emergent-average">Rolling Average: ${rollingAvg}%</div>\n` +
    `${rows.join('\n')}\n` +
    `</div>`;
}
