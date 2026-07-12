import { describe, it, expect } from 'vitest';
import {
  suggestXrefEdges,
  formatXrefCandidates,
  type ConceptEvidence,
  type ExistingEdge,
} from '../xref-suggester.js';

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
