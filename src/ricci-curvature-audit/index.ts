/**
 * Ricci-Curvature Audit — T1b primitive (MATH-14, Phase 746, CAPCOM standard gate).
 *
 * Ollivier-Ricci edge-curvature audit on a read-only directed graph per
 * arXiv:2604.14211 (Wiesler 2026, bib key `wiesler2026ollivier`) and M4
 * §sec:m4-ollivier / alg:ricci-skill-dag. Implements the directed-variant
 * formula
 *
 *   κ(u, v) = 1 − W₁(μ_u, μ_v) / d(u, v)
 *
 * with out-neighbour lazy-walk measure μ_u, discrete Wasserstein-1 core,
 * and a negative-curvature bottleneck detector. Emits structured findings
 * consumable by the `tools/session-retro/observe.mjs` event pipeline.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "ricci-curvature-audit": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, no subsystem behaviour changes: the module
 * is a bag of pure functions that execute only when callers invoke them.
 * `isRicciCurvatureAuditEnabled()` returns false in the default state, and
 * importing the module performs no work.
 *
 * ## Explicit non-goals
 *
 * This module **DOES NOT**:
 *   - write to the skill library / skill storage (audit is purely
 *     read-only over its input graph);
 *   - modify CAPCOM gates, gate-state records, or any orchestration surface;
 *   - emit bypass / override / reorganisation actions;
 *   - produce false "healthy" findings: the bottleneck threshold is
 *     configurable and conservative by default (θ = 0.1) per M4 fixture;
 *   - perform any I/O — no file-system mutation of any kind; the audit is
 *     pure in-memory computation over its input graph;
 *   - implement an optimal Wasserstein-1 LP solver; an exact transportation
 *     solver for small supports (≤ 16) plus a 1D-cumulative fallback for
 *     larger supports is sufficient for audit-scale graphs (documented in
 *     `wasserstein.ts`).
 *
 * Audit findings are **advisory-only**: CAPCOM retains final gate authority.
 *
 * @module ricci-curvature-audit
 */

export type {
  AuditFinding,
  BottleneckReport,
  EdgeCurvature,
  ObservatoryEvent,
  ProbabilityMeasure,
  SkillDag,
} from './types.js';

export type { RicciCurvatureAuditConfig } from './settings.js';

export {
  DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG,
  isRicciCurvatureAuditEnabled,
  readRicciCurvatureAuditConfig,
} from './settings.js';

export { wasserstein1 } from './wasserstein.js';

export {
  allPairsShortestPath,
  computeCurvature,
  computeEdgeCurvature,
  outNeighborMeasure,
} from './curvature.js';

export {
  DEFAULT_BOTTLENECK_THRESHOLD,
  detectBottlenecks,
} from './bottleneck-detector.js';

export {
  emitFinding,
  parseFinding,
  serializeFinding,
  toObservatoryEvent,
  validateFinding,
} from './audit-finding.js';
