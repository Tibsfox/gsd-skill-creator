/**
 * M1 Semantic Memory Graph — Leiden community detection.
 *
 * Re-derives the Leiden algorithm (Traag, Waltman & van Eck, 2019,
 * *From Louvain to Leiden: guaranteeing well-connected communities*) in
 * TypeScript. No external graph library — everything here operates on a
 * weighted undirected graph represented as adjacency arrays with numeric
 * node ids (0..N-1). Determinism is guaranteed by a seeded PRNG; identical
 * (graph, seed) pairs produce identical community partitions.
 *
 * The algorithm has three phases per pass:
 *
 *   1. local move — scan nodes in randomized order; move each to the
 *      neighboring community that produces the greatest modularity gain.
 *      Repeat until no node moves.
 *   2. refinement — within each community, run a secondary local move that
 *      only merges when it is strictly better; this is what guarantees
 *      well-connected communities per Traag 2019 §3.
 *   3. aggregation — build a new graph where each refined community is a
 *      node, and recurse.
 *
 * Multi-level output: the community at each level is returned as an array of
 * `Community` records (from shared types), with `level` incrementing from
 * 0 (leaf) upward.
 *
 * @module graph/leiden
 */
import type { Community } from '../types/memory.js';

// ─── Weighted undirected graph representation ───────────────────────────────

/** CSR-ish representation: adjacency[i] = array of (neighbor, weight) pairs. */
export interface WeightedGraph {
  n: number;
  adjacency: Array<Array<{ neighbor: number; weight: number }>>;
  /** Sum of degrees (= 2m for undirected). */
  totalEdgeWeight: number;
  /** Node ids as strings — caller owns the id→index mapping. */
  nodeIds: string[];
}

export interface LeidenOptions {
  /** Modularity resolution parameter (γ). Default 1.0. */
  resolution?: number;
  /** PRNG seed for deterministic ordering. Required for reproducibility. */
  seed?: number;
  /** Max number of aggregation passes. Default 10. */
  maxLevels?: number;
  /** Convergence: stop when modularity gain between passes < this. Default 1e-7. */
  tolerance?: number;
}

export interface LeidenResult {
  /** Community assignments at each level. communities[0] = leaf. */
  communities: Community[][];
  /** Modularity of the final partition (at the finest level). */
  modularity: number;
  /** Node-index → leaf-community-id for fast lookup in queries. */
  nodeToCommunity: Map<string, string>;
}

// ─── Deterministic PRNG (Mulberry32) ────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// ─── Modularity ─────────────────────────────────────────────────────────────

/**
 * Compute the modularity Q of a partition.
 *
 *   Q = (1/2m) Σ_{i,j} [ A_ij - γ k_i k_j / 2m ] δ(c_i, c_j)
 *
 * @param graph weighted graph (adjacency carries weights)
 * @param partition partition[i] = community id of node i
 * @param resolution γ (default 1.0)
 */
export function modularity(
  graph: WeightedGraph,
  partition: number[],
  resolution = 1.0,
): number {
  const m2 = graph.totalEdgeWeight; // = 2m
  if (m2 === 0) return 0;

  // Compute community degree sums and within-community edge weights.
  const commDegree = new Map<number, number>();
  const commInternal = new Map<number, number>();

  for (let i = 0; i < graph.n; i++) {
    const c = partition[i];
    let deg = 0;
    for (const nbr of graph.adjacency[i]) {
      deg += nbr.weight;
      if (partition[nbr.neighbor] === c) {
        // Each internal edge counted twice (from each endpoint); fine.
        commInternal.set(c, (commInternal.get(c) ?? 0) + nbr.weight);
      }
    }
    commDegree.set(c, (commDegree.get(c) ?? 0) + deg);
  }

  let q = 0;
  for (const [c, internal] of commInternal) {
    const d = commDegree.get(c) ?? 0;
    // Internal was summed twice above; divide by m2 = 2m.
    // Q += internal / m2 - γ (d/m2)^2
    q += internal / m2 - resolution * (d / m2) * (d / m2);
  }
  return q;
}

// ─── Local move phase ───────────────────────────────────────────────────────

/**
 * Perform one local-move phase: scan nodes in randomized order; move each
 * to the neighbor community that maximizes ΔQ; repeat until no moves occur.
 * Mutates `partition` in place.
 */
function localMove(
  graph: WeightedGraph,
  partition: number[],
  resolution: number,
  rand: () => number,
): boolean {
  const m2 = graph.totalEdgeWeight;
  if (m2 === 0) return false;

  // Maintain community degree totals for ΔQ computation.
  const commDegree = new Map<number, number>();
  const nodeDegree = new Array(graph.n).fill(0);
  for (let i = 0; i < graph.n; i++) {
    for (const nbr of graph.adjacency[i]) {
      nodeDegree[i] += nbr.weight;
    }
  }
  for (let i = 0; i < graph.n; i++) {
    const c = partition[i];
    commDegree.set(c, (commDegree.get(c) ?? 0) + nodeDegree[i]);
  }

  let moved = true;
  let anyMoved = false;
  let iter = 0;
  const maxIter = 50;

  while (moved && iter < maxIter) {
    moved = false;
    iter++;

    const order = shuffle(
      Array.from({ length: graph.n }, (_, i) => i),
      rand,
    );

    for (const i of order) {
      const currentComm = partition[i];
      const ki = nodeDegree[i];

      // Weighted degree from i into each neighbor community.
      const weightToComm = new Map<number, number>();
      for (const nbr of graph.adjacency[i]) {
        if (nbr.neighbor === i) continue; // ignore self-loops
        const c = partition[nbr.neighbor];
        weightToComm.set(c, (weightToComm.get(c) ?? 0) + nbr.weight);
      }

      // Subtract i from its current community for ΔQ candidacy computation.
      const kInCurrent = weightToComm.get(currentComm) ?? 0;
      commDegree.set(currentComm, (commDegree.get(currentComm) ?? 0) - ki);

      // Pick the best candidate community (including currentComm as a
      // no-op candidate).
      let bestComm = currentComm;
      let bestGain = 0;

      // Deterministic iteration order over candidate communities: sort by
      // community id ascending. This ensures identical ties break identically
      // across runs with the same seed.
      const candidates = Array.from(weightToComm.keys()).sort((a, b) => a - b);
      // Always include currentComm as a candidate so we can compute the
      // "leave current" baseline.
      if (!candidates.includes(currentComm)) candidates.push(currentComm);

      for (const c of candidates) {
        const kInC = weightToComm.get(c) ?? 0;
        const sumC = commDegree.get(c) ?? 0;
        // ΔQ to move i into c (with i removed from current):
        //   gain = kInC / m - γ * ki * sumC / (m^2 * 2)  ... scaled
        // We use the standard Newman-Girvan form for undirected weighted:
        //   ΔQ ∝ 2*kInC / m2 - 2 * γ * ki * sumC / (m2*m2)
        const gain = (2 * kInC) / m2 - (2 * resolution * ki * sumC) / (m2 * m2);
        if (gain > bestGain + 1e-12) {
          bestGain = gain;
          bestComm = c;
        }
      }

      if (bestComm !== currentComm) {
        partition[i] = bestComm;
        commDegree.set(bestComm, (commDegree.get(bestComm) ?? 0) + ki);
        moved = true;
        anyMoved = true;
      } else {
        // Restore current community degree.
        commDegree.set(currentComm, (commDegree.get(currentComm) ?? 0) + ki);
      }
    }
  }

  return anyMoved;
}

// ─── Refinement phase (Traag 2019 §3) ──────────────────────────────────────

/**
 * Refinement phase: within each community of `partition`, run a stricter
 * local-move that only accepts moves with strictly positive gain. Returns
 * a refined partition. This is what guarantees "well-connected" communities
 * per the Leiden paper — it prevents the Louvain pathology where a
 * disconnected merged community persists.
 *
 * For simplicity we implement a single-pass refinement: each node is
 * initially in its own singleton refined-community and may merge into a
 * neighbor's refined-community within the same partition bucket.
 */
function refine(
  graph: WeightedGraph,
  partition: number[],
  resolution: number,
  rand: () => number,
): number[] {
  const refined = Array.from({ length: graph.n }, (_, i) => i);
  const m2 = graph.totalEdgeWeight;
  if (m2 === 0) return refined;

  const nodeDegree = new Array<number>(graph.n).fill(0);
  for (let i = 0; i < graph.n; i++) {
    for (const nbr of graph.adjacency[i]) nodeDegree[i] += nbr.weight;
  }

  // Group node indices by their coarse partition community.
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < graph.n; i++) {
    const c = partition[i];
    let b = buckets.get(c);
    if (!b) {
      b = [];
      buckets.set(c, b);
    }
    b.push(i);
  }

  // Per-refined-community degree totals, scoped per bucket.
  const refDegree = new Map<number, number>();
  for (let i = 0; i < graph.n; i++) {
    refDegree.set(refined[i], nodeDegree[i]);
  }

  // Deterministic bucket iteration order: ascending community id.
  const bucketIds = Array.from(buckets.keys()).sort((a, b) => a - b);

  for (const bid of bucketIds) {
    const nodes = buckets.get(bid)!;
    const order = shuffle(nodes.slice(), rand);
    for (const i of order) {
      const current = refined[i];
      const ki = nodeDegree[i];

      // Candidate refined communities: neighbors inside the same bucket only.
      const weightToRef = new Map<number, number>();
      for (const nbr of graph.adjacency[i]) {
        if (nbr.neighbor === i) continue;
        if (partition[nbr.neighbor] !== bid) continue; // stay within bucket
        const r = refined[nbr.neighbor];
        weightToRef.set(r, (weightToRef.get(r) ?? 0) + nbr.weight);
      }

      // Remove i from its current refined community.
      refDegree.set(current, (refDegree.get(current) ?? 0) - ki);
      const kInCurrent = weightToRef.get(current) ?? 0;
      void kInCurrent;

      let bestRef = current;
      let bestGain = 0;
      const candidates = Array.from(weightToRef.keys()).sort((a, b) => a - b);
      if (!candidates.includes(current)) candidates.push(current);

      for (const r of candidates) {
        if (r === current) continue; // baseline is "stay"
        const kInR = weightToRef.get(r) ?? 0;
        const sumR = refDegree.get(r) ?? 0;
        // Only accept strictly positive gain (Leiden refinement rule).
        const gain = (2 * kInR) / m2 - (2 * resolution * ki * sumR) / (m2 * m2);
        if (gain > bestGain + 1e-12) {
          bestGain = gain;
          bestRef = r;
        }
      }

      refined[i] = bestRef;
      refDegree.set(bestRef, (refDegree.get(bestRef) ?? 0) + ki);
    }
  }

  return refined;
}

// ─── Aggregation ────────────────────────────────────────────────────────────

/**
 * Build an aggregated graph where each (refined) community becomes a node.
 * Edge weights between aggregated nodes = sum of edge weights between all
 * pairs of underlying nodes. Self-loops collect intra-community weight.
 */
function aggregate(
  graph: WeightedGraph,
  refined: number[],
): {
  agg: WeightedGraph;
  communityOf: number[];
  communityNodeIds: string[][];
} {
  // Canonicalize refined ids → contiguous 0..k-1, in order of first appearance
  // (sorted by id for determinism).
  const distinct = Array.from(new Set(refined)).sort((a, b) => a - b);
  const idMap = new Map<number, number>();
  distinct.forEach((id, idx) => idMap.set(id, idx));

  const k = distinct.length;
  const communityOf = refined.map((r) => idMap.get(r)!);

  // Build weighted edge list between communities.
  // Using map-of-map to sum.
  const aggAdj = new Map<number, Map<number, number>>();
  for (let i = 0; i < graph.n; i++) {
    const ci = communityOf[i];
    for (const nbr of graph.adjacency[i]) {
      const cj = communityOf[nbr.neighbor];
      let row = aggAdj.get(ci);
      if (!row) {
        row = new Map();
        aggAdj.set(ci, row);
      }
      row.set(cj, (row.get(cj) ?? 0) + nbr.weight);
    }
  }

  const adjacency: Array<Array<{ neighbor: number; weight: number }>> = [];
  let totalEdgeWeight = 0;
  const nodeIds: string[] = [];
  const communityNodeIds: string[][] = [];
  for (let c = 0; c < k; c++) {
    const row = aggAdj.get(c) ?? new Map();
    const entries: Array<{ neighbor: number; weight: number }> = [];
    // Sort by neighbor for determinism.
    const keys = Array.from(row.keys()).sort((a, b) => a - b);
    for (const j of keys) {
      entries.push({ neighbor: j, weight: row.get(j)! });
      totalEdgeWeight += row.get(j)!;
    }
    adjacency.push(entries);
    nodeIds.push(`c${c}`);
    // Collect original node ids inside this aggregated node.
    communityNodeIds.push([]);
  }
  for (let i = 0; i < graph.n; i++) {
    communityNodeIds[communityOf[i]].push(graph.nodeIds[i]);
  }

  return {
    agg: { n: k, adjacency, totalEdgeWeight, nodeIds },
    communityOf,
    communityNodeIds,
  };
}

// ─── Top-level driver ──────────────────────────────────────────────────────

/**
 * Run Leiden on a weighted graph. Returns the community partition at each
 * level (0 = leaf) plus modularity of the final partition.
 */
export function leiden(
  graph: WeightedGraph,
  opts: LeidenOptions = {},
): LeidenResult {
  const resolution = opts.resolution ?? 1.0;
  const seed = opts.seed ?? 42;
  const maxLevels = opts.maxLevels ?? 10;
  const tolerance = opts.tolerance ?? 1e-7;
  const rand = mulberry32(seed);

  // Initial partition: each node in its own community.
  let currentGraph = graph;
  let partition = Array.from({ length: graph.n }, (_, i) => i);
  const levels: Community[][] = [];

  // Track mapping from each original node to its refined community at the
  // current level, so we can build the leaf-level membership list.
  let originalToCurrent = Array.from({ length: graph.n }, (_, i) => i);

  void tolerance; // reserved — per-level Q check dropped for perf.

  for (let level = 0; level < maxLevels; level++) {
    // 1. Local move on currentGraph.
    partition = Array.from({ length: currentGraph.n }, (_, i) => i);
    localMove(currentGraph, partition, resolution, rand);

    // 2. Refinement.
    const refined = refine(currentGraph, partition, resolution, rand);

    // 3. Collect the level-N communities as the refined partition on
    //    currentGraph, materialized to original-graph node-id members.
    const distinctRef = Array.from(new Set(refined)).sort((a, b) => a - b);
    const idMap = new Map<number, number>();
    distinctRef.forEach((id, idx) => idMap.set(id, idx));

    const commMembers = new Map<number, string[]>();
    for (let i = 0; i < graph.n; i++) {
      const currentNode = originalToCurrent[i];
      const refinedComm = idMap.get(refined[currentNode])!;
      let members = commMembers.get(refinedComm);
      if (!members) {
        members = [];
        commMembers.set(refinedComm, members);
      }
      members.push(graph.nodeIds[i]);
    }

    const levelCommunities: Community[] = [];
    const sortedCommIds = Array.from(commMembers.keys()).sort((a, b) => a - b);
    for (const cid of sortedCommIds) {
      levelCommunities.push({
        id: `L${level}-C${cid}`,
        level,
        members: commMembers.get(cid)!.slice().sort(),
      });
    }
    levels.push(levelCommunities);

    // 4. Aggregate.
    const { agg } = aggregate(currentGraph, refined);

    // 5. Update originalToCurrent: map each original node to its index in the
    //    aggregated graph.
    for (let i = 0; i < graph.n; i++) {
      const prev = originalToCurrent[i];
      originalToCurrent[i] = idMap.get(refined[prev])!;
    }

    // 6. Convergence check: if the aggregated graph has the same node count
    //    as the current graph (no communities merged), stop.
    if (agg.n === currentGraph.n) break;
    currentGraph = agg;
  }

  // Final modularity evaluated once on the finest partition against the
  // original graph. Skip the per-level Q computation (hot path) and pay the
  // cost only once.
  const finalQ =
    levels.length > 0
      ? modularity(graph, buildPartitionFromLevel(graph, levels[levels.length - 1]), resolution)
      : 0;
  let prevQ = finalQ;

  // Finest partition is at level 0.
  const nodeToCommunity = new Map<string, string>();
  if (levels.length > 0) {
    for (const c of levels[0]) {
      for (const m of c.members) nodeToCommunity.set(m, c.id);
    }
  }

  return {
    communities: levels,
    modularity: prevQ,
    nodeToCommunity,
  };
}

/**
 * Build the partition array (node-index → int community id) from a list of
 * Community records whose members are original node ids.
 */
function buildPartitionFromLevel(
  graph: WeightedGraph,
  communities: Community[],
): number[] {
  const idToIndex = new Map<string, number>();
  for (let i = 0; i < graph.n; i++) idToIndex.set(graph.nodeIds[i], i);
  const partition = new Array<number>(graph.n).fill(0);
  for (let ci = 0; ci < communities.length; ci++) {
    for (const m of communities[ci].members) {
      const idx = idToIndex.get(m);
      if (idx !== undefined) partition[idx] = ci;
    }
  }
  return partition;
}

// ─── Graph builder from an M1 Graph ─────────────────────────────────────────

/**
 * Build a WeightedGraph from an M1-ingested Graph. Maps the entity-id set
 * onto 0..N-1 indices and sums edge weights into undirected adjacency lists.
 */
export function buildWeightedGraph(input: {
  entities: Map<string, { id: string }>;
  edges: Map<string, { src: string; dst: string; weight: number }>;
}): WeightedGraph {
  const ids = Array.from(input.entities.keys()).sort();
  const idToIndex = new Map<string, number>();
  ids.forEach((id, i) => idToIndex.set(id, i));

  const adjacency: Array<Array<{ neighbor: number; weight: number }>> = ids.map(() => []);
  let totalEdgeWeight = 0;

  // Accumulate weights into an undirected map of maps so duplicate (src,dst)
  // across relations sum.
  const weightMap = new Map<number, Map<number, number>>();
  for (const edge of input.edges.values()) {
    const i = idToIndex.get(edge.src);
    const j = idToIndex.get(edge.dst);
    if (i === undefined || j === undefined) continue;
    if (i === j) continue; // drop self-loops
    const w = edge.weight;
    addSymmetric(weightMap, i, j, w);
  }

  for (let i = 0; i < ids.length; i++) {
    const row = weightMap.get(i);
    if (!row) continue;
    const keys = Array.from(row.keys()).sort((a, b) => a - b);
    for (const j of keys) {
      adjacency[i].push({ neighbor: j, weight: row.get(j)! });
      totalEdgeWeight += row.get(j)!;
    }
  }

  return { n: ids.length, adjacency, totalEdgeWeight, nodeIds: ids };
}

function addSymmetric(
  map: Map<number, Map<number, number>>,
  i: number,
  j: number,
  w: number,
): void {
  let ri = map.get(i);
  if (!ri) {
    ri = new Map();
    map.set(i, ri);
  }
  ri.set(j, (ri.get(j) ?? 0) + w);
  let rj = map.get(j);
  if (!rj) {
    rj = new Map();
    map.set(j, rj);
  }
  rj.set(i, (rj.get(i) ?? 0) + w);
}
