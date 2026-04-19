/**
 * M1 Semantic Memory Graph — summaries.ts tests.
 *
 * Covers:
 *   - CF-M1-03: hierarchical summary preserves referenced-entity set
 *   - cache key invalidates on membership change
 *   - top-K by degree ordering is deterministic
 *   - temporal bounds derived from session entities
 */
import { describe, it, expect } from 'vitest';
import type { Community, Entity, Edge } from '../../types/memory.js';
import {
  summarize,
  summarizeCommunity,
  communityCacheKey,
} from '../summaries.js';

function makeGraph(): {
  entities: Map<string, Entity>;
  edges: Map<string, Edge>;
  adjacency: Map<string, Set<string>>;
} {
  const entities = new Map<string, Entity>([
    [
      'skill:a',
      { id: 'skill:a', kind: 'skill', attrs: { name: 'a' } },
    ],
    [
      'skill:b',
      { id: 'skill:b', kind: 'skill', attrs: { name: 'b' } },
    ],
    [
      'session:s1',
      {
        id: 'session:s1',
        kind: 'session',
        attrs: { sessionId: 's1', firstTs: 100, lastTs: 500 },
      },
    ],
    [
      'session:s2',
      {
        id: 'session:s2',
        kind: 'session',
        attrs: { sessionId: 's2', firstTs: 600, lastTs: 800 },
      },
    ],
    ['file:f', { id: 'file:f', kind: 'file', attrs: { path: 'foo.ts' } }],
  ]);
  const edges = new Map<string, Edge>([
    ['e1', { src: 'skill:a', dst: 'session:s1', relation: 'activated-in', weight: 3 }],
    ['e2', { src: 'skill:b', dst: 'session:s1', relation: 'activated-in', weight: 2 }],
    ['e3', { src: 'skill:a', dst: 'skill:b', relation: 'co-fired', weight: 5 }],
    ['e4', { src: 'skill:a', dst: 'session:s2', relation: 'activated-in', weight: 1 }],
  ]);
  const adjacency = new Map<string, Set<string>>();
  for (const id of entities.keys()) adjacency.set(id, new Set());
  for (const e of edges.values()) {
    adjacency.get(e.src)?.add(e.dst);
    adjacency.get(e.dst)?.add(e.src);
  }
  return { entities, edges, adjacency };
}

describe('summaries — CF-M1-03: referenced-entity set preserved', () => {
  it('every community member appears in summary.memberIds', () => {
    const { entities, edges, adjacency } = makeGraph();
    const community: Community = {
      id: 'c1',
      level: 0,
      members: ['skill:a', 'skill:b', 'session:s1', 'session:s2', 'file:f'],
    };
    const summary = summarizeCommunity(community, entities, edges, adjacency);
    expect(summary.memberIds.sort()).toEqual([...community.members].sort());
    for (const m of community.members) {
      expect(summary.memberIds).toContain(m);
    }
  });

  it('no entity silently drops from member list on repeat summarization', () => {
    const { entities, edges, adjacency } = makeGraph();
    const community: Community = {
      id: 'c1',
      level: 0,
      members: Array.from(entities.keys()),
    };
    const s1 = summarizeCommunity(community, entities, edges, adjacency);
    const s2 = summarizeCommunity(community, entities, edges, adjacency);
    expect(s1.memberIds).toEqual(s2.memberIds);
  });
});

describe('summaries — cache key semantics', () => {
  it('same members → same cache key', () => {
    const a = communityCacheKey(['x', 'y', 'z']);
    const b = communityCacheKey(['z', 'y', 'x']); // order-insensitive
    expect(a).toBe(b);
  });

  it('different members → different cache key', () => {
    const a = communityCacheKey(['x', 'y']);
    const b = communityCacheKey(['x', 'z']);
    expect(a).not.toBe(b);
  });

  it('cache reuses summaries when membership unchanged', () => {
    const { entities, edges, adjacency } = makeGraph();
    const community: Community = {
      id: 'c1',
      level: 0,
      members: ['skill:a', 'skill:b'],
    };
    const first = summarize([[community]], entities, edges, adjacency);
    const second = summarize([[community]], entities, edges, adjacency, first);
    expect(second.byCommunityId.get('c1')).toBe(first.byCommunityId.get('c1'));
  });

  it('cache invalidates on membership change', () => {
    const { entities, edges, adjacency } = makeGraph();
    const c1: Community = {
      id: 'c1',
      level: 0,
      members: ['skill:a', 'skill:b'],
    };
    const c1Changed: Community = {
      id: 'c1',
      level: 0,
      members: ['skill:a', 'skill:b', 'file:f'],
    };
    const first = summarize([[c1]], entities, edges, adjacency);
    const second = summarize([[c1Changed]], entities, edges, adjacency, first);
    const oldSummary = first.byCommunityId.get('c1')!;
    const newSummary = second.byCommunityId.get('c1')!;
    expect(newSummary).not.toBe(oldSummary);
    expect(newSummary.memberIds).toContain('file:f');
  });
});

describe('summaries — derived fields', () => {
  it('temporal bounds pulled from session entities', () => {
    const { entities, edges, adjacency } = makeGraph();
    const community: Community = {
      id: 'c1',
      level: 0,
      members: ['session:s1', 'session:s2', 'skill:a'],
    };
    const summary = summarizeCommunity(community, entities, edges, adjacency);
    expect(summary.temporalBounds).not.toBeNull();
    expect(summary.temporalBounds!.firstTs).toBe(100);
    expect(summary.temporalBounds!.lastTs).toBe(800);
  });

  it('temporalBounds is null when no session is in the community', () => {
    const { entities, edges, adjacency } = makeGraph();
    const community: Community = {
      id: 'c1',
      level: 0,
      members: ['skill:a', 'skill:b', 'file:f'],
    };
    const summary = summarizeCommunity(community, entities, edges, adjacency);
    expect(summary.temporalBounds).toBeNull();
  });

  it('top entities are sorted by degree desc', () => {
    const { entities, edges, adjacency } = makeGraph();
    const community: Community = {
      id: 'c1',
      level: 0,
      members: ['skill:a', 'skill:b', 'session:s1', 'session:s2', 'file:f'],
    };
    const summary = summarizeCommunity(community, entities, edges, adjacency, { topK: 3 });
    expect(summary.topEntities).toHaveLength(3);
    for (let i = 1; i < summary.topEntities.length; i++) {
      expect(summary.topEntities[i].degree).toBeLessThanOrEqual(
        summary.topEntities[i - 1].degree,
      );
    }
  });
});
