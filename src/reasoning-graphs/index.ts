/**
 * Reasoning Graphs — public API.
 *
 * Default-off module shipped by Phase 715 (v1.49.570 Convergent Substrate).
 * Source paper: Penaroza 2026, arXiv:2604.07595, "Reasoning Graphs:
 * Deterministic Agent Accuracy through Evidence-Centric Chain-of-Thought
 * Feedback".
 *
 * Persists per-evidence chain-of-thought as structured graph edges so that
 * judgment history accumulates across sessions. All exports are pure
 * functions; nothing runs on import.
 *
 * @module reasoning-graphs
 */

export type {
  EvidenceNode,
  ReasoningEdge,
  Judgment,
  JudgmentHistory,
  JudgmentHistoryInput,
  TraversalResult,
} from './types.js';

export { ALL_JUDGMENTS } from './types.js';

export {
  buildJudgmentHistory,
  traverseEvidence,
  modalJudgment,
  hasJudgmentFlipped,
} from './graph.js';
