/**
 * Token budget gauge dashboard component.
 *
 * Renders a horizontal stacked bar with domain-colored segments,
 * threshold-based color transitions (80% warning, 95% critical),
 * and three-speed information layering (glance: bar fill, scan: hover
 * percentages). Pure render functions, no I/O.
 *
 * Satisfies REQ-BG-01 through REQ-BG-04 and REQ-3S-01/02.
 *
 * @module dashboard/budget-gauge
 */

// ============================================================================
// Types
// ============================================================================

/** A single domain segment in the budget gauge bar. */
export interface BudgetSegment {
  /** Domain name (e.g. "Frontend", "Backend"). */
  domain: string;
  /** Percentage of total budget used by this domain (0-100). */
  percentage: number;
  /** CSS color string for this domain segment. */
  color: string;
}

/** Data needed to render the budget gauge. */
export interface BudgetGaugeData {
  /** Domain segments to display as colored bar sections. */
  segments: BudgetSegment[];
  /** Total percentage used across all segments (0-100). */
  totalUsed: number;
  /** Optional gauge label (e.g. "Token Budget"). */
  label?: string;
  /** Skills deferred from loading due to budget constraints. */
  deferredSkills?: string[];
  /** Whether total loading exceeds the budget limit. */
  overBudget?: boolean;
}

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the token budget gauge as a horizontal stacked bar.
 *
 * @param data - Budget segments, total usage, and optional label.
 * @returns HTML string for the budget gauge.
 */
export function renderBudgetGauge(data: BudgetGaugeData): string {
  const isOverBudget = data.overBudget === true;

  // Clamp effective totalUsed for rendering when over-budget
  const effectiveTotal = isOverBudget ? Math.min(data.totalUsed, 100) : data.totalUsed;

  // Compute threshold class
  let thresholdClass = '';
  if (isOverBudget) {
    thresholdClass = ' bg-over-budget bg-critical';
  } else if (effectiveTotal >= 95) {
    thresholdClass = ' bg-critical';
  } else if (effectiveTotal >= 80) {
    thresholdClass = ' bg-warning';
  }

  // Optional label
  const labelHtml = data.label
    ? `<div class="bg-label">${data.label}</div>`
    : '';

  // Scale factor for over-budget segment width capping
  const scaleFactor =
    isOverBudget && data.totalUsed > 100 ? 100 / data.totalUsed : 1;

  // Render segments
  const segmentsHtml = data.segments
    .map((seg) => {
      const width = seg.percentage * scaleFactor;
      return `<div class="bg-segment" data-domain="${seg.domain}" data-percent="${seg.percentage}" style="width:${width}%;background:${seg.color}"><span class="bg-scan-label">${seg.percentage}%</span></div>`;
    })
    .join('');

  // Headroom segment (only if effective totalUsed < 100)
  const headroomHtml =
    effectiveTotal < 100
      ? `<div class="bg-headroom" style="width:${100 - effectiveTotal}%"></div>`
      : '';

  // Deferred skills tooltip
  const tooltipHtml =
    data.deferredSkills && data.deferredSkills.length > 0
      ? `<div class="bg-deferred-tooltip"><ul>${data.deferredSkills.map((s) => `<li>${s}</li>`).join('')}</ul></div>`
      : '';

  return `<div class="budget-gauge${thresholdClass}" role="meter" aria-valuenow="${effectiveTotal}" aria-valuemin="0" aria-valuemax="100">
  ${labelHtml}<div class="bg-bar">${segmentsHtml}${headroomHtml}${tooltipHtml}</div>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the budget gauge component.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderBudgetGaugeStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Budget Gauge
   ----------------------------------------------------------------------- */

.budget-gauge {
  margin-bottom: var(--space-md, 1rem);
  padding: var(--space-sm, 0.5rem) 0;
}

.bg-label {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
  margin-bottom: var(--space-xs, 0.25rem);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.bg-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--border-muted, #21262d);
  position: relative;
}

.bg-segment {
  height: 100%;
  position: relative;
  transition: width 0.3s ease;
  min-width: 2px;
}

.bg-scan-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  font-family: var(--font-mono, monospace);
  color: var(--text, #e6edf3);
  background: var(--surface-raised, #1c2128);
  padding: 1px 4px;
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}

.bg-segment:hover .bg-scan-label {
  opacity: 1;
}

.bg-headroom {
  height: 100%;
  background: var(--text-dim, #484f58);
  opacity: 0.3;
}

/* --- Threshold states --- */

.bg-warning {
  box-shadow: 0 0 0 1px var(--yellow, #d29922);
}

.bg-warning .bg-bar {
  outline: 1px solid color-mix(in srgb, var(--yellow, #d29922) 40%, transparent);
}

.bg-critical {
  box-shadow: 0 0 0 1px var(--red, #f85149);
}

.bg-critical .bg-bar {
  outline: 1px solid color-mix(in srgb, var(--red, #f85149) 40%, transparent);
}

/* --- Over-budget state --- */

.bg-over-budget {
  box-shadow: 0 0 0 2px var(--red, #f85149);
}

.bg-over-budget .bg-bar {
  outline: 2px solid var(--red, #f85149);
}

/* --- Deferred skills tooltip --- */

.bg-deferred-tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--space-xs, 0.25rem);
  background: var(--surface-raised, #1c2128);
  border: 1px solid var(--border-muted, #21262d);
  border-radius: var(--radius-sm, 4px);
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  font-size: 0.7rem;
  color: var(--text-muted, #8b949e);
  white-space: nowrap;
  z-index: 10;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}

.bg-deferred-tooltip ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.bg-deferred-tooltip li {
  padding: 1px 0;
}

.bg-bar:hover .bg-deferred-tooltip {
  opacity: 1;
  pointer-events: auto;
}
`;
}
