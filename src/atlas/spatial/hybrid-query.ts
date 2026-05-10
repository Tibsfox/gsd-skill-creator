/**
 * Hybrid PostGIS + pgvector query composition for the atlas spatial substrate.
 *
 * Component 03 of the gis-spatial-substrate Part B mission. Composes spatial
 * proximity (`ST_DWithin` + GiST index on `atlas.symbols.position`) with
 * semantic similarity (pgvector cosine via `<=>` + IVFFlat index on
 * `atlas.symbols.embedding`) into a single SQL query path.
 *
 * The CTE-MATERIALIZED pattern is essential — without it, PostgreSQL's planner
 * may choose to scan by HNSW order and post-filter spatially, which inverts
 * the intended cost model. The MATERIALIZED hint forces the spatial filter
 * to materialise into a temporary result before the outer query runs, so the
 * vector ranking happens on a small candidate set. On a million-row table with
 * a typical 300-unit window selecting ~100 candidates, this rewrites a
 * 1M × 1M index intersection into a 1M × 100 lookup. Latency drop: 10–100×.
 *
 * Reference: `.planning/missions/gis-spatial-substrate/research/mission.pdf`
 * §2.4.6 — PostGIS + pgvector Hybrid (Critical) — and the worked SQL examples
 * therein. The Part A research mission is the citation base.
 */

import type { SpatialPoint, SymbolPosition } from './types.js';
import { ATLAS_SRID, DEFAULT_RADIUS, DEFAULT_LIMIT } from './format-constants.js';

/**
 * Minimal pg client shape used by this module. We declare it locally rather
 * than depending on `@types/pg` to keep the dependency footprint at zero —
 * the actual `pg` package is dynamic-imported by callers (matches the
 * convention in src/intelligence/atlas-pg/mirror.ts).
 */
export interface PgQueryable {
  query<R = unknown>(text: string, values?: unknown[]): Promise<{ rows: R[]; rowCount?: number | null }>;
}

export interface HybridQueryRequest {
  /** Search anchor in atlas logical coords (SRID 0). */
  point: SpatialPoint;
  /** Query embedding (must match `atlas.symbols.embedding` dim — currently 384). */
  query_embedding: number[];
  /** Search radius in logical units. Defaults to {@link DEFAULT_RADIUS}. */
  radius?: number;
  /** Top-K cap. Defaults to {@link DEFAULT_LIMIT}. */
  limit?: number;
  /** Optional project filter; if omitted, scans all projects. */
  project_id?: string;
}

export interface HybridQueryResult extends SymbolPosition {
  /** Distance from query point to symbol position. */
  spatial_distance: number;
  /** pgvector cosine distance (lower = more similar). */
  semantic_distance: number;
  /** Composite rank score (currently equal to semantic_distance — the sort key). */
  rank_score: number;
  /** atlas.symbols.qualified_name */
  qualified_name: string;
  /** atlas.symbols.kind */
  kind: string;
  /** atlas.symbols.file_path */
  file_path: string;
}

/**
 * The hybrid SQL — kept as a module-level constant so it can be EXPLAIN-tested.
 *
 * Parameters:
 *   $1 = embedding text literal (e.g. "[0.1, 0.2, ...]")
 *   $2 = point.x
 *   $3 = point.y
 *   $4 = radius
 *   $5 = limit
 *   $6 = project_id (or NULL to skip the project filter)
 *   $7 = SRID (integer; bound rather than interpolated — NIT-01 fix)
 */
export const HYBRID_QUERY_SQL = `
  WITH spatial_candidates AS MATERIALIZED (
    SELECT
      s.project_id, s.id, s.qualified_name, s.kind, s.file_path,
      s.position, s.embedding,
      ST_X(s.position) AS x,
      ST_Y(s.position) AS y,
      ST_Distance(s.position, ST_SetSRID(ST_MakePoint($2, $3), $7::integer)) AS spatial_distance
    FROM atlas.symbols s
    WHERE s.position IS NOT NULL
      AND ST_DWithin(s.position, ST_SetSRID(ST_MakePoint($2, $3), $7::integer), $4)
      AND ($6::text IS NULL OR s.project_id = $6)
  )
  SELECT
    project_id, id, qualified_name, kind, file_path, x, y,
    spatial_distance,
    embedding <=> $1::vector AS semantic_distance
  FROM spatial_candidates
  ORDER BY embedding <=> $1::vector
  LIMIT $5;
`.trim();

/**
 * Run the hybrid spatial-proximity + semantic-similarity query against
 * atlas.symbols. The CTE-MATERIALIZED pattern forces the GiST index on
 * position to be the leading filter; the outer query ranks survivors by
 * pgvector cosine distance. Empty radius yields an empty array (no error).
 */
export async function hybridSpatialSemanticQuery(
  client: PgQueryable,
  req: HybridQueryRequest,
): Promise<HybridQueryResult[]> {
  const radius = req.radius ?? DEFAULT_RADIUS;
  const limit = req.limit ?? DEFAULT_LIMIT;
  // MED-04 fix: reject non-finite embedding values up front so callers get
  // a clear TypeError, not a confusing Postgres syntax error from `[NaN, ...]`.
  if (!Array.isArray(req.query_embedding) || !req.query_embedding.every(Number.isFinite)) {
    throw new TypeError('hybridSpatialSemanticQuery: query_embedding must be a number[] with all finite values');
  }
  const embeddingLiteral = `[${req.query_embedding.join(',')}]`;
  const projectFilter = req.project_id ?? null;

  const r = await client.query<{
    project_id: string; id: string;
    qualified_name: string; kind: string; file_path: string;
    x: number; y: number;
    spatial_distance: number; semantic_distance: number;
  }>(
    HYBRID_QUERY_SQL,
    [embeddingLiteral, req.point.x, req.point.y, radius, limit, projectFilter, ATLAS_SRID],
  );

  return r.rows.map((row) => ({
    project_id: row.project_id,
    symbol_id: row.id,
    position: { x: row.x, y: row.y },
    qualified_name: row.qualified_name,
    kind: row.kind,
    file_path: row.file_path,
    spatial_distance: row.spatial_distance,
    semantic_distance: row.semantic_distance,
    rank_score: row.semantic_distance,
  }));
}

/**
 * EXPLAIN ANALYZE plan for the hybrid query — used by tests to assert the
 * GiST spatial index is the leading filter and the IVFFlat (or HNSW) vector
 * index ranks survivors. Returns the plan as a single string.
 */
export async function explainHybridQuery(
  client: PgQueryable,
  req: HybridQueryRequest,
): Promise<string> {
  const radius = req.radius ?? DEFAULT_RADIUS;
  const limit = req.limit ?? DEFAULT_LIMIT;
  const embeddingLiteral = `[${req.query_embedding.join(',')}]`;
  const projectFilter = req.project_id ?? null;

  const r = await client.query<{ 'QUERY PLAN': string }>(
    `EXPLAIN ANALYZE ${HYBRID_QUERY_SQL}`,
    [embeddingLiteral, req.point.x, req.point.y, radius, limit, projectFilter, ATLAS_SRID],
  );

  return r.rows.map((row) => row['QUERY PLAN']).join('\n');
}

/**
 * Plan-shape assertion used by tests: confirms the EXPLAIN output places a
 * GiST index scan ahead of the vector ordering. Returns a structured result
 * so test failures explain *why* the plan is wrong, not just that it is.
 */
export function assertGistLeadingFilter(plan: string): {
  pass: boolean;
  reason: string;
} {
  const hasGistScan = /Index Scan using \S+gist\S* on \S*symbols/.test(plan)
    || /Index Cond:.*ST_DWithin/.test(plan)
    || /Bitmap Index Scan on \S+gist/.test(plan);
  const hasVectorOrder = /Order By:\s*\(?embedding\s*<=>/.test(plan)
    || /<=>\s*'\[.*\]'::vector/.test(plan);

  if (!hasGistScan) {
    return { pass: false, reason: 'plan does not show GiST scan / ST_DWithin index condition on atlas.symbols' };
  }
  if (!hasVectorOrder) {
    return { pass: false, reason: 'plan does not show <=> vector ordering in outer query' };
  }
  return { pass: true, reason: 'GiST leads; vector orders survivors' };
}
