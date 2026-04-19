/**
 * CF-M5-04: anticipatory preload reduces first-token latency ≥10x vs
 * cold-load baseline.
 * CF-M5-05: disable-flag graceful degrade.
 *
 * @module cache/__tests__/preload.test
 */

import { describe, it, expect } from 'vitest';
import { Preloader, type SkillLoader } from '../preload.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Loader with injectable artificial latency per call (ms). */
function slowLoader(latencyMs: number): SkillLoader {
  return async (skillId: string) => {
    await new Promise((r) => setTimeout(r, latencyMs));
    return `body-of-${skillId}`;
  };
}

/** Strictly synchronous timing wrapper — returns {result, elapsedMs}. */
async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; elapsedMs: number }> {
  const t0 = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - t0;
  return { result, elapsedMs };
}

// ─── Basic ──────────────────────────────────────────────────────────────────

describe('Preloader — basic API', () => {
  it('get() returns loader output on cold miss', async () => {
    const p = new Preloader(slowLoader(1));
    const body = await p.get('a');
    expect(body).toBe('body-of-a');
    expect(p.misses).toBe(1);
    expect(p.hits).toBe(0);
  });

  it('warm hit on subsequent get()', async () => {
    const p = new Preloader(slowLoader(1));
    await p.get('a');
    const body = await p.get('a');
    expect(body).toBe('body-of-a');
    expect(p.hits).toBe(1);
    expect(p.misses).toBe(1);
  });

  it('preload populates warm cache', async () => {
    const p = new Preloader(slowLoader(1));
    p.preload(['a', 'b']);
    // Wait for in-flight.
    await new Promise((r) => setTimeout(r, 20));
    expect(p.warmSize()).toBe(2);
    expect(p.preloadAttempts).toBe(2);
  });

  it('concurrent preload cap evicts oldest pending', async () => {
    const p = new Preloader(slowLoader(50), { maxConcurrent: 2 });
    p.preload(['a', 'b', 'c', 'd']); // 4 requested, cap 2
    // Some pending evictions should have occurred.
    expect(p.evictedPending).toBeGreaterThanOrEqual(2);
  });
});

// ─── CF-M5-04: latency reduction ≥10x ──────────────────────────────────────

describe('CF-M5-04: anticipatory preload reduces first-token latency ≥10x', () => {
  it('preloaded get() is >=10x faster than cold-load baseline', async () => {
    const LATENCY_MS = 50;
    const loader = slowLoader(LATENCY_MS);
    const p = new Preloader(loader, { maxConcurrent: 4 });

    // Baseline: cold loadCold() path.
    const cold = await timed(() => p.loadCold('baseline'));

    // Preload + wait for warm.
    p.preload(['hot']);
    await new Promise((r) => setTimeout(r, LATENCY_MS + 10));
    expect(p.warmSize()).toBeGreaterThanOrEqual(1);

    // Preloaded get().
    const hot = await timed(() => p.get('hot'));

    // Assert ≥10x latency reduction. Warm hit should be <1ms in practice,
    // cold baseline is ≥50ms — ratio should be ≥50.
    expect(cold.elapsedMs).toBeGreaterThanOrEqual(LATENCY_MS * 0.5);
    expect(hot.elapsedMs).toBeLessThan(cold.elapsedMs / 10);
  });

  it('awaited in-flight preload still hides latency for later get()', async () => {
    const LATENCY_MS = 40;
    const loader = slowLoader(LATENCY_MS);
    const p = new Preloader(loader);

    p.preload(['hot']);
    // Immediately request the same skill — should join the pending promise
    // rather than start a second cold load.
    const { elapsedMs } = await timed(() => p.get('hot'));
    // Latency is at most the loader's own latency (single fetch overlapped).
    expect(elapsedMs).toBeLessThanOrEqual(LATENCY_MS * 2);
    expect(p.hits).toBe(1);
    expect(p.misses).toBe(0);
  });
});

// ─── CF-M5-05: disable-flag graceful degrade ───────────────────────────────

describe('CF-M5-05: graceful degrade with prefix-cache disabled', () => {
  it('disabled preloader does not warm anything', async () => {
    const p = new Preloader(slowLoader(1), { enabled: false });
    p.preload(['a', 'b', 'c']);
    await new Promise((r) => setTimeout(r, 20));
    expect(p.warmSize()).toBe(0);
    expect(p.preloadAttempts).toBe(0);
    expect(p.isEnabled()).toBe(false);
  });

  it('disabled preloader still serves via cold get()', async () => {
    const p = new Preloader(slowLoader(1), { enabled: false });
    const body = await p.get('a');
    expect(body).toBe('body-of-a');
    expect(p.hits).toBe(0);
    expect(p.misses).toBe(1);
  });

  it('disabled flag yields same functional result as enabled (minus latency)', async () => {
    const enabled = new Preloader(slowLoader(1), { enabled: true });
    const disabled = new Preloader(slowLoader(1), { enabled: false });
    const a = await enabled.get('x');
    const b = await disabled.get('x');
    expect(a).toBe(b);
  });
});

// ─── Clear ──────────────────────────────────────────────────────────────────

describe('Preloader — clear', () => {
  it('clears warm cache and counters', async () => {
    const p = new Preloader(slowLoader(1));
    await p.get('a');
    p.clear();
    expect(p.warmSize()).toBe(0);
    expect(p.hits).toBe(0);
    expect(p.misses).toBe(0);
  });
});
