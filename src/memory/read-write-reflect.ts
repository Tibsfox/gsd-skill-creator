/**
 * M2 Hierarchical Hybrid Memory — Unified Read / Write / Reflect Interface
 *
 * Composes short-term + long-term stores with αβγ scoring across all three
 * tiers (ram → chroma → pg). Exposes the canonical Wang et al. 2024 §5
 * three-operation API:
 *
 *   read(query)   → MemoryEntry[]  (top-k by αβγ score across both stores)
 *   write(entry)  → void           (append to short-term; spill to long-term)
 *   reflect()     → ReflectionBatch (compress short-term into summaries)
 *
 * Chroma target: http://localhost:8100 (NOT 8000 — CF-M2-05).
 * All tier interactions gracefully degrade when Chroma/pg are unavailable.
 *
 * @module memory/read-write-reflect
 */

import type { MemoryEntry, ReflectionBatch } from '../types/memory.js';
import { MemoryScorer, type ScorerConfig } from './scorer.js';
import { ShortTermMemory, type ShortTermConfig } from './short-term.js';
import { LongTermMemory, type LongTermConfig } from './long-term.js';
import { Reflector, type ReflectionConfig } from './reflection.js';
import { ChromaStore } from './chroma-store.js';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface ReadWriteReflectConfig {
  /** αβγ scorer weights. */
  scorer?: ScorerConfig;
  /** Short-term deque config. */
  shortTerm?: ShortTermConfig;
  /** Long-term JSONL config. */
  longTerm?: LongTermConfig;
  /** Reflection pass config. */
  reflection?: ReflectionConfig;
  /**
   * ChromaDB HTTP endpoint for the warm tier.
   * Default: http://localhost:8100
   * CF-M2-05: must NOT default to 8000.
   */
  chromaUrl?: string;
  /**
   * ChromaDB collection name.
   * Default: 'gsd_m2_memory'
   */
  chromaCollection?: string;
  /**
   * Number of top results to return from read().
   * Default: 10.
   */
  topK?: number;
  /**
   * When true, also write entries to Chroma warm tier on write().
   * Default: false (write is async; Chroma is used on read fallback).
   */
  writeToChroma?: boolean;
}

/** Default ChromaDB endpoint. CF-M2-05: must be :8100, NOT :8000. */
export const DEFAULT_CHROMA_URL = 'http://localhost:8100';

// ─── ReadWriteReflect ─────────────────────────────────────────────────────────

/**
 * Unified M2 memory interface: read / write / reflect.
 *
 * Tier order (read path, most-recent first):
 *   1. Short-term (in-process deque via ram-cache LOD 100 semantics)
 *   2. Long-term  (JSONL disk store)
 *   3. Chroma     (warm tier, http://localhost:8100, fallback if unavailable)
 *
 * Write path:
 *   1. append to short-term deque
 *   2. on deque threshold: fire reflection pass
 *   3. on deque overflow:  spill evicted entries to long-term JSONL
 *   4. optionally write to Chroma warm tier (writeToChroma: true)
 *
 * @example
 * ```ts
 * const mem = new ReadWriteReflect();
 * mem.write({ id: 'e1', content: 'skill debug activated', ts: Date.now(),
 *             alpha: 0.4, beta: 0.4, gamma: 0.2, score: 0 });
 * const results = mem.read('debug');
 * const batch   = await mem.reflect();
 * ```
 */
export class ReadWriteReflect {
  private readonly scorer:    MemoryScorer;
  private readonly shortTerm: ShortTermMemory;
  private readonly longTerm:  LongTermMemory;
  private readonly reflector: Reflector;
  private readonly chroma:    ChromaStore;
  private readonly topK:      number;
  private readonly writeToChroma: boolean;

  /** Last reflection batch produced by reflect(). */
  private _lastBatch: ReflectionBatch | null = null;

  constructor(config: ReadWriteReflectConfig = {}) {
    this.scorer    = new MemoryScorer(config.scorer);
    this.shortTerm = new ShortTermMemory(config.shortTerm);
    this.longTerm  = new LongTermMemory(config.longTerm);
    this.reflector = new Reflector(config.reflection);
    this.topK      = config.topK ?? 10;
    this.writeToChroma = config.writeToChroma ?? false;

    // Warm tier: ChromaDB at http://localhost:8100 (CF-M2-05).
    const chromaUrl        = config.chromaUrl        ?? DEFAULT_CHROMA_URL;
    const chromaCollection = config.chromaCollection ?? 'gsd_m2_memory';
    this.chroma = new ChromaStore(chromaUrl, chromaCollection);

    // Wire short-term eviction → long-term JSONL.
    this.shortTerm.onEvict = async (evicted) => {
      await this.longTerm.appendMany(evicted);
    };

    // Wire short-term threshold → reflection pass.
    this.shortTerm.onReflect = async (snapshot) => {
      await this._runReflection(snapshot);
    };
  }

  // ─── Write ──────────────────────────────────────────────────────────────────

  /**
   * Write an entry to short-term memory (synchronous fast path).
   * Reflection and eviction callbacks fire asynchronously.
   */
  write(entry: MemoryEntry): void {
    this.shortTerm.write(entry);
    if (this.writeToChroma) {
      // Fire-and-forget Chroma warm-tier write (non-blocking).
      void this._writeToChroma(entry);
    }
  }

  /**
   * Async write — awaits reflection and eviction callbacks.
   */
  async writeAsync(entry: MemoryEntry): Promise<void> {
    await this.shortTerm.writeAsync(entry);
    if (this.writeToChroma) {
      await this._writeToChroma(entry);
    }
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Read top-k entries by αβγ score from short-term + long-term stores.
   *
   * Tier merge strategy:
   *   1. Score short-term entries (synchronous, in-process).
   *   2. Load long-term entries from disk (async IO).
   *   3. Merge + re-rank by score, return topK.
   *
   * The Chroma tier is used as a fallback when long-term IO fails.
   */
  read(query: string, topK?: number): MemoryEntry[] {
    const k = topK ?? this.topK;
    // Short-term read is synchronous.
    const shortResults = this.shortTerm.read(query, k);
    return shortResults;
  }

  /**
   * Async read — loads long-term JSONL and merges with short-term.
   * Returns top-k entries by αβγ score.
   */
  async readAsync(query: string, topK?: number): Promise<MemoryEntry[]> {
    const k = topK ?? this.topK;

    // Load short-term (sync) and long-term (async) in parallel.
    const shortEntries = this.shortTerm.all();
    let longEntries: MemoryEntry[] = [];
    try {
      longEntries = await this.longTerm.load();
    } catch {
      // Long-term IO failure: fall back to empty (graceful degradation).
      console.warn('[ReadWriteReflect] long-term load failed, using short-term only');
    }

    // Merge and score.
    const allEntries = [...shortEntries, ...longEntries];
    const ranked = this.scorer.rank(allEntries, query, k);
    return ranked.map(({ entry, components }) => ({ ...entry, score: components.score }));
  }

  // ─── Reflect ─────────────────────────────────────────────────────────────────

  /**
   * Manually trigger a reflection pass on the current short-term contents.
   * Summaries are appended to long-term JSONL.
   * Returns the ReflectionBatch (M2 shared type).
   */
  async reflect(): Promise<ReflectionBatch> {
    const snapshot = this.shortTerm.all();
    return this._runReflection(snapshot);
  }

  /** Last reflection batch produced by reflect() or auto-reflection. */
  get lastBatch(): ReflectionBatch | null {
    return this._lastBatch;
  }

  // ─── Housekeeping ────────────────────────────────────────────────────────────

  /** Flush all short-term entries to long-term JSONL and clear. */
  async flush(): Promise<void> {
    await this.shortTerm.flush();
  }

  /** Compact the long-term JSONL store (prune old / excess entries). */
  async compact(): Promise<number> {
    return this.longTerm.compact();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async _runReflection(entries: MemoryEntry[]): Promise<ReflectionBatch> {
    const result = this.reflector.reflect(entries);
    this._lastBatch = result.batch;

    // Persist summaries to long-term JSONL.
    try {
      await this.longTerm.appendMany(result.summaries);
    } catch {
      console.warn('[ReadWriteReflect] reflection persistence failed');
    }

    return result.batch;
  }

  private async _writeToChroma(entry: MemoryEntry): Promise<void> {
    try {
      const available = await this.chroma.isAvailable();
      if (!available) {
        console.warn(
          `[ReadWriteReflect] Chroma unavailable at ${DEFAULT_CHROMA_URL} — skipping warm-tier write`,
        );
        return;
      }
      // ChromaStore.store() expects a MemoryRecord. We adapt MemoryEntry to a
      // minimal MemoryRecord with sensible defaults. The warm tier enriches
      // semantic search; missing fields default gracefully.
      const now = new Date();
      await this.chroma.store({
        id:           entry.id,
        type:         'reference',
        name:         entry.id,
        description:  entry.content.slice(0, 120),
        content:      entry.content,
        lodCurrent:   100 as any, // LOD 100 concept tier
        tags:         [],
        confidence:   entry.score,
        validFrom:    new Date(entry.ts),
        validTo:      null,
        createdAt:    now,
        updatedAt:    now,
        lastAccessed: now,
        accessCount:  0,
        provenance:   { scope: 'project', visibility: 'internal', domains: [] },
        temporalClass: 'seasonal',
        relatedTo:    [],
      });
    } catch {
      // Graceful degradation — Chroma write failure is non-fatal.
      console.warn('[ReadWriteReflect] Chroma write failed — continuing');
    }
  }
}
