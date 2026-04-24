/**
 * Hourglass-Persistence Audit — type definitions.
 *
 * Types for the T2b contraction-index / hourglass-persistence audit per
 * arXiv:2604.17548 (Ji 2026) and M4 §sec:m4-hourglass /
 * alg:hourglass-skill-dag.
 *
 * All types are pure data — no side effects, no I/O, no downstream
 * orchestration surface interaction. The audit consumes a read-only directed
 * graph and emits structured findings.
 *
 * The underlying graph type `SkillDag` is re-exported (type-only) from the
 * Phase 746 sibling primitive so the two audits share a single source of
 * truth for the graph shape; this is a build-time dependency only.
 *
 * @module hourglass-persistence/types
 */

import type { EdgeCurvature, SkillDag } from '../ricci-curvature-audit/types.js';

export type { EdgeCurvature, SkillDag };

/**
 * One per-vertex contraction-index record. Output of
 * `computeContractionIndices`.
 *
 * `index = componentsAfter / componentsBefore` where components are computed
 * on the underlying undirected graph. `index > 1` means the vertex is a
 * waist (its removal increased connected-component count);
 * `index > 2` is a strong waist.
 */
export interface ContractionIndex {
  readonly vertex: string;
  readonly index: number;
  readonly componentsBefore: number;
  readonly componentsAfter: number;
}

/**
 * One topological-hole record. Output of `detectHoles`.
 *
 * `vertices` are the cycle vertices (undirected projection). `persistence`
 * is the birth-death span of the cycle under edge-weight filtration —
 * max − min edge weight within the cycle; larger persistence ⇒ more
 * prominent 1-hole.
 */
export interface TopologicalHole {
  readonly vertices: ReadonlyArray<string>;
  readonly persistence: number;
  readonly kind: '1-hole' | 'persistent-hole';
}

/**
 * Structured audit-finding emitted by the Hourglass-Persistence audit.
 * Consumable by downstream observatory / telemetry pipelines.
 *
 * `type` derivation:
 *   - any waist present (index > threshold) → 'waist'
 *   - no waist but at least one 1-hole present → 'hole'
 *   - otherwise → 'healthy'
 */
export interface HourglassFinding {
  readonly findingId: string;
  readonly type: 'waist' | 'hole' | 'healthy';
  readonly contractionIndices: ReadonlyArray<ContractionIndex>;
  readonly holes: ReadonlyArray<TopologicalHole>;
  readonly summary: string;
  readonly timestamp: string;
}

/**
 * Joint-signal record produced by `computeJointSignal` in
 * `ricci-composition.ts`. Surfaces vertices that are BOTH the target of a
 * negative-Ricci-curvature edge AND a hourglass waist — the "choke-point"
 * finding class of M4 §sec:m4-hourglass ¶ Composition with the Ricci audit.
 */
export interface JointSignal {
  readonly vertex: string;
  readonly negativeEdgeCurvatures: ReadonlyArray<EdgeCurvature>;
  readonly contractionIndex: number;
  readonly severity: 'low' | 'medium' | 'high';
}

/**
 * Adapter-event shape matching `tools/session-retro/observe.mjs` contract.
 */
export interface ObservatoryEvent {
  readonly t: string;
  readonly kind: string;
  readonly label: string;
  readonly payload: Record<string, unknown>;
}
