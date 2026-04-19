/**
 * M5 — Anticipatory Preload (KVFlow-analogue, file-based).
 *
 * During the current step's computation, pre-warm the skill bodies predicted
 * to fire next (top-N from StepGraph). Because we are file-based (not
 * KV-tensor-based), a "preload" is a read of the skill body into an
 * in-memory warm cache. The preload path is strictly **read-only** — it
 * never mutates skill state or writes to disk through this path.
 *
 * Concurrency: a configurable cap (default 4) limits the number of
 * concurrent preloads. If more preloads are requested while the cap is
 * saturated, older pending requests are evicted (LRU among pending).
 *
 * Disable flag: when `enabled: false`, the preloader still exposes its API
 * but never initiates a fetch (CF-M5-05 graceful degrade). Callers always
 * go cold through the `loadCold()` path.
 *
 * @module cache/preload
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A minimal skill-body loader function. Returns the skill body text. */
export type SkillLoader = (skillId: string) => Promise<string>;

export interface PreloaderOptions {
  /** When false, the preloader never initiates a fetch. Default: true. */
  enabled?: boolean;

  /** Max concurrent preloads. Default: 4. */
  maxConcurrent?: number;

  /** Max warm cache entries. Default: 256. LRU evicted. */
  maxWarmEntries?: number;
}

interface WarmEntry {
  body: string;
  lastUsed: number;
}

// ─── Preloader ──────────────────────────────────────────────────────────────

export class Preloader {
  private readonly loader: SkillLoader;
  private readonly enabled: boolean;
  private readonly maxConcurrent: number;
  private readonly maxWarmEntries: number;

  /** Warm cache — skills whose bodies have been loaded. */
  private readonly warm = new Map<string, WarmEntry>();
  /** In-flight preload promises, keyed by skillId. */
  private readonly pending = new Map<string, Promise<string>>();
  /** Insertion-ordered queue of pending keys for LRU eviction. */
  private readonly pendingOrder: string[] = [];

  /** Instrumentation counters. */
  private _hits = 0;
  private _misses = 0;
  private _preloadAttempts = 0;
  private _evictedPending = 0;

  constructor(loader: SkillLoader, opts: PreloaderOptions = {}) {
    this.loader = loader;
    this.enabled = opts.enabled ?? true;
    this.maxConcurrent = opts.maxConcurrent ?? 4;
    this.maxWarmEntries = opts.maxWarmEntries ?? 256;
    if (this.maxConcurrent <= 0) {
      throw new RangeError(`maxConcurrent must be > 0, got ${this.maxConcurrent}`);
    }
    if (this.maxWarmEntries <= 0) {
      throw new RangeError(`maxWarmEntries must be > 0, got ${this.maxWarmEntries}`);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /** Is the preloader currently enabled? */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Fire-and-forget anticipatory preload for a list of predicted-next skills.
   * Non-blocking. Respects the concurrency cap and the warm cache.
   */
  preload(skillIds: string[]): void {
    if (!this.enabled) return;
    for (const skillId of skillIds) {
      if (this.warm.has(skillId)) continue;
      if (this.pending.has(skillId)) continue;
      this._ensureCapacity();
      this._preloadAttempts++;
      const promise = this._fetch(skillId);
      this.pending.set(skillId, promise);
      this.pendingOrder.push(skillId);
      // Swallow rejections — preload is best-effort.
      promise.catch(() => {
        /* handled by _fetch internally */
      });
    }
  }

  /**
   * Get a skill body. If warm, returns immediately (preload hit). Otherwise
   * performs a cold load. When a preload for the same skill is already in
   * flight, awaits the in-flight promise (counts as a hit).
   */
  async get(skillId: string): Promise<string> {
    const warm = this.warm.get(skillId);
    if (warm) {
      warm.lastUsed = this._now();
      this._hits++;
      return warm.body;
    }
    const inflight = this.pending.get(skillId);
    if (inflight) {
      // Already preloading — wait, count as a hit since latency is hidden.
      this._hits++;
      return inflight;
    }
    this._misses++;
    // Cold load path — not counted as a preload attempt.
    const body = await this.loader(skillId);
    this._storeWarm(skillId, body);
    return body;
  }

  /**
   * Cold-load bypass: never consult warm cache. Useful as a control-path
   * baseline for latency comparisons.
   */
  async loadCold(skillId: string): Promise<string> {
    return this.loader(skillId);
  }

  /** Number of entries in the warm cache. */
  warmSize(): number {
    return this.warm.size;
  }

  /** Number of pending in-flight preloads. */
  pendingSize(): number {
    return this.pending.size;
  }

  /** Hit/miss counters. Useful for CF-M5-04 latency-reduction assertions. */
  get hits(): number {
    return this._hits;
  }
  get misses(): number {
    return this._misses;
  }
  get preloadAttempts(): number {
    return this._preloadAttempts;
  }
  get evictedPending(): number {
    return this._evictedPending;
  }

  /** Clear all warm + pending state. */
  clear(): void {
    this.warm.clear();
    this.pending.clear();
    this.pendingOrder.length = 0;
    this._hits = 0;
    this._misses = 0;
    this._preloadAttempts = 0;
    this._evictedPending = 0;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async _fetch(skillId: string): Promise<string> {
    try {
      const body = await this.loader(skillId);
      this._storeWarm(skillId, body);
      return body;
    } finally {
      this.pending.delete(skillId);
      const idx = this.pendingOrder.indexOf(skillId);
      if (idx >= 0) this.pendingOrder.splice(idx, 1);
    }
  }

  private _storeWarm(skillId: string, body: string): void {
    this.warm.set(skillId, { body, lastUsed: this._now() });
    this._evictWarmIfNeeded();
  }

  private _ensureCapacity(): void {
    while (this.pending.size >= this.maxConcurrent && this.pendingOrder.length > 0) {
      // Evict oldest pending (LRU).
      const victim = this.pendingOrder.shift();
      if (victim !== undefined) {
        this.pending.delete(victim);
        this._evictedPending++;
      } else break;
    }
  }

  private _evictWarmIfNeeded(): void {
    while (this.warm.size > this.maxWarmEntries) {
      // Evict LRU by lastUsed.
      let lruKey: string | null = null;
      let lruTs = Infinity;
      for (const [k, v] of this.warm) {
        if (v.lastUsed < lruTs) {
          lruTs = v.lastUsed;
          lruKey = k;
        }
      }
      if (lruKey === null) break;
      this.warm.delete(lruKey);
    }
  }

  private _now(): number {
    return Date.now();
  }
}
