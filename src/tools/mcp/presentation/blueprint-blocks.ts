/**
 * Blueprint block renderers for MCP Server, Tool, and Resource blocks.
 *
 * Pure render functions producing HTML strings for the Blueprint Editor.
 * Each block type has typed ports, status indicators, and trust badges.
 * Follows the silicon-panel.ts rendering pattern: data in, HTML out.
 *
 * Satisfies PRES-01 (Server blocks), PRES-02 (Tool blocks), PRES-03 (Resource blocks).
 *
 * @module mcp/presentation/blueprint-blocks
 */

import type { TrustState } from '../../../core/types/mcp.js';
import type { ServerBlockData, ToolBlockData, ResourceBlockData } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Visual indicators for each trust state. */
const TRUST_INDICATORS: Record<TrustState, { icon: string; cssClass: string; label: string }> = {
  quarantine:   { icon: '\u26A0',  cssClass: 'bp-trust-quarantine',  label: 'Quarantine' },
  provisional:  { icon: '\u23F3',  cssClass: 'bp-trust-provisional', label: 'Provisional' },
  trusted:      { icon: '\u2713',  cssClass: 'bp-trust-trusted',     label: 'Trusted' },
  suspended:    { icon: '\u26D4',  cssClass: 'bp-trust-suspended',   label: 'Suspended' },
};

/** Visual indicators for connection status. */
const STATUS_INDICATORS: Record<string, { icon: string; cssClass: string }> = {
  connected:    { icon: '\u25CF', cssClass: 'bp-status-connected' },
  disconnected: { icon: '\u25CB', cssClass: 'bp-status-disconnected' },
  failed:       { icon: '\u2717', cssClass: 'bp-status-failed' },
  connecting:   { icon: '\u21BB', cssClass: 'bp-status-connecting' },
};

// ============================================================================
// Server Block (PRES-01)
// ============================================================================

/**
 * Render an MCP Server block with tool/resource ports, status indicator, and trust badge.
 *
 * @param data - Server block data including tools, resources, and security state.
 * @returns HTML string for the server block.
 */
export function renderServerBlock(data: ServerBlockData): string {
  const trust = TRUST_INDICATORS[data.trustState];
  const status = STATUS_INDICATORS[data.status] ?? STATUS_INDICATORS.disconnected;

  const toolPortsHtml = data.tools
    .map(
      (tool) =>
        `<div class="bp-port bp-port-output bp-port-tool-call" data-port-type="tool-call" title="${escapeAttr(tool.description)}">
        <span class="bp-port-icon">\u25A0</span>
        <span class="bp-port-name">${escapeHtml(tool.name)}</span>
      </div>`,
    )
    .join('\n      ');

  const resourcePortsHtml = data.resources
    .map(
      (res) =>
        `<div class="bp-port bp-port-output bp-port-resource-data" data-port-type="resource-data" title="${escapeAttr(res.uri)}">
        <span class="bp-port-icon">\u25A0</span>
        <span class="bp-port-name">${escapeHtml(res.name)}</span>
      </div>`,
    )
    .join('\n      ');

  const dimClass = data.status === 'disconnected' ? ' bp-block-dimmed' : '';

  return `<div class="bp-block bp-block-server${dimClass}" data-block-type="server" data-server-id="${escapeAttr(data.serverId)}">
  <div class="bp-block-header">
    <span class="bp-status-indicator ${status.cssClass}">${status.icon}</span>
    <span class="bp-block-title">${escapeHtml(data.serverName)}</span>
    <span class="bp-trust-badge ${trust.cssClass}" title="${trust.label}">${trust.icon} ${trust.label}</span>
  </div>
  <div class="bp-block-meta">
    <span class="bp-meta-item">${data.toolCount} tools</span>
    <span class="bp-meta-item">${data.resourceCount} resources</span>
    <span class="bp-meta-item">${data.promptCount} prompts</span>
  </div>
  <div class="bp-block-ports">
    <div class="bp-port-section bp-port-section-tools">
      ${toolPortsHtml}
    </div>
    <div class="bp-port-section bp-port-section-resources">
      ${resourcePortsHtml}
    </div>
  </div>
</div>`;
}

// ============================================================================
// Tool Block (PRES-02)
// ============================================================================

/**
 * Render an MCP Tool block with parameter preview and input/output ports.
 *
 * @param data - Tool block data including parameters and owning server.
 * @returns HTML string for the tool block.
 */
export function renderToolBlock(data: ToolBlockData): string {
  const maxPreview = 3;
  const previewParams = data.parameters.slice(0, maxPreview);
  const hasMore = data.parameters.length > maxPreview;

  const paramsHtml = previewParams
    .map(
      (p) =>
        `<div class="bp-param">
        <span class="bp-param-name">${escapeHtml(p.name)}</span>
        <span class="bp-param-type">${escapeHtml(p.type)}</span>
        ${p.required ? '<span class="bp-param-required">*</span>' : ''}
      </div>`,
    )
    .join('\n      ');

  const moreHtml = hasMore
    ? `<div class="bp-param-more">+${data.parameters.length - maxPreview} more</div>`
    : '';

  return `<div class="bp-block bp-block-tool" data-block-type="tool" data-tool-name="${escapeAttr(data.toolName)}" data-server-id="${escapeAttr(data.serverId)}">
  <div class="bp-block-header">
    <span class="bp-block-icon">\u2699</span>
    <span class="bp-block-title">${escapeHtml(data.toolName)}</span>
  </div>
  <div class="bp-block-description">${escapeHtml(data.description)}</div>
  <div class="bp-block-params">
    ${paramsHtml}
    ${moreHtml}
  </div>
  <div class="bp-block-ports">
    <div class="bp-port bp-port-input bp-port-agent-input" data-port-type="agent-input">
      <span class="bp-port-icon">\u25CF</span>
      <span class="bp-port-name">invoke</span>
    </div>
    <div class="bp-port bp-port-output bp-port-tool-result" data-port-type="tool-result">
      <span class="bp-port-icon">\u25A0</span>
      <span class="bp-port-name">result</span>
    </div>
  </div>
</div>`;
}

// ============================================================================
// Resource Block (PRES-03)
// ============================================================================

/**
 * Render an MCP Resource block with subscription indicator and data/context ports.
 *
 * @param data - Resource block data including URI, MIME type, and subscription state.
 * @returns HTML string for the resource block.
 */
export function renderResourceBlock(data: ResourceBlockData): string {
  const subscriptionIndicator = data.subscribed
    ? '<span class="bp-subscription bp-subscription-active" title="Subscribed">\u25C9</span>'
    : '<span class="bp-subscription bp-subscription-inactive" title="Not subscribed">\u25CE</span>';

  const mimeHtml = data.mimeType
    ? `<span class="bp-resource-mime">${escapeHtml(data.mimeType)}</span>`
    : '';

  const descHtml = data.description
    ? `<div class="bp-block-description">${escapeHtml(data.description)}</div>`
    : '';

  return `<div class="bp-block bp-block-resource" data-block-type="resource" data-resource-uri="${escapeAttr(data.uri)}" data-server-id="${escapeAttr(data.serverId)}">
  <div class="bp-block-header">
    <span class="bp-block-icon">\u{1F4C4}</span>
    <span class="bp-block-title">${escapeHtml(data.resourceName)}</span>
    ${subscriptionIndicator}
  </div>
  <div class="bp-resource-uri">${escapeHtml(data.uri)}</div>
  ${mimeHtml}
  ${descHtml}
  <div class="bp-block-ports">
    <div class="bp-port bp-port-output bp-port-resource-data" data-port-type="resource-data">
      <span class="bp-port-icon">\u25A0</span>
      <span class="bp-port-name">data</span>
    </div>
    <div class="bp-port bp-port-input bp-port-context" data-port-type="context">
      <span class="bp-port-icon">\u25CF</span>
      <span class="bp-port-name">context</span>
    </div>
  </div>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the blueprint block components.
 *
 * Uses CSS custom properties from the dashboard dark theme. Includes
 * trust state colors, status indicator animations, and port rendering.
 *
 * @returns CSS string.
 */
export function renderBlueprintStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Blueprint Blocks
   ----------------------------------------------------------------------- */

.bp-block {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
  min-width: 220px;
  max-width: 320px;
  font-family: var(--font-sans, system-ui, sans-serif);
}

.bp-block-dimmed {
  opacity: 0.5;
}

/* --- Block header --- */

.bp-block-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

.bp-block-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text, #e6edf3);
  flex: 1;
}

.bp-block-icon {
  font-size: 1rem;
}

.bp-block-description {
  font-size: 0.8rem;
  color: var(--text-muted, #8b949e);
  margin-bottom: var(--space-sm, 0.5rem);
  line-height: 1.4;
}

/* --- Status indicators --- */

.bp-status-indicator {
  font-size: 0.85rem;
  margin-right: var(--space-xs, 0.25rem);
}

.bp-status-connected { color: var(--green, #3fb950); }
.bp-status-disconnected { color: var(--text-dim, #484f58); }
.bp-status-failed { color: var(--red, #f85149); }
.bp-status-connecting {
  color: var(--yellow, #d29922);
  animation: bp-spin 1s linear infinite;
}

@keyframes bp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* --- Trust badges --- */

.bp-trust-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm, 4px);
  font-weight: 600;
  white-space: nowrap;
}

.bp-trust-quarantine {
  background: rgba(248, 81, 73, 0.15);
  color: var(--red, #f85149);
  border: 1px solid rgba(248, 81, 73, 0.3);
}

.bp-trust-provisional {
  background: rgba(210, 153, 34, 0.15);
  color: var(--yellow, #d29922);
  border: 1px solid rgba(210, 153, 34, 0.3);
}

.bp-trust-trusted {
  background: rgba(63, 185, 80, 0.15);
  color: var(--green, #3fb950);
  border: 1px solid rgba(63, 185, 80, 0.3);
}

.bp-trust-suspended {
  background: rgba(139, 148, 158, 0.15);
  color: var(--text-muted, #8b949e);
  border: 1px solid rgba(139, 148, 158, 0.3);
}

/* --- Block meta --- */

.bp-block-meta {
  display: flex;
  gap: var(--space-sm, 0.5rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

.bp-meta-item {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
  font-variant-numeric: tabular-nums;
}

/* --- Ports --- */

.bp-block-ports {
  margin-top: var(--space-sm, 0.5rem);
}

.bp-port-section {
  margin-bottom: var(--space-xs, 0.25rem);
}

.bp-port {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  padding: 2px 4px;
  font-size: 0.8rem;
}

.bp-port-icon {
  font-size: 0.6rem;
  line-height: 1;
}

.bp-port-input .bp-port-icon {
  color: var(--blue, #58a6ff);
}

.bp-port-output .bp-port-icon {
  color: var(--purple, #bc8cff);
}

.bp-port-name {
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
  color: var(--text, #e6edf3);
}

/* --- Parameters --- */

.bp-block-params {
  margin-bottom: var(--space-sm, 0.5rem);
  padding: var(--space-xs, 0.25rem);
  background: var(--bg, #0d1117);
  border-radius: var(--radius-sm, 4px);
}

.bp-param {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  padding: 1px 0;
  font-size: 0.75rem;
}

.bp-param-name {
  color: var(--text, #e6edf3);
  font-family: var(--font-mono, monospace);
}

.bp-param-type {
  color: var(--text-muted, #8b949e);
  font-family: var(--font-mono, monospace);
  font-style: italic;
}

.bp-param-required {
  color: var(--red, #f85149);
  font-weight: 700;
}

.bp-param-more {
  font-size: 0.7rem;
  color: var(--text-dim, #484f58);
  font-style: italic;
  padding-top: 2px;
}

/* --- Resource-specific --- */

.bp-resource-uri {
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
  color: var(--blue, #58a6ff);
  margin-bottom: var(--space-xs, 0.25rem);
  word-break: break-all;
}

.bp-resource-mime {
  display: inline-block;
  font-size: 0.7rem;
  padding: 1px 4px;
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-sm, 4px);
  color: var(--text-muted, #8b949e);
  font-family: var(--font-mono, monospace);
  margin-bottom: var(--space-xs, 0.25rem);
}

.bp-subscription {
  font-size: 0.85rem;
}

.bp-subscription-active {
  color: var(--green, #3fb950);
}

.bp-subscription-inactive {
  color: var(--text-dim, #484f58);
}

/* --- Block type borders --- */

.bp-block-server { border-left: 3px solid var(--blue, #58a6ff); }
.bp-block-tool { border-left: 3px solid var(--purple, #bc8cff); }
.bp-block-resource { border-left: 3px solid var(--green, #3fb950); }
`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Escape HTML entities for safe rendering. */
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
