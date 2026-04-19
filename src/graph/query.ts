/**
 * M1 Semantic Memory Graph — query patterns.
 *
 * Five core query patterns per the component spec:
 *
 *   - coFire(skillA, skillB)             — co-fire weight between two skills
 *   - onFile(fileId)                     — sessions/commands/skills touching a file
 *   - inCommunity(commId)                — members of a community (by id)
 *   - workflowShape(sessionWindow)       — ordered skill sequence inside a window
 *   - refactorArc(timeWindow)            — file→file edges ordered by time window
 *
 * All queries must be sub-100ms on a 1000-entity fixture (CF-M1-04). To meet
 * the budget we precompute indices on construction rather than iterating
 * `edges.values()` per query.
 *
 * @module graph/query
 */
import type { Entity, Edge } from '../types/memory.js';
import type { Graph } from './ingest.js';
import type { CommunitySummary, SummaryCache } from './summaries.js';
import { entityId, EDGE_RELATIONS } from './schema.js';

// ─── Query engine ───────────────────────────────────────────────────────────

export interface QueryEngineOptions {
  summaries?: SummaryCache;
}

export class QueryEngine {
  readonly graph: Graph;
  readonly summaries: SummaryCache | null;

  // Precomputed indices.
  private readonly edgesBySrc = new Map<string, Edge[]>();
  private readonly edgesByDst = new Map<string, Edge[]>();
  private readonly edgesByRelation = new Map<string, Edge[]>();
  private readonly edgesByPair = new Map<string, Edge[]>();

  constructor(graph: Graph, opts: QueryEngineOptions = {}) {
    this.graph = graph;
    this.summaries = opts.summaries ?? null;
    for (const edge of graph.edges.values()) {
      pushMap(this.edgesBySrc, edge.src, edge);
      pushMap(this.edgesByDst, edge.dst, edge);
      pushMap(this.edgesByRelation, edge.relation, edge);
      pushMap(this.edgesByPair, pairKey(edge.src, edge.dst), edge);
      pushMap(this.edgesByPair, pairKey(edge.dst, edge.src), edge);
    }
  }

  // ─── Query 1: coFire ────────────────────────────────────────────────────

  /**
   * Return the accumulated co-fire weight between two skills, plus the
   * underlying edge record if one exists.
   */
  coFire(skillA: string, skillB: string): { weight: number; edge: Edge | null } {
    const idA = entityId('skill', skillA);
    const idB = entityId('skill', skillB);
    const pairKeyA = pairKey(idA, idB);
    const edges = this.edgesByPair.get(pairKeyA) ?? [];
    let weight = 0;
    let edge: Edge | null = null;
    for (const e of edges) {
      if (e.relation !== EDGE_RELATIONS.CO_FIRED) continue;
      weight += e.weight;
      if (edge === null) edge = e;
    }
    return { weight, edge };
  }

  // ─── Query 2: onFile ────────────────────────────────────────────────────

  /**
   * Return entities that touch a file: commands that touched it, sessions
   * that opened it, and skills indirectly connected via those commands.
   * The `file` argument may be either the raw file path or the file entity id.
   */
  onFile(file: string): {
    file: Entity | null;
    commands: Entity[];
    sessions: Entity[];
    skills: Entity[];
  } {
    const fid = file.startsWith('file:') ? file : entityId('file', file);
    const fileEntity = this.graph.entities.get(fid) ?? null;
    const commandIds = new Set<string>();
    const sessionIds = new Set<string>();
    const skillIds = new Set<string>();

    // Edges with file as dst (command touched file) or src (file opened session)
    for (const e of this.edgesByDst.get(fid) ?? []) {
      if (e.relation === EDGE_RELATIONS.TOUCHED) commandIds.add(e.src);
    }
    for (const e of this.edgesBySrc.get(fid) ?? []) {
      if (e.relation === EDGE_RELATIONS.OPENED) sessionIds.add(e.dst);
    }
    // Skills connected via the commands (USED_BY: skill → command)
    for (const cid of commandIds) {
      for (const e of this.edgesByDst.get(cid) ?? []) {
        if (e.relation === EDGE_RELATIONS.USED_BY) skillIds.add(e.src);
      }
    }

    return {
      file: fileEntity,
      commands: resolveEntities(this.graph.entities, commandIds),
      sessions: resolveEntities(this.graph.entities, sessionIds),
      skills: resolveEntities(this.graph.entities, skillIds),
    };
  }

  // ─── Query 3: inCommunity ───────────────────────────────────────────────

  /** Return members + summary for a community id. Requires summaries. */
  inCommunity(communityId: string): {
    summary: CommunitySummary | null;
    members: Entity[];
  } {
    const summary = this.summaries?.byCommunityId.get(communityId) ?? null;
    if (!summary) return { summary: null, members: [] };
    const members = summary.memberIds
      .map((id) => this.graph.entities.get(id))
      .filter((e): e is Entity => e !== undefined);
    return { summary, members };
  }

  // ─── Query 4: workflowShape ─────────────────────────────────────────────

  /**
   * Return the ordered skill activation sequence within a session window.
   * `window` = { sessionId } or { fromTs, toTs }; sessions are filtered
   * accordingly and each session's skill activations are returned in
   * time order.
   */
  workflowShape(window: {
    sessionId?: string;
    fromTs?: number;
    toTs?: number;
  }): Array<{ sessionId: string; skills: string[]; firstTs: number; lastTs: number }> {
    const out: Array<{
      sessionId: string;
      skills: string[];
      firstTs: number;
      lastTs: number;
    }> = [];
    for (const e of this.graph.entities.values()) {
      if (e.kind !== 'session') continue;
      const attrs = e.attrs as Record<string, unknown>;
      const sid = typeof attrs.sessionId === 'string' ? attrs.sessionId : '';
      const firstTs = typeof attrs.firstTs === 'number' ? attrs.firstTs : 0;
      const lastTs = typeof attrs.lastTs === 'number' ? attrs.lastTs : 0;
      if (window.sessionId !== undefined && sid !== window.sessionId) continue;
      if (window.fromTs !== undefined && lastTs < window.fromTs) continue;
      if (window.toTs !== undefined && firstTs > window.toTs) continue;

      // Skills are the skill neighbors of this session via ACTIVATED_IN.
      const skills: string[] = [];
      for (const edge of this.edgesByDst.get(e.id) ?? []) {
        if (edge.relation !== EDGE_RELATIONS.ACTIVATED_IN) continue;
        const skillEntity = this.graph.entities.get(edge.src);
        if (skillEntity && skillEntity.kind === 'skill') {
          const label = (skillEntity.attrs as Record<string, unknown>).name;
          if (typeof label === 'string') skills.push(label);
        }
      }
      skills.sort();
      out.push({ sessionId: sid, skills, firstTs, lastTs });
    }
    out.sort((a, b) => a.firstTs - b.firstTs);
    return out;
  }

  // ─── Query 5: refactorArc ──────────────────────────────────────────────

  /**
   * Return file-touch edges grouped by session in the given time window.
   * The "refactor arc" is the ordered list of files a session touched.
   */
  refactorArc(timeWindow: {
    fromTs?: number;
    toTs?: number;
  }): Array<{ sessionId: string; files: string[]; firstTs: number; lastTs: number }> {
    const out: Array<{
      sessionId: string;
      files: string[];
      firstTs: number;
      lastTs: number;
    }> = [];
    for (const e of this.graph.entities.values()) {
      if (e.kind !== 'session') continue;
      const attrs = e.attrs as Record<string, unknown>;
      const firstTs = typeof attrs.firstTs === 'number' ? attrs.firstTs : 0;
      const lastTs = typeof attrs.lastTs === 'number' ? attrs.lastTs : 0;
      const sid = typeof attrs.sessionId === 'string' ? attrs.sessionId : '';
      if (timeWindow.fromTs !== undefined && lastTs < timeWindow.fromTs) continue;
      if (timeWindow.toTs !== undefined && firstTs > timeWindow.toTs) continue;

      const files: string[] = [];
      for (const edge of this.edgesByDst.get(e.id) ?? []) {
        if (edge.relation !== EDGE_RELATIONS.OPENED) continue;
        const fileEntity = this.graph.entities.get(edge.src);
        if (fileEntity && fileEntity.kind === 'file') {
          const p = (fileEntity.attrs as Record<string, unknown>).path;
          if (typeof p === 'string') files.push(p);
        }
      }
      files.sort();
      out.push({ sessionId: sid, files, firstTs, lastTs });
    }
    out.sort((a, b) => a.firstTs - b.firstTs);
    return out;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function pairKey(a: string, b: string): string {
  return `${a}\u0001${b}`;
}

function pushMap<K, V>(map: Map<K, V[]>, k: K, value: V): void {
  const arr = map.get(k);
  if (arr) arr.push(value);
  else map.set(k, [value]);
}

function resolveEntities(entities: Map<string, Entity>, ids: Set<string>): Entity[] {
  const out: Entity[] = [];
  for (const id of ids) {
    const e = entities.get(id);
    if (e) out.push(e);
  }
  return out;
}
