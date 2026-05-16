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

// ─── TypedSkillSpec: typed manifest extension (May 2026 synthesis 2.4) ──────
//
// TypedSkillSpec extends the base SkillSpec with four typed substructures
// vindicated by the May 2026 arxiv synthesis (SkCC `2605.03353v2`, FORTIS
// `2605.09163v2`, CTA `2605.11946v1`). The base SkillSpec remains a valid
// record type under SKILL_SPEC_TYPE_HASH; TypedSkillSpec gets its own
// identity (TYPED_SKILL_SPEC_TYPE_HASH) so existing skill records keep
// working unchanged and new records opt into the typed manifest explicitly.

/** Compilation targets the skill IR can be rendered to. */
export type CompilationTarget = 'claude-code' | 'codex' | 'kimi' | 'cursor';

/**
 * Declared capability surface for a skill. Enforced at selection time
 * (refuse to load a skill that requests undeclared capabilities) and at
 * execution time (refuse to dispatch a tool call outside the declared
 * surface). See FORTIS `2605.09163v2`.
 */
export interface SkillCapabilities {
  /** Tool names this skill is allowed to call. */
  tools: string[];
  /** Filesystem paths or globs this skill is allowed to read. */
  reads: string[];
  /** Filesystem paths or globs this skill is allowed to write. */
  writes: string[];
  /** Whether the skill may make outbound network requests. */
  network: boolean;
  /** Whether the skill may spawn subprocesses. */
  exec: boolean;
  /** Names of secrets / env-vars the skill may access. */
  secrets: string[];
}

/**
 * Manifest-level dependency declaration. Distinct from the existing
 * `dependencies: HashRef[]` field on SkillSpec, which records
 * content-addressed parent records. Manifest dependencies describe what
 * the skill USES at runtime — tools and other skills — and the required
 * activation order relative to them. See SkCC `2605.03353v2`.
 */
export interface ManifestDependencies {
  /** Tool names the skill depends on at runtime. */
  tools: string[];
  /** Other skill names the skill loads, delegates to, or requires. */
  skills: string[];
  /** Required activation order relative to listed skills. */
  order: 'before' | 'after' | 'any';
  /**
   * Optional content-addressed dependency-graph snapshot. Lets a skill
   * pin the exact dependency closure it was authored against.
   */
  graph: HashRef | null;
}

/**
 * Behavioural-audit fingerprint from the most recent paired-trace audit.
 * See CTA `2605.11946v1`. The SIP distribution is over the five categories
 * `surface-anchoring`, `template-copy`, `excess-planning`, `task-recovery`,
 * `off-task-artifact`; values should sum to roughly 1.0 over a probe bank.
 */
export interface BehaviouralAudit {
  /** SIP distribution (string→[0,1]) over the five SIP categories. */
  sipDistribution: Record<string, number>;
  /** Unix milliseconds of the last audit run. 0 = never audited. */
  lastAuditedMs: number;
  /** Lifecycle bucket the audit baseline applies to. */
  baselineBucket: 'pre-ship' | 'shipped' | 'mature' | 'retired';
}

/**
 * The typed-manifest skill spec. Strict superset of SkillSpec at the
 * runtime-data level (it carries every base field), but encoded as a
 * separate type record with a distinct identity hash. New skills opt in
 * by writing a TypedSkillSpec record; old SkillSpec records continue to
 * be valid Grove records under SKILL_SPEC_TYPE_HASH.
 */
export interface TypedSkillSpec extends SkillSpec {
  /** Declared capability boundary. */
  capabilities: SkillCapabilities;
  /** Runtime dependency manifest (distinct from content-addressed parents). */
  manifestDependencies: ManifestDependencies;
  /** Latest counterfactual-audit fingerprint. */
  behaviouralAudit: BehaviouralAudit;
  /** Compilation targets the IR can be rendered to. */
  compilationTargets: CompilationTarget[];
}

/** TypeRecord describing TypedSkillSpec. Built once at module load. */
export function buildTypedSkillSpecTypeRecord(): GroveRecord {
  const payload = typeRecordPayload(
    'TypedSkillSpec',
    'A skill artifact with a typed manifest: capabilities, dependencies, behavioural audit, and compilation targets.',
    [
      {
        name: 'name',
        kind: 'string',
        elementKind: null,
        required: true,
        description: 'Display name of the skill.',
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
        description: 'Hashrefs to parent skill records this skill is derived from.',
      },
      {
        name: 'capabilities',
        kind: 'map',
        elementKind: null,
        required: true,
        description: 'Declared capability surface (tools, reads, writes, network, exec, secrets).',
      },
      {
        name: 'manifest_dependencies',
        kind: 'map',
        elementKind: null,
        required: true,
        description: 'Runtime dependency manifest: tools, skills, order, optional graph hashref.',
      },
      {
        name: 'behavioural_audit',
        kind: 'map',
        elementKind: null,
        required: true,
        description: 'Latest counterfactual-audit fingerprint (SIP distribution + bucket + timestamp).',
      },
      {
        name: 'compilation_targets',
        kind: 'array',
        elementKind: 'string',
        required: true,
        description: 'Compilation targets the skill IR can be rendered to.',
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
      toolVersion: 'grove-skillview/2.0',
      dependencies: [],
    },
  };
}

/** Identity hash of the TypedSkillSpec TypeRecord. */
export const TYPED_SKILL_SPEC_TYPE_HASH: HashRef = hashRecord(buildTypedSkillSpecTypeRecord());

function encodeCapabilities(c: SkillCapabilities) {
  return {
    exec: c.exec,
    network: c.network,
    reads: c.reads.map((s) => v.string(s)),
    secrets: c.secrets.map((s) => v.string(s)),
    tools: c.tools.map((s) => v.string(s)),
    writes: c.writes.map((s) => v.string(s)),
  };
}

function encodeManifestDependencies(d: ManifestDependencies) {
  return {
    graph: d.graph === null ? v.null() : v.hashref(d.graph.algoId, d.graph.hash),
    order: v.string(d.order),
    skills: d.skills.map((s) => v.string(s)),
    tools: d.tools.map((s) => v.string(s)),
  };
}

function encodeBehaviouralAudit(b: BehaviouralAudit) {
  const sipKeys = Object.keys(b.sipDistribution).sort();
  const sipMap: Record<string, ReturnType<typeof v.string>> = {};
  for (const k of sipKeys) {
    // Quantise to integer parts-per-million so the value is canonical.
    sipMap[k] = v.string(b.sipDistribution[k].toFixed(6));
  }
  return {
    baseline_bucket: v.string(b.baselineBucket),
    last_audited_ms: v.uint(b.lastAuditedMs),
    sip_distribution: sipMap,
  };
}

/** Encode a TypedSkillSpec to canonical bytes for a Grove record payload. */
export function encodeTypedSkillSpec(spec: TypedSkillSpec): Uint8Array {
  return encode({
    activation_patterns: spec.activationPatterns.map((p) => v.string(p)),
    behavioural_audit: encodeBehaviouralAudit(spec.behaviouralAudit),
    body: v.string(spec.body),
    capabilities: encodeCapabilities(spec.capabilities),
    compilation_targets: spec.compilationTargets.map((t) => v.string(t)),
    dependencies: spec.dependencies.map((h) => v.hashref(h.algoId, h.hash)),
    description: v.string(spec.description),
    manifest_dependencies: encodeManifestDependencies(spec.manifestDependencies),
    name: v.string(spec.name),
  });
}

function unwrapMap(value: unknown, ctx: string): Record<string, unknown> {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !('kind' in (value as object))
  ) {
    return value as Record<string, unknown>;
  }
  throw new Error(`TypedSkillSpec: expected map at ${ctx}`);
}

function unwrapBool(value: unknown, ctx: string): boolean {
  if (typeof value === 'boolean') return value;
  throw new Error(`TypedSkillSpec: expected bool at ${ctx}`);
}

function unwrapUint(value: unknown, ctx: string): number {
  if (
    value &&
    typeof value === 'object' &&
    'kind' in (value as object) &&
    (value as { kind: string }).kind === 'uint64'
  ) {
    return Number((value as { value: bigint }).value);
  }
  throw new Error(`TypedSkillSpec: expected uint64 at ${ctx}`);
}

function decodeCapabilities(value: unknown): SkillCapabilities {
  const map = unwrapMap(value, 'capabilities');
  return {
    exec: unwrapBool(map.exec, 'capabilities.exec'),
    network: unwrapBool(map.network, 'capabilities.network'),
    reads: unwrapStringArrayPublic(map.reads, 'capabilities.reads'),
    secrets: unwrapStringArrayPublic(map.secrets, 'capabilities.secrets'),
    tools: unwrapStringArrayPublic(map.tools, 'capabilities.tools'),
    writes: unwrapStringArrayPublic(map.writes, 'capabilities.writes'),
  };
}

function decodeManifestDependencies(value: unknown): ManifestDependencies {
  const map = unwrapMap(value, 'manifest_dependencies');
  const graphRaw = map.graph;
  let graph: HashRef | null = null;
  if (graphRaw !== null) {
    if (
      graphRaw &&
      typeof graphRaw === 'object' &&
      'kind' in (graphRaw as object) &&
      (graphRaw as { kind: string }).kind === 'hashref'
    ) {
      graph = (graphRaw as { kind: 'hashref'; value: HashRef }).value;
    } else {
      throw new Error('TypedSkillSpec: manifest_dependencies.graph is neither null nor hashref');
    }
  }
  const order = unwrapStringPublic(map.order, 'manifest_dependencies.order');
  if (order !== 'before' && order !== 'after' && order !== 'any') {
    throw new Error(`TypedSkillSpec: invalid manifest_dependencies.order: ${order}`);
  }
  return {
    graph,
    order,
    skills: unwrapStringArrayPublic(map.skills, 'manifest_dependencies.skills'),
    tools: unwrapStringArrayPublic(map.tools, 'manifest_dependencies.tools'),
  };
}

function decodeBehaviouralAudit(value: unknown): BehaviouralAudit {
  const map = unwrapMap(value, 'behavioural_audit');
  const bucket = unwrapStringPublic(map.baseline_bucket, 'behavioural_audit.baseline_bucket');
  if (bucket !== 'pre-ship' && bucket !== 'shipped' && bucket !== 'mature' && bucket !== 'retired') {
    throw new Error(`TypedSkillSpec: invalid baseline_bucket: ${bucket}`);
  }
  const sipMap = unwrapMap(map.sip_distribution, 'behavioural_audit.sip_distribution');
  const sipDistribution: Record<string, number> = {};
  for (const [k, raw] of Object.entries(sipMap)) {
    const s = unwrapStringPublic(raw, `behavioural_audit.sip_distribution[${k}]`);
    const n = Number(s);
    if (!Number.isFinite(n)) {
      throw new Error(`TypedSkillSpec: non-numeric SIP value at ${k}: ${s}`);
    }
    sipDistribution[k] = n;
  }
  return {
    baselineBucket: bucket,
    lastAuditedMs: unwrapUint(map.last_audited_ms, 'behavioural_audit.last_audited_ms'),
    sipDistribution,
  };
}

function unwrapStringPublic(value: unknown, ctx: string): string {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'kind' in (value as object) &&
    (value as { kind: string }).kind === 'string'
  ) {
    return (value as { kind: 'string'; value: string }).value;
  }
  throw new Error(`TypedSkillSpec: expected string at ${ctx}`);
}

function unwrapStringArrayPublic(value: unknown, ctx: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`TypedSkillSpec: expected array at ${ctx}`);
  }
  return value.map((elem, i) => unwrapStringPublic(elem, `${ctx}[${i}]`));
}

/** Decode canonical-encoded TypedSkillSpec bytes. */
export function decodeTypedSkillSpec(bytes: Uint8Array): TypedSkillSpec {
  const { value } = decode(bytes);
  const map = unwrapMap(value, 'TypedSkillSpec root');
  const compilationTargetsRaw = unwrapStringArrayPublic(map.compilation_targets, 'compilation_targets');
  const compilationTargets: CompilationTarget[] = compilationTargetsRaw.map((t) => {
    if (t !== 'claude-code' && t !== 'codex' && t !== 'kimi' && t !== 'cursor') {
      throw new Error(`TypedSkillSpec: invalid compilation target: ${t}`);
    }
    return t;
  });
  return {
    name: unwrapStringPublic(map.name, 'name'),
    description: unwrapStringPublic(map.description, 'description'),
    body: unwrapStringPublic(map.body, 'body'),
    activationPatterns: unwrapStringArrayPublic(map.activation_patterns, 'activation_patterns'),
    dependencies: unwrapHashRefArrayPublic(map.dependencies, 'dependencies'),
    capabilities: decodeCapabilities(map.capabilities),
    manifestDependencies: decodeManifestDependencies(map.manifest_dependencies),
    behaviouralAudit: decodeBehaviouralAudit(map.behavioural_audit),
    compilationTargets,
  };
}

function unwrapHashRefArrayPublic(value: unknown, ctx: string): HashRef[] {
  if (!Array.isArray(value)) {
    throw new Error(`TypedSkillSpec: expected array at ${ctx}`);
  }
  return value.map((elem, i) => {
    if (
      elem &&
      typeof elem === 'object' &&
      'kind' in (elem as object) &&
      (elem as { kind: string }).kind === 'hashref'
    ) {
      return (elem as { kind: 'hashref'; value: HashRef }).value;
    }
    throw new Error(`TypedSkillSpec: expected hashref at ${ctx}[${i}]`);
  });
}

/** Build a Grove record wrapping a TypedSkillSpec. */
export function buildTypedSkillRecord(
  spec: TypedSkillSpec,
  opts: BuildSkillOptions = {},
): GroveRecord {
  return buildRecord(TYPED_SKILL_SPEC_TYPE_HASH, encodeTypedSkillSpec(spec), {
    createdAtMs: opts.createdAtMs ?? Date.now(),
    author: opts.author ?? null,
    parentHashes: opts.parentHashes ?? [],
    sessionId: opts.sessionId ?? null,
    toolVersion: opts.toolVersion ?? 'grove-skillview/2.0',
    dependencies: spec.dependencies.slice(),
  });
}

/** Parse a Grove record back into a TypedSkillSpec. */
export function parseTypedSkillRecord(record: GroveRecord): TypedSkillSpec {
  if (!hashRefEquals(record.typeHash, TYPED_SKILL_SPEC_TYPE_HASH)) {
    throw new Error('TypedSkillView: record type_hash is not TYPED_SKILL_SPEC_TYPE_HASH');
  }
  return decodeTypedSkillSpec(record.payload);
}

/**
 * Migrate an existing SkillSpec to a TypedSkillSpec with conservative
 * defaults: empty capability surface, no manifest dependencies, no audit
 * history, every supported compilation target. Callers that know more
 * about the skill should overwrite the relevant fields before persisting.
 */
export function skillSpecToTyped(spec: SkillSpec): TypedSkillSpec {
  return {
    ...spec,
    capabilities: {
      tools: [],
      reads: [],
      writes: [],
      network: false,
      exec: false,
      secrets: [],
    },
    manifestDependencies: {
      tools: [],
      skills: [],
      order: 'any',
      graph: null,
    },
    behaviouralAudit: {
      sipDistribution: {},
      lastAuditedMs: 0,
      baselineBucket: 'pre-ship',
    },
    compilationTargets: ['claude-code', 'codex', 'kimi', 'cursor'],
  };
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
