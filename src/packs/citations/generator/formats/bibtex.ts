/**
 * BibTeX bibliography format renderer.
 *
 * Converts CitedWork records to BibTeX entries with:
 * - Key generation: {first_author_family}{year}{title_first_word} lowercase
 * - Collision dedup with a/b/c suffixes
 * - LaTeX special character escaping
 * - Entry type mapping from CitedWorkType to BibTeX types
 */

import type { CitedWork, CitedWorkType } from '../../types/index.js';
import type { FormatOptions } from '../../types/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Mapping from CitedWorkType to BibTeX entry types. */
const ENTRY_TYPE_MAP: Record<CitedWorkType, string> = {
  article: 'article',
  book: 'book',
  chapter: 'inbook',
  report: 'techreport',
  thesis: 'phdthesis',
  conference: 'inproceedings',
  standard: 'misc',
  website: 'misc',
  repository: 'misc',
  patent: 'misc',
  other: 'misc',
};

/** Characters that must be escaped in LaTeX/BibTeX. */
const LATEX_SPECIAL: Array<[RegExp, string]> = [
  [/\\/g, '\\textbackslash{}'],
  [/&/g, '\\&'],
  [/%/g, '\\%'],
  [/\$/g, '\\$'],
  [/#/g, '\\#'],
  [/_/g, '\\_'],
  [/\{/g, '\\{'],
  [/\}/g, '\\}'],
];

// ============================================================================
// Helpers
// ============================================================================

/** Escape LaTeX special characters in a string. */
export function escapeLatex(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LATEX_SPECIAL) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Generate a BibTeX key from a CitedWork.
 * Format: {first_author_family}{year}{title_first_word} all lowercase.
 */
export function generateKey(work: CitedWork): string {
  const family = work.authors[0]?.family ?? 'unknown';
  const year = String(work.year);
  const firstWord = work.title
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)[0] ?? 'untitled';
  return (family + year + firstWord).toLowerCase();
}

/**
 * Deduplicate BibTeX keys by appending a/b/c suffixes on collision.
 * Returns a Map from work ID to deduplicated key.
 */
export function deduplicateKeys(works: CitedWork[]): Map<string, string> {
  const keyCount = new Map<string, number>();
  const keyFirst = new Map<string, string>(); // base key -> first work ID
  const result = new Map<string, string>();

  // First pass: detect collisions
  for (const work of works) {
    const baseKey = generateKey(work);
    const count = keyCount.get(baseKey) ?? 0;
    keyCount.set(baseKey, count + 1);
    if (count === 0) {
      keyFirst.set(baseKey, work.id);
    }
  }

  // Second pass: assign suffixes where needed
  const suffixCounters = new Map<string, number>();
  for (const work of works) {
    const baseKey = generateKey(work);
    const totalCount = keyCount.get(baseKey) ?? 1;

    if (totalCount === 1) {
      result.set(work.id, baseKey);
    } else {
      const idx = suffixCounters.get(baseKey) ?? 0;
      suffixCounters.set(baseKey, idx + 1);
      const suffix = String.fromCharCode(97 + idx); // a, b, c...
      result.set(work.id, baseKey + suffix);
    }
  }

  return result;
}

/** Format author list for BibTeX: "Last, First and Last, First". */
function formatAuthors(work: CitedWork): string {
  return work.authors
    .map(a => a.given ? `${a.family}, ${a.given}` : a.family)
    .join(' and ');
}

// ============================================================================
// Public API
// ============================================================================

/** Format a single CitedWork as a BibTeX entry with the given key. */
export function formatEntry(work: CitedWork, key?: string): string {
  const entryType = ENTRY_TYPE_MAP[work.type];
  const entryKey = key ?? generateKey(work);

  const fields: string[] = [];

  fields.push(`  author = {${escapeLatex(formatAuthors(work))}}`);
  fields.push(`  title = {${escapeLatex(work.title)}}`);
  fields.push(`  year = {${work.year}}`);

  if (work.journal) {
    fields.push(`  journal = {${escapeLatex(work.journal)}}`);
  }
  if (work.volume) {
    fields.push(`  volume = {${work.volume}}`);
  }
  if (work.issue) {
    fields.push(`  number = {${work.issue}}`);
  }
  if (work.pages) {
    fields.push(`  pages = {${work.pages}}`);
  }
  if (work.publisher) {
    fields.push(`  publisher = {${escapeLatex(work.publisher)}}`);
  }
  if (work.doi) {
    fields.push(`  doi = {${work.doi}}`);
  }
  if (work.isbn) {
    fields.push(`  isbn = {${work.isbn}}`);
  }
  if (work.url) {
    fields.push(`  url = {${work.url}}`);
  }
  if (work.notes) {
    fields.push(`  note = {${escapeLatex(work.notes)}}`);
  }

  return `@${entryType}{${entryKey},\n${fields.join(',\n')}\n}`;
}

/**
 * Format a complete BibTeX bibliography from CitedWork records.
 * Handles key deduplication across all entries.
 */
export function formatBibliography(works: CitedWork[], _options: FormatOptions): string {
  if (works.length === 0) return '';

  const keyMap = deduplicateKeys(works);

  return works
    .map(work => formatEntry(work, keyMap.get(work.id)))
    .join('\n\n');
}
