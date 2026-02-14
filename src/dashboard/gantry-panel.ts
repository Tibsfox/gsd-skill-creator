/**
 * Gantry status strip panel renderer.
 *
 * Produces a persistent horizontal strip showing agent status, phase
 * progress, and token budget at glance level. Sits below the nav bar
 * on every dashboard page.
 *
 * Pure render functions, no I/O. Follows existing dashboard panel patterns.
 *
 * @module dashboard/gantry-panel
 */

// ============================================================================
// Types
// ============================================================================

/** A single cell in the gantry status strip. */
export interface GantryCell {
  /** Unicode symbol displayed before label (circle, bar, chevron). */
  symbol: string;
  /** Short text label (max ~10 chars for glance). */
  label: string;
  /** Optional value text (e.g. "1/2" for phase, "65" for budget %). */
  value?: string;
  /** CSS color string or var(--domain-xxx). */
  color?: string;
  /** Cell semantics for styling and data attributes. */
  type: 'agent' | 'phase' | 'budget' | 'status';
}

/** Data needed to render the gantry status strip. */
export interface GantryData {
  /** Cells to display in the strip. */
  cells: GantryCell[];
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of cells rendered in the gantry strip. */
const MAX_CELLS = 8;

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Render a single gantry cell.
 */
function renderCell(cell: GantryCell): string {
  const colorStyle = cell.color ? ` style="color:${cell.color}"` : '';
  const symbolHtml = `<span class="gantry-symbol"${colorStyle}>${cell.symbol}</span>`;

  if (cell.type === 'budget') {
    const width = cell.value ?? '0';
    const bgStyle = cell.color ? `background:${cell.color}` : '';
    const fillStyle = `width:${width}%;${bgStyle}`;
    return `<div class="gantry-cell" data-type="${cell.type}">
      ${symbolHtml}
      <span class="gantry-budget-bar">
        <span class="gantry-budget-fill" style="${fillStyle}"></span>
      </span>
      <span class="gantry-label">${cell.label}</span>
    </div>`;
  }

  const valueHtml = cell.value
    ? `\n      <span class="gantry-value">${cell.value}</span>`
    : '';

  return `<div class="gantry-cell" data-type="${cell.type}">
      ${symbolHtml}
      <span class="gantry-label">${cell.label}</span>${valueHtml}
    </div>`;
}

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the gantry status strip with up to 8 cells.
 *
 * @param data - Gantry cells to display.
 * @returns HTML string for the gantry strip.
 */
export function renderGantryPanel(data: GantryData): string {
  const cells = data.cells.slice(0, MAX_CELLS);

  if (cells.length === 0) {
    return `<div class="gantry-strip" data-max-cells="${MAX_CELLS}">
  <div class="gantry-cells"></div>
</div>`;
  }

  const cellsHtml = cells.map((cell) => renderCell(cell)).join('\n    ');

  return `<div class="gantry-strip" data-max-cells="${MAX_CELLS}">
  <div class="gantry-cells">
    ${cellsHtml}
  </div>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the gantry status strip.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderGantryStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Gantry Status Strip
   ----------------------------------------------------------------------- */

.gantry-strip {
  position: sticky;
  top: 48px;
  z-index: 90;
  background: var(--surface, #161b22);
  border-bottom: 1px solid var(--border, #30363d);
  padding: var(--space-xs, 0.25rem) var(--space-xl, 2rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gantry-cells {
  display: flex;
  gap: var(--space-md, 1rem);
  align-items: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  max-width: var(--max-width, 1200px);
}

.gantry-cell {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
}

.gantry-cell + .gantry-cell::before {
  content: '';
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--border-muted, #21262d);
  margin-right: var(--space-xs, 0.25rem);
  flex-shrink: 0;
}

.gantry-symbol {
  font-size: 0.9rem;
  line-height: 1;
  flex-shrink: 0;
}

.gantry-label {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
}

.gantry-value {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.75rem;
  color: var(--text, #e6edf3);
  font-variant-numeric: tabular-nums;
}

.gantry-budget-bar {
  width: 48px;
  height: 6px;
  background: var(--border-muted, #21262d);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.gantry-budget-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
`;
}
