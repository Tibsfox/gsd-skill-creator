/**
 * MCP Trace Panel renderer with latency sparklines and filtering.
 *
 * Displays real-time JSON-RPC message flow between the host manager and
 * MCP servers. Each trace entry shows timestamp, direction, server ID,
 * method, and latency. A sparkline visualizes recent latency trends.
 *
 * Pure render functions, no I/O. Satisfies PRES-05.
 *
 * @module mcp/presentation/trace-panel
 */

import type { TraceEvent } from '../../core/types/mcp.js';

// ============================================================================
// Types
// ============================================================================

/** Filter criteria for trace events. */
export interface TraceFilter {
  /** Exact match on server ID. */
  serverId?: string;
  /** Substring match on method field. */
  toolName?: string;
  /** Filter by direction. */
  direction?: 'incoming' | 'outgoing';
  /** Minimum latency in milliseconds. */
  minLatencyMs?: number;
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filter trace events by the given criteria.
 *
 * @param events - Array of trace events to filter.
 * @param filter - Filter criteria (all conditions are AND-ed).
 * @returns Filtered array preserving original order.
 */
export function filterTraceEvents(events: TraceEvent[], filter: TraceFilter): TraceEvent[] {
  return events.filter((event) => {
    if (filter.serverId && event.serverId !== filter.serverId) return false;
    if (filter.toolName && !event.method.includes(filter.toolName)) return false;
    if (filter.direction && event.direction !== filter.direction) return false;
    if (filter.minLatencyMs !== undefined && (event.latencyMs ?? 0) < filter.minLatencyMs) {
      return false;
    }
    return true;
  });
}

// ============================================================================
// Sparkline
// ============================================================================

/**
 * Render an inline SVG sparkline from latency values.
 *
 * @param latencies - Array of latency values in milliseconds.
 * @param width - SVG width in pixels (default: 80).
 * @param height - SVG height in pixels (default: 20).
 * @returns SVG string, or empty string if no latencies.
 */
export function renderLatencySparkline(
  latencies: number[],
  width: number = 80,
  height: number = 20,
): string {
  if (latencies.length === 0) return '';

  const max = Math.max(...latencies, 1); // Prevent division by zero
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  // Color based on average latency
  let color: string;
  if (avg < 50) {
    color = 'var(--green, #3fb950)';
  } else if (avg < 200) {
    color = 'var(--yellow, #d29922)';
  } else {
    color = 'var(--red, #f85149)';
  }

  const stepX = latencies.length > 1 ? width / (latencies.length - 1) : width;
  const points = latencies
    .map((val, i) => {
      const x = latencies.length > 1 ? i * stepX : width / 2;
      const y = height - (val / max) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return `<svg class="bp-trace-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// ============================================================================
// Trace Entry
// ============================================================================

/**
 * Render a single trace event entry row.
 *
 * @param event - The trace event to render.
 * @returns HTML string for the trace entry.
 */
export function renderTraceEntry(event: TraceEvent): string {
  const date = new Date(event.timestamp);
  const time = formatTime(date);

  const directionIcon = event.direction === 'outgoing' ? '\u2192' : '\u2190';
  const directionClass = event.direction === 'outgoing'
    ? 'bp-trace-dir-outgoing'
    : 'bp-trace-dir-incoming';

  let latencyHtml = '';
  if (event.latencyMs !== undefined) {
    const latencyClass = getLatencyClass(event.latencyMs);
    latencyHtml = `<span class="bp-trace-latency ${latencyClass}">${event.latencyMs}ms</span>`;
  }

  const errorHtml = event.error
    ? '<span class="bp-trace-error" title="Error">\u26A0</span>'
    : '';

  return `<div class="bp-trace-entry" data-trace-id="${escapeAttr(event.id)}">
  <span class="bp-trace-time">${time}</span>
  <span class="bp-trace-direction ${directionClass}">${directionIcon}</span>
  <span class="bp-trace-server">${escapeHtml(event.serverId)}</span>
  <span class="bp-trace-method">${escapeHtml(event.method)}</span>
  ${latencyHtml}
  ${errorHtml}
</div>`;
}

// ============================================================================
// Trace Panel
// ============================================================================

/**
 * Render the full MCP Trace Panel with header, sparkline, and event list.
 *
 * @param events - Array of trace events (newest first is recommended).
 * @param filter - Optional filter to apply before rendering.
 * @returns HTML string for the trace panel.
 */
export function renderTracePanel(events: TraceEvent[], filter?: TraceFilter): string {
  const filtered = filter ? filterTraceEvents(events, filter) : events;

  // Sort by timestamp descending (most recent first)
  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

  // Compute stats
  const latencies = sorted
    .filter((e) => e.latencyMs !== undefined)
    .map((e) => e.latencyMs!);
  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  // Sparkline from last 20 events
  const sparklineLatencies = latencies.slice(0, 20).reverse();
  const sparklineHtml = renderLatencySparkline(sparklineLatencies);

  // Entries
  const entriesHtml = sorted.length > 0
    ? sorted.map((e) => renderTraceEntry(e)).join('\n')
    : '<div class="bp-trace-empty">No trace events recorded</div>';

  return `<div class="bp-trace-panel" data-panel-type="mcp-trace">
  <div class="bp-trace-header">
    <h3 class="bp-trace-title">MCP Trace</h3>
    <span class="bp-trace-count">${sorted.length} events</span>
    <span class="bp-trace-avg-latency">${avgLatency}ms avg</span>
    ${sparklineHtml}
  </div>
  <div class="bp-trace-filters">
    <select class="bp-trace-filter-server" aria-label="Filter by server">
      <option value="">All servers</option>
    </select>
    <input class="bp-trace-filter-tool" type="text" placeholder="Filter by tool..." aria-label="Filter by tool name"/>
  </div>
  <div class="bp-trace-list">
    ${entriesHtml}
  </div>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the trace panel component.
 *
 * @returns CSS string.
 */
export function renderTracePanelStyles(): string {
  return `
/* -----------------------------------------------------------------------
   MCP Trace Panel
   ----------------------------------------------------------------------- */

.bp-trace-panel {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  font-family: var(--font-mono, monospace);
}

.bp-trace-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  margin-bottom: var(--space-md, 1rem);
}

.bp-trace-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text, #e6edf3);
  margin: 0;
  font-family: var(--font-sans, system-ui, sans-serif);
}

.bp-trace-count {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
  background: var(--bg, #0d1117);
  padding: 2px 6px;
  border-radius: var(--radius-sm, 4px);
}

.bp-trace-avg-latency {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
}

.bp-trace-sparkline {
  vertical-align: middle;
}

/* --- Filters --- */

.bp-trace-filters {
  display: flex;
  gap: var(--space-sm, 0.5rem);
  margin-bottom: var(--space-md, 1rem);
}

.bp-trace-filter-server,
.bp-trace-filter-tool {
  font-size: 0.8rem;
  padding: 4px 8px;
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-sm, 4px);
  color: var(--text, #e6edf3);
  font-family: var(--font-mono, monospace);
}

/* --- Trace entries --- */

.bp-trace-list {
  max-height: 400px;
  overflow-y: auto;
}

.bp-trace-entry {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  padding: 3px 0;
  border-bottom: 1px solid var(--border-muted, #21262d);
  font-size: 0.8rem;
}

.bp-trace-time {
  color: var(--text-dim, #484f58);
  min-width: 90px;
  font-variant-numeric: tabular-nums;
}

.bp-trace-direction {
  min-width: 20px;
  text-align: center;
  font-weight: 700;
}

.bp-trace-dir-outgoing {
  color: var(--blue, #58a6ff);
}

.bp-trace-dir-incoming {
  color: var(--green, #3fb950);
}

.bp-trace-server {
  color: var(--text-muted, #8b949e);
  min-width: 100px;
}

.bp-trace-method {
  color: var(--text, #e6edf3);
  flex: 1;
}

.bp-trace-latency {
  font-size: 0.75rem;
  padding: 1px 4px;
  border-radius: var(--radius-sm, 4px);
  font-variant-numeric: tabular-nums;
}

.bp-trace-latency-fast {
  color: var(--green, #3fb950);
  background: rgba(63, 185, 80, 0.1);
}

.bp-trace-latency-medium {
  color: var(--yellow, #d29922);
  background: rgba(210, 153, 34, 0.1);
}

.bp-trace-latency-slow {
  color: var(--red, #f85149);
  background: rgba(248, 81, 73, 0.1);
}

.bp-trace-error {
  color: var(--red, #f85149);
  font-size: 0.9rem;
}

.bp-trace-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
  text-align: center;
  font-family: var(--font-sans, system-ui, sans-serif);
}
`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Format a Date as HH:MM:SS.mmm. */
function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/** Get CSS class for a latency value. */
function getLatencyClass(latencyMs: number): string {
  if (latencyMs < 50) return 'bp-trace-latency-fast';
  if (latencyMs < 200) return 'bp-trace-latency-medium';
  return 'bp-trace-latency-slow';
}

/** Escape HTML entities. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape attribute values. */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
