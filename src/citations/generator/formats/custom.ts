/**
 * Custom template bibliography format renderer.
 *
 * Renders bibliography entries using Mustache-style templates with
 * variables like {{author}}, {{year}}, {{title}}, etc.
 *
 * - Missing fields render as empty string (no error)
 * - HTML characters in values are escaped
 * - Author renders as "Last, First and Last, First"
 */

import type { CitedWork } from '../../types/index.js';
import type { FormatOptions } from '../../types/index.js';

// ============================================================================
// HTML escaping
// ============================================================================

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape HTML special characters in a string. */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch] ?? ch);
}

// ============================================================================
// Template rendering
// ============================================================================

/** Format author list as "Last, First and Last, First". */
function formatAuthors(work: CitedWork): string {
  return work.authors
    .map(a => a.given ? `${a.family}, ${a.given}` : a.family)
    .join(' and ');
}

/** Build the template variable map for a CitedWork. */
function buildVariables(work: CitedWork): Record<string, string> {
  return {
    author: formatAuthors(work),
    year: String(work.year),
    title: work.title,
    journal: work.journal ?? '',
    doi: work.doi ?? '',
    url: work.url ?? '',
    publisher: work.publisher ?? '',
    type: work.type,
    isbn: work.isbn ?? '',
    volume: work.volume ?? '',
    issue: work.issue ?? '',
    pages: work.pages ?? '',
  };
}

/**
 * Render a single CitedWork using a Mustache-style template.
 *
 * Supported variables: {{author}}, {{year}}, {{title}}, {{journal}},
 * {{doi}}, {{url}}, {{publisher}}, {{type}}, {{isbn}}, {{volume}},
 * {{issue}}, {{pages}}.
 *
 * Missing fields become empty string. Values are HTML-escaped.
 */
export function formatWithTemplate(work: CitedWork, template: string): string {
  const vars = buildVariables(work);

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === '') return '';
    return escapeHtml(value);
  });
}

/**
 * Format a complete bibliography using a custom template.
 * Requires options.customTemplate to be set.
 */
export function formatBibliography(works: CitedWork[], options: FormatOptions): string {
  if (works.length === 0) return '';

  const template = options.customTemplate ?? '{{author}} ({{year}}). {{title}}.';

  return works
    .map(work => formatWithTemplate(work, template))
    .join('\n\n');
}
