/**
 * Hourglass-Persistence Audit — composition with the Phase 746 Ricci audit.
 *
 * Joins outputs of the T1b Ricci-curvature audit (`EdgeCurvature[]`) with
 * the T2b contraction-index list (`ContractionIndex[]`) into per-vertex
 * `JointSignal[]`. A vertex is a joint bottleneck-∧-waist when it is the
 * target of at least one negative-curvature edge AND has contraction index
 * above the waist threshold.
 *
 * Per M4 §sec:m4-hourglass ¶ Composition with the Ricci audit:
 *   "contraction indices and discrete curvatures are complementary: an
 *    edge can be a Ricci bottleneck without being a hourglass waist, or
 *    be a waist without being a bottleneck."
 *
 * The joint signal surfaces the intersection — the highest-priority
 * finding class.
 *
 * Pure function; no side effects; no cross-module control flow.
 *
 * @module hourglass-persistence/ricci-composition
 */

import type {
  ContractionIndex,
  EdgeCurvature,
  JointSignal,
} from './types.js';
import { DEFAULT_WAIST_THRESHOLD, DEFAULT_STRONG_WAIST_THRESHOLD } from './contraction-index.js';

/**
 * Default negative-curvature threshold. Edges with κ strictly less than
 * the negation of this threshold are treated as Ricci bottlenecks. Matches
 * the Phase 746 default.
 */
export const DEFAULT_NEGATIVE_CURVATURE_THRESHOLD = 0.1;

/**
 * Compute the joint-signal list from Phase 746 Ricci edge-curvatures and
 * Phase 750 contraction indices.
 *
 * A vertex appears in the output IFF:
 *   1. some edge `(u, v)` in `curvatures` has `v === vertex` and
 *      `κ < −curvatureThreshold`;
 *   2. `indices[vertex].index > indexThreshold`.
 *
 * Severity:
 *   - `high`   — strong waist (index ≥ 2.0) AND ≥2 negative-curvature edges
 *   - `medium` — waist with ≥1 negative-curvature edge
 *   - `low`    — otherwise (still a match but borderline)
 *
 * @param curvatures Phase 746 edge-curvature list (read-only).
 * @param indices Phase 750 contraction-index list (read-only).
 * @param curvatureThreshold Negative-curvature threshold (default 0.1).
 * @param indexThreshold Waist threshold (default 1.0).
 */
export function computeJointSignal(
  curvatures: ReadonlyArray<EdgeCurvature>,
  indices: ReadonlyArray<ContractionIndex>,
  curvatureThreshold: number = DEFAULT_NEGATIVE_CURVATURE_THRESHOLD,
  indexThreshold: number = DEFAULT_WAIST_THRESHOLD,
): JointSignal[] {
  const kappaTheta = Number.isFinite(curvatureThreshold) && curvatureThreshold >= 0
    ? curvatureThreshold
    : DEFAULT_NEGATIVE_CURVATURE_THRESHOLD;
  const idxTheta = Number.isFinite(indexThreshold) && indexThreshold >= 0
    ? indexThreshold
    : DEFAULT_WAIST_THRESHOLD;

  // Group negative-curvature edges by target vertex.
  const negByTarget = new Map<string, EdgeCurvature[]>();
  for (const e of curvatures) {
    if (e.kappa < -kappaTheta) {
      const list = negByTarget.get(e.target) ?? [];
      list.push(e);
      negByTarget.set(e.target, list);
    }
  }

  // Index-by-vertex lookup.
  const indexByVertex = new Map<string, ContractionIndex>();
  for (const rec of indices) indexByVertex.set(rec.vertex, rec);

  const out: JointSignal[] = [];
  for (const [vertex, edges] of negByTarget) {
    const rec = indexByVertex.get(vertex);
    if (!rec) continue;
    if (rec.index <= idxTheta) continue;
    const severity = classifySeverity(rec.index, edges.length);
    out.push({
      vertex,
      negativeEdgeCurvatures: edges,
      contractionIndex: rec.index,
      severity,
    });
  }

  // Sort: high severity first, then by contraction index descending.
  const severityRank = { high: 2, medium: 1, low: 0 } as const;
  out.sort((a, b) => {
    const sa = severityRank[a.severity];
    const sb = severityRank[b.severity];
    if (sa !== sb) return sb - sa;
    return b.contractionIndex - a.contractionIndex;
  });
  return out;
}

function classifySeverity(
  index: number,
  nNegativeEdges: number,
): JointSignal['severity'] {
  if (index >= DEFAULT_STRONG_WAIST_THRESHOLD && nNegativeEdges >= 2) return 'high';
  if (index > DEFAULT_WAIST_THRESHOLD && nNegativeEdges >= 1) return 'medium';
  return 'low';
}
