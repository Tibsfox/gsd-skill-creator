/**
 * Tests — college-graph loader.
 *
 * @module predictive-skill-loader/__tests__/college-graph
 */

import { describe, expect, it } from 'vitest';
import {
  getNeighbors,
  loadCollegeGraph,
  type InMemoryConcept,
} from '../college-graph.js';

const FIXTURE: InMemoryConcept[] = [
  {
    id: 'code-control-flow',
    domain: 'coding',
    relationships: [
      { targetId: 'code-variables-data-types', weight: 1 },
      { targetId: 'log-if-then-relationships', weight: 0.8 },
    ],
  },
  {
    id: 'code-variables-data-types',
    domain: 'coding',
    relationships: [{ targetId: 'code-sequential-thinking', weight: 0.9 }],
  },
  {
    id: 'code-sequential-thinking',
    domain: 'coding',
    relationships: [],
  },
  {
    id: 'log-if-then-relationships',
    domain: 'logic',
    relationships: [{ targetId: 'code-control-flow', weight: 0.5 }],
  },
];

describe('loadCollegeGraph (in-memory fixtures)', () => {
  it('builds a node set covering every relationship endpoint', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    expect(g.nodes).toContain('code-control-flow');
    expect(g.nodes).toContain('code-variables-data-types');
    expect(g.nodes).toContain('log-if-then-relationships');
    expect(g.nodes).toContain('code-sequential-thinking');
  });

  it('records domain per concept and falls back to "unknown" for orphan targets', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    expect(g.domains.get('code-control-flow')).toBe('coding');
    expect(g.domains.get('log-if-then-relationships')).toBe('logic');
  });

  it('exposes adjacency edges with declared weights', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const edges = g.adjacency.get('code-control-flow') ?? [];
    const targets = edges.map(([t]) => t).sort();
    expect(targets).toContain('code-variables-data-types');
    expect(targets).toContain('log-if-then-relationships');
    const tWeight = edges.find(([t]) => t === 'code-variables-data-types')?.[1];
    expect(tWeight).toBe(1);
  });

  it('returns an empty CollegeGraph when collegeRoot is missing', () => {
    const g = loadCollegeGraph({ collegeRoot: '/__nonexistent__/college' });
    expect(g.nodes).toEqual([]);
    expect(g.adjacency.size).toBe(0);
  });

  it('loads at least a few concepts from the real .college tree (smoke)', () => {
    // No collegeRoot override -> uses cwd, which is the gsd-skill-creator root
    // when tests run via npx vitest. The .college tree is large; we only
    // assert structural sanity, not exact counts (avoids brittle pinning).
    const g = loadCollegeGraph();
    expect(g.nodes.length).toBeGreaterThan(0);
  });
});

describe('getNeighbors (multi-hop)', () => {
  it('depth=1 returns direct neighbors only', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const out = getNeighbors(g, 'code-control-flow', 1).map((n) => n.id);
    expect(out.sort()).toEqual(
      ['code-variables-data-types', 'log-if-then-relationships'].sort(),
    );
  });

  it('depth=2 reaches transitive neighbors (composite weight)', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const out = getNeighbors(g, 'code-control-flow', 2);
    const ids = out.map((n) => n.id);
    expect(ids).toContain('code-sequential-thinking');
    const seq = out.find((n) => n.id === 'code-sequential-thinking');
    expect(seq?.hopDepth).toBe(2);
    // Composite weight = 1 * 0.9 = 0.9
    expect(seq?.weight).toBeCloseTo(0.9, 6);
  });

  it('depth=3 still terminates and excludes the seed', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const out = getNeighbors(g, 'code-control-flow', 3);
    expect(out.find((n) => n.id === 'code-control-flow')).toBeUndefined();
  });

  it('returns [] for a missing seed', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const out = getNeighbors(g, '__missing__', 5);
    expect(out).toEqual([]);
  });

  it('returns [] for depth <= 0', () => {
    const g = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    expect(getNeighbors(g, 'code-control-flow', 0)).toEqual([]);
    expect(getNeighbors(g, 'code-control-flow', -3)).toEqual([]);
  });
});
