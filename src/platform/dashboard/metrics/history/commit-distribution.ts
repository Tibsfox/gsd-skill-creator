/**
 * Commit type distribution renderer for the historical trends section.
 *
 * Groups git commits by conventional commit type and renders a CSS-only
 * horizontal stacked bar chart with a color legend. No JavaScript charting
 * libraries required -- works from file:// protocol.
 *
 * Pure renderer: typed data in, HTML string out.
 *
 * @module dashboard/metrics/history/commit-distribution
 */

import type { GitCommitMetric } from '../../collectors/types.js';
import type { CommitDistribution } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Canonical CSS colors for each commit type. */
export const COMMIT_TYPE_COLORS: Record<string, string> = {
  feat: '#4CAF50',
  test: '#2196F3',
  fix: '#FF5722',
  refactor: '#9C27B0',
  docs: '#FF9800',
  other: '#607D8B',
} as const;

/** Known commit types (order used for consistent output). */
const KNOWN_TYPES = ['feat', 'test', 'fix', 'refactor', 'docs', 'other'];

// ============================================================================
// Computation
// ============================================================================

/**
 * Compute commit type distribution from raw git commit metrics.
 *
 * Types not in [feat, test, fix, refactor, docs] are mapped to "other".
 * Returns entries sorted by count descending with percentages that sum
 * to approximately 100%.
 *
 * @param commits - Array of parsed git commit metrics
 * @returns Distribution entries with type, count, percentage, and color
 */
export function computeCommitDistribution(
  commits: GitCommitMetric[],
): CommitDistribution[] {
  // Initialize counts for all known types
  const counts: Record<string, number> = {};
  for (const t of KNOWN_TYPES) {
    counts[t] = 0;
  }

  // Count commits by type, mapping unknown types to "other"
  for (const commit of commits) {
    const type = KNOWN_TYPES.includes(commit.type) ? commit.type : 'other';
    counts[type] = (counts[type] ?? 0) + 1;
  }

  const total = commits.length;

  // Build distribution entries
  const entries: CommitDistribution[] = KNOWN_TYPES.map((type) => ({
    type,
    count: counts[type],
    percentage:
      total > 0 ? Math.round((counts[type] / total) * 1000) / 10 : 0,
    color: COMMIT_TYPE_COLORS[type],
  }));

  // Sort by count descending
  entries.sort((a, b) => b.count - a.count);

  return entries;
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a CSS-only stacked bar chart for commit type distribution.
 *
 * Produces a horizontal bar with colored segments sized by percentage,
 * followed by a color legend. Each segment has data-type and title
 * attributes for accessibility and CSS targeting.
 *
 * @param distribution - Computed distribution entries
 * @returns HTML string for the commit distribution chart
 */
export function renderCommitDistribution(
  distribution: CommitDistribution[],
): string {
  const totalCount = distribution.reduce((sum, d) => sum + d.count, 0);

  if (totalCount === 0) {
    return '<div class="history-empty">No commit data available</div>';
  }

  // Build bar segments (only for types with count > 0)
  const segments = distribution
    .filter((d) => d.count > 0)
    .map(
      (d) =>
        `<div class="commit-bar-segment" data-type="${d.type}" title="${d.type}: ${d.count} (${d.percentage}%)" style="width:${d.percentage}%;background:${d.color}"></div>`,
    )
    .join('');

  // Build legend items
  const legendItems = distribution
    .filter((d) => d.count > 0)
    .map(
      (d) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${d.color}"></span>${d.type}: ${d.count} (${d.percentage}%)</span>`,
    )
    .join('');

  return `<div class="history-section"><h3>Commit Type Distribution</h3>
<div class="commit-bar">${segments}</div>
<div class="commit-legend">${legendItems}</div>
</div>`;
}
