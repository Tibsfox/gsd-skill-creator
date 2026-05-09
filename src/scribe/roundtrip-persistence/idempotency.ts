/**
 * SCRIBE Round-Trip Persistence — idempotency.ts
 *
 * Before inserting a new round-trip event, check whether the same
 * (sourceSha, targetSha, svgSha, direction) 4-tuple already exists in
 * `prov_node`.  If it does, the insert is skipped and the existing `node_id`
 * is returned to the caller along with `deduplicated: true`.
 *
 * Component 05 (Wave 2). CAP-019.
 *
 * @module scribe/roundtrip-persistence/idempotency
 */

import { KNOWN_SUB_TYPES } from '../types/prov.js';
import type { RoundTripMetadata } from '../types/metadata-namespace.js';

// ---------------------------------------------------------------------------
// Pool type (mirrors db.ts declaration — no hard dep on pg)
// ---------------------------------------------------------------------------

type PgPool = {
  query(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type IdempotencyCheckResult =
  | { exists: true; nodeId: string }
  | { exists: false };

/**
 * Check whether a round-trip event matching the SHA-4-tuple already exists.
 *
 * SQL used:
 * ```sql
 * SELECT node_id FROM prov_node
 * WHERE  sub_type = $1
 *   AND  payload->'roundTrip'->>'sourceSha' = $2
 *   AND  payload->'roundTrip'->>'targetSha' = $3
 *   AND  payload->'roundTrip'->>'svgSha'    = $4
 *   AND  payload->'roundTrip'->>'direction' = $5
 * LIMIT 1
 * ```
 *
 * The query is intentionally narrow — all 4 SHA-key + direction fields must
 * match.  Two events with the same source/target SHAs but different directions
 * are considered distinct (forward ≠ reverse).
 *
 * @param pool  - live pg.Pool from createPool()
 * @param meta  - validated RoundTripMetadata
 * @returns IdempotencyCheckResult
 */
export async function checkIdempotency(
  pool: PgPool,
  meta: RoundTripMetadata,
): Promise<IdempotencyCheckResult> {
  const sql = `
    SELECT node_id
    FROM   prov_node
    WHERE  sub_type                              = $1
      AND  payload->'roundTrip'->>'sourceSha'   = $2
      AND  payload->'roundTrip'->>'targetSha'   = $3
      AND  payload->'roundTrip'->>'svgSha'      = $4
      AND  payload->'roundTrip'->>'direction'   = $5
    LIMIT 1
  `.trim();

  const { rows } = await pool.query(sql, [
    KNOWN_SUB_TYPES.roundtripEvent,   // $1 — sub_type discriminator constant
    meta.sourceSha,                    // $2
    meta.targetSha,                    // $3
    meta.svgSha,                       // $4
    meta.direction,                    // $5
  ]);

  if (rows.length > 0 && typeof rows[0]!['node_id'] === 'string') {
    return { exists: true, nodeId: rows[0]!['node_id'] as string };
  }
  return { exists: false };
}
