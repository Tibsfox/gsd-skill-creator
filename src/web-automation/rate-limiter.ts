/**
 * Token bucket rate limiter for web automation.
 *
 * Required constructor parameter enforces rate limiting
 * on all scraper and chain runner instances.
 */

import type { WebRateLimitConfig } from './types.js';

export class WebRateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private lastRefillTime: number;
  private readonly waitQueue: Array<() => void> = [];

  constructor(config: WebRateLimitConfig) {
    if (!config) {
      throw new Error('WebRateLimitConfig is required');
    }
    this.maxTokens = config.burstCapacity ?? config.requestsPerSecond;
    this.tokens = this.maxTokens;
    this.refillRate = config.requestsPerSecond / 1000; // convert to per-ms
    this.lastRefillTime = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // No tokens available; wait for refill
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
      this.scheduleRefill();
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    if (elapsed <= 0) return;

    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  private scheduleRefill(): void {
    // Calculate time until next token
    const timePerToken = 1 / this.refillRate; // ms per token
    setTimeout(() => {
      this.refill();
      // Process waiting requests
      while (this.waitQueue.length > 0 && this.tokens >= 1) {
        this.tokens -= 1;
        const resolve = this.waitQueue.shift()!;
        resolve();
      }
      // If still waiting, schedule again
      if (this.waitQueue.length > 0) {
        this.scheduleRefill();
      }
    }, timePerToken);
  }
}
