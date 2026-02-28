/**
 * MCP Security Dashboard renderer.
 *
 * Displays trust state per server, hash change alerts when tool definitions
 * drift, and a log of blocked invocations with reasons. Provides security
 * observability for the GSD-OS desktop.
 *
 * Pure render functions, no I/O. Satisfies PRES-06.
 *
 * @module mcp/presentation/security-dashboard
 */

import type { TrustState } from '../../core/types/mcp.js';

// ============================================================================
// Types
// ============================================================================

/** Data needed to render a server's trust state card. */
export interface ServerTrustDisplay {
  /** Server identifier. */
  serverId: string;
  /** Human-readable server name. */
  serverName: string;
  /** Current trust state. */
  trustState: TrustState;
  /** Last activity timestamp (unix ms). */
  lastActivity: number;
  /** Number of tools discovered. */
  toolCount: number;
  /** Hash record for display. */
  hashRecord?: { hash: string; computedAt: number; previousHash?: string };
}

/** A hash change alert for a server. */
export interface HashChangeAlert {
  /** Server identifier. */
  serverId: string;
  /** Human-readable server name. */
  serverName: string;
  /** Previous tool definition hash. */
  previousHash: string;
  /** Current tool definition hash. */
  currentHash: string;
  /** Timestamp of detection (unix ms). */
  timestamp: number;
  /** Tools added since last hash. */
  addedTools: string[];
  /** Tools removed since last hash. */
  removedTools: string[];
  /** Tools with modified definitions. */
  modifiedTools: string[];
}

/** A blocked call entry for the log. */
export interface BlockedCallEntry {
  /** Unique entry identifier. */
  id: string;
  /** Timestamp of the blocked call (unix ms). */
  timestamp: number;
  /** Caller identity. */
  caller: string;
  /** Server that was targeted. */
  serverId: string;
  /** Tool that was invoked. */
  toolName: string;
  /** Reason for blocking. */
  reason: string;
  /** Source of the invocation. */
  source: 'external' | 'agent-to-agent';
}

/** Full data for the security dashboard. */
export interface SecurityDashboardData {
  /** Trust state per server. */
  servers: ServerTrustDisplay[];
  /** Hash change alerts. */
  alerts: HashChangeAlert[];
  /** Blocked call log. */
  blockedCalls: BlockedCallEntry[];
}

// ============================================================================
// Constants
// ============================================================================

/** Visual indicators for each trust state. */
const TRUST_STYLES: Record<TrustState, { icon: string; cssClass: string; label: string }> = {
  quarantine:   { icon: '\u26A0',  cssClass: 'sd-trust-quarantine',  label: 'Quarantine' },
  provisional:  { icon: '\u23F3',  cssClass: 'sd-trust-provisional', label: 'Provisional' },
  trusted:      { icon: '\u2713',  cssClass: 'sd-trust-trusted',     label: 'Trusted' },
  suspended:    { icon: '\u26D4',  cssClass: 'sd-trust-suspended',   label: 'Suspended' },
};

// ============================================================================
// Trust State Card
// ============================================================================

/**
 * Render a trust state card for a single server.
 *
 * @param server - Server trust display data.
 * @returns HTML string for the trust state card.
 */
export function renderTrustStateCard(server: ServerTrustDisplay): string {
  const style = TRUST_STYLES[server.trustState];
  const relativeTime = formatRelativeTime(server.lastActivity);
  const hashPreview = server.hashRecord
    ? server.hashRecord.hash.substring(0, 8)
    : 'n/a';

  return `<div class="sd-trust-card ${style.cssClass}" data-server-id="${escapeAttr(server.serverId)}">
  <div class="sd-trust-header">
    <span class="sd-trust-icon">${style.icon}</span>
    <span class="sd-trust-name">${escapeHtml(server.serverName)}</span>
    <span class="sd-trust-badge">${style.label}</span>
  </div>
  <div class="sd-trust-meta">
    <span class="sd-trust-activity">Last active: ${relativeTime}</span>
    <span class="sd-trust-tools">${server.toolCount} tools</span>
    <span class="sd-trust-hash" title="${server.hashRecord?.hash ?? 'No hash'}">Hash: ${hashPreview}</span>
  </div>
</div>`;
}

// ============================================================================
// Hash Change Alert
// ============================================================================

/**
 * Render a hash change alert banner.
 *
 * @param alert - Hash change alert data.
 * @returns HTML string for the alert banner.
 */
export function renderHashAlert(alert: HashChangeAlert): string {
  const time = formatTimestamp(alert.timestamp);
  const prevHash = alert.previousHash.substring(0, 8);
  const currHash = alert.currentHash.substring(0, 8);

  const changesHtml: string[] = [];
  if (alert.addedTools.length > 0) {
    changesHtml.push(
      `<span class="sd-alert-added">Added: ${alert.addedTools.map(escapeHtml).join(', ')}</span>`,
    );
  }
  if (alert.removedTools.length > 0) {
    changesHtml.push(
      `<span class="sd-alert-removed">Removed: ${alert.removedTools.map(escapeHtml).join(', ')}</span>`,
    );
  }
  if (alert.modifiedTools.length > 0) {
    changesHtml.push(
      `<span class="sd-alert-modified">Modified: ${alert.modifiedTools.map(escapeHtml).join(', ')}</span>`,
    );
  }

  return `<div class="sd-hash-alert" data-server-id="${escapeAttr(alert.serverId)}">
  <div class="sd-alert-header">
    <span class="sd-alert-icon">\u26A0</span>
    <span class="sd-alert-title">Hash Change: ${escapeHtml(alert.serverName)}</span>
    <span class="sd-alert-time">${time}</span>
  </div>
  <div class="sd-alert-hashes">
    <span class="sd-alert-prev">${prevHash}</span>
    <span class="sd-alert-arrow">\u2192</span>
    <span class="sd-alert-curr">${currHash}</span>
  </div>
  <div class="sd-alert-changes">
    ${changesHtml.join('\n    ')}
  </div>
</div>`;
}

// ============================================================================
// Blocked Call Log
// ============================================================================

/**
 * Render the blocked call log.
 *
 * @param entries - Array of blocked call entries (rendered most recent first).
 * @returns HTML string for the blocked call log.
 */
export function renderBlockedCallLog(entries: BlockedCallEntry[]): string {
  if (entries.length === 0) {
    return `<div class="sd-blocked-log">
  <div class="sd-blocked-empty">No blocked calls</div>
</div>`;
  }

  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const rowsHtml = sorted
    .map(
      (entry) =>
        `<tr class="sd-blocked-row" data-entry-id="${escapeAttr(entry.id)}">
      <td class="sd-blocked-time">${formatTimestamp(entry.timestamp)}</td>
      <td class="sd-blocked-caller">${escapeHtml(entry.caller)}</td>
      <td class="sd-blocked-server">${escapeHtml(entry.serverId)}</td>
      <td class="sd-blocked-tool">${escapeHtml(entry.toolName)}</td>
      <td class="sd-blocked-reason">${escapeHtml(entry.reason)}</td>
      <td class="sd-blocked-source">${entry.source}</td>
    </tr>`,
    )
    .join('\n  ');

  return `<div class="sd-blocked-log">
  <table class="sd-blocked-table">
    <thead>
      <tr>
        <th>Time</th>
        <th>Caller</th>
        <th>Server</th>
        <th>Tool</th>
        <th>Reason</th>
        <th>Source</th>
      </tr>
    </thead>
    <tbody>
  ${rowsHtml}
    </tbody>
  </table>
</div>`;
}

// ============================================================================
// Full Dashboard
// ============================================================================

/**
 * Render the complete security dashboard.
 *
 * @param data - Dashboard data with servers, alerts, and blocked calls.
 * @returns HTML string for the security dashboard.
 */
export function renderSecurityDashboard(data: SecurityDashboardData): string {
  const quarantinedCount = data.servers.filter((s) => s.trustState === 'quarantine').length;
  const blockedCount = data.blockedCalls.length;

  const trustCardsHtml = data.servers.length > 0
    ? data.servers.map((s) => renderTrustStateCard(s)).join('\n    ')
    : '<div class="sd-empty">No servers registered</div>';

  const alertsHtml = data.alerts.length > 0
    ? data.alerts.map((a) => renderHashAlert(a)).join('\n    ')
    : '';

  const alertsSection = data.alerts.length > 0
    ? `<section class="sd-section sd-section-alerts">
    <h4 class="sd-section-title">Hash Change Alerts</h4>
    ${alertsHtml}
  </section>`
    : '';

  return `<div class="sd-dashboard" data-panel-type="mcp-security">
  <div class="sd-header">
    <h3 class="sd-title">Security Dashboard</h3>
    <div class="sd-summary">
      <span class="sd-summary-item">${data.servers.length} servers</span>
      <span class="sd-summary-item sd-summary-quarantined">${quarantinedCount} quarantined</span>
      <span class="sd-summary-item sd-summary-blocked">${blockedCount} blocked calls</span>
    </div>
  </div>
  <section class="sd-section sd-section-trust">
    <h4 class="sd-section-title">Trust State Overview</h4>
    <div class="sd-trust-grid">
      ${trustCardsHtml}
    </div>
  </section>
  ${alertsSection}
  <section class="sd-section sd-section-blocked">
    <h4 class="sd-section-title">Blocked Call Log</h4>
    ${renderBlockedCallLog(data.blockedCalls)}
  </section>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the security dashboard.
 *
 * @returns CSS string.
 */
export function renderSecurityDashboardStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Security Dashboard
   ----------------------------------------------------------------------- */

.sd-dashboard {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
}

.sd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg, 1.25rem);
}

.sd-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text, #e6edf3);
  margin: 0;
}

.sd-summary {
  display: flex;
  gap: var(--space-md, 1rem);
}

.sd-summary-item {
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
  font-variant-numeric: tabular-nums;
}

.sd-summary-quarantined { color: var(--red, #f85149); }
.sd-summary-blocked { color: var(--yellow, #d29922); }

/* --- Sections --- */

.sd-section {
  margin-bottom: var(--space-lg, 1.25rem);
}

.sd-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text, #e6edf3);
  margin: 0 0 var(--space-sm, 0.5rem) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

/* --- Trust state grid --- */

.sd-trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-md, 1rem);
}

.sd-trust-card {
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-md, 6px);
  padding: var(--space-md, 1rem);
}

.sd-trust-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

.sd-trust-icon {
  font-size: 1rem;
}

.sd-trust-name {
  font-weight: 600;
  color: var(--text, #e6edf3);
  font-size: 0.9rem;
  flex: 1;
}

.sd-trust-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm, 4px);
  font-weight: 600;
}

.sd-trust-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
}

.sd-trust-hash {
  font-family: var(--font-mono, monospace);
}

/* Trust state colors */
.sd-trust-quarantine { border-left: 3px solid var(--red, #f85149); }
.sd-trust-quarantine .sd-trust-badge {
  background: rgba(248, 81, 73, 0.15);
  color: var(--red, #f85149);
}

.sd-trust-provisional { border-left: 3px solid var(--yellow, #d29922); }
.sd-trust-provisional .sd-trust-badge {
  background: rgba(210, 153, 34, 0.15);
  color: var(--yellow, #d29922);
}

.sd-trust-trusted { border-left: 3px solid var(--green, #3fb950); }
.sd-trust-trusted .sd-trust-badge {
  background: rgba(63, 185, 80, 0.15);
  color: var(--green, #3fb950);
}

.sd-trust-suspended { border-left: 3px solid var(--text-dim, #484f58); }
.sd-trust-suspended .sd-trust-badge {
  background: rgba(139, 148, 158, 0.15);
  color: var(--text-muted, #8b949e);
}

/* --- Hash alerts --- */

.sd-hash-alert {
  background: rgba(210, 153, 34, 0.08);
  border: 1px solid rgba(210, 153, 34, 0.3);
  border-radius: var(--radius-md, 6px);
  padding: var(--space-md, 1rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

.sd-alert-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

.sd-alert-icon {
  color: var(--yellow, #d29922);
  font-size: 1rem;
}

.sd-alert-title {
  font-weight: 600;
  color: var(--yellow, #d29922);
  font-size: 0.9rem;
  flex: 1;
}

.sd-alert-time {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
}

.sd-alert-hashes {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  margin-bottom: var(--space-sm, 0.5rem);
}

.sd-alert-prev { color: var(--text-dim, #484f58); }
.sd-alert-arrow { color: var(--text-muted, #8b949e); }
.sd-alert-curr { color: var(--yellow, #d29922); }

.sd-alert-changes {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.8rem;
}

.sd-alert-added { color: var(--green, #3fb950); }
.sd-alert-removed { color: var(--red, #f85149); }
.sd-alert-modified { color: var(--yellow, #d29922); }

/* --- Blocked call log --- */

.sd-blocked-log {
  overflow-x: auto;
}

.sd-blocked-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.sd-blocked-table th {
  text-align: left;
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  color: var(--text-muted, #8b949e);
  font-weight: 600;
  border-bottom: 1px solid var(--border, #30363d);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sd-blocked-table td {
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  color: var(--text, #e6edf3);
  border-bottom: 1px solid var(--border-muted, #21262d);
}

.sd-blocked-time {
  font-family: var(--font-mono, monospace);
  color: var(--text-dim, #484f58);
  font-variant-numeric: tabular-nums;
}

.sd-blocked-reason {
  color: var(--red, #f85149);
}

.sd-blocked-source {
  font-size: 0.7rem;
  font-style: italic;
  color: var(--text-muted, #8b949e);
}

.sd-blocked-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
  text-align: center;
}

.sd-empty {
  color: var(--text-dim, #484f58);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
}
`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Format a unix timestamp to a time string. */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** Format a timestamp as relative time (e.g., "2m ago", "3h ago"). */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
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
