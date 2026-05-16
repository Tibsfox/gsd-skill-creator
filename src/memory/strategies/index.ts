/**
 * Retrieval strategies — typed memory channels selectable by intent.
 * See `types.ts` for the shared contract and `lexical.ts` for the BM25
 * channel. Planned siblings: dense-embedding (cosine over learned
 * representations), graph-walk (multi-hop over content-addressed
 * references), long-context (full-text fallback for short corpora).
 *
 * @module memory/strategies
 */

export type {
  RetrievalDoc,
  RetrievalQuery,
  RetrievalResult,
  RetrievalStrategy,
} from './types.js';

export { BM25Strategy, type BM25Options } from './lexical.js';
