/**
 * Pre-indexed embedding store for grove records.
 *
 * Computes and caches embedding vectors at ingest time so that query-time
 * search is a pure cosine similarity scan — no embedding computation needed
 * on the hot path.
 *
 * # Architecture
 *
 *   Ingest:  record → embed(text) → store vector alongside hash
 *   Query:   question → embed(question) → cosine scan → ranked results
 *
 * The embedding function is pluggable: pass any `EmbedFn` that maps text
 * arrays to float arrays. In production, use all-MiniLM-L6-v2 via ONNX
 * (384-dim, ~5ms/text). For testing, use the built-in bag-of-words fallback.
 *
 * # Storage tiers
 *
 * Vectors are stored in-memory by default (Map<hashHex, Float32Array>).
 * The `PgVectorBackend` interface enables persistence to pgvector for
 * datasets that exceed RAM.
 *
 * # Speed model
 *
 * Pre-indexed: embed once at ingest (~5ms/record), scan at query (~0.1ms/record).
 * Query-time:  embed K candidates at query (~5ms × K per question).
 *
 * For 255 grove records: pre-index = 1.3s once, then 0.03ms per query.
 * For LongMemEval (53 sessions × 500 questions): pre-index eliminates
 * the 3636s query-time embedding cost entirely.
 *
 * @module memory/embedding-index
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Embedding function: maps an array of texts to an array of float vectors.
 * The dimension must be consistent across all calls.
 */
export type EmbedFn = (texts: string[]) => Promise<Float32Array[]>;

/** A single indexed entry. */
export interface IndexEntry {
  /** Hash of the source grove record. */
  hashHex: string;
  /** Pre-computed embedding vector. */
  vector: Float32Array;
  /** Original text that was embedded (optional, for debugging). */
  text?: string;
}

/** Result of a similarity search. */
export interface SearchResult {
  hashHex: string;
  score: number;
}

/** Options for the embedding index. */
export interface EmbeddingIndexOptions {
  /** Embedding function. Required. */
  embedFn: EmbedFn;
  /** Expected vector dimension (validated on first insert). */
  dimension?: number;
  /** Store original text alongside vectors (uses more RAM). Default: false. */
  storeText?: boolean;
}

/** Backend interface for persistent vector storage (pgvector, etc.). */
export interface VectorBackend {
  upsert(hashHex: string, vector: Float32Array): Promise<void>;
  upsertBatch(entries: Array<{ hashHex: string; vector: Float32Array }>): Promise<void>;
  search(queryVector: Float32Array, topK: number): Promise<SearchResult[]>;
  count(): Promise<number>;
  delete(hashHex: string): Promise<void>;
}

// ─── Cosine similarity ──────────────────────────────────────────────────────

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// ─── EmbeddingIndex ─────────────────────────────────────────────────────────

/**
 * In-memory embedding index with pre-computed vectors.
 *
 * Embed once at ingest, search instantly at query time.
 */
export class EmbeddingIndex {
  private readonly embedFn: EmbedFn;
  private readonly entries = new Map<string, IndexEntry>();
  private readonly storeText: boolean;
  private dimension: number | null;
  private backend: VectorBackend | null = null;

  constructor(options: EmbeddingIndexOptions) {
    this.embedFn = options.embedFn;
    this.dimension = options.dimension ?? null;
    this.storeText = options.storeText ?? false;
  }

  /** Attach a persistent backend (pgvector, etc.). */
  setBackend(backend: VectorBackend): void {
    this.backend = backend;
  }

  /** Number of indexed entries. */
  get size(): number {
    return this.entries.size;
  }

  /** Embedding dimension (known after first insert). */
  get dim(): number | null {
    return this.dimension;
  }

  // ─── Ingest ───────────────────────────────────────────────────────────

  /**
   * Index a single record: compute embedding and store it.
   * If the hash is already indexed, the entry is updated.
   */
  async index(hashHex: string, text: string): Promise<void> {
    const [vector] = await this.embedFn([text]);
    this.validateDimension(vector);

    const entry: IndexEntry = { hashHex, vector };
    if (this.storeText) entry.text = text;
    this.entries.set(hashHex, entry);

    if (this.backend) {
      await this.backend.upsert(hashHex, vector);
    }
  }

  /**
   * Batch index: compute embeddings for multiple records in one call.
   * More efficient than individual `index()` calls because the embedding
   * model can batch internally.
   */
  async indexBatch(
    records: Array<{ hashHex: string; text: string }>,
    batchSize = 64,
  ): Promise<{ indexed: number; timeMs: number }> {
    const start = performance.now();
    let indexed = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const texts = batch.map(r => r.text);
      const vectors = await this.embedFn(texts);

      const backendBatch: Array<{ hashHex: string; vector: Float32Array }> = [];

      for (let j = 0; j < batch.length; j++) {
        this.validateDimension(vectors[j]);
        const entry: IndexEntry = { hashHex: batch[j].hashHex, vector: vectors[j] };
        if (this.storeText) entry.text = batch[j].text;
        this.entries.set(batch[j].hashHex, entry);
        backendBatch.push({ hashHex: batch[j].hashHex, vector: vectors[j] });
        indexed++;
      }

      if (this.backend) {
        await this.backend.upsertBatch(backendBatch);
      }
    }

    return { indexed, timeMs: performance.now() - start };
  }

  /**
   * Remove an entry from the index.
   */
  async remove(hashHex: string): Promise<boolean> {
    const existed = this.entries.delete(hashHex);
    if (existed && this.backend) {
      await this.backend.delete(hashHex);
    }
    return existed;
  }

  // ─── Query ────────────────────────────────────────────────────────────

  /**
   * Search: embed the query text and return the top-K most similar entries.
   * The query embedding is computed once; the scan is pure arithmetic.
   */
  async search(query: string, topK = 10): Promise<SearchResult[]> {
    if (this.entries.size === 0) return [];

    // If backend is available and may have entries not in memory, delegate
    if (this.backend && this.entries.size === 0) {
      const [queryVec] = await this.embedFn([query]);
      return this.backend.search(queryVec, topK);
    }

    const [queryVec] = await this.embedFn([query]);
    return this.scanMemory(queryVec, topK);
  }

  /**
   * Search with a pre-computed query vector (skip embedding step).
   * Useful when the same query is run against multiple indices.
   */
  searchByVector(queryVec: Float32Array, topK = 10): SearchResult[] {
    return this.scanMemory(queryVec, topK);
  }

  private scanMemory(queryVec: Float32Array, topK: number): SearchResult[] {
    const scored: SearchResult[] = [];
    for (const entry of this.entries.values()) {
      scored.push({
        hashHex: entry.hashHex,
        score: cosineSimilarity(queryVec, entry.vector),
      });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  // ─── Utilities ────────────────────────────────────────────────────────

  /** Check if a hash is already indexed. */
  has(hashHex: string): boolean {
    return this.entries.has(hashHex);
  }

  /** Get the vector for a hash, or null. */
  getVector(hashHex: string): Float32Array | null {
    return this.entries.get(hashHex)?.vector ?? null;
  }

  /** All indexed hash hexes. */
  hashes(): string[] {
    return Array.from(this.entries.keys());
  }

  /** Export all entries (for serialization/persistence). */
  exportEntries(): IndexEntry[] {
    return Array.from(this.entries.values());
  }

  /** Import entries (from deserialization/load). */
  importEntries(entries: IndexEntry[]): void {
    for (const entry of entries) {
      this.validateDimension(entry.vector);
      this.entries.set(entry.hashHex, entry);
    }
  }

  private validateDimension(vector: Float32Array): void {
    if (this.dimension === null) {
      this.dimension = vector.length;
    } else if (vector.length !== this.dimension) {
      throw new Error(
        `EmbeddingIndex: dimension mismatch — expected ${this.dimension}, got ${vector.length}`,
      );
    }
  }
}

// ─── Built-in bag-of-words embedding (test/fallback) ────────────────────────

/**
 * Simple bag-of-words embedding function for testing.
 * Maps text to a fixed-dimension vector via hash-based feature hashing.
 * No model dependency. Deterministic. Not suitable for production
 * semantic search — use all-MiniLM-L6-v2 or similar.
 */
export function bagOfWordsEmbedFn(dimension = 128): EmbedFn {
  return async (texts: string[]): Promise<Float32Array[]> => {
    return texts.map(text => {
      const vec = new Float32Array(dimension);
      const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
      for (const word of words) {
        // Feature hashing: map word to a bucket via simple hash
        let h = 0;
        for (let i = 0; i < word.length; i++) {
          h = (h * 31 + word.charCodeAt(i)) | 0;
        }
        const bucket = ((h % dimension) + dimension) % dimension;
        const sign = h & 1 ? 1 : -1; // Random sign for hash collision mitigation
        vec[bucket] += sign;
      }
      // L2 normalize
      let norm = 0;
      for (let i = 0; i < dimension; i++) norm += vec[i] * vec[i];
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < dimension; i++) vec[i] /= norm;
      }
      return vec;
    });
  };
}
