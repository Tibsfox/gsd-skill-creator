/**
 * Silicon adapter dashboard panel renderer.
 *
 * Displays GPU/accelerator adapter status using diamond shapes,
 * confidence scores, five-state lifecycle mapping, and a VRAM usage
 * gauge. Follows progressive enhancement: no config = no panel,
 * disabled = informational message, enabled = full panel.
 *
 * Pure render functions, no I/O. Satisfies REQ-SP-01 through REQ-SP-04.
 *
 * @module dashboard/silicon-panel
 */

// ============================================================================
// Types
// ============================================================================

/** Five-state lifecycle for adapters, matching design system vocabulary. */
export type AdapterState = 'not-started' | 'active' | 'complete' | 'blocked' | 'attention';

/** Information about a single silicon adapter. */
export interface AdapterInfo {
  /** Adapter name (e.g. "CUDA", "ROCm", "Metal"). */
  name: string;
  /** Current lifecycle state. */
  state: AdapterState;
  /** Confidence score (0.0-1.0). */
  confidence: number;
  /** Optional domain for color (e.g. "silicon"). */
  domain?: string;
}

/** A single segment in the VRAM gauge bar. */
export interface VramSegment {
  /** What is using VRAM (e.g. "Model", "KV Cache"). */
  label: string;
  /** Percentage of VRAM used by this segment (0-100). */
  percentage: number;
  /** CSS color string. */
  color: string;
}

/** Data needed to render the silicon panel. */
export interface SiliconPanelData {
  /** null = no config, false = disabled, true = enabled. */
  enabled: boolean | null;
  /** Adapter information. */
  adapters: AdapterInfo[];
  /** VRAM usage data. */
  vram: {
    segments: VramSegment[];
    totalUsed: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Maps each adapter state to its CSS class and diamond color. */
const STATE_STYLES: Record<AdapterState, { cssClass: string; diamondColor: string }> = {
  'not-started': { cssClass: 'sp-state-not-started', diamondColor: 'var(--text-dim)' },
  'active':      { cssClass: 'sp-state-active',      diamondColor: 'var(--green)' },
  'complete':    { cssClass: 'sp-state-complete',     diamondColor: 'var(--green)' },
  'blocked':     { cssClass: 'sp-state-blocked',      diamondColor: 'var(--red)' },
  'attention':   { cssClass: 'sp-state-attention',    diamondColor: 'var(--yellow)' },
};

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the silicon adapter panel with diamond indicators and VRAM gauge.
 *
 * Progressive enhancement:
 * - `enabled === null`: return empty string (no panel)
 * - `enabled === false`: return disabled message panel
 * - `enabled === true`: return full panel with adapters and VRAM
 *
 * @param data - Silicon panel configuration and adapter data.
 * @returns HTML string for the silicon panel, or empty string if no config.
 */
export function renderSiliconPanel(data: SiliconPanelData): string {
  // No config -- no panel at all
  if (data.enabled === null) {
    return '';
  }

  // Disabled -- informational message only
  if (data.enabled === false) {
    return `<div class="silicon-panel">
  <h3 class="sp-title">Silicon</h3>
  <div class="sp-disabled-msg">Silicon acceleration is not configured. Add silicon.yaml to enable adapter monitoring.</div>
</div>`;
  }

  // Enabled -- full panel
  const adaptersHtml = data.adapters
    .map((adapter) => {
      const style = STATE_STYLES[adapter.state];
      return `<div class="sp-adapter ${style.cssClass}" data-state="${adapter.state}">
      <span class="sp-diamond" style="color:${style.diamondColor}">\u25C6</span>
      <span class="sp-adapter-name">${adapter.name}</span>
      <span class="sp-confidence">${adapter.confidence.toFixed(2)}</span>
    </div>`;
    })
    .join('\n    ');

  // VRAM segments
  const vramSegmentsHtml = data.vram.segments
    .map(
      (seg) =>
        `<div class="sp-vram-segment" style="width:${seg.percentage}%;background:${seg.color}" data-label="${seg.label}"></div>`,
    )
    .join('');

  // VRAM headroom
  const vramHeadroomHtml =
    data.vram.totalUsed < 100
      ? `<div class="sp-vram-headroom" style="width:${100 - data.vram.totalUsed}%"></div>`
      : '';

  return `<div class="silicon-panel">
  <h3 class="sp-title">Silicon</h3>
  <div class="sp-adapters">
    ${adaptersHtml}
  </div>
  <div class="sp-vram-gauge" role="meter" aria-valuenow="${data.vram.totalUsed}" aria-valuemin="0" aria-valuemax="100">
    <div class="sp-vram-label">VRAM</div>
    <div class="sp-vram-bar">${vramSegmentsHtml}${vramHeadroomHtml}</div>
  </div>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the silicon panel component.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderSiliconPanelStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Silicon Panel
   ----------------------------------------------------------------------- */

.silicon-panel {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-md, 1rem);
}

.sp-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text, #e6edf3);
  margin: 0 0 var(--space-md, 1rem) 0;
}

/* --- Adapters layout --- */

.sp-adapters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md, 1rem);
  margin-bottom: var(--space-md, 1rem);
}

.sp-adapter {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-md, 6px);
}

.sp-diamond {
  font-size: 1rem;
  line-height: 1;
}

.sp-adapter-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text, #e6edf3);
}

.sp-confidence {
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
  color: var(--text-muted, #8b949e);
  font-variant-numeric: tabular-nums;
}

/* --- State classes --- */

.sp-state-not-started {
  opacity: 0.5;
}

.sp-state-active .sp-diamond {
  animation: sp-pulse 2s ease-in-out infinite;
}

.sp-state-complete .sp-adapter-name {
  color: var(--green, #3fb950);
}

.sp-state-blocked {
  opacity: 0.6;
}

.sp-state-blocked .sp-adapter-name {
  text-decoration: line-through;
}

.sp-state-attention {
  border-color: var(--yellow, #d29922);
}

@keyframes sp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* --- VRAM gauge --- */

.sp-vram-gauge {
  margin-top: var(--space-sm, 0.5rem);
}

.sp-vram-label {
  font-size: 0.75rem;
  color: var(--text-muted, #8b949e);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: var(--space-xs, 0.25rem);
}

.sp-vram-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--border-muted, #21262d);
}

.sp-vram-segment {
  height: 100%;
  transition: width 0.3s ease;
  min-width: 1px;
}

.sp-vram-headroom {
  height: 100%;
  background: var(--text-dim, #484f58);
  opacity: 0.2;
}

/* --- Disabled message --- */

.sp-disabled-msg {
  color: var(--text-muted, #8b949e);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
  font-size: 0.9rem;
}
`;
}
