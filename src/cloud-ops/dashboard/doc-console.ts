/**
 * Documentation console panel renderer.
 *
 * Displays a two-column layout: navigation sidebar grouped by document
 * type (Systems Administrator's Guide chapters, Operations Manual
 * procedures, Runbook Library runbooks) and a content area showing the
 * active document body with cross-reference links.
 *
 * Follows progressive enhancement: null = no panel, false = disabled
 * message, true = full console. Pure render functions, no I/O.
 *
 * Cross-reference links use data-target attributes; GSD-OS handles
 * navigation events via data attributes.
 *
 * Satisfies INTEG-02.
 *
 * @module cloud-ops/dashboard/doc-console
 */

import type { DocEntry, DocContent, DocConsoleData } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Human-readable group labels for each doc type. */
const DOC_TYPE_GROUPS: Record<'chapter' | 'procedure' | 'runbook', string> = {
  chapter:   "Systems Administrator's Guide",
  procedure: 'Operations Manual',
  runbook:   'Runbook Library',
};

/** Ordered rendering sequence for navigation groups. */
const GROUP_ORDER: Array<'chapter' | 'procedure' | 'runbook'> = [
  'chapter',
  'procedure',
  'runbook',
];

// ============================================================================
// Navigation
// ============================================================================

/**
 * Render the documentation navigation sidebar grouped by type.
 *
 * Groups: "Systems Administrator's Guide" (chapters),
 * "Operations Manual" (procedures), "Runbook Library" (runbooks).
 * Active entry is highlighted with the `dc-nav-active` class.
 * Each entry shows its title and an optional SE phase reference badge.
 *
 * @param entries - All navigation entries.
 * @param activeId - ID of the currently active entry (if any).
 * @returns HTML string for the navigation sidebar.
 */
export function renderDocNavigation(entries: DocEntry[], activeId?: string): string {
  if (entries.length === 0) {
    return `<nav class="dc-nav">
  <div class="dc-nav-empty">No documents available</div>
</nav>`;
  }

  // Group entries by type
  const grouped: Record<'chapter' | 'procedure' | 'runbook', DocEntry[]> = {
    chapter:   [],
    procedure: [],
    runbook:   [],
  };
  for (const entry of entries) {
    grouped[entry.type].push(entry);
  }

  // Render each group (only if it has entries)
  const groupsHtml = GROUP_ORDER
    .filter((type) => grouped[type].length > 0)
    .map((type) => {
      const label = DOC_TYPE_GROUPS[type];
      const itemsHtml = grouped[type]
        .map((entry) => {
          const isActive = entry.id === activeId;
          const activeClass = isActive ? ' dc-nav-active' : '';
          const phaseBadge = entry.sePhaseRef
            ? ` <span class="dc-nav-phase-badge">${escapeHtml(entry.sePhaseRef)}</span>`
            : '';
          return `<li class="dc-nav-item${activeClass}" data-doc-id="${escapeAttr(entry.id)}">
        <a class="dc-nav-link" href="#" data-target="${escapeAttr(entry.id)}">${escapeHtml(entry.title)}${phaseBadge}</a>
      </li>`;
        })
        .join('\n      ');

      return `<div class="dc-nav-group" data-group-type="${type}">
    <div class="dc-nav-group-label">${escapeHtml(label)}</div>
    <ul class="dc-nav-list">
      ${itemsHtml}
    </ul>
  </div>`;
    })
    .join('\n  ');

  return `<nav class="dc-nav">
  ${groupsHtml}
</nav>`;
}

// ============================================================================
// Document Content
// ============================================================================

/**
 * Render the active document content area.
 *
 * Wraps the document body in a `dc-content` container and renders a
 * "See Also" cross-reference section at the bottom. Cross-reference links
 * use `data-target` attributes for GSD-OS navigation.
 *
 * If content is undefined, renders a placeholder prompting the user to
 * select a document.
 *
 * @param content - The active document content, or undefined for placeholder.
 * @returns HTML string for the content area.
 */
export function renderDocContent(content: DocContent | undefined): string {
  if (!content) {
    return `<div class="dc-content">
  <div class="dc-content-placeholder">Select a document from the navigation</div>
</div>`;
  }

  // Cross-reference section (only if there are cross-refs)
  const crossRefsHtml = content.crossRefs.length > 0
    ? `<div class="dc-xref-section">
    <div class="dc-xref-label">See Also</div>
    <ul class="dc-xref-list">
      ${content.crossRefs
          .map(
            (ref) =>
              `<li class="dc-xref-item"><a class="dc-xref" data-target="${escapeAttr(ref.targetId)}" href="#">${escapeHtml(ref.label)}</a></li>`,
          )
          .join('\n      ')}
    </ul>
  </div>`
    : '';

  return `<div class="dc-content" data-doc-id="${escapeAttr(content.entry.id)}">
  <div class="dc-content-header">
    <h4 class="dc-content-title">${escapeHtml(content.entry.title)}</h4>
    ${content.entry.sePhaseRef ? `<span class="dc-content-phase-badge">${escapeHtml(content.entry.sePhaseRef)}</span>` : ''}
  </div>
  <div class="dc-content-body">${content.body}</div>
  ${crossRefsHtml}
</div>`;
}

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the documentation console panel.
 *
 * Progressive enhancement:
 * - `enabled === null`: return empty string (no panel)
 * - `enabled === false`: return disabled message panel
 * - `enabled === true`: return full two-column console (nav 25%, content 75%)
 *
 * @param data - Documentation console data.
 * @returns HTML string for the documentation console, or empty string if no config.
 */
export function renderDocConsole(data: DocConsoleData): string {
  // No config -- no panel at all
  if (data.enabled === null) {
    return '';
  }

  // Disabled -- informational message only
  if (data.enabled === false) {
    return `<div class="dc-console">
  <h3 class="dc-title">Documentation</h3>
  <div class="dc-disabled-msg">Documentation console is not configured. Add documentation sources to enable browsing.</div>
</div>`;
  }

  // Enabled -- full two-column console
  const activeId = data.activeContent?.entry.id;
  const navHtml = renderDocNavigation(data.entries, activeId);
  const contentHtml = renderDocContent(data.activeContent);

  return `<div class="dc-console" data-panel-type="doc-console">
  <h3 class="dc-title">Documentation</h3>
  <div class="dc-layout">
    <div class="dc-nav-column">
      ${navHtml}
    </div>
    <div class="dc-content-column">
      ${contentHtml}
    </div>
  </div>
</div>`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Escape HTML entities for safe embedding in text content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape values for use in HTML attributes. */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
