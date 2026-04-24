/**
 * Hourglass-Persistence Audit — topological-hole detector.
 *
 * Detects 1-holes (cycles) in a directed skill graph by operating on its
 * underlying undirected graph. Pure function; no side effects.
 *
 * ## Simplification vs. M4 `alg:hourglass-skill-dag`
 *
 * The M4 pseudocode calls for a full sublevel-set persistence pipeline
 * (boundary-matrix reduction over a filtered space). A fully-faithful
 * Vietoris-Rips implementation is overkill for audit-scale skill graphs
 * (≤ a few hundred vertices). We ship a simpler detector that produces a
 * list of 1-holes and an edge-weight-span "persistence" score per hole,
 * which is sufficient for the advisory-only audit use case of Phase 750.
 * A full persistence pipeline is Phase 753+ work.
 *
 * @module hourglass-persistence/hole-detector
 */

import type { SkillDag, TopologicalHole } from './types.js';

/**
 * Detect 1-holes (cycles) in the underlying undirected graph of the DAG.
 *
 * Uses iterative DFS; for each back-edge encountered, reconstructs the
 * cycle vertices from the DFS parent chain. Deduplicates cycles by a
 * canonical rotation of the vertex list. Multi-edges and self-loops are
 * ignored.
 */
export function detectHoles(dag: SkillDag): TopologicalHole[] {
  const adj = buildUndirectedAdjacency(dag);
  const seen = new Set<string>();
  const out: TopologicalHole[] = [];

  for (const start of dag.vertices) {
    if (seen.has(start)) continue;
    dfsCollectCycles(start, adj, seen, (cycleVertices) => {
      const canonical = canonicalKey(cycleVertices);
      if (!registeredCycles.has(canonical)) {
        registeredCycles.add(canonical);
        out.push({
          vertices: cycleVertices,
          persistence: cyclePersistence(dag, cycleVertices),
          kind: '1-hole',
        });
      }
    });
  }

  return out;
}

/**
 * Compute the persistence (birth-death span) of a single hole via
 * edge-weight filtration. Defined as `max(weight) − min(weight)` over
 * the edges in the cycle. Cycles with unit-weight edges score 0.
 */
export function persistence(dag: SkillDag, hole: TopologicalHole): number {
  return cyclePersistence(dag, hole.vertices);
}

// ---------- internal ----------

/**
 * Process-local cycle cache — scoped per `detectHoles` call by being reset
 * at the top of every invocation.
 */
const registeredCycles = new Set<string>();

function buildUndirectedAdjacency(dag: SkillDag): Map<string, Set<string>> {
  // Reset the cycle cache for each top-level detectHoles call.
  registeredCycles.clear();
  const adj = new Map<string, Set<string>>();
  for (const v of dag.vertices) adj.set(v, new Set());
  for (const [u, outs] of dag.edges) {
    if (!adj.has(u)) adj.set(u, new Set());
    for (const w of outs) {
      if (u === w) continue; // skip self-loops
      if (!adj.has(w)) adj.set(w, new Set());
      adj.get(u)!.add(w);
      adj.get(w)!.add(u);
    }
  }
  return adj;
}

function dfsCollectCycles(
  start: string,
  adj: Map<string, Set<string>>,
  seen: Set<string>,
  onCycle: (cycleVertices: string[]) => void,
): void {
  const parent = new Map<string, string | null>();
  parent.set(start, null);
  const stack: string[] = [start];

  while (stack.length > 0) {
    const u = stack.pop()!;
    if (seen.has(u)) continue;
    seen.add(u);
    const neighbours = adj.get(u) ?? new Set<string>();
    for (const v of neighbours) {
      if (!seen.has(v)) {
        parent.set(v, u);
        stack.push(v);
      } else if (parent.get(u) !== v) {
        const cycle = reconstructCycle(u, v, parent);
        if (cycle.length >= 3) {
          onCycle(cycle);
        }
      }
    }
  }
}

function reconstructCycle(
  u: string,
  v: string,
  parent: Map<string, string | null>,
): string[] {
  // Walk up from u to root, noting ancestors; then walk up from v until
  // we meet an ancestor — that's the LCA. Cycle = u-path + reversed-v-path.
  const uPath: string[] = [];
  let cur: string | null = u;
  const uAncestors = new Map<string, number>();
  while (cur !== null) {
    uAncestors.set(cur, uPath.length);
    uPath.push(cur);
    cur = parent.get(cur) ?? null;
  }
  const vPath: string[] = [];
  cur = v;
  let lcaIdx = -1;
  while (cur !== null) {
    if (uAncestors.has(cur)) {
      lcaIdx = uAncestors.get(cur)!;
      break;
    }
    vPath.push(cur);
    cur = parent.get(cur) ?? null;
  }
  if (lcaIdx < 0) return [];
  const cycle: string[] = uPath.slice(0, lcaIdx + 1);
  for (let i = vPath.length - 1; i >= 0; i--) cycle.push(vPath[i]);
  return cycle;
}

function canonicalKey(vertices: string[]): string {
  if (vertices.length === 0) return '';
  // Sorted set of vertices makes equivalent cycles collide.
  return [...new Set(vertices)].sort().join(',');
}

function cyclePersistence(dag: SkillDag, cycleVertices: ReadonlyArray<string>): number {
  if (cycleVertices.length < 2) return 0;
  const weights: number[] = [];
  for (let i = 0; i < cycleVertices.length; i++) {
    const a = cycleVertices[i];
    const b = cycleVertices[(i + 1) % cycleVertices.length];
    const w = edgeWeight(dag, a, b);
    if (w !== null) weights.push(w);
  }
  if (weights.length === 0) return 0;
  const lo = Math.min(...weights);
  const hi = Math.max(...weights);
  return hi - lo;
}

function edgeWeight(dag: SkillDag, a: string, b: string): number | null {
  const wMap = dag.edgeWeights;
  // Try both directions in the underlying undirected graph.
  const fwd = wMap?.get(`${a}->${b}`);
  const bwd = wMap?.get(`${b}->${a}`);
  if (typeof fwd === 'number') return fwd;
  if (typeof bwd === 'number') return bwd;
  // Edge exists in the graph but no weight → default 1.
  const outsA = dag.edges.get(a);
  const outsB = dag.edges.get(b);
  if ((outsA && outsA.has(b)) || (outsB && outsB.has(a))) return 1;
  return null;
}
