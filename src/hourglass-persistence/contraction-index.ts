/**
 * Hourglass-Persistence Audit — contraction-index computation.
 *
 * Per-vertex contraction index per M4 §sec:m4-hourglass /
 * alg:hourglass-skill-dag: `index = componentsAfter / componentsBefore`
 * where components are measured on the underlying undirected graph and
 * `componentsAfter` is the count after removing the vertex.
 *
 * Waists: vertices whose removal disconnects the graph (index > 1).
 * Strong waists: vertices whose removal increases the count by ≥2×
 * (index ≥ 2).
 *
 * Pure function; no side effects.
 *
 * @module hourglass-persistence/contraction-index
 */

import type { ContractionIndex, SkillDag } from './types.js';

/**
 * Default waist threshold. Vertices with index strictly greater than this
 * are surfaced as waists. Matches M4 fixture semantics (strict increase
 * in components on removal).
 */
export const DEFAULT_WAIST_THRESHOLD = 1.0;

/**
 * Default strong-waist threshold. Index ≥ this is flagged as a strong
 * hourglass waist.
 */
export const DEFAULT_STRONG_WAIST_THRESHOLD = 2.0;

/**
 * Compute the contraction index for every vertex in the DAG.
 *
 * Operates on the underlying undirected graph: `index = componentsAfter /
 * componentsBefore`. Vertices in the empty graph receive `index = 1`.
 */
export function computeContractionIndices(dag: SkillDag): ContractionIndex[] {
  const adj = buildUndirectedAdjacency(dag);
  const before = countComponents(dag.vertices, adj);
  const out: ContractionIndex[] = [];
  for (const v of dag.vertices) {
    const reducedVertices = new Set<string>();
    for (const u of dag.vertices) if (u !== v) reducedVertices.add(u);
    const reducedAdj = new Map<string, Set<string>>();
    for (const [u, ns] of adj) {
      if (u === v) continue;
      const filtered = new Set<string>();
      for (const n of ns) if (n !== v) filtered.add(n);
      reducedAdj.set(u, filtered);
    }
    const after = countComponents(reducedVertices, reducedAdj);
    const beforeClamped = Math.max(before, 1);
    const afterClamped = Math.max(after, 0);
    const index = afterClamped === 0 ? 1 : afterClamped / beforeClamped;
    out.push({
      vertex: v,
      index,
      componentsBefore: before,
      componentsAfter: after,
    });
  }
  // Sort descending by index so the highest waists surface first.
  out.sort((a, b) => b.index - a.index);
  return out;
}

/**
 * Filter indices to those that qualify as waists (index > threshold).
 * Returns a descending-sorted list.
 */
export function detectWaists(
  indices: ReadonlyArray<ContractionIndex>,
  threshold: number = DEFAULT_WAIST_THRESHOLD,
): ContractionIndex[] {
  const theta = Number.isFinite(threshold) && threshold >= 0
    ? threshold
    : DEFAULT_WAIST_THRESHOLD;
  const out: ContractionIndex[] = [];
  for (const rec of indices) {
    if (rec.index > theta) out.push(rec);
  }
  out.sort((a, b) => b.index - a.index);
  return out;
}

/**
 * Aggregate contraction-index: the maximum per-vertex index. A single
 * scalar summary of hourglass-shaped topology (M4 `chi`).
 */
export function aggregateContractionIndex(
  indices: ReadonlyArray<ContractionIndex>,
): number {
  let max = 1;
  for (const rec of indices) {
    if (rec.index > max) max = rec.index;
  }
  return max;
}

// ---------- internal ----------

function buildUndirectedAdjacency(dag: SkillDag): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const v of dag.vertices) adj.set(v, new Set());
  for (const [u, outs] of dag.edges) {
    if (!adj.has(u)) adj.set(u, new Set());
    for (const w of outs) {
      if (u === w) continue;
      if (!adj.has(w)) adj.set(w, new Set());
      adj.get(u)!.add(w);
      adj.get(w)!.add(u);
    }
  }
  return adj;
}

function countComponents(
  vertices: ReadonlySet<string>,
  adj: ReadonlyMap<string, ReadonlySet<string>>,
): number {
  const seen = new Set<string>();
  let count = 0;
  for (const v of vertices) {
    if (seen.has(v)) continue;
    count++;
    // BFS from v.
    const queue: string[] = [v];
    while (queue.length > 0) {
      const u = queue.shift()!;
      if (seen.has(u)) continue;
      seen.add(u);
      const ns = adj.get(u);
      if (!ns) continue;
      for (const n of ns) {
        if (!seen.has(n) && vertices.has(n)) queue.push(n);
      }
    }
  }
  return count;
}
