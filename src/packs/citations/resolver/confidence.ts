/**
 * Confidence scoring for citation resolution matching.
 *
 * Compares a raw citation candidate against an API result to produce
 * a 0-1 confidence score. Uses title normalization, Levenshtein distance,
 * and weighted scoring across DOI, title, author, and year fields.
 */

import type { CitedWork, RawCitation } from '../types/index.js';

// ============================================================================
// Title normalization
// ============================================================================

/** Normalize a title for fuzzy comparison: lowercase, strip articles, collapse whitespace, strip punctuation. */
export function normalizeTitleForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Levenshtein distance
// ============================================================================

/** Compute Levenshtein edit distance between two strings. */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use two rows to save memory.
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost,   // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Levenshtein similarity ratio: 1 - (distance / max(len_a, len_b)). Returns 0-1. */
export function levenshteinRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// ============================================================================
// Confidence scoring
// ============================================================================

/** Extract a DOI from citation text (pattern: 10.NNNN/...). */
function extractDoi(text: string): string | null {
  const match = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  return match ? match[0] : null;
}

/** Extract year from citation text. */
function extractYear(text: string): number | null {
  const match = text.match(/\b(1[4-9]\d{2}|20[0-2]\d|2100)\b/);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract a plausible first-author family name from citation text. */
function extractFirstAuthorFamily(text: string): string | null {
  // Common patterns: "Knuth, D." or "Knuth (1997)" or "D. Knuth"
  const patterns = [
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*,/,        // "Knuth, D."
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\(/,        // "Knuth (1997)"
    /^[A-Z]\.\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,   // "D. Knuth"
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1];
  }
  return null;
}

/**
 * Score how well an API result matches a raw citation candidate.
 *
 * Scoring weights:
 * - DOI match: instant 0.99
 * - Title similarity: 0.50
 * - Author (first) match: exact = 0.30, fuzzy (ratio > 0.85) = 0.15
 * - Year: exact = 0.20, +/-1 = 0.10
 *
 * Returns a confidence score in [0, 0.99].
 */
export function scoreMatch(candidate: RawCitation, result: Partial<CitedWork>): number {
  // DOI shortcut
  const candidateDoi = extractDoi(candidate.text);
  if (candidateDoi && result.doi && candidateDoi.toLowerCase() === result.doi.toLowerCase()) {
    return 0.99;
  }

  let score = 0;

  // Title similarity (weight 0.5)
  if (result.title) {
    const candidateTitle = extractTitleFromText(candidate.text);
    if (candidateTitle) {
      const normA = normalizeTitleForComparison(candidateTitle);
      const normB = normalizeTitleForComparison(result.title);
      score += levenshteinRatio(normA, normB) * 0.5;
    }
  }

  // Author match (weight 0.3 exact, 0.15 fuzzy)
  const candidateAuthor = extractFirstAuthorFamily(candidate.text);
  if (candidateAuthor && result.authors && result.authors.length > 0) {
    const resultFamily = result.authors[0].family;
    if (candidateAuthor.toLowerCase() === resultFamily.toLowerCase()) {
      score += 0.3;
    } else if (levenshteinRatio(candidateAuthor.toLowerCase(), resultFamily.toLowerCase()) > 0.85) {
      score += 0.15;
    }
  }

  // Year match (weight 0.2 exact, 0.1 +/-1)
  const candidateYear = extractYear(candidate.text);
  if (candidateYear && result.year) {
    if (candidateYear === result.year) {
      score += 0.2;
    } else if (Math.abs(candidateYear - result.year) <= 1) {
      score += 0.1;
    }
  }

  return Math.min(score, 0.99);
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Extract a plausible title from citation text.
 * Looks for quoted strings, italic markers, or content after year.
 */
function extractTitleFromText(text: string): string | null {
  // Quoted title: "Title Here"
  const quoted = text.match(/"([^"]+)"/);
  if (quoted) return quoted[1];

  // After year in parens: Author (2020). Title.
  const afterYear = text.match(/\(\d{4}\)\.\s*(.+?)\./);
  if (afterYear) return afterYear[1];

  // After year comma: Author, 2020. Title.
  const afterYearComma = text.match(/,\s*\d{4}\.\s*(.+?)\./);
  if (afterYearComma) return afterYearComma[1];

  return null;
}
