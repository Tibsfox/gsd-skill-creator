/**
 * Current phase progress card renderer for the velocity metrics section.
 *
 * Renders a card showing the active phase number, plan completion
 * progress bar, commit count, LOC delta, and wall time.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/velocity/progress-card
 */

import type { PhaseStats } from './types.js';
import { formatDuration } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a progress card for the current phase.
 *
 * @param currentPhase   - Phase number to display
 * @param stats          - Aggregated stats for this phase (null if not started)
 * @param totalPlans     - Total number of plans in the phase
 * @param completedPlans - Number of completed plans
 * @returns HTML string for the progress card
 */
export function renderProgressCard(
  currentPhase: number,
  stats: PhaseStats | null,
  totalPlans: number,
  completedPlans: number,
): string {
  const pct =
    totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  const commits = stats?.commitCount ?? 0;
  const insertions = stats?.insertions ?? 0;
  const deletions = stats?.deletions ?? 0;
  const wallTime = stats ? formatDuration(stats.wallTimeMs) : '\u2014';

  return `<div class="velocity-progress-card">
  <h3>${escapeHtml('Phase ' + String(currentPhase))}</h3>
  <div class="progress-bar"><div class="progress-fill" style="width: ${escapeHtml(String(pct))}%"></div></div>
  <div class="progress-plans">${escapeHtml(String(completedPlans))} / ${escapeHtml(String(totalPlans))} plans</div>
  <div class="progress-commits">${escapeHtml(String(commits))} commits</div>
  <div class="progress-loc"><span class="loc-add">+${escapeHtml(String(insertions))}</span> / <span class="loc-del">-${escapeHtml(String(deletions))}</span></div>
  <div class="progress-time">${escapeHtml(wallTime)}</div>
</div>`;
}
