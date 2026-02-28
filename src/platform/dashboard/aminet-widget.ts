/**
 * Aminet mirror statistics dashboard widget.
 *
 * Renders aggregate mirror health data as a color-coded table,
 * following the pure render function pattern from budget-gauge.ts.
 * Pure functions, no I/O, no side effects.
 *
 * @module dashboard/aminet-widget
 */

// ============================================================================
// Types
// ============================================================================

/** Data for the mirror statistics widget. */
export interface MirrorStats {
  /** Total packages in the Aminet INDEX. */
  totalIndexed: number;
  /** Packages downloaded to local mirror. */
  mirrored: number;
  /** Packages awaiting virus scan. */
  scanPending: number;
  /** Packages that passed scan. */
  clean: number;
  /** Packages flagged as infected. */
  infected: number;
  /** Packages installed to emulator filesystem. */
  installed: number;
  /** Packages moved to quarantine. */
  quarantined: number;
}

// ============================================================================
// Main renderer
// ============================================================================

/** A single row segment in the mirror stats table. */
interface StatsSegment {
  label: string;
  count: number;
  color: string;
}

/**
 * Render the mirror statistics widget as an HTML table.
 *
 * @param stats - Mirror statistics data.
 * @returns HTML string for the mirror widget.
 */
export function renderMirrorWidget(stats: MirrorStats): string {
  const segments: StatsSegment[] = [
    { label: 'Installed', count: stats.installed, color: 'var(--signal-success)' },
    { label: 'Clean', count: stats.clean, color: '#3fb950' },
    { label: 'Pending', count: stats.scanPending, color: 'var(--signal-warning)' },
    { label: 'Infected', count: stats.infected, color: 'var(--signal-error)' },
    { label: 'Quarantined', count: stats.quarantined, color: '#f85149' },
    { label: 'Mirrored', count: stats.mirrored, color: 'var(--color-frontend)' },
  ];

  // Filter to segments with count > 0
  const activeSegments = segments.filter((seg) => seg.count > 0);

  const rowsHtml = activeSegments
    .map(
      (seg) =>
        `<tr><td style="color:${seg.color}">${seg.label}</td><td>${seg.count}</td></tr>`,
    )
    .join('');

  const totalFormatted = stats.totalIndexed.toLocaleString('en-US');

  return `<div class="mirror-widget">
  <h3 class="mirror-title">Aminet Mirror</h3>
  <div class="mirror-total">${totalFormatted} packages indexed</div>
  <table class="mirror-stats"><tbody>${rowsHtml}</tbody></table>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the mirror statistics widget.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderMirrorWidgetStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Mirror Statistics Widget
   ----------------------------------------------------------------------- */

.mirror-widget {
  margin-bottom: var(--space-md, 1rem);
  padding: var(--space-sm, 0.5rem);
  background: var(--surface, #161b22);
  border: 1px solid var(--border-muted, #21262d);
  border-radius: var(--radius-md, 8px);
}

.mirror-title {
  font-size: 0.85rem;
  color: var(--text, #e6edf3);
  margin: 0 0 var(--space-xs, 0.25rem) 0;
  font-weight: 600;
}

.mirror-total {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
  margin-bottom: var(--space-sm, 0.5rem);
  font-family: var(--font-mono, monospace);
}

.mirror-stats {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.mirror-stats td {
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  border-bottom: 1px solid var(--border-muted, #21262d);
}

.mirror-stats td:first-child {
  font-weight: 600;
}

.mirror-stats td:last-child {
  text-align: right;
  font-family: var(--font-mono, monospace);
  color: var(--text, #e6edf3);
}

.mirror-stats tr:last-child td {
  border-bottom: none;
}
`;
}
