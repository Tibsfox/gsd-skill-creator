/**
 * LOD 350 — ChromaDB Vector Store.
 *
 * Thin wrapper around ChromaDB for semantic search over memory embeddings.
 * ChromaDB is an optional dependency — all methods gracefully degrade when
 * it is not installed (returning empty results, false, or 0).
 *
 * ChromaDB handles its own embedding generation internally; this store
 * does NOT manage embeddings.
 *
 * @module memory/chroma-store
 */

import { LodLevel } from '../lod/types.js';
import type {
  MemoryRecord,
  MemoryQuery,
  MemoryResult,
  MemoryStore,
  MemoryType,
} from './types.js';

// ─── ChromaDB Type Stubs ────────────────────────────────────────────────────
// Minimal type declarations to avoid depending on chromadb at compile time.

interface ChromaCollection {
  add(params: {
    ids: string[];
    documents: string[];
    metadatas: Record<string, unknown>[];
  }): Promise<void>;
  query(params: {
    queryTexts: string[];
    nResults?: number;
    where?: Record<string, unknown>;
  }): Promise<{
    ids: string[][];
    documents: (string | null)[][];
    metadatas: (Record<string, unknown> | null)[][];
    distances: (number | null)[][];
  }>;
  get(params: {
    ids: string[];
    include?: string[];
  }): Promise<{
    ids: string[];
    documents: (string | null)[];
    metadatas: (Record<string, unknown> | null)[];
  }>;
  delete(params: { ids: string[] }): Promise<void>;
  count(): Promise<number>;
  update(params: {
    ids: string[];
    documents?: string[];
    metadatas?: Record<string, unknown>[];
  }): Promise<void>;
}

interface ChromaClient {
  getOrCreateCollection(params: {
    name: string;
  }): Promise<ChromaCollection>;
}

// ─── Preload result ─────────────────────────────────────────────────────────

/**
 * Result of a `ChromaStore.preload()` call. Used to report how much work
 * the warm-up did and how long it took so the caller can decide whether
 * to run it again (e.g. after a checkpoint rebuild).
 */
export interface ChromaPreloadResult {
  /** True if ChromaDB was importable and the collection opened. */
  available: boolean;
  /** Number of records already present in the collection. */
  count: number;
  /** True if the HNSW warmup query was executed. */
  warmed: boolean;
  /** Time spent preloading (ms). */
  elapsedMs: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Rough token estimate (~4 chars per token). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Build a metadata object from a MemoryRecord for ChromaDB storage. */
function recordToMetadata(record: MemoryRecord): Record<string, unknown> {
  return {
    type: record.type,
    name: record.name,
    description: record.description,
    tags: record.tags.join(','),
    confidence: record.confidence,
    lodCurrent: record.lodCurrent,
    validFrom: record.validFrom.toISOString(),
    validTo: record.validTo?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastAccessed: record.lastAccessed.toISOString(),
    accessCount: record.accessCount,
    sourceSession: record.sourceSession ?? null,
    sourceFile: record.sourceFile ?? null,
    relatedTo: record.relatedTo.join(','),
  };
}

/** Parse a value back to a Date, falling back to now. */
function parseDate(value: unknown): Date {
  if (!value) return new Date();
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Parse a nullable date value. */
function parseDateNullable(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

/** Reconstruct a MemoryRecord from ChromaDB metadata + document. */
function metadataToRecord(
  id: string,
  metadata: Record<string, unknown> | null,
  document: string | null,
): MemoryRecord {
  const meta = metadata ?? {};
  return {
    id,
    type: (meta.type as MemoryType) ?? 'reference',
    name: String(meta.name ?? ''),
    description: String(meta.description ?? ''),
    content: document ?? '',
    lodCurrent: (meta.lodCurrent as LodLevel) ?? LodLevel.CONSTRUCTION,
    tags: meta.tags ? String(meta.tags).split(',').filter(Boolean) : [],
    confidence: typeof meta.confidence === 'number' ? meta.confidence : 1.0,
    validFrom: parseDate(meta.validFrom),
    validTo: parseDateNullable(meta.validTo),
    createdAt: parseDate(meta.createdAt),
    updatedAt: parseDate(meta.updatedAt),
    lastAccessed: parseDate(meta.lastAccessed),
    accessCount: typeof meta.accessCount === 'number' ? meta.accessCount : 0,
    provenance: {
      scope: (meta.scope as any) ?? 'project',
      visibility: (meta.visibility as any) ?? 'internal',
      domains: meta.domains ? String(meta.domains).split(',').filter(Boolean) : [],
    },
    temporalClass: (meta.temporalClass as any) ?? 'seasonal',
    sourceSession: meta.sourceSession ? String(meta.sourceSession) : undefined,
    sourceFile: meta.sourceFile ? String(meta.sourceFile) : undefined,
    relatedTo: meta.relatedTo
      ? String(meta.relatedTo).split(',').filter(Boolean)
      : [],
  };
}

/**
 * Convert a ChromaDB distance to a similarity score in [0, 1].
 * ChromaDB returns L2 distances by default — smaller = more similar.
 * We normalize with: score = 1 / (1 + distance).
 */
function distanceToScore(distance: number | null): number {
  if (distance === null || distance === undefined) return 0;
  return 1 / (1 + distance);
}

// ─── ChromaStore ────────────────────────────────────────────────────────────

/**
 * LOD 350 ChromaDB Vector Store.
 *
 * Provides semantic search over memory embeddings via ChromaDB.
 * All operations gracefully degrade when ChromaDB is not available.
 */
export class ChromaStore implements MemoryStore {
  readonly lod = LodLevel.CONSTRUCTION;

  private client: ChromaClient | null = null;
  private collection: ChromaCollection | null = null;
  private initPromise: Promise<boolean> | null = null;
  private available: boolean | null = null;

  constructor(
    private readonly chromaPath: string = '.chroma/',
    private readonly collectionName: string = 'gsd_memories',
  ) {}

  // ─── Initialization ──────────────────────────────────────────────────────

  /**
   * Check whether ChromaDB is importable and available.
   * Caches the result after the first check.
   */
  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;
    await this.init();
    return this.available ?? false;
  }

  /**
   * Initialize the ChromaDB client and collection.
   * Uses dynamic import to avoid hard dependency on chromadb.
   * Returns true if initialization succeeded, false otherwise.
   */
  private async init(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async (): Promise<boolean> => {
      try {
        // @ts-expect-error — chromadb is an optional dependency; dynamic import handles absence at runtime
        const chromaModule = await import('chromadb');
        const ClientClass =
          chromaModule.ChromaClient ?? (chromaModule as any).default?.ChromaClient;

        if (!ClientClass) {
          this.available = false;
          return false;
        }

        this.client = new ClientClass({ path: this.chromaPath }) as ChromaClient;
        this.collection = await this.client!.getOrCreateCollection({
          name: this.collectionName,
        });
        this.available = true;
        return true;
      } catch {
        this.available = false;
        return false;
      }
    })();

    return this.initPromise;
  }

  /** Get the initialized collection, or null if unavailable. */
  private async getCollection(): Promise<ChromaCollection | null> {
    if (!(await this.init())) return null;
    return this.collection;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Store a memory record in ChromaDB.
   * The record's content becomes the document text, and metadata is stored
   * alongside it. The memory UUID is used as the ChromaDB ID.
   * No-op if ChromaDB is not available.
   */
  async store(record: MemoryRecord): Promise<void> {
    const coll = await this.getCollection();
    if (!coll) return;

    try {
      // Try to get existing — update if present, add if not
      const existing = await coll.get({ ids: [record.id] });
      if (existing.ids.length > 0) {
        await coll.update({
          ids: [record.id],
          documents: [record.content],
          metadatas: [recordToMetadata(record)],
        });
      } else {
        await coll.add({
          ids: [record.id],
          documents: [record.content],
          metadatas: [recordToMetadata(record)],
        });
      }
    } catch {
      // Graceful degradation — storage failure is not fatal
    }
  }

  /**
   * Query memories using semantic search.
   * Uses ChromaDB's built-in embedding and similarity search.
   * Supports filtering by type and tags via `where` clauses.
   * Returns results with similarity scores.
   */
  async query(q: MemoryQuery): Promise<MemoryResult[]> {
    const coll = await this.getCollection();
    if (!coll) return [];

    try {
      const nResults = q.limit ?? 10;

      // Build where filter
      let where: Record<string, unknown> | undefined;
      const conditions: Record<string, unknown>[] = [];

      if (q.type) {
        conditions.push({ type: { $eq: q.type } });
      }

      if (q.tags && q.tags.length > 0) {
        // ChromaDB metadata tags are comma-separated strings;
        // filter by checking if the tag string contains any of the query tags
        for (const tag of q.tags) {
          conditions.push({ tags: { $contains: tag } });
        }
      }

      if (conditions.length === 1) {
        where = conditions[0];
      } else if (conditions.length > 1) {
        where = { $and: conditions };
      }

      const queryParams: {
        queryTexts: string[];
        nResults: number;
        where?: Record<string, unknown>;
      } = {
        queryTexts: [q.text],
        nResults,
      };

      if (where) {
        queryParams.where = where;
      }

      const response = await coll.query(queryParams);

      const results: MemoryResult[] = [];
      const ids = response.ids[0] ?? [];
      const documents = response.documents[0] ?? [];
      const metadatas = response.metadatas[0] ?? [];
      const distances = response.distances?.[0] ?? [];

      for (let i = 0; i < ids.length; i++) {
        const record = metadataToRecord(
          ids[i],
          metadatas[i],
          documents[i],
        );

        // Apply temporal filter if specified
        if (q.asOf) {
          if (record.validFrom > q.asOf) continue;
          if (record.validTo && record.validTo < q.asOf) continue;
        }

        results.push({
          record,
          score: distanceToScore(distances[i] ?? null),
          sourceLod: LodLevel.CONSTRUCTION,
          tokenEstimate: estimateTokens(record.content),
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Retrieve a specific memory by ID from ChromaDB.
   * Returns null if ChromaDB is unavailable or the memory does not exist.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    const coll = await this.getCollection();
    if (!coll) return null;

    try {
      const response = await coll.get({
        ids: [id],
        include: ['documents', 'metadatas'],
      });

      if (response.ids.length === 0) return null;

      return metadataToRecord(
        response.ids[0],
        response.metadatas[0],
        response.documents[0],
      );
    } catch {
      return null;
    }
  }

  /**
   * Remove a memory from ChromaDB by ID.
   * Returns true if deletion was attempted, false if ChromaDB is unavailable.
   */
  async remove(id: string): Promise<boolean> {
    const coll = await this.getCollection();
    if (!coll) return false;

    try {
      await coll.delete({ ids: [id] });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a memory exists in ChromaDB by ID.
   * Returns false if ChromaDB is unavailable.
   */
  async has(id: string): Promise<boolean> {
    const coll = await this.getCollection();
    if (!coll) return false;

    try {
      const response = await coll.get({ ids: [id] });
      return response.ids.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Count memories in the ChromaDB collection.
   * Returns 0 if ChromaDB is unavailable.
   */
  async count(): Promise<number> {
    const coll = await this.getCollection();
    if (!coll) return 0;

    try {
      return await coll.count();
    } catch {
      return 0;
    }
  }

  /**
   * Warm the ChromaDB HNSW index into RAM so the first user query doesn't
   * pay the cold-load cost.
   *
   * LTM-07 (Long-Term Memory Systems research) flagged this as the single
   * biggest first-query latency win: Chroma lazy-loads its HNSW index on
   * the first `query` call of a collection, which for production corpora
   * can mean multi-second stalls on a "warm" connection. Preloading hides
   * that latency behind startup.
   *
   * Strategy:
   * 1. Open the client + collection (same path as any other op).
   * 2. Read `count()` to verify the collection is reachable and to get a
   *    size hint for the caller.
   * 3. Execute a single dummy `query` with `nResults: 1` — Chroma's HNSW
   *    loader runs inside the query path, so this is the cheapest way to
   *    force it without hand-driving the internal loader.
   *
   * Safe to call multiple times — subsequent calls pay only the dummy
   * query cost. Safe to call when ChromaDB is unavailable: returns
   * `available: false` without throwing.
   */
  async preload(): Promise<ChromaPreloadResult> {
    const start = performance.now();

    const coll = await this.getCollection();
    if (!coll) {
      return {
        available: false,
        count: 0,
        warmed: false,
        elapsedMs: performance.now() - start,
      };
    }

    let count = 0;
    try {
      count = await coll.count();
    } catch {
      // Collection present but count threw — still try the warmup query.
    }

    // Force the HNSW index to load by running one trivial query. The text
    // is arbitrary; we only care about the side effect of the loader
    // running. An empty collection skips the HNSW path entirely, in which
    // case there's nothing to warm.
    let warmed = false;
    if (count > 0) {
      try {
        await coll.query({ queryTexts: [' '], nResults: 1 });
        warmed = true;
      } catch {
        // Warmup failure is non-fatal; the collection is still usable.
      }
    }

    return {
      available: true,
      count,
      warmed,
      elapsedMs: performance.now() - start,
    };
  }
}
