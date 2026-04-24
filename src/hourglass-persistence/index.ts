/**
 * Hourglass-Persistence Audit — T2b primitive (MATH-18, Phase 750, CAPCOM standard gate).
 *
 * Contraction-index / hourglass-persistence alarm on a read-only directed
 * skill graph per arXiv:2604.17548 (Ji 2026, bib key `ji2026hourglass`) and M4
 * §sec:m4-hourglass / alg:hourglass-skill-dag.
 *
 * Ships:
 *   - a topological-hole detector (persistent-homology-inspired; simplified
 *     to back-edge cycle detection with edge-weight-span persistence);
 *   - a per-vertex contraction-index computation (`index =
 *     componentsAfter / componentsBefore`);
 *   - a structured audit-finding emitter;
 *   - a composition helper (`computeJointSignal`) that combines Phase 746's
 *     Ricci edge-curvatures with this phase's contraction indices into a
 *     joint bottleneck-∧-waist signal.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "hourglass-persistence": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, no subsystem behaviour changes: the module
 * is a bag of pure functions that execute only when callers invoke them.
 * `isHourglassPersistenceEnabled()` returns false in the default state, and
 * importing the module performs no work.
 *
 * ## Explicit non-goals
 *
 * This module **DOES NOT**:
 *   - write to the skill library / skill storage (audit is purely
 *     read-only over its input graph);
 *   - modify CAPCOM gates, gate-state records, or any orchestration surface;
 *   - emit bypass / override / reorganisation actions;
 *   - perform any I/O — no file-system mutation of any kind; the audit is
 *     pure in-memory computation over its input graph;
 *   - implement a full Vietoris-Rips persistent-homology pipeline; an
 *     edge-weight-filtered back-edge cycle detector plus a vertex-removal
 *     connectivity analysis is sufficient for audit-scale skill graphs
 *     (documented in `hole-detector.ts`). A fully-faithful persistence
 *     pipeline is Phase-753+ work.
 *
 * Audit findings are **advisory-only**: CAPCOM retains final gate authority.
 *
 * @module hourglass-persistence
 */

export type {
  ContractionIndex,
  EdgeCurvature,
  HourglassFinding,
  JointSignal,
  ObservatoryEvent,
  SkillDag,
  TopologicalHole,
} from './types.js';

export type { HourglassPersistenceConfig } from './settings.js';

export {
  DEFAULT_HOURGLASS_PERSISTENCE_CONFIG,
  isHourglassPersistenceEnabled,
  readHourglassPersistenceConfig,
} from './settings.js';

export {
  detectHoles,
  persistence,
} from './hole-detector.js';

export {
  DEFAULT_STRONG_WAIST_THRESHOLD,
  DEFAULT_WAIST_THRESHOLD,
  aggregateContractionIndex,
  computeContractionIndices,
  detectWaists,
} from './contraction-index.js';

export {
  emitFinding,
  parseFinding,
  serializeFinding,
  toObservatoryEvent,
  validateFinding,
} from './audit-finding.js';

export {
  DEFAULT_NEGATIVE_CURVATURE_THRESHOLD,
  computeJointSignal,
} from './ricci-composition.js';
