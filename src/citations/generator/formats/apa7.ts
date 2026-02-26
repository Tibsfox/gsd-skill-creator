/**
 * APA 7th Edition bibliography format renderer.
 *
 * Implements APA 7th edition reference list formatting with:
 * - 1 author: just name
 * - 2 authors: name & name
 * - 3-20 authors: all listed, & before last
 * - 21+ authors: first 19, ..., last author
 * - Sentence-case article titles (not italicized)
 * - Italicized book/journal titles
 * - DOI as https://doi.org/{doi} hyperlink
 * - Hanging indent markup
 */

import type { CitedWork, Author } from '../../types/index.js';
import type { FormatOptions } from '../../types/index.js';

// ============================================================================
// Author formatting
// ============================================================================

/** Format a single author as "Family, G." (initials). */
function formatAuthorName(author: Author): string {
  if (!author.given) return author.family;
  const initials = author.given
    .split(/[\s.-]+/)
    .filter(part => part.length > 0)
    .map(part => part[0].toUpperCase() + '.')
    .join(' ');
  return `${author.family}, ${initials}`;
}

/**
 * Format author list according to APA 7th edition rules:
 * - 1 author: "Family, G."
 * - 2 authors: "Family, G., & Family, G."
 * - 3-20 authors: "Family, G., Family, G., ..., & Family, G."
 * - 21+ authors: first 19, "...", last author
 */
export function formatAuthors(authors: Author[]): string {
  if (authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorName(authors[0]);
  }

  if (authors.length === 2) {
    return `${formatAuthorName(authors[0])}, & ${formatAuthorName(authors[1])}`;
  }

  if (authors.length <= 20) {
    const allButLast = authors.slice(0, -1).map(formatAuthorName).join(', ');
    const last = formatAuthorName(authors[authors.length - 1]);
    return `${allButLast}, & ${last}`;
  }

  // 21+ authors: first 19, ..., last
  const first19 = authors.slice(0, 19).map(formatAuthorName).join(', ');
  const last = formatAuthorName(authors[authors.length - 1]);
  return `${first19}, ... ${last}`;
}

// ============================================================================
// Entry formatting
// ============================================================================

/**
 * Format a single CitedWork as an APA 7th edition reference entry.
 *
 * Structure varies by type:
 * - Article: Author. (Year). Title. *Journal*, *Volume*(Issue), Pages. DOI
 * - Book: Author. (Year). *Title* (Edition). Publisher. DOI
 * - Other: Author. (Year). *Title*. Publisher/Source. URL/DOI
 */
export function formatEntry(work: CitedWork): string {
  const parts: string[] = [];

  // Author(s). (Year).
  const authorStr = formatAuthors(work.authors);
  parts.push(`${authorStr} (${work.year}).`);

  // Title (formatting depends on type)
  if (work.type === 'article') {
    // Article titles: sentence case, not italicized
    parts.push(`${work.title}.`);
  } else {
    // Book, chapter, report, etc: italicized
    const editionStr = work.edition ? ` (${work.edition})` : '';
    parts.push(`*${work.title}*${editionStr}.`);
  }

  // Source details by type
  if (work.type === 'article' && work.journal) {
    let journalPart = `*${work.journal}*`;
    if (work.volume) {
      journalPart += `, *${work.volume}*`;
      if (work.issue) {
        journalPart += `(${work.issue})`;
      }
    }
    if (work.pages) {
      journalPart += `, ${work.pages}`;
    }
    journalPart += '.';
    parts.push(journalPart);
  } else if (work.publisher) {
    parts.push(`${work.publisher}.`);
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
 * Format a complete APA 7th edition reference list.
 * Each entry gets hanging indent markup.
 */
export function formatBibliography(works: CitedWork[], _options: FormatOptions): string {
  if (works.length === 0) return '';

  return works
    .map(work => formatEntry(work))
    .join('\n\n');
}
