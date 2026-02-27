/**
 * Handoff quality dashboard panel renderer.
 *
 * Displays DACP drift scores over time, fidelity level distribution,
 * and promotion/demotion recommendations. Pure render functions,
 * no I/O. Satisfies DASH-01 through DASH-04.
 *
 * @module dashboard/handoff-panel
 */

import { escapeHtml } from './renderer.js';

// ============================================================================
// Types
// ============================================================================

/** A single drift score entry for trend visualization. */
export interface DriftEntry {
  /** Drift score (0.0-1.0). */
  score: number;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Handoff pattern (e.g. "planner->executor:task"). */
  pattern: string;
  /** Fidelity recommendation based on this score. */
  recommendation: 'promote' | 'demote' | 'maintain';
}

/** Fidelity level distribution across recent handoffs. */
export interface FidelityDistribution {
  /** Count of Level 0 (markdown-only) handoffs. */
  level0: number;
  /** Count of Level 1 (markdown+schema) handoffs. */
  level1: number;
  /** Count of Level 2 (markdown+schema+script) handoffs. */
  level2: number;
  /** Count of Level 3 (full bundle) handoffs. */
  level3: number;
}

/** Data needed to render the handoff quality panel. */
export interface HandoffPanelData {
  /** Drift score entries for trend display. */
  driftEntries: DriftEntry[];
  /** Fidelity level distribution. */
  fidelity: FidelityDistribution;
  /** Current milestone name. */
  milestoneName: string;
  /** Total handoff count. */
  totalHandoffs: number;
  /** Average drift score. */
  avgDrift: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Recommendation arrow characters. */
const REC_ARROWS: Record<DriftEntry['recommendation'], string> = {
  promote: '\u2191', // Up arrow
  demote: '\u2193',  // Down arrow
  maintain: '\u2014', // Em dash
};

/** Fidelity level colors. */
const FIDELITY_COLORS: { label: string; key: keyof FidelityDistribution; color: string }[] = [
  { label: 'L0', key: 'level0', color: 'var(--text-muted, #8b949e)' },
  { label: 'L1', key: 'level1', color: 'var(--blue, #58a6ff)' },
  { label: 'L2', key: 'level2', color: 'var(--yellow, #d29922)' },
  { label: 'L3', key: 'level3', color: 'var(--red, #f85149)' },
];

// ============================================================================
// Drift Trend Renderer (DASH-01)
// ============================================================================

/**
 * Render the drift score trend display.
 *
 * Shows per-entry drift scores with pattern names, recommendation
 * arrows, and a summary bar with total handoffs and average drift.
 *
 * @param data - Handoff panel data.
 * @returns HTML string for the drift trend section.
 */
export function renderDriftTrend(data: HandoffPanelData): string {
  const summaryBar = `<div class="hp-summary-bar">Handoffs: ${data.totalHandoffs} | Avg Drift: ${data.avgDrift.toFixed(2)}</div>`;

  if (data.driftEntries.length === 0) {
    return `<div class="hp-drift-trend">
  ${summaryBar}
  <div class="hp-empty-msg">No drift events recorded</div>
</div>`;
  }

  const entriesHtml = data.driftEntries
    .map((entry) => {
      const stateClass = entry.score > 0.3
        ? ' hp-drift-high'
        : entry.score < 0.05
          ? ' hp-drift-low'
          : '';
      const arrow = REC_ARROWS[entry.recommendation];
      return `<div class="hp-drift-entry${stateClass}">
      <span class="hp-drift-score">${entry.score.toFixed(2)}</span>
      <span class="hp-drift-pattern">${escapeHtml(entry.pattern)}</span>
      <span class="hp-drift-rec">${arrow}</span>
    </div>`;
    })
    .join('\n  ');

  return `<div class="hp-drift-trend">
  ${summaryBar}
  ${entriesHtml}
</div>`;
}

// ============================================================================
// Fidelity Distribution Renderer (DASH-02)
// ============================================================================

/**
 * Render the fidelity level distribution as horizontal bars.
 *
 * Renders 4 bars (L0-L3) with proportional widths based on their
 * count relative to the maximum count. Zero-count levels still
 * render to maintain visual structure.
 *
 * @param data - Handoff panel data.
 * @returns HTML string for the fidelity distribution section.
 */
export function renderFidelityDistribution(data: HandoffPanelData): string {
  const { fidelity } = data;
  const counts = [fidelity.level0, fidelity.level1, fidelity.level2, fidelity.level3];
  const maxCount = Math.max(...counts);

  const barsHtml = FIDELITY_COLORS
    .map((level, i) => {
      const count = counts[i];
      const width = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
      return `<div class="hp-fidelity-bar">
      <span class="hp-fidelity-label">${level.label}</span>
      <div class="hp-bar-fill" style="width:${width}%;background:${level.color}"></div>
      <span class="hp-fidelity-count">${count}</span>
    </div>`;
    })
    .join('\n  ');

  return `<div class="hp-fidelity-dist">
  ${barsHtml}
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the handoff panel component.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderHandoffPanelStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Handoff Quality Panel
   ----------------------------------------------------------------------- */

.hp-drift-trend {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-md, 1rem);
}

.hp-summary-bar {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
  font-variant-numeric: tabular-nums;
  margin-bottom: var(--space-sm, 0.5rem);
}

.hp-drift-entry {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: var(--space-xs, 0.25rem) 0;
  border-bottom: 1px solid var(--border-muted, #21262d);
}

.hp-drift-entry:last-child {
  border-bottom: none;
}

.hp-drift-score {
  font-family: var(--font-mono, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
  min-width: 3rem;
  color: var(--text, #e6edf3);
}

.hp-drift-pattern {
  flex: 1;
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
}

.hp-drift-rec {
  font-size: 0.9rem;
  min-width: 1.5rem;
  text-align: center;
}

/* --- Drift state classes --- */

.hp-drift-high {
  background: color-mix(in srgb, var(--red, #f85149) 10%, transparent);
  border-radius: var(--radius-sm, 4px);
  padding-left: var(--space-xs, 0.25rem);
  padding-right: var(--space-xs, 0.25rem);
}

.hp-drift-high .hp-drift-score {
  color: var(--red, #f85149);
  font-weight: 600;
}

.hp-drift-low {
  opacity: 0.6;
}

.hp-drift-low .hp-drift-score {
  color: var(--text-muted, #8b949e);
}

/* --- Fidelity distribution --- */

.hp-fidelity-dist {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-md, 1rem);
}

.hp-fidelity-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  margin-bottom: var(--space-xs, 0.25rem);
}

.hp-fidelity-bar:last-child {
  margin-bottom: 0;
}

.hp-fidelity-label {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 2rem;
  color: var(--text-muted, #8b949e);
  text-transform: uppercase;
}

.hp-bar-fill {
  height: 10px;
  border-radius: 5px;
  transition: width 0.3s ease;
  min-height: 10px;
  flex: 1;
  max-width: 100%;
}

.hp-fidelity-count {
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
  font-variant-numeric: tabular-nums;
  color: var(--text, #e6edf3);
  min-width: 2rem;
  text-align: right;
}

/* --- Empty state --- */

.hp-empty-msg {
  color: var(--text-muted, #8b949e);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
  font-size: 0.9rem;
}
`;
}
