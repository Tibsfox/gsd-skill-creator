/**
 * Accuracy score renderer for the planning quality metrics section.
 *
 * Renders per-phase scope classification badges showing whether each phase
 * stayed on track, expanded, contracted, or shifted from its plan. Groups
 * PlanSummaryDiff entries by phase number and determines the dominant
 * scope_change classification for visual display.
 *
 * Pure renderer: typed data in (PlanSummaryDiff[]), HTML string out.
 * No IO or side effects.
 *
 * @module dashboard/metrics/quality/accuracy-score
 */

import { escapeHtml } from '../../renderer.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ============================================================================
// Constants
// ============================================================================

/** Priority ordering for scope classifications (higher = worse). */
const SCOPE_PRIORITY: Record<PlanSummaryDiff['scope_change'], number> = {
  on_track: 0,
  contracted: 1,
  expanded: 2,
  shifted: 3,
};

/** CSS class for each scope classification. */
const SCOPE_CSS: Record<PlanSummaryDiff['scope_change'], string> = {
  on_track: 'scope-on-track',
  expanded: 'scope-expanded',
  contracted: 'scope-contracted',
  shifted: 'scope-shifted',
};

/** HTML entity indicator for each scope classification. */
const SCOPE_INDICATOR: Record<PlanSummaryDiff['scope_change'], string> = {
  on_track: '&#x2714;',   // checkmark
  expanded: '&#x25B2;',   // up triangle
  contracted: '&#x25BC;', // down triangle
  shifted: '&#x21C4;',    // bidirectional arrow
};

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

  // Return sorted by ascending phase number
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Determine the dominant scope_change classification for a group of diffs.
 *
 * Returns the most frequent classification. On tie, prefers the "worst"
 * (highest SCOPE_PRIORITY): shifted > expanded > contracted > on_track.
 */
function dominantScope(diffs: PlanSummaryDiff[]): PlanSummaryDiff['scope_change'] {
  const counts = new Map<PlanSummaryDiff['scope_change'], number>();

  for (const diff of diffs) {
    counts.set(diff.scope_change, (counts.get(diff.scope_change) ?? 0) + 1);
  }

  let bestScope: PlanSummaryDiff['scope_change'] = diffs[0].scope_change;
  let bestCount = 0;

  for (const [scope, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && SCOPE_PRIORITY[scope] > SCOPE_PRIORITY[bestScope])
    ) {
      bestScope = scope;
      bestCount = count;
    }
  }

  return bestScope;
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render per-phase accuracy score cards with scope classification badges.
 *
 * @param diffs - Plan-vs-summary diff entries from the planning collector
 * @returns HTML string with per-phase scope classification rows
 */
export function renderAccuracyScores(diffs: PlanSummaryDiff[]): string {
  if (diffs.length === 0) {
    return '<div class="quality-card accuracy-scores empty">No planning data available</div>';
  }

  const grouped = groupByPhase(diffs);
  const rows: string[] = [];

  for (const [phaseNum, phaseDiffs] of grouped) {
    const scope = dominantScope(phaseDiffs);
    const cssClass = SCOPE_CSS[scope];
    const indicator = SCOPE_INDICATOR[scope];
    const count = phaseDiffs.length;
    const planLabel = count === 1 ? '1 plan' : `${count} plans`;

    rows.push(
      `  <div class="accuracy-row ${cssClass}">` +
      `<span class="accuracy-indicator">${indicator}</span>` +
      `<span class="accuracy-phase">${escapeHtml(`Phase ${phaseNum}`)}</span>` +
      `<span class="accuracy-plans">${escapeHtml(planLabel)}</span>` +
      `<span class="accuracy-label">${escapeHtml(scope)}</span>` +
      `</div>`
    );
  }

  return `<div class="quality-card accuracy-scores">\n${rows.join('\n')}\n</div>`;
}
