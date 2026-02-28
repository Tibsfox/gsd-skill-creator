/**
 * Milestone comparison table renderer for the historical trends section.
 *
 * Aggregates commit data per milestone by parsing phase ranges from
 * milestone names, then renders an HTML table with 7 columns:
 * Milestone, Phases, Plans, Commits, LOC, Tests, Accuracy.
 *
 * Pure renderer: typed data in, HTML string out.
 *
 * @module dashboard/metrics/history/milestone-table
 */

import type { MilestonesData, MilestoneData } from '../../types.js';
import type { GitCommitMetric } from '../../collectors/types.js';
import type { MilestoneRow } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Phase Range Parsing
// ============================================================================

/** Parsed phase range from a milestone name. */
interface PhaseRange {
  start: number;
  end: number;
}

/**
 * Extract the phase range from a milestone name string.
 *
 * Matches patterns like "(Phases 88-93)" or "(Phase 5)" in the name.
 * Returns null if no range can be parsed.
 */
function parsePhaseRange(name: string): PhaseRange | null {
  // Match "Phases N-M" or "Phase N" (with optional parentheses)
  const rangeMatch = name.match(/Phases?\s+(\d+)\s*-\s*(\d+)/i);
  if (rangeMatch) {
    return {
      start: parseInt(rangeMatch[1], 10),
      end: parseInt(rangeMatch[2], 10),
    };
  }

  const singleMatch = name.match(/Phase\s+(\d+)/i);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    return { start: n, end: n };
  }

  return null;
}

// ============================================================================
// Aggregation
// ============================================================================

/**
 * Aggregate milestone rows from milestone data and commit history.
 *
 * For each milestone, extracts the phase range from the milestone name,
 * filters commits whose phase falls within that range, and computes
 * aggregate metrics (commit count, LOC, test count).
 *
 * @param milestones - Parsed milestones data from MILESTONES.md
 * @param commits    - All git commit metrics
 * @returns One MilestoneRow per milestone, in the same order as input
 */
export function aggregateMilestoneRows(
  milestones: MilestonesData,
  commits: GitCommitMetric[],
): MilestoneRow[] {
  return milestones.milestones.map((ms: MilestoneData) => {
    const range = parsePhaseRange(ms.name);

    // Filter commits belonging to this milestone's phase range
    const filtered = range
      ? commits.filter(
          (c) =>
            c.phase !== null &&
            c.phase >= range.start &&
            c.phase <= range.end,
        )
      : [];

    const loc = filtered.reduce(
      (sum, c) => sum + (c.insertions - c.deletions),
      0,
    );
    const tests = filtered.filter((c) => c.type === 'test').length;

    return {
      version: ms.version,
      name: ms.name,
      phases: ms.stats.phases ?? 0,
      plans: ms.stats.plans ?? 0,
      commits: filtered.length,
      loc,
      tests,
      accuracy: 'N/A',
    };
  });
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a milestone comparison table as HTML.
 *
 * Produces a `<table class="milestone-table">` with thead/tbody structure
 * and 7 columns. Wraps in a history-section div with heading.
 *
 * @param rows - Aggregated milestone rows
 * @returns HTML string for the milestone comparison table
 */
export function renderMilestoneTable(rows: MilestoneRow[]): string {
  if (rows.length === 0) {
    return '<div class="history-empty">No milestone data available</div>';
  }

  const headerCells = [
    'Milestone',
    'Phases',
    'Plans',
    'Commits',
    'LOC',
    'Tests',
    'Accuracy',
  ]
    .map((h) => `<th>${h}</th>`)
    .join('');

  const bodyRows = rows
    .map((row) => {
      const locDisplay =
        row.loc > 0
          ? `+${row.loc.toLocaleString()}`
          : row.loc === 0
            ? '0'
            : row.loc.toLocaleString();

      return `<tr>
<td class="milestone-name">${escapeHtml(row.version)} ${escapeHtml(row.name)}</td>
<td class="numeric">${row.phases}</td>
<td class="numeric">${row.plans}</td>
<td class="numeric">${row.commits}</td>
<td class="numeric">${locDisplay}</td>
<td class="numeric">${row.tests}</td>
<td class="accuracy">${escapeHtml(row.accuracy)}</td>
</tr>`;
    })
    .join('\n');

  return `<div class="history-section"><h3>Milestone Comparison</h3>
<table class="milestone-table">
<thead><tr>${headerCells}</tr></thead>
<tbody>
${bodyRows}
</tbody>
</table>
</div>`;
}
