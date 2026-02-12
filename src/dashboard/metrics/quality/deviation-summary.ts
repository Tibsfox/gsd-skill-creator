/**
 * Deviation summary renderer for the planning quality metrics section.
 *
 * Renders per-phase deviation counts with expandable `<details>/<summary>`
 * elements. Groups PlanSummaryDiff entries by phase number and collects
 * all deviation strings across plans within each phase.
 *
 * Pure renderer: typed data in (PlanSummaryDiff[]), HTML string out.
 * No IO or side effects.
 *
 * @module dashboard/metrics/quality/deviation-summary
 */

import { escapeHtml } from '../../renderer.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

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

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render per-phase deviation counts with expandable details.
 *
 * Phases with deviations get an expandable `<details>/<summary>` element
 * listing each deviation. Phases with zero deviations get a static row.
 *
 * @param diffs - Plan-vs-summary diff entries from the planning collector
 * @returns HTML string with per-phase deviation breakdown
 */
export function renderDeviationSummary(diffs: PlanSummaryDiff[]): string {
  if (diffs.length === 0) {
    return '<div class="quality-card deviation-summary empty">No planning data available</div>';
  }

  const grouped = groupByPhase(diffs);
  const rows: string[] = [];

  for (const [phaseNum, phaseDiffs] of grouped) {
    const allDeviations = phaseDiffs.flatMap(d => d.deviations);
    const count = allDeviations.length;
    const label = count === 1 ? '1 deviation' : `${count} deviations`;

    if (count > 0) {
      const items = allDeviations
        .map(d => `<li>${escapeHtml(d)}</li>`)
        .join('');
      rows.push(
        `  <details class="deviation-phase">` +
        `<summary>Phase ${phaseNum} -- ${label}</summary>` +
        `<ul>${items}</ul>` +
        `</details>`
      );
    } else {
      rows.push(
        `  <div class="deviation-phase deviation-none">Phase ${phaseNum} -- ${label}</div>`
      );
    }
  }

  return `<div class="quality-card deviation-summary">\n${rows.join('\n')}\n</div>`;
}
