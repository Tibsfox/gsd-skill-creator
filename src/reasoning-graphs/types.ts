/**
 * Reasoning Graphs — type definitions.
 *
 * Penaroza 2026 (arXiv:2604.07595) persists per-evidence chain-of-thought
 * as structured graph edges. Traversal surfaces how specific evidence items
 * have been judged across prior runs. The pattern is self-improving without
 * retraining — the base model stays frozen, all gains come from context
 * engineering via graph traversal.
 *
 * Evidence-centric retrieval differs in kind from query-similarity retrieval:
 * instead of "find evidence similar to this query," it asks "how has this
 * specific evidence been judged before?" — so accuracy rises and variance
 * collapses across successive runs.
 *
 * For gsd-skill-creator, reasoning graphs are the substrate that makes DACP
 * bundle decisions cumulative: each bundle is a graph node whose judgment
 * accumulates across sessions.
 *
 * @module reasoning-graphs/types
 */

/** A single piece of evidence (a claim, citation, observation, or decision). */
export interface EvidenceNode {
  id: string;
  /** Human-readable description. */
  label: string;
  /** Free-form tags. */
  tags: string[];
  /** ISO-8601 timestamp of first observation. */
  firstSeen: string;
  /** ISO-8601 timestamp of most recent observation. */
  lastSeen: string;
}

/** Judgment of an evidence node at a particular moment. */
export type Judgment = 'supports' | 'refutes' | 'ambiguous' | 'irrelevant';

/** A structured edge recording a CoT judgment on evidence. */
export interface ReasoningEdge {
  id: string;
  /** Source evidence the reasoning starts from. */
  fromEvidence: string;
  /** Target evidence the reasoning concludes about. */
  toEvidence: string;
  /** How the fromEvidence was judged with respect to the target. */
  judgment: Judgment;
  /** Reasoner's confidence in [0, 1]. */
  confidence: number;
  /** The session/run in which this judgment was emitted. */
  runId: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Optional prose rationale. */
  rationale?: string;
}

/** Summary of how a specific evidence node has been judged across runs. */
export interface JudgmentHistory {
  evidenceId: string;
  edges: ReasoningEdge[];
  byJudgment: Record<Judgment, number>;
  averageConfidence: number;
  /** Drift metric: fraction of edges whose judgment differs from the modal judgment. */
  judgmentDrift: number;
  /** ISO-8601 timestamp of first edge; null if no edges. */
  firstJudgment: string | null;
  /** ISO-8601 timestamp of last edge; null if no edges. */
  lastJudgment: string | null;
}

/** Traversal result for a query. */
export interface TraversalResult {
  rootId: string;
  visited: string[];
  edgesTraversed: ReasoningEdge[];
  /** Aggregate confidence across traversal. */
  aggregateConfidence: number;
}

/** Inputs for buildJudgmentHistory. */
export interface JudgmentHistoryInput {
  evidenceId: string;
  edges: ReasoningEdge[];
}

/** All judgment values for completeness-checking. */
export const ALL_JUDGMENTS: readonly Judgment[] = ['supports', 'refutes', 'ambiguous', 'irrelevant'];
