/**
 * M1 Semantic Memory Graph — observation ingester.
 *
 * Reads session-observation JSONL (default `.planning/patterns/sessions.jsonl`,
 * but M1's primary fixture is `tests/fixtures/sensemaking-200.jsonl`) and
 * emits Entity/Edge records derived from co-occurrence in each session.
 * Deduplication is by content-address — same (kind, key) → same id — so
 * repeated observations of the same skill across sessions produce exactly
 * one entity. Edge weights accumulate across observations.
 *
 * The observation shape expected on each JSONL line:
 *
 *   { ts: number, skill: string, command: string, file: string,
 *     sessionId: string, outcome: string }
 *
 * Any line that fails to parse is skipped with a counter increment; a line
 * with missing required fields is likewise skipped. This matches the
 * "best-effort structural ingest" posture the component spec calls for.
 *
 * @module graph/ingest
 */
import { readFile } from 'node:fs/promises';
import type { Entity, Edge } from '../types/memory.js';
import { entityId, EDGE_RELATIONS } from './schema.js';

/**
 * Fast path for dedup: use a simple string key `src\u0001rel\u0001dst` for
 * the edge map. The canonical content-addressed `edgeId()` from schema.ts is
 * still available to callers who need it, but for hot-path ingest a simple
 * unique key is sufficient and avoids per-edge SHA-256 hashing.
 */
function edgeKey(src: string, relation: string, dst: string): string {
  return `${src}\u0001${relation}\u0001${dst}`;
}

// ─── Observation shape ──────────────────────────────────────────────────────

export interface Observation {
  ts: number;
  skill: string;
  command: string;
  file: string;
  sessionId: string;
  outcome: string;
}

/**
 * Partial observation tolerances. All five of (skill, command, file,
 * sessionId, outcome) must be non-empty strings for the line to count;
 * ts is required numeric.
 */
function parseLine(line: string): Observation | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof obj !== 'object' || obj === null) return null;
  const o = obj as Record<string, unknown>;
  const ts = typeof o.ts === 'number' ? o.ts : null;
  const skill = typeof o.skill === 'string' ? o.skill : null;
  const command = typeof o.command === 'string' ? o.command : null;
  const file = typeof o.file === 'string' ? o.file : null;
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId : null;
  const outcome = typeof o.outcome === 'string' ? o.outcome : null;
  if (
    ts === null ||
    !skill ||
    !command ||
    !file ||
    !sessionId ||
    !outcome
  ) {
    return null;
  }
  return { ts, skill, command, file, sessionId, outcome };
}

// ─── Core ingest result ─────────────────────────────────────────────────────

export interface Graph {
  entities: Map<string, Entity>;
  edges: Map<string, Edge>;
  /** Adjacency: entity id → Set of neighbor entity ids (undirected). */
  adjacency: Map<string, Set<string>>;
  /** Parsed observation count. */
  observationCount: number;
  /** Lines skipped due to parse failure or missing fields. */
  skippedCount: number;
}

// ─── Public ingest API ──────────────────────────────────────────────────────

/** Ingest observations from a JSONL file. */
export async function ingestFile(path: string): Promise<Graph> {
  const text = await readFile(path, 'utf-8');
  return ingestText(text);
}

/** Ingest observations from an in-memory string. */
export function ingestText(text: string): Graph {
  const lines = text.split('\n');
  const observations: Observation[] = [];
  let skipped = 0;
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed === null) {
      // Blank lines at end of file are not skipped.
      if (line.trim().length > 0) skipped++;
      continue;
    }
    observations.push(parsed);
  }
  return ingestObservations(observations, skipped);
}

/**
 * Core ingester. Given a flat array of observations, emit the deduplicated
 * entity set, edge set with accumulated weights, and adjacency index.
 */
export function ingestObservations(
  observations: Observation[],
  skipped = 0,
): Graph {
  const entities = new Map<string, Entity>();
  const edges = new Map<string, Edge>();
  const adjacency = new Map<string, Set<string>>();

  // Track co-fire pairs within each session for later co-fire edge emission.
  const sessionSkills = new Map<string, Set<string>>();

  const upsertEntity = (id: string, build: () => Entity): void => {
    if (!entities.has(id)) {
      entities.set(id, build());
      adjacency.set(id, new Set());
    }
  };

  const addEdge = (src: string, dst: string, relation: string, weight = 1): void => {
    const key = edgeKey(src, relation, dst);
    const existing = edges.get(key);
    if (existing) {
      existing.weight += weight;
    } else {
      edges.set(key, { src, dst, relation, weight });
    }
    // Undirected adjacency — sufficient for Leiden and neighbor queries.
    adjacency.get(src)?.add(dst);
    adjacency.get(dst)?.add(src);
  };

  for (const obs of observations) {
    const skillIdVal = entityId('skill', obs.skill);
    const commandIdVal = entityId('command', obs.command);
    const fileIdVal = entityId('file', obs.file);
    const sessionIdVal = entityId('session', obs.sessionId);
    const outcomeIdVal = entityId('outcome', obs.outcome);

    upsertEntity(skillIdVal, () => ({
      id: skillIdVal,
      kind: 'skill',
      attrs: { name: obs.skill },
    }));
    upsertEntity(commandIdVal, () => ({
      id: commandIdVal,
      kind: 'command',
      attrs: { name: obs.command },
    }));
    upsertEntity(fileIdVal, () => ({
      id: fileIdVal,
      kind: 'file',
      attrs: { path: obs.file },
    }));
    upsertEntity(sessionIdVal, () => ({
      id: sessionIdVal,
      kind: 'session',
      attrs: { sessionId: obs.sessionId, firstTs: obs.ts, lastTs: obs.ts },
    }));
    upsertEntity(outcomeIdVal, () => ({
      id: outcomeIdVal,
      kind: 'outcome',
      attrs: { label: obs.outcome },
    }));

    // Update session temporal bounds.
    const sessEntity = entities.get(sessionIdVal);
    if (sessEntity) {
      const attrs = sessEntity.attrs as Record<string, number>;
      if (typeof attrs.firstTs === 'number' && obs.ts < attrs.firstTs) {
        attrs.firstTs = obs.ts;
      }
      if (typeof attrs.lastTs === 'number' && obs.ts > attrs.lastTs) {
        attrs.lastTs = obs.ts;
      }
    }

    // Core edges per observation — weight 1, accumulated on repeat.
    addEdge(skillIdVal, sessionIdVal, EDGE_RELATIONS.ACTIVATED_IN);
    addEdge(commandIdVal, fileIdVal, EDGE_RELATIONS.TOUCHED);
    addEdge(skillIdVal, commandIdVal, EDGE_RELATIONS.USED_BY);
    addEdge(commandIdVal, sessionIdVal, EDGE_RELATIONS.RAN_IN);
    addEdge(fileIdVal, sessionIdVal, EDGE_RELATIONS.OPENED);
    addEdge(sessionIdVal, outcomeIdVal, EDGE_RELATIONS.YIELDED);

    // Track skills in this session for co-fire edge emission.
    let skills = sessionSkills.get(obs.sessionId);
    if (!skills) {
      skills = new Set();
      sessionSkills.set(obs.sessionId, skills);
    }
    skills.add(skillIdVal);
  }

  // Emit co-fire edges between distinct skills in the same session.
  for (const skills of sessionSkills.values()) {
    const arr = Array.from(skills);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        // Canonical direction (lex order) — so (A,B) and (B,A) dedup.
        const a = arr[i] < arr[j] ? arr[i] : arr[j];
        const b = arr[i] < arr[j] ? arr[j] : arr[i];
        addEdge(a, b, EDGE_RELATIONS.CO_FIRED);
      }
    }
  }

  return {
    entities,
    edges,
    adjacency,
    observationCount: observations.length,
    skippedCount: skipped,
  };
}

// ─── Helpers for tests and queries ──────────────────────────────────────────

/** Return all entities of a given kind. */
export function entitiesByKind(graph: Graph, kind: Entity['kind']): Entity[] {
  const out: Entity[] = [];
  for (const e of graph.entities.values()) {
    if (e.kind === kind) out.push(e);
  }
  return out;
}

/** Return all edges by relation. */
export function edgesByRelation(graph: Graph, relation: string): Edge[] {
  const out: Edge[] = [];
  for (const e of graph.edges.values()) {
    if (e.relation === relation) out.push(e);
  }
  return out;
}
