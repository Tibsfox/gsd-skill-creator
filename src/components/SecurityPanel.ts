/**
 * Security Dashboard Panel — Shield indicator and detail panel components.
 *
 * The shield indicator is ALWAYS visible regardless of magic level.
 * Critical security events bypass the magic filter — the shield updates
 * at every magic level when severity is 'blocked' or 'critical'.
 *
 * Pure render functions returning HTML strings. No I/O, no side effects.
 *
 * @module components/SecurityPanel
 */

// ============================================================================
// Types
// ============================================================================

/** Shield status — 4 states with distinct color mappings. */
export type ShieldStatus = 'secure' | 'attention' | 'breach-blocked' | 'inactive';

/** A security event emitted by any security subsystem. */
export interface SecurityEvent {
  /** Unique event identifier. */
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Event severity level. */
  severity: 'blocked' | 'critical' | 'warning' | 'info' | 'audit';
  /** Subsystem that generated this event. */
  source: 'sandbox' | 'proxy' | 'staging' | 'isolation';
  /** Human-readable event description. */
  message: string;
  /** Agent identifier (optional). */
  agentId?: string;
  /** Network domain (optional). */
  domain?: string;
}

/** Shield state — the single source of truth for taskbar indicator. */
export interface ShieldState {
  /** Current shield status. */
  status: ShieldStatus;
  /** Most recent security event, or null if none. */
  last_event: SecurityEvent | null;
  /** Whether OS-level sandbox is active. */
  sandbox_active: boolean;
  /** Whether credential proxy is running. */
  proxy_active: boolean;
  /** Number of agents currently isolated. */
  agents_isolated: number;
}

/** Timeline filter/data structure. */
export interface SecurityTimeline {
  /** Events in the timeline. */
  events: SecurityEvent[];
  /** Active filters. */
  filter: {
    severity: string[];
    source: string[];
    time_range: { start: string; end: string };
  };
}

/** A blocked network request entry. */
export interface BlockedRequest {
  /** Unique request identifier. */
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Target domain. */
  domain: string;
  /** Agent that issued the request. */
  agentId: string;
  /** Reason for blocking. */
  reason: string;
  /** Severity level. */
  severity: 'blocked' | 'warning';
}

/** Per-agent isolation status entry. */
export interface AgentIsolationStatus {
  /** Agent identifier. */
  agentId: string;
  /** Agent type. */
  agentType: 'EXEC' | 'VERIFY' | 'SCOUT' | 'main';
  /** Whether the agent is currently isolated. */
  isolated: boolean;
  /** Path to the agent's worktree. */
  worktreePath: string;
  /** Sandbox profile name applied. */
  sandboxProfile: string;
}

/** Credential proxy health status. */
export interface ProxyHealth {
  /** Proxy status. */
  status: 'running' | 'down' | 'degraded';
  /** Uptime in seconds. */
  uptime: number;
  /** Total requests processed. */
  requestCount: number;
  /** Total requests blocked. */
  blockedCount: number;
  /** Currently active domains. */
  activeDomains: string[];
  /** Average request latency in milliseconds. */
  avgLatencyMs: number;
}

/** Sandbox profile for level 5 display. */
export interface SandboxProfile {
  /** Profile name. */
  name: string;
  /** Whether the profile is currently active. */
  active: boolean;
  /** Agent type this profile applies to. */
  agentType: string;
}

/** Proxy log entry for level 5 display. */
export interface ProxyLogEntry {
  /** Target domain. */
  domain: string;
  /** Request outcome. */
  status: 'allowed' | 'blocked';
  /** Request latency in milliseconds. */
  latencyMs: number;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

/** Quarantine item for level 5 display. */
export interface QuarantineItem {
  /** Quarantine entry identifier. */
  id: string;
  /** Reason for quarantine. */
  reason: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Severity of the quarantined content. */
  severity: string;
}

/** Optional data for level 5 security detail rendering. */
export interface SecurityDetailOpts {
  /** Sandbox profiles to display. */
  sandboxProfiles?: SandboxProfile[];
  /** Recent proxy log entries. */
  proxyLogs?: ProxyLogEntry[];
  /** Quarantined items. */
  quarantineItems?: QuarantineItem[];
}

// ============================================================================
// Constants
// ============================================================================

/** Shield state to CSS class mapping. */
const SHIELD_STATE_CLASSES: Record<ShieldStatus, string> = {
  'secure': 'shield-secure',
  'attention': 'shield-attention',
  'breach-blocked': 'shield-breach-blocked',
  'inactive': 'shield-inactive',
};

/** Event severity to CSS class mapping. */
const SEVERITY_CLASSES: Record<string, string> = {
  'blocked': 'severity-blocked',
  'critical': 'severity-critical',
  'warning': 'severity-warning',
  'info': 'severity-info',
  'audit': 'severity-audit',
};

/** All 10 IPC event names consumed by the security panel. */
export const SECURITY_IPC_EVENTS = {
  'sandbox-active': 'security:sandbox-active',
  'sandbox-failed': 'security:sandbox-failed',
  'escape-blocked': 'security:escape-blocked',
  'request-blocked': 'security:request-blocked',
  'proxy-health': 'security:proxy-health',
  'content-quarantined': 'security:content-quarantined',
  'content-flagged': 'security:content-flagged',
  'agent-created': 'security:agent-created',
  'agent-destroyed': 'security:agent-destroyed',
  'isolation-verified': 'security:isolation-verified',
} as const;

// ============================================================================
// Core functions
// ============================================================================

/**
 * Returns true when a security event must bypass the magic filter.
 * Blocked and critical events ALWAYS update the shield regardless of magic level.
 */
export function shouldBypassMagicFilter(event: SecurityEvent): boolean {
  return event.severity === 'blocked' || event.severity === 'critical';
}

/**
 * Returns pulse CSS class when shield state changes, empty string otherwise.
 */
export function getShieldPulseClass(prev: ShieldState, next: ShieldState): string {
  return prev.status !== next.status ? 'shield-pulse' : '';
}

/**
 * Renders the shield indicator — ALWAYS returns non-empty output at all magic levels.
 *
 * - Level 1: icon + color class only (no text)
 * - Level 2: icon + color + one-line status summary
 * - Level 3+: icon + color + status + sandbox/proxy status
 */
export function renderShieldIndicator(state: ShieldState, magicLevel: number): string {
  const stateClass = SHIELD_STATE_CLASSES[state.status];

  // Level 1: shield icon only with color class
  if (magicLevel <= 1) {
    return `<div class="shield-indicator ${stateClass}"><span class="shield-icon"></span></div>`;
  }

  // Level 2: shield + one-line status
  if (magicLevel === 2) {
    return `<div class="shield-indicator ${stateClass}"><span class="shield-icon"></span><span class="shield-status">${state.status}</span></div>`;
  }

  // Level 3+: shield + status + sandbox/proxy indicators
  const sandboxLabel = state.sandbox_active ? 'Sandbox: ON' : 'Sandbox: OFF';
  const proxyLabel = state.proxy_active ? 'Proxy: ON' : 'Proxy: OFF';

  return `<div class="shield-indicator ${stateClass}"><span class="shield-icon"></span><span class="shield-status">${state.status}</span><span class="shield-subsystems">${sandboxLabel} | ${proxyLabel}</span></div>`;
}

/**
 * Renders the security detail panel.
 *
 * - Level 1-2: basic detail only (no timeline)
 * - Level 3-4: detail + event timeline
 * - Level 5: detail + timeline + full operations view
 */
export function renderSecurityDetail(
  state: ShieldState,
  timeline: SecurityTimeline,
  magicLevel: number,
  opts?: SecurityDetailOpts,
): string {
  const stateClass = SHIELD_STATE_CLASSES[state.status];
  let html = `<div class="security-detail ${stateClass}">`;

  // Basic info always present
  html += `<div class="security-summary"><span>Status: ${state.status}</span><span>Agents isolated: ${state.agents_isolated}</span></div>`;

  // Timeline at level 3+
  if (magicLevel >= 3) {
    html += `<div class="security-timeline">`;
    for (const event of timeline.events) {
      const sevClass = SEVERITY_CLASSES[event.severity] || '';
      html += `<div class="security-timeline-entry ${sevClass}"><span class="timeline-time">${event.timestamp}</span><span class="timeline-source">${event.source}</span><span class="timeline-message">${event.message}</span></div>`;
    }
    html += `</div>`;
  }

  // Full operations view at level 5
  if (magicLevel >= 5) {
    // Event stream
    html += `<div class="security-event-stream"><h4>Event Stream</h4>`;
    for (const event of timeline.events) {
      const sevClass = SEVERITY_CLASSES[event.severity] || '';
      html += `<div class="event-entry ${sevClass}"><span>${event.timestamp}</span><span>${event.severity}</span><span>${event.message}</span></div>`;
    }
    html += `</div>`;

    // Sandbox profiles
    html += `<div class="sandbox-profiles"><h4>Sandbox Profiles</h4>`;
    if (opts?.sandboxProfiles) {
      for (const profile of opts.sandboxProfiles) {
        const activeClass = profile.active ? 'profile-active' : 'profile-inactive';
        html += `<div class="profile-entry ${activeClass}"><span>${profile.name}</span><span>${profile.agentType}</span><span>${profile.active ? 'Active' : 'Inactive'}</span></div>`;
      }
    }
    html += `</div>`;

    // Proxy logs
    html += `<div class="proxy-logs"><h4>Proxy Logs</h4>`;
    if (opts?.proxyLogs) {
      for (const log of opts.proxyLogs) {
        html += `<div class="proxy-log-entry"><span>${log.timestamp}</span><span>${log.domain}</span><span>${log.status}</span><span>${log.latencyMs}ms</span></div>`;
      }
    }
    html += `</div>`;

    // Quarantine contents
    html += `<div class="quarantine-contents"><h4>Quarantine</h4>`;
    if (opts?.quarantineItems) {
      for (const item of opts.quarantineItems) {
        html += `<div class="quarantine-entry"><span>${item.id}</span><span>${item.reason}</span><span>${item.severity}</span></div>`;
      }
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ============================================================================
// Blocked request log
// ============================================================================

/**
 * Renders the blocked request log with severity-colored entries.
 * Empty list returns an empty container div.
 */
export function renderBlockedRequestLog(requests: BlockedRequest[]): string {
  let html = `<div class="blocked-request-log">`;
  for (const req of requests) {
    const sevClass = req.severity === 'blocked' ? 'severity-blocked' : 'severity-warning';
    html += `<div class="blocked-entry ${sevClass}"><span class="blocked-domain">${req.domain}</span><span class="blocked-agent">${req.agentId}</span><span class="blocked-reason">${req.reason}</span><span class="blocked-time">${req.timestamp}</span></div>`;
  }
  html += `</div>`;
  return html;
}

// ============================================================================
// Agent isolation status
// ============================================================================

/**
 * Renders per-agent isolation status. Each entry shows agentId, agentType,
 * and isolation state with isolated-yes or isolated-no CSS class.
 * Empty list returns an empty container div.
 */
export function renderAgentIsolationStatus(agents: AgentIsolationStatus[]): string {
  let html = `<div class="agent-isolation-status">`;
  for (const agent of agents) {
    const isoClass = agent.isolated ? 'isolated-yes' : 'isolated-no';
    html += `<div class="agent-entry ${isoClass}"><span class="agent-id">${agent.agentId}</span><span class="agent-type">${agent.agentType}</span><span class="agent-isolated">${agent.isolated ? 'Isolated' : 'Not Isolated'}</span><span class="agent-worktree">${agent.worktreePath}</span></div>`;
  }
  html += `</div>`;
  return html;
}

// ============================================================================
// Proxy health
// ============================================================================

/**
 * Renders credential proxy health status with proxy-running, proxy-down,
 * or proxy-degraded CSS class matching the health status.
 */
export function renderProxyHealth(health: ProxyHealth): string {
  const statusClass = `proxy-${health.status}`;
  return `<div class="proxy-health ${statusClass}"><div class="proxy-status"><span>Status: ${health.status}</span><span>Uptime: ${health.uptime}s</span></div><div class="proxy-metrics"><span>Requests: ${health.requestCount}</span><span>Blocked: ${health.blockedCount}</span><span>Avg Latency: ${health.avgLatencyMs}ms</span></div><div class="proxy-domains"><span>Active Domains: ${health.activeDomains.join(', ')}</span></div></div>`;
}
