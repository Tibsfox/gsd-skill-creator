/**
 * Tests for the Grove format canonical encoder and record envelope.
 *
 * Every test vector here is lifted directly from `docs/GROVE-FORMAT.md`
 * section 1.5. If any of these fail, the implementation has drifted from
 * the spec and must be fixed — the spec is authoritative, not the code.
 */

import { describe, it, expect } from 'vitest';
import {
  TAG,
  HASH_ALGO,
  GROVE_VERSION,
  encode,
  decode,
  v,
  encodeRecord,
  decodeRecord,
  buildRecord,
  hashRecord,
  hashBytes,
  hashRefToHex,
  hashRefFromHex,
  hashRefEquals,
  BOOTSTRAP_TYPE_HASH,
  BOOTSTRAP_PROVENANCE,
  buildTypeRecordBootstrap,
  buildNamespaceRecordBootstrap,
  buildSignatureRecordBootstrap,
  TYPE_RECORD_HASH,
  NAMESPACE_TYPE_HASH,
  SIGNATURE_TYPE_HASH,
  type HashRef,
  type GroveRecord,
  type Provenance,
} from './grove-format.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bytesFromHex(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

// ─── Tag constants ───────────────────────────────────────────────────────────

describe('Grove tags', () => {
  it('match the spec values exactly', () => {
    expect(TAG.NULL).toBe(0x00);
    expect(TAG.TRUE).toBe(0x01);
    expect(TAG.FALSE).toBe(0x02);
    expect(TAG.UINT64).toBe(0x03);
    expect(TAG.INT64).toBe(0x04);
    expect(TAG.BYTES).toBe(0x05);
    expect(TAG.STRING).toBe(0x06);
    expect(TAG.ARRAY).toBe(0x07);
    expect(TAG.MAP).toBe(0x08);
    expect(TAG.HASHREF).toBe(0x09);
  });
});

// ─── Spec test vectors (spec §1.5) ───────────────────────────────────────────

describe('Grove canonical encoding — spec test vectors', () => {
  it('TV 1: NULL → 00', () => {
    expect(bytesToHex(encode(v.null()))).toBe('00');
  });

  it('TV 2: TRUE → 01', () => {
    expect(bytesToHex(encode(v.true()))).toBe('01');
  });

  it('TV 3: FALSE → 02', () => {
    expect(bytesToHex(encode(v.false()))).toBe('02');
  });

  it('TV 4: UINT64 42 → 03 00 00 00 00 00 00 00 2A', () => {
    expect(bytesToHex(encode(v.uint(42)))).toBe('03000000000000002a');
  });

  it('TV 5: INT64 -1 → 04 FF FF FF FF FF FF FF FF', () => {
    expect(bytesToHex(encode(v.int(-1)))).toBe('04ffffffffffffffff');
  });

  it('TV 6: STRING "test" → 06 00 00 00 04 74 65 73 74', () => {
    expect(bytesToHex(encode(v.string('test')))).toBe('060000000474657374');
  });

  it('TV 7: BYTES [DE AD BE] → 05 00 00 00 03 DE AD BE', () => {
    expect(bytesToHex(encode(v.bytes(new Uint8Array([0xde, 0xad, 0xbe]))))).toBe('0500000003deadbe');
  });

  it('TV 8: empty STRING → 06 00 00 00 00', () => {
    expect(bytesToHex(encode(v.string('')))).toBe('0600000000');
  });

  it('TV 9: empty ARRAY → 07 00 00 00 00', () => {
    expect(bytesToHex(encode(v.array([])))).toBe('0700000000');
  });

  it('TV 10: empty MAP → 08 00 00 00 00', () => {
    expect(bytesToHex(encode(v.map({})))).toBe('0800000000');
  });

  it('TV 11: ARRAY [1, 2]', () => {
    const out = bytesToHex(encode(v.array([v.uint(1), v.uint(2)])));
    expect(out).toBe(
      '07000000' +
        '02' + // count = 2
        '030000000000000001' + // uint64(1)
        '030000000000000002', // uint64(2)
    );
  });

  it('TV 12: MAP {"age": 42, "name": "test"}', () => {
    const out = bytesToHex(encode(v.map({ age: v.uint(42), name: v.string('test') })));
    // Expected bytes per spec:
    //   MAP tag + count=2
    //   entry 1: STRING "age" → UINT64 42
    //   entry 2: STRING "name" → STRING "test"
    const expected =
      '0800000002' +
      '06000000036167' + '65' + // STRING "age" (3 bytes)
      '03000000000000002a' +     // UINT64 42
      '06000000046e616d65' +     // STRING "name"
      '060000000474657374';      // STRING "test"
    // Rebuild expected carefully byte-by-byte to avoid typos:
    const expectedBytes =
      '08' + '00000002' + // MAP, count 2
      '06' + '00000003' + '616765' + // STRING "age"
      '03' + '000000000000002a' + // UINT64 42
      '06' + '00000004' + '6e616d65' + // STRING "name"
      '06' + '00000004' + '74657374'; // STRING "test"
    expect(out).toBe(expectedBytes);
    expect(encode(v.map({ age: v.uint(42), name: v.string('test') })).length).toBe(40);
  });

  it('TV 13: HASHREF sha256, 32 bytes of 0xAB', () => {
    const hash = new Uint8Array(32).fill(0xab);
    const out = bytesToHex(encode(v.hashref(HASH_ALGO.SHA_256, hash)));
    expect(out).toBe('0901' + '20' + 'ab'.repeat(32));
  });
});

// ─── Map key sorting ─────────────────────────────────────────────────────────

describe('Grove map key sorting', () => {
  it('sorts keys by byte-lexicographic order (uppercase before lowercase)', () => {
    const input = v.map({
      banana: v.null(),
      apple: v.null(),
      Apple: v.null(),
      BANANA: v.null(),
    });
    const encoded = encode(input);
    // Decode and verify order on the way back out by walking the decoded map's
    // key order via encode-decode round-trip.
    const { value } = decode(encoded);
    expect(value).toEqual({ Apple: null, BANANA: null, apple: null, banana: null });
  });

  it('encodes {"z": 1, "a": 2} as keys [a, z]', () => {
    const encoded = encode(v.map({ z: v.uint(1), a: v.uint(2) }));
    // Verify "a" comes before "z" by decoding and checking the enforced order.
    const { value } = decode(encoded);
    expect(value).toEqual({ a: { kind: 'uint64', value: 2n }, z: { kind: 'uint64', value: 1n } });
  });
});

// ─── Roundtrip ───────────────────────────────────────────────────────────────

describe('Grove encode/decode roundtrip', () => {
  const roundtrip = (value: Parameters<typeof encode>[0]) => {
    const bytes = encode(value);
    const { value: decoded, consumed } = decode(bytes);
    expect(consumed).toBe(bytes.length);
    return decoded;
  };

  it('null', () => {
    expect(roundtrip(v.null())).toBe(null);
  });

  it('true/false', () => {
    expect(roundtrip(v.true())).toBe(true);
    expect(roundtrip(v.false())).toBe(false);
  });

  it('uint64 at boundary values', () => {
    expect(roundtrip(v.uint(0))).toEqual({ kind: 'uint64', value: 0n });
    expect(roundtrip(v.uint(1))).toEqual({ kind: 'uint64', value: 1n });
    expect(roundtrip(v.uint(BigInt('18446744073709551615')))).toEqual({
      kind: 'uint64',
      value: 18446744073709551615n,
    });
  });

  it('int64 at boundary values', () => {
    expect(roundtrip(v.int(0))).toEqual({ kind: 'int64', value: 0n });
    expect(roundtrip(v.int(-1))).toEqual({ kind: 'int64', value: -1n });
    expect(roundtrip(v.int(BigInt('9223372036854775807')))).toEqual({
      kind: 'int64',
      value: 9223372036854775807n,
    });
    expect(roundtrip(v.int(BigInt('-9223372036854775808')))).toEqual({
      kind: 'int64',
      value: -9223372036854775808n,
    });
  });

  it('strings including unicode', () => {
    const input = v.string('Hello, 世界! 🌲');
    expect(roundtrip(input)).toEqual({ kind: 'string', value: 'Hello, 世界! 🌲' });
  });

  it('bytes including zero-length', () => {
    const empty = v.bytes(new Uint8Array(0));
    expect(roundtrip(empty)).toEqual({ kind: 'bytes', value: new Uint8Array(0) });

    const payload = new Uint8Array(256);
    for (let i = 0; i < 256; i++) payload[i] = i;
    const rtp = roundtrip(v.bytes(payload)) as { kind: 'bytes'; value: Uint8Array };
    expect(rtp.value.length).toBe(256);
    for (let i = 0; i < 256; i++) expect(rtp.value[i]).toBe(i);
  });

  it('nested arrays', () => {
    const input = v.array([v.uint(1), v.array([v.uint(2), v.string('x')])]);
    const decoded = roundtrip(input);
    expect(decoded).toEqual([
      { kind: 'uint64', value: 1n },
      [{ kind: 'uint64', value: 2n }, { kind: 'string', value: 'x' }],
    ]);
  });

  it('nested maps', () => {
    const input = v.map({
      outer: v.map({ inner: v.string('hi') }),
    });
    const decoded = roundtrip(input);
    expect(decoded).toEqual({ outer: { inner: { kind: 'string', value: 'hi' } } });
  });

  it('hashref', () => {
    const hash = new Uint8Array([1, 2, 3, 4]);
    const decoded = roundtrip(v.hashref(HASH_ALGO.SHA_256, hash));
    expect(decoded).toEqual({ kind: 'hashref', value: { algoId: HASH_ALGO.SHA_256, hash } });
  });
});

// ─── Decode error handling ──────────────────────────────────────────────────

describe('Grove decode error handling', () => {
  it('rejects unknown tags', () => {
    expect(() => decode(new Uint8Array([0x7f]))).toThrow(/unknown or reserved/);
    expect(() => decode(new Uint8Array([0x80]))).toThrow(/unknown or reserved/);
  });

  it('rejects truncated uint64', () => {
    expect(() => decode(new Uint8Array([TAG.UINT64, 0x00, 0x00]))).toThrow(/truncated/);
  });

  it('rejects truncated string', () => {
    const bad = new Uint8Array([TAG.STRING, 0x00, 0x00, 0x00, 0x04, 0x41, 0x42]);
    expect(() => decode(bad)).toThrow(/length exceeds/);
  });

  it('rejects map with out-of-order keys', () => {
    // Hand-craft a MAP with keys "b", "a" in that order (invalid).
    const writer: number[] = [];
    writer.push(TAG.MAP, 0x00, 0x00, 0x00, 0x02);
    // Key "b"
    writer.push(TAG.STRING, 0x00, 0x00, 0x00, 0x01, 0x62);
    writer.push(TAG.NULL);
    // Key "a" (out of order)
    writer.push(TAG.STRING, 0x00, 0x00, 0x00, 0x01, 0x61);
    writer.push(TAG.NULL);
    expect(() => decode(new Uint8Array(writer))).toThrow(/canonical order/);
  });

  it('rejects map with non-string keys', () => {
    // MAP with a UINT64 as its first "key" tag.
    const writer = [TAG.MAP, 0x00, 0x00, 0x00, 0x01, TAG.UINT64, 0, 0, 0, 0, 0, 0, 0, 1, TAG.NULL];
    expect(() => decode(new Uint8Array(writer))).toThrow(/not a STRING/);
  });
});

// ─── Record envelope ────────────────────────────────────────────────────────

describe('Grove record envelope', () => {
  const sampleTypeHash: HashRef = {
    algoId: HASH_ALGO.SHA_256,
    hash: new Uint8Array(32).fill(0x42),
  };

  const sampleProvenance: Provenance = {
    createdAtMs: 1234567890000,
    author: 'foxy',
    parentHashes: [],
    sessionId: 'session-abc',
    toolVersion: 'grove-format/1.0',
    dependencies: [],
  };

  it('encodes a record envelope with all four top-level keys', () => {
    const record: GroveRecord = {
      version: GROVE_VERSION,
      typeHash: sampleTypeHash,
      payload: new Uint8Array([0x01, 0x02, 0x03]),
      provenance: sampleProvenance,
    };
    const bytes = encodeRecord(record);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(TAG.MAP);
  });

  it('roundtrips through decodeRecord', () => {
    const record: GroveRecord = {
      version: GROVE_VERSION,
      typeHash: sampleTypeHash,
      payload: new Uint8Array([0xaa, 0xbb, 0xcc]),
      provenance: sampleProvenance,
    };
    const bytes = encodeRecord(record);
    const decoded = decodeRecord(bytes);
    expect(decoded.version).toBe(record.version);
    expect(hashRefEquals(decoded.typeHash, record.typeHash)).toBe(true);
    expect(Array.from(decoded.payload)).toEqual([0xaa, 0xbb, 0xcc]);
    expect(decoded.provenance.createdAtMs).toBe(sampleProvenance.createdAtMs);
    expect(decoded.provenance.author).toBe('foxy');
    expect(decoded.provenance.sessionId).toBe('session-abc');
    expect(decoded.provenance.toolVersion).toBe('grove-format/1.0');
    expect(decoded.provenance.parentHashes.length).toBe(0);
    expect(decoded.provenance.dependencies.length).toBe(0);
  });

  it('handles null author and session_id', () => {
    const record: GroveRecord = {
      version: GROVE_VERSION,
      typeHash: sampleTypeHash,
      payload: new Uint8Array(0),
      provenance: {
        createdAtMs: 0,
        author: null,
        parentHashes: [],
        sessionId: null,
        toolVersion: 'x',
        dependencies: [],
      },
    };
    const decoded = decodeRecord(encodeRecord(record));
    expect(decoded.provenance.author).toBe(null);
    expect(decoded.provenance.sessionId).toBe(null);
  });

  it('handles parent_hashes and dependencies arrays', () => {
    const hashA: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0x01) };
    const hashB: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0x02) };
    const record: GroveRecord = {
      version: GROVE_VERSION,
      typeHash: sampleTypeHash,
      payload: new Uint8Array(0),
      provenance: {
        createdAtMs: 0,
        author: null,
        parentHashes: [hashA],
        sessionId: null,
        toolVersion: 'x',
        dependencies: [hashA, hashB],
      },
    };
    const decoded = decodeRecord(encodeRecord(record));
    expect(decoded.provenance.parentHashes.length).toBe(1);
    expect(hashRefEquals(decoded.provenance.parentHashes[0], hashA)).toBe(true);
    expect(decoded.provenance.dependencies.length).toBe(2);
    expect(hashRefEquals(decoded.provenance.dependencies[0], hashA)).toBe(true);
    expect(hashRefEquals(decoded.provenance.dependencies[1], hashB)).toBe(true);
  });
});

// ─── Hashing ─────────────────────────────────────────────────────────────────

describe('Grove hashing', () => {
  it('hashBytes(sha256, "") matches known vector', () => {
    const empty = new Uint8Array(0);
    const digest = hashBytes(empty, HASH_ALGO.SHA_256);
    expect(bytesToHex(digest)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('hashBytes(sha256, "abc") matches known vector', () => {
    const abc = new TextEncoder().encode('abc');
    const digest = hashBytes(abc, HASH_ALGO.SHA_256);
    expect(bytesToHex(digest)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hashRecord produces deterministic output', () => {
    const record: GroveRecord = buildRecord(
      BOOTSTRAP_TYPE_HASH,
      encode(v.string('payload')),
      {
        createdAtMs: 1000,
        author: 'test',
        parentHashes: [],
        sessionId: null,
        toolVersion: 'grove-format/1.0',
        dependencies: [],
      },
    );
    const h1 = hashRecord(record);
    const h2 = hashRecord(record);
    expect(hashRefEquals(h1, h2)).toBe(true);
    expect(h1.algoId).toBe(HASH_ALGO.SHA_256);
    expect(h1.hash.length).toBe(32);
  });

  it('hashRecord differs when payload changes', () => {
    const record1: GroveRecord = buildRecord(BOOTSTRAP_TYPE_HASH, encode(v.string('one')), {
      createdAtMs: 0,
      toolVersion: 'x',
    });
    const record2: GroveRecord = buildRecord(BOOTSTRAP_TYPE_HASH, encode(v.string('two')), {
      createdAtMs: 0,
      toolVersion: 'x',
    });
    expect(hashRefEquals(hashRecord(record1), hashRecord(record2))).toBe(false);
  });

  it('hashRefToHex + hashRefFromHex roundtrip', () => {
    const ref: HashRef = {
      algoId: HASH_ALGO.SHA_256,
      hash: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    };
    const hex = hashRefToHex(ref);
    expect(hex).toBe('deadbeef');
    const back = hashRefFromHex(hex);
    expect(hashRefEquals(back, ref)).toBe(true);
  });

  it('hashRefEquals rejects mismatched algo or length', () => {
    const a: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array([1, 2]) };
    const b: HashRef = { algoId: HASH_ALGO.SHA_512, hash: new Uint8Array([1, 2]) };
    const c: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array([1, 2, 3]) };
    expect(hashRefEquals(a, b)).toBe(false);
    expect(hashRefEquals(a, c)).toBe(false);
  });
});

// ─── Bootstrap types ─────────────────────────────────────────────────────────

describe('Grove bootstrap type records', () => {
  it('TYPE_RECORD_HASH is a 32-byte SHA-256', () => {
    expect(TYPE_RECORD_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(TYPE_RECORD_HASH.hash.length).toBe(32);
  });

  it('NAMESPACE_TYPE_HASH is a 32-byte SHA-256', () => {
    expect(NAMESPACE_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(NAMESPACE_TYPE_HASH.hash.length).toBe(32);
  });

  it('SIGNATURE_TYPE_HASH is a 32-byte SHA-256', () => {
    expect(SIGNATURE_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(SIGNATURE_TYPE_HASH.hash.length).toBe(32);
  });

  it('All three bootstrap hashes are distinct', () => {
    expect(hashRefEquals(TYPE_RECORD_HASH, NAMESPACE_TYPE_HASH)).toBe(false);
    expect(hashRefEquals(TYPE_RECORD_HASH, SIGNATURE_TYPE_HASH)).toBe(false);
    expect(hashRefEquals(NAMESPACE_TYPE_HASH, SIGNATURE_TYPE_HASH)).toBe(false);
  });

  it('Bootstrap records have type_hash = BOOTSTRAP_TYPE_HASH (32 zeros)', () => {
    const t = buildTypeRecordBootstrap();
    const n = buildNamespaceRecordBootstrap();
    const s = buildSignatureRecordBootstrap();
    expect(hashRefEquals(t.typeHash, BOOTSTRAP_TYPE_HASH)).toBe(true);
    expect(hashRefEquals(n.typeHash, BOOTSTRAP_TYPE_HASH)).toBe(true);
    expect(hashRefEquals(s.typeHash, BOOTSTRAP_TYPE_HASH)).toBe(true);
    expect(Array.from(BOOTSTRAP_TYPE_HASH.hash).every((b) => b === 0)).toBe(true);
  });

  it('Bootstrap records have BOOTSTRAP_PROVENANCE (deterministic)', () => {
    const t = buildTypeRecordBootstrap();
    expect(t.provenance).toEqual(BOOTSTRAP_PROVENANCE);
  });

  it('Bootstrap hashes are deterministic across multiple builds', () => {
    const t1 = hashRecord(buildTypeRecordBootstrap());
    const t2 = hashRecord(buildTypeRecordBootstrap());
    expect(hashRefEquals(t1, t2)).toBe(true);
    expect(hashRefEquals(t1, TYPE_RECORD_HASH)).toBe(true);
  });

  it('Bootstrap records roundtrip through encode/decode', () => {
    for (const record of [
      buildTypeRecordBootstrap(),
      buildNamespaceRecordBootstrap(),
      buildSignatureRecordBootstrap(),
    ]) {
      const bytes = encodeRecord(record);
      const decoded = decodeRecord(bytes);
      expect(decoded.version).toBe(GROVE_VERSION);
      expect(hashRefEquals(decoded.typeHash, BOOTSTRAP_TYPE_HASH)).toBe(true);
      // Re-hash must match the original.
      const h1 = hashRecord(record);
      const h2 = hashRecord(decoded);
      expect(hashRefEquals(h1, h2)).toBe(true);
    }
  });
});

// ─── buildRecord helper ──────────────────────────────────────────────────────

describe('Grove buildRecord helper', () => {
  it('fills in default provenance fields', () => {
    const record = buildRecord(BOOTSTRAP_TYPE_HASH, encode(v.string('hi')));
    expect(record.version).toBe(GROVE_VERSION);
    expect(record.provenance.author).toBe(null);
    expect(record.provenance.sessionId).toBe(null);
    expect(record.provenance.toolVersion).toBe('grove-format/1.0');
    expect(record.provenance.parentHashes).toEqual([]);
    expect(record.provenance.dependencies).toEqual([]);
    expect(typeof record.provenance.createdAtMs).toBe('number');
  });

  it('respects explicit provenance overrides', () => {
    const record = buildRecord(BOOTSTRAP_TYPE_HASH, new Uint8Array(0), {
      createdAtMs: 42,
      author: 'cedar',
      sessionId: 'sess-1',
      toolVersion: 'custom/0.1',
    });
    expect(record.provenance.createdAtMs).toBe(42);
    expect(record.provenance.author).toBe('cedar');
    expect(record.provenance.sessionId).toBe('sess-1');
    expect(record.provenance.toolVersion).toBe('custom/0.1');
  });
});

// ─── Cross-implementation determinism check ─────────────────────────────────

describe('Grove determinism guarantees', () => {
  it('encoding the same logical value twice gives identical bytes', () => {
    const value = v.map({
      name: v.string('test'),
      version: v.uint(1),
      data: v.bytes(new Uint8Array([1, 2, 3])),
    });
    const a = encode(value);
    const b = encode(value);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('different insertion order in map literal still produces identical bytes', () => {
    const a = encode(v.map({ apple: v.uint(1), banana: v.uint(2), cherry: v.uint(3) }));
    const b = encode(v.map({ cherry: v.uint(3), apple: v.uint(1), banana: v.uint(2) }));
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('record hash is stable across encode cycles', () => {
    const record: GroveRecord = buildRecord(BOOTSTRAP_TYPE_HASH, encode(v.string('stable')), {
      createdAtMs: 1000,
      author: 'test',
      parentHashes: [],
      sessionId: null,
      toolVersion: 'grove-format/1.0',
      dependencies: [],
    });
    const bytes1 = encodeRecord(record);
    const bytes2 = encodeRecord(record);
    expect(Array.from(bytes1)).toEqual(Array.from(bytes2));
    expect(hashRefEquals(hashRecord(record), hashRecord(decodeRecord(bytes1)))).toBe(true);
  });
});
