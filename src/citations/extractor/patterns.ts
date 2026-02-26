/**
 * Citation extraction regex patterns and confidence maps.
 *
 * Named regex constants for every citation style the extractor recognizes,
 * domain classification scores for URL confidence, and base confidence
 * values keyed by ExtractionMethod.
 *
 * Only allowed imports: types from ../types.
 */

import type { ExtractionMethod } from '../types/index.js';

// ============================================================================
// Citation regex patterns
// ============================================================================

/**
 * Parenthetical APA citations: (Author, Year) and (Author & Author, Year).
 * Captures: group 1 = author(s), group 2 = year.
 */
export const INLINE_APA =
  /\(([A-Z][a-zA-Z'-]+(?:\s(?:&|and)\s[A-Z][a-zA-Z'-]+)?(?:\s+et\s+al\.)?),\s*(\d{4}[a-z]?)\)/g;

/**
 * Narrative APA citations: Author (Year) or Author and Author (Year).
 * Captures: group 1 = author(s), group 2 = year.
 */
export const NARRATIVE_APA =
  /([A-Z][a-zA-Z'-]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'-]+)?(?:\s+et\s+al\.)?)\s+\((\d{4}[a-z]?)\)/g;

/**
 * Numbered references: [N], [N, M], [N-M].
 * Captures: group 1 = inner content (numbers, commas, dashes).
 */
export const NUMBERED_REF = /\[(\d+(?:\s*[-,]\s*\d+)*)\]/g;

/**
 * DOI pattern: matches bare DOIs and URL-prefixed DOIs.
 * Captures: group 1 = the DOI proper (10.xxxx/...).
 */
export const DOI_PATTERN =
  /(?:(?:https?:\/\/)?(?:dx\.)?doi\.org\/|doi:\s*)(10\.\d{4,}\/[^\s,;)\]]+)/gi;

/**
 * ISBN pattern: 10 or 13 digit ISBNs with optional hyphens.
 * Captures: group 1 = the full ISBN string.
 */
export const ISBN_PATTERN =
  /(?:ISBN[-:]?\s*)((?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dX])/gi;

/**
 * URL pattern: http(s) URLs.
 * Captures: group 0 = full URL.
 */
export const URL_PATTERN =
  /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/**
 * Bibliography/reference section headers.
 * Case-insensitive, optionally preceded by markdown heading markers.
 */
export const BIBLIOGRAPHY_HEADER =
  /^(?:#{1,4}\s+)?(?:References|Bibliography|Works\s+Cited|Sources|Further\s+Reading)\s*$/gim;

/**
 * Informal citations: "as described by Name", "developed by Name (Year)",
 * "according to Name", "proposed by Name".
 */
export const INFORMAL_CITATION =
  /(?:as\s+described\s+by|developed\s+by|according\s+to|proposed\s+by|introduced\s+by|coined\s+by|formulated\s+by)\s+(?:Dr\.?\s+)?([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)(?:\s+(?:in\s+(?:the\s+)?)(\d{4}s?|\d{4}))?/gi;

// ============================================================================
// Pattern metadata
// ============================================================================

/** Maps each regex to its ExtractionMethod tag. */
export const PATTERN_METHOD_MAP: ReadonlyMap<RegExp, ExtractionMethod> = new Map([
  [INLINE_APA, 'inline-apa'],
  [NARRATIVE_APA, 'narrative'],
  [NUMBERED_REF, 'inline-numbered'],
  [DOI_PATTERN, 'doi'],
  [ISBN_PATTERN, 'isbn'],
  [URL_PATTERN, 'url'],
  [INFORMAL_CITATION, 'informal'],
]);

// ============================================================================
// Domain classification
// ============================================================================

/** Domain → confidence boost for URL classification. */
export const DOMAIN_CLASSIFICATION: ReadonlyMap<string, number> = new Map([
  // Academic domains
  ['.edu', 0.70],
  ['doi.org', 0.70],
  ['arxiv.org', 0.70],
  ['pubmed.ncbi.nlm.nih.gov', 0.70],
  ['scholar.google.com', 0.70],
  ['jstor.org', 0.70],
  ['ieee.org', 0.70],
  ['springer.com', 0.70],
  ['wiley.com', 0.70],
  // Government domains
  ['ntrs.nasa.gov', 0.65],
  ['.gov', 0.65],
  // Repository domains
  ['github.com', 0.60],
  ['gitlab.com', 0.60],
  ['bitbucket.org', 0.60],
]);

/** Default confidence for domains not in the classification map. */
export const DOMAIN_DEFAULT_CONFIDENCE = 0.40;

// ============================================================================
// Base confidence map
// ============================================================================

/** Base confidence scores keyed by ExtractionMethod. */
export const BASE_CONFIDENCE: ReadonlyMap<ExtractionMethod, number> = new Map([
  ['doi', 0.99],
  ['isbn', 0.95],
  ['bibliography', 0.90],
  ['inline-apa', 0.85],
  ['inline-numbered', 0.85],
  ['narrative', 0.75],
  ['url', 0.40],      // overridden per-domain by classifyDomain()
  ['informal', 0.45],
  ['manual', 1.0],
]);

// ============================================================================
// Domain classification helper
// ============================================================================

/**
 * Classify a URL's domain and return the appropriate confidence score.
 * Checks specific domains first, then TLD suffixes.
 */
export function classifyDomain(url: string): number {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Check specific domain matches first (longest match wins)
    for (const [domain, confidence] of DOMAIN_CLASSIFICATION) {
      if (domain.startsWith('.')) {
        // TLD suffix match
        if (hostname.endsWith(domain)) return confidence;
      } else {
        // Exact or subdomain match
        if (hostname === domain || hostname.endsWith('.' + domain)) return confidence;
      }
    }

    return DOMAIN_DEFAULT_CONFIDENCE;
  } catch {
    return DOMAIN_DEFAULT_CONFIDENCE;
  }
}
