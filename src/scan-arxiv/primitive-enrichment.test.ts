import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive, DomainId } from '../types/mfe-types.js';
import {
  deriveCompositions,
  refinePlanePositions,
  embedPrimitives,
  PLANE_ANCHORS,
  __sourceIdOfForTests as sourceIdOf,
  type TextEmbedder,
} from './primitive-enrichment.js';

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'arxiv-cs-test',
    name: 'Test',
    type: 'definition',
    domain: 'arxiv-cs' as DomainId,
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: 'a test concept',
    computationalForm: 'test(x)',
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: [],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

/** Embedder that returns a tag-driven 8-dim vector so cosine sims are
 *  predictable. Each input text maps to a unit vector along an axis. */
function makeTagEmbedder(map: Record<string, number[]>): TextEmbedder {
  return async (text: string) => {
    for (const key of Object.keys(map)) {
      if (text.includes(key)) return map[key];
    }
    return new Array(8).fill(0);
  };
}

describe('sourceIdOf', () => {
  it('strips the slug after the last dash', () => {
    expect(sourceIdOf('arxiv-cs-pythagoras')).toBe('arxiv-cs');
  });

  it('handles a trailing numeric suffix added for de-dup', () => {
    expect(sourceIdOf('arxiv-cs-pythagoras-3')).toBe('arxiv-cs');
  });
});

describe('refinePlanePositions', () => {
  it('returns an empty array on empty input', async () => {
    const result = await refinePlanePositions([], { embedder: async () => [] });
    expect(result).toEqual([]);
  });

  it('places a logic-aligned primitive in the (-,+) abstract-logic quadrant', async () => {
    // Build an embedder that aligns the logic anchor with axis 0, the
    // abstract anchor with axis 2, and the "logical theorem" primitive
    // text with axis 0 (= 100% logic) + a small abstract bias.
    const v = (i: number, mag = 1) => {
      const out = new Array(8).fill(0);
      out[i] = mag;
      return out;
    };
    const embedder = makeTagEmbedder({
      [PLANE_ANCHORS.logic]: v(0, 1),
      [PLANE_ANCHORS.creativity]: v(1, 1),
      [PLANE_ANCHORS.embodied]: v(3, 1),
      [PLANE_ANCHORS.abstract]: v(2, 1),
      'logical theorem': v(0, 1), // pure logic
    });
    const p = makePrimitive({ formalStatement: 'logical theorem' });
    const [refined] = await refinePlanePositions([p], { embedder });
    // real = cos(creativity) - cos(logic) = 0 - 1 = -1 (logic-aligned)
    expect(refined.planePosition.real).toBeCloseTo(-1, 5);
    // imaginary = cos(abstract) - cos(embodied) = 0 - 0 = 0
    expect(refined.planePosition.imaginary).toBeCloseTo(0, 5);
  });

  it('clamps projection results into [-1, 1]', async () => {
    // Force a primitive vector that anti-correlates with anchors; the
    // contrast subtraction can produce values outside [-1, 1] in theory.
    const embedder = async (text: string) => {
      if (text === PLANE_ANCHORS.creativity) {
        const x = new Array(4).fill(0); x[0] = 1; return x;
      }
      if (text === PLANE_ANCHORS.logic) {
        const x = new Array(4).fill(0); x[0] = -1; return x;
      }
      if (text === PLANE_ANCHORS.abstract) return [0, 1, 0, 0];
      if (text === PLANE_ANCHORS.embodied) return [0, -1, 0, 0];
      // creative+abstract primitive: aligned with both creativity and abstract.
      return [0.7, 0.7, 0, 0];
    };
    const p = makePrimitive({ formalStatement: 'super creative concept' });
    const [refined] = await refinePlanePositions([p], { embedder });
    expect(refined.planePosition.real).toBeGreaterThanOrEqual(-1);
    expect(refined.planePosition.real).toBeLessThanOrEqual(1);
    expect(refined.planePosition.imaginary).toBeGreaterThanOrEqual(-1);
    expect(refined.planePosition.imaginary).toBeLessThanOrEqual(1);
  });

  it('uses primitiveEmbeddings when provided (skips re-embedding)', async () => {
    let embedCalls = 0;
    const embedder: TextEmbedder = async () => {
      embedCalls++;
      return [1, 0, 0, 0];
    };
    const ps = [
      makePrimitive({ id: 'p1', formalStatement: 'one' }),
      makePrimitive({ id: 'p2', formalStatement: 'two' }),
    ];
    const preEmb = [[1, 0, 0, 0], [0, 1, 0, 0]];
    await refinePlanePositions(ps, { embedder, primitiveEmbeddings: preEmb });
    // 4 anchor embeddings only; primitive embeddings reused.
    expect(embedCalls).toBe(4);
  });
});

describe('deriveCompositions', () => {
  it('returns an empty array on empty input', async () => {
    const result = await deriveCompositions([], { embedder: async () => [] });
    expect(result).toEqual([]);
  });

  it('adds a sequential rule when two primitives share a source id', async () => {
    const p1 = makePrimitive({ id: 'arxiv-cs-foo', name: 'foo', formalStatement: 'topic A' });
    const p2 = makePrimitive({ id: 'arxiv-cs-bar', name: 'bar', formalStatement: 'topic A v2' });
    // Same source-id prefix → 'sequential'. Identical embeddings → sim = 1.
    const embedder: TextEmbedder = async () => [1, 0, 0, 0];
    const [enrichedP1] = await deriveCompositions([p1, p2], { embedder, similarityThreshold: 0.5 });
    expect(enrichedP1.compositionRules).toHaveLength(1);
    expect(enrichedP1.compositionRules[0].with).toBe('arxiv-cs-bar');
    expect(enrichedP1.compositionRules[0].type).toBe('sequential');
  });

  it('adds a parallel rule when sources differ', async () => {
    const p1 = makePrimitive({ id: 'arxiv-cs-foo', name: 'foo' });
    const p2 = makePrimitive({ id: 'arxiv-math-bar', name: 'bar' });
    const embedder: TextEmbedder = async () => [1, 0, 0, 0];
    const [enrichedP1] = await deriveCompositions([p1, p2], { embedder, similarityThreshold: 0.5 });
    expect(enrichedP1.compositionRules).toHaveLength(1);
    expect(enrichedP1.compositionRules[0].type).toBe('parallel');
  });

  it('skips pairs below the similarity threshold', async () => {
    const p1 = makePrimitive({ id: 'p1', formalStatement: 'one' });
    const p2 = makePrimitive({ id: 'p2', formalStatement: 'two' });
    const embedder = makeTagEmbedder({
      one: [1, 0, 0, 0],
      two: [0, 1, 0, 0], // orthogonal → sim = 0
    });
    const [enrichedP1] = await deriveCompositions([p1, p2], { embedder, similarityThreshold: 0.5 });
    expect(enrichedP1.compositionRules).toHaveLength(0);
  });

  it('caps composition rules at maxRulesPerPrimitive', async () => {
    // 6 primitives all colinear → top should be capped to 3.
    const ps = Array.from({ length: 6 }, (_, i) => makePrimitive({ id: `p${i}` }));
    const embedder: TextEmbedder = async () => [1, 0, 0, 0];
    const enriched = await deriveCompositions(ps, {
      embedder,
      similarityThreshold: 0.5,
      maxRulesPerPrimitive: 3,
    });
    expect(enriched[0].compositionRules).toHaveLength(3);
  });

  it('does not include a primitive as a rule with itself', async () => {
    const p = makePrimitive({ id: 'p1' });
    const embedder: TextEmbedder = async () => [1, 0, 0, 0];
    const [enriched] = await deriveCompositions([p, p], { embedder, similarityThreshold: 0.5 });
    expect(enriched.compositionRules.every(r => r.with !== p.id || r.yields !== `${p.name} + ${p.name}`)).toBe(true);
  });

  it('preserves pre-existing compositionRules and appends derived ones', async () => {
    const p1 = makePrimitive({
      id: 'arxiv-cs-foo',
      compositionRules: [
        { with: 'pre-existing', yields: 'kept', type: 'nested', conditions: [], example: '' },
      ],
    });
    const p2 = makePrimitive({ id: 'arxiv-cs-bar' });
    const embedder: TextEmbedder = async () => [1, 0, 0, 0];
    const [enriched] = await deriveCompositions([p1, p2], { embedder, similarityThreshold: 0.5 });
    expect(enriched.compositionRules).toHaveLength(2);
    expect(enriched.compositionRules[0].with).toBe('pre-existing');
  });
});

describe('embedPrimitives', () => {
  it('embeds each primitive once and returns parallel array', async () => {
    let n = 0;
    const embedder: TextEmbedder = async () => {
      n++;
      return [n];
    };
    const ps = [
      makePrimitive({ id: 'p1', formalStatement: 'one' }),
      makePrimitive({ id: 'p2', formalStatement: 'two' }),
      makePrimitive({ id: 'p3', formalStatement: 'three' }),
    ];
    const result = await embedPrimitives(ps, embedder);
    expect(result).toHaveLength(3);
    expect(result.map(v => v[0])).toEqual([1, 2, 3]);
  });

  it('falls back to name when formalStatement is empty', async () => {
    let seen: string[] = [];
    const embedder: TextEmbedder = async (t) => { seen.push(t); return [0]; };
    const p = makePrimitive({ name: 'FallbackName', formalStatement: '' });
    await embedPrimitives([p], embedder);
    expect(seen).toEqual(['FallbackName']);
  });
});
