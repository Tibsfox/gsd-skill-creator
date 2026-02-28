/**
 * Staging queue dashboard panel renderer.
 *
 * Produces a four-column kanban-style panel showing queue entries as
 * cards with dependency lines rendered as SVG paths. Columns map to
 * the four logical lanes: Incoming, Needs Attention, Ready, Set Aside.
 *
 * Pure render functions, no I/O. Follows existing dashboard panel patterns.
 *
 * @module dashboard/staging-queue-panel
 */

import type { QueueEntry, QueueState } from '../staging/queue/types.js';
import type { DependencyEdge } from '../staging/queue/dependency-detector.js';

// ============================================================================
// Types
// ============================================================================

/** Column identifiers for the staging queue board. */
export type StagingQueueColumn = 'incoming' | 'attention' | 'ready' | 'aside';

/** Data needed to render the staging queue panel. */
export interface StagingQueuePanelData {
  /** Queue entries to display as cards. */
  entries: QueueEntry[];
  /** Dependency edges to render as SVG lines between cards. */
  dependencies: DependencyEdge[];
}

// ============================================================================
// Constants
// ============================================================================

/** Maps each QueueState to a display column. */
const STATE_TO_COLUMN: Record<QueueState, StagingQueueColumn> = {
  'uploaded': 'incoming',
  'checking': 'incoming',
  'needs-attention': 'attention',
  'ready': 'ready',
  'queued': 'ready',
  'executing': 'ready',
  'set-aside': 'aside',
};

/** Display names for each column. */
const COLUMN_HEADERS: Record<StagingQueueColumn, string> = {
  incoming: 'Incoming',
  attention: 'Needs Attention',
  ready: 'Ready',
  aside: 'Set Aside',
};

/** Column render order. */
const COLUMN_ORDER: StagingQueueColumn[] = [
  'incoming',
  'attention',
  'ready',
  'aside',
];

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Render a single queue entry card.
 */
function renderCard(entry: QueueEntry): string {
  const tagHtml = entry.tags
    .map((tag) => `<span class="sq-tag">${tag}</span>`)
    .join('');

  return `<div class="sq-card" data-entry-id="${entry.id}" data-state="${entry.state}">
      <div class="sq-card-header">
        <span class="sq-card-title">${entry.milestoneName}</span>
        <span class="sq-badge sq-badge-${entry.state}">${entry.state}</span>
      </div>
      <div class="sq-card-domain">${entry.domain}</div>
      <div class="sq-card-tags">${tagHtml}</div>
    </div>`;
}

/**
 * Render the client-side script that positions dependency lines
 * based on card bounding rectangles.
 */
function renderDepScript(): string {
  return `<script>
  (function() {
    var panel = document.querySelector('.staging-queue-panel');
    if (!panel) return;

    var svg = panel.querySelector('.sq-dep-overlay');
    if (!svg) return;

    var lines = svg.querySelectorAll('.sq-dep-line');
    if (lines.length === 0) return;

    function positionLines() {
      var panelRect = panel.getBoundingClientRect();

      lines.forEach(function(line) {
        var fromId = line.getAttribute('data-from');
        var toId = line.getAttribute('data-to');
        var fromCard = panel.querySelector('[data-entry-id="' + fromId + '"]');
        var toCard = panel.querySelector('[data-entry-id="' + toId + '"]');

        if (!fromCard || !toCard) return;

        var fromRect = fromCard.getBoundingClientRect();
        var toRect = toCard.getBoundingClientRect();

        var x1 = fromRect.right - panelRect.left;
        var y1 = fromRect.top + fromRect.height / 2 - panelRect.top;
        var x2 = toRect.left - panelRect.left;
        var y2 = toRect.top + toRect.height / 2 - panelRect.top;

        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
      });

      svg.setAttribute('width', panelRect.width);
      svg.setAttribute('height', panelRect.height);
    }

    positionLines();
    window.addEventListener('resize', positionLines);
  })();
  </script>`;
}

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the staging queue panel with cards in four columns and
 * dependency lines as SVG.
 *
 * @param data - Queue entries and dependency edges.
 * @returns HTML string for the staging queue panel.
 */
export function renderStagingQueuePanel(data: StagingQueuePanelData): string {
  // Empty state
  if (data.entries.length === 0) {
    return `<div class="staging-queue-panel">
  <h3 class="sq-title">Staging Queue</h3>
  <div class="sq-empty">No items in staging queue</div>
</div>`;
  }

  // Group entries by column
  const columns: Record<StagingQueueColumn, QueueEntry[]> = {
    incoming: [],
    attention: [],
    ready: [],
    aside: [],
  };

  for (const entry of data.entries) {
    const col = STATE_TO_COLUMN[entry.state];
    columns[col].push(entry);
  }

  // Render columns
  const columnsHtml = COLUMN_ORDER.map((col) => {
    const cards = columns[col].map((entry) => renderCard(entry)).join('\n    ');
    return `<div class="sq-column" data-column="${col}">
      <div class="sq-column-header">${COLUMN_HEADERS[col]}</div>
    ${cards}
    </div>`;
  }).join('\n    ');

  // Render dependency lines
  const linesHtml = data.dependencies
    .map(
      (edge) =>
        `<line class="sq-dep-line" data-from="${edge.from}" data-to="${edge.to}" marker-end="url(#sq-arrowhead)" />`,
    )
    .join('\n      ');

  // Build SVG overlay
  const svgHtml = `<svg class="sq-dep-overlay">
      <defs>
        <marker id="sq-arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted, #a0a0a0)" />
        </marker>
      </defs>
      ${linesHtml}
    </svg>`;

  // Build script for positioning (only when there are dependency lines)
  const scriptHtml = data.dependencies.length > 0 ? renderDepScript() : '';

  return `<div class="staging-queue-panel">
  <h3 class="sq-title">Staging Queue</h3>
  <div class="sq-columns">
    ${columnsHtml}
  </div>
  ${svgHtml}
  ${scriptHtml}
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the staging queue panel.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderStagingQueueStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Staging Queue Panel
   ----------------------------------------------------------------------- */

.staging-queue-panel {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-lg, 1.25rem);
  position: relative;
}

.sq-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  margin: 0 0 var(--space-md, 1rem) 0;
}

/* --- Columns layout --- */

.sq-columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md, 1rem);
}

.sq-column {
  min-height: 100px;
}

.sq-column-header {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #a0a0a0);
  margin-bottom: var(--space-sm, 0.5rem);
  padding-bottom: var(--space-xs, 0.25rem);
  border-bottom: 2px solid var(--border, #333);
}

/* --- Cards --- */

.sq-card {
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-md, 6px);
  padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
  margin-bottom: var(--space-sm, 0.5rem);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.sq-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.sq-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sq-card-domain {
  font-size: 0.75rem;
  color: var(--text-muted, #a0a0a0);
  margin-bottom: 4px;
}

.sq-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* --- Tags --- */

.sq-tag {
  display: inline-block;
  font-size: 0.7rem;
  padding: 1px 6px;
  background: color-mix(in srgb, var(--text-muted, #a0a0a0) 15%, transparent);
  border-radius: var(--radius-sm, 4px);
  color: var(--text-muted, #a0a0a0);
}

/* --- State badges --- */

.sq-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm, 4px);
  text-transform: uppercase;
  white-space: nowrap;
}

.sq-badge-uploaded {
  color: var(--accent, #58a6ff);
  background: color-mix(in srgb, var(--accent, #58a6ff) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent, #58a6ff) 30%, transparent);
}

.sq-badge-checking {
  color: var(--yellow, #e3b341);
  background: color-mix(in srgb, var(--yellow, #e3b341) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--yellow, #e3b341) 30%, transparent);
}

.sq-badge-needs-attention {
  color: var(--signal-warning, #f0883e);
  background: color-mix(in srgb, var(--signal-warning, #f0883e) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--signal-warning, #f0883e) 30%, transparent);
}

.sq-badge-ready {
  color: var(--green, #3fb950);
  background: color-mix(in srgb, var(--green, #3fb950) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--green, #3fb950) 30%, transparent);
}

.sq-badge-queued {
  color: var(--color-observation, #39d3c5);
  background: color-mix(in srgb, var(--color-observation, #39d3c5) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-observation, #39d3c5) 30%, transparent);
}

.sq-badge-executing {
  color: var(--purple, #bc8cff);
  background: color-mix(in srgb, var(--purple, #bc8cff) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--purple, #bc8cff) 30%, transparent);
}

.sq-badge-set-aside {
  color: var(--text-muted, #8b949e);
  background: color-mix(in srgb, var(--text-muted, #8b949e) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-muted, #8b949e) 30%, transparent);
}

/* --- SVG overlay --- */

.sq-dep-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.sq-dep-line {
  stroke: var(--text-muted, #a0a0a0);
  stroke-width: 1.5;
  fill: none;
}

/* --- Empty state --- */

.sq-empty {
  color: var(--text-muted, #a0a0a0);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
  text-align: center;
}

/* --- Responsive --- */

@media (max-width: 768px) {
  .sq-columns {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .sq-columns {
    grid-template-columns: 1fr;
  }
}
`;
}
