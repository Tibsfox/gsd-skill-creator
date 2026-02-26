import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive } from '../types/mfe-types.js';
import { prefilterDuplicates } from './dedup-prefilter.js';
import type { PrefilterConfig } from './dedup-prefilter.js';

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'test-prim',
    name: 'Test Primitive',
    type: 'definition',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: 'Test formal statement',
    computationalForm: 'test(x) = x',
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: ['test'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

describe('dedup pre-filter: distance calculation', () => {
  it('flags candidate within distance 0.2 of existing primitive with 2+ shared keywords', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space', 'linear'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: 0.55, imaginary: 0.35 },
      keywords: ['vector', 'space', 'basis'],
    });

    const result = prefilterDuplicates(candidate, [existing]);

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    expect(result.matches[0].existingId).toBe('existing-1');
    expect(result.flagged).toBe(true);
  });

  it('does not flag candidate beyond distance 0.2', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: -0.5, imaginary: -0.3 },
      keywords: ['vector', 'space'],
    });

    const result = prefilterDuplicates(candidate, [existing]);

    expect(result.matches.length).toBe(0);
    expect(result.flagged).toBe(false);
  });

  it('does not flag candidate with fewer than 2 shared keywords', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: 0.55, imaginary: 0.35 },
      keywords: ['vector', 'matrix'],
    });

    const result = prefilterDuplicates(candidate, [existing]);

    expect(result.matches.length).toBe(0);
    expect(result.flagged).toBe(false);
  });

  it('requires BOTH distance AND keyword conditions', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['completely', 'different'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: 0.5, imaginary: 0.3 }, // same position (distance 0)
      keywords: ['nothing', 'shared'],
    });

    const result = prefilterDuplicates(candidate, [existing]);

    expect(result.matches.length).toBe(0);
    expect(result.flagged).toBe(false);
  });
});

describe('dedup pre-filter: ranking', () => {
  it('returns matches ranked by proximity (closest first)', () => {
    const existingA = makePrimitive({
      id: 'existing-a',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space'],
    });
    const existingB = makePrimitive({
      id: 'existing-b',
      planePosition: { real: 0.52, imaginary: 0.32 },
      keywords: ['vector', 'space'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: 0.51, imaginary: 0.31 },
      keywords: ['vector', 'space', 'norm'],
    });

    const result = prefilterDuplicates(candidate, [existingA, existingB]);

    expect(result.matches.length).toBe(2);
    expect(result.matches[0].existingId).toBe('existing-b');
    expect(result.matches[1].existingId).toBe('existing-a');
  });

  it('returns distance and shared keyword count in each match', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space', 'linear'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: 0.55, imaginary: 0.35 },
      keywords: ['vector', 'space', 'basis'],
    });

    const result = prefilterDuplicates(candidate, [existing]);

    expect(result.matches.length).toBe(1);
    const match = result.matches[0];
    expect(typeof match.distance).toBe('number');
    expect(match.distance).toBeGreaterThan(0);
    expect(Array.isArray(match.sharedKeywords)).toBe(true);
    expect(match.sharedKeywords.length).toBeGreaterThanOrEqual(2);
  });
});

describe('dedup pre-filter: edge cases', () => {
  it('empty registry returns zero matches', () => {
    const candidate = makePrimitive({ id: 'candidate-1' });

    const result = prefilterDuplicates(candidate, []);

    expect(result.matches.length).toBe(0);
    expect(result.flagged).toBe(false);
  });

  it('candidate at exact same position with same keywords returns match', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space'],
    });

    const result = prefilterDuplicates(candidate, [existing]);

    expect(result.matches.length).toBe(1);
    expect(result.flagged).toBe(true);
    expect(result.matches[0].distance).toBeCloseTo(0, 5);
  });

  it('config overrides distance threshold and min shared keywords', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      planePosition: { real: 0.5, imaginary: 0.3 },
      keywords: ['vector', 'space', 'linear'],
    });

    // Candidate at distance ~0.4 with 3 shared keywords
    const candidate3 = makePrimitive({
      id: 'candidate-3kw',
      planePosition: { real: 0.8, imaginary: 0.5 },
      keywords: ['vector', 'space', 'linear', 'algebra'],
    });

    // Candidate at distance ~0.4 with 2 shared keywords
    const candidate2 = makePrimitive({
      id: 'candidate-2kw',
      planePosition: { real: 0.8, imaginary: 0.5 },
      keywords: ['vector', 'space', 'algebra'],
    });

    const config: Partial<PrefilterConfig> = { maxDistance: 0.5, minSharedKeywords: 3 };

    const result3 = prefilterDuplicates(candidate3, [existing], config);
    expect(result3.matches.length).toBe(1);
    expect(result3.flagged).toBe(true);

    const result2 = prefilterDuplicates(candidate2, [existing], config);
    expect(result2.matches.length).toBe(0);
    expect(result2.flagged).toBe(false);
  });
});

describe('dedup pre-filter: performance', () => {
  it('processes 500 registry primitives in under 50ms', () => {
    const registry: MathematicalPrimitive[] = [];
    for (let i = 0; i < 500; i++) {
      registry.push(
        makePrimitive({
          id: `prim-${i}`,
          planePosition: {
            real: -1 + (2 * i) / 500,
            imaginary: -1 + (2 * (i % 100)) / 100,
          },
          keywords: [`kw-${i % 10}`, `kw-${(i + 1) % 10}`, `kw-${(i + 2) % 10}`],
        }),
      );
    }
    const candidate = makePrimitive({
      id: 'candidate-perf',
      planePosition: { real: 0, imaginary: 0 },
      keywords: ['kw-0', 'kw-1'],
    });

    const start = performance.now();
    prefilterDuplicates(candidate, registry);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});
