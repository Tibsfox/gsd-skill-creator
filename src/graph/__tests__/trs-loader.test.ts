/**
 * M1 Semantic Memory Graph — TRS edge loader tests (IC-613-1.3).
 *
 * Covers:
 *   - schema mapping (pack + citation entities, cross-pack-binding edges)
 *   - pack identity inference (pack-09-001 source → pack-09 entity)
 *   - milestone-bound metadata propagates onto edge.metadata
 *   - pack-contains synthesised edges link pack → citation
 *   - idempotency: load twice → zero new entities/edges on second load
 *   - graceful skip of malformed edge endpoints (no throw)
 *   - end-to-end load against the real edges.json on disk
 */
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import {
  createTrsGraph,
  loadTrsEdges,
  edgesAtMilestone,
  boundPacks,
  resolveEndpoint,
  trsEntitiesByKind,
  trsEntityId,
  trsEdgeId,
  TRS_EDGE_RELATIONS,
} from '../trs-loader.js';

const REAL_JSON_PATH = resolve(
  process.cwd(),
  'www/tibsfox/com/Research/TRS/edges.json',
);

// Synthetic fixture covering the schema cases we want to assert. Built to
// mirror the real schema produced by tools/build-trs-edges.mjs.
const SYNTHETIC_FIXTURE = {
  schema: 'trs-edges/v1',
  generated_at: '2026-05-07T00:00:00.000Z',
  total_edges: 4,
  milestone_count: 2,
  milestones: [
    {
      milestone: 'v1.49.608',
      pack_bound: 'pack-09-functional-analysis',
      predecessor_pack: 'pack-02-differential-geometry',
      edges: [
        {
          id: 57,
          source: 'pack-09-001',
          target: 'pack-01-002',
          relation: 'cross-pack-paired-with',
          description: 'Hilbert space test edge',
          milestone_bound: 'v1.49.608',
          pack_bound: 'pack-09-functional-analysis',
        },
        {
          id: 58,
          source: 'pack-09-005',
          target: 'pack-02-001',
          relation: 'cross-pack-paired-with',
          description: 'Riesz representation test edge',
          milestone_bound: 'v1.49.608',
          pack_bound: 'pack-09-functional-analysis',
        },
      ],
    },
    {
      milestone: 'v1.49.613',
      pack_bound: 'pack-13-computational-complexity',
      predecessor_pack: 'pack-12-mathematical-logic',
      edges: [
        {
          id: 83,
          source: 'pack-13-001',
          target: 'pack-12-002',
          relation: 'cross-pack-paired-with',
          description: 'P vs NP <-> Gödel test edge',
          milestone_bound: 'v1.49.613',
          pack_bound: 'pack-13-computational-complexity',
        },
        {
          id: 84,
          source: 'pack-13', // bare-pack endpoint (no slot)
          target: 'pack-09-001',
          relation: 'cross-pack-paired-with',
          description: 'Whole-pack endpoint test',
          milestone_bound: 'v1.49.613',
          pack_bound: 'pack-13-computational-complexity',
        },
      ],
    },
  ],
};

describe('trs-loader — endpoint resolution', () => {
  it('parses citation-style refs (pack-09-001) into pack + citation', () => {
    expect(resolveEndpoint('pack-09-001')).toEqual({
      packId: 'pack-09',
      citationId: 'pack-09-001',
    });
  });

  it('parses bare-pack refs (pack-13) into pack only', () => {
    expect(resolveEndpoint('pack-13')).toEqual({
      packId: 'pack-13',
      citationId: null,
    });
  });

  it('throws on malformed refs', () => {
    expect(() => resolveEndpoint('not-a-pack')).toThrow(/malformed/);
  });
});

describe('trs-loader — schema mapping', () => {
  it('produces trs:pack entities for every pack referenced', async () => {
    const g = createTrsGraph();
    const r = await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    // packs referenced: pack-01, pack-02, pack-09, pack-12, pack-13 = 5
    expect(r.packsRecognized).toBe(5);
    const packs = trsEntitiesByKind(g, 'trs:pack');
    expect(packs.map((p) => (p.attrs as Record<string, unknown>).packId).sort()).toEqual([
      'pack-01',
      'pack-02',
      'pack-09',
      'pack-12',
      'pack-13',
    ]);
  });

  it('produces trs:citation entities only for slot-suffixed refs', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const citations = trsEntitiesByKind(g, 'trs:citation');
    const citationIds = citations
      .map((c) => (c.attrs as Record<string, unknown>).citationId as string)
      .sort();
    // pack-13 (bare) is NOT promoted to a citation; everything else is.
    expect(citationIds).toEqual([
      'pack-01-002',
      'pack-02-001',
      'pack-09-001',
      'pack-09-005',
      'pack-12-002',
      'pack-13-001',
    ]);
  });

  it('produces a cross-pack-binding edge per source-JSON edge', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const bindings: typeof g.edges extends Map<string, infer V> ? V[] : never = [];
    for (const e of g.edges.values()) {
      if (e.relation === TRS_EDGE_RELATIONS.CROSS_PACK_BINDING) bindings.push(e);
    }
    expect(bindings).toHaveLength(4);
  });

  it('synthesises pack-contains edges for every citation', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const containing: typeof g.edges extends Map<string, infer V> ? V[] : never = [];
    for (const e of g.edges.values()) {
      if (e.relation === TRS_EDGE_RELATIONS.PACK_CONTAINS) containing.push(e);
    }
    // 6 citations → 6 pack-contains edges
    expect(containing).toHaveLength(6);
  });

  it('propagates milestone_bound + pack_bound + description onto edge metadata', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    let found = false;
    for (const e of g.edges.values()) {
      if (e.metadata.edgeJsonId === 57) {
        found = true;
        expect(e.metadata.milestoneBound).toBe('v1.49.608');
        expect(e.metadata.packBound).toBe('pack-09-functional-analysis');
        expect(e.metadata.originalRelation).toBe('cross-pack-paired-with');
        expect(e.metadata.description).toBe('Hilbert space test edge');
        expect(e.metadata.sourceRef).toBe('pack-09-001');
        expect(e.metadata.targetRef).toBe('pack-01-002');
      }
    }
    expect(found).toBe(true);
  });

  it('annotates trs:pack entities with domain + edgeCount', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const pack09 = g.entities.get(trsEntityId('trs:pack', 'pack-09'));
    expect(pack09).toBeDefined();
    const attrs = pack09!.attrs as Record<string, unknown>;
    expect(attrs.packId).toBe('pack-09');
    expect(attrs.packNumber).toBe(9);
    expect(attrs.domain).toBe('functional analysis');
    // pack-09 participates in 3 cross-pack-binding edges (57, 58, 84)
    expect(attrs.edgeCount).toBe(3);
  });

  it('records lastGeneratedAt from the source JSON', async () => {
    const g = createTrsGraph();
    const r = await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });
    expect(r.generatedAt).toBe('2026-05-07T00:00:00.000Z');
    expect(g.lastGeneratedAt).toBe('2026-05-07T00:00:00.000Z');
  });
});

describe('trs-loader — pack identity inference', () => {
  it('places pack-09-001 citation under pack-09 (by attrs.packId)', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const citationEntId = trsEntityId('trs:citation', 'pack-09-001');
    const ent = g.entities.get(citationEntId);
    expect(ent).toBeDefined();
    expect((ent!.attrs as Record<string, unknown>).packId).toBe('pack-09');
    expect((ent!.attrs as Record<string, unknown>).slot).toBe(1);
  });

  it('connects pack → citation via pack-contains edge in adjacency', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const packEntId = trsEntityId('trs:pack', 'pack-09');
    const citationEntId = trsEntityId('trs:citation', 'pack-09-001');
    const neighbours = g.adjacency.get(packEntId);
    expect(neighbours?.has(citationEntId)).toBe(true);
  });
});

describe('trs-loader — idempotency', () => {
  it('second load adds zero new entities and zero new edges', async () => {
    const g = createTrsGraph();
    const first = await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });
    const entCountAfterFirst = g.entities.size;
    const edgeCountAfterFirst = g.edges.size;

    const second = await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });
    expect(second.entitiesAdded).toBe(0);
    expect(second.edgesAdded).toBe(0);
    expect(second.packsRecognized).toBe(0);
    expect(g.entities.size).toBe(entCountAfterFirst);
    expect(g.edges.size).toBe(edgeCountAfterFirst);
    expect(second.edgesInSource).toBe(first.edgesInSource);
  });

  it('edge ids are stable across loads', async () => {
    const g1 = createTrsGraph();
    await loadTrsEdges(g1, { json: SYNTHETIC_FIXTURE });
    const g2 = createTrsGraph();
    await loadTrsEdges(g2, { json: SYNTHETIC_FIXTURE });
    const ids1 = Array.from(g1.edges.keys()).sort();
    const ids2 = Array.from(g2.edges.keys()).sort();
    expect(ids2).toEqual(ids1);
  });
});

describe('trs-loader — query helpers', () => {
  it('edgesAtMilestone returns only edges bound at that milestone', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    const at608 = edgesAtMilestone(g, 'v1.49.608');
    expect(at608).toHaveLength(2);
    expect(at608.every((e) => e.metadata.milestoneBound === 'v1.49.608')).toBe(
      true,
    );

    const at613 = edgesAtMilestone(g, 'v1.49.613');
    expect(at613).toHaveLength(2);
  });

  it('boundPacks returns the packs paired with a given pack', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { json: SYNTHETIC_FIXTURE });

    // pack-09 connects to pack-01, pack-02, pack-13 (per fixture edges 57, 58, 84)
    expect(boundPacks(g, 'pack-09')).toEqual(['pack-01', 'pack-02', 'pack-13']);
    // pack-13 connects to pack-09 + pack-12
    expect(boundPacks(g, 'pack-13')).toEqual(['pack-09', 'pack-12']);
  });
});

describe('trs-loader — robustness', () => {
  it('skips malformed edges instead of throwing', async () => {
    const g = createTrsGraph();
    const r = await loadTrsEdges(g, {
      json: {
        schema: 'trs-edges/v1',
        milestones: [
          {
            milestone: 'v1.49.608',
            pack_bound: 'pack-09',
            predecessor_pack: null,
            edges: [
              // valid
              {
                id: 1,
                source: 'pack-09-001',
                target: 'pack-01-001',
                relation: 'cross-pack-paired-with',
                description: '',
                milestone_bound: 'v1.49.608',
                pack_bound: 'pack-09',
              },
              // missing source — invalid edge JSON, dropped
              {
                id: 2,
                target: 'pack-01-002',
                relation: 'cross-pack-paired-with',
                description: '',
                milestone_bound: 'v1.49.608',
                pack_bound: 'pack-09',
              } as unknown as never,
            ],
          },
        ],
      },
    });
    expect(r.edgesInSource).toBe(1);
  });

  it('skips edges with malformed pack endpoints', async () => {
    const g = createTrsGraph();
    const r = await loadTrsEdges(g, {
      json: {
        schema: 'trs-edges/v1',
        milestones: [
          {
            milestone: 'v1.49.608',
            pack_bound: 'pack-09',
            predecessor_pack: null,
            edges: [
              {
                id: 1,
                source: 'not-a-pack-ref',
                target: 'pack-01-001',
                relation: 'cross-pack-paired-with',
                description: '',
                milestone_bound: 'v1.49.608',
                pack_bound: 'pack-09',
              },
            ],
          },
        ],
      },
    });
    // edge tallied as edgesInSource (passes JSON-shape validation) but
    // dropped during ingest because the endpoint is unparseable
    expect(r.edgesInSource).toBe(1);
    expect(r.edgesAdded).toBe(0);
  });
});

// Exercise the loader against the actual on-disk artefact so smoke-test
// regressions are caught even if the synthetic fixture drifts. Skipped when
// the file is missing (CI envs that exclude www/).
const realJsonExists = existsSync(REAL_JSON_PATH);
const describeIfReal = realJsonExists ? describe : describe.skip;

describeIfReal('trs-loader — live edges.json', () => {
  it('loads the real artefact + finds ≥80 cross-pack edges', async () => {
    const g = createTrsGraph();
    const r = await loadTrsEdges(g, { path: REAL_JSON_PATH });
    expect(r.edgesInSource).toBeGreaterThanOrEqual(80);
    expect(r.packsRecognized).toBeGreaterThanOrEqual(10);
  });

  it('loading twice is a no-op on the second pass', async () => {
    const g = createTrsGraph();
    await loadTrsEdges(g, { path: REAL_JSON_PATH });
    const second = await loadTrsEdges(g, { path: REAL_JSON_PATH });
    expect(second.entitiesAdded).toBe(0);
    expect(second.edgesAdded).toBe(0);
    expect(second.packsRecognized).toBe(0);
  });

  it('trsEdgeId is stable across loader invocations', () => {
    const id1 = trsEdgeId(
      'trs:citation:abcd',
      TRS_EDGE_RELATIONS.CROSS_PACK_BINDING,
      'trs:citation:efgh',
      57,
    );
    const id2 = trsEdgeId(
      'trs:citation:abcd',
      TRS_EDGE_RELATIONS.CROSS_PACK_BINDING,
      'trs:citation:efgh',
      57,
    );
    expect(id1).toBe(id2);
  });
});
