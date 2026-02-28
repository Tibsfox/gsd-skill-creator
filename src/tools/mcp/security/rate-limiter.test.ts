import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

// ============================================================================
// Basic limiting
// ============================================================================

describe('RateLimiter: basic limiting', () => {
  it('first call within limits returns allowed: true', () => {
    const rl = new RateLimiter({ maxPerServer: 5, maxPerTool: 3, windowMs: 1000 });
    const result = rl.checkLimit('s1', 'tool-a');
    expect(result.allowed).toBe(true);
    expect(result.rule).toBeUndefined();
    expect(result.retryAfterMs).toBeUndefined();
  });

  it('calls within server limit all succeed', () => {
    const rl = new RateLimiter({ maxPerServer: 3, maxPerTool: 10, windowMs: 1000 });
    expect(rl.checkLimit('s1', 'tool-a').allowed).toBe(true);
    expect(rl.checkLimit('s1', 'tool-b').allowed).toBe(true);
    expect(rl.checkLimit('s1', 'tool-c').allowed).toBe(true);
  });

  it('exceeding server limit returns allowed: false with server-limit rule', () => {
    const rl = new RateLimiter({ maxPerServer: 2, maxPerTool: 10, windowMs: 1000 });
    rl.checkLimit('s1', 'tool-a'); // 1
    rl.checkLimit('s1', 'tool-b'); // 2
    const result = rl.checkLimit('s1', 'tool-c'); // 3 -- exceeds
    expect(result.allowed).toBe(false);
    expect(result.rule).toBe('server-limit');
    expect(result.remaining).toBe(0);
  });

  it('exceeding tool limit returns allowed: false with tool-limit rule', () => {
    const rl = new RateLimiter({ maxPerServer: 100, maxPerTool: 2, windowMs: 1000 });
    rl.checkLimit('s1', 'tool-a'); // 1
    rl.checkLimit('s1', 'tool-a'); // 2
    const result = rl.checkLimit('s1', 'tool-a'); // 3 -- exceeds
    expect(result.allowed).toBe(false);
    expect(result.rule).toBe('tool-limit');
  });

  it('different servers have independent limits', () => {
    const rl = new RateLimiter({ maxPerServer: 1, maxPerTool: 10, windowMs: 1000 });
    expect(rl.checkLimit('s1', 'tool-a').allowed).toBe(true);
    expect(rl.checkLimit('s2', 'tool-a').allowed).toBe(true); // different server
  });
});

// ============================================================================
// Sliding window
// ============================================================================

describe('RateLimiter: sliding window', () => {
  it('calls outside window are pruned (expired calls do not count)', async () => {
    const rl = new RateLimiter({ maxPerServer: 2, maxPerTool: 10, windowMs: 50 });
    rl.checkLimit('s1', 'tool-a'); // 1
    rl.checkLimit('s1', 'tool-b'); // 2

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60));

    // Should be allowed again since old calls expired
    const result = rl.checkLimit('s1', 'tool-c');
    expect(result.allowed).toBe(true);
  });

  it('retryAfterMs is populated when limited', () => {
    const rl = new RateLimiter({ maxPerServer: 1, maxPerTool: 10, windowMs: 1000 });
    rl.checkLimit('s1', 'tool-a');
    const result = rl.checkLimit('s1', 'tool-b');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeDefined();
    expect(result.retryAfterMs!).toBeGreaterThan(0);
    expect(result.retryAfterMs!).toBeLessThanOrEqual(1000);
  });
});

// ============================================================================
// Quota tracking
// ============================================================================

describe('RateLimiter: quota tracking', () => {
  it('getRemainingQuota returns correct remaining for server and tool', () => {
    const rl = new RateLimiter({ maxPerServer: 5, maxPerTool: 3, windowMs: 1000 });
    const before = rl.getRemainingQuota('s1', 'tool-a');
    expect(before.server).toBe(5);
    expect(before.tool).toBe(3);
  });

  it('after calls, remaining decreases', () => {
    const rl = new RateLimiter({ maxPerServer: 5, maxPerTool: 3, windowMs: 1000 });
    rl.checkLimit('s1', 'tool-a'); // 1 server, 1 tool
    rl.checkLimit('s1', 'tool-a'); // 2 server, 2 tool
    const quota = rl.getRemainingQuota('s1', 'tool-a');
    expect(quota.server).toBe(3); // 5 - 2
    expect(quota.tool).toBe(1); // 3 - 2
  });
});

// ============================================================================
// Reset
// ============================================================================

describe('RateLimiter: reset', () => {
  it('reset() clears all limits', () => {
    const rl = new RateLimiter({ maxPerServer: 1, maxPerTool: 10, windowMs: 1000 });
    rl.checkLimit('s1', 'tool-a');
    expect(rl.checkLimit('s1', 'tool-b').allowed).toBe(false);

    rl.reset();
    expect(rl.checkLimit('s1', 'tool-a').allowed).toBe(true);
  });

  it('reset(serverId) clears only that server limits', () => {
    const rl = new RateLimiter({ maxPerServer: 1, maxPerTool: 10, windowMs: 1000 });
    rl.checkLimit('s1', 'tool-a');
    rl.checkLimit('s2', 'tool-a');

    rl.reset('s1');
    expect(rl.checkLimit('s1', 'tool-a').allowed).toBe(true); // s1 reset
    expect(rl.checkLimit('s2', 'tool-b').allowed).toBe(false); // s2 still limited
  });
});
