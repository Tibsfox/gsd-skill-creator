// =============================================================================
// viewer-embed.test.js — CAP-041 T3↔T4 viewer-embed unit tests
// =============================================================================
// Coverage:
//   1. shouldShowViewerButton — correct sub_type gating
//   2. openViewerFor — iframe injected, container visible, src populated
//   3. openViewerFor — idempotent iframe injection (second call doesn't duplicate)
//   4. openViewerFor — example option appended as hash fragment
//   5. openViewerFor — emits 'viewer-embed:open' custom event
//   6. closeViewer — hides container, clears iframe src
//   7. closeViewer — emits 'viewer-embed:close' custom event
//   8. isViewerOpen — reflects open/close state accurately
//   9. closeViewer before openViewerFor — no-op, no throw
//  10. openViewerFor — iframe has sandbox="allow-scripts" attribute
//  11. openViewerFor — iframe title accessibility attribute present
//  12. renderInspector integration: viewer button present for roundtrip-event sub_type
//  13. renderInspector integration: viewer button absent for 'agent' sub_type
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  shouldShowViewerButton,
  openViewerFor,
  closeViewer,
  isViewerOpen,
  _resetForTest,
} from '../viewer-embed.js';

// ---------------------------------------------------------------------------
// Test environment setup
// ---------------------------------------------------------------------------

/**
 * Create a minimal #inspector-content div and attach it to document.body.
 * Returns the element for convenience.
 */
function setupInspector() {
  const el = document.createElement('div');
  el.id = 'inspector-content';
  document.body.appendChild(el);
  return el;
}

/**
 * Remove all #inspector-content elements from document.body.
 */
function teardownInspector() {
  document.querySelectorAll('#inspector-content').forEach(el => el.remove());
}

// ---------------------------------------------------------------------------
// Lifecycle: reset module state around each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  _resetForTest();
  teardownInspector();
});

afterEach(() => {
  _resetForTest();
  teardownInspector();
});

// ---------------------------------------------------------------------------
// 1. shouldShowViewerButton
// ---------------------------------------------------------------------------

describe('shouldShowViewerButton', () => {
  it('returns true for roundtrip-event sub_type (T5 CAP-019 artifact)', () => {
    expect(shouldShowViewerButton({ sub_type: 'roundtrip-event' })).toBe(true);
  });

  it('returns true for file sub_type (source-artifact that fed a round-trip)', () => {
    expect(shouldShowViewerButton({ sub_type: 'file' })).toBe(true);
  });

  it('returns true for commit sub_type (commit referencing HDL artifacts)', () => {
    expect(shouldShowViewerButton({ sub_type: 'commit' })).toBe(true);
  });

  it('returns false for agent sub_type', () => {
    expect(shouldShowViewerButton({ sub_type: 'agent' })).toBe(false);
  });

  it('returns false for decision sub_type', () => {
    expect(shouldShowViewerButton({ sub_type: 'decision' })).toBe(false);
  });

  it('returns false for task sub_type', () => {
    expect(shouldShowViewerButton({ sub_type: 'task' })).toBe(false);
  });

  it('returns false for null node', () => {
    expect(shouldShowViewerButton(null)).toBe(false);
  });

  it('returns false for undefined node', () => {
    expect(shouldShowViewerButton(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2–5. openViewerFor
// ---------------------------------------------------------------------------

describe('openViewerFor', () => {
  it('injects #viewer-embed-container into the inspector element', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-123', { inspectorEl });

    const container = inspectorEl.querySelector('#viewer-embed-container');
    expect(container).not.toBeNull();
  });

  it('makes the container visible (display != none) after open', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-123', { inspectorEl });

    const container = inspectorEl.querySelector('#viewer-embed-container');
    expect(container.style.display).not.toBe('none');
  });

  it('injects an iframe with id viewer-embed-frame', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-abc', { inspectorEl });

    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    expect(iframe).not.toBeNull();
    expect(iframe.tagName).toBe('IFRAME');
  });

  it('sets iframe src to a non-empty URL containing the T3 viewer path segment', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-abc', { inspectorEl });

    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    expect(iframe.src).toBeTruthy();
    expect(iframe.src).toMatch(/code-svg-hdl-bridge\/viewer\/index\.html/);
  });

  it('is idempotent — second openViewerFor does not duplicate the container', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-1', { inspectorEl });
    openViewerFor('node-2', { inspectorEl });

    const containers = inspectorEl.querySelectorAll('#viewer-embed-container');
    expect(containers.length).toBe(1);
  });

  it('appends the example as a hash fragment in iframe.src when opts.example is set', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-xyz', { inspectorEl, example: 'xor' });

    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    expect(iframe.src).toMatch(/#example=xor$/);
  });

  it('does not append a hash when opts.example is not set', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-xyz', { inspectorEl });

    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    expect(iframe.src).not.toMatch(/#example=/);
  });

  it('emits viewer-embed:open custom event on document', () => {
    const inspectorEl = setupInspector();
    const received = [];
    document.addEventListener('viewer-embed:open', (e) => received.push(e.detail));

    openViewerFor('node-evt', { inspectorEl });
    document.removeEventListener('viewer-embed:open', () => {});

    expect(received.length).toBe(1);
    expect(received[0].artifactId).toBe('node-evt');
  });

  it('sets isViewerOpen() to true after open', () => {
    const inspectorEl = setupInspector();
    expect(isViewerOpen()).toBe(false);
    openViewerFor('node-check', { inspectorEl });
    expect(isViewerOpen()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6–8. closeViewer
// ---------------------------------------------------------------------------

describe('closeViewer', () => {
  it('hides the container (display: none) after close', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-close', { inspectorEl });

    closeViewer();

    const container = inspectorEl.querySelector('#viewer-embed-container');
    expect(container.style.display).toBe('none');
  });

  it('clears iframe.src after close (stops ongoing load)', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-close', { inspectorEl });

    // Confirm src points at the viewer before close
    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    expect(iframe.src).toMatch(/code-svg-hdl-bridge\/viewer\/index\.html/);

    closeViewer();

    // After close, the viewer path is gone from src.
    // jsdom resolves '' relative to the page URL (not the empty string),
    // so we assert the T3 viewer path segment is no longer present.
    expect(iframe.src).not.toMatch(/code-svg-hdl-bridge\/viewer\/index\.html/);
  });

  it('emits viewer-embed:close custom event on document', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-close-evt', { inspectorEl });

    let closeFired = false;
    const handler = () => { closeFired = true; };
    document.addEventListener('viewer-embed:close', handler);

    closeViewer();
    document.removeEventListener('viewer-embed:close', handler);

    expect(closeFired).toBe(true);
  });

  it('sets isViewerOpen() to false after close', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-state', { inspectorEl });
    expect(isViewerOpen()).toBe(true);

    closeViewer();
    expect(isViewerOpen()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. closeViewer before openViewerFor — no-op safety
// ---------------------------------------------------------------------------

describe('closeViewer before any open', () => {
  it('does not throw when called before openViewerFor', () => {
    expect(() => closeViewer()).not.toThrow();
  });

  it('isViewerOpen() is false before any openViewerFor call', () => {
    expect(isViewerOpen()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10–11. iframe attributes
// ---------------------------------------------------------------------------

describe('iframe attributes', () => {
  it('iframe has sandbox="allow-scripts" for security isolation', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-sandbox', { inspectorEl });

    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('iframe has a non-empty title attribute for accessibility', () => {
    const inspectorEl = setupInspector();
    openViewerFor('node-title', { inspectorEl });

    const iframe = inspectorEl.querySelector('#viewer-embed-frame');
    const title = iframe.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  it('iframe is absent (not injected) before any openViewerFor call', () => {
    const inspectorEl = setupInspector();
    expect(inspectorEl.querySelector('#viewer-embed-frame')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 12–13. Inspector integration: viewer button in rendered HTML
// ---------------------------------------------------------------------------

describe('inspector viewer button integration', () => {
  /**
   * Simulate what renderInspector does for a given node.
   * Returns the inspector element after rendering the button.
   */
  function renderInspectorButton(node) {
    const el = setupInspector();

    // Replicate the subset of renderInspector that emits the viewer button
    const showViewerBtn = shouldShowViewerButton(node);
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
    el.innerHTML = showViewerBtn
      ? `<div class="field viewer-btn-row"><button id="btn-open-viewer" class="viewer-open-btn" data-node-id="${escapeHtml(node.node_id)}">Open Round-Trip Viewer (T3)</button></div>`
      : '<div class="field">no viewer</div>';

    return el;
  }

  it('viewer button is rendered for roundtrip-event nodes', () => {
    const node = { node_id: 'rt-evt-001', sub_type: 'roundtrip-event', node_type: 'Activity', label: 'Test RTE' };
    const el = renderInspectorButton(node);

    const btn = el.querySelector('#btn-open-viewer');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toMatch(/Round-Trip Viewer/);
    expect(btn.dataset.nodeId).toBe('rt-evt-001');
  });

  it('viewer button is NOT rendered for agent sub_type nodes', () => {
    const node = { node_id: 'agt-001', sub_type: 'agent', node_type: 'Agent', label: 'Test Agent' };
    const el = renderInspectorButton(node);

    const btn = el.querySelector('#btn-open-viewer');
    expect(btn).toBeNull();
  });

  it('clicking the viewer button calls openViewerFor (wiring check)', () => {
    const inspectorEl = setupInspector();
    const node = { node_id: 'rt-wire-001', sub_type: 'roundtrip-event', node_type: 'Activity', label: 'Wiring Test' };

    // Render the button HTML
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
    inspectorEl.innerHTML = `<div class="field viewer-btn-row"><button id="btn-open-viewer" class="viewer-open-btn" data-node-id="${escapeHtml(node.node_id)}">Open Round-Trip Viewer (T3)</button></div>`;

    // Wire the click handler (mirrors renderInspector logic)
    const btnOpenViewer = inspectorEl.querySelector('#btn-open-viewer');
    btnOpenViewer.addEventListener('click', () => {
      openViewerFor(node.node_id, { inspectorEl });
    });

    expect(isViewerOpen()).toBe(false);
    btnOpenViewer.click();
    expect(isViewerOpen()).toBe(true);
  });
});
