/**
 * M2 Hierarchical Hybrid Memory — Short-Term Store
 *
 * A bounded deque over the RAM cache hot tier. When the deque hits capacity,
 * the oldest entries are evicted to the long-term store (via a pluggable
 * flush callback), after optionally running a reflection pass.
 *
 * Design decisions (OQ-2 resolution):
 *   - Reflection is triggered by COUNT threshold, not by eviction hook.
 *     When the deque hits `reflectAt` entries, a reflection callback fires
 *     before any eviction. This avoids adding an `onEvict` callback to
 *     ram-cache.ts (which stays UNTOUCHED per inventory decision).
 *   - Eviction to long-term is explicit: caller provides `onEvict` callback.
 *
 * @module memory/short-term
 */

import type { MemoryEntry } from '../types/memory.js';
import { MemoryScorer, type ScorerConfig } from './scorer.js';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface ShortTermConfig {
  /** Max entries before oldest entries are evicted. Default: 256. */
  capacity?: number;
  /**
   * Reflection threshold: fire `onReflect` when the deque reaches this size.
   * Default: half of capacity (128). Set to 0 to disable auto-reflection.
   */
  reflectAt?: number;
  /** αβγ scorer config forwarded to MemoryScorer. */
  scorer?: ScorerConfig;
}

// ─── Callback types ───────────────────────────────────────────────────────────

/** Called when entries are evicted from the short-term deque. */
export type EvictCallback = (entries: MemoryEntry[]) => void | Promise<void>;

/** Called when the deque hits the reflectAt threshold. */
export type ReflectCallback = (entries: MemoryEntry[]) => void | Promise<void>;

// ─── ShortTermMemory ──────────────────────────────────────────────────────────

/**
 * Short-term memory: bounded deque of MemoryEntry objects backed by an
 * in-process array. Fast reads (<10ms p95 on 1000-entry fixture per CF-M2-02).
 *
 * @example
 * ```ts
 * const stm = new ShortTermMemory({
 *   capacity: 256,
 *   reflectAt: 128,
 * });
 * stm.onEvict = async (evicted) => await longTerm.appendMany(evicted);
 * stm.onReflect = async (entries) => await reflect(entries);
 *
 * stm.write(entry);
 * const top = stm.read('debugging', 5);
 * ```
 */
export class ShortTermMemory {
  private readonly deque: MemoryEntry[] = [];
  private readonly capacity: number;
  private readonly reflectAt: number;
  private readonly scorer: MemoryScorer;

  /** Called when entries are evicted (oldest-first). */
  onEvict: EvictCallback | null = null;

  /** Called when deque reaches the reflectAt threshold. */
  onReflect: ReflectCallback | null = null;

  constructor(config: ShortTermConfig = {}) {
    this.capacity  = config.capacity  ?? 256;
    this.reflectAt = config.reflectAt ?? Math.floor(this.capacity / 2);
    this.scorer    = new MemoryScorer(config.scorer);
  }

  // ─── Write ──────────────────────────────────────────────────────────────────

  /**
   * Append a new entry. Fires reflection callback when threshold is hit,
   * then evicts oldest entries if capacity is exceeded.
   *
   * Synchronous path — async callbacks are fire-and-forget. Use `writeAsync`
   * when you need to await completion.
   */
  write(entry: MemoryEntry): void {
    this.deque.push(entry);

    // Fire reflection callback when we hit the threshold (sync-fire).
    if (
      this.reflectAt > 0 &&
      this.deque.length === this.reflectAt &&
      this.onReflect
    ) {
      const snapshot = [...this.deque];
      void Promise.resolve(this.onReflect(snapshot));
    }

    // Evict oldest entries when capacity exceeded.
    if (this.deque.length > this.capacity) {
      const evicted = this.deque.splice(0, this.deque.length - this.capacity);
      if (this.onEvict && evicted.length > 0) {
        void Promise.resolve(this.onEvict(evicted));
      }
    }
  }

  /**
   * Async write — awaits both reflection and eviction callbacks.
   */
  async writeAsync(entry: MemoryEntry): Promise<void> {
    this.deque.push(entry);

    if (
      this.reflectAt > 0 &&
      this.deque.length === this.reflectAt &&
      this.onReflect
    ) {
      await this.onReflect([...this.deque]);
    }

    if (this.deque.length > this.capacity) {
      const evicted = this.deque.splice(0, this.deque.length - this.capacity);
      if (this.onEvict && evicted.length > 0) {
        await this.onEvict(evicted);
      }
    }
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Score all entries against `query` and return the top-k by αβγ score.
   * Purely synchronous — O(n) over deque.
   *
   * Performance: <10ms p95 on 1000-entry fixture (CF-M2-02) — verified in
   * m2-short-term.test.ts.
   */
  read(query: string, topK = 10): MemoryEntry[] {
    const ranked = this.scorer.rank(this.deque, query, topK);
    return ranked.map(({ entry, components }) => ({
      ...entry,
      score: components.score,
    }));
  }

  /**
   * Return all entries in insertion order (no scoring).
   * Useful for reflection passes that need the raw sequence.
   */
  all(): MemoryEntry[] {
    return [...this.deque];
  }

  /**
   * Return the entry by id, or null.
   */
  getById(id: string): MemoryEntry | null {
    return this.deque.find((e) => e.id === id) ?? null;
  }

  // ─── Housekeeping ────────────────────────────────────────────────────────────

  /** Current entry count. */
  get size(): number {
    return this.deque.length;
  }

  /** Flush all entries to the evict callback and clear the deque. */
  async flush(): Promise<void> {
    if (this.deque.length === 0) return;
    const all = this.deque.splice(0);
    if (this.onEvict) await this.onEvict(all);
  }

  /** Clear without notifying the evict callback (e.g. after reflection). */
  clear(): void {
    this.deque.length = 0;
  }
}
