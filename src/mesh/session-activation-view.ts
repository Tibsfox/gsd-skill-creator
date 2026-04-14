/**
 * SessionLog + ActivationEvent views on the Grove format.
 *
 * Two new record types that extend the Grove substrate to capture the
 * runtime behavior of gsd-skill-creator — sessions the user had and
 * activations skills fired during those sessions. Both are immutable
 * Grove records; both reference other records by hash (skills,
 * prior sessions, parent activations) to form a traversable DAG of
 * "what happened."
 *
 * This is the module that turns the skill codebase from a static
 * library into an audit trail. Over 20-40 years, the ActivationEvent
 * chunks become the most valuable data in the arena: every skill
 * invocation, what it was given, what it produced, and how it chained.
 *
 * # SessionLog
 *
 * One record per session (Claude Code conversation, CLI run, etc.).
 * Captures start/end times, an opaque session identifier, the tool
 * version that was running, and a list of activation event hashes
 * that happened during the session.
 *
 * # ActivationEvent
 *
 * One record per skill firing. Captures the skill hash, the input
 * context (free-form text), the output (free-form text or bytes),
 * a success flag, and optional parent activation (for chained
 * invocations).
 *
 * Both types follow the Grove pattern: a type record describes the
 * fields, a view module serializes/deserializes, and the universal
 * substrate handles storage.
 *
 * @module mesh/session-activation-view
 */

import type { GroveStore } from '../memory/grove-store.js';
import {
  type CanonicalValue,
  type GroveRecord,
  type HashRef,
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
} from '../memory/grove-format.js';

// ============================================================================
// SessionLog type
// ============================================================================

export interface SessionLog {
  /** Opaque session identifier (e.g. Claude Code session UUID). */
  sessionId: string;
  /** Unix ms when the session started. */
  startedAtMs: number;
  /** Unix ms when the session ended. 0 if still active. */
  endedAtMs: number;
  /** Tool version that ran the session (gsd-skill-creator release). */
  toolVersion: string;
  /** Hashrefs to every ActivationEvent that fired during this session. */
  activations: HashRef[];
  /** Free-form summary (optional — may be empty). */
  summary: string;
}

export function buildSessionLogTypeRecord(): GroveRecord {
  const payload = typeRecordPayload(
    'SessionLog',
    'A record of one session — its timespan, tool version, and the activations that fired during it.',
    [
      { name: 'session_id',    kind: 'string', elementKind: null, required: true,
        description: 'Opaque session identifier.' },
      { name: 'started_at_ms', kind: 'uint64', elementKind: null, required: true,
        description: 'Unix ms when the session started.' },
      { name: 'ended_at_ms',   kind: 'uint64', elementKind: null, required: true,
        description: 'Unix ms when the session ended. 0 if still active.' },
      { name: 'tool_version',  kind: 'string', elementKind: null, required: true,
        description: 'Tool version that ran this session.' },
      { name: 'activations',   kind: 'array',  elementKind: 'hashref', required: true,
        description: 'ActivationEvent record hashes that fired during the session.' },
      { name: 'summary',       kind: 'string', elementKind: null, required: true,
        description: 'Human-readable summary. May be empty.' },
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
      toolVersion: 'grove-sessionlog/1.0',
      dependencies: [],
    },
  };
}

export const SESSION_LOG_TYPE_HASH: HashRef = hashRecord(buildSessionLogTypeRecord());

function encodeSessionLog(log: SessionLog): Uint8Array {
  return encode({
    session_id: v.string(log.sessionId),
    started_at_ms: v.uint(log.startedAtMs),
    ended_at_ms: v.uint(log.endedAtMs),
    tool_version: v.string(log.toolVersion),
    activations: log.activations.map((h) => v.hashref(h.algoId, h.hash)),
    summary: v.string(log.summary),
  });
}

function decodeSessionLog(bytes: Uint8Array): SessionLog {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('session-view: payload is not a map');
  }
  const m = value as Record<string, CanonicalValue>;
  return {
    sessionId: unwrapString(m.session_id, 'session_id'),
    startedAtMs: Number(unwrapUint(m.started_at_ms, 'started_at_ms')),
    endedAtMs: Number(unwrapUint(m.ended_at_ms, 'ended_at_ms')),
    toolVersion: unwrapString(m.tool_version, 'tool_version'),
    activations: unwrapHashRefArray(m.activations, 'activations'),
    summary: unwrapString(m.summary, 'summary'),
  };
}

export function buildSessionLogRecord(
  log: SessionLog,
  opts: { author?: string | null; parentHashes?: HashRef[] } = {},
): GroveRecord {
  return buildRecord(SESSION_LOG_TYPE_HASH, encodeSessionLog(log), {
    createdAtMs: log.startedAtMs,
    author: opts.author ?? null,
    sessionId: log.sessionId,
    toolVersion: log.toolVersion,
    parentHashes: opts.parentHashes ?? [],
    dependencies: log.activations,
  });
}

export function parseSessionLogRecord(record: GroveRecord): SessionLog {
  if (!hashRefEquals(record.typeHash, SESSION_LOG_TYPE_HASH)) {
    throw new Error('session-view: record is not a SessionLog');
  }
  return decodeSessionLog(record.payload);
}

// ============================================================================
// ActivationEvent type
// ============================================================================

export interface ActivationEvent {
  /** Hash of the SkillSpec that fired. */
  skillHash: HashRef;
  /** Unix ms when the activation started. */
  firedAtMs: number;
  /** Free-form input context given to the skill. */
  input: string;
  /** Free-form output produced by the skill (text OR base64 bytes). */
  output: string;
  /** True if the activation completed without error. */
  success: boolean;
  /** Hash of the parent activation if this was a sub-invocation, or null. */
  parent: HashRef | null;
  /** Duration in ms (0 if unknown). */
  durationMs: number;
  /** Error message if `success` is false, empty otherwise. */
  error: string;
}

export function buildActivationEventTypeRecord(): GroveRecord {
  const payload = typeRecordPayload(
    'ActivationEvent',
    'A record of a single skill firing — input, output, outcome, and chain context.',
    [
      { name: 'skill_hash',  kind: 'hashref', elementKind: null, required: true,
        description: 'Hashref to the SkillSpec record that fired.' },
      { name: 'fired_at_ms', kind: 'uint64',  elementKind: null, required: true,
        description: 'Unix ms when the activation started.' },
      { name: 'input',       kind: 'string',  elementKind: null, required: true,
        description: 'Free-form input context given to the skill.' },
      { name: 'output',      kind: 'string',  elementKind: null, required: true,
        description: 'Free-form output produced by the skill.' },
      { name: 'success',     kind: 'bool',    elementKind: null, required: true,
        description: 'True if the activation completed without error.' },
      { name: 'parent',      kind: 'hashref', elementKind: null, required: false,
        description: 'Parent activation hashref for sub-invocations, or null.' },
      { name: 'duration_ms', kind: 'uint64',  elementKind: null, required: true,
        description: 'Duration of the activation in ms.' },
      { name: 'error',       kind: 'string',  elementKind: null, required: true,
        description: 'Error message if success=false.' },
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
      toolVersion: 'grove-activation/1.0',
      dependencies: [],
    },
  };
}

export const ACTIVATION_EVENT_TYPE_HASH: HashRef = hashRecord(buildActivationEventTypeRecord());

function encodeActivationEvent(event: ActivationEvent): Uint8Array {
  return encode({
    skill_hash: v.hashref(event.skillHash.algoId, event.skillHash.hash),
    fired_at_ms: v.uint(event.firedAtMs),
    input: v.string(event.input),
    output: v.string(event.output),
    success: event.success,
    parent: event.parent === null ? v.null() : v.hashref(event.parent.algoId, event.parent.hash),
    duration_ms: v.uint(event.durationMs),
    error: v.string(event.error),
  });
}

function decodeActivationEvent(bytes: Uint8Array): ActivationEvent {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('activation-view: payload is not a map');
  }
  const m = value as Record<string, CanonicalValue>;
  const parentRaw = m.parent;
  let parent: HashRef | null = null;
  if (parentRaw === null) {
    parent = null;
  } else if (
    parentRaw &&
    typeof parentRaw === 'object' &&
    !Array.isArray(parentRaw) &&
    'kind' in parentRaw &&
    parentRaw.kind === 'hashref'
  ) {
    parent = parentRaw.value;
  }
  const successRaw = m.success;
  if (typeof successRaw !== 'boolean') {
    throw new Error('activation-view: expected boolean at success');
  }
  return {
    skillHash: unwrapHashRef(m.skill_hash, 'skill_hash'),
    firedAtMs: Number(unwrapUint(m.fired_at_ms, 'fired_at_ms')),
    input: unwrapString(m.input, 'input'),
    output: unwrapString(m.output, 'output'),
    success: successRaw,
    parent,
    durationMs: Number(unwrapUint(m.duration_ms, 'duration_ms')),
    error: unwrapString(m.error, 'error'),
  };
}

export function buildActivationEventRecord(
  event: ActivationEvent,
  opts: { author?: string | null; sessionId?: string | null } = {},
): GroveRecord {
  const deps: HashRef[] = [event.skillHash];
  if (event.parent) deps.push(event.parent);
  return buildRecord(ACTIVATION_EVENT_TYPE_HASH, encodeActivationEvent(event), {
    createdAtMs: event.firedAtMs,
    author: opts.author ?? null,
    sessionId: opts.sessionId ?? null,
    toolVersion: 'grove-activation/1.0',
    parentHashes: event.parent ? [event.parent] : [],
    dependencies: deps,
  });
}

export function parseActivationEventRecord(record: GroveRecord): ActivationEvent {
  if (!hashRefEquals(record.typeHash, ACTIVATION_EVENT_TYPE_HASH)) {
    throw new Error('activation-view: record is not an ActivationEvent');
  }
  return decodeActivationEvent(record.payload);
}

// ============================================================================
// Storage helpers
// ============================================================================

/**
 * High-level helper for writing SessionLog and ActivationEvent records
 * to a ContentAddressedStore and querying them back.
 */
export class ActivityLog {
  constructor(private readonly cas: GroveStore) {}

  /** Store an ActivationEvent and return its identity hash. */
  async recordActivation(event: ActivationEvent, opts: { author?: string | null; sessionId?: string | null } = {}): Promise<HashRef> {
    const record = buildActivationEventRecord(event, opts);
    const hash = hashRecord(record);
    await this.cas.put(hash.hash, encodeRecord(record));
    return hash;
  }

  /** Store a SessionLog and return its identity hash. */
  async recordSession(log: SessionLog, opts: { author?: string | null; parentHashes?: HashRef[] } = {}): Promise<HashRef> {
    const record = buildSessionLogRecord(log, opts);
    const hash = hashRecord(record);
    await this.cas.put(hash.hash, encodeRecord(record));
    return hash;
  }

  /** Fetch and parse an ActivationEvent by its identity hash. */
  async getActivation(hash: HashRef): Promise<ActivationEvent | null> {
    const bytes = await this.cas.getByHash(hash.hash);
    if (!bytes) return null;
    const record = decodeRecord(bytes);
    if (!hashRefEquals(record.typeHash, ACTIVATION_EVENT_TYPE_HASH)) return null;
    return parseActivationEventRecord(record);
  }

  /** Fetch and parse a SessionLog by its identity hash. */
  async getSession(hash: HashRef): Promise<SessionLog | null> {
    const bytes = await this.cas.getByHash(hash.hash);
    if (!bytes) return null;
    const record = decodeRecord(bytes);
    if (!hashRefEquals(record.typeHash, SESSION_LOG_TYPE_HASH)) return null;
    return parseSessionLogRecord(record);
  }

  /**
   * Find every ActivationEvent that fired for a given skill hash. Walks
   * every chunk — O(N) in total store size. Fine for typical workloads.
   */
  async findActivationsOfSkill(skillHash: HashRef): Promise<Array<{ hash: HashRef; event: ActivationEvent }>> {
    const hits: Array<{ hash: HashRef; event: ActivationEvent }> = [];
    const hexes = await this.cas.listHashes();
    for (const hex of hexes) {
      const bytes = await this.cas.getByHash(hex);
      if (!bytes) continue;
      let record: GroveRecord;
      try {
        record = decodeRecord(bytes);
      } catch {
        continue;
      }
      if (!hashRefEquals(record.typeHash, ACTIVATION_EVENT_TYPE_HASH)) continue;
      let event: ActivationEvent;
      try {
        event = parseActivationEventRecord(record);
      } catch {
        continue;
      }
      if (!hashRefEquals(event.skillHash, skillHash)) continue;
      hits.push({
        hash: { algoId: HASH_ALGO.SHA_256, hash: hexToBytes(hex) },
        event,
      });
    }
    return hits;
  }
}

// ─── Unwrappers ─────────────────────────────────────────────────────────────

function unwrapString(v: CanonicalValue | undefined, ctx: string): string {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'string') {
    return v.value;
  }
  throw new Error(`session-view: expected string at ${ctx}`);
}
function unwrapUint(v: CanonicalValue | undefined, ctx: string): bigint {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'uint64') {
    return v.value;
  }
  throw new Error(`session-view: expected uint64 at ${ctx}`);
}
function unwrapHashRef(v: CanonicalValue | undefined, ctx: string): HashRef {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'hashref') {
    return v.value;
  }
  throw new Error(`session-view: expected hashref at ${ctx}`);
}
function unwrapHashRefArray(v: CanonicalValue | undefined, ctx: string): HashRef[] {
  if (!Array.isArray(v)) throw new Error(`session-view: expected array at ${ctx}`);
  return v.map((e, i) => unwrapHashRef(e, `${ctx}[${i}]`));
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
