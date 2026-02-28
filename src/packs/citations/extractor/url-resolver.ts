/**
 * URL extraction, domain classification, and normalization.
 *
 * Scans text for URLs, classifies them by domain, normalizes by removing
 * tracking parameters, and detects embedded DOIs in URL paths.
 */

import type { RawCitation } from '../types/index.js';
import { URL_PATTERN, classifyDomain } from './patterns.js';

/** Tracking parameters to strip from URLs. */
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'fbclid', 'gclid',
]);

/**
 * Normalize a URL: remove tracking parameters and trailing slashes.
 */
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);

    // Remove tracking parameters
    for (const param of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param)) {
        url.searchParams.delete(param);
      }
    }

    let result = url.toString();

    // Strip trailing slash (unless it's just the origin)
    if (result.endsWith('/') && url.pathname !== '/') {
      result = result.slice(0, -1);
    }

    return result;
  } catch {
    return raw;
  }
}

/**
 * Check if a URL contains an embedded DOI (e.g. https://doi.org/10.xxxx/...).
 */
export function hasEmbeddedDoi(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return (hostname === 'doi.org' || hostname === 'dx.doi.org') &&
      /^\/10\.\d{4,}\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Extract the embedded DOI from a DOI URL.
 */
export function extractEmbeddedDoi(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip leading slash
    return parsed.pathname.slice(1);
  } catch {
    return url;
  }
}

/**
 * Extract all URLs from text, classify by domain, normalize.
 * URLs that contain embedded DOIs are returned as doi method with 0.99 confidence.
 *
 * @param text - Source text to scan
 * @param sourceDocument - Path/name of the source document
 * @returns Array of RawCitation objects
 */
export function extractUrls(text: string, sourceDocument: string): RawCitation[] {
  const seen = new Set<string>();
  const results: RawCitation[] = [];
  const now = new Date().toISOString();

  // Reset regex state
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const rawUrl = match[0];

    // Clean trailing punctuation that is unlikely part of the URL
    const cleanUrl = rawUrl.replace(/[.,;:)\]]+$/, '');

    const normalized = normalizeUrl(cleanUrl);
    if (seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());

    const lineNumber = text.substring(0, match.index).split('\n').length;

    // Embedded DOI detection
    if (hasEmbeddedDoi(normalized)) {
      const doi = extractEmbeddedDoi(normalized);
      results.push({
        text: doi,
        source_document: sourceDocument,
        extraction_method: 'doi',
        confidence: 0.99,
        line_number: lineNumber,
        timestamp: now,
      });
    } else {
      const confidence = classifyDomain(normalized);
      results.push({
        text: normalized,
        source_document: sourceDocument,
        extraction_method: 'url',
        confidence,
        line_number: lineNumber,
        timestamp: now,
      });
    }
  }

  return results;
}
