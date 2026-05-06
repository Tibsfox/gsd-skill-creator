/**
 * Public surface for the symbol pipeline (W1 Track A).
 * @module intelligence/symbols
 */

export { indexFile, indexFiles } from './indexer.js';
export type { IndexerOptions } from './indexer.js';
export { resolve, attachSources } from './resolver.js';
export type {
  FileInput,
  FileIndexResult,
  IndexResult,
  ImportRecord,
  ResolverContext,
  ResolveResult,
} from './types.js';
