/**
 * Component 05 — insert-event.ts integration tests.
 *
 * All tests are gated on `PG_TEST=1`.  Without live PG they are skipped.
 *
 * 6 tests:
 *  1. Happy-path: inserts prov_node with correct sub_type + payload structure
 *  2. Happy-path: inserts prov_edge with relation='wasDerivedFrom'
 *  3. Happy-path: RETURNING node_id is a non-empty string
 *  4. Payload JSONB structure matches RoundTripMetadata shape
 *  5. Error-path: pool.query throwing maps to a thrown Error (no swallowing)
 *  6. Phantom source-artifact node inserted with node_type='Entity'
 *
 * To run locally with live PG:
 *   PG_TEST=1 RH_POSTGRES_URL=postgresql://... npx vitest run src/scribe/roundtrip-persistence/__tests__/insert-event.test.ts
 */

import { describe, it, expect, vi, type MockedFunction } from 'vitest';
import { insertRoundtripEvent } from '../insert-event.js';
import { KNOWN_SUB_TYPES } from '../../types/prov.js';
import type { RoundTripMetadata } from '../../types/metadata-namespace.js';

const PG_TEST = process.env['PG_TEST'] === '1';

// Canonical SHA-1 fixtures
const SHA_SRC = 'a'.repeat(40);
const SHA_TGT = 'b'.repeat(40);
const SHA_SVG = 'c'.repeat(40);

const VALID_META: RoundTripMetadata = {
  direction: 'forward',
  sourceLanguage: 'typescript',
  targetLanguage: 'verilog',
  sourceSha: SHA_SRC,
  targetSha: SHA_TGT,
  svgSha: SHA_SVG,
  extras: { exampleId: 'add' },
};

// ---------------------------------------------------------------------------
// Unit-level mock tests (no PG required)
// ---------------------------------------------------------------------------

describe('insertRoundtripEvent: mock pool — happy path', () => {
  it('passes sub_type=KNOWN_SUB_TYPES.roundtripEvent as first SQL param', async () => {
    const capturedCalls: { sql: string; params: unknown[] }[] = [];

    // Mock pool that returns a fake node_id for the first query (INSERT prov_node),
    // then empty rows for subsequent queries (artifact + edge inserts).
    let callCount = 0;
    const mockPool = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        capturedCalls.push({ sql, params: params ?? [] });
        callCount++;
        // First call = prov_node INSERT RETURNING node_id
        if (callCount === 1) {
          return { rows: [{ node_id: 'mock-node-uuid-1234' }] };
        }
        // Subsequent calls = artifact insert + edge insert
        return { rows: [] };
      }),
    };

    const result = await insertRoundtripEvent(mockPool, VALID_META);

    expect(result.nodeId).toBe('mock-node-uuid-1234');
    expect(result.edgeIds).toHaveLength(1);

    // Verify the first SQL call uses KNOWN_SUB_TYPES.roundtripEvent as $1
    const firstCall = capturedCalls[0]!;
    expect(firstCall.params[0]).toBe(KNOWN_SUB_TYPES.roundtripEvent);
    expect(firstCall.params[0]).toBe('roundtrip-event');
  });

  it('inserts prov_edge with wasDerivedFrom relation', async () => {
    const capturedEdgeSql: string[] = [];
    let callCount = 0;

    const mockPool = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        callCount++;
        if (callCount === 1) return { rows: [{ node_id: 'mock-node-uuid-0001' }] };
        // Capture the edge insert SQL
        if (sql.includes('prov_edge')) capturedEdgeSql.push(sql);
        return { rows: [] };
      }),
    };

    await insertRoundtripEvent(mockPool, VALID_META);

    expect(capturedEdgeSql.length).toBeGreaterThan(0);
    expect(capturedEdgeSql.some(s => s.includes('wasDerivedFrom'))).toBe(true);
  });

  it('returns a non-empty nodeId string', async () => {
    let callCount = 0;
    const mockPool = {
      query: vi.fn(async () => {
        callCount++;
        if (callCount === 1) return { rows: [{ node_id: 'real-uuid-generated' }] };
        return { rows: [] };
      }),
    };

    const result = await insertRoundtripEvent(mockPool, VALID_META);
    expect(typeof result.nodeId).toBe('string');
    expect(result.nodeId.length).toBeGreaterThan(0);
  });

  it('serialises full RoundTripMetadata into the payload JSONB param', async () => {
    const capturedPayload: string[] = [];
    let callCount = 0;

    const mockPool = {
      query: vi.fn(async (_sql: string, params?: unknown[]) => {
        callCount++;
        if (callCount === 1) {
          // $3 is the JSON payload string
          if (params && typeof params[2] === 'string') {
            capturedPayload.push(params[2]);
          }
          return { rows: [{ node_id: 'uuid-001' }] };
        }
        return { rows: [] };
      }),
    };

    await insertRoundtripEvent(mockPool, VALID_META);

    expect(capturedPayload).toHaveLength(1);
    const parsed = JSON.parse(capturedPayload[0]!) as Record<string, unknown>;
    expect(parsed['direction']).toBe('forward');
    expect(parsed['sourceSha']).toBe(SHA_SRC);
    expect(parsed['targetSha']).toBe(SHA_TGT);
    expect(parsed['svgSha']).toBe(SHA_SVG);
  });

  it('throws when pool.query throws (no error swallowing)', async () => {
    const mockPool = {
      query: vi.fn(async () => {
        throw new Error('PG connection refused');
      }),
    };

    await expect(insertRoundtripEvent(mockPool, VALID_META)).rejects.toThrow(
      'PG connection refused',
    );
  });

  it('inserts a phantom source-artifact Entity node before the edge', async () => {
    const entityInserts: string[] = [];
    let callCount = 0;

    const mockPool = {
      query: vi.fn(async (sql: string) => {
        callCount++;
        if (callCount === 1) return { rows: [{ node_id: 'uuid-entity-test' }] };
        if (sql.includes("'Entity'") || sql.includes('"Entity"')) {
          entityInserts.push(sql);
        }
        return { rows: [] };
      }),
    };

    await insertRoundtripEvent(mockPool, VALID_META);
    expect(entityInserts.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Live PG integration tests (PG_TEST=1 only)
// ---------------------------------------------------------------------------

describe.skipIf(!PG_TEST)('insertRoundtripEvent: live PG integration', () => {
  it('inserts prov_node with sub_type=roundtrip-event and verifies via SELECT', async () => {
    const { createPool } = await import('../../pg-runtime/db.js');
    const pool = await createPool();

    try {
      const uniqueMeta: RoundTripMetadata = {
        ...VALID_META,
        sourceSha: Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join(''),
      };

      const result = await insertRoundtripEvent(pool, uniqueMeta);
      expect(typeof result.nodeId).toBe('string');

      const { rows } = await pool.query(
        `SELECT node_id, node_type, sub_type, payload->'roundTrip' AS rt
         FROM prov_node WHERE node_id = $1`,
        [result.nodeId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!['node_type']).toBe('Activity');
      expect(rows[0]!['sub_type']).toBe(KNOWN_SUB_TYPES.roundtripEvent);

      const rt = rows[0]!['rt'] as Record<string, unknown>;
      expect(rt['direction']).toBe('forward');
      expect(rt['sourceSha']).toBe(uniqueMeta.sourceSha);
    } finally {
      await pool.end();
    }
  });
});
