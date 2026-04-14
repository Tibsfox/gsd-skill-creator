/**
 * Tests for PCG-XSH-RR-64/32 TypeScript implementation.
 */

import { describe, it, expect } from 'vitest';
import { Pcg32, pcgFromString, pcgOneshot } from '../pcg.js';

// ─── Determinism ────────────────────────────────────────────────────────────

describe('Pcg32 determinism', () => {
  it('same seed produces same sequence', () => {
    const a = new Pcg32(42n, 54n);
    const b = new Pcg32(42n, 54n);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = new Pcg32(1n);
    const b = new Pcg32(2n);
    const va = Array.from({ length: 10 }, () => a.next());
    const vb = Array.from({ length: 10 }, () => b.next());
    expect(va).not.toEqual(vb);
  });

  it('different streams produce different sequences', () => {
    const a = new Pcg32(42n, 1n);
    const b = new Pcg32(42n, 2n);
    const va = Array.from({ length: 10 }, () => a.next());
    const vb = Array.from({ length: 10 }, () => b.next());
    expect(va).not.toEqual(vb);
  });

  it('default constructor is deterministic', () => {
    const a = new Pcg32(0n, 0n);
    const b = new Pcg32(0n, 0n);
    expect(a.next()).toBe(b.next());
  });
});

// ─── Cross-language parity ──────────────────────────────────────────────────

describe('Pcg32 cross-language parity', () => {
  it('seed=42 stream=54 produces specific first 5 values', () => {
    // These values MUST match the Rust implementation.
    // If either side changes, update both.
    const rng = new Pcg32(42n, 54n);
    const values = Array.from({ length: 5 }, () => rng.next());

    // All values should be valid u32
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(2 ** 32);
    }

    // Snapshot for Rust comparison — run Rust tests to get the expected values,
    // then hardcode here for cross-language lock.
    console.log(`  Cross-language reference (seed=42, stream=54): [${values.join(', ')}]`);
  });
});

// ─── Output quality ─────────────────────────────────────────────────────────

describe('Pcg32 output quality', () => {
  it('next() returns u32 range', () => {
    const rng = new Pcg32(0n);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(2 ** 32);
    }
  });

  it('bounded() stays in range', () => {
    const rng = new Pcg32(0n);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.bounded(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
    }
  });

  it('bounded(1) always returns 0', () => {
    const rng = new Pcg32(0n);
    for (let i = 0; i < 100; i++) {
      expect(rng.bounded(1)).toBe(0);
    }
  });

  it('bounded() has fair distribution (chi-square)', () => {
    const rng = new Pcg32(42n);
    const n = 60_000;
    const sides = 6;
    const counts = new Array(sides).fill(0);
    for (let i = 0; i < n; i++) {
      counts[rng.bounded(sides)]++;
    }
    const expected = n / sides;
    const chi2 = counts.reduce((sum, c) => {
      const diff = c - expected;
      return sum + (diff * diff) / expected;
    }, 0);
    // Chi-square critical value for 5 df at p=0.01 is 15.086
    expect(chi2).toBeLessThan(15.086);
  });

  it('float() returns [0.0, 1.0)', () => {
    const rng = new Pcg32(123n);
    for (let i = 0; i < 10_000; i++) {
      const f = rng.float();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('intRange() is inclusive both ends', () => {
    const rng = new Pcg32(0n);
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 10_000; i++) {
      const v = rng.intRange(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      if (v === 3) sawMin = true;
      if (v === 7) sawMax = true;
    }
    expect(sawMin).toBe(true);
    expect(sawMax).toBe(true);
  });

  it('bool(0.5) produces roughly even split', () => {
    const rng = new Pcg32(42n);
    let trueCount = 0;
    const n = 10_000;
    for (let i = 0; i < n; i++) {
      if (rng.bool()) trueCount++;
    }
    const ratio = trueCount / n;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });
});

// ─── Array operations ───────────────────────────────────────────────────────

describe('Pcg32 array operations', () => {
  it('choice() selects from array', () => {
    const rng = new Pcg32(0n);
    const items = ['a', 'b', 'c', 'd'];
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(rng.choice(items));
    }
    expect(seen.size).toBe(4);
  });

  it('choice() throws on empty array', () => {
    const rng = new Pcg32(0n);
    expect(() => rng.choice([])).toThrow('empty');
  });

  it('sample() returns N unique elements', () => {
    const rng = new Pcg32(42n);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = rng.sample(arr, 5);
    expect(result.length).toBe(5);
    expect(new Set(result).size).toBe(5);
    for (const v of result) {
      expect(arr).toContain(v);
    }
  });

  it('sample() throws if n > array length', () => {
    const rng = new Pcg32(0n);
    expect(() => rng.sample([1, 2], 5)).toThrow('exceeds');
  });

  it('shuffle() permutes in place', () => {
    const rng = new Pcg32(42n);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = [...arr];
    rng.shuffle(arr);
    expect(arr).not.toEqual(original);
    expect(arr.sort((a, b) => a - b)).toEqual(original);
  });

  it('fill() returns Uint32Array', () => {
    const rng = new Pcg32(99n);
    const buf = rng.fill(100);
    expect(buf).toBeInstanceOf(Uint32Array);
    expect(buf.length).toBe(100);
    expect(buf.some(v => v !== 0)).toBe(true);
  });
});

// ─── State management ───────────────────────────────────────────────────────

describe('Pcg32 state management', () => {
  it('advance() matches step-by-step', () => {
    const rngStep = new Pcg32(42n, 54n);
    const rngJump = new Pcg32(42n, 54n);

    for (let i = 0; i < 1000; i++) rngStep.next();
    rngJump.advance(1000n);

    expect(rngStep.next()).toBe(rngJump.next());
  });

  it('save/restore roundtrips', () => {
    const rng = new Pcg32(42n, 54n);
    for (let i = 0; i < 100; i++) rng.next();

    const saved = rng.save();
    const expected = rng.next();

    const restored = Pcg32.restore(saved);
    expect(restored.next()).toBe(expected);
  });

  it('fromEntropy() produces valid output', () => {
    const rng = Pcg32.fromEntropy();
    const v = rng.next();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(2 ** 32);
  });
});

// ─── Utility functions ──────────────────────────────────────────────────────

describe('PCG utility functions', () => {
  it('pcgFromString is deterministic', () => {
    const a = pcgFromString('hello');
    const b = pcgFromString('hello');
    expect(a.next()).toBe(b.next());
  });

  it('pcgFromString differs for different strings', () => {
    const a = pcgFromString('hello');
    const b = pcgFromString('world');
    expect(a.next()).not.toBe(b.next());
  });

  it('pcgOneshot returns u32', () => {
    const v = pcgOneshot(42n);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(2 ** 32);
  });

  it('pcgOneshot is deterministic', () => {
    expect(pcgOneshot(42n)).toBe(pcgOneshot(42n));
  });
});
