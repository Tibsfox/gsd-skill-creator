/**
 * Per-phase stats table renderer for the velocity metrics section.
 *
 * Renders an HTML table with columns for Phase, Wall Time, Commits,
 * LOC +/-, Files, and Plans. Phases are sorted by number ascending.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/velocity/stats-table
 */

import type { PhaseStats } from './types.js';
import { formatDuration } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a per-phase statistics table.
 *
 * Columns: Phase | Wall Time | Commits | LOC +/- | Files | Plans
 *
 * @param phases - Array of PhaseStats to tabulate
 * @returns HTML string for the stats table
 */
export function renderStatsTable(phases: PhaseStats[]): string {
  if (phases.length === 0) {
    return '<div class="velocity-stats-empty">No phase data available</div>';
  }

  // Sort by phase number ascending (do not mutate input)
  const sorted = [...phases].sort((a, b) => a.phase - b.phase);

  const headerRow = `<tr>
      <th>Phase</th>
      <th>Wall Time</th>
      <th>Commits</th>
      <th>LOC +/-</th>
      <th>Files</th>
      <th>Plans</th>
    </tr>`;

  const bodyRows = sorted
    .map((p) => {
      const wallTime = escapeHtml(formatDuration(p.wallTimeMs));
      const loc = `<span class="loc-add">+${escapeHtml(String(p.insertions))}</span> / <span class="loc-del">-${escapeHtml(String(p.deletions))}</span>`;

      return `    <tr>
      <td class="phase-num">${escapeHtml(String(p.phase))}</td>
      <td>${wallTime}</td>
      <td>${escapeHtml(String(p.commitCount))}</td>
      <td>${loc}</td>
      <td>${escapeHtml(String(p.filesChanged))}</td>
      <td>${escapeHtml(String(p.plansExecuted))}</td>
    </tr>`;
    })
    .join('\n');

  return `<table class="velocity-stats-table">
  <thead>
    ${headerRow}
  </thead>
  <tbody>
${bodyRows}
  </tbody>
</table>`;
}
