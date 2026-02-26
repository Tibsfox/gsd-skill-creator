/**
 * Citation resolver barrel export.
 *
 * Re-exports the adapter interface, base class, confidence scoring,
 * dedup module, resolver engine, and all concrete resolver adapters.
 */

export {
  type ResolverAdapter,
  type SearchOptions,
  type AdapterMetrics,
  type BaseAdapterConfig,
  BaseAdapter,
} from './adapter.js';

export {
  scoreMatch,
  normalizeTitleForComparison,
  levenshteinRatio,
} from './confidence.js';

export { deduplicateCitations } from './dedup.js';

export {
  ResolverEngine,
  type CitationStorePort,
  type ResolverEngineOptions,
} from './resolver-engine.js';

export { CrossRefAdapter } from './adapters/crossref.js';
export { OpenAlexAdapter } from './adapters/openalex.js';
export { NasaNtrsAdapter } from './adapters/nasa-ntrs.js';
export { GitHubAdapter } from './adapters/github.js';
export { ArchiveOrgAdapter } from './adapters/archive-org.js';
export { GenericWebAdapter } from './adapters/generic-web.js';
