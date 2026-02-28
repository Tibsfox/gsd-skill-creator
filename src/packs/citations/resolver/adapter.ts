/**
 * Resolver adapter interface and abstract base class.
 *
 * Defines the contract for citation resolution adapters and provides
 * shared caching, rate-limiting, and error-handling infrastructure.
 * Concrete adapters extend BaseAdapter and implement doResolve/doSearch.
 *
 * Only allowed imports: node:crypto, node:fs, node:path, citation types.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CitedWork, RawCitation, SourceApi } from '../types/index.js';

// ============================================================================
// Interfaces
// ============================================================================

/** Options for search queries. */
export interface SearchOptions {
  maxResults?: number;
  yearFrom?: number;
  yearTo?: number;
  author?: string;
}

/** Contract every resolver adapter must implement. */
export interface ResolverAdapter {
  readonly name: SourceApi;
  readonly rateLimitPerSecond: number;
  resolve(citation: RawCitation): Promise<CitedWork | null>;
  search(query: string, options?: SearchOptions): Promise<CitedWork[]>;
  isAvailable(): Promise<boolean>;
}

/** Per-adapter metrics. */
export interface AdapterMetrics {
  totalCalls: number;
  cacheHits: number;
  errors: number;
}

/** Configuration for BaseAdapter constructor. */
export interface BaseAdapterConfig {
  /** Override the base cache directory (default: data/citations/cache). */
  cacheDir?: string;
  /** Override the cache TTL in days (default: 30). */
  cacheTtlDays?: number;
  /** Override the max wait time for rate-limit tokens in ms (default: 5000). */
  maxWaitMs?: number;
  /** Override the request timeout in ms (default: 10000). */
  timeoutMs?: number;
  /** Injectable fetch function for testing (default: global fetch). */
  fetchFn?: typeof fetch;
}

// ============================================================================
// Token bucket rate limiter
// ============================================================================

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /** Try to consume a token; returns true if available, false otherwise. */
  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /** Wait until a token is available or maxWait expires. */
  async waitForToken(maxWaitMs: number): Promise<boolean> {
    const start = Date.now();
    while (!this.tryConsume()) {
      if (Date.now() - start >= maxWaitMs) return false;
      const waitTime = Math.min(1000 / this.refillRate, maxWaitMs - (Date.now() - start));
      await new Promise((r) => setTimeout(r, Math.max(1, waitTime)));
    }
    return true;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

// ============================================================================
// Abstract base adapter
// ============================================================================

/** Abstract base class providing cache, rate-limiting, and error handling. */
export abstract class BaseAdapter implements ResolverAdapter {
  abstract readonly name: SourceApi;
  abstract readonly rateLimitPerSecond: number;

  readonly metrics: AdapterMetrics = { totalCalls: 0, cacheHits: 0, errors: 0 };

  protected readonly fetchFn: typeof fetch;
  protected readonly cacheDir: string;
  protected readonly cacheTtlDays: number;
  protected readonly maxWaitMs: number;
  protected readonly timeoutMs: number;

  private bucket: TokenBucket | null = null;

  constructor(config: BaseAdapterConfig = {}) {
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
    this.cacheDir = config.cacheDir ?? 'data/citations/cache';
    this.cacheTtlDays = config.cacheTtlDays ?? 30;
    this.maxWaitMs = config.maxWaitMs ?? 5000;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  /** Lazy-init the token bucket (needs rateLimitPerSecond from subclass). */
  private getBucket(): TokenBucket {
    if (!this.bucket) {
      this.bucket = new TokenBucket(this.rateLimitPerSecond, this.rateLimitPerSecond);
    }
    return this.bucket;
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  async resolve(citation: RawCitation): Promise<CitedWork | null> {
    this.metrics.totalCalls++;
    const cacheKey = this.cacheKeyFor(citation.text);
    const cached = this.readCache(cacheKey);
    if (cached !== null) {
      this.metrics.cacheHits++;
      return Array.isArray(cached) ? cached[0] ?? null : cached;
    }

    const acquired = await this.getBucket().waitForToken(this.maxWaitMs);
    if (!acquired) return null;

    try {
      const result = await this.withTimeout(this.doResolve(citation));
      if (result) this.writeCache(cacheKey, result);
      return result;
    } catch {
      this.metrics.errors++;
      return null;
    }
  }

  async search(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    this.metrics.totalCalls++;
    const cacheKey = this.cacheKeyFor(`search:${query}:${JSON.stringify(options ?? {})}`);
    const cached = this.readCache(cacheKey);
    if (cached !== null) {
      this.metrics.cacheHits++;
      return Array.isArray(cached) ? cached : [cached];
    }

    const acquired = await this.getBucket().waitForToken(this.maxWaitMs);
    if (!acquired) return [];

    try {
      const results = await this.withTimeout(this.doSearch(query, options));
      if (results.length > 0) this.writeCache(cacheKey, results);
      return results;
    } catch {
      this.metrics.errors++;
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await this.withTimeout(this.checkAvailability());
    } catch {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Abstract methods for subclasses
  // --------------------------------------------------------------------------

  protected abstract doResolve(citation: RawCitation): Promise<CitedWork | null>;
  protected abstract doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]>;
  protected abstract checkAvailability(): Promise<boolean>;

  // --------------------------------------------------------------------------
  // Cache helpers
  // --------------------------------------------------------------------------

  protected cacheKeyFor(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  protected cachePathFor(key: string): string {
    const dir = join(this.cacheDir, this.name);
    return join(dir, `${key}.json`);
  }

  protected readCache(key: string): CitedWork | CitedWork[] | null {
    try {
      const path = this.cachePathFor(key);
      if (!existsSync(path)) return null;
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const writtenAt = new Date(raw.timestamp).getTime();
      const ttlMs = this.cacheTtlDays * 24 * 60 * 60 * 1000;
      if (ttlMs === 0 || Date.now() - writtenAt > ttlMs) return null;
      return raw.data;
    } catch {
      return null;
    }
  }

  protected writeCache(key: string, data: CitedWork | CitedWork[]): void {
    try {
      const path = this.cachePathFor(key);
      const dir = join(this.cacheDir, this.name);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(path, JSON.stringify({ timestamp: new Date().toISOString(), data }));
    } catch {
      // Cache write failure is non-fatal.
    }
  }

  // --------------------------------------------------------------------------
  // Timeout helper
  // --------------------------------------------------------------------------

  protected async withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.timeoutMs),
      ),
    ]);
  }
}
