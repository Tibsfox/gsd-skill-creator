/**
 * M1 Semantic Memory Graph — TRS cross-pack edge loader (IC-613-1.3).
 *
 * Lifts the TRS (Topic Research Spine) cross-pack edge catalogue at
 * `www/tibsfox/com/Research/TRS/edges.json` into first-class graph
 * entities + edges that can be queried alongside the M1 session-derived
 * graph. The on-disk JSON is the durable artefact built by
 * `tools/build-trs-edges.mjs` (84 edges back-filled v608-v613).
 *
 * Schema mapping
 * --------------
 *
 *   - **trs:pack** entities — one per mathematical pack (pack-01 … pack-13).
 *     Natural key: the bare pack id (e.g. `pack-09`). Attrs carry the pack
 *     number and the count of edges bound at-or-before the latest milestone.
 *
 *   - **trs:citation** entities — one per individual citation slot
 *     referenced in an edge endpoint (e.g. `pack-09-001`). Attrs carry the
 *     parent pack id + the slot number. Citation entities are emitted only
 *     when actually referenced in an edge; bare `pack-XX` endpoints (no
 *     slot suffix) skip the citation emission.
 *
 *   - **trs:cross-pack-binding** edges — one per TRS edge in the JSON.
 *     `src` and `dst` point at the citation entity ids when slot-suffixed,
 *     or at the pack entity id when not. `attrs` (carried via the edge's
 *     loose `relation` is fixed; auxiliary metadata rides on a sibling
 *     `metadata` map keyed by edge id) preserve the original JSON edge id,
 *     `milestone_bound`, `pack_bound`, the original `relation` field
 *     (typically `cross-pack-paired-with`), and the human description.
 *
 *   - **trs:pack-contains** edges — pack → citation containment. Lets a
 *     query like "what packs bind to pack-05?" walk via citations without
 *     needing a separate index.
 *
 * Why a parallel TrsGraph rather than EXTEND-ing Entity.kind / Graph
 * ------------------------------------------------------------------
 *
 * `EntityKind` in `src/types/memory.ts` is a closed union covering the
 * session-observation domain (skill / command / file / session / decision
 * / outcome). The companion test in `schema.test.ts` asserts the closed
 * set has exactly six members; widening `EntityKind` would break that
 * assertion + the CF-M1-05 grove-compat invariant. Instead, this module
 * defines a parallel `TrsEntity` / `TrsEdge` / `TrsGraph` triple that
 * mirrors the M1 shapes structurally — same `id` / `kind` / `attrs` for
 * entities and same `src` / `dst` / `relation` / `weight` for edges — so
 * downstream tooling (Leiden, query.ts) can treat a TrsGraph identically
 * once the TRS kinds are accepted as opaque strings.
 *
 * Idempotency
 * -----------
 *
 * Same `edges.json` input → same final graph state regardless of how many
 * times `loadTrsEdges` is called. Re-running against an already-populated
 * `TrsGraph` returns counts of zero new entities / zero new edges. This
 * is a hard invariant tested in `__tests__/trs-loader.test.ts`.
 *
 * Invocation
 * ----------
 *
 * Library:
 *
 *   import { loadTrsEdges, createTrsGraph } from 'src/graph/trs-loader.js';
 *   const g = createTrsGraph();
 *   const result = await loadTrsEdges(g);
 *   // → { entitiesAdded, edgesAdded, packsRecognized }
 *
 * CLI (npm script `graph:load:trs` in package.json):
 *
 *   npm run graph:load:trs                 # default JSON path
 *   npm run graph:load:trs -- --path=...   # override
 *
 * @module graph/trs-loader
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  encode,
  hashBytes,
  HASH_ALGO,
  v,
  type CanonicalValue,
} from '../memory/grove-format.js';

// ─── TRS-specific schema vocabulary ─────────────────────────────────────────

/**
 * TRS entity kinds. Distinct from `EntityKind` in src/types/memory.ts —
 * see module header for the design rationale.
 */
export const TRS_ENTITY_KINDS = ['trs:pack', 'trs:citation'] as const;
export type TrsEntityKind = (typeof TRS_ENTITY_KINDS)[number];

/**
 * TRS edge relations. The cross-pack-binding relation is the canonical
 * representation of the JSON `relation` field (which today is always
 * `cross-pack-paired-with` but may diversify); the original relation
 * string is preserved on the per-edge metadata so it remains queryable.
 *
 * `pack-contains` is synthesised: it is not in the JSON, but represents
 * the natural pack → citation containment relation that lets queries
 * traverse pack ↔ citation without a separate index.
 */
export const TRS_EDGE_RELATIONS = {
  CROSS_PACK_BINDING: 'trs:cross-pack-binding',
  PACK_CONTAINS: 'trs:pack-contains',
} as const;

export type TrsEdgeRelation =
  (typeof TRS_EDGE_RELATIONS)[keyof typeof TRS_EDGE_RELATIONS];

// ─── TRS entity / edge shapes ───────────────────────────────────────────────

export interface TrsEntity {
  id: string;
  kind: TrsEntityKind;
  attrs: Record<string, unknown>;
}

export interface TrsEdge {
  id: string;
  src: string;
  dst: string;
  relation: string;
  weight: number;
  /**
   * Per-edge metadata copied from the source JSON. For `cross-pack-binding`
   * edges this captures `edgeJsonId`, `milestoneBound`, `packBound`,
   * `originalRelation`, and `description`. `pack-contains` edges leave
   * this empty.
   */
  metadata: Record<string, unknown>;
}

export interface TrsGraph {
  entities: Map<string, TrsEntity>;
  edges: Map<string, TrsEdge>;
  /** Adjacency: entity id → Set of neighbour entity ids (undirected). */
  adjacency: Map<string, Set<string>>;
  /** Pack ids encountered, e.g. `pack-09`. */
  packs: Set<string>;
  /** ISO timestamp of the most-recently-loaded JSON `generated_at` field. */
  lastGeneratedAt: string | null;
}

// ─── Source-JSON schema (typed minimally for tolerant parsing) ──────────────

interface TrsEdgeJson {
  id: number;
  source: string;
  target: string;
  relation: string;
  description: string;
  milestone_bound: string;
  pack_bound: string;
}

interface TrsMilestoneJson {
  milestone: string;
  pack_bound: string;
  predecessor_pack: string | null;
  edges: TrsEdgeJson[];
}

interface TrsEdgesFileJson {
  schema?: string;
  generated_at?: string;
  total_edges?: number;
  milestones?: TrsMilestoneJson[];
}

// ─── ID derivation (mirrors src/graph/schema.ts entityId / edgeId) ──────────

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Deterministic TRS entity id from (kind, key). */
export function trsEntityId(kind: TrsEntityKind, key: string): string {
  const payload: CanonicalValue = {
    kind: v.string(kind),
    key: v.string(key),
  };
  const bytes = encode(payload);
  const hash = hashBytes(bytes, HASH_ALGO.SHA_256);
  return `${kind}:${toHex(hash.slice(0, 8))}`;
}

/** Deterministic TRS edge id from (src, relation, dst, jsonId). */
export function trsEdgeId(
  src: string,
  relation: string,
  dst: string,
  jsonId: number | null,
): string {
  const payload: CanonicalValue = {
    src: v.string(src),
    dst: v.string(dst),
    relation: v.string(relation),
    jsonId: v.string(jsonId === null ? '' : String(jsonId)),
  };
  const bytes = encode(payload);
  const hash = hashBytes(bytes, HASH_ALGO.SHA_256);
  return toHex(hash.slice(0, 12));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Resolve a TRS endpoint string (`pack-09-001` or `pack-12`) to the
 * resulting (packId, citationId | null) pair.
 *
 *   pack-09-001  → { packId: 'pack-09', citationId: 'pack-09-001' }
 *   pack-12      → { packId: 'pack-12', citationId: null }
 */
export function resolveEndpoint(ref: string): {
  packId: string;
  citationId: string | null;
} {
  const m = ref.match(/^(pack-\d+)(?:-\d+)?$/);
  if (!m) {
    throw new Error(`graph/trs-loader: malformed pack reference '${ref}'`);
  }
  const packId = m[1];
  const citationId = ref === packId ? null : ref;
  return { packId, citationId };
}

const PACK_DOMAINS: Record<string, string> = {
  'pack-01': 'probability and measure theory',
  'pack-02': 'differential geometry',
  'pack-03': 'algebraic topology',
  'pack-04': 'control theory and dynamical systems',
  'pack-05': 'differential equations',
  'pack-06': 'numerical analysis',
  'pack-07': 'graph theory and combinatorics',
  'pack-08': 'optimisation',
  'pack-09': 'functional analysis',
  'pack-10': 'information theory',
  'pack-11': 'category theory',
  'pack-12': 'mathematical logic',
  'pack-13': 'computational complexity',
};

function packNumber(packId: string): number {
  const m = packId.match(/^pack-(\d+)$/);
  return m ? parseInt(m[1], 10) : -1;
}

function citationSlot(citationId: string): number {
  const m = citationId.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : -1;
}

// ─── Graph construction / mutation ──────────────────────────────────────────

/** Construct an empty TrsGraph. */
export function createTrsGraph(): TrsGraph {
  return {
    entities: new Map(),
    edges: new Map(),
    adjacency: new Map(),
    packs: new Set(),
    lastGeneratedAt: null,
  };
}

interface UpsertCounts {
  entitiesAdded: number;
  edgesAdded: number;
  packsRecognized: number;
}

function upsertEntity(
  graph: TrsGraph,
  id: string,
  build: () => TrsEntity,
  counts: UpsertCounts,
): TrsEntity {
  const existing = graph.entities.get(id);
  if (existing) return existing;
  const ent = build();
  graph.entities.set(id, ent);
  graph.adjacency.set(id, new Set());
  counts.entitiesAdded++;
  return ent;
}

function upsertEdge(
  graph: TrsGraph,
  edge: TrsEdge,
  counts: UpsertCounts,
): void {
  if (graph.edges.has(edge.id)) return; // idempotent
  graph.edges.set(edge.id, edge);
  graph.adjacency.get(edge.src)?.add(edge.dst);
  graph.adjacency.get(edge.dst)?.add(edge.src);
  counts.edgesAdded++;
}

function ensurePack(
  graph: TrsGraph,
  packId: string,
  counts: UpsertCounts,
): string {
  const id = trsEntityId('trs:pack', packId);
  const before = graph.packs.size;
  graph.packs.add(packId);
  if (graph.packs.size > before) counts.packsRecognized++;
  upsertEntity(
    graph,
    id,
    () => ({
      id,
      kind: 'trs:pack',
      attrs: {
        packId,
        packNumber: packNumber(packId),
        domain: PACK_DOMAINS[packId] ?? null,
        edgeCount: 0,
      },
    }),
    counts,
  );
  return id;
}

function ensureCitation(
  graph: TrsGraph,
  citationId: string,
  packId: string,
  counts: UpsertCounts,
): string {
  const id = trsEntityId('trs:citation', citationId);
  const created = !graph.entities.has(id);
  upsertEntity(
    graph,
    id,
    () => ({
      id,
      kind: 'trs:citation',
      attrs: {
        citationId,
        packId,
        slot: citationSlot(citationId),
      },
    }),
    counts,
  );
  if (created) {
    // Add pack-contains edge synthesised on first citation observation.
    const packEntityId = trsEntityId('trs:pack', packId);
    const containsEdgeId = trsEdgeId(
      packEntityId,
      TRS_EDGE_RELATIONS.PACK_CONTAINS,
      id,
      null,
    );
    upsertEdge(
      graph,
      {
        id: containsEdgeId,
        src: packEntityId,
        dst: id,
        relation: TRS_EDGE_RELATIONS.PACK_CONTAINS,
        weight: 1,
        metadata: {},
      },
      counts,
    );
  }
  return id;
}

// ─── Public load API ────────────────────────────────────────────────────────

export interface LoadTrsResult {
  entitiesAdded: number;
  edgesAdded: number;
  packsRecognized: number;
  /** Total edges seen in source JSON (for verification — not delta). */
  edgesInSource: number;
  /** ISO timestamp from the source JSON, if present. */
  generatedAt: string | null;
}

export interface LoadTrsOptions {
  /** Override default `www/tibsfox/com/Research/TRS/edges.json` path. */
  path?: string;
  /** Pre-loaded JSON text (e.g. for tests / fixtures). Skips disk read. */
  text?: string;
  /** Pre-parsed JSON object. Highest precedence; skips disk + parse. */
  json?: TrsEdgesFileJson;
}

const DEFAULT_TRS_JSON_PATH = 'www/tibsfox/com/Research/TRS/edges.json';

/**
 * Load TRS edges into the graph. Idempotent.
 *
 * Strategy: walk every milestone × every edge; for each edge, ensure the
 * source pack + (optional) source citation, the dst pack + (optional) dst
 * citation, then materialise the cross-pack-binding edge. Duplicates by
 * `trsEdgeId` are skipped so re-runs produce zero deltas.
 */
export async function loadTrsEdges(
  graph: TrsGraph,
  opts: LoadTrsOptions = {},
): Promise<LoadTrsResult> {
  const json = await resolveJson(opts);

  const counts: UpsertCounts = {
    entitiesAdded: 0,
    edgesAdded: 0,
    packsRecognized: 0,
  };
  let edgesInSource = 0;

  const milestones = Array.isArray(json.milestones) ? json.milestones : [];
  for (const m of milestones) {
    if (!m || !Array.isArray(m.edges)) continue;
    for (const e of m.edges) {
      if (!isValidEdgeJson(e)) continue;
      edgesInSource++;
      ingestOneEdge(graph, e, counts);
    }
  }

  if (typeof json.generated_at === 'string') {
    graph.lastGeneratedAt = json.generated_at;
  }

  // Refresh edgeCount on each pack from current adjacency contributions.
  recomputePackEdgeCounts(graph);

  return {
    entitiesAdded: counts.entitiesAdded,
    edgesAdded: counts.edgesAdded,
    packsRecognized: counts.packsRecognized,
    edgesInSource,
    generatedAt: graph.lastGeneratedAt,
  };
}

async function resolveJson(opts: LoadTrsOptions): Promise<TrsEdgesFileJson> {
  if (opts.json !== undefined) return opts.json;
  if (opts.text !== undefined) return JSON.parse(opts.text) as TrsEdgesFileJson;
  const path = opts.path
    ? resolve(opts.path)
    : resolve(process.cwd(), DEFAULT_TRS_JSON_PATH);
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as TrsEdgesFileJson;
}

function isValidEdgeJson(e: unknown): e is TrsEdgeJson {
  if (typeof e !== 'object' || e === null) return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.id === 'number' &&
    typeof o.source === 'string' &&
    typeof o.target === 'string' &&
    typeof o.relation === 'string' &&
    typeof o.milestone_bound === 'string' &&
    typeof o.pack_bound === 'string'
  );
}

function ingestOneEdge(
  graph: TrsGraph,
  e: TrsEdgeJson,
  counts: UpsertCounts,
): void {
  let src: { packId: string; citationId: string | null };
  let dst: { packId: string; citationId: string | null };
  try {
    src = resolveEndpoint(e.source);
    dst = resolveEndpoint(e.target);
  } catch {
    return; // skip malformed endpoints; do not throw mid-load
  }

  const srcPackEntityId = ensurePack(graph, src.packId, counts);
  const dstPackEntityId = ensurePack(graph, dst.packId, counts);

  const srcEntityId = src.citationId
    ? ensureCitation(graph, src.citationId, src.packId, counts)
    : srcPackEntityId;
  const dstEntityId = dst.citationId
    ? ensureCitation(graph, dst.citationId, dst.packId, counts)
    : dstPackEntityId;

  const edgeId = trsEdgeId(
    srcEntityId,
    TRS_EDGE_RELATIONS.CROSS_PACK_BINDING,
    dstEntityId,
    e.id,
  );
  upsertEdge(
    graph,
    {
      id: edgeId,
      src: srcEntityId,
      dst: dstEntityId,
      relation: TRS_EDGE_RELATIONS.CROSS_PACK_BINDING,
      weight: 1,
      metadata: {
        edgeJsonId: e.id,
        milestoneBound: e.milestone_bound,
        packBound: e.pack_bound,
        originalRelation: e.relation,
        description: e.description,
        sourceRef: e.source,
        targetRef: e.target,
      },
    },
    counts,
  );
}

function recomputePackEdgeCounts(graph: TrsGraph): void {
  const counts = new Map<string, number>();
  for (const edge of graph.edges.values()) {
    if (edge.relation !== TRS_EDGE_RELATIONS.CROSS_PACK_BINDING) continue;
    const meta = edge.metadata;
    const srcRef = typeof meta.sourceRef === 'string' ? meta.sourceRef : null;
    const dstRef = typeof meta.targetRef === 'string' ? meta.targetRef : null;
    if (!srcRef || !dstRef) continue;
    const srcPack = resolveEndpoint(srcRef).packId;
    const dstPack = resolveEndpoint(dstRef).packId;
    counts.set(srcPack, (counts.get(srcPack) ?? 0) + 1);
    if (dstPack !== srcPack) {
      counts.set(dstPack, (counts.get(dstPack) ?? 0) + 1);
    }
  }
  for (const packId of graph.packs) {
    const id = trsEntityId('trs:pack', packId);
    const ent = graph.entities.get(id);
    if (!ent) continue;
    (ent.attrs as Record<string, unknown>).edgeCount = counts.get(packId) ?? 0;
  }
}

// ─── Convenience query helpers ──────────────────────────────────────────────

/**
 * Return all cross-pack-binding edges introduced at a given milestone
 * (e.g. `v1.49.613`).
 */
export function edgesAtMilestone(graph: TrsGraph, milestone: string): TrsEdge[] {
  const out: TrsEdge[] = [];
  for (const edge of graph.edges.values()) {
    if (edge.relation !== TRS_EDGE_RELATIONS.CROSS_PACK_BINDING) continue;
    if (edge.metadata.milestoneBound === milestone) out.push(edge);
  }
  return out;
}

/**
 * Return the packs that bind to (have at least one cross-pack-binding edge
 * to/from) the given pack id, e.g. `boundPacks(g, 'pack-05')`.
 */
export function boundPacks(graph: TrsGraph, packId: string): string[] {
  const out = new Set<string>();
  for (const edge of graph.edges.values()) {
    if (edge.relation !== TRS_EDGE_RELATIONS.CROSS_PACK_BINDING) continue;
    const meta = edge.metadata;
    const srcRef = typeof meta.sourceRef === 'string' ? meta.sourceRef : null;
    const dstRef = typeof meta.targetRef === 'string' ? meta.targetRef : null;
    if (!srcRef || !dstRef) continue;
    const srcPack = resolveEndpoint(srcRef).packId;
    const dstPack = resolveEndpoint(dstRef).packId;
    if (srcPack === packId && dstPack !== packId) out.add(dstPack);
    if (dstPack === packId && srcPack !== packId) out.add(srcPack);
  }
  return Array.from(out).sort();
}

/** Return all entities of a given TRS kind. */
export function trsEntitiesByKind(
  graph: TrsGraph,
  kind: TrsEntityKind,
): TrsEntity[] {
  const out: TrsEntity[] = [];
  for (const e of graph.entities.values()) {
    if (e.kind === kind) out.push(e);
  }
  return out;
}
