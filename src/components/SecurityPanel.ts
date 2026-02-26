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

  html += `</div>`;
  return html;
}
