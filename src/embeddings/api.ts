/**
 * MD-1 Shallow Learned Embeddings — read API.
 *
 * Consumer-facing surface for post-training access to entity embeddings.
 * Backed by a `LearnedEmbeddingStore` holding vocabulary + the input
 * embedding matrix; exposes per-entity lookup, cosine similarity, and
 * top-k nearest neighbours (interpretability per MD-1 §Mechanism).
 *
 * The store is immutable once constructed. Retraining produces a fresh
 * store; callers should swap by reference and invalidate their own caches.
 *
 * All methods are pure: no IO, no hidden mutation.
 *
 * @module embeddings/api
 */

import type { SkipGramModel } from './skip-gram.js';
import { dotRows, getInputRow } from './skip-gram.js';

// ─── Store ──────────────────────────────────────────────────────────────────

export interface LearnedEmbeddingStore {
  /** Vocabulary in the order used by the model (index i → entity id). */
  readonly vocabulary: readonly string[];
  /** Entity id → vocab index. */
  readonly vocabIndex: ReadonlyMap<string, number>;
  /** Embedding dimension. */
  readonly dim: number;
  /**
   * Raw input-embedding matrix exposed read-only. Consumers MUST NOT
   * mutate. Row-major, length `vocabulary.length * dim`.
   */
  readonly matrix: Float64Array;
}

/**
 * Build a LearnedEmbeddingStore from the trainer output. Takes ownership
 * of the SkipGramModel's input matrix (stored by reference); the model
 * itself is no longer needed after construction.
 */
export function buildStore(
  model: SkipGramModel,
  vocabulary: readonly string[],
  vocabIndex: ReadonlyMap<string, number>,
): LearnedEmbeddingStore {
  if (vocabulary.length !== model.vocabSize) {
    throw new Error(
      `vocabulary length ${vocabulary.length} does not match model vocabSize ${model.vocabSize}`,
    );
  }
  return {
    vocabulary,
    vocabIndex,
    dim: model.dim,
    matrix: model.inputEmbeddings,
  };
}

// ─── Lookups ────────────────────────────────────────────────────────────────

/**
 * Return the embedding for `entityId` as a plain number[], or `null` if
 * the entity is not in the store's vocabulary.
 */
export function getEmbedding(
  store: LearnedEmbeddingStore,
  entityId: string,
): number[] | null {
  const idx = store.vocabIndex.get(entityId);
  if (idx === undefined) return null;
  return getRowCopy(store, idx);
}

function getRowCopy(store: LearnedEmbeddingStore, idx: number): number[] {
  const out = new Array<number>(store.dim);
  const base = idx * store.dim;
  for (let k = 0; k < store.dim; k++) out[k] = store.matrix[base + k];
  return out;
}

/**
 * Cosine similarity between two entity embeddings. Returns `0` if either
 * entity is unknown or if either vector has zero norm (degenerate).
 * Result is always in [-1, 1] barring floating-point rounding.
 */
export function cosineSimilarity(
  store: LearnedEmbeddingStore,
  entityA: string,
  entityB: string,
): number {
  const ia = store.vocabIndex.get(entityA);
  const ib = store.vocabIndex.get(entityB);
  if (ia === undefined || ib === undefined) return 0;
  return cosineByIndex(store, ia, ib);
}

/** Internal: cosine between two vocab indices. Never throws. */
export function cosineByIndex(
  store: LearnedEmbeddingStore,
  ia: number,
  ib: number,
): number {
  const dim = store.dim;
  const m = store.matrix;
  const aBase = ia * dim;
  const bBase = ib * dim;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let k = 0; k < dim; k++) {
    const av = m[aBase + k];
    const bv = m[bBase + k];
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  const c = dot / Math.sqrt(na * nb);
  // Clamp to [-1, 1] to absorb tiny FP rounding overshoot.
  if (c > 1) return 1;
  if (c < -1) return -1;
  return c;
}

// Suppress the intentionally-imported-but-not-directly-called helpers that
// some downstream consumers import through this barrel. Re-exported for
// convenience.
export { dotRows, getInputRow };

// ─── Nearest-neighbour API (interpretability) ───────────────────────────────

export interface NearestNeighbour {
  entityId: string;
  similarity: number;
}

/**
 * Return the top-`k` nearest neighbours of `entityId` by cosine similarity,
 * excluding `entityId` itself. If `entityId` is not in the store, returns
 * an empty array. Ties are broken by entityId ascending.
 */
export function nearestNeighbours(
  store: LearnedEmbeddingStore,
  entityId: string,
  k = 5,
): NearestNeighbour[] {
  const idx = store.vocabIndex.get(entityId);
  if (idx === undefined) return [];
  const pairs: NearestNeighbour[] = [];
  for (let i = 0; i < store.vocabulary.length; i++) {
    if (i === idx) continue;
    const s = cosineByIndex(store, idx, i);
    pairs.push({ entityId: store.vocabulary[i], similarity: s });
  }
  pairs.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return a.entityId < b.entityId ? -1 : a.entityId > b.entityId ? 1 : 0;
  });
  return pairs.slice(0, Math.max(0, k));
}

// ─── Cache (retraining-invalidated) ─────────────────────────────────────────

/**
 * Light-weight caching wrapper. `getCached` returns a memoised embedding;
 * callers invalidate by constructing a new cache when the underlying store
 * changes (retraining).
 */
export class EmbeddingAccessCache {
  private readonly store: LearnedEmbeddingStore;
  private readonly memo = new Map<string, number[] | null>();

  constructor(store: LearnedEmbeddingStore) {
    this.store = store;
  }

  get(entityId: string): number[] | null {
    if (this.memo.has(entityId)) return this.memo.get(entityId)!;
    const v = getEmbedding(this.store, entityId);
    this.memo.set(entityId, v);
    return v;
  }

  cosine(a: string, b: string): number {
    return cosineSimilarity(this.store, a, b);
  }

  size(): number {
    return this.memo.size;
  }

  clear(): void {
    this.memo.clear();
  }
}
