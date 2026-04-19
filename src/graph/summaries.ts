/**
 * M1 Semantic Memory Graph — hierarchical summary generation.
 *
 * For each Leiden community at each level, build a structural (LLM-free)
 * summary: top entities by degree, representative edges, temporal bounds.
 * Summaries are keyed by community hash (SHA-256 of sorted member ids) so
 * the cache invalidates exactly when membership changes.
 *
 * CF-M1-03: every entity referenced by a community's members must appear
 * in the generated summary. We guarantee this by listing *all* members in
 * a `memberIds` field, while the narrative `text` field surfaces only the
 * top-N by structural importance.
 *
 * @module graph/summaries
 */
import type { Community, Entity, Edge } from '../types/memory.js';
import { hashBytes, HASH_ALGO } from '../memory/grove-format.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CommunitySummary {
  /** The community being summarized. */
  communityId: string;
  level: number;
  /** Full list of member entity ids — the referenced-entity set. */
  memberIds: string[];
  /** Top entities by degree (id + degree + kind). */
  topEntities: Array<{ id: string; degree: number; kind: string; label: string }>;
  /** Representative edges (src, dst, relation, weight). */
  representativeEdges: Array<{
    src: string;
    dst: string;
    relation: string;
    weight: number;
  }>;
  /** Temporal bounds (min/max session timestamps) — null if no session entity. */
  temporalBounds: { firstTs: number; lastTs: number } | null;
  /** Human-readable structural narrative. */
  text: string;
  /** Cache key — SHA-256 of sorted member ids (hex). */
  cacheKey: string;
}

export interface SummaryCache {
  byCacheKey: Map<string, CommunitySummary>;
  byCommunityId: Map<string, CommunitySummary>;
}

export interface SummaryOptions {
  /** How many entities to list in topEntities / narrative. Default 5. */
  topK?: number;
  /** How many edges to list in representativeEdges. Default 5. */
  edgeK?: number;
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Compute the cache key for a community: SHA-256 over the sorted, joined
 * member id list, truncated to 16 hex bytes. We skip grove canonical
 * encoding here because the cache key is internal (never stored on disk)
 * and hashing a UTF-8 string of the sorted id list is functionally
 * equivalent: same-members → same key, different-members → different key.
 */
export function communityCacheKey(members: string[]): string {
  const sorted = members.slice().sort();
  const joined = sorted.join('\u0001');
  const bytes = new TextEncoder().encode(joined);
  const hash = hashBytes(bytes, HASH_ALGO.SHA_256);
  let out = '';
  for (let i = 0; i < 16; i++) out += hash[i].toString(16).padStart(2, '0');
  return out;
}

/**
 * Optional precomputed index. When `summarize()` is called over many
 * communities, building an edges-by-source index once is a large win over
 * scanning `edges.values()` for every community.
 */
export interface SummaryIndex {
  edgesBySrc: Map<string, Edge[]>;
}

export function buildSummaryIndex(edges: Map<string, Edge>): SummaryIndex {
  const edgesBySrc = new Map<string, Edge[]>();
  for (const edge of edges.values()) {
    const arr = edgesBySrc.get(edge.src);
    if (arr) arr.push(edge);
    else edgesBySrc.set(edge.src, [edge]);
  }
  return { edgesBySrc };
}

/**
 * Generate a summary for a single community given the underlying entity +
 * edge maps and precomputed adjacency.
 */
export function summarizeCommunity(
  community: Community,
  entities: Map<string, Entity>,
  edges: Map<string, Edge>,
  adjacency: Map<string, Set<string>>,
  opts: SummaryOptions = {},
  index?: SummaryIndex,
): CommunitySummary {
  const topK = opts.topK ?? 5;
  const edgeK = opts.edgeK ?? 5;

  const memberSet = new Set(community.members);

  // Degree for each member inside the community subgraph.
  const degreeOf = new Map<string, number>();
  for (const m of community.members) {
    const nbrs = adjacency.get(m);
    if (!nbrs) {
      degreeOf.set(m, 0);
      continue;
    }
    let d = 0;
    for (const n of nbrs) if (memberSet.has(n)) d++;
    degreeOf.set(m, d);
  }

  const byDegree = community.members.slice().sort((a, b) => {
    const d = (degreeOf.get(b) ?? 0) - (degreeOf.get(a) ?? 0);
    return d !== 0 ? d : a.localeCompare(b);
  });

  const topEntities = byDegree.slice(0, topK).map((id) => {
    const e = entities.get(id);
    return {
      id,
      degree: degreeOf.get(id) ?? 0,
      kind: e ? e.kind : 'unknown',
      label: e ? deriveLabel(e) : id,
    };
  });

  // Representative edges — all edges whose endpoints are both in members,
  // sorted by weight desc, take top edgeK. When an index is provided we
  // iterate only edges whose src is in memberSet (typically <1% of edges).
  const innerEdges: Array<{
    src: string;
    dst: string;
    relation: string;
    weight: number;
  }> = [];
  if (index) {
    for (const m of community.members) {
      const outgoing = index.edgesBySrc.get(m);
      if (!outgoing) continue;
      for (const edge of outgoing) {
        if (memberSet.has(edge.dst)) innerEdges.push({ ...edge });
      }
    }
  } else {
    for (const edge of edges.values()) {
      if (memberSet.has(edge.src) && memberSet.has(edge.dst)) {
        innerEdges.push({ ...edge });
      }
    }
  }
  innerEdges.sort((a, b) => {
    const d = b.weight - a.weight;
    if (d !== 0) return d;
    const s = a.src.localeCompare(b.src);
    if (s !== 0) return s;
    return a.dst.localeCompare(b.dst);
  });
  const representativeEdges = innerEdges.slice(0, edgeK);

  // Temporal bounds — from session entities in the community.
  let firstTs = Number.POSITIVE_INFINITY;
  let lastTs = Number.NEGATIVE_INFINITY;
  let sawSession = false;
  for (const m of community.members) {
    const e = entities.get(m);
    if (!e || e.kind !== 'session') continue;
    const attrs = e.attrs as Record<string, unknown>;
    if (typeof attrs.firstTs === 'number') {
      firstTs = Math.min(firstTs, attrs.firstTs);
      sawSession = true;
    }
    if (typeof attrs.lastTs === 'number') {
      lastTs = Math.max(lastTs, attrs.lastTs);
      sawSession = true;
    }
  }
  const temporalBounds = sawSession ? { firstTs, lastTs } : null;

  const text = buildNarrative(community, topEntities, representativeEdges, temporalBounds);

  return {
    communityId: community.id,
    level: community.level,
    memberIds: community.members.slice().sort(),
    topEntities,
    representativeEdges,
    temporalBounds,
    text,
    cacheKey: communityCacheKey(community.members),
  };
}

function deriveLabel(e: Entity): string {
  const attrs = e.attrs as Record<string, unknown>;
  if (typeof attrs.name === 'string') return attrs.name;
  if (typeof attrs.path === 'string') return attrs.path;
  if (typeof attrs.sessionId === 'string') return attrs.sessionId;
  if (typeof attrs.label === 'string') return attrs.label;
  return e.id;
}

function buildNarrative(
  community: Community,
  topEntities: CommunitySummary['topEntities'],
  edges: CommunitySummary['representativeEdges'],
  bounds: CommunitySummary['temporalBounds'],
): string {
  const parts: string[] = [];
  parts.push(
    `Community ${community.id} (level ${community.level}) has ${community.members.length} members.`,
  );
  if (topEntities.length > 0) {
    const names = topEntities
      .map((t) => `${t.kind}:${t.label} (deg=${t.degree})`)
      .join(', ');
    parts.push(`Top entities: ${names}.`);
  }
  if (edges.length > 0) {
    const names = edges
      .map((e) => `${e.src} --${e.relation}(w=${e.weight})--> ${e.dst}`)
      .join('; ');
    parts.push(`Representative edges: ${names}.`);
  }
  if (bounds) {
    parts.push(`Temporal span: ${bounds.firstTs} → ${bounds.lastTs}.`);
  }
  return parts.join(' ');
}

/**
 * Generate summaries for every community across every level and return
 * a populated cache. Existing summaries in `priorCache` are reused when
 * their cache key still matches.
 */
export function summarize(
  communitiesByLevel: Community[][],
  entities: Map<string, Entity>,
  edges: Map<string, Edge>,
  adjacency: Map<string, Set<string>>,
  priorCache: SummaryCache | null = null,
  opts: SummaryOptions = {},
): SummaryCache {
  const byCacheKey = new Map<string, CommunitySummary>();
  const byCommunityId = new Map<string, CommunitySummary>();

  // Build the edges-by-src index once so each summarizeCommunity call only
  // visits edges adjacent to its members (big win for many communities).
  const index = buildSummaryIndex(edges);

  for (const level of communitiesByLevel) {
    for (const c of level) {
      const cacheKey = communityCacheKey(c.members);
      const prior = priorCache?.byCacheKey.get(cacheKey);
      let summary: CommunitySummary;
      if (prior && prior.communityId === c.id && prior.level === c.level) {
        // Exact reuse — membership unchanged.
        summary = prior;
      } else {
        summary = summarizeCommunity(c, entities, edges, adjacency, opts, index);
      }
      byCacheKey.set(cacheKey, summary);
      byCommunityId.set(c.id, summary);
    }
  }

  return { byCacheKey, byCommunityId };
}
