/**
 * Formatters — Wasteland CLI terminal rendering utilities
 *
 * Provides table rendering, status badges, and smart text fitting
 * for human-readable CLI output. Used by every wl command.
 *
 * Dependencies: picocolors only — no other imports.
 */

import pc from 'picocolors';

// ============================================================================
// Table Rendering
// ============================================================================

/**
 * Render a fixed-width table with headers, separator, and data rows.
 *
 * Column widths adapt to content — each column is as wide as its widest
 * value (header or data row). Cells are padded with spaces for alignment.
 *
 * @param headers - Column header labels
 * @param rows - Data rows, each an array of string values matching header count
 * @returns Multi-line string with blank lines for spacing
 *
 * @example
 * renderTable(['ID', 'Status'], [['w-001', 'open'], ['w-002', 'claimed']])
 */
export function renderTable(headers: string[], rows: string[][]): string {
  // Compute column widths: max of header length and all row values at that column
  const colWidths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map(row => (row[i] ?? '').length)),
  );

  // Header row: each cell padded to column width, joined with ' | '
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i]!)).join(' | ');

  // Separator: dashes filling each column, joined with '-+-'
  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');

  // Data rows: each cell padded to column width, joined with ' | '
  const dataRows = rows.map(row =>
    headers.map((_, i) => (row[i] ?? '').padEnd(colWidths[i]!)).join(' | '),
  );

  // Assemble with blank lines for visual spacing
  return ['', headerRow, separator, ...dataRows, ''].join('\n');
}

// ============================================================================
// Status Badges
// ============================================================================

/**
 * Render a color-coded status badge for wasteland task status values.
 *
 * Color palette (well-separated for fast visual tracking):
 * - open → green
 * - claimed → yellow
 * - submitted → blue
 * - validated → cyan
 * - completed → dim
 * - unknown → white (graceful fallback)
 *
 * @param status - Task status string
 * @returns Bracketed, color-coded badge string
 *
 * @example
 * renderBadge('open')      // '[open]' in green
 * renderBadge('submitted') // '[submitted]' in blue
 */
export function renderBadge(status: string): string {
  let colored: string;
  switch (status) {
    case 'open':
      colored = pc.green(status);
      break;
    case 'claimed':
      colored = pc.yellow(status);
      break;
    case 'submitted':
      colored = pc.blue(status);
      break;
    case 'validated':
      colored = pc.cyan(status);
      break;
    case 'completed':
      colored = pc.dim(status);
      break;
    default:
      colored = pc.white(status);
  }
  return `[${colored}]`;
}

// ============================================================================
// Smart Text Fitting
// ============================================================================

/**
 * Fit text within a maximum width, truncating with an ellipsis if needed.
 *
 * Returns the text unchanged when it fits. When it exceeds maxWidth, truncates
 * to maxWidth-1 characters and appends an ellipsis (…) so the total length
 * equals maxWidth. Empty strings are returned as-is.
 *
 * @param text - Input text to fit
 * @param maxWidth - Maximum allowed character width
 * @returns Text that fits within maxWidth characters
 *
 * @example
 * smartFit('short title', 80)         // 'short title' (unchanged)
 * smartFit('a very long description', 12) // 'a very lon…' (truncated)
 */
export function smartFit(text: string, maxWidth: number): string {
  if (text.length === 0) return '';
  if (text.length <= maxWidth) return text;
  return text.slice(0, maxWidth - 1) + '…';
}
