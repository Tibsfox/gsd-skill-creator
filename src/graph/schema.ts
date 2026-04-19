/**
 * M1 Semantic Memory Graph — schema projection layer.
 *
 * Thin NEW-LAYER wrapper over `src/memory/grove-format.ts`. Defines the
 * canonical shape an M1 ingester produces (typed entity/edge records that
 * conform to the shared `Entity`/`Edge` types from `src/types/memory.ts`)
 * and offers projection helpers to/from Grove canonical values. The Grove
 * record format itself is not modified; this file treats it as a substrate.
 *
 * See `docs/grove-rearch/inventory.md` — M1 posture is EXTEND-by-default,
 * implemented via NEW-LAYER files in `src/graph/`. grove-format.ts is
 * untouched; CF-M1-05 requires its existing tests to stay green.
 *
 * @module graph/schema
 */
import type { Entity, Edge, EntityKind } from '../types/memory.js';
import {
  encode,
  decode,
  v,
  hashBytes,
  HASH_ALGO,
  type CanonicalValue,
} from '../memory/grove-format.js';

// ─── Entity / Edge kind vocabulary ──────────────────────────────────────────

/** All EntityKind values the M1 ingester may produce. */
export const ENTITY_KINDS: readonly EntityKind[] = [
  'skill',
  'command',
  'file',
  'session',
  'decision',
  'outcome',
] as const;

/**
 * Edge relation predicates used by the M1 ingester. See base-mission §2.2.
 * The set is closed; ingest.ts picks from this list so query patterns can
 * assume a small stable vocabulary.
 */
export const EDGE_RELATIONS = {
  ACTIVATED_IN: 'activated-in', // skill   → session
  TOUCHED: 'touched', //          command → file
  CO_FIRED: 'co-fired', //        skill   → skill
  USED_BY: 'used-by', //          skill   → command
  RAN_IN: 'ran-in', //            command → session
  OPENED: 'opened', //            file    → session
  PRECEDED: 'preceded', //        decision → decision
  IMPACTED_BY: 'impacted-by', //  outcome → decision
  YIELDED: 'yielded', //          session → outcome
} as const;

export type EdgeRelation = (typeof EDGE_RELATIONS)[keyof typeof EDGE_RELATIONS];

// ─── Canonical ID derivation ────────────────────────────────────────────────

// Entity-id cache. Keyed by `${kind}\u0001${key}`; populated lazily.
// Ingest produces ~5 entity-id calls per observation, 80-95% of which hit
// previously-computed ids. A cache eliminates the hot path.
const _entityIdCache = new Map<string, string>();
const _edgeIdCache = new Map<string, string>();

/**
 * Deterministic entity id from (kind, natural-key). Using SHA-256 over a
 * canonical-encoded (kind, key) pair means two ingesters run against the
 * same observation set produce identical entity ids, and Grove dedup works
 * end-to-end. We return the hex digest truncated to 16 chars (64 bits of
 * entropy — collision probability negligible at 1e4 entities).
 *
 * Cached by (kind, key) — repeat calls return the memoized id without
 * re-encoding or re-hashing.
 */
export function entityId(kind: EntityKind, key: string): string {
  const cacheKey = `${kind}\u0001${key}`;
  const cached = _entityIdCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const payload: CanonicalValue = {
    kind: v.string(kind),
    key: v.string(key),
  };
  const bytes = encode(payload);
  const hash = hashBytes(bytes, HASH_ALGO.SHA_256);
  const id = `${kind}:${toHex(hash.slice(0, 8))}`;
  _entityIdCache.set(cacheKey, id);
  return id;
}

/** Deterministic edge id from (src, relation, dst). Cached. */
export function edgeId(src: string, relation: string, dst: string): string {
  const cacheKey = `${src}\u0001${relation}\u0001${dst}`;
  const cached = _edgeIdCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const payload: CanonicalValue = {
    src: v.string(src),
    relation: v.string(relation),
    dst: v.string(dst),
  };
  const bytes = encode(payload);
  const hash = hashBytes(bytes, HASH_ALGO.SHA_256);
  const id = toHex(hash.slice(0, 12));
  _edgeIdCache.set(cacheKey, id);
  return id;
}

/**
 * Clear the internal id caches. Mostly for tests that want to measure
 * cold-start ingest cost.
 */
export function _clearIdCaches(): void {
  _entityIdCache.clear();
  _edgeIdCache.clear();
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

// ─── Projection to/from Grove canonical values ──────────────────────────────

/**
 * Encode an Entity to a Grove canonical-value map (not yet wrapped in a
 * record envelope). Callers wrap this in a Grove record envelope only when
 * they persist; the projection layer itself is storage-agnostic.
 */
export function entityToCanonical(e: Entity): CanonicalValue {
  return {
    id: v.string(e.id),
    kind: v.string(e.kind),
    attrs: v.string(JSON.stringify(e.attrs)),
  };
}

/**
 * Decode a Grove canonical-value map into an Entity. Round-trips with
 * entityToCanonical; see schema.test.ts for the round-trip assertion.
 */
export function canonicalToEntity(value: CanonicalValue): Entity {
  if (!isMap(value)) throw new Error('graph/schema: entity value is not a map');
  const id = asString(value.id, 'entity.id');
  const kind = asString(value.kind, 'entity.kind') as EntityKind;
  if (!ENTITY_KINDS.includes(kind)) {
    throw new Error(`graph/schema: unknown entity kind '${kind}'`);
  }
  const attrsJson = asString(value.attrs, 'entity.attrs');
  const attrs = JSON.parse(attrsJson) as Record<string, unknown>;
  return { id, kind, attrs };
}

export function edgeToCanonical(e: Edge): CanonicalValue {
  return {
    src: v.string(e.src),
    dst: v.string(e.dst),
    relation: v.string(e.relation),
    weight: v.string(e.weight.toString()),
  };
}

export function canonicalToEdge(value: CanonicalValue): Edge {
  if (!isMap(value)) throw new Error('graph/schema: edge value is not a map');
  const src = asString(value.src, 'edge.src');
  const dst = asString(value.dst, 'edge.dst');
  const relation = asString(value.relation, 'edge.relation');
  const weight = parseFloat(asString(value.weight, 'edge.weight'));
  if (!Number.isFinite(weight)) {
    throw new Error(`graph/schema: edge weight is not finite: ${value.weight}`);
  }
  return { src, dst, relation, weight };
}

/** Encode an Entity to the canonical byte stream suitable for a Grove record. */
export function encodeEntity(e: Entity): Uint8Array {
  return encode(entityToCanonical(e));
}

/** Decode an Entity from its canonical byte stream. */
export function decodeEntity(bytes: Uint8Array): Entity {
  const { value } = decode(bytes);
  return canonicalToEntity(value);
}

export function encodeEdge(e: Edge): Uint8Array {
  return encode(edgeToCanonical(e));
}

export function decodeEdge(bytes: Uint8Array): Edge {
  const { value } = decode(bytes);
  return canonicalToEdge(value);
}

// ─── Adapter helpers for callers that hand us raw Grove records ─────────────

/**
 * Loose-typed representation of a Grove record payload after decode. The
 * projection accepts this shape because Grove's canonical-value decoder
 * returns it directly.
 */
export type GroveRecordValue = CanonicalValue;

/**
 * Project a Grove record value onto an Entity. Defers to canonicalToEntity
 * but is named for the public API: "toEntity(groveRecord)".
 */
export function toEntity(groveRecord: GroveRecordValue): Entity {
  return canonicalToEntity(groveRecord);
}

/** Project a Grove record value onto an Edge. */
export function toEdge(groveRecord: GroveRecordValue): Edge {
  return canonicalToEdge(groveRecord);
}

// ─── Local type guards ──────────────────────────────────────────────────────

function isMap(value: CanonicalValue): value is { [key: string]: CanonicalValue } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  // Tagged primitives carry a `kind` string tag drawn from a closed set. Any
  // other object (including one whose keys happen to include "kind") is a
  // map. See grove-format.ts for the same discriminated-union pattern.
  if ('kind' in value) {
    const tag = (value as { kind?: unknown }).kind;
    if (
      tag === 'uint64' ||
      tag === 'int64' ||
      tag === 'bytes' ||
      tag === 'string' ||
      tag === 'hashref'
    ) {
      return false;
    }
  }
  return true;
}

function asString(value: CanonicalValue | undefined, ctx: string): string {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'kind' in value &&
    value.kind === 'string'
  ) {
    return value.value;
  }
  throw new Error(`graph/schema: expected string at ${ctx}`);
}
