/**
 * Boot sequence peripheral renderer for MCP servers.
 *
 * Displays MCP servers as peripherals during GSD-OS startup, mimicking
 * an Amiga-style POST (Power-On Self-Test) check. Each server appears
 * as a peripheral with connection status, trust state, and tool counts.
 *
 * Pure render functions, no I/O. Satisfies PRES-07.
 *
 * @module mcp/presentation/boot-peripherals
 */

import type { TrustState } from '../../core/types/mcp.js';

// ============================================================================
// Types
// ============================================================================

/** Data for a single MCP server boot peripheral. */
export interface BootPeripheralData {
  /** Server identifier. */
  serverId: string;
  /** Human-readable server name. */
  serverName: string;
  /** Transport type used for connection. */
  transportType: 'stdio' | 'streamable-http';
  /** Current connection status. */
  status: 'connected' | 'disconnected' | 'failed' | 'connecting';
  /** Security trust state. */
  trustState: TrustState;
  /** Number of tools discovered. */
  toolCount: number;
  /** Number of resources discovered. */
  resourceCount: number;
  /** Number of prompts discovered. */
  promptCount: number;
  /** Optional latency from last operation (ms). */
  latencyMs?: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Status to display text and CSS class. */
const STATUS_DISPLAY: Record<string, { text: string; cssClass: string }> = {
  connected:    { text: 'OK',      cssClass: 'boot-status-ok' },
  disconnected: { text: 'OFFLINE', cssClass: 'boot-status-offline' },
  failed:       { text: 'FAIL',    cssClass: 'boot-status-fail' },
  connecting:   { text: '...',     cssClass: 'boot-status-connecting' },
};

/** Trust state to single-char abbreviation. */
const TRUST_ABBREV: Record<TrustState, string> = {
  quarantine:  'Q',
  provisional: 'P',
  trusted:     'T',
  suspended:   'S',
};

// ============================================================================
// Single Peripheral
// ============================================================================

/**
 * Render a single MCP server peripheral line in boot sequence style.
 *
 * Format: `MCP: <name> (<transport>) ... <status> [<tools> tools, <resources> res] [<trust>]`
 *
 * @param data - Boot peripheral data.
 * @returns HTML string for a single boot peripheral line.
 */
export function renderBootPeripheral(data: BootPeripheralData): string {
  const statusInfo = STATUS_DISPLAY[data.status] ?? STATUS_DISPLAY.disconnected;
  const trustAbbrev = TRUST_ABBREV[data.trustState];

  const transportLabel = data.transportType === 'stdio' ? 'stdio' : 'http';

  const latencyHtml = data.latencyMs !== undefined
    ? ` <span class="boot-latency">${data.latencyMs}ms</span>`
    : '';

  // Build the dots for alignment (Amiga POST style)
  const nameSection = `MCP: ${escapeHtml(data.serverName)} (${transportLabel})`;
  const maxWidth = 50;
  const dotsCount = Math.max(3, maxWidth - nameSection.length);
  const dots = '.'.repeat(dotsCount);

  return `<div class="boot-peripheral" data-server-id="${escapeAttr(data.serverId)}">
  <span class="boot-name">${escapeHtml(data.serverName)}</span>
  <span class="boot-transport">(${transportLabel})</span>
  <span class="boot-dots">${dots}</span>
  <span class="boot-status ${statusInfo.cssClass}">${statusInfo.text}</span>
  <span class="boot-caps">[${data.toolCount} tools, ${data.resourceCount} res]</span>
  <span class="boot-trust">[${trustAbbrev}]</span>${latencyHtml}
</div>`;
}

// ============================================================================
// Full Boot Peripherals Panel
// ============================================================================

/**
 * Render the complete MCP boot peripherals panel.
 *
 * Shows a retro boot-screen style listing of all MCP servers with
 * connection status and capability summary.
 *
 * @param peripherals - Array of boot peripheral data.
 * @returns HTML string for the boot peripherals panel.
 */
export function renderBootPeripherals(peripherals: BootPeripheralData[]): string {
  if (peripherals.length === 0) {
    return `<div class="boot-peripherals-panel" data-boot-stage="mcp-peripherals">
  <div class="boot-header">Checking MCP peripherals...<span class="boot-cursor">\u2588</span></div>
  <div class="boot-empty">No MCP servers configured</div>
</div>`;
  }

  const connectedCount = peripherals.filter((p) => p.status === 'connected').length;
  const totalTools = peripherals.reduce((sum, p) => sum + p.toolCount, 0);

  const peripheralsHtml = peripherals
    .map((p) => renderBootPeripheral(p))
    .join('\n  ');

  return `<div class="boot-peripherals-panel" data-boot-stage="mcp-peripherals">
  <div class="boot-header">Checking MCP peripherals...<span class="boot-cursor">\u2588</span></div>
  ${peripheralsHtml}
  <div class="boot-summary">${peripherals.length} MCP server(s) detected, ${connectedCount} connected, ${totalTools} tools available</div>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the boot peripherals panel.
 *
 * Retro CRT / Amiga POST aesthetic with monospace green text
 * on a near-black background.
 *
 * @returns CSS string.
 */
export function renderBootPeripheralStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Boot Peripherals Panel
   ----------------------------------------------------------------------- */

.boot-peripherals-panel {
  background: #0a0a0a;
  border: 1px solid #1a3a1a;
  border-radius: var(--radius-md, 6px);
  padding: var(--space-lg, 1.25rem);
  font-family: 'Courier New', 'Lucida Console', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #33ff33;
  text-shadow: 0 0 4px rgba(51, 255, 51, 0.3);
}

.boot-header {
  font-weight: 700;
  margin-bottom: var(--space-sm, 0.5rem);
  color: #33ff33;
}

.boot-cursor {
  animation: boot-blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes boot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.boot-peripheral {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 1px 0;
  white-space: nowrap;
}

.boot-name {
  color: #33ff33;
  font-weight: 600;
}

.boot-transport {
  color: #1a9a1a;
  font-size: 0.8rem;
}

.boot-dots {
  color: #1a4a1a;
  letter-spacing: 1px;
  flex: 1;
  overflow: hidden;
}

.boot-status {
  font-weight: 700;
  min-width: 50px;
  text-align: right;
}

.boot-status-ok {
  color: #33ff33;
}

.boot-status-offline {
  color: #555555;
}

.boot-status-fail {
  color: #ff3333;
}

.boot-status-connecting {
  color: #ffaa00;
  animation: boot-blink 0.5s step-end infinite;
}

.boot-caps {
  color: #1a9a1a;
  font-size: 0.8rem;
}

.boot-trust {
  color: #888888;
  font-size: 0.8rem;
}

.boot-latency {
  color: #1a7a1a;
  font-size: 0.75rem;
}

.boot-summary {
  margin-top: var(--space-sm, 0.5rem);
  padding-top: var(--space-xs, 0.25rem);
  border-top: 1px solid #1a3a1a;
  color: #33ff33;
  font-weight: 600;
}

.boot-empty {
  color: #555555;
  font-style: italic;
  padding: var(--space-sm, 0.5rem) 0;
}
`;
}

// ============================================================================
// Helpers
// ============================================================================

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
