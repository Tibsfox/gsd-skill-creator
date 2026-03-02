import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebRateLimiter } from '../rate-limiter.js';

describe('WebRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows burst of requests up to requestsPerSecond', async () => {
    const limiter = new WebRateLimiter({ requestsPerSecond: 10 });
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(limiter.acquire());
    }
    // All 10 should resolve immediately (burst)
    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
  });

  it('blocks second acquire when burst capacity is 1', async () => {
    const limiter = new WebRateLimiter({ requestsPerSecond: 1, burstCapacity: 1 });
    // First acquire should be immediate
    await limiter.acquire();
    // Second acquire should block
    let resolved = false;
    const promise = limiter.acquire().then(() => { resolved = true; });
    // Drain microtasks without advancing time
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(false);
    // Advance 1 second for token refill
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(resolved).toBe(true);
  });

  it('requires WebRateLimitConfig in constructor (no default)', () => {
    // @ts-expect-error -- config is required, no default
    expect(() => new WebRateLimiter()).toThrow();
  });

  it('refills tokens over time after draining', async () => {
    const limiter = new WebRateLimiter({ requestsPerSecond: 2, burstCapacity: 2 });
    // Drain all tokens
    await limiter.acquire();
    await limiter.acquire();
    // Third should block
    let resolved = false;
    const promise = limiter.acquire().then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(false);
    // Wait 500ms for 1 token to refill (2/sec = 1 per 500ms)
    await vi.advanceTimersByTimeAsync(500);
    await promise;
    expect(resolved).toBe(true);
  });

  it('defaults burstCapacity to requestsPerSecond when not specified', async () => {
    const limiter = new WebRateLimiter({ requestsPerSecond: 5 });
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      promises.push(limiter.acquire());
    }
    // All 5 should resolve immediately
    await Promise.all(promises);
    // 6th should block
    let resolved = false;
    const promise = limiter.acquire().then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(false);
    // Advance time for refill
    await vi.advanceTimersByTimeAsync(200); // 5/sec = 1 per 200ms
    await promise;
    expect(resolved).toBe(true);
  });
});
