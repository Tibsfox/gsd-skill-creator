/**
 * Component 05 — idempotency.ts tests.
 *
 * 6 tests covering checkIdempotency():
 *
 *  1. Returns { exists: false } when no matching row in mock pool
 *  2. Returns { exists: true, nodeId } when matching row found
 *  3. Uses KNOWN_SUB_TYPES.roundtripEvent (not a raw string literal) as $1
 *  4. Uses all 4 SHA-key fields (sourceSha, targetSha, svgSha, direction) in query
 *  5. First-insert then dedup — second call returns same nodeId (live PG, gated)
 *  6. SHA-triple-mismatch (one field differs) returns { exists: false } (live PG, gated)
 *
 * PG_TEST=1 gates the live-PG tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { checkIdempotency } from '../idempotency.js';
import { KNOWN_SUB_TYPES } from '../../types/prov.js';
import type { RoundTripMetadata } from '../../types/metadata-namespace.js';

const PG_TEST = process.env['PG_TEST'] === '1';

const SHA = 'a'.repeat(40);
const SHA2 = 'b'.repeat(40);
const SHA3 = 'c'.repeat(40);

const META: RoundTripMetadata = {
  direction: 'forward',
  sourceLanguage: 'typescript',
  targetLanguage: 'verilog',
  sourceSha: SHA,
  targetSha: SHA2,
  svgSha: SHA3,
};

// ---------------------------------------------------------------------------
// Unit-level mock tests (no PG required)
// ---------------------------------------------------------------------------

describe('checkIdempotency: mock pool — no existing row', () => {
  it('returns { exists: false } when query returns empty rows', async () => {
    const mockPool = {
      query: vi.fn(async () => ({ rows: [] })),
    };

    const result = await checkIdempotency(mockPool, META);
    expect(result.exists).toBe(false);
  });
});

describe('checkIdempotency: mock pool — existing row found', () => {
  it('returns { exists: true, nodeId } when query returns a matching row', async () => {
    const mockPool = {
      query: vi.fn(async () => ({
        rows: [{ node_id: 'existing-uuid-abc123' }],
      })),
    };

    const result = await checkIdempotency(mockPool, META);
    expect(result.exists).toBe(true);
    if (result.exists) {
      expect(result.nodeId).toBe('existing-uuid-abc123');
    }
  });

  it('uses KNOWN_SUB_TYPES.roundtripEvent as first query param', async () => {
    let capturedParams: unknown[] = [];
    const mockPool = {
      query: vi.fn(async (_sql: string, params?: unknown[]) => {
        capturedParams = params ?? [];
        return { rows: [] };
      }),
    };

    await checkIdempotency(mockPool, META);

    // $1 must be the typed constant, not a raw string literal
    expect(capturedParams[0]).toBe(KNOWN_SUB_TYPES.roundtripEvent);
    expect(capturedParams[0]).toBe('roundtrip-event');
  });

  it('passes all 4 SHA fields + direction in the correct order', async () => {
    let capturedParams: unknown[] = [];
    const mockPool = {
      query: vi.fn(async (_sql: string, params?: unknown[]) => {
        capturedParams = params ?? [];
        return { rows: [] };
      }),
    };

    await checkIdempotency(mockPool, META);

    // $2 = sourceSha, $3 = targetSha, $4 = svgSha, $5 = direction
    expect(capturedParams[1]).toBe(SHA);   // sourceSha
    expect(capturedParams[2]).toBe(SHA2);  // targetSha
    expect(capturedParams[3]).toBe(SHA3);  // svgSha
    expect(capturedParams[4]).toBe('forward'); // direction
  });
});

// ---------------------------------------------------------------------------
// Live PG integration tests (PG_TEST=1 only)
// ---------------------------------------------------------------------------

describe.skipIf(!PG_TEST)('checkIdempotency: live PG integration', () => {
  it('first insert → exists:false; second check → exists:true with same nodeId', async () => {
    const { createPool } = await import('../../pg-runtime/db.js');
    const { insertRoundtripEvent } = await import('../insert-event.js');
    const pool = await createPool();

    try {
      const uniqueMeta: RoundTripMetadata = {
        ...META,
        sourceSha: Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join(''),
      };

      // Before insert — should not exist
      const before = await checkIdempotency(pool, uniqueMeta);
      expect(before.exists).toBe(false);

      // Insert
      const inserted = await insertRoundtripEvent(pool, uniqueMeta);

      // After insert — should exist with the same nodeId
      const after = await checkIdempotency(pool, uniqueMeta);
      expect(after.exists).toBe(true);
      if (after.exists) {
        expect(after.nodeId).toBe(inserted.nodeId);
      }
    } finally {
      await pool.end();
    }
  });

  it('SHA-triple-mismatch (svgSha differs) → exists:false', async () => {
    const { createPool } = await import('../../pg-runtime/db.js');
    const { insertRoundtripEvent } = await import('../insert-event.js');
    const pool = await createPool();

    try {
      const baseMeta: RoundTripMetadata = {
        ...META,
        sourceSha: Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join(''),
      };

      await insertRoundtripEvent(pool, baseMeta);

      // Change svgSha — should NOT match
      const differentSvgSha = 'd'.repeat(40);
      const result = await checkIdempotency(pool, {
        ...baseMeta,
        svgSha: differentSvgSha,
      });
      expect(result.exists).toBe(false);
    } finally {
      await pool.end();
    }
  });
});
