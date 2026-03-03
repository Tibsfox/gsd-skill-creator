/**
 * Sliding-window rate limiter for all HTTP registry requests.
 *
 * Ensures at most `maxRequests` requests are made within any `windowMs`
 * millisecond window. Callers `await acquire()` — they queue and resolve when
 * a slot opens, rather than being dropped.
 */

import { DEFAULT_RATE_LIMITER_CONFIG, type RateLimiterConfig } from './types.js';

export class RateLimiter {
  private timestamps: number[] = [];
  private queue: Array<() => void> = [];
  private readonly config: RateLimiterConfig;

  constructor(config: RateLimiterConfig = DEFAULT_RATE_LIMITER_CONFIG) {
    this.config = config;
  }

  /**
   * Acquire a rate-limit slot.  Resolves immediately if under the limit,
   * otherwise queues the caller until a slot opens.
   */
  acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  /** Observable stats — useful for diagnostics and tests. */
  getStats(): { requestsInWindow: number; windowMs: number; maxRequests: number } {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(
      (t) => now - t < this.config.windowMs,
    );
    return {
      requestsInWindow: this.timestamps.length,
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
    };
  }

  private processQueue(): void {
    const now = Date.now();
    // Prune expired timestamps
    this.timestamps = this.timestamps.filter(
      (t) => now - t < this.config.windowMs,
    );

    if (this.queue.length === 0) return;

    if (this.timestamps.length < this.config.maxRequests) {
      const resolve = this.queue.shift()!;
      this.timestamps.push(Date.now());
      resolve();
      // Recurse — process more pending requests if slots remain
      this.processQueue();
    } else {
      // Schedule retry when the oldest in-window timestamp expires
      const oldestAge = now - this.timestamps[0];
      const waitMs = this.config.windowMs - oldestAge + 1;
      setTimeout(() => this.processQueue(), waitMs);
    }
  }
}
