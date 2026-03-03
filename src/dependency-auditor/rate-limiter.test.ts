import { describe, it, expect, vi, afterEach } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('RateLimiter', () => {
  it('allows up to maxRequests requests immediately', async () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });

    const promises = Array.from({ length: 5 }, () => limiter.acquire());
    await Promise.all(promises);

    const stats = limiter.getStats();
    expect(stats.requestsInWindow).toBe(5);
  });

  it('queues requests beyond maxRequests', async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

    // Acquire 3 slots immediately
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    // 4th should queue
    let resolved = false;
    const pending = limiter.acquire().then(() => {
      resolved = true;
    });

    // Still not resolved
    expect(resolved).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1100);
    await pending;

    expect(resolved).toBe(true);
  });

  it('getStats() reports correct requestsInWindow count', async () => {
    const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    const stats = limiter.getStats();
    expect(stats.requestsInWindow).toBe(3);
    expect(stats.maxRequests).toBe(10);
    expect(stats.windowMs).toBe(60_000);
  });

  it('uses DEFAULT_RATE_LIMITER_CONFIG when no config provided', () => {
    const limiter = new RateLimiter();
    const stats = limiter.getStats();
    expect(stats.maxRequests).toBe(30);
    expect(stats.windowMs).toBe(60_000);
  });

  it('processes queue in order', async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

    const order: number[] = [];

    await limiter.acquire(); // fills slot

    const p1 = limiter.acquire().then(() => order.push(1));
    const p2 = limiter.acquire().then(() => order.push(2));
    const p3 = limiter.acquire().then(() => order.push(3));

    vi.advanceTimersByTime(1100);
    await p1;
    vi.advanceTimersByTime(1100);
    await p2;
    vi.advanceTimersByTime(1100);
    await p3;

    expect(order).toEqual([1, 2, 3]);
  });
});
