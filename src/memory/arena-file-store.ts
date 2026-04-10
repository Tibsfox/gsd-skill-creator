/**
 * LOD 300 — Arena-backed Memory Store.
 *
 * An alternative implementation of MemoryStore that persists memory
 * records in the Rust-backed memory arena (via the RustArena TypeScript
 * client) instead of as individual markdown files on disk.
 *
 * This is NOT a replacement for file-store.ts — it lives alongside it.
 * The existing FileStore still owns markdown-on-disk storage. Callers
 * can opt into the arena backing for workloads where:
 *
 * - Latency matters (in-RAM storage is hundreds of times faster)
 * - Crash safety with warm-start is required (checkpoint + journal)
 * - Batch operations dominate (directory walk for large corpora is slow)
 *
 * See memory/amiga-ram-storage-design.md for the design rationale and
 * www/tibsfox/com/Research/LTM/ for the research backing this choice.
 *
 * # Data model
 *
 * Each memory record is stored as one chunk in the arena. The payload
 * is JSON-serialized {meta, content} where meta is the record fields
 * (excluding content) and content is the body. Retrieval deserializes
 * and reconstitutes a MemoryRecord.
 *
 * Memory IDs map to arena chunk IDs via an in-memory Map. This map is
 * reconstructed from `listIds()` on each initialization: for each
 * allocated chunk, we fetch its payload, parse the JSON, and extract
 * the record.id. This rebuild is O(N) but only runs at startup.
 *
 * @module memory/arena-file-store
 */

import { LodLevel } from '../lod/types.js';
import type {
  MemoryProvenance,
  MemoryQuery,
  MemoryRecord,
  MemoryResult,
  MemoryStore,
  MemoryType,
  TemporalClass,
} from './types.js';
import { inferTemporalClass } from './types.js';
import { RustArena, type TierKind } from './rust-arena.js';

// ─── Serialization ──────────────────────────────────────────────────────────

/**
 * Serialized form of a memory record in the arena. We keep content
 * as a separate field so large content doesn't bloat the metadata
 * header when future tooling wants to scan all chunks.
 */
interface SerializedRecord {
  id: string;
  name: string;
  description: string;
  type: MemoryType;
  tags: string[];
  confidence: number;
  lodCurrent: number;
  validFrom: string;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
  lastAccessed: string | null;
  accessCount: number;
  relatedTo: string[];
  sourceSession: string | null;
  sourceFile: string | null;
  content: string;
  /** Provenance (scope/visibility/domains). Optional for backward compat with older chunks. */
  provenance?: MemoryProvenance;
  /** Temporal decay class. Optional for backward compat with older chunks. */
  temporalClass?: TemporalClass;
}

function serializeRecord(record: MemoryRecord): Uint8Array {
  const obj: SerializedRecord = {
    id: record.id,
    name: record.name,
    description: record.description,
    type: record.type,
    tags: record.tags,
    confidence: record.confidence,
    lodCurrent: record.lodCurrent,
    validFrom: record.validFrom.toISOString(),
    validTo: record.validTo ? record.validTo.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastAccessed: record.lastAccessed ? record.lastAccessed.toISOString() : null,
    accessCount: record.accessCount,
    relatedTo: record.relatedTo,
    sourceSession: record.sourceSession ?? null,
    sourceFile: record.sourceFile ?? null,
    content: record.content,
    provenance: record.provenance,
    temporalClass: record.temporalClass,
  };
  return new TextEncoder().encode(JSON.stringify(obj));
}

function deserializeRecord(bytes: Uint8Array): MemoryRecord {
  const json = new TextDecoder().decode(bytes);
  const obj = JSON.parse(json) as SerializedRecord;

  // Backfill provenance/temporalClass when reading older chunks that predate
  // the schema extension — the service layer assumes these are always present.
  const provenance: MemoryProvenance = obj.provenance ?? {
    scope: 'project',
    visibility: 'internal',
    domains: [],
  };
  const temporalClass: TemporalClass =
    obj.temporalClass ?? inferTemporalClass(obj.type, provenance.scope);

  return {
    id: obj.id,
    name: obj.name,
    description: obj.description,
    type: obj.type,
    tags: obj.tags,
    confidence: obj.confidence,
    content: obj.content,
    lodCurrent: obj.lodCurrent,
    validFrom: new Date(obj.validFrom),
    validTo: obj.validTo ? new Date(obj.validTo) : null,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
    lastAccessed: obj.lastAccessed ? new Date(obj.lastAccessed) : new Date(obj.createdAt),
    accessCount: obj.accessCount,
    relatedTo: obj.relatedTo,
    sourceSession: obj.sourceSession ?? undefined,
    sourceFile: obj.sourceFile ?? undefined,
    provenance,
    temporalClass,
  };
}

// ─── Scoring (same algorithm as file-store.ts) ──────────────────────────────

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token (matches GPT-family tokenizers).
  return Math.ceil(text.length / 4);
}

function scoreRecord(record: MemoryRecord, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const name = record.name.toLowerCase();
  const description = record.description.toLowerCase();
  const content = record.content.toLowerCase();
  const tags = record.tags.map((t) => t.toLowerCase()).join(' ');

  let score = 0;
  for (const kw of keywords) {
    if (name.includes(kw)) score += 3;
    if (description.includes(kw)) score += 2;
    if (tags.includes(kw)) score += 2;
    if (content.includes(kw)) score += 1;
  }
  return score;
}

// ─── ArenaFileStore ─────────────────────────────────────────────────────────

/**
 * Options for constructing an ArenaFileStore. The arena must already
 * be initialized (via `RustArena.init()`) before being passed in.
 */
export interface ArenaFileStoreOptions {
  /**
   * The initialized RustArena instance. Caller is responsible for
   * `init()` and for calling `checkpoint()` at idle points.
   */
  arena: RustArena;
  /**
   * Which tier to store records in. Defaults to 'blob' (arbitrary
   * payload). 'warm' makes sense for hot working sets.
   */
  tier?: TierKind;
}

/**
 * Memory store backed by the Rust memory arena. Implements the same
 * MemoryStore interface as FileStore so either can be swapped in without
 * touching upstream code.
 *
 * Call `loadIndex()` once after construction (or after the underlying
 * arena is recovered from a checkpoint) to rebuild the ID→chunkId map.
 */
export class ArenaFileStore implements MemoryStore {
  readonly lod = LodLevel.DETAILED;

  private readonly arena: RustArena;
  private readonly tier: TierKind;

  /** Map from memory record id (string) to arena chunk id (number). */
  private idIndex: Map<string, number> = new Map();

  /** Flag indicating whether loadIndex has been called. */
  private indexLoaded = false;

  constructor(options: ArenaFileStoreOptions) {
    this.arena = options.arena;
    this.tier = options.tier ?? 'blob';
  }

  // ─── Index management ────────────────────────────────────────────────────

  /**
   * Rebuild the id→chunkId map by iterating all chunks in the arena
   * and parsing each payload to extract the record id. O(N) — call
   * once at startup or after arena recovery.
   */
  async loadIndex(): Promise<void> {
    this.idIndex.clear();
    const chunkIds = await this.arena.listIds();
    for (const chunkId of chunkIds) {
      try {
        const chunk = await this.arena.get(chunkId);
        const record = deserializeRecord(chunk.payload);
        this.idIndex.set(record.id, chunkId);
      } catch {
        // Skip unparseable chunks — might be other tiers sharing the arena.
      }
    }
    this.indexLoaded = true;
  }

  /** Current size of the id index. */
  indexSize(): number {
    return this.idIndex.size;
  }

  /** True if loadIndex has been called. */
  isIndexLoaded(): boolean {
    return this.indexLoaded;
  }

  // ─── MemoryStore implementation ──────────────────────────────────────────

  /**
   * Store a memory record. If a record with the same id already exists,
   * it is replaced (old chunk freed, new chunk allocated — ids on both
   * sides are stable from the caller's perspective).
   */
  async store(record: MemoryRecord): Promise<void> {
    await this.ensureIndexLoaded();

    // Stamp updatedAt on every store.
    const toStore: MemoryRecord = { ...record, updatedAt: new Date() };
    const payload = serializeRecord(toStore);

    // Replace existing chunk if one exists for this id.
    const existingChunkId = this.idIndex.get(record.id);
    if (existingChunkId !== undefined) {
      await this.arena.free(existingChunkId);
      this.idIndex.delete(record.id);
    }

    const chunkId = await this.arena.alloc(this.tier, payload);
    this.idIndex.set(record.id, chunkId);
  }

  /**
   * Retrieve a memory by ID. Bumps the arena-side access count (via
   * `touch()`) and also updates the record's in-payload `lastAccessed`
   * and `accessCount` by rewriting. The rewrite is a 2x cost on read;
   * callers that don't need access tracking should consider reading
   * without touch.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    await this.ensureIndexLoaded();

    const chunkId = this.idIndex.get(id);
    if (chunkId === undefined) return null;

    const chunk = await this.arena.get(chunkId);
    const record = deserializeRecord(chunk.payload);
    if (record.id !== id) {
      // Index is stale — the chunk was replaced. Fix by removing and
      // returning null.
      this.idIndex.delete(id);
      return null;
    }

    // Update access metadata in the record itself and rewrite.
    record.lastAccessed = new Date();
    record.accessCount += 1;

    // Fast path: arena-side touch is a nanosecond-level no-payload op.
    await this.arena.touch(chunkId);
    // Rewrite the chunk with updated metadata. This is the expensive part.
    // Users who don't care about persistent access counts can bypass `get`
    // for read-only queries and use query() instead.
    await this.store(record);

    return record;
  }

  /**
   * Query memories by keyword search across all chunks in the index.
   * Applies type/tag/temporal filters and returns results sorted by
   * relevance score descending.
   *
   * Note: this loads every indexed record into memory to score it,
   * which is O(N). For large arenas, callers should prefer tier-routed
   * queries (semantic search via Chroma, structured queries via
   * PostgreSQL) and treat this as a last-resort scan.
   */
  async query(q: MemoryQuery): Promise<MemoryResult[]> {
    await this.ensureIndexLoaded();

    const keywords = q.text
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 0);

    const results: MemoryResult[] = [];

    for (const chunkId of this.idIndex.values()) {
      let chunk;
      try {
        chunk = await this.arena.get(chunkId);
      } catch {
        continue; // chunk gone underneath us; skip.
      }
      let record: MemoryRecord;
      try {
        record = deserializeRecord(chunk.payload);
      } catch {
        continue;
      }

      // Type filter
      if (q.type && record.type !== q.type) continue;

      // Tag filter
      if (q.tags && q.tags.length > 0) {
        const recordTagsLower = record.tags.map((t) => t.toLowerCase());
        const hasMatchingTag = q.tags.some((t) =>
          recordTagsLower.includes(t.toLowerCase()),
        );
        if (!hasMatchingTag) continue;
      }

      // Temporal filter
      if (q.asOf) {
        if (record.validFrom > q.asOf) continue;
        if (record.validTo && record.validTo < q.asOf) continue;
      }

      const score = scoreRecord(record, keywords);
      if (score <= 0) continue;

      results.push({
        record,
        score,
        sourceLod: LodLevel.DETAILED,
        tokenEstimate: estimateTokens(record.content),
      });
    }

    results.sort((a, b) => b.score - a.score);

    const limit = q.limit ?? results.length;
    return results.slice(0, limit);
  }

  /**
   * Remove a memory record from the store. Returns true if a record
   * was removed, false if the id was not found.
   *
   * Note: the arena chunk id is freed but NOT reused (the arena's
   * monotonic id counter guarantees id stability).
   */
  async remove(id: string): Promise<boolean> {
    await this.ensureIndexLoaded();

    const chunkId = this.idIndex.get(id);
    if (chunkId === undefined) return false;

    await this.arena.free(chunkId);
    this.idIndex.delete(id);
    return true;
  }

  /** Check whether a memory exists in the store. */
  async has(id: string): Promise<boolean> {
    await this.ensureIndexLoaded();
    return this.idIndex.has(id);
  }

  /** Count memories in the store. */
  async count(): Promise<number> {
    await this.ensureIndexLoaded();
    return this.idIndex.size;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async ensureIndexLoaded(): Promise<void> {
    if (!this.indexLoaded) {
      await this.loadIndex();
    }
  }
}
