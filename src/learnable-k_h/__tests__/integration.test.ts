/**
 * MD-5 — Integration tests:
 *
 *   - SC-MD5-01: flag-off yields byte-identical behaviour to the MB-1 scalar
 *     K_H (our proxy: `resolveKH` always returns exactly `scalarKH` when the
 *     flag is off, regardless of store or head contents).
 *   - LS-38: flag-on produces learning only on tractable skills (ME-1 hard
 *     gate); coin-flip and unknown skills yield zero head updates even under
 *     100-step stress.
 */

import { describe, it, expect } from 'vitest';
import { createHead } from '../head.js';
import { createStore, getOrCreate, get } from '../store.js';
import { resolveKH } from '../api.js';
import { train } from '../trainer.js';

describe('SC-MD5-01 — flag-off byte-identical to MB-1 scalar', () => {
  it('matches scalarKH exactly across 100 random probes, regardless of head contents', () => {
    const s = createStore();
    // Populate with heads pre-trained into wild regimes.
    for (let i = 0; i < 10; i += 1) {
      const h = getOrCreate(s, `skill-${i}`, () =>
        createHead({ skillId: `skill-${i}`, dim: 4, kHMin: 0.1, kHMax: 10 }),
      );
      h.weights[0] = 5 - Math.random() * 10;
      h.weights[1] = 5 - Math.random() * 10;
      h.weights[2] = 5 - Math.random() * 10;
      h.weights[3] = 5 - Math.random() * 10;
      h.bias = 5 - Math.random() * 10;
    }
    for (let i = 0; i < 100; i += 1) {
      const skillId = `skill-${i % 10}`;
      const scalarKH = 0.1 + Math.random() * 5;
      const taskEmbed = [Math.random(), Math.random(), Math.random(), Math.random()];
      const r = resolveKH({
        store: s,
        skillId,
        taskEmbed,
        scalarKH,
        tractability: 'tractable',
        enabled: false, // flag OFF
      });
      // Byte-identical: the number returned is bit-exact the input scalarKH.
      expect(r.kH).toBe(scalarKH);
      expect(r.source).toBe('scalar');
      expect(r.scalarReason).toBe('flag-off');
    }
  });

  it('flag-off returns scalarKH even when the skillId is unknown', () => {
    const s = createStore();
    const r = resolveKH({
      store: s,
      skillId: 'never-seen',
      taskEmbed: [0.1, 0.2],
      scalarKH: 3.14,
      tractability: 'tractable',
      enabled: false,
    });
    expect(r.kH).toBe(3.14);
  });
});

describe('LS-38 — ME-1 hard gate under stress (flag ON)', () => {
  it('coin-flip skills: 50 training attempts yield zero head updates; read returns scalar', () => {
    const s = createStore();
    const h = getOrCreate(s, 'cf-skill', () =>
      createHead({ skillId: 'cf-skill', dim: 3, kHMin: 0.1, kHMax: 5 }),
    );
    for (let i = 0; i < 50; i += 1) {
      train(h, {
        tractability: 'coin-flip',
        taskEmbed: [Math.random(), Math.random(), Math.random()],
        targetKH: 0.5 + Math.random() * 4,
        learningRate: 1.0,
        lyapunovFixture: [],
      });
    }
    // Head untouched.
    expect(h.updateCount).toBe(0);
    expect(h.bias).toBe(0);
    expect(h.weights).toEqual([0, 0, 0]);

    // Read path also gates: coin-flip → scalar fallback even with flag ON.
    const r = resolveKH({
      store: s,
      skillId: 'cf-skill',
      taskEmbed: [0.3, 0.3, 0.3],
      scalarKH: 0.77,
      tractability: 'coin-flip',
      enabled: true,
    });
    expect(r.kH).toBe(0.77);
    expect(r.source).toBe('scalar');
    expect(r.scalarReason).toBe('non-tractable');
  });

  it('unknown skills: same zero-update guarantee', () => {
    const s = createStore();
    const h = getOrCreate(s, 'unk-skill', () =>
      createHead({ skillId: 'unk-skill', dim: 2, kHMin: 0, kHMax: 1 }),
    );
    for (let i = 0; i < 50; i += 1) {
      train(h, {
        tractability: 'unknown',
        taskEmbed: [Math.random(), Math.random()],
        targetKH: Math.random(),
      });
    }
    expect(h.updateCount).toBe(0);
  });

  it('tractable skills: learning runs; head diverges from untouched coin-flip head', () => {
    const s = createStore();
    const tract = getOrCreate(s, 'tract', () =>
      createHead({ skillId: 'tract', dim: 2, kHMin: 0.5, kHMax: 2.0 }),
    );
    const cf = getOrCreate(s, 'cf', () =>
      createHead({ skillId: 'cf', dim: 2, kHMin: 0.5, kHMax: 2.0 }),
    );
    for (let i = 0; i < 30; i += 1) {
      train(tract, {
        tractability: 'tractable',
        taskEmbed: [0.3, 0.7],
        targetKH: 1.8,
        learningRate: 0.3,
        lyapunovFixture: [],
      });
      train(cf, {
        tractability: 'coin-flip',
        taskEmbed: [0.3, 0.7],
        targetKH: 1.8,
        learningRate: 0.3,
        lyapunovFixture: [],
      });
    }
    expect(tract.updateCount).toBeGreaterThan(0);
    expect(cf.updateCount).toBe(0);
    // Sanity: the tractable head actually moved.
    expect(get(s, 'tract')!.bias).not.toBe(0);
    expect(get(s, 'cf')!.bias).toBe(0);
  });
});

describe('LS-38 — end-to-end: flag-on tractable learning reaches head on read path', () => {
  it('after training, flag-on read returns head output (not scalar)', () => {
    const s = createStore();
    const h = getOrCreate(s, 'tract', () =>
      createHead({ skillId: 'tract', dim: 2, kHMin: 0.5, kHMax: 2.0 }),
    );
    // Train enough to push head away from midpoint.
    for (let i = 0; i < 100; i += 1) {
      train(h, {
        tractability: 'tractable',
        taskEmbed: [0.3, 0.7],
        targetKH: 1.9,
        learningRate: 0.3,
        lyapunovFixture: [],
      });
    }
    const r = resolveKH({
      store: s,
      skillId: 'tract',
      taskEmbed: [0.3, 0.7],
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    expect(r.source).toBe('head');
    // Head output has moved away from midpoint (1.25) toward the target (1.9).
    expect(r.kH).toBeGreaterThan(1.25);
    expect(r.kH).toBeLessThanOrEqual(2.0);
  });
});
