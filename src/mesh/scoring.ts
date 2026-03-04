/**
 * Pure scoring functions for mesh node routing.
 *
 * scoreNode(), rankNodes(), and selectWithFallback() compute deterministic
 * routing scores based on capability match, load, and historical performance.
 *
 * IMP-06: Zero IO imports. No node:fs, node:net, node:http, fetch, Date.now,
 * randomUUID, or any async module. Pure deterministic logic only.
 *
 * IMP-03: All weight constants exported with rationale.
 */

import type { MeshNode } from './types.js';
import type { NodeScore } from './routing-types.js';

// ============================================================================
// IMP-03 Constants: Scoring Weights
// ============================================================================

/**
 * Weight for capability match in total score calculation.
 * 0.4 -- capability is critical: a node that can't run the chip at all scores 0.
 */
export const CAPABILITY_WEIGHT = 0.4;

/**
 * Weight for load factor in total score calculation.
 * 0.2 -- load is a tie-breaker: all else equal, prefer less loaded nodes.
 */
export const LOAD_WEIGHT = 0.2;

/**
 * Weight for historical performance (pass rate) in total score calculation.
 * 0.4 -- performance matters as much as capability: a capable but unreliable
 * node should not be preferred over one with a strong track record.
 */
export const PERFORMANCE_WEIGHT = 0.4;

// ============================================================================
// scoreNode
// ============================================================================

/**
 * Computes a deterministic numeric score for a given node against a task requirement.
 *
 * @param node - Mesh node to score
 * @param requirement - Required chipName and minimum context length
 * @param load - Current load factor 0-1 (0 = idle, 1 = fully loaded)
 * @param passRate - Historical pass rate 0-1
 * @returns NodeScore with individual and weighted total scores
 */
export function scoreNode(
  node: MeshNode,
  requirement: { chipName: string; minContextLength: number },
  load: number,
  passRate: number,
): NodeScore {
  // Capability score: 1 if chipName found and context sufficient, 0 otherwise
  const matchingCap = node.capabilities.find(
    (cap) => cap.chipName === requirement.chipName,
  );

  let capabilityScore: number;
  let chipName: string;

  if (!matchingCap) {
    capabilityScore = 0;
    chipName = requirement.chipName;
  } else if (matchingCap.maxContextLength < requirement.minContextLength) {
    capabilityScore = 0;
    chipName = matchingCap.chipName;
  } else {
    capabilityScore = 1.0;
    chipName = matchingCap.chipName;
  }

  // Load score: higher is better (less loaded)
  const loadScore = 1 - load;

  // Performance score: direct pass rate
  const performanceScore = passRate;

  // Weighted total
  const totalScore =
    CAPABILITY_WEIGHT * capabilityScore +
    LOAD_WEIGHT * loadScore +
    PERFORMANCE_WEIGHT * performanceScore;

  // Build justification
  const parts: string[] = [];
  if (capabilityScore === 0 && !matchingCap) {
    parts.push(`chip '${requirement.chipName}' not found`);
  } else if (capabilityScore === 0) {
    parts.push(
      `context ${matchingCap!.maxContextLength} < required ${requirement.minContextLength}`,
    );
  } else {
    parts.push(`chip '${chipName}' capable`);
  }
  parts.push(`load=${load.toFixed(2)}`);
  parts.push(`passRate=${passRate.toFixed(2)}`);
  parts.push(`total=${totalScore.toFixed(3)}`);

  return {
    nodeId: node.nodeId,
    chipName,
    capabilityScore,
    loadScore,
    performanceScore,
    totalScore,
    justification: parts.join(', '),
  };
}

// ============================================================================
// rankNodes
// ============================================================================

/**
 * Ranks mesh nodes by suitability for a task requirement.
 *
 * @param nodes - Array of mesh nodes to evaluate
 * @param requirement - Required chipName and minimum context length
 * @param loads - Map of nodeId -> current load (0-1)
 * @param passRates - Map of nodeId -> historical pass rate (0-1)
 * @returns NodeScore[] sorted by totalScore descending
 */
export function rankNodes(
  nodes: MeshNode[],
  requirement: { chipName: string; minContextLength: number },
  loads: Map<string, number>,
  passRates: Map<string, number>,
): NodeScore[] {
  return nodes
    .map((node) =>
      scoreNode(
        node,
        requirement,
        loads.get(node.nodeId) ?? 0,
        passRates.get(node.nodeId) ?? 0,
      ),
    )
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ============================================================================
// selectWithFallback
// ============================================================================

/**
 * Selects the top-ranked node as target and the second-ranked as fallback.
 *
 * @param ranked - NodeScore[] sorted by totalScore descending
 * @returns { target, fallback } where fallback is undefined if only one node
 */
export function selectWithFallback(
  ranked: NodeScore[],
): { target: NodeScore; fallback?: NodeScore } {
  return {
    target: ranked[0],
    fallback: ranked.length > 1 ? ranked[1] : undefined,
  };
}
