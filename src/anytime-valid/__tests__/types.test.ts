/**
 * Wave 0 surface tests for src/anytime-valid/.
 *
 * Test 1 — Interface stability + smoke construct:
 *   Verifies that `createEProcess` returns an object satisfying the `EProcess`
 *   interface and that `result()` returns a structurally correct `EProcessResult`
 *   with the expected `Type1Bound` fields.
 *
 * Test 2 — H_0 non-rejection after 100 i.i.d. zero-mean observations:
 *   Under H_0 (μ = 0), seeded i.i.d. uniform samples in [-1, 1] should NOT
 *   trigger rejection after 100 observations at α = 0.05. This exercises the
 *   anytime-valid property: the e-value stays well below 1/α = 20 under the
 *   null because each increment e_i = exp(λ x_i − λ²/2) has E[e_i | H_0] ≤ 1.
 *
 * @module anytime-valid/__tests__/types.test
 */

import { describe, it, expect } from 'vitest';
import { createEProcess } from '../e-process.js';
import type { EProcess, EProcessResult, Type1Bound } from '../types.js';

// ─── Seeded PRNG (Mulberry32) ────────────────────────────────────────────────

/**
 * Deterministic PRNG (Mulberry32) to generate reproducible null-hypothesis
 * samples. Using a seeded generator ensures the test is not flaky.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Draw n samples uniformly from [-1, 1] using the given random function. */
function uniformSamples(rand: () => number, n: number): number[] {
  return Array.from({ length: n }, () => rand() * 2 - 1);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('anytime-valid — interface stability + smoke construct', () => {
  it('createEProcess returns an object satisfying EProcess with correct result shape', () => {
    const ep: EProcess = createEProcess({ alpha: 0.05 });

    // EProcess API surface is present
    expect(typeof ep.update).toBe('function');
    expect(typeof ep.result).toBe('function');
    expect(typeof ep.reset).toBe('function');

    // result() before any updates: vacuous state, not rejected
    const r: EProcessResult = ep.result();
    expect(r.rejected).toBe(false);
    expect(r.evidence).toBe(1);       // E_0 = 1 (identity product)
    expect(r.observations).toBe(0);

    // Type1Bound fields
    const b: Type1Bound = r.type1Bound;
    expect(b.alpha).toBe(0.05);
    expect(b.threshold).toBeCloseTo(20, 5); // 1/0.05 = 20
    expect(b.satisfied).toBe(true);
  });

  it('update increments observation count and result fields update accordingly', () => {
    const ep = createEProcess({ alpha: 0.05 });
    ep.update(0.0);  // zero observation, e_i = exp(0 − λ²/2) < 1
    ep.update(0.0);
    const r = ep.result();
    expect(r.observations).toBe(2);
    // Two zero observations drive e-value slightly below 1
    expect(r.evidence).toBeLessThan(1);
    expect(r.rejected).toBe(false);
  });

  it('reset clears running state back to the initial condition', () => {
    const ep = createEProcess({ alpha: 0.05 });
    ep.update(1.0);
    ep.update(1.0);
    expect(ep.result().observations).toBe(2);
    ep.reset();
    const r = ep.result();
    expect(r.observations).toBe(0);
    expect(r.evidence).toBe(1);
    expect(r.rejected).toBe(false);
  });

  it('throws RangeError for alpha outside (0, 1)', () => {
    expect(() => createEProcess({ alpha: 0 })).toThrow(RangeError);
    expect(() => createEProcess({ alpha: 1 })).toThrow(RangeError);
    expect(() => createEProcess({ alpha: -0.1 })).toThrow(RangeError);
  });

  it('throws RangeError for non-positive lambda', () => {
    expect(() => createEProcess({ lambda: 0 })).toThrow(RangeError);
    expect(() => createEProcess({ lambda: -0.5 })).toThrow(RangeError);
  });

  it('two-sided hypothesis does not reject on zero-mean data', () => {
    const ep = createEProcess({ alpha: 0.05, hypothesis: 'two-sided' });
    const rand = mulberry32(0xdeadbeef);
    for (const x of uniformSamples(rand, 100)) ep.update(x);
    expect(ep.result().rejected).toBe(false);
  });
});

describe('anytime-valid — H_0 non-rejection at α=0.05 after 100 i.i.d. zero-mean samples', () => {
  it('does not reject under H_0 (seeded uniform [-1,1], n=100)', () => {
    // Seeded PRNG with a fixed seed for determinism.
    const rand = mulberry32(0xcafebabe);
    const samples = uniformSamples(rand, 100);

    const ep = createEProcess({ alpha: 0.05, hypothesis: 'one-sided' });
    for (const x of samples) ep.update(x);

    const r = ep.result();
    expect(r.observations).toBe(100);
    expect(r.rejected).toBe(false);

    // Sanity: evidence should be finite and positive
    expect(r.evidence).toBeGreaterThan(0);
    expect(Number.isFinite(r.evidence)).toBe(true);

    // Type-I bound still satisfied
    expect(r.type1Bound.satisfied).toBe(true);
    expect(r.type1Bound.threshold).toBeCloseTo(20, 5);
  });

  it('e-value stays well below 1/α on a second independent seed', () => {
    // Use a different seed to confirm the property holds across seeds.
    const rand = mulberry32(0x12345678);
    const samples = uniformSamples(rand, 100);

    const ep = createEProcess({ alpha: 0.05 });
    for (const x of samples) ep.update(x);

    const r = ep.result();
    expect(r.rejected).toBe(false);
    // e-value should be substantially below threshold (20) under H_0
    expect(r.evidence).toBeLessThan(r.type1Bound.threshold);
  });
});
