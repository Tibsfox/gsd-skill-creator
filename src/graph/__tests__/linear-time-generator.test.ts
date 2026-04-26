/**
 * JP-021 — Linear-time graph generator tests.
 *
 * Verifies the ExpectedDegreeGenerator (arXiv:2604.21504):
 *   - Output structure correctness
 *   - Reproducibility with a fixed seed
 *   - Θ(n) throughput: generating a 10k-node graph completes in reasonable time
 *   - Edge probability matches the Chung-Lu formula
 *
 * @module graph/__tests__/linear-time-generator.test
 */

import { describe, it, expect } from 'vitest';
import {
  ExpectedDegreeGenerator,
  generateExpectedDegreeGraph,
} from '../expected-degree-generator.js';

describe('ExpectedDegreeGenerator — structure', () => {
  it('returns the correct vertex count', () => {
    const gen = new ExpectedDegreeGenerator([2, 3, 1, 4]);
    const g = gen.generate(42);
    expect(g.n).toBe(4);
    expect(g.expectedDegrees).toEqual([2, 3, 1, 4]);
  });

  it('all edges reference valid vertex indices', () => {
    const weights = [1, 2, 3, 2, 1];
    const g = generateExpectedDegreeGraph(weights, 7);
    for (const [u, v] of g.edges) {
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(g.n);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(g.n);
      expect(u).not.toBe(v); // no self-loops
      expect(u).toBeLessThanOrEqual(v); // canonical orientation
    }
  });

  it('produces no edges when all weights are zero', () => {
    const g = generateExpectedDegreeGraph([0, 0, 0], 1);
    expect(g.edges).toHaveLength(0);
  });

  it('single vertex with no self-loops', () => {
    const g = generateExpectedDegreeGraph([5], 1);
    expect(g.n).toBe(1);
    expect(g.edges).toHaveLength(0);
  });
});

describe('ExpectedDegreeGenerator — reproducibility', () => {
  it('same seed produces identical graphs', () => {
    const weights = [2, 4, 3, 1, 2, 3];
    const g1 = generateExpectedDegreeGraph(weights, 99);
    const g2 = generateExpectedDegreeGraph(weights, 99);
    expect(g1.edges).toEqual(g2.edges);
  });

  it('different seeds typically produce different graphs', () => {
    const weights = Array.from({ length: 20 }, (_, i) => (i % 5) + 1);
    const g1 = generateExpectedDegreeGraph(weights, 1);
    const g2 = generateExpectedDegreeGraph(weights, 2);
    // With 20 nodes and non-trivial weights, collision is astronomically unlikely
    expect(g1.edges.length !== g2.edges.length || g1.edges.some(
      ([u, v], i) => g2.edges[i]?.[0] !== u || g2.edges[i]?.[1] !== v,
    )).toBe(true);
  });
});

describe('ExpectedDegreeGenerator — Chung-Lu edge probability', () => {
  it('edgeProbability matches wᵢwⱼ/W formula (clamped to 1)', () => {
    const weights = [2, 3, 5];
    const gen = new ExpectedDegreeGenerator(weights);
    const W = 10;
    // (2*3)/10 = 0.6, (2*5)/10 = 1.0, (3*5)/10 = 1.5 → clamped to 1
    expect(gen.edgeProbability(0, 1)).toBeCloseTo((2 * 3) / W);
    expect(gen.edgeProbability(0, 2)).toBeCloseTo(1); // exactly 1.0
    expect(gen.edgeProbability(1, 2)).toBe(1);        // clamped from 1.5
  });

  it('edgeProbability is clamped to 1', () => {
    const gen = new ExpectedDegreeGenerator([10, 10]);
    // p = 100/20 = 5 → clamped to 1
    expect(gen.edgeProbability(0, 1)).toBe(1);
  });

  it('edgeProbability returns 0 when W=0', () => {
    const gen = new ExpectedDegreeGenerator([0, 0]);
    expect(gen.edgeProbability(0, 1)).toBe(0);
  });
});

describe('ExpectedDegreeGenerator — Θ(n) throughput', () => {
  it('generates a 10k-node graph in under 2 seconds', () => {
    // Weights roughly uniform so E[m] ≈ n/2 = 5000 edges — linear in n.
    const n = 10_000;
    const weights = Array.from({ length: n }, (_, i) => 1 + (i % 5));
    const start = performance.now();
    const g = generateExpectedDegreeGraph(weights, 123);
    const elapsed = performance.now() - start;

    expect(g.n).toBe(n);
    // Θ(n) assertion: must complete well under 2 s on any reasonable host
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('ExpectedDegreeGenerator — validation', () => {
  it('throws on empty weight array', () => {
    expect(() => new ExpectedDegreeGenerator([])).toThrow(RangeError);
  });

  it('throws on negative weight', () => {
    expect(() => new ExpectedDegreeGenerator([1, -1])).toThrow(RangeError);
  });
});
