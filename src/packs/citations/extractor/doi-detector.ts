/**
 * DOI extraction and normalization.
 *
 * Scans text for DOI patterns, normalizes them (strips URL prefixes,
 * validates registrant codes), and deduplicates results.
 */

import type { RawCitation } from '../types/index.js';
import { DOI_PATTERN } from './patterns.js';

/**
 * Normalize a DOI string: strip URL prefixes, trim trailing punctuation.
 * Preserves case in the suffix (DOIs are case-insensitive but we keep
 * original case for display).
 */
export function normalizeDoi(raw: string): string {
  let doi = raw.trim();

  // Strip common URL prefixes
  doi = doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
  doi = doi.replace(/^doi:\s*/i, '');

  // Trim trailing punctuation that may have been captured
  doi = doi.replace(/[.,;:)\]]+$/, '');

  return doi;
}

/**
 * Validate that a DOI has valid structure: 10.XXXX/ where XXXX is 4+ digits.
 */
export function isValidDoi(doi: string): boolean {
  return /^10\.\d{4,}\/\S+$/.test(doi);
}

/**
 * Extract all DOIs from text, normalize and deduplicate.
 *
 * @param text - Source text to scan
 * @param sourceDocument - Path/name of the source document
 * @returns Array of RawCitation objects with method 'doi' and confidence 0.99
 */
export function detectDois(text: string, sourceDocument: string): RawCitation[] {
  const seen = new Set<string>();
  const results: RawCitation[] = [];
  const now = new Date().toISOString();

  // Reset regex state
  const pattern = new RegExp(DOI_PATTERN.source, DOI_PATTERN.flags);

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const rawDoi = match[1];
    const normalized = normalizeDoi(rawDoi);

    if (!isValidDoi(normalized)) continue;
    if (seen.has(normalized.toLowerCase())) continue;

    seen.add(normalized.toLowerCase());

    // Find approximate line number
    const lineNumber = text.substring(0, match.index).split('\n').length;

    results.push({
      text: normalized,
      source_document: sourceDocument,
      extraction_method: 'doi',
      confidence: 0.99,
      line_number: lineNumber,
      timestamp: now,
    });
  }

  return results;
}
