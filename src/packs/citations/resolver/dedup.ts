/**
 * Citation batch deduplication module.
 *
 * Groups raw citations by normalized metadata (title, first author, year)
 * and merges duplicates before sending to API resolution. Reduces
 * unnecessary API calls and ensures consistent results.
 */

import type { RawCitation } from '../types/index.js';
import { normalizeTitleForComparison, levenshteinRatio } from './confidence.js';

// ============================================================================
// Public API
// ============================================================================

/**
 * Deduplicate a batch of raw citations before resolution.
 *
 * Merging criteria (in order):
 * 1. Same DOI -> merge
 * 2. Same ISBN -> merge
 * 3. Title similarity > 0.92 + same first author + year +/-1 -> merge
 *
 * From each merged group, the citation with the highest confidence is kept.
 */
export function deduplicateCitations(citations: RawCitation[]): RawCitation[] {
  if (citations.length <= 1) return [...citations];

  const groups: RawCitation[][] = [];

  for (const citation of citations) {
    let merged = false;

    for (const group of groups) {
      if (shouldMerge(citation, group[0])) {
        group.push(citation);
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push([citation]);
    }
  }

  // From each group, keep the citation with the highest confidence
  return groups.map(pickBest);
}

// ============================================================================
// Merge logic
// ============================================================================

function shouldMerge(a: RawCitation, b: RawCitation): boolean {
  // Same DOI
  const doiA = extractDoi(a.text);
  const doiB = extractDoi(b.text);
  if (doiA && doiB && doiA.toLowerCase() === doiB.toLowerCase()) return true;

  // Same ISBN
  const isbnA = extractIsbn(a.text);
  const isbnB = extractIsbn(b.text);
  if (isbnA && isbnB && isbnA === isbnB) return true;

  // Title similarity > 0.92 + same first author + year +/-1
  const titleA = extractTitle(a.text);
  const titleB = extractTitle(b.text);
  if (!titleA || !titleB) return false;

  const normA = normalizeTitleForComparison(titleA);
  const normB = normalizeTitleForComparison(titleB);
  const titleSim = levenshteinRatio(normA, normB);
  if (titleSim <= 0.92) return false;

  // Check first author
  const authorA = extractFirstAuthorFamily(a.text);
  const authorB = extractFirstAuthorFamily(b.text);
  if (!authorA || !authorB) return titleSim > 0.95; // Relaxed if no author
  if (authorA.toLowerCase() !== authorB.toLowerCase()) return false;

  // Check year (+/-1)
  const yearA = extractYear(a.text);
  const yearB = extractYear(b.text);
  if (yearA && yearB && Math.abs(yearA - yearB) > 1) return false;

  return true;
}

function pickBest(group: RawCitation[]): RawCitation {
  return group.reduce((best, c) => (c.confidence > best.confidence ? c : best));
}

// ============================================================================
// Text extraction helpers
// ============================================================================

function extractDoi(text: string): string | null {
  const m = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  if (!m) return null;
  // Strip trailing punctuation that may have been captured
  return m[0].replace(/[.]$/, '');
}

function extractIsbn(text: string): string | null {
  const m = text.match(/(?:ISBN[-:\s]*)?((?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dXx])/i);
  return m ? m[1].replace(/[-\s]/g, '') : null;
}

function extractTitle(text: string): string | null {
  const quoted = text.match(/"([^"]+)"/);
  if (quoted) return quoted[1];
  const afterYear = text.match(/\(\d{4}\)\.\s*(.+?)\./);
  if (afterYear) return afterYear[1];
  const afterYearComma = text.match(/,\s*\d{4}\.\s*(.+?)\./);
  if (afterYearComma) return afterYearComma[1];
  return null;
}

function extractFirstAuthorFamily(text: string): string | null {
  const patterns = [
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*,/,
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\(/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1];
  }
  return null;
}

function extractYear(text: string): number | null {
  const m = text.match(/\b(1[4-9]\d{2}|20[0-2]\d|2100)\b/);
  return m ? parseInt(m[1], 10) : null;
}
