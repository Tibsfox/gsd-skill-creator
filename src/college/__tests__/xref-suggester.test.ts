import { describe, it, expect } from 'vitest';
import {
  suggestXrefEdges,
  suggestXrefEdgesSemantic,
  formatXrefCandidates,
  type ConceptEvidence,
  type ExistingEdge,
  type XrefEmbedder,
} from '../xref-suggester.js';

/** Deterministic mock embedder keyed by the exact description text. */
function mockEmbedder(vectors: Record<string, number[]>): XrefEmbedder {
  return {
    async embed(text: string) {
      return { embedding: vectors[text] ?? [0, 0] };
    },
  };
}

const concepts: ConceptEvidence[] = [
  {
    id: 'derivative',
    domain: 'math',
    relationships: [
      { type: 'analogy', targetId: 'velocity', description: 'rate of change' },
      { type: 'dependency', targetId: 'limit' },
    ],
  },
  {
    id: 'limit',
    domain: 'math',
    relationships: [],
  },
  {
    id: 'velocity',
    domain: 'physics',
    relationships: [{ type: 'cross-reference', targetId: 'derivative' }],
  },
  {
    id: 'harmony',
    domain: 'music',
    relationships: [{ type: 'analogy', targetId: 'ratio' }],
  },
  {
    id: 'ratio',
    domain: 'math',
    relationships: [],
  },
];

const existing: ExistingEdge[] = [
  { from: 'math', to: 'physics' }, // already known -> must be excluded
];

describe('suggestXrefEdges', () => {
  it('discovers cross-department candidates not already in the edge set', () => {
    const out = suggestXrefEdges(concepts, existing);
    const keys = out.map((c) => `${c.from}->${c.to}`);
    // physics->math (velocity xref derivative) and music->math (harmony analogy ratio)
    expect(keys).toContain('physics->math');
    expect(keys).toContain('music->math');
  });

  it('dedups against existing edges (math->physics excluded)', () => {
    const out = suggestXrefEdges(concepts, existing);
    expect(out.some((c) => c.from === 'math' && c.to === 'physics')).toBe(false);
  });

  it('never suggests same-department (self) edges', () => {
    // derivative->limit is math->math and must not appear as a candidate
    const out = suggestXrefEdges(concepts, []);
    expect(out.some((c) => c.from === c.to)).toBe(false);
  });

  it('drops relationships whose target concept is unknown', () => {
    const withDangling: ConceptEvidence[] = [
      {
        id: 'a',
        domain: 'coding',
        relationships: [{ type: 'analogy', targetId: 'nonexistent' }],
      },
    ];
    expect(suggestXrefEdges(withDangling, [])).toEqual([]);
  });

  it('counts multiple crossings and carries bounded examples', () => {
    const out = suggestXrefEdges(concepts, existing);
    const musicMath = out.find((c) => c.from === 'music' && c.to === 'math');
    expect(musicMath?.relationCount).toBe(1);
    expect(musicMath?.examples[0]).toBe('harmony -[analogy]-> ratio');
  });

  it('filters by source department when --dept is given', () => {
    const out = suggestXrefEdges(concepts, existing, { dept: 'music' });
    expect(out.length).toBe(1);
    expect(out[0]!.from).toBe('music');
  });

  it('ranks by score then relationCount deterministically', () => {
    const many: ConceptEvidence[] = [
      { id: 'x1', domain: 'a', relationships: [{ type: 'analogy', targetId: 'y1' }] },
      { id: 'x2', domain: 'a', relationships: [{ type: 'analogy', targetId: 'y2' }] },
      { id: 'y1', domain: 'b', relationships: [] },
      { id: 'y2', domain: 'b', relationships: [] },
      { id: 'z1', domain: 'c', relationships: [{ type: 'analogy', targetId: 'w1' }] },
      { id: 'w1', domain: 'd', relationships: [] },
    ];
    const out = suggestXrefEdges(many, []);
    // a->b has 2 crossings, c->d has 1 -> a->b ranks first
    expect(out[0]!.from).toBe('a');
    expect(out[0]!.to).toBe('b');
    expect(out[0]!.relationCount).toBe(2);
  });

  it('applies proximity reinforcement only when tolerance > 0', () => {
    const positioned: ConceptEvidence[] = [
      {
        id: 'p1',
        domain: 'math',
        relationships: [{ type: 'analogy', targetId: 'q1' }],
        complexPlanePosition: { real: 0, imaginary: 0 },
      },
      {
        id: 'q1',
        domain: 'art',
        relationships: [],
        complexPlanePosition: { real: 0.1, imaginary: 0.1 },
      },
    ];
    const off = suggestXrefEdges(positioned, []);
    expect(off[0]!.proximityCount).toBe(0);
    const on = suggestXrefEdges(positioned, [], { proximityTolerance: 1, proximityWeight: 0.5 });
    expect(on[0]!.proximityCount).toBe(1);
    expect(on[0]!.score).toBeCloseTo(1.5); // 1 relation + 0.5 * 1 proximity
  });

  it('never mutates the input edge set (human-review only)', () => {
    const frozen = Object.freeze([...existing]);
    expect(() => suggestXrefEdges(concepts, frozen)).not.toThrow();
    expect(frozen.length).toBe(1);
  });
});

describe('suggestXrefEdgesSemantic', () => {
  const semConcepts: ConceptEvidence[] = [
    { id: 'algebra', domain: 'math', description: 'symbolic structure', relationships: [] },
    { id: 'symmetry', domain: 'physics', description: 'invariance under transformation', relationships: [] },
    { id: 'counterpoint', domain: 'music', description: 'independent melodic lines', relationships: [] },
  ];
  const vectors = {
    'symbolic structure': [1, 0],
    'invariance under transformation': [0.98, 0.2], // ~0.98 cos with [1,0]
    'independent melodic lines': [0, 1], // orthogonal to both
  };

  it('discovers cross-department edges from description similarity (both directions)', async () => {
    const out = await suggestXrefEdgesSemantic(semConcepts, [], mockEmbedder(vectors));
    const keys = out.map((c) => `${c.from}->${c.to}`);
    expect(keys).toContain('math->physics');
    expect(keys).toContain('physics->math');
    // music is orthogonal to both -> no edge to/from it
    expect(keys.some((k) => k.includes('music'))).toBe(false);
  });

  it('scores a pure-semantic candidate by semanticWeight * semanticCount', async () => {
    const out = await suggestXrefEdgesSemantic(semConcepts, [], mockEmbedder(vectors));
    const mp = out.find((c) => c.from === 'math' && c.to === 'physics')!;
    expect(mp.relationCount).toBe(0);
    expect(mp.semanticCount).toBe(1);
    expect(mp.topSimilarity).toBeCloseTo(0.98, 1);
    expect(mp.score).toBeCloseTo(0.5); // default semanticWeight 0.5 * 1
  });

  it('respects the similarity threshold', async () => {
    // Threshold above the observed ~0.98 similarity drops all semantic votes.
    const out = await suggestXrefEdgesSemantic(semConcepts, [], mockEmbedder(vectors), {
      similarityThreshold: 0.99,
    });
    expect(out).toEqual([]);
  });

  it('dedups semantic candidates against existing edges', async () => {
    const out = await suggestXrefEdgesSemantic(
      semConcepts,
      [{ from: 'math', to: 'physics' }],
      mockEmbedder(vectors),
    );
    expect(out.some((c) => c.from === 'math' && c.to === 'physics')).toBe(false);
    // reverse direction is a distinct edge and still surfaces
    expect(out.some((c) => c.from === 'physics' && c.to === 'math')).toBe(true);
  });

  it('merges semantic votes into relationship-derived candidates without duplicating', async () => {
    const merged: ConceptEvidence[] = [
      {
        id: 'derivative',
        domain: 'math',
        description: 'rate of change',
        relationships: [{ type: 'analogy', targetId: 'velocity' }],
      },
      {
        id: 'velocity',
        domain: 'physics',
        description: 'rate of change of position',
        relationships: [{ type: 'cross-reference', targetId: 'derivative' }],
      },
    ];
    const embedder = mockEmbedder({
      'rate of change': [1, 0],
      'rate of change of position': [0.98, 0.2],
    });
    const out = await suggestXrefEdgesSemantic(merged, [], embedder);
    // Exactly the two directed dept edges — semantic did not duplicate them.
    expect(out.length).toBe(2);
    const pm = out.find((c) => c.from === 'physics' && c.to === 'math')!;
    expect(pm.relationCount).toBe(1);
    expect(pm.semanticCount).toBe(1);
    expect(pm.score).toBeCloseTo(1.5); // 1 relation + 0.5 * 1 semantic
    expect(pm.rationale).toContain('description-similar');
  });

  it('skips concepts with no description or name', async () => {
    const noText: ConceptEvidence[] = [
      { id: 'a', domain: 'x', relationships: [] },
      { id: 'b', domain: 'y', relationships: [] },
    ];
    const out = await suggestXrefEdgesSemantic(noText, [], mockEmbedder({}));
    expect(out).toEqual([]);
  });
});

describe('formatXrefCandidates', () => {
  it('renders a reviewable diff of additions', () => {
    const out = suggestXrefEdges(concepts, existing);
    const text = formatXrefCandidates(out);
    expect(text).toContain("+ { from: 'music', to: 'math' }");
    expect(text).toContain('HUMAN REVIEW ONLY');
  });

  it('reports when nothing new is found', () => {
    expect(formatXrefCandidates([])).toContain('No new cross-department xref edges');
  });
});
