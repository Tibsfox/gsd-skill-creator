/**
 * LOD 100 — Process Memory (RAM Cache)
 *
 * In-process memory store for the fastest tier of the LOD memory system.
 * Session lifetime only — no persistence across process restarts.
 *
 * Performance: <1ms for all operations (Map-backed).
 * Token budget: ~100 tokens wake-up context.
 * Eviction: LRU when maxSize exceeded.
 *
 * @module memory/ram-cache
 */

import { LodLevel } from '../lod/types.js';
import type {
  MemoryRecord,
  MemoryQuery,
  MemoryResult,
  MemoryStore,
} from './types.js';

// ─── Token Estimation ───────────────────────────────────────────────────────

/** Rough token estimate: ~4 chars per token (English text average). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Keyword Scoring ────────────────────────────────────────────────────────

/**
 * Tokenize a string into lowercase keywords, stripping punctuation.
 * Filters out single-character tokens and common stop words.
 */
function tokenize(text: string): Set<string> {
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'is', 'it', 'this', 'that', 'with', 'as', 'by', 'from', 'are',
    'was', 'be', 'has', 'had', 'have', 'not', 'no', 'do', 'does', 'did',
  ]);
  const words = text.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
  const tokens = new Set<string>();
  for (const w of words) {
    if (w.length > 1 && !STOP_WORDS.has(w)) {
      tokens.add(w);
    }
  }
  return tokens;
}

/**
 * Score a memory record against a set of query keywords.
 * Returns a value between 0.0 and 1.0 based on keyword overlap
 * across name, description, content, and tags.
 *
 * Weighting:
 *   name        — 3x (most signal-dense)
 *   tags        — 2x
 *   description — 1.5x
 *   content     — 1x
 */
function keywordScore(record: MemoryRecord, queryTokens: Set<string>): number {
  if (queryTokens.size === 0) return 0;

  const nameTokens = tokenize(record.name);
  const descTokens = tokenize(record.description);
  const contentTokens = tokenize(record.content);
  const tagTokens = tokenize(record.tags.join(' '));

  let weightedHits = 0;
  let maxPossible = 0;

  for (const qt of queryTokens) {
    // Name match (weight 3)
    if (nameTokens.has(qt)) weightedHits += 3;
    maxPossible += 3;

    // Tag match (weight 2)
    if (tagTokens.has(qt)) weightedHits += 2;
    maxPossible += 2;

    // Description match (weight 1.5)
    if (descTokens.has(qt)) weightedHits += 1.5;
    maxPossible += 1.5;

    // Content match (weight 1)
    if (contentTokens.has(qt)) weightedHits += 1;
    maxPossible += 1;
  }

  return maxPossible > 0 ? weightedHits / maxPossible : 0;
}

// ─── RamCache Implementation ────────────────────────────────────────────────

/** Configuration for the RAM cache. */
export interface RamCacheConfig {
  /** Maximum number of records before LRU eviction (default: 50). */
  maxSize?: number;

  /** Number of top memories for wake-up context (default: 5). */
  wakeUpCount?: number;
}

/**
 * LOD 100 in-process memory store.
 *
 * Uses a Map for O(1) lookups and maintains LRU ordering via
 * the `lastAccessed` timestamp on each record.
 */
export class RamCache implements MemoryStore {
  readonly lod = LodLevel.CONCEPT;  // LOD 100

  private readonly records = new Map<string, MemoryRecord>();
  private readonly maxSize: number;
  private readonly wakeUpCount: number;

  constructor(config: RamCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 50;
    this.wakeUpCount = config.wakeUpCount ?? 5;
  }

  /**
   * Store a memory record in the RAM cache.
   * If the record already exists, increments accessCount and updates lastAccessed.
   * Evicts the least-recently-accessed record when maxSize is exceeded.
   */
  async store(record: MemoryRecord): Promise<void> {
    const existing = this.records.get(record.id);
    if (existing) {
      // Update existing: bump access stats, merge content
      existing.accessCount += 1;
      existing.lastAccessed = new Date();
      existing.updatedAt = new Date();
      existing.content = record.content;
      existing.description = record.description;
      existing.name = record.name;
      existing.tags = record.tags;
      existing.confidence = record.confidence;
      existing.lodCurrent = record.lodCurrent;
      return;
    }

    // Evict LRU if at capacity
    if (this.records.size >= this.maxSize) {
      this.evictLru();
    }

    // Store with initial access stats
    const now = new Date();
    this.records.set(record.id, {
      ...record,
      lastAccessed: now,
      accessCount: record.accessCount + 1,
      lodCurrent: LodLevel.CONCEPT, // LOD 100
    });
  }

  /**
   * Query the RAM cache using keyword matching.
   * Score combines keyword overlap (70%) and access frequency (30%).
   */
  async query(q: MemoryQuery): Promise<MemoryResult[]> {
    const queryTokens = tokenize(q.text);
    const limit = q.limit ?? 10;
    const results: MemoryResult[] = [];

    // Find the maximum access count for normalization
    let maxAccess = 1;
    for (const record of this.records.values()) {
      if (record.accessCount > maxAccess) maxAccess = record.accessCount;
    }

    for (const record of this.records.values()) {
      // Type filter
      if (q.type && record.type !== q.type) continue;

      // Tag filter
      if (q.tags && q.tags.length > 0) {
        const hasTag = q.tags.some(t => record.tags.includes(t));
        if (!hasTag) continue;
      }

      // Temporal filter
      if (q.asOf) {
        if (record.validFrom > q.asOf) continue;
        if (record.validTo && record.validTo < q.asOf) continue;
      }

      // Keyword score (70% weight)
      const kScore = keywordScore(record, queryTokens);

      // Access frequency score (30% weight) — normalized
      const freqScore = record.accessCount / maxAccess;

      const combinedScore = kScore * 0.7 + freqScore * 0.3;

      // Only include results with non-zero keyword relevance
      if (kScore > 0) {
        results.push({
          record,
          score: Math.min(combinedScore, 1.0),
          sourceLod: LodLevel.CONCEPT,
          tokenEstimate: estimateTokens(record.content),
        });
      }
    }

    // Sort by score descending, then by lastAccessed descending
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.record.lastAccessed.getTime() - a.record.lastAccessed.getTime();
    });

    // Apply limit
    const limited = results.slice(0, limit);

    // Apply token budget if specified
    if (q.tokenBudget) {
      let tokenSum = 0;
      const budgeted: MemoryResult[] = [];
      for (const r of limited) {
        if (tokenSum + r.tokenEstimate > q.tokenBudget) break;
        tokenSum += r.tokenEstimate;
        budgeted.push(r);
      }
      return budgeted;
    }

    // Touch accessed records
    for (const r of limited) {
      r.record.lastAccessed = new Date();
      r.record.accessCount += 1;
    }

    return limited;
  }

  /**
   * Retrieve a specific memory by ID.
   * Updates access stats on retrieval.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    const record = this.records.get(id);
    if (!record) return null;

    // Update access stats
    record.lastAccessed = new Date();
    record.accessCount += 1;

    return record;
  }

  /**
   * Remove a memory from the RAM cache.
   * Returns true if the record existed and was removed.
   */
  async remove(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  /** Check if a memory exists in the RAM cache. */
  async has(id: string): Promise<boolean> {
    return this.records.has(id);
  }

  /** Count memories currently in the RAM cache. */
  async count(): Promise<number> {
    return this.records.size;
  }

  /**
   * Generate wake-up context string from the top-N most relevant memories.
   *
   * Returns a compact multi-line string suitable for context injection,
   * ordered by access frequency (most-used first). Targets ~100 tokens.
   *
   * Format:
   * ```
   * [RAM L0] <name> — <description> (accessed <N>x)
   * ```
   */
  getWakeUpContext(): string {
    if (this.records.size === 0) return '';

    // Sort by access count desc, then lastAccessed desc
    const sorted = [...this.records.values()].sort((a, b) => {
      if (b.accessCount !== a.accessCount) return b.accessCount - a.accessCount;
      return b.lastAccessed.getTime() - a.lastAccessed.getTime();
    });

    const top = sorted.slice(0, this.wakeUpCount);
    const lines: string[] = [];

    for (const r of top) {
      // Truncate description to keep within token budget
      const desc = r.description.length > 80
        ? r.description.slice(0, 77) + '...'
        : r.description;
      lines.push(`[RAM L0] ${r.name} — ${desc} (accessed ${r.accessCount}x)`);
    }

    return lines.join('\n');
  }

  /**
   * Get all records currently in the cache.
   * Does NOT update access stats (read-only inspection).
   */
  getAll(): MemoryRecord[] {
    return [...this.records.values()];
  }

  /** Clear all records from the cache. */
  clear(): void {
    this.records.clear();
  }

  /** Current size of the cache. */
  get size(): number {
    return this.records.size;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /** Evict the least-recently-accessed record. */
  private evictLru(): void {
    let lruId: string | null = null;
    let lruTime = Infinity;

    for (const [id, record] of this.records) {
      const accessed = record.lastAccessed.getTime();
      if (accessed < lruTime) {
        lruTime = accessed;
        lruId = id;
      }
    }

    if (lruId) {
      this.records.delete(lruId);
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

/** Default singleton RAM cache instance. */
export const ramCache = new RamCache();
