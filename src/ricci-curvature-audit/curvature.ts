/**
 * Ricci-Curvature Audit — edge-curvature computation.
 *
 * Implements the directed Ollivier-Ricci edge curvature
 *
 *   κ(u, v) = 1 − W₁(μ_u, μ_v) / d(u, v)
 *
 * per arXiv:2604.14211 (Wiesler 2026) and M4 §sec:m4-ollivier. The
 * out-neighbour lazy-walk measure μ_u is
 *
 *   μ_u = { u → p } ∪ { v' → (1 − p) · w(u, v') / Z : v' ∈ out(u) }
 *
 * for laziness p ∈ (0, 1), normalising constant Z = Σ w(u, v'), and sink
 * handling μ_u = { u → 1 } when out(u) is empty.
 *
 * d is the directed all-pairs shortest-path distance. For a vertex pair with
 * no directed path, d = +∞ and the edge is not produced in the output.
 *
 * Pure functions; no side effects.
 *
 * @module ricci-curvature-audit/curvature
 */

import type { EdgeCurvature, ProbabilityMeasure, SkillDag } from './types.js';
import { wasserstein1 } from './wasserstein.js';

const DEFAULT_LAZINESS = 0.5;

function edgeWeight(u: string, v: string, dag: SkillDag): number {
  const w = dag.edgeWeights?.get(`${u}->${v}`);
  return typeof w === 'number' && Number.isFinite(w) && w > 0 ? w : 1;
}

/**
 * All-pairs directed shortest-path distance via Dijkstra from each source.
 * Returns a nested map `distance[u][v]`. Absent entries correspond to +∞.
 */
export function allPairsShortestPath(
  dag: SkillDag,
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  const vertices = [...dag.vertices];
  for (const source of vertices) {
    out.set(source, dijkstraFrom(source, dag));
  }
  return out;
}

function dijkstraFrom(source: string, dag: SkillDag): Map<string, number> {
  const dist = new Map<string, number>();
  dist.set(source, 0);
  // Naive O(V² + E) via repeated extract-min. Audit-scale; no pq needed.
  const visited = new Set<string>();
  while (visited.size < dag.vertices.size) {
    let bestV: string | null = null;
    let bestD = Infinity;
    for (const [v, dv] of dist) {
      if (visited.has(v)) continue;
      if (dv < bestD) {
        bestD = dv;
        bestV = v;
      }
    }
    if (bestV === null) break;
    visited.add(bestV);
    const neighbours = dag.edges.get(bestV);
    if (!neighbours) continue;
    for (const n of neighbours) {
      const w = edgeWeight(bestV, n, dag);
      const cand = bestD + w;
      const cur = dist.get(n);
      if (cur === undefined || cand < cur) dist.set(n, cand);
    }
  }
  return dist;
}

/**
 * Out-neighbour lazy-walk measure at `u` with laziness `p`.
 *
 * Sinks (no out-neighbours) resolve to `{u → 1}`, matching the M4 pseudocode
 * `mu[u] <- {u: 1}` branch for empty out-neighbour sets.
 */
export function outNeighborMeasure(
  u: string,
  dag: SkillDag,
  p: number,
): ProbabilityMeasure {
  const out: Map<string, number> = new Map();
  const neighbours = dag.edges.get(u);
  if (!neighbours || neighbours.size === 0) {
    out.set(u, 1);
    return out;
  }
  let total = 0;
  const weights: Array<[string, number]> = [];
  for (const n of neighbours) {
    const w = edgeWeight(u, n, dag);
    weights.push([n, w]);
    total += w;
  }
  if (total <= 0) {
    out.set(u, 1);
    return out;
  }
  out.set(u, p);
  const scale = 1 - p;
  for (const [n, w] of weights) {
    out.set(n, scale * (w / total));
  }
  return out;
}

/**
 * Single-edge curvature. Returns null when d(u, v) is infinite / undefined
 * (disconnected pair — not an edge-level bottleneck under the formula).
 */
export function computeEdgeCurvature(
  source: string,
  target: string,
  dag: SkillDag,
  p: number,
  distance: Map<string, Map<string, number>>,
): EdgeCurvature | null {
  const dSource = distance.get(source);
  if (!dSource) return null;
  const dUV = dSource.get(target);
  if (dUV === undefined || !Number.isFinite(dUV) || dUV <= 0) return null;

  const muU = outNeighborMeasure(source, dag, p);
  const muV = outNeighborMeasure(target, dag, p);

  const distFn = (x: string, y: string): number => {
    if (x === y) return 0;
    const row = distance.get(x);
    if (!row) return Infinity;
    const d = row.get(y);
    return d === undefined ? Infinity : d;
  };

  // Wasserstein needs a finite distance on the union support. Replace
  // unreachable pairs with a large finite penalty derived from the DAG
  // diameter so the LP stays well-posed; unreachable in the directed walk
  // is a well-defined bottleneck signal rather than an invalid input.
  const diameter = estimateDiameter(distance);
  const penalty = diameter * 4 + 1;
  const distFnBounded = (x: string, y: string): number => {
    const v = distFn(x, y);
    return Number.isFinite(v) ? v : penalty;
  };

  const w1 = wasserstein1(muU, muV, distFnBounded);
  const kappa = 1 - w1 / dUV;
  return {
    source,
    target,
    kappa,
    wassersteinDistance: w1,
    geodesicDistance: dUV,
  };
}

function estimateDiameter(distance: Map<string, Map<string, number>>): number {
  let diameter = 0;
  for (const row of distance.values()) {
    for (const d of row.values()) {
      if (Number.isFinite(d) && d > diameter) diameter = d;
    }
  }
  return diameter > 0 ? diameter : 1;
}

export interface ComputeCurvatureOptions {
  laziness?: number;
}

/**
 * Compute κ for every edge in the input DAG. Returns one record per edge;
 * edges with undefined curvature (e.g., d = ∞) are skipped.
 */
export function computeCurvature(
  dag: SkillDag,
  options: ComputeCurvatureOptions = {},
): EdgeCurvature[] {
  const p = clampLaziness(options.laziness);
  const distance = allPairsShortestPath(dag);
  const out: EdgeCurvature[] = [];
  for (const [u, targets] of dag.edges) {
    for (const v of targets) {
      const rec = computeEdgeCurvature(u, v, dag, p, distance);
      if (rec !== null) out.push(rec);
    }
  }
  return out;
}

function clampLaziness(raw: number | undefined): number {
  const p = typeof raw === 'number' && Number.isFinite(raw) ? raw : DEFAULT_LAZINESS;
  if (p <= 0) return 1e-6;
  if (p >= 1) return 1 - 1e-6;
  return p;
}
