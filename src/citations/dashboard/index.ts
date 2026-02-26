/**
 * Citation dashboard barrel export.
 *
 * Re-exports the citation panel, provenance viewer, and integrity
 * badge components along with their style renderers.
 */

export {
  renderCitationPanel,
  renderCitationPanelStyles,
  type PanelOptions,
} from './citation-panel.js';

export {
  renderProvenanceViewer,
  renderProvenanceViewerStyles,
} from './provenance-viewer.js';

export {
  renderIntegrityBadge,
  renderPackBadge,
  renderIntegrityBadgeStyles,
  type AuditResult,
} from './integrity-badges.js';
