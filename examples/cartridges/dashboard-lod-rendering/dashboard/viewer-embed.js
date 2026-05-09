// =============================================================================
// viewer-embed.js — CAP-041 T3↔T4 viewer embed module
// =============================================================================
// Encapsulated module for embedding the T3 round-trip viewer (code-svg-hdl-bridge)
// inside the T4 dashboard inspector pane via a sandboxed iframe.
//
// Public API:
//   openViewerFor(artifactId, opts?)  — show iframe, point it at the T3 viewer
//   closeViewer()                     — hide the iframe, clear src
//   isViewerOpen()                    — returns true when iframe is visible
//
// Sibling-cartridge resolution (file:// and deployed www):
//   The T3 viewer lives at ../code-svg-hdl-bridge/viewer/index.html relative to
//   this file's directory. The same relative path works on tibsfox.com because
//   the cartridge directories are siblings under /Research/SCRIBE/:
//
//     file://  .../examples/cartridges/dashboard-lod-rendering/dashboard/index.html
//              ../code-svg-hdl-bridge/viewer/index.html  ← two levels up, then down
//
//     https://tibsfox.com/Research/SCRIBE/dashboard-lod-rendering/dashboard/index.html
//              ../code-svg-hdl-bridge/viewer/index.html  ← same relative path works
//
// iframe sandbox:
//   sandbox="allow-scripts"
//   No allow-same-origin: the T3 viewer is purely self-contained (transforms run
//   in-page, zero network calls in its default file:// mode). Scripts run; cross-origin
//   storage access is blocked. This is intentional — the viewer does not need DOM access
//   to the parent frame.
//
// Backward compat:
//   The dashboard works fine with no viewer interaction. The iframe container starts
//   hidden. Inspector content already rendered (text fields, neighbor lists) is
//   preserved; the viewer pane is appended below it and toggled independently.
//
// Sub-type matching:
//   Nodes with sub_type='roundtrip-event' (T5 CAP-019 artifacts) automatically
//   show the "Open Round-Trip Viewer" button in the inspector. Other nodes show it
//   only when explicitly supported. See shouldShowViewerButton().
// =============================================================================

/**
 * Relative path from this directory to the T3 viewer index.html.
 * Works identically for file:// and https:// contexts because the two cartridge
 * directories are always siblings.
 */
const T3_VIEWER_RELATIVE_PATH = '../../code-svg-hdl-bridge/viewer/index.html';

/**
 * Sub-types that always show the viewer button in the inspector pane.
 * The closed set from the T5 PROV-O schema; extendable by override.
 */
const VIEWER_SUB_TYPES = new Set([
  'roundtrip-event',
  'file',        // source-artifact nodes that fed a round-trip
  'commit',      // commit nodes that reference HDL artifacts
]);

// =============================================================================
// Module state
// =============================================================================

/** @type {HTMLElement|null} Container div injected into the inspector pane. */
let _container = null;

/** @type {HTMLIFrameElement|null} The sandboxed iframe. */
let _iframe = null;

/** @type {HTMLButtonElement|null} The close button. */
let _closeBtn = null;

/** @type {boolean} Whether the viewer pane is currently visible. */
let _open = false;

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Resolve the T3 viewer URL relative to this module's location.
 * Uses import.meta.url when available (ES-module browser context); falls back
 * to a document.currentScript heuristic for older contexts.
 *
 * @returns {string} Absolute URL or relative path suitable for iframe.src
 */
function resolveViewerUrl() {
  // ES-module context: use import.meta.url
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    const base = new URL(import.meta.url);
    // Walk up: .../dashboard/viewer-embed.js → .../dashboard/ → .../code-svg-hdl-bridge/viewer/index.html
    return new URL(T3_VIEWER_RELATIVE_PATH, base).href;
  }
  // Fallback: use the relative path as-is (works when the page is opened via a
  // static server and the iframe resolves relative to the parent page URL).
  return T3_VIEWER_RELATIVE_PATH;
}

/**
 * Lazily create and inject the iframe container into the inspector pane.
 * Idempotent — safe to call multiple times.
 *
 * @param {HTMLElement} inspectorEl — the #inspector-content div
 */
function ensureContainer(inspectorEl) {
  if (_container && _container.isConnected) return;

  _container = document.createElement('div');
  _container.id = 'viewer-embed-container';
  _container.style.cssText = [
    'display: none',
    'margin-top: 12px',
    'border-top: 1px solid var(--border, #30363d)',
    'padding-top: 10px',
  ].join('; ');

  // Header row: label + close button
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;';

  const label = document.createElement('div');
  label.style.cssText = 'font-size:10px; text-transform:uppercase; color:var(--text-dim,#9da7b3); letter-spacing:0.5px;';
  label.textContent = 'Round-Trip Viewer (T3)';

  _closeBtn = document.createElement('button');
  _closeBtn.textContent = '✕ Close';
  _closeBtn.style.cssText = [
    'background: transparent',
    'border: 1px solid var(--border, #30363d)',
    'color: var(--text-dim, #9da7b3)',
    'font-size: 10px',
    'padding: 2px 7px',
    'border-radius: 3px',
    'cursor: pointer',
  ].join('; ');
  _closeBtn.addEventListener('click', () => closeViewer());

  header.appendChild(label);
  header.appendChild(_closeBtn);

  // The sandboxed iframe
  _iframe = document.createElement('iframe');
  _iframe.id = 'viewer-embed-frame';
  _iframe.setAttribute('sandbox', 'allow-scripts');
  _iframe.setAttribute('title', 'T3 Round-Trip Viewer');
  _iframe.style.cssText = [
    'width: 100%',
    'height: 420px',
    'border: 1px solid var(--border, #30363d)',
    'border-radius: 4px',
    'background: #0e1116',
  ].join('; ');

  _container.appendChild(header);
  _container.appendChild(_iframe);

  // Append at the bottom of the inspector content area
  inspectorEl.appendChild(_container);
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Returns true if the viewer iframe should be offered for a given node.
 *
 * @param {{ sub_type: string, node_type?: string }} node
 * @returns {boolean}
 */
export function shouldShowViewerButton(node) {
  if (!node) return false;
  return VIEWER_SUB_TYPES.has(node.sub_type);
}

/**
 * Open the T3 viewer iframe in the inspector pane for the given artifact.
 *
 * @param {string} artifactId - The node_id of the artifact being inspected
 * @param {{ inspectorEl?: HTMLElement, example?: string }} [opts]
 *   - inspectorEl: the inspector content element to inject into (defaults to #inspector-content)
 *   - example: pre-select an example in the viewer ('add'|'xor'|'mux')
 */
export function openViewerFor(artifactId, opts = {}) {
  const inspectorEl = opts.inspectorEl ?? document.getElementById('inspector-content');
  if (!inspectorEl) {
    console.warn('[viewer-embed] #inspector-content not found; cannot embed viewer');
    return;
  }

  ensureContainer(inspectorEl);

  // Build the viewer URL; optionally pre-select an example via hash
  const viewerBase = resolveViewerUrl();
  const url = opts.example ? `${viewerBase}#example=${opts.example}` : viewerBase;

  // Only reload src when it changes (avoid flicker on re-select of same node)
  if (_iframe.src !== url) {
    _iframe.src = url;
  }

  _container.style.display = 'block';
  _open = true;

  // Emit a lightweight custom event for testability + future integrations
  document.dispatchEvent(new CustomEvent('viewer-embed:open', {
    detail: { artifactId, url },
  }));
}

/**
 * Close and hide the viewer iframe.
 * Clears iframe.src to stop any ongoing loading.
 */
export function closeViewer() {
  if (!_container) return;
  _container.style.display = 'none';
  if (_iframe) _iframe.src = '';
  _open = false;

  document.dispatchEvent(new CustomEvent('viewer-embed:close', {}));
}

/**
 * Returns true when the viewer iframe is currently visible.
 * @returns {boolean}
 */
export function isViewerOpen() {
  return _open;
}

/**
 * Reset module state (used by tests; not part of the public production API).
 * Detaches the container from the DOM and resets all module-level variables.
 */
export function _resetForTest() {
  if (_container && _container.parentNode) {
    _container.parentNode.removeChild(_container);
  }
  _container = null;
  _iframe = null;
  _closeBtn = null;
  _open = false;
}
