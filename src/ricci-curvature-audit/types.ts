/**
 * Ricci-Curvature Audit — type definitions.
 *
 * Types for the directed Ollivier-Ricci audit primitive per arXiv:2604.14211
 * (Wiesler 2026) and M4 §sec:m4-ollivier / alg:ricci-skill-dag.
 *
 * All types are pure data — no side effects, no I/O, no downstream
 * orchestration surface interaction. The audit consumes a read-only directed
 * graph and emits structured findings.
 *
 * @module ricci-curvature-audit/types
 */

/**
 * Read-only directed graph input to the audit.
 *
 * Vertices are string IDs. Edges are an adjacency map: vertex → set of
 * out-neighbours. Weights default to 1 when absent; weight key format is
 * `"${source}->${target}"`.
 */
export interface SkillDag {
  readonly vertices: ReadonlySet<string>;
  readonly edges: ReadonlyMap<string, ReadonlySet<string>>;
  readonly edgeWeights?: ReadonlyMap<string, number>;
}

/**
 * Discrete probability measure on a vertex set. Values must sum to ~1
 * (tolerated numerical drift is 1e-9).
 */
export type ProbabilityMeasure = ReadonlyMap<string, number>;

/**
 * One edge-curvature record. Output of `computeEdgeCurvature`.
 *
 * `kappa = 1 - wassersteinDistance / geodesicDistance` per M4 §sec:m4-ollivier.
 * Negative κ → candidate bottleneck.
 */
export interface EdgeCurvature {
  readonly source: string;
  readonly target: string;
  readonly kappa: number;
  readonly wassersteinDistance: number;
  readonly geodesicDistance: number;
}

/**
 * Partition of edges by curvature bucket. Output of `detectBottlenecks`.
 *
 * - `bottlenecks`: κ < -threshold (most-negative first)
 * - `nearBottlenecks`: -threshold ≤ κ < 0 (negative but above threshold)
 * - `healthy`: κ ≥ 0
 */
export interface BottleneckReport {
  readonly bottlenecks: ReadonlyArray<EdgeCurvature>;
  readonly nearBottlenecks: ReadonlyArray<EdgeCurvature>;
  readonly healthy: ReadonlyArray<EdgeCurvature>;
  readonly threshold: number;
}

/**
 * Structured audit-finding emitted by the audit. Consumable by downstream
 * observatory / telemetry pipelines.
 *
 * Schema is self-contained; no library-internal references.
 */
export interface AuditFinding {
  readonly findingId: string;
  readonly type: 'bottleneck' | 'near-bottleneck' | 'healthy';
  readonly edgesCurvatureList: ReadonlyArray<EdgeCurvature>;
  readonly threshold: number;
  readonly summary: string;
  readonly timestamp: string;
}

/**
 * Adapter-event shape matching `tools/session-retro/observe.mjs` contract.
 * See that file's `cmdEvent` function.
 */
export interface ObservatoryEvent {
  readonly t: string;
  readonly kind: string;
  readonly label: string;
  readonly payload: Record<string, unknown>;
}
