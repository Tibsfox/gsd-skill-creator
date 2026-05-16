/**
 * Typed retrieval-strategy interface for memory channels — the contract
 * that lexical (BM25), dense-embedding, graph-walk, multi-hop, and
 * long-context retrievers all conform to. Driven by the May 2026
 * synthesis section 2.4: route-before-act + retriever choice dominates
 * generator choice on retrieval-heavy tasks (arxiv `2605.10235v2`,
 * `2605.14503v1`).
 *
 * The shape is intentionally small: a strategy is a named, queryable
 * index over `RetrievalDoc` values. Higher-level hybrid logic combines
 * multiple strategies via the intent router.
 *
 * @module memory/strategies/types
 */

/** Opaque document handed to a strategy for indexing. */
export interface RetrievalDoc {
  /** Stable document identifier. */
  id: string;
  /** Full document text. */
  text: string;
  /** Optional opaque metadata for downstream consumers. */
  metadata?: Record<string, unknown>;
}

/** A single retrieval query. */
export interface RetrievalQuery {
  /** Free-form query text. */
  text: string;
  /** Maximum results to return. Default: 10. */
  topK?: number;
  /** Per-strategy options (opaque to the interface). */
  options?: Record<string, unknown>;
}

/** A scored search result. */
export interface RetrievalResult {
  /** The matched document. */
  doc: RetrievalDoc;
  /** Strategy-defined relevance score (higher is better). */
  score: number;
  /** Name of the strategy that produced this result. */
  source: string;
}

/**
 * Common contract for every retrieval channel. Implementations include
 * `BM25Strategy` (lexical), and planned dense-embedding / graph-walk
 * channels. Index operations must be idempotent on document id.
 */
export interface RetrievalStrategy {
  /** Stable strategy identifier (e.g. 'bm25', 'dense-cosine'). */
  readonly name: string;

  /** Insert or replace a document in the index. */
  index(doc: RetrievalDoc): void;

  /** Bulk insert. Equivalent to repeated index() but may be faster. */
  indexAll(docs: RetrievalDoc[]): void;

  /** Remove a document by id. No-op if not present. */
  remove(id: string): void;

  /** Number of documents currently indexed. */
  size(): number;

  /** Run a query and return top-K scored results, sorted descending. */
  search(query: RetrievalQuery): RetrievalResult[];

  /** Drop the index. */
  clear(): void;
}
