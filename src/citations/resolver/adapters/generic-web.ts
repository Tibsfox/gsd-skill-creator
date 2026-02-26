/**
 * Generic web fallback resolver adapter.
 *
 * Extracts structured metadata from citation text using pattern matching.
 * Does NOT make HTTP calls by default -- this is a metadata parser, not
 * a web scraper. Only used when all other adapters fail.
 *
 * SAFE-01 compliant: metadata extraction only, never retrieves full text
 * of paywalled content.
 *
 * Produces lower-confidence results (0.40-0.60) since it relies on
 * heuristic text parsing rather than authoritative API data.
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// Adapter
// ============================================================================

export class GenericWebAdapter extends BaseAdapter {
  readonly name: SourceApi = 'extracted';
  readonly rateLimitPerSecond = 100; // No real API calls

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const extracted = extractMetadata(citation.text);
    if (!extracted.title) return null;

    const confidence = computeConfidence(extracted);
    if (confidence < 0.30) return null;

    const now = new Date().toISOString();
    return {
      id: `extracted:${normalizeForId(extracted.title)}`,
      title: extracted.title,
      authors: extracted.authors.length > 0 ? extracted.authors : [{ family: 'Unknown' }],
      year: extracted.year ?? 2000,
      doi: extracted.doi ?? undefined,
      isbn: extracted.isbn ?? undefined,
      url: extracted.url ?? undefined,
      publisher: extracted.publisher ?? undefined,
      type: guessType(extracted),
      source_api: 'extracted',
      confidence,
      first_seen: now,
      cited_by: [],
      tags: ['extracted', 'unverified'],
      raw_citations: [],
      verified: false,
    };
  }

  // --------------------------------------------------------------------------
  // Search (no-op for generic adapter)
  // --------------------------------------------------------------------------

  protected async doSearch(_query: string, _options?: SearchOptions): Promise<CitedWork[]> {
    return [];
  }

  // --------------------------------------------------------------------------
  // Availability (always available since it's local parsing)
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    return true;
  }
}

// ============================================================================
// Metadata extraction
// ============================================================================

interface ExtractedMetadata {
  title: string | null;
  authors: Author[];
  year: number | null;
  doi: string | null;
  isbn: string | null;
  url: string | null;
  publisher: string | null;
  hasVolume: boolean;
  hasPages: boolean;
}

function extractMetadata(text: string): ExtractedMetadata {
  return {
    title: extractTitle(text),
    authors: extractAuthors(text),
    year: extractYear(text),
    doi: extractDoi(text),
    isbn: extractIsbn(text),
    url: extractUrl(text),
    publisher: extractPublisher(text),
    hasVolume: /vol(ume)?\.?\s*\d+/i.test(text),
    hasPages: /pp?\.?\s*\d+/i.test(text) || /\d+-\d+/.test(text),
  };
}

function extractTitle(text: string): string | null {
  // Quoted title
  const quoted = text.match(/"([^"]+)"/);
  if (quoted) return quoted[1];

  // Italic markers (markdown)
  const italic = text.match(/\*([^*]+)\*/);
  if (italic) return italic[1];

  // After year in parens: Author (2020). Title here.
  const afterYear = text.match(/\(\d{4}\)\.\s*(.+?)\./);
  if (afterYear) return afterYear[1];

  // After year, comma: Author, 2020. Title here.
  const afterYearComma = text.match(/,\s*\d{4}\.\s*(.+?)\./);
  if (afterYearComma) return afterYearComma[1];

  return null;
}

function extractAuthors(text: string): Author[] {
  // Pattern: "Family, G." or "Family, G. & Family2, H."
  const authorPattern = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]\.(?:\s*[A-Z]\.)*)/g;
  const authors: Author[] = [];
  let match;
  while ((match = authorPattern.exec(text)) !== null) {
    authors.push({ family: match[1], given: match[2] });
  }
  if (authors.length > 0) return authors;

  // Pattern: "G. Family" at start
  const singleAuthor = text.match(/^([A-Z]\.(?:\s*[A-Z]\.)*)\s+([A-Z][a-z]+)/);
  if (singleAuthor) {
    return [{ family: singleAuthor[2], given: singleAuthor[1] }];
  }

  return [];
}

function extractYear(text: string): number | null {
  const m = text.match(/\b(1[4-9]\d{2}|20[0-2]\d|2100)\b/);
  return m ? parseInt(m[1], 10) : null;
}

function extractDoi(text: string): string | null {
  const m = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

function extractIsbn(text: string): string | null {
  const m = text.match(/(?:ISBN[-:\s]*)?((?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dXx])/i);
  return m ? m[1].replace(/[-\s]/g, '') : null;
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

function extractPublisher(text: string): string | null {
  // Common publisher patterns: "Publisher Name." at end, or after location
  const m = text.match(/(?::\s*)([A-Z][A-Za-z\s&]+?)(?:\.|,\s*\d)/);
  return m ? m[1].trim() : null;
}

// ============================================================================
// Confidence computation
// ============================================================================

function computeConfidence(extracted: ExtractedMetadata): number {
  let confidence = 0;

  // DOI is strong signal
  if (extracted.doi) confidence += 0.20;

  // ISBN is strong signal
  if (extracted.isbn) confidence += 0.15;

  // Title found
  if (extracted.title) confidence += 0.15;

  // Authors found
  if (extracted.authors.length > 0) confidence += 0.10;

  // Year found
  if (extracted.year) confidence += 0.05;

  // URL present
  if (extracted.url) confidence += 0.05;

  // Volume/pages suggest academic work
  if (extracted.hasVolume) confidence += 0.05;
  if (extracted.hasPages) confidence += 0.05;

  return Math.min(confidence, 0.60);
}

// ============================================================================
// Type guessing
// ============================================================================

function guessType(extracted: ExtractedMetadata): CitedWork['type'] {
  if (extracted.isbn) return 'book';
  if (extracted.hasVolume && extracted.hasPages) return 'article';
  if (extracted.url?.includes('github.com')) return 'repository';
  if (extracted.url) return 'website';
  if (extracted.doi) return 'article';
  return 'other';
}

// ============================================================================
// Helpers
// ============================================================================

function normalizeForId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}
