/**
 * Provenance chain tree viewer for the GSD Dashboard.
 *
 * Renders an HTML tree visualization of provenance chains showing
 * bidirectional relationships: "Cited by" (downstream GSD artifacts)
 * and "References" (upstream sources). Nodes are color-coded by
 * depth and artifact type.
 *
 * Pure render functions, no I/O. Follows dashboard panel pattern.
 *
 * @module citations/dashboard/provenance-viewer
 */

import type { CitedWork, ProvenanceEntry } from '../types/index.js';
import type { ProvenanceChain } from '../store/provenance-chain.js';

// ============================================================================
// Constants
// ============================================================================

const BG_PRIMARY = '#0d1117';
const BORDER = '#30363d';
const TEXT_PRIMARY = '#e6edf3';
const TEXT_MUTED = '#8b949e';
const ACCENT_BLUE = '#58a6ff';
const DEPTH_CYAN = '#56d4dd';
const DEPTH_DIM = '#6e7681';

/** Color for the root node (depth 0). */
const DEPTH_COLORS = [ACCENT_BLUE, DEPTH_CYAN, DEPTH_DIM];

/** Artifact type indicator colors. */
const ARTIFACT_COLORS: Record<string, string> = {
  skill: ACCENT_BLUE,
  document: '#3fb950',
  'teaching-reference': '#3fb950',
  'vision-document': '#3fb950',
  'research-reference': '#3fb950',
  documentation: '#3fb950',
  pack: '#d29922',
  'pack-module': '#d29922',
  'book-chapter': '#d29922',
};

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render a provenance chain as an HTML tree view.
 *
 * @param work - The root cited work.
 * @param chain - Provenance chain data from ProvenanceTracker.getChain().
 * @returns HTML string for the provenance tree.
 */
export function renderProvenanceViewer(
  work: CitedWork,
  chain: ProvenanceChain,
): string {
  const circularWarning = chain.circular
    ? `<div class="pv-warning">Circular reference detected in provenance chain</div>`
    : '';

  const rootNode = renderRootNode(work);

  const branches = chain.children.length > 0
    ? chain.children.map((child, i) => renderBranch(child, i, chain.children.length)).join('\n')
    : '<div class="pv-leaf">No provenance links</div>';

  return `<div class="provenance-viewer">
  <div class="pv-header">Provenance Chain</div>
  ${circularWarning}
  ${rootNode}
  <div class="pv-branches">
${branches}
  </div>
</div>`;
}

// ============================================================================
// Sub-renderers
// ============================================================================

function renderRootNode(work: CitedWork): string {
  const authors = formatAuthors(work);
  return `<div class="pv-node pv-root" style="border-left-color:${ACCENT_BLUE}">
    <span class="pv-indicator" style="color:${ACCENT_BLUE}">\u25CF</span>
    <span class="pv-node-title">${escapeHtml(work.title)}</span>
    <span class="pv-node-meta">${escapeHtml(authors)} (${work.year})</span>
  </div>`;
}

function renderBranch(
  child: { entry: ProvenanceEntry; citationIds: string[] },
  index: number,
  totalBranches: number,
): string {
  const isLast = index === totalBranches - 1;
  const connector = isLast ? '\u2514' : '\u251C';
  const artifactColor = getArtifactColor(child.entry.artifact_type);
  const depthColor = DEPTH_COLORS[Math.min(1, DEPTH_COLORS.length - 1)];

  const citationBadges = child.citationIds.length > 0
    ? child.citationIds.map(id =>
        `<span class="pv-citation-id">${escapeHtml(id.slice(0, 12))}...</span>`
      ).join(' ')
    : '';

  const contextLine = child.entry.context
    ? `<div class="pv-context">${escapeHtml(child.entry.context)}</div>`
    : '';

  return `    <div class="pv-branch" data-artifact-type="${child.entry.artifact_type}">
      <span class="pv-connector" style="color:${DEPTH_DIM}">${connector}\u2500</span>
      <span class="pv-artifact-indicator" style="color:${artifactColor}">\u25A0</span>
      <span class="pv-artifact-name" style="color:${depthColor}">${escapeHtml(child.entry.artifact_name)}</span>
      <span class="pv-artifact-type">${child.entry.artifact_type}</span>
      <span class="pv-artifact-path">${escapeHtml(child.entry.artifact_path)}</span>
      ${citationBadges}
      ${contextLine}
    </div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the provenance viewer component.
 *
 * @returns CSS string.
 */
export function renderProvenanceViewerStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Provenance Viewer
   ----------------------------------------------------------------------- */

.provenance-viewer {
  background: ${BG_PRIMARY};
  border: 1px solid ${BORDER};
  border-radius: 8px;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: ${TEXT_PRIMARY};
}

.pv-header {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${TEXT_MUTED};
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
}

.pv-warning {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid #f8514980;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: #f85149;
  margin-bottom: 0.75rem;
}

.pv-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-left: 3px solid ${ACCENT_BLUE};
  margin-bottom: 4px;
}

.pv-indicator {
  flex-shrink: 0;
  font-size: 0.9rem;
}

.pv-node-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.pv-node-meta {
  font-size: 0.8rem;
  color: ${TEXT_MUTED};
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.pv-branches {
  margin-left: 1rem;
  padding-left: 0.5rem;
}

.pv-branch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 0.85rem;
}

.pv-connector {
  flex-shrink: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
}

.pv-artifact-indicator {
  flex-shrink: 0;
  font-size: 0.75rem;
}

.pv-artifact-name {
  font-weight: 500;
}

.pv-artifact-type {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: ${TEXT_MUTED};
  padding: 1px 6px;
  background: rgba(110, 118, 129, 0.15);
  border-radius: 3px;
}

.pv-artifact-path {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: ${TEXT_MUTED};
}

.pv-citation-id {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.7rem;
  color: ${ACCENT_BLUE};
  background: rgba(88, 166, 255, 0.1);
  padding: 1px 5px;
  border-radius: 3px;
}

.pv-context {
  width: 100%;
  font-size: 0.75rem;
  color: ${TEXT_MUTED};
  font-style: italic;
  margin-left: 2.5rem;
}

.pv-leaf {
  padding: 8px 0;
  color: ${TEXT_MUTED};
  font-size: 0.85rem;
  font-style: italic;
}
`;
}

// ============================================================================
// Helpers
// ============================================================================

function getArtifactColor(artifactType: string): string {
  return ARTIFACT_COLORS[artifactType] ?? TEXT_MUTED;
}

function formatAuthors(work: CitedWork): string {
  if (work.authors.length === 0) return 'Unknown';
  if (work.authors.length === 1) {
    const a = work.authors[0];
    return a.given ? `${a.family}, ${a.given}` : a.family;
  }
  return `${work.authors[0].family} et al.`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
