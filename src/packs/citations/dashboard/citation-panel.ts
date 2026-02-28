/**
 * Citation browser panel for the GSD Dashboard.
 *
 * Renders an HTML table of tracked citations with summary bar,
 * filter controls, sortable columns, and row-level detail expansion.
 * Pure render functions, no I/O. Follows dashboard panel pattern.
 *
 * @module citations/dashboard/citation-panel
 */

import type { CitedWork } from '../types/index.js';

// ============================================================================
// Types
// ============================================================================

/** Options controlling the citation panel rendering. */
export interface PanelOptions {
  /** Sort column (default: 'year'). */
  sortBy?: 'author' | 'year' | 'title' | 'type' | 'confidence';
  /** Sort direction (default: 'desc'). */
  sortDir?: 'asc' | 'desc';
  /** Filter by type. */
  filterType?: string;
  /** Filter by tag/domain. */
  filterTag?: string;
  /** Only show verified works. */
  verifiedOnly?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const BG_PRIMARY = '#0d1117';
const BG_ROW_ALT = '#161b22';
const BORDER = '#30363d';
const TEXT_PRIMARY = '#e6edf3';
const TEXT_MUTED = '#8b949e';
const ACCENT_BLUE = '#58a6ff';
const SUCCESS_GREEN = '#3fb950';
const WARNING_YELLOW = '#d29922';
const ERROR_RED = '#f85149';

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the citation panel as an HTML table with summary bar and filters.
 *
 * @param works - Array of CitedWork records to display.
 * @param options - Sort and filter options.
 * @returns HTML string for the citation panel.
 */
export function renderCitationPanel(works: CitedWork[], options: PanelOptions = {}): string {
  if (works.length === 0) {
    return `<div class="citation-panel">
  <div class="cp-empty">No citations tracked</div>
</div>`;
  }

  // Apply filters
  let filtered = [...works];
  if (options.filterType) {
    filtered = filtered.filter(w => w.type === options.filterType);
  }
  if (options.filterTag) {
    const tag = options.filterTag.toLowerCase();
    filtered = filtered.filter(w => w.tags.some(t => t.toLowerCase() === tag));
  }
  if (options.verifiedOnly) {
    filtered = filtered.filter(w => w.verified);
  }

  // Apply sort
  const sortBy = options.sortBy ?? 'year';
  const sortDir = options.sortDir ?? 'desc';
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'author':
        cmp = (a.authors[0]?.family ?? '').localeCompare(b.authors[0]?.family ?? '');
        break;
      case 'year':
        cmp = a.year - b.year;
        break;
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'type':
        cmp = a.type.localeCompare(b.type);
        break;
      case 'confidence':
        cmp = a.confidence - b.confidence;
        break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // Compute summary stats
  const resolved = filtered.filter(w => w.confidence >= 0.7).length;
  const unresolved = filtered.length - resolved;
  const domains = new Set(filtered.flatMap(w => w.tags)).size;

  const summaryBar = renderSummaryBar(filtered.length, resolved, unresolved, domains);
  const filterControls = renderFilterControls(works);
  const tableRows = filtered.map((w, i) => renderRow(w, i)).join('\n');

  return `<div class="citation-panel">
  ${summaryBar}
  ${filterControls}
  <table class="cp-table">
    <thead>
      <tr>
        <th class="cp-th">Author</th>
        <th class="cp-th">Year</th>
        <th class="cp-th">Title</th>
        <th class="cp-th">Type</th>
        <th class="cp-th">Confidence</th>
        <th class="cp-th">Cited By</th>
      </tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>
</div>`;
}

// ============================================================================
// Sub-renderers
// ============================================================================

function renderSummaryBar(total: number, resolved: number, unresolved: number, domains: number): string {
  return `<div class="cp-summary">
    <span class="cp-stat"><strong>${total}</strong> works</span>
    <span class="cp-stat" style="color:${SUCCESS_GREEN}"><strong>${resolved}</strong> resolved</span>
    <span class="cp-stat" style="color:${WARNING_YELLOW}"><strong>${unresolved}</strong> unresolved</span>
    <span class="cp-stat" style="color:${ACCENT_BLUE}"><strong>${domains}</strong> domains</span>
  </div>`;
}

function renderFilterControls(works: CitedWork[]): string {
  const types = [...new Set(works.map(w => w.type))].sort();
  const tags = [...new Set(works.flatMap(w => w.tags))].sort();

  const typeOptions = types.map(t => `<option value="${t}">${t}</option>`).join('');
  const tagOptions = tags.map(t => `<option value="${t}">${t}</option>`).join('');

  return `<div class="cp-filters">
    <select class="cp-filter" data-filter="type"><option value="">All types</option>${typeOptions}</select>
    <select class="cp-filter" data-filter="tag"><option value="">All domains</option>${tagOptions}</select>
    <label class="cp-filter-label"><input type="checkbox" data-filter="verified" /> Verified only</label>
  </div>`;
}

function renderRow(work: CitedWork, index: number): string {
  const bg = index % 2 === 0 ? BG_PRIMARY : BG_ROW_ALT;
  const authors = formatAuthors(work);
  const confPercent = (work.confidence * 100).toFixed(0);
  const confColor = work.confidence >= 0.9 ? SUCCESS_GREEN
    : work.confidence >= 0.7 ? WARNING_YELLOW
    : ERROR_RED;
  const citedByCount = work.cited_by.length;

  return `      <tr class="cp-row" style="background:${bg}" data-id="${work.id}">
        <td class="cp-td cp-author">${escapeHtml(authors)}</td>
        <td class="cp-td cp-year">${work.year}</td>
        <td class="cp-td cp-title">${escapeHtml(work.title)}</td>
        <td class="cp-td cp-type">${work.type}</td>
        <td class="cp-td cp-confidence" style="color:${confColor}">${confPercent}%</td>
        <td class="cp-td cp-cited-by">${citedByCount}</td>
      </tr>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the citation panel component.
 *
 * @returns CSS string.
 */
export function renderCitationPanelStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Citation Panel
   ----------------------------------------------------------------------- */

.citation-panel {
  background: ${BG_PRIMARY};
  border: 1px solid ${BORDER};
  border-radius: 8px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: ${TEXT_PRIMARY};
}

.cp-empty {
  padding: 2rem;
  text-align: center;
  color: ${TEXT_MUTED};
  font-style: italic;
}

.cp-summary {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${BORDER};
  font-size: 0.85rem;
}

.cp-stat strong {
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.cp-filters {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${BORDER};
  align-items: center;
}

.cp-filter {
  background: ${BG_ROW_ALT};
  color: ${TEXT_PRIMARY};
  border: 1px solid ${BORDER};
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
}

.cp-filter-label {
  font-size: 0.8rem;
  color: ${TEXT_MUTED};
  display: flex;
  align-items: center;
  gap: 4px;
}

.cp-table {
  width: 100%;
  border-collapse: collapse;
}

.cp-th {
  text-align: left;
  padding: 8px 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: ${TEXT_MUTED};
  border-bottom: 1px solid ${BORDER};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.cp-td {
  padding: 8px 12px;
  font-size: 0.85rem;
  border-bottom: 1px solid ${BORDER};
}

.cp-author, .cp-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cp-year, .cp-confidence, .cp-cited-by {
  font-family: 'SF Mono', 'Fira Code', monospace;
  text-align: right;
}

.cp-type {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: ${TEXT_MUTED};
}

.cp-row:hover {
  background: #21262d !important;
  cursor: pointer;
}
`;
}

// ============================================================================
// Helpers
// ============================================================================

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
