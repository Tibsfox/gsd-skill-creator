/**
 * SkillView — the first user-defined record type on top of the Grove
 * format (P4, Layer B).
 *
 * A skill is a content-addressed Grove record whose payload conforms to
 * the SkillSpec type. The SkillSpec type itself is defined as a
 * TypeRecord (which references the bootstrap TypeRecord type), so the
 * full chain looks like this:
 *
 *   bootstrap TypeRecord
 *        ↑ (typeHash)
 *   SkillSpec TypeRecord
 *        ↑ (typeHash)
 *   skill record A           skill record B           skill record C
 *
 * Mutations are append-only:
 *   - A new version of skill A is a new record with A's hash in
 *     `parentHashes` provenance
 *   - A name binding is a separate NamespaceRecord chain (not modeled
 *     here yet — that's the SkillCodebase wrapper)
 *
 * This file is the typed facade. It knows how to serialize and
 * deserialize SkillSpec payloads, and how to wire them into Grove
 * records with proper provenance. It DOES NOT own storage —
 * persistence is the caller's job (typically a ContentAddressedStore
 * or anything else that can hold opaque bytes by hash).
 *
 * @module mesh/skill-view
 */

import {
  type GroveRecord,
  type HashRef,
  type Provenance,
  GROVE_VERSION,
  HASH_ALGO,
  buildRecord,
  decode,
  decodeRecord,
  encode,
  encodeRecord,
  hashRecord,
  hashRefEquals,
  typeRecordPayload,
  v,
  TYPE_RECORD_HASH,
  BOOTSTRAP_TYPE_HASH,
} from '../memory/grove-format.js';

// ─── SkillSpec type ─────────────────────────────────────────────────────────

/**
 * The shape of a skill record's payload. This is the user-facing type;
 * it gets serialized to canonical bytes via `encodeSkillSpec` and
 * embedded into a GroveRecord whose `typeHash` is `SKILL_SPEC_TYPE_HASH`.
 *
 * Identity of a skill record:
 *   - Two skills with byte-identical SkillSpec payloads AND identical
 *     provenance produce identical record hashes.
 *   - Changing ANY field (including in provenance) creates a new hash.
 *   - Renaming the human-readable name does not change identity (the
 *     name is part of the spec, but bindings are external).
 */
export interface SkillSpec {
  /** Display name (e.g. "vision-to-mission"). Part of the identity. */
  name: string;
  /** One-line description for activation. */
  description: string;
  /** Full SKILL.md body. */
  body: string;
  /** Free-form activation patterns the skill responds to. */
  activationPatterns: string[];
  /**
   * Hashes of other skill records this skill depends on. Stored as
   * Grove HashRefs so they're traversable as graph edges.
   */
  dependencies: HashRef[];
}

/**
 * The TypeRecord that describes SkillSpec. This is itself a Grove
 * record whose `typeHash` is the bootstrap TypeRecord hash. Its
 * identity hash (computed once below) is `SKILL_SPEC_TYPE_HASH`.
 *
 * Building this is the moment SkillSpec becomes a first-class type
 * in the Grove format — a reader that has never seen SkillSpec before
 * can fetch this TypeRecord, decode the field list, and interpret
 * skill record payloads.
 */
export function buildSkillSpecTypeRecord(): GroveRecord {
  const payload = typeRecordPayload(
    'SkillSpec',
    'A reusable, content-addressed skill instruction set with declared dependencies.',
    [
      {
        name: 'name',
        kind: 'string',
        elementKind: null,
        required: true,
        description: 'Display name of the skill (e.g. "vision-to-mission").',
      },
      {
        name: 'description',
        kind: 'string',
        elementKind: null,
        required: true,
        description: 'One-line activation hint shown to the router.',
      },
      {
        name: 'body',
        kind: 'string',
        elementKind: null,
        required: true,
        description: 'Full markdown body of the skill (the SKILL.md content).',
      },
      {
        name: 'activation_patterns',
        kind: 'array',
        elementKind: 'string',
        required: true,
        description: 'Phrases or context signals that suggest this skill should fire.',
      },
      {
        name: 'dependencies',
        kind: 'array',
        elementKind: 'hashref',
        required: true,
        description: 'Hashrefs to other skill records this skill depends on.',
      },
    ],
  );
  return {
    version: GROVE_VERSION,
    typeHash: TYPE_RECORD_HASH,
    payload,
    provenance: {
      createdAtMs: 0,
      author: null,
      parentHashes: [],
      sessionId: null,
      toolVersion: 'grove-skillview/1.0',
      dependencies: [],
    },
  };
}

/**
 * The identity hash of the SkillSpec TypeRecord. This is the value that
 * goes into the `typeHash` field of every skill record.
 *
 * Note: even though we recompute this at module load, the bytes are
 * fully deterministic — every conforming Grove implementation will
 * produce the same hash here. This module-load value is the canonical
 * SKILL_SPEC_TYPE_HASH.
 */
export const SKILL_SPEC_TYPE_HASH: HashRef = hashRecord(buildSkillSpecTypeRecord());

// ─── Encoding / decoding ────────────────────────────────────────────────────

/**
 * Encode a `SkillSpec` to canonical bytes for embedding in a Grove
 * record's `payload` field.
 */
export function encodeSkillSpec(spec: SkillSpec): Uint8Array {
  return encode({
    name: v.string(spec.name),
    description: v.string(spec.description),
    body: v.string(spec.body),
    activation_patterns: spec.activationPatterns.map((p) => v.string(p)),
    dependencies: spec.dependencies.map((h) => v.hashref(h.algoId, h.hash)),
  });
}

/**
 * Decode a canonical-encoded `SkillSpec` from bytes. Throws if the
 * payload doesn't match the SkillSpec shape.
 */
export function decodeSkillSpec(bytes: Uint8Array): SkillSpec {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('SkillView: payload is not a map');
  }
  const map = value as Record<string, unknown>;

  const name = unwrapString(map.name, 'name');
  const description = unwrapString(map.description, 'description');
  const body = unwrapString(map.body, 'body');
  const activationPatterns = unwrapStringArray(map.activation_patterns, 'activation_patterns');
  const dependencies = unwrapHashRefArray(map.dependencies, 'dependencies');

  return { name, description, body, activationPatterns, dependencies };
}

function unwrapString(value: unknown, ctx: string): string {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'kind' in value &&
    (value as { kind: string }).kind === 'string'
  ) {
    return (value as { kind: 'string'; value: string }).value;
  }
  throw new Error(`SkillView: expected string at ${ctx}`);
}

function unwrapStringArray(value: unknown, ctx: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`SkillView: expected array at ${ctx}`);
  }
  return value.map((elem, i) => unwrapString(elem, `${ctx}[${i}]`));
}

function unwrapHashRefArray(value: unknown, ctx: string): HashRef[] {
  if (!Array.isArray(value)) {
    throw new Error(`SkillView: expected array at ${ctx}`);
  }
  return value.map((elem, i) => {
    if (
      elem &&
      typeof elem === 'object' &&
      !Array.isArray(elem) &&
      'kind' in elem &&
      (elem as { kind: string }).kind === 'hashref'
    ) {
      return (elem as { kind: 'hashref'; value: HashRef }).value;
    }
    throw new Error(`SkillView: expected hashref at ${ctx}[${i}]`);
  });
}

// ─── Record construction ────────────────────────────────────────────────────

/**
 * Options for building a skill record.
 */
export interface BuildSkillOptions {
  /** Author identifier (username, key fingerprint, etc.). */
  author?: string | null;
  /** Session/context identifier. */
  sessionId?: string | null;
  /** Software version that wrote this record. */
  toolVersion?: string;
  /** Records this skill was derived from (e.g. prior versions of itself). */
  parentHashes?: HashRef[];
  /** Override created_at_ms for tests / replay scenarios. */
  createdAtMs?: number;
}

/**
 * Wrap a SkillSpec in a Grove record with proper typeHash and
 * provenance. The record's identity hash is computed via
 * `recordHashOf()` separately.
 *
 * Dependencies declared in the SkillSpec are also copied into the
 * record's provenance `dependencies` array — that mirrors them at
 * the format level so generic graph walks can find them without
 * decoding the payload.
 */
export function buildSkillRecord(spec: SkillSpec, opts: BuildSkillOptions = {}): GroveRecord {
  return buildRecord(SKILL_SPEC_TYPE_HASH, encodeSkillSpec(spec), {
    createdAtMs: opts.createdAtMs ?? Date.now(),
    author: opts.author ?? null,
    parentHashes: opts.parentHashes ?? [],
    sessionId: opts.sessionId ?? null,
    toolVersion: opts.toolVersion ?? 'grove-skillview/1.0',
    dependencies: spec.dependencies.slice(),
  });
}

/**
 * Compute the identity hash of a skill record. Convenience wrapper
 * around `hashRecord` that defaults to SHA-256.
 */
export function recordHashOf(record: GroveRecord, algoId: number = HASH_ALGO.SHA_256): HashRef {
  return hashRecord(record, algoId);
}

/**
 * Parse a Grove record back into a `SkillSpec`. Throws if the record's
 * `typeHash` doesn't match `SKILL_SPEC_TYPE_HASH` — i.e. it's not a
 * skill record.
 */
export function parseSkillRecord(record: GroveRecord): SkillSpec {
  if (!hashRefEquals(record.typeHash, SKILL_SPEC_TYPE_HASH)) {
    throw new Error('SkillView: record type_hash is not SKILL_SPEC_TYPE_HASH');
  }
  return decodeSkillSpec(record.payload);
}

/**
 * Decode a serialized Grove record (raw bytes) into a SkillSpec.
 * Convenience wrapper around `decodeRecord` + `parseSkillRecord`.
 */
export function parseSkillRecordBytes(bytes: Uint8Array): { spec: SkillSpec; record: GroveRecord } {
  const record = decodeRecord(bytes);
  const spec = parseSkillRecord(record);
  return { spec, record };
}

// ─── Export helper ──────────────────────────────────────────────────────────

/**
 * Serialize a skill record to canonical Grove bytes. The result is
 * suitable for storage in a ContentAddressedStore, transport in an
 * export tarball, or any other byte-oriented sink.
 */
export function serializeSkillRecord(record: GroveRecord): Uint8Array {
  return encodeRecord(record);
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export {
  HASH_ALGO,
  TYPE_RECORD_HASH,
  BOOTSTRAP_TYPE_HASH,
  type HashRef,
  type GroveRecord,
  type Provenance,
};
