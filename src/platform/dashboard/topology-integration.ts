/**
 * Topology integration wiring for the GSD Dashboard generator pipeline.
 *
 * Bridges the topology data pipeline with the renderer and provides
 * client-side click-to-detail interactivity. The dashboard generator
 * calls {@link buildTopologyHtml} to get complete HTML ready for
 * injection into the index page.
 *
 * @module dashboard/topology-integration
 */

import { renderTopologyPanel } from './topology-renderer.js';
import { buildTopologyData } from './topology-data.js';
import type { TopologySource } from './topology-data.js';

// ============================================================================
// Public API
// ============================================================================

/**
 * Build complete topology panel HTML from source data.
 *
 * Delegates to the data pipeline and renderer, appending the
 * click-to-detail interaction script.
 *
 * @param source - Raw project entity data (agents, skills, teams).
 * @returns HTML string for the topology panel with interactivity.
 */
export function buildTopologyHtml(source: TopologySource): string {
  const data = buildTopologyData(source);
  const panelHtml = renderTopologyPanel(data);
  const scriptHtml = renderTopologyClickScript();
  return panelHtml + '\n' + scriptHtml;
}

/**
 * Render the client-side click-to-detail interaction script.
 *
 * Produces a `<script>` tag with vanilla JS (no frameworks, per REQ-TC-01)
 * that adds event delegation on the topology panel for node click events.
 * Clicking a node opens a detail side panel showing label, type, domain,
 * and active status. Clicking outside or the close button dismisses it.
 *
 * @returns HTML script tag string.
 */
export function renderTopologyClickScript(): string {
  return `<script>
(function() {
  var panel = document.querySelector('.topology-panel');
  if (!panel) return;

  panel.addEventListener('click', function(e) {
    var target = e.target.closest('[data-node-id]');
    if (!target) {
      var existing = panel.querySelector('.tp-detail-panel');
      if (existing) existing.remove();
      return;
    }

    var nodeId = target.getAttribute('data-node-id');
    var domain = target.getAttribute('data-domain') || '';
    var textEl = target.querySelector('text');
    var label = textEl ? textEl.textContent : nodeId;
    var nodeType = target.classList.toString().match(/tp-node-(\\w+)/);
    var type = nodeType ? nodeType[1] : 'unknown';
    var isActive = target.classList.contains('tp-active');

    var old = panel.querySelector('.tp-detail-panel');
    if (old) old.remove();

    var detail = document.createElement('div');
    detail.className = 'tp-detail-panel';
    detail.innerHTML = '<div class="tp-detail-header">' +
      '<span class="tp-detail-title">' + label + '</span>' +
      '<button class="tp-detail-close">&times;</button></div>' +
      '<div class="tp-detail-field"><span class="tp-detail-label">Type</span>' +
      '<span class="tp-detail-value">' + type + '</span></div>' +
      '<div class="tp-detail-field"><span class="tp-detail-label">Domain</span>' +
      '<span class="tp-detail-value">' + domain + '</span></div>' +
      '<div class="tp-detail-field"><span class="tp-detail-label">Status</span>' +
      '<span class="tp-detail-value">' + (isActive ? 'Active' : 'Dormant') + '</span></div>';

    panel.appendChild(detail);

    detail.querySelector('.tp-detail-close').addEventListener('click', function() {
      detail.remove();
    });
  });
})();
</script>`;
}
