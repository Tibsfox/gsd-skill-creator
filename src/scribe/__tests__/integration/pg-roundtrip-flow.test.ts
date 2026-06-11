/**
 * SCRIBE Build-Out v1.49.621 — Component 09 integration test.
 *
 * Cross-component PG round-trip flow (C00 + C02 + C05). Verifies success
 * criteria C3 (PG runtime live) and C7 (round-trip persistence wired)
 * compose end-to-end:
 *   1. Open a PG connection via Component 02 createPool/env-loader
 *   2. Insert a roundtrip-event via Component 05 insertEvent()
 *   3. Round-trip the event via Component 02 endpoint shape validators
 *   4. Confirm the prov_node row carries Component 00 KNOWN_SUB_TYPES.roundtripEvent
 *
 * Gated on PG_TEST=1 — without a live PG instance the test is skipped
 * but the test file still compiles + lints (catches drift in imports).
 */
import { describe, it, expect } from 'vitest';
import { randomBytes } from 'node:crypto';

import {
  validateTraversalRow,
  validateTraversalRows,
  isProvRelation,
} from '../../pg-runtime/endpoint-shapes.js';
import { loadPgEnv } from '../../pg-runtime/env-loader.js';
import { createPool, query } from '../../pg-runtime/db.js';
import { insertRoundtripEvent } from '../../roundtrip-persistence/insert-event.js';
import {
  validateRoundTripPayload,
  isValidPayload,
} from '../../roundtrip-persistence/event-shape.js';
import { KNOWN_SUB_TYPES, PROV_RELATIONS } from '../../types/prov.js';
import type { RoundTripMetadata } from '../../types/metadata-namespace.js';

const pgTestEnabled = process.env['PG_TEST'] === '1';
const describeOrSkip = pgTestEnabled ? describe : describe.skip;

describe('integration: pg-roundtrip-flow contract surface (compile-time guards)', () => {
  it('C02 + C05 share the wasDerivedFrom relation as their roundtrip edge type', () => {
    expect(PROV_RELATIONS).toContain('wasDerivedFrom');
    expect(isProvRelation('wasDerivedFrom')).toBe(true);
  });

  it('C00 KNOWN_SUB_TYPES.roundtripEvent is the canonical sub_type literal for C05 inserts', () => {
    expect(KNOWN_SUB_TYPES.roundtripEvent).toBe('roundtrip-event');
  });

  it('validateTraversalRow accepts the shape Component 05 inserts produce', () => {
    const row = {
      node_id: 'session:roundtrip-test',
      depth: 1,
      relation: 'wasDerivedFrom',
    };
    const validated = validateTraversalRow(row);
    expect(validated).not.toBeNull();
    expect(validated?.node_id).toBe('session:roundtrip-test');
    expect(validated?.relation).toBe('wasDerivedFrom');
  });
});

describeOrSkip('integration: pg-roundtrip-flow live (PG_TEST=1)', () => {
  // Schema: scribe.prov_node / scribe.prov_edge + scribe.upstream(), per
  // examples/cartridges/retrieval-provenance/migrations/001-init.postgres.sql
  // (apply via dashboard-service/migrate.mjs). insert-event.ts SQL is
  // schema-unqualified, so the pool's connections pin search_path through
  // the connection-string `options` parameter — a plain `SET search_path`
  // would only affect whichever pooled connection served that one query.
  it(
    'round-trips an event: C05 insertEvent → scribe.upstream() → C02 validators',
    { timeout: 30_000 },
    async () => {
      const cfg = loadPgEnv();
      expect(cfg.ok, cfg.ok ? '' : `PG_TEST=1 but PG not configured: ${cfg.hint}`).toBe(true);
      if (!cfg.ok) return;

      const sep = cfg.url.includes('?') ? '&' : '?';
      const url = `${cfg.url}${sep}options=${encodeURIComponent('-c search_path=scribe,public')}`;
      const pool = await createPool(url, { max: 2 });

      // validateRoundTripPayload requires 40-char hex (SHA-1 width).
      const sourceSha = randomBytes(20).toString('hex');
      const raw: RoundTripMetadata = {
        direction: 'forward',
        sourceLanguage: 'typescript',
        targetLanguage: 'verilog',
        sourceSha,
        targetSha: randomBytes(20).toString('hex'),
        svgSha: randomBytes(20).toString('hex'),
        emittedAt: new Date().toISOString(),
        extras: { origin: 'pg-roundtrip-flow.test (C09 evidence run)' },
      };

      // 1. The fixture must pass the same validation gate real callers use.
      const validation = validateRoundTripPayload(raw);
      expect(isValidPayload(validation), isValidPayload(validation) ? '' : validation.reason).toBe(true);
      if (!isValidPayload(validation)) return;

      const sourceArtifactId = `roundtrip-artifact:${sourceSha}`;
      let nodeId: string | undefined;
      try {
        // 2. Component 05 insert: prov_node Activity + wasDerivedFrom edge.
        const result = await insertRoundtripEvent(pool, validation.payload);
        nodeId = result.nodeId;
        expect(result.edgeIds).toHaveLength(1);

        // 3. Component 02 endpoint query: same SQL the dashboard-service
        //    /api/graph/upstream/:nodeId route runs.
        const { rows } = await query(pool, 'SELECT * FROM scribe.upstream($1, $2)', [
          sourceArtifactId,
          5,
        ]);
        const traversal = validateTraversalRows(rows);
        expect(traversal, 'upstream() rows failed C02 shape validation').not.toBeNull();

        const eventRow = traversal?.find((r) => r.node_id === nodeId);
        expect(eventRow, `event node ${nodeId} not reachable via upstream()`).toBeDefined();
        expect(eventRow?.depth).toBe(1);
        expect(eventRow?.relation).toBe('wasDerivedFrom');

        // 4. The persisted row carries the Component 00 closed-set constants.
        const { rows: nodeRows } = await query(
          pool,
          'SELECT node_type, sub_type FROM scribe.prov_node WHERE node_id = $1',
          [nodeId],
        );
        expect(nodeRows).toHaveLength(1);
        expect(nodeRows[0]?.['node_type']).toBe('Activity');
        expect(nodeRows[0]?.['sub_type']).toBe(KNOWN_SUB_TYPES.roundtripEvent);
      } finally {
        // Cleanup: deleting the nodes cascades the edge (ON DELETE CASCADE).
        await query(pool, 'DELETE FROM scribe.prov_node WHERE node_id = ANY($1)', [
          [nodeId, sourceArtifactId].filter(Boolean),
        ]).catch(() => undefined);
        await pool.end();
      }
    },
  );
});
