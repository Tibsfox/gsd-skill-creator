/**
 * Grove Format — canonical binary encoding + record envelope + hashing.
 *
 * This module is the authoritative TypeScript implementation of the
 * `docs/GROVE-FORMAT.md` specification. Every design choice in this file
 * is driven by the spec; the spec is the source of truth, and this code
 * is an interpretation of it.
 *
 * The format is content-addressed, append-only, self-describing, and
 * designed to outlive every tool that reads it. Bytes written by this
 * module in 2026 must be readable by any conforming implementation in
 * 2046, 2066, or whenever, as long as they follow the spec.
 *
 * Four layers in this file:
 *
 *   1. Canonical encoder / decoder (section 1 of the spec)
 *   2. Record envelope + provenance (section 2)
 *   3. Hashing + HASHREF handling (sections 5 + 6)
 *   4. Bootstrap type records (section 4)
 *
 * Layers 1-2 have zero dependencies beyond `node:crypto` for SHA-256.
 *
 * @module memory/grove-format
 */

import { createHash } from 'node:crypto';

// ============================================================================
// Layer 1: Canonical binary encoding (spec section 1)
// ============================================================================

/** Canonical type tags. See spec section 1.1. */
export const TAG = {
  NULL: 0x00,
  TRUE: 0x01,
  FALSE: 0x02,
  UINT64: 0x03,
  INT64: 0x04,
  BYTES: 0x05,
  STRING: 0x06,
  ARRAY: 0x07,
  MAP: 0x08,
  HASHREF: 0x09,
} as const;

/**
 * A HASHREF is a content-addressed reference to another record. It carries
 * the hash algorithm id alongside the hash bytes so readers can identify
 * which algorithm to use when verifying.
 */
export interface HashRef {
  algoId: number;
  hash: Uint8Array;
}

/**
 * Canonical values are the union of everything the encoder can handle.
 * This is a recursive type because arrays and maps contain other values.
 */
export type CanonicalValue =
  | null
  | boolean
  | { kind: 'uint64'; value: bigint }
  | { kind: 'int64'; value: bigint }
  | { kind: 'bytes'; value: Uint8Array }
  | { kind: 'string'; value: string }
  | { kind: 'hashref'; value: HashRef }
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

// ─── Primitive constructors (ergonomic helpers) ─────────────────────────────

export const v = {
  null: (): CanonicalValue => null,
  true: (): CanonicalValue => true,
  false: (): CanonicalValue => false,
  uint: (value: number | bigint): CanonicalValue => ({
    kind: 'uint64',
    value: typeof value === 'bigint' ? value : BigInt(value),
  }),
  int: (value: number | bigint): CanonicalValue => ({
    kind: 'int64',
    value: typeof value === 'bigint' ? value : BigInt(value),
  }),
  bytes: (value: Uint8Array): CanonicalValue => ({ kind: 'bytes', value }),
  string: (value: string): CanonicalValue => ({ kind: 'string', value }),
  hashref: (algoId: number, hash: Uint8Array): CanonicalValue => ({
    kind: 'hashref',
    value: { algoId, hash },
  }),
  array: (values: CanonicalValue[]): CanonicalValue => values,
  map: (entries: Record<string, CanonicalValue>): CanonicalValue => entries,
};

// ─── Byte buffer writer ─────────────────────────────────────────────────────

/**
 * Simple growable byte buffer with big-endian write helpers. All canonical
 * integers in Grove are big-endian unsigned (spec §1).
 */
class BufferWriter {
  private bytes: number[] = [];

  writeByte(b: number): void {
    this.bytes.push(b & 0xff);
  }

  writeU32BE(n: number): void {
    if (n < 0 || n > 0xffffffff) {
      throw new Error(`grove: u32 out of range: ${n}`);
    }
    this.bytes.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
  }

  writeU64BE(n: bigint): void {
    if (n < 0n || n > 0xffffffffffffffffn) {
      throw new Error(`grove: u64 out of range: ${n}`);
    }
    for (let i = 7; i >= 0; i--) {
      this.bytes.push(Number((n >> BigInt(i * 8)) & 0xffn));
    }
  }

  writeI64BE(n: bigint): void {
    // Two's complement encoding: positive = straight u64, negative = 2^64 + n.
    if (n < -(1n << 63n) || n >= 1n << 63n) {
      throw new Error(`grove: i64 out of range: ${n}`);
    }
    const encoded = n < 0n ? (1n << 64n) + n : n;
    this.writeU64BE(encoded);
  }

  writeBytes(src: Uint8Array): void {
    for (let i = 0; i < src.length; i++) this.bytes.push(src[i]);
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

// ─── Encoding (spec §1) ──────────────────────────────────────────────────────

/**
 * Encode a canonical value into its deterministic byte representation.
 * See spec §1 for rules. The output is suitable for hashing.
 */
export function encode(value: CanonicalValue): Uint8Array {
  const buf = new BufferWriter();
  writeValue(buf, value);
  return buf.toUint8Array();
}

function writeValue(buf: BufferWriter, value: CanonicalValue): void {
  if (value === null) {
    buf.writeByte(TAG.NULL);
    return;
  }
  if (value === true) {
    buf.writeByte(TAG.TRUE);
    return;
  }
  if (value === false) {
    buf.writeByte(TAG.FALSE);
    return;
  }
  if (Array.isArray(value)) {
    buf.writeByte(TAG.ARRAY);
    buf.writeU32BE(value.length);
    for (const element of value) writeValue(buf, element);
    return;
  }
  if (typeof value === 'object') {
    // Could be a tagged primitive or a map.
    if ('kind' in value) {
      switch (value.kind) {
        case 'uint64':
          buf.writeByte(TAG.UINT64);
          buf.writeU64BE(value.value);
          return;
        case 'int64':
          buf.writeByte(TAG.INT64);
          buf.writeI64BE(value.value);
          return;
        case 'bytes':
          buf.writeByte(TAG.BYTES);
          buf.writeU32BE(value.value.length);
          buf.writeBytes(value.value);
          return;
        case 'string': {
          const nfc = value.value.normalize('NFC');
          const encoded = new TextEncoder().encode(nfc);
          buf.writeByte(TAG.STRING);
          buf.writeU32BE(encoded.length);
          buf.writeBytes(encoded);
          return;
        }
        case 'hashref': {
          const { algoId, hash } = value.value;
          if (algoId < 0 || algoId > 0xff) {
            throw new Error(`grove: algoId out of range: ${algoId}`);
          }
          if (hash.length < 1 || hash.length > 0xff) {
            throw new Error(`grove: hash length out of range: ${hash.length}`);
          }
          buf.writeByte(TAG.HASHREF);
          buf.writeByte(algoId);
          buf.writeByte(hash.length);
          buf.writeBytes(hash);
          return;
        }
      }
    }
    // Plain object = MAP.
    const keys = Object.keys(value).slice();
    // Check unique keys. Object.keys already gives unique keys, but we
    // verify there are no duplicate UTF-8 encodings (unlikely but explicit).
    const keySet = new Set(keys);
    if (keySet.size !== keys.length) {
      throw new Error('grove: duplicate map keys');
    }
    // Sort by byte-lexicographic order of UTF-8 NFC encoding (spec §1.4).
    const encoder = new TextEncoder();
    const entries = keys.map((k) => ({ key: k, bytes: encoder.encode(k.normalize('NFC')) }));
    entries.sort((a, b) => compareBytes(a.bytes, b.bytes));

    buf.writeByte(TAG.MAP);
    buf.writeU32BE(entries.length);
    for (const entry of entries) {
      // Key (as STRING).
      buf.writeByte(TAG.STRING);
      buf.writeU32BE(entry.bytes.length);
      buf.writeBytes(entry.bytes);
      // Value.
      writeValue(buf, (value as Record<string, CanonicalValue>)[entry.key]);
    }
    return;
  }
  throw new Error(`grove: cannot encode value of type ${typeof value}`);
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

// ─── Decoding (spec §1) ──────────────────────────────────────────────────────

/**
 * Decode a canonical byte sequence into a value. Returns the value plus
 * the number of bytes consumed. Useful when decoding a stream of values.
 */
export function decode(bytes: Uint8Array, offset = 0): { value: CanonicalValue; consumed: number } {
  const [value, next] = readValue(bytes, offset);
  return { value, consumed: next - offset };
}

function readValue(bytes: Uint8Array, offset: number): [CanonicalValue, number] {
  if (offset >= bytes.length) throw new Error('grove: unexpected end of input');
  const tag = bytes[offset];
  offset += 1;
  switch (tag) {
    case TAG.NULL:
      return [null, offset];
    case TAG.TRUE:
      return [true, offset];
    case TAG.FALSE:
      return [false, offset];
    case TAG.UINT64: {
      const value = readU64BE(bytes, offset);
      return [{ kind: 'uint64', value }, offset + 8];
    }
    case TAG.INT64: {
      const u = readU64BE(bytes, offset);
      // Convert from u64 two's complement to signed i64.
      const value = u >= 1n << 63n ? u - (1n << 64n) : u;
      return [{ kind: 'int64', value }, offset + 8];
    }
    case TAG.BYTES: {
      const len = readU32BE(bytes, offset);
      offset += 4;
      if (offset + len > bytes.length) throw new Error('grove: bytes length exceeds input');
      const slice = bytes.slice(offset, offset + len);
      return [{ kind: 'bytes', value: slice }, offset + len];
    }
    case TAG.STRING: {
      const len = readU32BE(bytes, offset);
      offset += 4;
      if (offset + len > bytes.length) throw new Error('grove: string length exceeds input');
      const slice = bytes.slice(offset, offset + len);
      const text = new TextDecoder('utf-8', { fatal: true }).decode(slice);
      return [{ kind: 'string', value: text }, offset + len];
    }
    case TAG.ARRAY: {
      const count = readU32BE(bytes, offset);
      offset += 4;
      const arr: CanonicalValue[] = [];
      for (let i = 0; i < count; i++) {
        const [v, next] = readValue(bytes, offset);
        arr.push(v);
        offset = next;
      }
      return [arr, offset];
    }
    case TAG.MAP: {
      const count = readU32BE(bytes, offset);
      offset += 4;
      const obj: Record<string, CanonicalValue> = {};
      let previousKeyBytes: Uint8Array | null = null;
      for (let i = 0; i < count; i++) {
        // Key must be a STRING.
        if (bytes[offset] !== TAG.STRING) {
          throw new Error(`grove: map key at entry ${i} is not a STRING tag`);
        }
        const [keyValue, afterKey] = readValue(bytes, offset);
        offset = afterKey;
        if (typeof keyValue !== 'object' || keyValue === null || !('kind' in keyValue) || keyValue.kind !== 'string') {
          throw new Error('grove: map key did not decode to string');
        }
        const keyStr = keyValue.value;
        const keyBytes = new TextEncoder().encode(keyStr.normalize('NFC'));
        // Enforce canonical ordering on decode.
        if (previousKeyBytes && compareBytes(previousKeyBytes, keyBytes) >= 0) {
          throw new Error(`grove: map keys not in canonical order at entry ${i}`);
        }
        previousKeyBytes = keyBytes;
        const [valueValue, afterValue] = readValue(bytes, offset);
        offset = afterValue;
        obj[keyStr] = valueValue;
      }
      return [obj, offset];
    }
    case TAG.HASHREF: {
      if (offset + 2 > bytes.length) throw new Error('grove: truncated hashref header');
      const algoId = bytes[offset];
      const hashLen = bytes[offset + 1];
      offset += 2;
      if (hashLen < 1) throw new Error('grove: hashref length must be >= 1');
      if (offset + hashLen > bytes.length) throw new Error('grove: hashref length exceeds input');
      const hash = bytes.slice(offset, offset + hashLen);
      return [{ kind: 'hashref', value: { algoId, hash } }, offset + hashLen];
    }
    default:
      throw new Error(`grove: unknown or reserved tag 0x${tag.toString(16).padStart(2, '0')}`);
  }
}

function readU32BE(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error('grove: truncated u32');
  return (
    ((bytes[offset] << 24) >>> 0) +
    ((bytes[offset + 1] << 16) >>> 0) +
    ((bytes[offset + 2] << 8) >>> 0) +
    bytes[offset + 3]
  );
}

function readU64BE(bytes: Uint8Array, offset: number): bigint {
  if (offset + 8 > bytes.length) throw new Error('grove: truncated u64');
  let result = 0n;
  for (let i = 0; i < 8; i++) {
    result = (result << 8n) | BigInt(bytes[offset + i]);
  }
  return result;
}

// ============================================================================
// Layer 2: Record envelope + provenance (spec section 2)
// ============================================================================

/** A Grove record envelope. See spec §2. */
export interface GroveRecord {
  /** Format version. Currently 1. */
  version: number;
  /** Identity hash of the type schema record. */
  typeHash: HashRef;
  /** Canonical-encoded type-specific content. */
  payload: Uint8Array;
  /** Provenance metadata. See spec §2.1. */
  provenance: Provenance;
}

/** Provenance metadata. See spec §2.1. */
export interface Provenance {
  /** Unix milliseconds when this record was created. */
  createdAtMs: number;
  /** Opaque author identifier, or null. */
  author: string | null;
  /** Records this was derived from (e.g. prior versions). */
  parentHashes: HashRef[];
  /** Session/context identifier, or null. */
  sessionId: string | null;
  /** Software version that wrote this record. */
  toolVersion: string;
  /** Semantic references to other records. */
  dependencies: HashRef[];
}

/**
 * The current format version. Bumping this is a major change — see spec §9.4.
 */
export const GROVE_VERSION = 1;

/**
 * Encode a record envelope into canonical bytes for hashing or storage.
 * This is the deterministic serialization used by hashRecord().
 */
export function encodeRecord(record: GroveRecord): Uint8Array {
  const envelope = buildRecordMap(record);
  return encode(envelope);
}

/**
 * Decode canonical bytes back into a record envelope. Performs structural
 * validation but does not verify the identity hash (the caller is expected
 * to do that separately via hashRecord).
 */
export function decodeRecord(bytes: Uint8Array): GroveRecord {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('grove: record root is not a map');
  }
  const mapValue = value as Record<string, CanonicalValue>;
  const version = asUint64(mapValue.version, 'version');
  if (version !== BigInt(GROVE_VERSION)) {
    throw new Error(`grove: unsupported record version ${version}, reader only supports ${GROVE_VERSION}`);
  }
  const typeHash = asHashRef(mapValue.type_hash, 'type_hash');
  const payload = asBytes(mapValue.payload, 'payload');
  const provenance = decodeProvenance(mapValue.provenance);
  return { version: Number(version), typeHash, payload, provenance };
}

function buildRecordMap(record: GroveRecord): CanonicalValue {
  return {
    version: v.uint(record.version),
    type_hash: v.hashref(record.typeHash.algoId, record.typeHash.hash),
    payload: v.bytes(record.payload),
    provenance: buildProvenanceMap(record.provenance),
  };
}

function buildProvenanceMap(p: Provenance): CanonicalValue {
  return {
    created_at_ms: v.uint(p.createdAtMs),
    author: p.author === null ? v.null() : v.string(p.author),
    parent_hashes: p.parentHashes.map((h) => v.hashref(h.algoId, h.hash)),
    session_id: p.sessionId === null ? v.null() : v.string(p.sessionId),
    tool_version: v.string(p.toolVersion),
    dependencies: p.dependencies.map((h) => v.hashref(h.algoId, h.hash)),
  };
}

function decodeProvenance(value: CanonicalValue | undefined): Provenance {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('grove: provenance is not a map');
  }
  const map = value as Record<string, CanonicalValue>;
  return {
    createdAtMs: Number(asUint64(map.created_at_ms, 'provenance.created_at_ms')),
    author: asStringOrNull(map.author, 'provenance.author'),
    parentHashes: asHashRefArray(map.parent_hashes, 'provenance.parent_hashes'),
    sessionId: asStringOrNull(map.session_id, 'provenance.session_id'),
    toolVersion: asString(map.tool_version, 'provenance.tool_version'),
    dependencies: asHashRefArray(map.dependencies, 'provenance.dependencies'),
  };
}

// ─── Value unwrappers for decode-side validation ────────────────────────────

function asUint64(v: CanonicalValue | undefined, ctx: string): bigint {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'uint64') {
    return v.value;
  }
  throw new Error(`grove: expected uint64 at ${ctx}`);
}

function asBytes(v: CanonicalValue | undefined, ctx: string): Uint8Array {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'bytes') {
    return v.value;
  }
  throw new Error(`grove: expected bytes at ${ctx}`);
}

function asString(v: CanonicalValue | undefined, ctx: string): string {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'string') {
    return v.value;
  }
  throw new Error(`grove: expected string at ${ctx}`);
}

function asStringOrNull(v: CanonicalValue | undefined, ctx: string): string | null {
  if (v === null) return null;
  return asString(v, ctx);
}

function asHashRef(v: CanonicalValue | undefined, ctx: string): HashRef {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'hashref') {
    return v.value;
  }
  throw new Error(`grove: expected hashref at ${ctx}`);
}

function asHashRefArray(v: CanonicalValue | undefined, ctx: string): HashRef[] {
  if (!Array.isArray(v)) {
    throw new Error(`grove: expected array at ${ctx}`);
  }
  return v.map((elem, i) => asHashRef(elem, `${ctx}[${i}]`));
}

// ============================================================================
// Layer 3: Hashing (spec sections 5 + 6)
// ============================================================================

/** Hash algorithm ids (spec §5). */
export const HASH_ALGO = {
  SHA_256: 0x01,
  BLAKE3_256: 0x02,
  SHA3_256: 0x03,
  SHA_512: 0x04,
  BLAKE3_512: 0x05,
} as const;

/**
 * Hash a byte buffer with the given algorithm id. v1 implementations
 * support SHA-256, SHA-512, and SHA3-256 via node:crypto. Blake3 requires
 * an external dependency and throws if requested; callers can implement
 * Blake3 themselves and pass the result via HashRef constructors.
 */
export function hashBytes(bytes: Uint8Array, algoId: number = HASH_ALGO.SHA_256): Uint8Array {
  switch (algoId) {
    case HASH_ALGO.SHA_256:
      return new Uint8Array(createHash('sha256').update(bytes).digest());
    case HASH_ALGO.SHA_512:
      return new Uint8Array(createHash('sha512').update(bytes).digest());
    case HASH_ALGO.SHA3_256:
      return new Uint8Array(createHash('sha3-256').update(bytes).digest());
    case HASH_ALGO.BLAKE3_256:
    case HASH_ALGO.BLAKE3_512:
      throw new Error(
        `grove: Blake3 hashing not implemented by reference TS — caller must supply precomputed bytes`,
      );
    default:
      throw new Error(`grove: unknown hash algorithm id 0x${algoId.toString(16)}`);
  }
}

/**
 * Compute a record's identity hash (spec §6). The identity is the selected
 * algorithm applied to the canonical-encoded record envelope. Default is
 * SHA-256.
 */
export function hashRecord(record: GroveRecord, algoId: number = HASH_ALGO.SHA_256): HashRef {
  const bytes = encodeRecord(record);
  const hash = hashBytes(bytes, algoId);
  return { algoId, hash };
}

/** Format a HashRef as a lowercase hex string for filenames and display. */
export function hashRefToHex(ref: HashRef): string {
  let out = '';
  for (let i = 0; i < ref.hash.length; i++) {
    out += ref.hash[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Parse a hex string into a HashRef (using the given algorithm). */
export function hashRefFromHex(hex: string, algoId: number = HASH_ALGO.SHA_256): HashRef {
  if (hex.length === 0 || hex.length % 2 !== 0) {
    throw new Error(`grove: invalid hex length ${hex.length}`);
  }
  const n = hex.length / 2;
  const hash = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error(`grove: invalid hex at offset ${i * 2}`);
    hash[i] = byte;
  }
  return { algoId, hash };
}

/** Compare two HashRefs by their hash bytes (and algoId). */
export function hashRefEquals(a: HashRef, b: HashRef): boolean {
  if (a.algoId !== b.algoId) return false;
  if (a.hash.length !== b.hash.length) return false;
  for (let i = 0; i < a.hash.length; i++) {
    if (a.hash[i] !== b.hash[i]) return false;
  }
  return true;
}

// ============================================================================
// Layer 4: Bootstrap type records (spec section 4)
// ============================================================================

/**
 * The sentinel bootstrap type hash (spec §3.1). A record whose type_hash
 * equals this value is a bootstrap type record interpreted using the spec
 * directly. Always 32 zero bytes with algoId=0x01 (SHA-256 length).
 */
export const BOOTSTRAP_TYPE_HASH: HashRef = {
  algoId: HASH_ALGO.SHA_256,
  hash: new Uint8Array(32), // 32 zero bytes
};

/**
 * Empty provenance used for bootstrap type records. All bootstrap records
 * have the same provenance so their identity hashes are deterministic
 * across implementations.
 */
export const BOOTSTRAP_PROVENANCE: Provenance = {
  createdAtMs: 0,
  author: null,
  parentHashes: [],
  sessionId: null,
  toolVersion: 'grove-format/1.0',
  dependencies: [],
};

/** A single field definition inside a type record. See spec §3.2. */
export interface FieldDef {
  name: string;
  kind: 'null' | 'bool' | 'uint64' | 'int64' | 'string' | 'bytes' | 'hashref' | 'array' | 'map';
  elementKind: string | null;
  required: boolean;
  description: string;
}

/**
 * The payload of a TypeRecord. See spec §3.2 and §4.1.
 */
export function typeRecordPayload(
  name: string,
  description: string,
  fields: FieldDef[],
): Uint8Array {
  return encode({
    name: v.string(name),
    description: v.string(description),
    fields: fields.map(
      (f) =>
        ({
          name: v.string(f.name),
          kind: v.string(f.kind),
          element_kind: f.elementKind === null ? v.null() : v.string(f.elementKind),
          required: f.required,
          description: v.string(f.description),
        }) as CanonicalValue,
    ),
  });
}

/**
 * Build the canonical TypeRecord bootstrap record (§4.1). Its identity
 * hash is TYPE_RECORD_HASH and is an invariant of the v1 spec.
 */
export function buildTypeRecordBootstrap(): GroveRecord {
  const payload = typeRecordPayload('TypeRecord', 'A record that describes the schema of another record type.', [
    {
      name: 'name',
      kind: 'string',
      elementKind: null,
      required: true,
      description: 'Human-readable type name.',
    },
    {
      name: 'description',
      kind: 'string',
      elementKind: null,
      required: true,
      description: 'Free-form description of what records of this type mean.',
    },
    {
      name: 'fields',
      kind: 'array',
      elementKind: 'map',
      required: true,
      description: 'Ordered list of field definitions.',
    },
  ]);
  return {
    version: GROVE_VERSION,
    typeHash: BOOTSTRAP_TYPE_HASH,
    payload,
    provenance: BOOTSTRAP_PROVENANCE,
  };
}

/**
 * Build the canonical NamespaceRecord bootstrap (§4.2).
 */
export function buildNamespaceRecordBootstrap(): GroveRecord {
  const payload = typeRecordPayload('NamespaceRecord', 'A mapping from human-readable names to record hashes.', [
    {
      name: 'bindings',
      kind: 'map',
      elementKind: null,
      required: true,
      description: 'Map of string name → hashref to the bound record.',
    },
    {
      name: 'previous',
      kind: 'hashref',
      elementKind: null,
      required: false,
      description: 'Hashref to the prior NamespaceRecord in the mutation chain.',
    },
  ]);
  return {
    version: GROVE_VERSION,
    typeHash: BOOTSTRAP_TYPE_HASH,
    payload,
    provenance: BOOTSTRAP_PROVENANCE,
  };
}

/**
 * Build the canonical SignatureRecord bootstrap (§4.3).
 */
export function buildSignatureRecordBootstrap(): GroveRecord {
  const payload = typeRecordPayload('SignatureRecord', 'A cryptographic signature over another record’s hash.', [
    {
      name: 'signed_hash',
      kind: 'hashref',
      elementKind: null,
      required: true,
      description: 'Hashref to the record being signed.',
    },
    {
      name: 'algorithm',
      kind: 'string',
      elementKind: null,
      required: true,
      description: "Signature algorithm identifier, e.g. 'ed25519'.",
    },
    {
      name: 'public_key',
      kind: 'bytes',
      elementKind: null,
      required: true,
      description: "Signer's public key.",
    },
    {
      name: 'signature',
      kind: 'bytes',
      elementKind: null,
      required: true,
      description: "Signature bytes over the signed record's identity hash.",
    },
  ]);
  return {
    version: GROVE_VERSION,
    typeHash: BOOTSTRAP_TYPE_HASH,
    payload,
    provenance: BOOTSTRAP_PROVENANCE,
  };
}

/**
 * The three bootstrap type identity hashes. These are computed once by
 * the reference implementation and will be stable for the lifetime of
 * the v1 format.
 */
export const TYPE_RECORD_HASH: HashRef = hashRecord(buildTypeRecordBootstrap());
export const NAMESPACE_TYPE_HASH: HashRef = hashRecord(buildNamespaceRecordBootstrap());
export const SIGNATURE_TYPE_HASH: HashRef = hashRecord(buildSignatureRecordBootstrap());

// ============================================================================
// Builder ergonomics for user-defined record types
// ============================================================================

/**
 * Build a user record of a given type. Takes care of wiring version,
 * type_hash, and provenance; the caller supplies the payload bytes (which
 * should be computed with `encode()` over the type's schema).
 */
export function buildRecord(
  typeHash: HashRef,
  payload: Uint8Array,
  provenance: Partial<Provenance> = {},
): GroveRecord {
  return {
    version: GROVE_VERSION,
    typeHash,
    payload,
    provenance: {
      createdAtMs: provenance.createdAtMs ?? Date.now(),
      author: provenance.author ?? null,
      parentHashes: provenance.parentHashes ?? [],
      sessionId: provenance.sessionId ?? null,
      toolVersion: provenance.toolVersion ?? 'grove-format/1.0',
      dependencies: provenance.dependencies ?? [],
    },
  };
}
