/**
 * Cost-aware routing policy for mesh task orchestration.
 *
 * applyCostPolicy() favors local node execution when the local node's
 * historical pass rate exceeds LOCAL_PASS_RATE_THRESHOLD (default 0.70),
 * implementing MESH-05 / ADVN-03.
 *
 * IMP-06: Zero IO imports. No node:fs, node:net, node:http, fetch, Date.now,
 * randomUUID, or any async module. Pure deterministic logic only.
 *
 * IMP-03: LOCAL_PASS_RATE_THRESHOLD exported with rationale.
 */

import type { MeshNode } from './types.js';
import type { RoutingDecision } from './routing-types.js';
import { scoreNode, rankNodes, selectWithFallback } from './scoring.js';

// ============================================================================
// IMP-03 Constants
// ============================================================================

/**
 * Local pass rate threshold for cost-aware routing.
 * 0.70 -- when the local node passes 70%+ of tasks, local execution is
 * preferred to save cost. Below this, cloud execution is preferred because
 * local model quality is insufficient to justify the cost savings.
 */
export const LOCAL_PASS_RATE_THRESHOLD = 0.70;

// ============================================================================
// applyCostPolicy
// ============================================================================

/**
 * Applies cost-aware routing policy to select the best node for a task.
 *
 * Logic:
 * 1. If no nodes available, return error decision (no throw)
 * 2. If local node exists and its pass rate >= threshold, prefer local
 * 3. Otherwise, use standard scoring across all nodes
 *
 * @param nodes - Available mesh nodes
 * @param requirement - Required chipName and minContextLength
 * @param loads - Map of nodeId -> current load (0-1)
 * @param passRates - Map of nodeId -> historical pass rate (0-1)
 * @param localNodeId - ID of the local node
 * @param config - Optional: override localPassRateThreshold
 * @returns RoutingDecision with target, optional fallback, and justification
 */
export function applyCostPolicy(
  nodes: MeshNode[],
  requirement: { chipName: string; minContextLength: number },
  loads: Map<string, number>,
  passRates: Map<string, number>,
  localNodeId: string,
  config?: { localPassRateThreshold?: number },
): RoutingDecision {
  const threshold = config?.localPassRateThreshold ?? LOCAL_PASS_RATE_THRESHOLD;

  // No nodes available
  if (nodes.length === 0) {
    return {
      taskId: '',
      target: {
        nodeId: '',
        chipName: requirement.chipName,
        capabilityScore: 0,
        loadScore: 0,
        performanceScore: 0,
        totalScore: 0,
        justification: 'No healthy nodes available',
      },
      routingJustification: 'No healthy nodes available',
    };
  }

  // Check local node preference
  const localNode = nodes.find((n) => n.nodeId === localNodeId);
  const localPassRate = passRates.get(localNodeId) ?? 0;

  if (localNode && localPassRate >= threshold) {
    // Local node qualifies -- score it and find a fallback from remaining nodes
    const localScore = scoreNode(
      localNode,
      requirement,
      loads.get(localNodeId) ?? 0,
      localPassRate,
    );

    // Rank remaining nodes for fallback
    const remaining = nodes.filter((n) => n.nodeId !== localNodeId);
    let fallback: RoutingDecision['fallback'];
    if (remaining.length > 0) {
      const ranked = rankNodes(remaining, requirement, loads, passRates);
      fallback = ranked[0];
    }

    return {
      taskId: '',
      target: localScore,
      fallback,
      routingJustification: `Local node '${localNode.name}' selected: pass rate ${localPassRate.toFixed(2)} >= threshold ${threshold.toFixed(2)} (cost-optimized)`,
    };
  }

  // Standard scoring -- local not available or below threshold
  const ranked = rankNodes(nodes, requirement, loads, passRates);
  const { target, fallback } = selectWithFallback(ranked);

  let justification: string;
  if (!localNode) {
    justification = `Local node not found in pool, standard scoring used`;
  } else {
    justification = `Local node pass rate ${localPassRate.toFixed(2)} < threshold ${threshold.toFixed(2)}, cloud-preferred scoring used`;
  }

  return {
    taskId: '',
    target,
    fallback,
    routingJustification: justification,
  };
}
