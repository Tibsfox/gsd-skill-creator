/**
 * MLA 9th Edition bibliography format renderer.
 *
 * Implements the containers model with:
 * - Book: Author. *Title*. Publisher, Year.
 * - Article: Author. "Title." *Container*, vol. Volume, no. Issue, Year, pp. Pages.
 * - First author last-first, subsequent first-last
 * - Hanging indent, Works Cited heading
 */

import type { CitedWork, Author } from '../../types/index.js';
import type { FormatOptions } from '../../types/index.js';

// ============================================================================
// Author formatting
// ============================================================================

/**
 * Format a single author name for MLA.
 * First author: "Family, Given"
 * Subsequent: "Given Family"
 */
function formatAuthorName(author: Author, isFirst: boolean): string {
  if (!author.given) return author.family;
  if (isFirst) {
    return `${author.family}, ${author.given}`;
  }
  return `${author.given} ${author.family}`;
}

/**
 * Format author list for MLA 9th edition.
 * - 1 author: "Family, Given."
 * - 2 authors: "Family, Given, and Given Family."
 * - 3+: "Family, Given, et al."
 */
function formatAuthors(authors: Author[]): string {
  if (authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorName(authors[0], true);
  }

  if (authors.length === 2) {
    return `${formatAuthorName(authors[0], true)}, and ${formatAuthorName(authors[1], false)}`;
  }

  // 3+ authors: first author, et al.
  return `${formatAuthorName(authors[0], true)}, et al.`;
}

// ============================================================================
// Entry formatting
// ============================================================================

/**
 * Format a single CitedWork as an MLA 9th edition entry.
 */
export function formatEntry(work: CitedWork): string {
  const parts: string[] = [];
  const authorStr = formatAuthors(work.authors);

  parts.push(`${authorStr}.`);

  if (work.type === 'article') {
    // Article: Author. "Title." *Container*, vol. Volume, no. Issue, Year, pp. Pages.
    parts.push(`"${work.title}."`);

    if (work.journal) {
      const containerParts: string[] = [`*${work.journal}*`];

      if (work.volume) {
        containerParts.push(`vol. ${work.volume}`);
      }
      if (work.issue) {
        containerParts.push(`no. ${work.issue}`);
      }
      containerParts.push(String(work.year));
      if (work.pages) {
        containerParts.push(`pp. ${work.pages}`);
      }

      parts.push(containerParts.join(', ') + '.');
    }
  } else {
    // Book/Other: Author. *Title*. Publisher, Year.
    parts.push(`*${work.title}*.`);

    if (work.publisher) {
      parts.push(`${work.publisher}, ${work.year}.`);
    }
  }

  // DOI or URL
  if (work.doi) {
    parts.push(`https://doi.org/${work.doi}`);
  } else if (work.url) {
    parts.push(work.url);
  }

  return parts.join(' ');
}

/**
 * Format a complete MLA 9th edition Works Cited list.
 */
export function formatBibliography(works: CitedWork[], _options: FormatOptions): string {
  if (works.length === 0) return '';

  const entries = works.map(work => formatEntry(work)).join('\n\n');
  return `Works Cited\n\n${entries}`;
}
