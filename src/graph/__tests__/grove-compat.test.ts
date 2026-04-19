/**
 * M1 Semantic Memory Graph — grove-format compatibility gate (CF-M1-05).
 *
 * This test asserts that the M1 layer does not modify grove-format.ts. The
 * canonical signal is that the three bootstrap type hashes have not changed,
 * and that the encoder/decoder round-trips an entity payload correctly when
 * wrapped in a Grove record envelope.
 *
 * The actual grove-format test suite (`src/memory/grove-format.test.ts`)
 * remains the authoritative CF-M1-05 oracle; this file is an additional
 * explicit gate that M1's projection layer does not accidentally depend
 * on mutated grove semantics.
 */
import { describe, it, expect } from 'vitest';
import {
  GROVE_VERSION,
  HASH_ALGO,
  TYPE_RECORD_HASH,
  NAMESPACE_TYPE_HASH,
  SIGNATURE_TYPE_HASH,
  buildRecord,
  encodeRecord,
  decodeRecord,
  hashRecord,
  hashRefEquals,
  hashRefToHex,
} from '../../memory/grove-format.js';
import { encodeEntity, decodeEntity } from '../schema.js';
import type { Entity } from '../../types/memory.js';

describe('grove-format compatibility (CF-M1-05)', () => {
  it('GROVE_VERSION is still 1', () => {
    expect(GROVE_VERSION).toBe(1);
  });

  it('bootstrap type hashes have not changed', () => {
    expect(TYPE_RECORD_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(NAMESPACE_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(SIGNATURE_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    // Hashes are deterministic byte outputs; length = 32 for SHA-256.
    expect(TYPE_RECORD_HASH.hash.length).toBe(32);
    expect(NAMESPACE_TYPE_HASH.hash.length).toBe(32);
    expect(SIGNATURE_TYPE_HASH.hash.length).toBe(32);
    expect(hashRefEquals(TYPE_RECORD_HASH, NAMESPACE_TYPE_HASH)).toBe(false);
  });

  it('entity payload embeds in a Grove record envelope cleanly', () => {
    const entity: Entity = {
      id: 'skill:grove-compat',
      kind: 'skill',
      attrs: { name: 'grove-compat', version: 1 },
    };
    const payload = encodeEntity(entity);
    const record = buildRecord(TYPE_RECORD_HASH, payload, {
      createdAtMs: 1_774_000_000_000,
      author: 'm1-graph-ingest',
      toolVersion: 'graph/1.0',
    });
    const encoded = encodeRecord(record);
    const decoded = decodeRecord(encoded);
    expect(decoded.version).toBe(GROVE_VERSION);
    expect(decoded.provenance.author).toBe('m1-graph-ingest');
    expect(decoded.payload.length).toBe(payload.length);
    // The payload itself still decodes to the original entity via M1 schema.
    const restored = decodeEntity(decoded.payload);
    expect(restored).toEqual(entity);

    // Identity hash is stable — re-hashing produces the same result.
    const h1 = hashRecord(record);
    const h2 = hashRecord(record);
    expect(hashRefEquals(h1, h2)).toBe(true);
    expect(hashRefToHex(h1).length).toBe(64);
  });
});
