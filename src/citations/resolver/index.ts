/**
 * Citation resolver barrel export.
 *
 * Re-exports the adapter interface, base class, confidence scoring,
 * and all concrete resolver adapters.
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

export { CrossRefAdapter } from './adapters/crossref.js';
export { OpenAlexAdapter } from './adapters/openalex.js';
