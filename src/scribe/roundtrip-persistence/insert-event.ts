/**
 * SCRIBE Round-Trip Persistence — insert-event.ts
 *
 * The SQL primitive for persisting a round-trip event to the `prov_node` +
 * `prov_edge` tables.  Callers are expected to have already:
 *   1. validated the payload via `validateRoundTripPayload()`
 *   2. checked idempotency via `checkIdempotency()`
 *
 * This module inserts exactly ONE `prov_node` row (`node_type='Activity'`,
 * `sub_type=KNOWN_SUB_TYPES.roundtripEvent`) and ONE `prov_edge` row
 * (`relation='wasDerivedFrom'`) linking the event back to the source artifact.
 *
 * Component 05 (Wave 2). CAP-019 / CAP-042.
 *
 * @module scribe/roundtrip-persistence/insert-event
 */

import { createHash } from 'node:crypto';
import { KNOWN_SUB_TYPES, PROV_RELATIONS } from '../types/prov.js';
import type { RoundTripMetadata } from '../types/metadata-namespace.js';
import { buildLabel } from './event-shape.js';

// ---------------------------------------------------------------------------
// Pool type (structural; no hard dep on pg)
// ---------------------------------------------------------------------------

type PgPool = {
  query(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
};

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface InsertEventResult {
  nodeId: string;
  edgeIds: string[];
}

// ---------------------------------------------------------------------------
// Edge-ID recipe (canonical: sha256(src||rel||dst).slice(0,16))
// ---------------------------------------------------------------------------

/**
 * Compute the deterministic edge_id.
 * Implements the recipe from `prov.ts` `EdgeIdRecipe`: sha256(src||rel||dst).slice(0,16).
 */
function computeEdgeId(src: string, relation: string, dst: string): string {
  return createHash('sha256')
    .update(src + relation + dst)
    .digest('hex')
    .slice(0, 16);
}

// ---------------------------------------------------------------------------
// Assertion that 'wasDerivedFrom' is in the closed relation set
// ---------------------------------------------------------------------------

const DERIVED_FROM = 'wasDerivedFrom' as const;
// Belt-and-suspenders: type-check that our literal is a valid ProvRelation.
// If prov.ts removes this value, TypeScript will catch it here.
const _rel: (typeof PROV_RELATIONS)[number] = DERIVED_FROM;
void _rel; // suppress unused-variable warning

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Insert a round-trip event prov_node + wasDerivedFrom edge.
 *
 * The source artifact `node_id` is derived deterministically from the
 * `sourceSha`: `"roundtrip-artifact:<sourceSha>"`.  This is a logical
 * reference — the artifact itself may or may not exist as a row yet; the edge
 * will be inserted regardless (the SQL schema uses FK ON DELETE CASCADE so
 * if the artifact is later pruned the edge goes with it).
 *
 * SQL:
 * ```sql
 * -- 1. Insert the round-trip Activity node
 * INSERT INTO prov_node (node_id, node_type, sub_type, label, payload, created_at)
 * VALUES (gen_random_uuid()::text, 'Activity', $1, $2,
 *         jsonb_build_object('roundTrip', $3::jsonb), now())
 * RETURNING node_id;
 *
 * -- 2. Insert the wasDerivedFrom edge
 * INSERT INTO prov_edge (edge_id, src_id, relation, dst_id)
 * VALUES ($1, $2, 'wasDerivedFrom', $3)
 * ON CONFLICT DO NOTHING;
 * ```
 *
 * @param pool  - live pg.Pool
 * @param meta  - validated RoundTripMetadata (from validateRoundTripPayload)
 */
export async function insertRoundtripEvent(
  pool: PgPool,
  meta: RoundTripMetadata,
): Promise<InsertEventResult> {
  const label = buildLabel(meta);

  // 1. Insert the prov_node Activity row.
  //    node_id is generated server-side by gen_random_uuid().
  const nodeInsertSql = `
    INSERT INTO prov_node (node_id, node_type, sub_type, label, payload, created_at)
    VALUES (
      gen_random_uuid()::text,
      'Activity',
      $1,
      $2,
      jsonb_build_object('roundTrip', $3::jsonb),
      now()
    )
    RETURNING node_id
  `.trim();

  const { rows: nodeRows } = await pool.query(nodeInsertSql, [
    KNOWN_SUB_TYPES.roundtripEvent,   // $1 — sub_type (constant, not a literal)
    label,                             // $2 — human label
    JSON.stringify(meta),              // $3 — JSONB payload serialised
  ]);

  if (nodeRows.length === 0 || typeof nodeRows[0]!['node_id'] !== 'string') {
    throw new Error('INSERT prov_node returned no node_id');
  }

  const nodeId = nodeRows[0]!['node_id'] as string;

  // 2. Insert the wasDerivedFrom edge from the event back to the source artifact.
  //    The source artifact logical node_id is derived from sourceSha.
  const sourceArtifactId = `roundtrip-artifact:${meta.sourceSha}`;
  const edgeId = computeEdgeId(nodeId, DERIVED_FROM, sourceArtifactId);

  const edgeInsertSql = `
    INSERT INTO prov_edge (edge_id, src_id, relation, dst_id)
    VALUES ($1, $2, 'wasDerivedFrom', $3)
    ON CONFLICT DO NOTHING
  `.trim();

  // NOTE: We attempt the edge insert even when the destination artifact node
  // does not yet exist as a row.  The FK constraint could reject this in a
  // strict-FK schema, but retrieval-provenance/001-init.postgres.sql uses
  // ON DELETE CASCADE — meaning the artifact row may need to exist first.
  // For the viewer demo scenario the artifact node is the ephemeral SVG, so
  // we insert it first as a phantom Entity node, then reference it.
  //
  // Phantom source-artifact insert (idempotent):
  const artifactInsertSql = `
    INSERT INTO prov_node (node_id, node_type, sub_type, label, payload)
    VALUES ($1, 'Entity', 'roundtrip-artifact', $2, '{}'::jsonb)
    ON CONFLICT (node_id) DO NOTHING
  `.trim();

  await pool.query(artifactInsertSql, [
    sourceArtifactId,
    `source-artifact:${meta.sourceSha}`,
  ]);

  await pool.query(edgeInsertSql, [edgeId, nodeId, sourceArtifactId]);

  return { nodeId, edgeIds: [edgeId] };
}
