import type { CitationDatabase, CitationEntry } from './types.js';

/** A citation resolved from the markdown source. */
export interface ResolvedCitation {
  key: string;
  number: number;
  entry?: CitationEntry;
}

/** A formatted bibliography entry ready for rendering. */
export interface BibliographyEntry {
  key: string;
  number: number;
  formatted: string;
  doi?: string;
}

/** Result of citation resolution on a markdown string. */
export interface CitationResult {
  markdown: string;
  citations: ResolvedCitation[];
  warnings: string[];
}

/** Single citation: [@key] */
const SINGLE_CITE_RE = /\[@([a-zA-Z0-9_-]+)\]/g;

/** Multiple citation: [@a; @b; ...] */
const MULTI_CITE_RE = /\[(@[a-zA-Z0-9_-]+(?:;\s*@[a-zA-Z0-9_-]+)+)\]/g;

/**
 * Resolve all citation references in a markdown string.
 * Assigns sequential numbers in order of first appearance.
 * Returns the modified markdown, collected citations, and any warnings.
 */
export function resolveCitations(
  markdown: string,
  db: CitationDatabase | null,
): CitationResult {
  const numberMap = new Map<string, number>();
  const citations: ResolvedCitation[] = [];
  const warnings: string[] = [];
  let counter = 0;

  function getNumber(key: string): number {
    const existing = numberMap.get(key);
    if (existing !== undefined) return existing;
    counter += 1;
    numberMap.set(key, counter);
    return counter;
  }

  function resolveKey(key: string): string {
    if (!db) {
      if (!warnings.some((w) => w.includes(key))) {
        warnings.push(`Citation key "${key}" unresolved: no citation database provided`);
      }
      return `<span class="cite-unresolved">[${key}]</span>`;
    }

    const entry = db[key];
    if (!entry) {
      warnings.push(`Citation key "${key}" not found in database`);
      return `<span class="cite-unresolved">[${key}]</span>`;
    }

    const num = getNumber(key);

    // Only add to citations if not already present
    if (!citations.some((c) => c.key === key)) {
      citations.push({ key, number: num, entry });
    }

    return `<a href="/bibliography/#${key}" title="${entry.title}">[${num}]</a>`;
  }

  // Process multi-citations first to avoid single-citation regex consuming parts
  let result = markdown.replace(MULTI_CITE_RE, (_match, group: string) => {
    const keys = group
      .split(';')
      .map((k: string) => k.trim().replace(/^@/, ''));
    const links = keys.map((key) => resolveKey(key));
    // If any are unresolved spans, don't wrap in sup
    if (links.some((l) => l.includes('cite-unresolved'))) {
      return links.join(', ');
    }
    return `<sup class="cite">[${links.join(', ')}]</sup>`;
  });

  // Process single citations
  result = result.replace(SINGLE_CITE_RE, (_match, key: string) => {
    const link = resolveKey(key);
    if (link.includes('cite-unresolved')) return link;
    return `<sup class="cite">${link}</sup>`;
  });

  return { markdown: result, citations, warnings };
}

/**
 * Generate bibliography entries sorted alphabetically by first author's last name.
 */
export function generateBibliography(
  citations: ResolvedCitation[],
  db: CitationDatabase,
): BibliographyEntry[] {
  return [...citations]
    .filter((c) => c.entry)
    .sort((a, b) => {
      const lastNameA = extractLastName(a.entry!.authors[0] ?? '');
      const lastNameB = extractLastName(b.entry!.authors[0] ?? '');
      return lastNameA.localeCompare(lastNameB);
    })
    .map((c) => ({
      key: c.key,
      number: c.number,
      formatted: formatCitation(c.entry!),
      doi: c.entry!.doi,
    }));
}

/**
 * Format a citation entry in Chicago-adjacent style.
 *
 * Book: Author(s). Title. Edition. Publisher, Year.
 * Article: Author(s). "Title." Journal Volume (Year): Pages.
 */
export function formatCitation(entry: CitationEntry): string {
  const authors = formatAuthors(entry.authors);

  if (entry.type === 'book') {
    const parts = [authors];
    parts.push(`*${entry.title}*`);
    if (entry.edition) parts.push(`${entry.edition} ed`);
    if (entry.publisher) parts.push(`${entry.publisher}, ${entry.year}`);
    else parts.push(String(entry.year));
    return parts.join('. ') + '.';
  }

  // Article / default
  const parts = [authors];
  parts.push(`"${entry.title}"`);
  if (entry.journal) {
    let journalPart = `*${entry.journal}*`;
    if (entry.volume) journalPart += ` ${entry.volume}`;
    journalPart += ` (${entry.year})`;
    if (entry.pages) journalPart += `: ${entry.pages}`;
    parts.push(journalPart);
  } else {
    parts.push(String(entry.year));
  }

  return parts.join('. ') + '.';
}

/**
 * Extract the last name (last word) from an author string.
 * "Donald E. Knuth" → "Knuth"
 */
function extractLastName(author: string): string {
  const parts = author.trim().split(/\s+/);
  return parts[parts.length - 1] ?? author;
}

/**
 * Format author list: "Last, First" for first author,
 * "First Last" for subsequent, with "and" before last.
 */
function formatAuthors(authors: string[]): string {
  if (!authors.length) return 'Unknown';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return authors.slice(0, -1).join(', ') + ', and ' + authors[authors.length - 1];
}
