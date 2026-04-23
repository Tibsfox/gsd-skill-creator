/**
 * Reasoning Graphs — core graph operations.
 *
 * Pure functions. No I/O. An in-memory graph representation; callers
 * decide on persistence (filesystem, database, Grove). This keeps the
 * library dependency-free and testable in isolation.
 *
 * @module reasoning-graphs/graph
 */

import type {
  EvidenceNode,
  ReasoningEdge,
  Judgment,
  JudgmentHistory,
  JudgmentHistoryInput,
  TraversalResult,
} from './types.js';
import { ALL_JUDGMENTS } from './types.js';

/**
 * Compute the judgment history for a specific evidence node by aggregating
 * every edge that has this node as the target.
 */
export function buildJudgmentHistory(input: JudgmentHistoryInput): JudgmentHistory {
  const relevant = input.edges.filter((e) => e.toEvidence === input.evidenceId);

  const byJudgment: Record<Judgment, number> = {
    supports: 0,
    refutes: 0,
    ambiguous: 0,
    irrelevant: 0,
  };
  let confSum = 0;
  let firstTs: string | null = null;
  let lastTs: string | null = null;

  for (const e of relevant) {
    byJudgment[e.judgment]++;
    confSum += e.confidence;
    if (firstTs == null || e.timestamp < firstTs) firstTs = e.timestamp;
    if (lastTs == null || e.timestamp > lastTs) lastTs = e.timestamp;
  }

  const averageConfidence = relevant.length > 0 ? confSum / relevant.length : 0;

  // judgmentDrift: fraction of edges whose judgment differs from the modal judgment.
  // 0 = all edges agree; 1 = no modal judgment exists (perfect disagreement).
  let judgmentDrift = 0;
  if (relevant.length > 0) {
    let maxCount = 0;
    for (const j of ALL_JUDGMENTS) {
      if (byJudgment[j] > maxCount) maxCount = byJudgment[j];
    }
    judgmentDrift = 1 - maxCount / relevant.length;
  }

  return {
    evidenceId: input.evidenceId,
    edges: relevant,
    byJudgment,
    averageConfidence,
    judgmentDrift,
    firstJudgment: firstTs,
    lastJudgment: lastTs,
  };
}

/**
 * Traverse outward from a root evidence node, following edges whose confidence
 * exceeds a threshold. Returns visited node IDs and the edges used.
 *
 * Breadth-first; respects maxDepth. Cycles are prevented by visited tracking.
 */
export function traverseEvidence(
  rootId: string,
  nodes: EvidenceNode[],
  edges: ReasoningEdge[],
  opts: { maxDepth?: number; minConfidence?: number } = {},
): TraversalResult {
  const maxDepth = opts.maxDepth ?? 3;
  const minConfidence = opts.minConfidence ?? 0.5;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>([rootId]);
  const edgesTraversed: ReasoningEdge[] = [];

  type Frontier = { id: string; depth: number };
  const queue: Frontier[] = [{ id: rootId, depth: 0 }];
  let head = 0;

  while (head < queue.length) {
    const { id, depth } = queue[head++];
    if (!nodeById.has(id)) continue;
    if (depth >= maxDepth) continue;
    const outgoing = edges.filter((e) => e.fromEvidence === id && e.confidence >= minConfidence);
    for (const e of outgoing) {
      edgesTraversed.push(e);
      if (!visited.has(e.toEvidence)) {
        visited.add(e.toEvidence);
        queue.push({ id: e.toEvidence, depth: depth + 1 });
      }
    }
  }

  const aggregateConfidence =
    edgesTraversed.length > 0
      ? edgesTraversed.reduce((a, e) => a + e.confidence, 0) / edgesTraversed.length
      : 0;

  return {
    rootId,
    visited: [...visited],
    edgesTraversed,
    aggregateConfidence,
  };
}

/** Modal judgment from a history (supports, refutes, etc.), or null if tied at zero. */
export function modalJudgment(history: JudgmentHistory): Judgment | null {
  let best: Judgment | null = null;
  let bestCount = 0;
  for (const j of ALL_JUDGMENTS) {
    if (history.byJudgment[j] > bestCount) {
      bestCount = history.byJudgment[j];
      best = j;
    }
  }
  return best;
}

/** Detect whether judgment has flipped between the first and last edge (drift signal). */
export function hasJudgmentFlipped(history: JudgmentHistory): boolean {
  if (history.edges.length < 2) return false;
  const sorted = [...history.edges].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return sorted[0].judgment !== sorted[sorted.length - 1].judgment;
}
