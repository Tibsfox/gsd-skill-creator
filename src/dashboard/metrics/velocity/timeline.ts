/**
 * Phase timeline renderer for the velocity metrics section.
 *
 * Renders a CSS-only horizontal bar chart where bar width is proportional
 * to wall time and each bar contains colored segments representing the
 * commit type distribution within that phase.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/velocity/timeline
 */

import type { PhaseStats } from './types.js';
import { formatDuration } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Color Map
// ============================================================================

/** Static color map for conventional commit types. */
const TYPE_COLORS: Record<string, string> = {
  feat: '#4caf50',     // green
  test: '#2196f3',     // blue
  fix: '#f44336',      // red
  refactor: '#ff9800', // orange
  docs: '#9c27b0',     // purple
  chore: '#607d8b',    // blue-grey
  style: '#00bcd4',    // cyan
  perf: '#ffeb3b',     // yellow
  build: '#795548',    // brown
  ci: '#9e9e9e',       // grey
};

/** Fallback color for unknown commit types. */
const DEFAULT_COLOR = '#bdbdbd';

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a CSS-only horizontal bar chart of phase durations.
 *
 * Each phase gets a row with width proportional to its wall time relative
 * to the longest phase. Bars contain colored segments proportional to the
 * commit type distribution. A compact legend follows the chart.
 *
 * @param phases - Array of PhaseStats to visualize
 * @returns HTML string for the phase timeline
 */
export function renderPhaseTimeline(phases: PhaseStats[]): string {
  if (phases.length === 0) {
    return '<div class="velocity-timeline-empty">No phase data available</div>';
  }

  // Sort by phase number ascending (do not mutate input)
  const sorted = [...phases].sort((a, b) => a.phase - b.phase);

  const maxWallTime = Math.max(...sorted.map((p) => p.wallTimeMs));
  const divisor = maxWallTime > 0 ? maxWallTime : 1;

  // Collect all commit types used (for legend)
  const usedTypes = new Set<string>();

  const rows = sorted.map((p) => {
    const widthPct = Math.max(1, Math.round((p.wallTimeMs / divisor) * 100));
    const duration = formatDuration(p.wallTimeMs);

    // Build colored segments
    const totalCommits = p.commitCount || 1;
    const segments = Object.entries(p.commitTypes)
      .sort(([, a], [, b]) => b - a) // largest first
      .map(([type, count]) => {
        usedTypes.add(type);
        const segWidth = Math.round((count / totalCommits) * 100);
        const color = TYPE_COLORS[type] ?? DEFAULT_COLOR;
        return `<span style="display: inline-block; height: 100%; width: ${segWidth}%; background-color: ${color};" title="${escapeHtml(type)}: ${count}"></span>`;
      })
      .join('');

    return `<div class="velocity-timeline-row" style="width: ${widthPct}%">
  <span class="velocity-timeline-label">${escapeHtml('Phase ' + String(p.phase))}</span>
  <div class="velocity-timeline-bar">${segments}</div>
  <span class="velocity-timeline-duration">${escapeHtml(duration)}</span>
</div>`;
  });

  // Legend
  const legendItems = [...usedTypes]
    .sort()
    .map((type) => {
      const color = TYPE_COLORS[type] ?? DEFAULT_COLOR;
      return `<span class="velocity-legend-item"><span class="velocity-legend-swatch" style="background-color: ${color};"></span>${escapeHtml(type)}</span>`;
    })
    .join('');

  return `<div class="velocity-timeline">
${rows.join('\n')}
<div class="velocity-legend">${legendItems}</div>
</div>`;
}
