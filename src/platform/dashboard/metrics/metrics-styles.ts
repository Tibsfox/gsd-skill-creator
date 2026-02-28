/**
 * Metrics CSS module for the GSD Dashboard.
 *
 * Provides CSS styles for all four metric sections: pulse, velocity,
 * quality, and history. Follows the same pattern as renderGantryStyles()
 * and renderTerminalStyles() — pure function returning a CSS string.
 *
 * Uses existing CSS custom properties (--surface, --border, --accent, etc.)
 * and applies card treatment + overflow containment to prevent unstyled sprawl.
 *
 * @module dashboard/metrics/metrics-styles
 */

// ============================================================================
// Public API
// ============================================================================

/**
 * Return CSS styles for all metrics dashboard sections.
 *
 * @returns CSS string covering pulse, velocity, quality, and history sections.
 */
export function renderMetricsStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Metrics Dashboard — Container
   ----------------------------------------------------------------------- */

.metrics-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg, 1.5rem);
  margin-bottom: var(--space-xl, 2rem);
}

/* -----------------------------------------------------------------------
   Pulse Section
   ----------------------------------------------------------------------- */

.pulse-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-md, 1rem);
}

.pulse-card {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
}

.session-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, 0.25rem);
  font-size: 0.85rem;
}

.session-id {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  color: var(--accent, #58a6ff);
}

.session-model,
.session-start,
.session-duration {
  color: var(--text-muted, #8b949e);
  font-size: 0.8rem;
}

.commit-feed {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.commit-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.commit-hash {
  font-family: var(--font-mono, monospace);
  color: var(--accent, #58a6ff);
  font-size: 0.75rem;
}

.commit-scope {
  color: var(--text-muted, #8b949e);
  font-size: 0.75rem;
}

.commit-subject {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary, #e6edf3);
}

.commit-time {
  color: var(--text-dim, #484f58);
  font-size: 0.75rem;
  margin-left: auto;
  flex-shrink: 0;
}

.diff-add {
  color: var(--green, #3fb950);
  font-size: 0.75rem;
}

.diff-del {
  color: var(--red, #f85149);
  font-size: 0.75rem;
}

.heartbeat {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
}

.heartbeat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green, #3fb950);
}

.heartbeat-gray .heartbeat-dot {
  background: var(--text-dim, #484f58);
}

.heartbeat-label {
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
}

.message-counter {
  display: flex;
  gap: var(--space-md, 1rem);
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.counter-user,
.counter-assistant,
.counter-tools,
.counter-total {
  color: var(--text-muted, #8b949e);
}

/* -----------------------------------------------------------------------
   Velocity Section
   ----------------------------------------------------------------------- */

.velocity-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 1rem);
}

.velocity-progress-card {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
}

.progress-bar {
  height: 8px;
  background: var(--border-muted, #21262d);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-sm, 0.5rem);
}

.progress-fill {
  height: 100%;
  background: var(--accent, #58a6ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-plans,
.progress-commits,
.progress-time {
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
}

.progress-loc {
  display: flex;
  gap: var(--space-sm, 0.5rem);
  font-size: 0.8rem;
}

.loc-add {
  color: var(--green, #3fb950);
}

.loc-del {
  color: var(--red, #f85149);
}

.velocity-timeline {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
  max-height: 300px;
  overflow-y: auto;
}

.velocity-timeline-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  text-align: center;
  padding: var(--space-md, 1rem);
}

.velocity-timeline-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: 4px 0;
  font-size: 0.8rem;
}

.velocity-timeline-label {
  min-width: 80px;
  color: var(--text-muted, #8b949e);
  flex-shrink: 0;
}

.velocity-timeline-bar {
  height: 6px;
  background: var(--accent, #58a6ff);
  border-radius: 3px;
}

.velocity-timeline-duration {
  color: var(--text-dim, #484f58);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.velocity-legend {
  display: flex;
  gap: var(--space-md, 1rem);
  flex-wrap: wrap;
  margin-top: var(--space-sm, 0.5rem);
}

.velocity-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
}

.velocity-legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.velocity-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  overflow: hidden;
}

.velocity-stats-table th,
.velocity-stats-table td {
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  border-bottom: 1px solid var(--border-muted, #21262d);
  text-align: left;
}

.velocity-stats-table th {
  color: var(--text-muted, #8b949e);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.velocity-stats-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  text-align: center;
  padding: var(--space-md, 1rem);
}

.phase-num {
  font-family: var(--font-mono, monospace);
  color: var(--accent, #58a6ff);
}

.velocity-tdd-rhythm {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
}

.velocity-tdd-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  text-align: center;
}

.velocity-tdd-phase {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: 4px 0;
  font-size: 0.8rem;
}

.velocity-tdd-label {
  color: var(--text-muted, #8b949e);
  min-width: 80px;
}

.velocity-tdd-overall {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #e6edf3);
  margin-top: var(--space-sm, 0.5rem);
}

/* -----------------------------------------------------------------------
   Quality Section
   ----------------------------------------------------------------------- */

.quality-section {
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 1rem);
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
}

.quality-card {
  background: var(--surface-raised, #1c2128);
  border: 1px solid var(--border-muted, #21262d);
  border-radius: var(--radius-md, 6px);
  padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
}

.quality-card.empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  text-align: center;
}

.accuracy-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: 4px 0;
  font-size: 0.8rem;
}

.accuracy-indicator {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.accuracy-phase {
  min-width: 80px;
  color: var(--text-primary, #e6edf3);
}

.accuracy-plans {
  color: var(--text-muted, #8b949e);
  min-width: 60px;
}

.accuracy-label {
  color: var(--text-muted, #8b949e);
  text-transform: capitalize;
}

.scope-on-track .accuracy-indicator { color: var(--green, #3fb950); }
.scope-expanded .accuracy-indicator { color: var(--yellow, #e3b341); }
.scope-contracted .accuracy-indicator { color: var(--accent, #58a6ff); }
.scope-shifted .accuracy-indicator { color: var(--red, #f85149); }

.emergent-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: 4px 0;
  font-size: 0.8rem;
}

.emergent-phase {
  min-width: 80px;
  color: var(--text-primary, #e6edf3);
}

.emergent-files {
  color: var(--text-muted, #8b949e);
  min-width: 80px;
}

.emergent-pct {
  color: var(--text-muted, #8b949e);
  min-width: 50px;
  text-align: right;
}

.emergent-bar {
  flex: 1;
  height: 6px;
  background: var(--border-muted, #21262d);
  border-radius: 3px;
  overflow: hidden;
}

.emergent-fill {
  height: 100%;
  background: var(--yellow, #e3b341);
  border-radius: 3px;
}

.emergent-average {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #e6edf3);
  margin-bottom: var(--space-sm, 0.5rem);
}

.deviation-summary {
  font-size: 0.8rem;
}

.deviation-phase {
  padding: 4px 0;
  color: var(--text-muted, #8b949e);
}

.deviation-none {
  color: var(--text-dim, #484f58);
  font-style: italic;
}

.accuracy-trend {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, 0.25rem);
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 40px;
}

.trend-bar {
  flex: 1;
  min-width: 4px;
  border-radius: 2px 2px 0 0;
}

.trend-bar-green { background: var(--green, #3fb950); }
.trend-bar-yellow { background: var(--yellow, #e3b341); }
.trend-bar-blue { background: var(--accent, #58a6ff); }
.trend-bar-red { background: var(--red, #f85149); }

.trend-average {
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
  text-align: center;
}

/* -----------------------------------------------------------------------
   History Section
   ----------------------------------------------------------------------- */

.history-section {
  max-height: 500px;
  overflow-y: auto;
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
}

.history-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  text-align: center;
  padding: var(--space-md, 1rem);
}

.milestone-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.milestone-table th,
.milestone-table td {
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  border-bottom: 1px solid var(--border-muted, #21262d);
  text-align: left;
}

.milestone-table th {
  color: var(--text-muted, #8b949e);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.milestone-name {
  color: var(--text-primary, #e6edf3);
}

.milestone-table .numeric {
  text-align: right;
  font-family: var(--font-mono, monospace);
}

.milestone-table .accuracy {
  text-align: right;
}

.commit-bar {
  display: flex;
  height: 16px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-sm, 0.5rem);
}

.commit-bar-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.commit-legend {
  display: flex;
  gap: var(--space-md, 1rem);
  flex-wrap: wrap;
  margin-bottom: var(--space-md, 1rem);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.velocity-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
  margin-bottom: var(--space-sm, 0.5rem);
}

.velocity-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: 100%;
  justify-content: flex-end;
}

.velocity-bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  background: var(--accent, #58a6ff);
}

.velocity-phases {
  display: flex;
  justify-content: space-around;
  margin-top: 2px;
}

.velocity-label {
  font-size: 0.65rem;
  color: var(--text-dim, #484f58);
  text-align: center;
}

.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hotspot-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  font-size: 0.8rem;
  padding: 2px 0;
}

.hotspot-path {
  font-family: var(--font-mono, monospace);
  color: var(--accent, #58a6ff);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-count {
  color: var(--text-muted, #8b949e);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.hotspot-recency {
  color: var(--text-dim, #484f58);
  font-size: 0.7rem;
  flex-shrink: 0;
}
`;
}
