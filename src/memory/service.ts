/**
 * Unified Memory Service — orchestrator across all LOD tiers.
 *
 * The main entry point for all memory operations. Coordinates across
 * tier stores (LOD 100 RAM, LOD 200 Index, LOD 300 Files, LOD 350 Vectors,
 * LOD 400 Database) and handles cascading queries, promotion/demotion,
 * and maintenance.
 *
 * @module memory/service
 */

import { randomUUID } from 'node:crypto';
import { LodLevel } from '../lod/types.js';
import type { LodContext } from '../lod/types.js';
import { LodService } from '../lod/service.js';
import type {
  MemoryRecord,
  MemoryType,
  MemoryRelation,
  RelationType,
  MemoryQuery,
  MemoryResult,
  MemoryQueryResponse,
  MemoryStore,
  MemoryStats,
  PromotionRule,
  DemotionRule,
} from './types.js';
import {
  DEFAULT_PROMOTIONS, DEFAULT_DEMOTIONS, inferTemporalClass,
  temporalRelevance, scopeRelevance,
} from './types.js';
import { RamCache } from './ram-cache.js';
import { IndexManager } from './index-manager.js';
import { FileStore } from './file-store.js';
import { ArenaFileStore } from './arena-file-store.js';
import type { RustArena, TierKind } from './rust-arena.js';
import { ChromaStore } from './chroma-store.js';
import type { ChromaPreloadResult } from './chroma-store.js';
import {
  hybridRerank, scoreToDistance, distanceToScore,
} from './hybrid-scorer.js';
import type { ScoredDocument } from './hybrid-scorer.js';

// ─── Config ─────────────────────────────────────────────────────────────────

/**
 * Configuration for the LOD 300 backing store.
 *
 * By default, LOD 300 uses the directory-backed `FileStore` — one markdown
 * file per record. Callers who want the in-RAM Amiga-style arena (checkpoint
 * + journal, O(1) alloc, crash-recoverable) can set `backend: 'arena'` and
 * supply an initialized `RustArena`. See `memory/amiga-ram-storage-design.md`
 * for the rationale.
 *
 * Rollback is a single config flip: remove `lod300` (or set `backend: 'file'`)
 * and the service reverts to FileStore with no data migration — arenas and
 * file directories are independent stores.
 */
export interface Lod300Config {
  /** Which backend to use for LOD 300. Defaults to 'file'. */
  backend: 'file' | 'arena';
  /**
   * The initialized RustArena instance. Required when `backend: 'arena'`.
   * Caller is responsible for calling `arena.init()` before passing it in
   * and for calling `arena.checkpoint()` at idle points.
   */
  arena?: RustArena;
  /**
   * Which tier to store records in. Defaults to 'blob' (arbitrary
   * payload). Ignored when `backend: 'file'`.
   */
  arenaTier?: TierKind;
}

/** Configuration for the unified memory service. */
export interface MemoryServiceConfig {
  /** Directory for LOD 300 memory files. */
  memoryDir: string;

  /** Path to MEMORY.md for LOD 200 index. */
  indexPath: string;

  /** ChromaDB path for LOD 350 (optional). */
  chromaPath?: string;

  /** PostgreSQL connection string for LOD 400 (optional, not implemented yet). */
  pgConnectionString?: string;

  /** RAM cache max size for LOD 100. */
  ramCacheSize?: number;

  /**
   * LOD 300 backing store configuration. Omit to use the default
   * directory-backed FileStore. Set `backend: 'arena'` to use the
   * Rust memory arena (requires an initialized RustArena).
   */
  lod300?: Lod300Config;
}

// ─── Token Estimation ───────────────────────────────────────────────────────

/** Estimate token count from text. Approximately 4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Tier Ordering ──────────────────────────────────────────────────────────

/** LOD tiers in cascade order (fastest first). */
const CASCADE_ORDER: LodLevel[] = [
  LodLevel.CONCEPT,       // 100 — RAM cache
  LodLevel.SCHEMATIC,     // 200 — MEMORY.md index
  LodLevel.DETAILED,      // 300 — File store
  LodLevel.CONSTRUCTION,  // 350 — ChromaDB vectors
  LodLevel.FABRICATION,   // 400 — PostgreSQL (future)
];

// ─── Memory Service ─────────────────────────────────────────────────────────

export class MemoryService {
  private stores: Map<LodLevel, MemoryStore>;
  private lodService: LodService;
  private relations: MemoryRelation[] = [];

  constructor(config: MemoryServiceConfig) {
    this.lodService = new LodService();
    this.stores = new Map();

    // LOD 100 — RAM cache
    const ramCache = new RamCache({ maxSize: config.ramCacheSize ?? 256 });
    this.stores.set(LodLevel.CONCEPT, ramCache);

    // LOD 200 — MEMORY.md index
    const indexManager = new IndexManager({ memoryDir: config.memoryDir, indexFile: config.indexPath });
    this.stores.set(LodLevel.SCHEMATIC, indexManager);

    // LOD 300 — File store (default) or Arena-backed store (opt-in).
    // Rollback: remove config.lod300 and the service reverts to FileStore.
    // Arena and file backends are independent — no data migration path.
    if (config.lod300?.backend === 'arena') {
      if (!config.lod300.arena) {
        throw new Error(
          'MemoryService: lod300.backend="arena" requires lod300.arena (an initialized RustArena)'
        );
      }
      const arenaStore = new ArenaFileStore({
        arena: config.lod300.arena,
        tier: config.lod300.arenaTier,
      });
      this.stores.set(LodLevel.DETAILED, arenaStore);
    } else {
      const fileStore = new FileStore(config.memoryDir);
      this.stores.set(LodLevel.DETAILED, fileStore);
    }

    // LOD 350 — ChromaDB vectors (optional)
    if (config.chromaPath) {
      const chromaStore = new ChromaStore(config.chromaPath);
      this.stores.set(LodLevel.CONSTRUCTION, chromaStore);
    }

    // LOD 400 — PostgreSQL (Phase 2, not implemented yet)
    // if (config.pgConnectionString) { ... }
  }

  // ─── Query ──────────────────────────────────────────────────────────────

  /**
   * Unified query across tiers.
   *
   * Uses the LOD service to determine which tiers to search.
   * If `cascade: true`, starts at LOD 100 and searches each tier in order
   * until `minResults` is met. Merges results from all searched tiers,
   * deduplicates by ID (keeping the highest score), and respects `tokenBudget`.
   *
   * @param text - The search text.
   * @param options - Query options (type, tags, cascade, tokenBudget, etc).
   * @returns Aggregated query response with timing and tier metadata.
   */
  async query(text: string, options?: Partial<Omit<MemoryQuery, 'text'>>): Promise<MemoryQueryResponse> {
    const start = performance.now();
    const q: MemoryQuery = { text, ...options };

    const tiersToSearch = this.resolveTiers(q);
    const tiersSearched: LodLevel[] = [];
    const allResults = new Map<string, MemoryResult>(); // dedup by ID, keep highest score

    for (const tier of tiersToSearch) {
      const store = this.stores.get(tier);
      if (!store) continue;

      tiersSearched.push(tier);
      const results = await store.query(q);

      for (const result of results) {
        const existing = allResults.get(result.record.id);
        if (!existing || result.score > existing.score) {
          allResults.set(result.record.id, result);
        }
      }

      // Cascade early-out: stop once we have enough results
      if (q.cascade && q.minResults !== undefined && allResults.size >= q.minResults) {
        break;
      }
    }

    // ─── Hybrid Reranking ──────────────────────────────────────────────
    // Convert to ScoredDocuments, run hybrid rerank, convert back.
    // This applies keyword overlap, quoted phrase, person name, and
    // temporal proximity signals — the heuristics that push retrieval
    // from 96.6% to 98.4% on LongMemEval with zero LLM calls.

    let merged = Array.from(allResults.values());

    if (merged.length > 1) {
      const scoredDocs: ScoredDocument[] = merged.map(r => ({
        id: r.record.id,
        text: r.record.content,
        rawDistance: scoreToDistance(r.score),
        date: r.record.createdAt,
      }));

      const reranked = hybridRerank(text, scoredDocs, new Date());

      // Map back to MemoryResult[] preserving the record references
      const idToResult = new Map(merged.map(r => [r.record.id, r]));
      merged = reranked.map(rr => {
        const original = idToResult.get(rr.doc.id)!;
        return {
          ...original,
          score: distanceToScore(rr.fusedDistance),
        };
      });
    }

    // ─── Temporal Decay ───────────────────────────────────────────────
    // Older memories score lower based on their temporal class.
    // Timeless memories are unaffected. Ephemeral memories decay fast.

    if (q.applyTemporalDecay !== false) {
      const now = Date.now();
      merged = merged.map(r => {
        const ageDays = (now - r.record.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const decay = temporalRelevance(r.record.temporalClass, ageDays);
        return { ...r, score: r.score * decay };
      });
    }

    // ─── Scope Relevance ──────────────────────────────────────────────
    // Memories from the current project/branch score higher than
    // memories from other projects. Global memories always contribute.

    if (q.applyScopeRelevance !== false && q.queryContext) {
      merged = merged.map(r => {
        const proximity = scopeRelevance(r.record.provenance, q.queryContext!);
        return { ...r, score: r.score * proximity };
      });
    }

    // ─── Sort, Limit, Budget ──────────────────────────────────────────

    // Sort by score descending (after all re-ranking)
    let sorted = merged.sort((a, b) => b.score - a.score);

    // Apply limit
    if (q.limit !== undefined) {
      sorted = sorted.slice(0, q.limit);
    }

    // Apply token budget
    if (q.tokenBudget !== undefined) {
      const budgeted: MemoryResult[] = [];
      let used = 0;
      for (const result of sorted) {
        const tokens = estimateTokens(result.record.content);
        if (used + tokens > q.tokenBudget) break;
        budgeted.push({ ...result, tokenEstimate: tokens });
        used += tokens;
      }
      sorted = budgeted;
    } else {
      sorted = sorted.map(r => ({
        ...r,
        tokenEstimate: r.tokenEstimate || estimateTokens(r.record.content),
      }));
    }

    const totalTokens = sorted.reduce((sum, r) => sum + r.tokenEstimate, 0);

    return {
      results: sorted,
      tiersSearched,
      queryTimeMs: performance.now() - start,
      totalTokens,
    };
  }

  // ─── Store ──────────────────────────────────────────────────────────────

  /**
   * Store a new memory record.
   *
   * Assigns a UUID if not present. Stores at LOD 300 (file store) immediately.
   * Queues background promotion to LOD 350 and 400. If high confidence and
   * frequently accessed, also promotes to LOD 200 index.
   *
   * @param record - The memory record to store.
   * @returns The stored record (with ID assigned).
   */
  async store(record: MemoryRecord): Promise<MemoryRecord> {
    // Assign ID if missing
    if (!record.id) {
      record.id = randomUUID();
    }

    // Ensure timestamps
    const now = new Date();
    if (!record.createdAt) record.createdAt = now;
    if (!record.updatedAt) record.updatedAt = now;
    if (!record.validFrom) record.validFrom = now;
    if (!record.lastAccessed) record.lastAccessed = now;

    // Store at LOD 300 (file store) immediately
    const fileStore = this.stores.get(LodLevel.DETAILED);
    if (fileStore) {
      await fileStore.store(record);
      record.lodCurrent = LodLevel.DETAILED;
    }

    // Background promotion to LOD 350 (ChromaDB) if available
    const chromaStore = this.stores.get(LodLevel.CONSTRUCTION);
    if (chromaStore) {
      chromaStore.store(record).catch(() => {
        // Silently fail — vectors are optional enhancement
      });
    }

    // If high confidence + frequently accessed, promote to LOD 200 index
    if (record.confidence >= 0.8 && record.accessCount >= 5) {
      const indexStore = this.stores.get(LodLevel.SCHEMATIC);
      if (indexStore) {
        await indexStore.store(record);
        record.lodCurrent = LodLevel.SCHEMATIC;
      }
    }

    return record;
  }

  // ─── Remember ───────────────────────────────────────────────────────────

  /**
   * Convenience method for creating and storing a memory.
   *
   * Creates a MemoryRecord from the parameters and calls `store()`.
   *
   * @param text - The memory content.
   * @param type - Memory classification.
   * @param name - Short name for indexing.
   * @param description - One-line description for relevance matching.
   * @returns The stored memory record.
   */
  async remember(
    text: string,
    type: MemoryType,
    name: string,
    description?: string,
  ): Promise<MemoryRecord> {
    const now = new Date();
    const record: MemoryRecord = {
      id: randomUUID(),
      type,
      name,
      description: description ?? name,
      content: text,
      lodCurrent: LodLevel.DETAILED,
      tags: [],
      confidence: 0.5,
      validFrom: now,
      validTo: null,
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      accessCount: 0,
      provenance: { scope: 'project', visibility: 'internal', domains: [] },
      temporalClass: inferTemporalClass(type, 'project'),
      relatedTo: [],
    };
    return this.store(record);
  }

  // ─── Recall ─────────────────────────────────────────────────────────────

  /**
   * Convenience method for querying memories.
   *
   * Wraps `query()` with LodContext-based LOD resolution.
   * Returns just the content strings (not full MemoryResult objects).
   *
   * @param text - The search text.
   * @param context - Optional LOD context for resolution.
   * @returns Array of content strings from matching memories.
   */
  async recall(text: string, context?: LodContext): Promise<string[]> {
    const maxLod = context
      ? this.lodService.resolve(context)
      : undefined;

    const response = await this.query(text, {
      maxLod,
      cascade: true,
      minResults: 3,
    });

    return response.results.map(r => r.record.content);
  }

  // ─── Relate ─────────────────────────────────────────────────────────────

  /**
   * Create a relation between two memories.
   *
   * If the predicate is 'supersedes' or 'contradicts', marks the object
   * memory with a `validTo` timestamp (deprecating it).
   *
   * @param subjectId - The source memory ID.
   * @param predicate - The relation type.
   * @param objectId - The target memory ID.
   */
  async relate(subjectId: string, predicate: RelationType, objectId: string): Promise<void> {
    const relation: MemoryRelation = {
      id: randomUUID(),
      subjectId,
      predicate,
      objectId,
      validFrom: new Date(),
      validTo: null,
      confidence: 1.0,
      createdAt: new Date(),
    };

    this.relations.push(relation);

    // If supersedes or contradicts, deprecate the object memory
    if (predicate === 'supersedes' || predicate === 'contradicts') {
      await this.deprecate(objectId, `${predicate} by ${subjectId}`);
    }
  }

  // ─── Deprecate ──────────────────────────────────────────────────────────

  /**
   * Mark a memory as no longer valid.
   *
   * Sets `validTo` to the current time. Optionally creates a new memory
   * explaining the deprecation reason.
   *
   * @param id - The memory ID to deprecate.
   * @param reason - Optional explanation for deprecation.
   */
  async deprecate(id: string, reason?: string): Promise<void> {
    const now = new Date();

    // Update across all tiers
    for (const store of this.stores.values()) {
      const record = await store.get(id);
      if (record) {
        record.validTo = now;
        record.updatedAt = now;
        await store.store(record);
      }
    }

    // Optionally record the reason as a new memory
    if (reason) {
      await this.remember(
        `Memory ${id} deprecated: ${reason}`,
        'semantic',
        `deprecation-${id.slice(0, 8)}`,
        `Deprecation notice for memory ${id}`,
      );
    }
  }

  // ─── Wake-Up Context ────────────────────────────────────────────────────

  /**
   * Get the context string for session start.
   *
   * Pulls from LOD 100 (RAM cache hot memories) and LOD 200 (MEMORY.md index)
   * to build a formatted context string with a token estimate.
   *
   * @returns Formatted context string with token estimate.
   */
  async getWakeUpContext(): Promise<{ context: string; tokenEstimate: number }> {
    const sections: string[] = [];

    // LOD 100 — RAM cache hot memories
    const ramStore = this.stores.get(LodLevel.CONCEPT);
    if (ramStore) {
      const ramResults = await ramStore.query({ text: '', limit: 50 });
      if (ramResults.length > 0) {
        sections.push('## Hot Memory (RAM Cache)');
        for (const r of ramResults) {
          sections.push(`- **${r.record.name}**: ${r.record.description}`);
        }
        sections.push('');
      }
    }

    // LOD 200 — MEMORY.md index
    const indexStore = this.stores.get(LodLevel.SCHEMATIC);
    if (indexStore) {
      const indexResults = await indexStore.query({ text: '', limit: 100 });
      if (indexResults.length > 0) {
        sections.push('## Memory Index');
        for (const r of indexResults) {
          sections.push(`- **${r.record.name}**: ${r.record.description}`);
        }
        sections.push('');
      }
    }

    const context = sections.join('\n');
    return {
      context,
      tokenEstimate: estimateTokens(context),
    };
  }

  // ─── Preload (M10) ──────────────────────────────────────────────────────

  /**
   * Warm up the vector tier at startup so the first semantic query doesn't
   * pay the HNSW cold-load cost.
   *
   * Call this explicitly after constructing the service — typically once at
   * session start, after any arena recovery. It's safe to call multiple
   * times (subsequent calls are cheap). It's safe to call when ChromaDB
   * isn't configured or available (returns `{ available: false }`).
   *
   * See LTM-07 research for the empirical backing: Chroma's HNSW loader
   * runs lazily on first query, and for production corpora that first
   * query can stall multi-seconds. Preloading moves that cost to startup
   * where it's invisible to interactive workflows.
   *
   * @returns Preload result with availability flag, record count, and
   *   elapsed milliseconds. Returns a synthetic "not available" result
   *   when the LOD 350 store isn't configured.
   */
  async preload(): Promise<ChromaPreloadResult> {
    const chromaStore = this.stores.get(LodLevel.CONSTRUCTION);
    if (!chromaStore || !(chromaStore instanceof ChromaStore)) {
      return { available: false, count: 0, warmed: false, elapsedMs: 0 };
    }
    return chromaStore.preload();
  }

  // ─── Promote / Demote ───────────────────────────────────────────────────

  /**
   * Promote a memory to a higher LOD tier.
   *
   * Reads the memory from its current tier and writes it to the target tier.
   *
   * @param id - The memory ID to promote.
   * @param targetLod - The target LOD tier.
   */
  async promote(id: string, targetLod: LodLevel): Promise<void> {
    // Find the record in any tier
    const record = await this.findRecord(id);
    if (!record) return;

    const targetStore = this.stores.get(targetLod);
    if (!targetStore) return;

    await targetStore.store(record);
    record.lodCurrent = targetLod;
  }

  /**
   * Remove a memory from a specific tier (keeps it at lower tiers).
   *
   * @param id - The memory ID to demote.
   * @param sourceLod - The LOD tier to remove from.
   */
  async demote(id: string, sourceLod: LodLevel): Promise<void> {
    const store = this.stores.get(sourceLod);
    if (!store) return;

    await store.remove(id);
  }

  // ─── Maintenance ────────────────────────────────────────────────────────

  /**
   * Run promotion/demotion rules across all memories.
   *
   * Checks all memories against `DEFAULT_PROMOTIONS` and `DEFAULT_DEMOTIONS`,
   * applying automatic tier changes as needed.
   *
   * @returns Stats on what changed (promoted, demoted counts).
   */
  async runMaintenance(): Promise<{ promoted: number; demoted: number }> {
    let promoted = 0;
    let demoted = 0;
    const now = new Date();

    // Collect all unique records from all stores
    const allRecords = await this.collectAllRecords();

    // Check promotion rules
    for (const record of allRecords.values()) {
      for (const rule of DEFAULT_PROMOTIONS) {
        if (this.shouldPromote(record, rule, now)) {
          const targetStore = this.stores.get(rule.targetLod);
          if (targetStore && !(await targetStore.has(record.id))) {
            await targetStore.store(record);
            promoted++;
          }
        }
      }
    }

    // Check demotion rules
    for (const record of allRecords.values()) {
      for (const rule of DEFAULT_DEMOTIONS) {
        if (this.shouldDemote(record, rule, now)) {
          const store = this.stores.get(rule.sourceLod);
          if (store && await store.has(record.id)) {
            await store.remove(record.id);
            demoted++;
          }
        }
      }
    }

    return { promoted, demoted };
  }

  // ─── Stats ──────────────────────────────────────────────────────────────

  /**
   * Return memory system health metrics.
   *
   * @returns Counts per tier, by type, active vs deprecated, and age range.
   */
  async getStats(): Promise<MemoryStats> {
    const tierCounts: Record<number, number> = {};
    let totalMemories = 0;
    const typeCounts: Record<MemoryType, number> = {
      user: 0, feedback: 0, project: 0,
      reference: 0, episodic: 0, semantic: 0,
    };
    let activeCount = 0;
    let deprecatedCount = 0;
    let totalAccessCount = 0;
    let oldest: Date | null = null;
    let newest: Date | null = null;

    // Collect unique records to avoid double-counting
    const allRecords = await this.collectAllRecords();

    // Tier counts
    for (const [lod, store] of this.stores) {
      tierCounts[lod] = await store.count();
    }

    // Aggregate from unique records
    for (const record of allRecords.values()) {
      totalMemories++;
      typeCounts[record.type]++;
      totalAccessCount += record.accessCount;

      if (record.validTo === null) {
        activeCount++;
      } else {
        deprecatedCount++;
      }

      if (!oldest || record.createdAt < oldest) oldest = record.createdAt;
      if (!newest || record.createdAt > newest) newest = record.createdAt;
    }

    return {
      tierCounts,
      totalMemories,
      typeCounts,
      activeCount,
      deprecatedCount,
      avgAccessCount: totalMemories > 0 ? totalAccessCount / totalMemories : 0,
      oldestMemory: oldest,
      newestMemory: newest,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Determine which tiers to search based on query options.
   */
  private resolveTiers(q: MemoryQuery): LodLevel[] {
    if (q.cascade) {
      // Start from LOD 100, go through each tier in order
      const maxLod = q.maxLod ?? LodLevel.FABRICATION;
      const minLod = q.minLod ?? LodLevel.CONCEPT;
      return CASCADE_ORDER.filter(lod => lod >= minLod && lod <= maxLod);
    }

    if (q.maxLod !== undefined || q.minLod !== undefined) {
      const maxLod = q.maxLod ?? LodLevel.FABRICATION;
      const minLod = q.minLod ?? LodLevel.CONCEPT;
      return CASCADE_ORDER.filter(lod => lod >= minLod && lod <= maxLod);
    }

    // Default: search all available tiers
    return CASCADE_ORDER.filter(lod => this.stores.has(lod));
  }

  /**
   * Find a record by ID across all stores (checks from highest LOD down).
   */
  private async findRecord(id: string): Promise<MemoryRecord | null> {
    // Search from lowest LOD up — bottom tiers are most complete
    for (const lod of [...CASCADE_ORDER].reverse()) {
      const store = this.stores.get(lod);
      if (!store) continue;
      const record = await store.get(id);
      if (record) return record;
    }
    return null;
  }

  /**
   * Collect all unique records across all stores, deduped by ID.
   */
  private async collectAllRecords(): Promise<Map<string, MemoryRecord>> {
    const all = new Map<string, MemoryRecord>();

    for (const store of this.stores.values()) {
      // Query with empty text to get all records
      const results = await store.query({ text: '', limit: 10_000 });
      for (const result of results) {
        if (!all.has(result.record.id)) {
          all.set(result.record.id, result.record);
        }
      }
    }

    return all;
  }

  /**
   * Check if a record should be promoted according to a rule.
   */
  private shouldPromote(record: MemoryRecord, rule: PromotionRule, now: Date): boolean {
    // Skip deprecated memories
    if (record.validTo !== null) return false;

    // Check access count threshold
    if (rule.minAccessCount !== undefined && record.accessCount < rule.minAccessCount) {
      return false;
    }

    // Check recency threshold
    if (rule.maxDaysSinceAccess !== undefined) {
      const daysSince = (now.getTime() - record.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > rule.maxDaysSinceAccess) return false;
    }

    // Check confidence threshold
    if (rule.minConfidence !== undefined && record.confidence < rule.minConfidence) {
      return false;
    }

    return true;
  }

  /**
   * Check if a record should be demoted according to a rule.
   */
  private shouldDemote(record: MemoryRecord, rule: DemotionRule, now: Date): boolean {
    const daysSince = (now.getTime() - record.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= rule.daysWithoutAccess;
  }
}
