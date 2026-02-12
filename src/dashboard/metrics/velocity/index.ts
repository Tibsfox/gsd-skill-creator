/**
 * Phase velocity metrics barrel export.
 *
 * Re-exports all velocity renderers and provides a composite
 * renderVelocitySection function that assembles the full section.
 *
 * @module dashboard/metrics/velocity
 */

// Re-export types and helpers
export type { PhaseStats, CommitTypeDistribution } from './types.js';
export { groupCommitsByPhase, computePhaseStats, formatDuration } from './types.js';

// Re-export renderers
export { renderPhaseTimeline } from './timeline.js';
export { renderStatsTable } from './stats-table.js';
export type { TddCycle } from './tdd-rhythm.js';
export { extractTddCycles, renderTddRhythm } from './tdd-rhythm.js';
export { renderProgressCard } from './progress-card.js';

// ============================================================================
// Internal imports for section assembly
// ============================================================================

import { renderPhaseTimeline } from './timeline.js';
import { renderStatsTable } from './stats-table.js';
import type { TddCycle } from './tdd-rhythm.js';
import { renderTddRhythm } from './tdd-rhythm.js';
import { renderProgressCard } from './progress-card.js';
import type { PhaseStats } from './types.js';

// ============================================================================
// Section Assembler
// ============================================================================

/**
 * Assemble the full Phase Velocity section from all sub-renderers.
 *
 * Order: progress card (current state) -> timeline (history) ->
 * stats table (detail) -> TDD rhythm (cycle times).
 *
 * @param phases         - All phase stats for timeline and table
 * @param cycles         - Extracted TDD cycles
 * @param currentPhase   - Current phase number for the progress card
 * @param stats          - Stats for the current phase (null if not started)
 * @param totalPlans     - Total plans in the current phase
 * @param completedPlans - Completed plans in the current phase
 * @returns HTML string for the full velocity section
 */
export function renderVelocitySection(
  phases: PhaseStats[],
  cycles: TddCycle[],
  currentPhase: number,
  stats: PhaseStats | null,
  totalPlans: number,
  completedPlans: number,
): string {
  return `<section class="velocity-section" id="phase-velocity">
  <h2>Phase Velocity</h2>
  ${renderProgressCard(currentPhase, stats, totalPlans, completedPlans)}
  ${renderPhaseTimeline(phases)}
  ${renderStatsTable(phases)}
  ${renderTddRhythm(cycles, phases)}
</section>`;
}
