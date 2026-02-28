/**
 * Citation discovery barrel export.
 *
 * Re-exports the discovery search engine, citation graph walker,
 * related works finder, and CLI command implementations.
 */

export {
  DiscoverySearchEngine,
  type DiscoveryOptions,
  type SearchResult,
} from './search-engine.js';

export {
  CitationGraph,
  type GraphNode,
  type ReferenceLookupFn,
} from './citation-graph.js';

export {
  RelatedWorksFinder,
} from './related-works.js';

export {
  citeSearch,
  citeTrace,
  citeVerify,
  citeExport,
  citeEnrich,
  citeStatus,
  type CommandContext,
  type FormatterFn,
  type AuditFn,
  type AuditSummary,
} from './cli-commands.js';
