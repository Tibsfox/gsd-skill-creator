/**
 * Cloud operations status panel renderer.
 *
 * Displays OpenStack service health with color-coded diamond indicators,
 * alert summaries from the health and cloud-ops communication loops, and
 * mission telemetry (crew activation, token budget, loop health).
 *
 * Follows progressive enhancement: null = no panel, false = disabled
 * message, true = full panel. Pure render functions, no I/O.
 *
 * Satisfies INTEG-01.
 *
 * @module cloud-ops/dashboard/cloud-ops-panel
 */

import type {
  ServiceHealthEntry,
  AlertEntry,
  MissionTelemetry,
  CloudOpsPanelData,
} from './types.js';

import type { ServiceStatus } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Maps ServiceStatus to CSS class and diamond color. */
const SERVICE_STATUS_STYLES: Record<ServiceStatus, { cssClass: string; diamondColor: string; label: string }> = {
  active:      { cssClass: 'cop-status-active',      diamondColor: 'var(--green)',    label: 'Active' },
  inactive:    { cssClass: 'cop-status-inactive',    diamondColor: 'var(--text-dim)', label: 'Inactive' },
  error:       { cssClass: 'cop-status-error',       diamondColor: 'var(--red)',      label: 'Error' },
  maintenance: { cssClass: 'cop-status-maintenance', diamondColor: 'var(--yellow)',   label: 'Maintenance' },
  unknown:     { cssClass: 'cop-status-unknown',     diamondColor: 'var(--text-dim)', label: 'Unknown' },
};

/** Maps alert severity to CSS class and badge label. */
const ALERT_SEVERITY_STYLES: Record<'critical' | 'warning' | 'info', { cssClass: string; badgeClass: string }> = {
  critical: { cssClass: 'cop-alert-critical', badgeClass: 'cop-badge-critical' },
  warning:  { cssClass: 'cop-alert-warning',  badgeClass: 'cop-badge-warning' },
  info:     { cssClass: 'cop-alert-info',     badgeClass: 'cop-badge-info' },
};

/** Severity sort order (lower = higher priority). */
const SEVERITY_ORDER: Record<'critical' | 'warning' | 'info', number> = {
  critical: 0,
  warning:  1,
  info:     2,
};

// ============================================================================
// Service Health
// ============================================================================

/**
 * Render a grid of OpenStack service health indicators.
 *
 * Each service shows a color-coded diamond and its current status label.
 *
 * @param services - Array of service health entries.
 * @returns HTML string for the service health grid.
 */
export function renderServiceHealth(services: ServiceHealthEntry[]): string {
  if (services.length === 0) {
    return `<div class="cop-service-grid cop-service-empty">
  <span class="cop-empty-msg">No services configured</span>
</div>`;
  }

  const itemsHtml = services
    .map((svc) => {
      const style = SERVICE_STATUS_STYLES[svc.status];
      const msgAttr = svc.message ? ` title="${escapeAttr(svc.message)}"` : '';
      return `<div class="cop-service-item ${style.cssClass}"${msgAttr} data-service="${escapeAttr(svc.name)}">
    <span class="cop-diamond" style="color:${style.diamondColor}">\u25C6</span>
    <span class="cop-service-name">${escapeHtml(svc.name)}</span>
    <span class="cop-service-status">${style.label}</span>
    <span class="cop-service-time">${formatRelativeTime(svc.lastCheck)}</span>
  </div>`;
    })
    .join('\n  ');

  return `<div class="cop-service-grid">
  ${itemsHtml}
</div>`;
}

// ============================================================================
// Alert Summary
// ============================================================================

/**
 * Render a list of alerts sorted by severity (critical first).
 *
 * @param alerts - Array of alert entries.
 * @returns HTML string for the alert list.
 */
export function renderAlertSummary(alerts: AlertEntry[]): string {
  if (alerts.length === 0) {
    return `<div class="cop-alert-list">
  <div class="cop-alert-empty">No active alerts</div>
</div>`;
  }

  const sorted = [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const alertsHtml = sorted
    .map((alert) => {
      const style = ALERT_SEVERITY_STYLES[alert.severity];
      return `<div class="cop-alert-item ${style.cssClass}">
    <span class="cop-alert-badge ${style.badgeClass}">${alert.severity}</span>
    <span class="cop-alert-source">${escapeHtml(alert.source)}</span>
    <span class="cop-alert-message">${escapeHtml(alert.message)}</span>
    <span class="cop-alert-time">${formatRelativeTime(alert.timestamp)}</span>
  </div>`;
    })
    .join('\n  ');

  return `<div class="cop-alert-list">
  ${alertsHtml}
</div>`;
}

// ============================================================================
// Mission Telemetry
// ============================================================================

/**
 * Render mission telemetry: crew activation bars, budget gauge, loop health.
 *
 * @param telemetry - Mission telemetry data.
 * @returns HTML string for the telemetry section.
 */
export function renderMissionTelemetry(telemetry: MissionTelemetry): string {
  // Crew activation bars
  const crewsHtml = telemetry.crews.length > 0
    ? telemetry.crews
        .map((crew) => {
          const pct = crew.totalRoles > 0
            ? Math.round((crew.activeRoles / crew.totalRoles) * 100)
            : 0;
          return `<div class="cop-crew-item" data-profile="${escapeAttr(crew.profile)}">
    <span class="cop-crew-name">${escapeHtml(crew.name)}</span>
    <span class="cop-crew-profile">${crew.profile}</span>
    <div class="cop-crew-bar" role="meter" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="cop-crew-fill" style="width:${pct}%"></div>
    </div>
    <span class="cop-crew-ratio">${crew.activeRoles}/${crew.totalRoles}</span>
  </div>`;
        })
        .join('\n  ')
    : '<div class="cop-crew-empty">No crews active</div>';

  // Budget gauge
  const budgetPct = telemetry.budget.ceiling > 0
    ? Math.min(100, Math.round((telemetry.budget.used / telemetry.budget.ceiling) * 100))
    : 0;
  const budgetClass = telemetry.budget.blocked
    ? 'cop-budget-blocked'
    : telemetry.budget.warning
      ? 'cop-budget-warning'
      : 'cop-budget-ok';
  const budgetHtml = `<div class="cop-budget-gauge ${budgetClass}" role="meter" aria-valuenow="${budgetPct}" aria-valuemin="0" aria-valuemax="100">
    <div class="cop-budget-label">Token Budget</div>
    <div class="cop-budget-bar">
      <div class="cop-budget-fill" style="width:${budgetPct}%"></div>
    </div>
    <span class="cop-budget-numbers">${telemetry.budget.used.toLocaleString()} / ${telemetry.budget.ceiling.toLocaleString()}</span>
  </div>`;

  // Loop health dots (9 loops)
  const loopsHtml = telemetry.loops.length > 0
    ? `<div class="cop-loop-dots">
    ${telemetry.loops
        .map((loop) => {
          const dotClass = loop.operational ? 'cop-loop-dot-up' : 'cop-loop-dot-down';
          const dotColor = loop.operational ? 'var(--green)' : 'var(--red)';
          const title = `${loop.name}: ${loop.operational ? 'operational' : 'down'}${loop.lastMessage ? ` — ${loop.lastMessage}` : ''}`;
          return `<span class="cop-loop-dot ${dotClass}" style="color:${dotColor}" title="${escapeAttr(title)}" data-loop="${escapeAttr(loop.name)}">\u25CF</span>`;
        })
        .join('')}
  </div>`
    : '<div class="cop-loop-empty">No loop data</div>';

  return `<div class="cop-telemetry">
  <div class="cop-telemetry-crews">
    <div class="cop-telemetry-label">Crew Activation</div>
    ${crewsHtml}
  </div>
  <div class="cop-telemetry-budget">
    ${budgetHtml}
  </div>
  <div class="cop-telemetry-loops">
    <div class="cop-telemetry-label">Loop Health</div>
    ${loopsHtml}
  </div>
</div>`;
}

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the cloud operations panel with service health, alerts, and telemetry.
 *
 * Progressive enhancement:
 * - `enabled === null`: return empty string (no panel)
 * - `enabled === false`: return disabled message panel
 * - `enabled === true`: return full panel with all sections
 *
 * @param data - Cloud ops panel data.
 * @returns HTML string for the cloud ops panel, or empty string if no config.
 */
export function renderCloudOpsPanel(data: CloudOpsPanelData): string {
  // No config -- no panel at all
  if (data.enabled === null) {
    return '';
  }

  // Disabled -- informational message only
  if (data.enabled === false) {
    return `<div class="cop-panel">
  <h3 class="cop-title">Cloud Operations</h3>
  <div class="cop-disabled-msg">Cloud operations panel is not configured. Connect OpenStack services to enable monitoring.</div>
</div>`;
  }

  // Enabled -- full panel
  const serviceHealthHtml = renderServiceHealth(data.services);
  const alertSummaryHtml = renderAlertSummary(data.alerts);
  const telemetryHtml = renderMissionTelemetry(data.telemetry);

  return `<div class="cop-panel" data-panel-type="cloud-ops">
  <h3 class="cop-title">Cloud Operations</h3>
  <section class="cop-section cop-section-services">
    <h4 class="cop-section-title">Service Health</h4>
    ${serviceHealthHtml}
  </section>
  <section class="cop-section cop-section-alerts">
    <h4 class="cop-section-title">Alerts</h4>
    ${alertSummaryHtml}
  </section>
  <section class="cop-section cop-section-telemetry">
    <h4 class="cop-section-title">Mission Telemetry</h4>
    ${telemetryHtml}
  </section>
</div>`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Escape HTML entities for safe embedding in text content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape values for use in HTML attributes. */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format an ISO 8601 timestamp as a relative time string.
 * Returns "just now", "Xm ago", "Xh ago", or "Xd ago".
 */
function formatRelativeTime(isoTimestamp: string): string {
  const ts = Date.parse(isoTimestamp);
  if (Number.isNaN(ts)) return isoTimestamp;
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
