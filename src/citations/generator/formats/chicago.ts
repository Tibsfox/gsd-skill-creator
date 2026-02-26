/**
 * Chicago Manual of Style 17th Edition bibliography format renderer.
 *
 * Implements the notes-bibliography style with:
 * - Book: Author. *Title*. Place: Publisher, Year.
 * - Article: Author. "Article Title." *Journal* Volume, no. Issue (Year): Pages.
 * - Period-separated fields
 * - Titles in quotes for articles, italics for books/journals
 */

import type { CitedWork, Author } from '../../types/index.js';
import type { FormatOptions } from '../../types/index.js';

// ============================================================================
// Author formatting
// ============================================================================

/**
 * Format author for Chicago style.
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
 * Format author list for Chicago notes-bibliography style.
 * - 1 author: "Family, Given."
 * - 2-3 authors: "Family, Given, Given Family, and Given Family."
 * - 4+: "Family, Given, et al."
 */
function formatAuthors(authors: Author[]): string {
  if (authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorName(authors[0], true);
  }

  if (authors.length <= 3) {
    const parts = authors.map((a, i) => formatAuthorName(a, i === 0));
    const allButLast = parts.slice(0, -1).join(', ');
    return `${allButLast}, and ${parts[parts.length - 1]}`;
  }

  // 4+ authors: first author et al.
  return `${formatAuthorName(authors[0], true)}, et al.`;
}

// ============================================================================
// Entry formatting
// ============================================================================

/**
 * Format a single CitedWork as a Chicago 17th edition bibliography entry.
 */
export function formatEntry(work: CitedWork): string {
  const parts: string[] = [];
  const authorStr = formatAuthors(work.authors);

  if (work.type === 'article') {
    // Article: Author. "Title." *Journal* Volume, no. Issue (Year): Pages.
    parts.push(`${authorStr}.`);
    parts.push(`"${work.title}."`);

    if (work.journal) {
      let journalPart = `*${work.journal}*`;
      if (work.volume) {
        journalPart += ` ${work.volume}`;
        if (work.issue) {
          journalPart += `, no. ${work.issue}`;
        }
      }
      journalPart += ` (${work.year})`;
      if (work.pages) {
        journalPart += `: ${work.pages}`;
      }
      journalPart += '.';
      parts.push(journalPart);
    }
  } else {
    // Book/Other: Author. *Title*. Place: Publisher, Year.
    parts.push(`${authorStr}.`);

    const editionStr = work.edition ? `, ${work.edition}` : '';
    parts.push(`*${work.title}*${editionStr}.`);

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
 * Format a complete Chicago 17th edition bibliography.
 */
export function formatBibliography(works: CitedWork[], _options: FormatOptions): string {
  if (works.length === 0) return '';

  return works
    .map(work => formatEntry(work))
    .join('\n\n');
}
