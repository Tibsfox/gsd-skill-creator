/**
 * Citation extractor barrel export.
 *
 * Re-exports all extraction utilities: patterns, DOI detector,
 * URL resolver.
 */

export {
  INLINE_APA,
  NARRATIVE_APA,
  NUMBERED_REF,
  DOI_PATTERN,
  ISBN_PATTERN,
  URL_PATTERN,
  BIBLIOGRAPHY_HEADER,
  INFORMAL_CITATION,
  PATTERN_METHOD_MAP,
  DOMAIN_CLASSIFICATION,
  DOMAIN_DEFAULT_CONFIDENCE,
  BASE_CONFIDENCE,
  classifyDomain,
} from './patterns.js';

export {
  normalizeDoi,
  isValidDoi,
  detectDois,
} from './doi-detector.js';

export {
  normalizeUrl,
  hasEmbeddedDoi,
  extractEmbeddedDoi,
  extractUrls,
} from './url-resolver.js';
