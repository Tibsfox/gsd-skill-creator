/**
 * Barrel index and section assembler for the historical trends module.
 *
 * Re-exports all four sub-renderers (milestone table, commit distribution,
 * velocity trend, file hotspots) and provides a top-level
 * `renderHistoricalTrends` function that assembles them into a single
 * cold-tier section wrapped with refresh metadata.
 *
 * @module dashboard/metrics/history/index
 */

// Re-exports from sub-modules
export { aggregateMilestoneRows, renderMilestoneTable } from './milestone-table.js';
export { computeCommitDistribution, renderCommitDistribution } from './commit-distribution.js';
export { computeVelocityPoints, renderVelocityTrend } from './velocity-trend.js';
export { computeFileHotspots, renderFileHotspots } from './file-hotspots.js';

// Re-export types
export type { MilestoneRow, CommitDistribution, VelocityPoint, FileHotspot, HistorySection } from './types.js';

// Assembly imports
import type { MilestonesData } from '../../types.js';
import type { GitCommitMetric } from '../../collectors/types.js';
import { wrapSectionWithRefresh } from '../tier-refresh.js';
import { aggregateMilestoneRows, renderMilestoneTable } from './milestone-table.js';
import { computeCommitDistribution, renderCommitDistribution } from './commit-distribution.js';
import { computeVelocityPoints, renderVelocityTrend } from './velocity-trend.js';
import { computeFileHotspots, renderFileHotspots } from './file-hotspots.js';

// ============================================================================
// Section Assembly
// ============================================================================

/**
 * Assemble the complete historical trends section from raw data.
 *
 * Calls all four compute + render pipelines and concatenates their
 * HTML output into a single section wrapped with cold-tier metadata
 * via `wrapSectionWithRefresh`.
 *
 * @param milestones - Parsed milestones data from MILESTONES.md
 * @param commits    - All git commit metrics
 * @returns HTML string for the complete historical trends section
 */
export function renderHistoricalTrends(
  milestones: MilestonesData,
  commits: GitCommitMetric[],
): string {
  // 1. Milestone comparison table
  const rows = aggregateMilestoneRows(milestones, commits);
  const milestoneTableHtml = renderMilestoneTable(rows);

  // 2. Commit type distribution
  const distribution = computeCommitDistribution(commits);
  const commitDistHtml = renderCommitDistribution(distribution);

  // 3. Velocity trend
  const points = computeVelocityPoints(milestones, commits);
  const velocityHtml = renderVelocityTrend(points);

  // 4. File hotspots
  const hotspots = computeFileHotspots(commits);
  const hotspotsHtml = renderFileHotspots(hotspots);

  // Assemble all four sections
  const assembled = milestoneTableHtml + commitDistHtml + velocityHtml + hotspotsHtml;

  // Wrap with cold-tier metadata (data-tier="cold", data-interval="0")
  return wrapSectionWithRefresh('historical-trends', assembled);
}
