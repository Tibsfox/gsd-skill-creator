/**
 * SCRIBE PG Runtime — endpoint-shapes.ts
 *
 * Exported types and validators for the three live PG endpoints Component 02 wires:
 *   - /api/graph/upstream/:nodeId   — traversal results
 *   - /api/graph/downstream/:nodeId — traversal results
 *   - /api/search                   — hybrid RRF search results
 *
 * Validators use `PROV_RELATIONS` from Component 00 types — NOT redefined inline.
 * Constraint: substrate-conformance §6.2 — the closed set lives in prov.ts.
 *
 * @module scribe/pg-runtime/endpoint-shapes
 */

import { PROV_RELATIONS } from '../types/prov.js';
import type { ProvRelation } from '../types/prov.js';

// ---------------------------------------------------------------------------
// /api/graph/upstream + /api/graph/downstream response shape
// ---------------------------------------------------------------------------

/**
 * A single row returned by the `upstream(target, max_depth)` or
 * `downstream(source, max_depth)` SQL functions.
 *
 * Shape mirrors the SQL function signature:
 *   RETURNS TABLE(node_id TEXT, depth INT, relation TEXT)
 */
export interface TraversalRow {
  /** The node reachable from the target. */
  readonly node_id: string;
  /** Hop distance from the traversal root. */
  readonly depth: number;
  /** The PROV-O relation type on the shortest-path edge. Closed set per PROV_RELATIONS. */
  readonly relation: ProvRelation;
}

/**
 * Full response body for /api/graph/upstream or /api/graph/downstream.
 */
export interface TraversalResponse {
  /** Origin node from which traversal started. */
  readonly origin: string;
  /** Traversal direction. */
  readonly direction: 'upstream' | 'downstream';
  /** Depth limit applied. */
  readonly depth: number;
  /** Ordered result rows (ascending by depth, then node_id). */
  readonly rows: ReadonlyArray<TraversalRow>;
}

// ---------------------------------------------------------------------------
// /api/search response shape
// ---------------------------------------------------------------------------

/**
 * A single row from `hybrid_search(query_text, query_emb, sub_type_filter, max_results)`.
 *
 * Shape mirrors the SQL function:
 *   RETURNS TABLE(node_id TEXT, label TEXT, sub_type TEXT, rrf_score REAL)
 */
export interface SearchRow {
  readonly node_id: string;
  readonly label: string | null;
  readonly sub_type: string | null;
  /**
   * RRF-fused score (sum of 1/(60+rank) contributions from vector + FTS legs).
   * Higher = more relevant.
   */
  readonly rrf_score: number;
  /** 1-based rank in the result set (added by the endpoint handler). */
  readonly rank: number;
}

/**
 * Full response body for /api/search.
 */
export interface SearchResponse {
  readonly query: string;
  readonly limit: number;
  readonly results: ReadonlyArray<SearchRow>;
}

// ---------------------------------------------------------------------------
// Error response shape
// ---------------------------------------------------------------------------

/**
 * JSON body returned when the endpoint cannot serve a live response.
 * Preserved from the T4 floor demo 501 shape.
 */
export interface PgErrorResponse {
  readonly error: 'pg_not_configured' | 'query_failed' | 'not_implemented_in_floor_demo';
  readonly hint?: string;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/** Set built once at module load for O(1) membership test. */
const PROV_RELATIONS_SET: ReadonlySet<string> = new Set(PROV_RELATIONS);

/**
 * Type guard: is `value` a valid `ProvRelation`?
 * Uses `PROV_RELATIONS` from Component 00 — NOT an inline redefinition.
 */
export function isProvRelation(value: unknown): value is ProvRelation {
  return typeof value === 'string' && PROV_RELATIONS_SET.has(value);
}

/**
 * Validate a single TraversalRow from a raw SQL result row.
 * Returns `null` if the row is malformed (unknown relation, missing fields).
 */
export function validateTraversalRow(
  raw: Record<string, unknown>,
): TraversalRow | null {
  if (typeof raw['node_id'] !== 'string') return null;
  if (typeof raw['depth'] !== 'number' && typeof raw['depth'] !== 'string') return null;
  if (!isProvRelation(raw['relation'])) return null;

  return {
    node_id: raw['node_id'] as string,
    depth: Number(raw['depth']),
    relation: raw['relation'] as ProvRelation,
  };
}

/**
 * Validate and normalize an array of raw SQL rows into `TraversalRow[]`.
 * Rows failing validation are silently dropped (schema-compliant DB should never fail).
 */
export function validateTraversalRows(
  rows: Array<Record<string, unknown>>,
): TraversalRow[] {
  return rows.flatMap((r) => {
    const validated = validateTraversalRow(r);
    return validated !== null ? [validated] : [];
  });
}

/**
 * Validate and normalize a search result row.
 * Returns `null` if malformed.
 */
export function validateSearchRow(
  raw: Record<string, unknown>,
  rank: number,
): SearchRow | null {
  if (typeof raw['node_id'] !== 'string') return null;

  return {
    node_id: raw['node_id'] as string,
    label: typeof raw['label'] === 'string' ? raw['label'] : null,
    sub_type: typeof raw['sub_type'] === 'string' ? raw['sub_type'] : null,
    rrf_score:
      typeof raw['rrf_score'] === 'number'
        ? raw['rrf_score']
        : parseFloat(String(raw['rrf_score'] ?? '0')),
    rank,
  };
}

/**
 * Validate and normalize an array of raw search rows into `SearchRow[]`.
 * Adds 1-based rank. Rows failing validation are dropped.
 */
export function validateSearchRows(
  rows: Array<Record<string, unknown>>,
): SearchRow[] {
  const out: SearchRow[] = [];
  let rank = 1;
  for (const r of rows) {
    const validated = validateSearchRow(r, rank);
    if (validated !== null) {
      out.push(validated);
      rank++;
    }
  }
  return out;
}
