/**
 * Velocity trend renderer for the historical trends section.
 *
 * Computes LOC per phase and phases per milestone across all shipped
 * milestones, then renders a CSS-only vertical bar chart showing
 * velocity changes over time. No JavaScript charting libraries required.
 *
 * Pure renderer: typed data in, HTML string out.
 *
 * @module dashboard/metrics/history/velocity-trend
 */

import type { MilestonesData, MilestoneData } from '../../types.js';
import type { GitCommitMetric } from '../../collectors/types.js';
import type { VelocityPoint } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Phase Range Parsing (same pattern as milestone-table)
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
// Computation
// ============================================================================

/**
 * Compute velocity points from milestone data and commit history.
 *
 * For each milestone, extracts the phase range from the milestone name,
 * filters commits whose phase falls within that range, computes total
 * LOC (insertions - deletions), and derives LOC per phase.
 *
 * @param milestones - Parsed milestones data from MILESTONES.md
 * @param commits    - All git commit metrics
 * @returns One VelocityPoint per milestone, in the same order as input
 */
export function computeVelocityPoints(
  milestones: MilestonesData,
  commits: GitCommitMetric[],
): VelocityPoint[] {
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

    const totalLoc = filtered.reduce(
      (sum, c) => sum + (c.insertions - c.deletions),
      0,
    );

    const phaseCount = ms.stats.phases ?? 0;
    const locPerPhase = phaseCount > 0 ? Math.round(totalLoc / phaseCount) : 0;

    return {
      label: ms.version,
      locPerPhase,
      phasesPerMilestone: phaseCount,
    };
  });
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a CSS-only vertical bar chart for velocity trend.
 *
 * Each milestone becomes a bar group with:
 * - A vertical bar whose height is proportional to locPerPhase (scaled to max)
 * - A phase count label below the bar
 * - A version label below the phase count
 *
 * The chart uses flexbox with `align-items: flex-end` so bars grow upward.
 *
 * @param points - Computed velocity points
 * @returns HTML string for the velocity trend chart
 */
export function renderVelocityTrend(points: VelocityPoint[]): string {
  if (points.length === 0) {
    return '<div class="history-empty">No velocity data available</div>';
  }

  const maxLoc = Math.max(...points.map((p) => p.locPerPhase));

  const bars = points
    .map((point) => {
      const percentage =
        maxLoc > 0 ? Math.round((point.locPerPhase / maxLoc) * 100) : 0;

      return `<div class="velocity-bar-group"><div class="velocity-bar" style="height:${percentage}%" title="${escapeHtml(point.label)}: ${point.locPerPhase} LOC/phase"></div><div class="velocity-phases">${point.phasesPerMilestone}p</div><div class="velocity-label">${escapeHtml(point.label)}</div></div>`;
    })
    .join('');

  return `<div class="history-section"><h3>Velocity Trend</h3><div class="velocity-chart">${bars}</div></div>`;
}
