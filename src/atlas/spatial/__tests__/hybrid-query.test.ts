import { describe, it, expect } from 'vitest';
import {
  hybridSpatialSemanticQuery,
  explainHybridQuery,
  assertGistLeadingFilter,
  HYBRID_QUERY_SQL,
  type PgQueryable,
  type HybridQueryRequest,
} from '../hybrid-query.js';

/**
 * Hybrid PostGIS + pgvector query module — unit-level tests against an
 * in-memory mock pg client. Plan-shape correctness is asserted via the
 * `assertGistLeadingFilter` helper run on representative EXPLAIN output.
 *
 * Live-PG integration tests (against the tibsfox atlas mirror) live in a
 * separate file gated on `process.env.ATLAS_PG_E2E === '1'` so they are
 * skipped in CI by default.
 */

function mockClient(rows: unknown[] = [], capture: { sql?: string; values?: unknown[] } = {}): PgQueryable {
  return {
    query: async (text: string, values?: unknown[]) => {
      capture.sql = text;
      capture.values = values;
      return { rows: rows as never[], rowCount: rows.length };
    },
  };
}

describe('hybrid-query — SQL composition', () => {
  it('SQL contains the MATERIALIZED CTE hint (pinned plan)', () => {
    expect(HYBRID_QUERY_SQL).toMatch(/WITH\s+spatial_candidates\s+AS\s+MATERIALIZED/i);
  });

  it('SQL uses ST_DWithin with SRID bound at $7 (NIT-01 fix)', () => {
    expect(HYBRID_QUERY_SQL).toMatch(/ST_DWithin\(s\.position,\s*ST_SetSRID\(ST_MakePoint\(\$2,\s*\$3\),\s*\$7::integer\)/);
  });

  it('SQL orders by pgvector cosine distance on outer query', () => {
    expect(HYBRID_QUERY_SQL).toMatch(/ORDER BY\s+embedding\s+<=>\s+\$1::vector/);
  });

  it('SQL exposes optional project_id filter', () => {
    expect(HYBRID_QUERY_SQL).toMatch(/\$6::text IS NULL OR s\.project_id = \$6/);
  });
});

describe('hybridSpatialSemanticQuery — parameter wiring', () => {
  const baseReq: HybridQueryRequest = {
    point: { x: 100, y: 200 },
    query_embedding: Array.from({ length: 384 }, (_, i) => i / 384),
    radius: 250,
    limit: 25,
  };

  it('passes point.x, point.y, radius, limit verbatim, plus SRID at $7', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    await hybridSpatialSemanticQuery(mockClient([], cap), baseReq);
    const v = cap.values!;
    expect(v[1]).toBe(100); // $2
    expect(v[2]).toBe(200); // $3
    expect(v[3]).toBe(250); // $4
    expect(v[4]).toBe(25);  // $5
    expect(v[6]).toBe(0);   // $7 — ATLAS_SRID (NIT-01 binds rather than interpolates)
    expect(v.length).toBe(7);
  });

  it('rejects non-finite embedding values up front (MED-04 fix)', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    await expect(
      hybridSpatialSemanticQuery(mockClient([], cap), {
        ...baseReq,
        query_embedding: [1, NaN, 3] as number[],
      }),
    ).rejects.toThrow(/finite values/);
    await expect(
      hybridSpatialSemanticQuery(mockClient([], cap), {
        ...baseReq,
        query_embedding: [Infinity, 2, 3] as number[],
      }),
    ).rejects.toThrow(/finite values/);
  });

  it('serializes embedding as a Postgres-vector literal `[…]`', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    await hybridSpatialSemanticQuery(mockClient([], cap), baseReq);
    const lit = cap.values![0] as string;
    expect(lit.startsWith('[')).toBe(true);
    expect(lit.endsWith(']')).toBe(true);
    expect(lit.split(',')).toHaveLength(384);
  });

  it('passes project_id when present, NULL otherwise', async () => {
    const cap1: { sql?: string; values?: unknown[] } = {};
    await hybridSpatialSemanticQuery(mockClient([], cap1), baseReq);
    expect(cap1.values![5]).toBeNull();

    const cap2: { sql?: string; values?: unknown[] } = {};
    await hybridSpatialSemanticQuery(mockClient([], cap2), { ...baseReq, project_id: 'gsd-skill-creator' });
    expect(cap2.values![5]).toBe('gsd-skill-creator');
  });

  it('applies DEFAULT_RADIUS / DEFAULT_LIMIT when omitted', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    await hybridSpatialSemanticQuery(
      mockClient([], cap),
      { point: { x: 0, y: 0 }, query_embedding: Array(384).fill(0) } as HybridQueryRequest,
    );
    expect(cap.values![3]).toBe(200); // DEFAULT_RADIUS
    expect(cap.values![4]).toBe(50);  // DEFAULT_LIMIT
  });
});

describe('hybridSpatialSemanticQuery — result mapping', () => {
  it('maps row shape into HybridQueryResult', async () => {
    const fakeRow = {
      project_id: 'p', id: 'sym-1',
      qualified_name: 'foo.bar', kind: 'function', file_path: 'src/foo.ts',
      x: 100, y: 200,
      spatial_distance: 5.0, semantic_distance: 0.32,
    };
    const result = await hybridSpatialSemanticQuery(mockClient([fakeRow]), {
      point: { x: 100, y: 200 },
      query_embedding: Array(384).fill(0),
    });
    expect(result).toHaveLength(1);
    const r = result[0]!;
    expect(r.project_id).toBe('p');
    expect(r.symbol_id).toBe('sym-1');
    expect(r.position).toEqual({ x: 100, y: 200 });
    expect(r.spatial_distance).toBe(5.0);
    expect(r.semantic_distance).toBe(0.32);
    expect(r.rank_score).toBe(0.32);
  });

  it('returns empty array on empty result (no error)', async () => {
    const result = await hybridSpatialSemanticQuery(mockClient([]), {
      point: { x: 0, y: 0 },
      query_embedding: Array(384).fill(0),
      radius: 0, // edge case: zero radius
    });
    expect(result).toEqual([]);
  });
});

describe('assertGistLeadingFilter — plan-shape inspection', () => {
  it('passes when plan shows GiST scan + outer vector ordering', () => {
    const plan = `
CTE spatial_candidates
  ->  Index Scan using idx_atlas_symbols_position_gist on symbols s  (cost=...)
        Index Cond: (position && ST_Expand(...))
        Filter: ST_DWithin(position, ...)
Sort
  Sort Key: ((spatial_candidates.embedding <=> '[0.1,0.2,...]'::vector))
    `;
    const v = assertGistLeadingFilter(plan);
    expect(v.pass).toBe(true);
  });

  it('fails when plan does not include GiST scan', () => {
    const plan = `
Seq Scan on symbols
  Filter: ST_DWithin(position, ...)
Sort
  Sort Key: (embedding <=> '[0.1]'::vector)
    `;
    const v = assertGistLeadingFilter(plan);
    expect(v.pass).toBe(false);
    expect(v.reason).toMatch(/GiST/);
  });

  it('fails when plan does not include vector ordering', () => {
    const plan = `
CTE spatial_candidates
  ->  Index Scan using idx_atlas_symbols_position_gist on symbols s
Sort
  Sort Key: spatial_distance
    `;
    const v = assertGistLeadingFilter(plan);
    expect(v.pass).toBe(false);
    expect(v.reason).toMatch(/vector/);
  });
});

describe('explainHybridQuery — wraps SQL in EXPLAIN ANALYZE', () => {
  it('prefixes SQL with EXPLAIN ANALYZE', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    const client: PgQueryable = {
      query: async <R>(text: string, values?: unknown[]) => {
        cap.sql = text;
        cap.values = values;
        return {
          rows: [{ 'QUERY PLAN': 'Index Scan using idx_atlas_symbols_position_gist' } as unknown as R],
          rowCount: 1,
        };
      },
    };
    const out = await explainHybridQuery(client, {
      point: { x: 0, y: 0 },
      query_embedding: Array(384).fill(0),
    });
    expect(cap.sql!.startsWith('EXPLAIN ANALYZE')).toBe(true);
    expect(out).toMatch(/Index Scan/);
  });
});
