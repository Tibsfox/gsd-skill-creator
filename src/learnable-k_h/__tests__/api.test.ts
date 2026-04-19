/**
 * MD-5 — Read-API tests: MB-1 scalar fallback on every off-path.
 */

import { describe, it, expect } from 'vitest';
import { createHead, forward } from '../head.js';
import { createStore, put } from '../store.js';
import { resolveKH, resolveKHScalar } from '../api.js';

describe('resolveKH — flag off always returns scalar (SC-MD5-01)', () => {
  it('flag off + head present + tractable → scalar', () => {
    const s = createStore();
    const h = createHead({ skillId: 'x', dim: 2, kHMin: 0, kHMax: 5 });
    h.weights[0] = 10;
    h.weights[1] = 10;
    put(s, h);
    const r = resolveKH({
      store: s,
      skillId: 'x',
      taskEmbed: [1, 1],
      scalarKH: 0.777,
      tractability: 'tractable',
      enabled: false,
    });
    expect(r.kH).toBe(0.777);
    expect(r.source).toBe('scalar');
    expect(r.scalarReason).toBe('flag-off');
  });
});

describe('resolveKH — flag on fallbacks', () => {
  it('no head in store → scalar fallback', () => {
    const s = createStore();
    const r = resolveKH({
      store: s,
      skillId: 'missing',
      taskEmbed: [0.1, 0.2],
      scalarKH: 1.23,
      enabled: true,
    });
    expect(r.kH).toBe(1.23);
    expect(r.source).toBe('scalar');
    expect(r.scalarReason).toBe('no-head');
  });

  it('non-tractable → scalar fallback (ME-1 hard gate on read)', () => {
    const s = createStore();
    const h = createHead({ skillId: 'x', dim: 2, kHMin: 0.1, kHMax: 5 });
    h.bias = 5; // pushes K_H high
    put(s, h);
    for (const cls of ['coin-flip', 'unknown'] as const) {
      const r = resolveKH({
        store: s,
        skillId: 'x',
        taskEmbed: [0.5, 0.5],
        scalarKH: 0.333,
        tractability: cls,
        enabled: true,
      });
      expect(r.kH).toBe(0.333);
      expect(r.source).toBe('scalar');
      expect(r.scalarReason).toBe('non-tractable');
    }
  });

  it('dim mismatch → scalar fallback (defensive)', () => {
    const s = createStore();
    put(s, createHead({ skillId: 'x', dim: 3, kHMin: 0, kHMax: 1 }));
    const r = resolveKH({
      store: s,
      skillId: 'x',
      taskEmbed: [0.1, 0.2], // dim 2, head is dim 3
      scalarKH: 0.9,
      tractability: 'tractable',
      enabled: true,
    });
    expect(r.kH).toBe(0.9);
    expect(r.source).toBe('scalar');
    expect(r.scalarReason).toBe('dim-mismatch');
  });
});

describe('resolveKH — flag on, tractable, head present → head forward', () => {
  it('returns head forward K_H, not the scalar', () => {
    const s = createStore();
    const h = createHead({ skillId: 'x', dim: 2, kHMin: 0.5, kHMax: 2.0 });
    // weights + bias chosen to make sigmoid push output high.
    h.weights[0] = 5;
    h.weights[1] = 5;
    put(s, h);
    const x = [1, 1];
    const expectedKH = forward(h, x).kH;
    const r = resolveKH({
      store: s,
      skillId: 'x',
      taskEmbed: x,
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    expect(r.source).toBe('head');
    expect(r.scalarReason).toBeUndefined();
    expect(r.kH).toBeCloseTo(expectedKH, 12);
    expect(r.kH).not.toBe(1.0);
  });

  it('untrained head outputs midpoint — which equals scalar only by coincidence', () => {
    const s = createStore();
    put(s, createHead({ skillId: 'x', dim: 2, kHMin: 0.5, kHMax: 2.5 }));
    const r = resolveKH({
      store: s,
      skillId: 'x',
      taskEmbed: [0.3, -0.4],
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    expect(r.source).toBe('head');
    // Midpoint = 1.5, independent of scalarKH.
    expect(r.kH).toBeCloseTo(1.5, 12);
  });
});

describe('resolveKHScalar — convenience wrapper', () => {
  it('returns the numeric K_H only', () => {
    const s = createStore();
    const v = resolveKHScalar({
      store: s,
      skillId: 'missing',
      taskEmbed: [0.1],
      scalarKH: 42,
      enabled: true,
    });
    expect(v).toBe(42);
  });
});
