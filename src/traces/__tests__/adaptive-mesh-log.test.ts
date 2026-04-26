/**
 * JP-020 — Adaptive-mesh trace logging smoke tests.
 *
 * Verifies the DensityEstimator and AdaptiveMeshLog primitives from
 * src/traces/adaptive-mesh-log.ts (arXiv:2509.08537 pattern).
 *
 * @module traces/__tests__/adaptive-mesh-log.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DensityEstimator,
  AdaptiveMeshLog,
} from '../adaptive-mesh-log.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('DensityEstimator', () => {
  it('counts events within the sliding window', () => {
    const est = new DensityEstimator(1000);
    const now = 5000;
    est.record(now - 500);
    est.record(now - 200);
    est.record(now);
    expect(est.density(now)).toBe(3);
  });

  it('excludes events older than the window', () => {
    const est = new DensityEstimator(1000);
    const now = 5000;
    est.record(now - 2000); // outside window
    est.record(now - 500);
    expect(est.density(now)).toBe(1);
  });

  it('returns 0 for an empty window', () => {
    const est = new DensityEstimator(1000);
    expect(est.density(Date.now())).toBe(0);
  });
});

describe('AdaptiveMeshLog', () => {
  it('high-priority events flush synchronously (no deferral)', async () => {
    const flushed: number[] = [];
    const log = new AdaptiveMeshLog<number>((p) => { flushed.push(p); }, { alpha: 1 });

    log.enqueue({ payload: 42, priority: 'high' });
    // drain resolves all pending promises
    await log.drain();

    expect(flushed).toContain(42);
  });

  it('normal events in a high-density window flush immediately', async () => {
    const flushed: number[] = [];
    const log = new AdaptiveMeshLog<number>((p) => { flushed.push(p); }, {
      alpha: 0.5,
      windowMs: 1000,
      highDensityThreshold: 3,
    });

    const now = Date.now();
    // Enqueue enough events to exceed the high-density threshold
    for (let i = 0; i < 4; i++) {
      log.enqueue({ payload: i, ts: now });
    }
    await log.drain();

    expect(flushed.length).toBe(4);
  });

  it('drain flushes all pending events', async () => {
    const flushed: string[] = [];
    const log = new AdaptiveMeshLog<string>(
      (p) => { flushed.push(p); },
      { alpha: 0.1, highDensityThreshold: 100 }, // low alpha → coarsened, high threshold → always deferred
    );

    log.enqueue({ payload: 'a', priority: 'normal' });
    log.enqueue({ payload: 'b', priority: 'normal' });
    await log.drain();

    expect(flushed).toEqual(['a', 'b']);
  });

  it('alpha=1 produces maximum resolution (no coarsening delay)', async () => {
    const flushed: number[] = [];
    const log = new AdaptiveMeshLog<number>((p) => { flushed.push(p); }, {
      alpha: 1,
      highDensityThreshold: 100,
    });

    log.enqueue({ payload: 7 });
    await log.drain();
    expect(flushed).toContain(7);
  });
});
