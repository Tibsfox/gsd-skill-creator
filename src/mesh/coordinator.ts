/**
 * MeshCoordinator -- central orchestration brain for mesh task routing.
 *
 * Routes skills to optimal nodes using cost-aware policy (Plan 53-01),
 * supports parallel and pipeline dispatch, and handles automatic failover
 * when nodes fail mid-wave (MESH-04).
 *
 * MESH-01: Central task routing
 * MESH-02: Parallel and pipeline dispatch
 * MESH-04: Automatic failover to fallback node
 */

import { z } from 'zod';
import type { DiscoveryService } from './discovery.js';
import type { MeshTransport, TransportResult } from './transport.js';
import { applyCostPolicy } from './routing-policy.js';
import { scoreNode } from './scoring.js';
import type { RoutingRequest, RoutingDecision, NodeScore } from './routing-types.js';
import { NodeScoreSchema, RoutingDecisionSchema } from './routing-types.js';

// ============================================================================
// Schemas / Types
// ============================================================================

/** Result of a single task dispatch */
export const DispatchResultSchema = z.object({
  success: z.boolean(),
  decision: RoutingDecisionSchema,
  transportResult: z.any().optional(),
  failoverUsed: z.boolean().default(false),
  error: z.string().optional(),
});

/** TypeScript type for dispatch results */
export type DispatchResult = z.infer<typeof DispatchResultSchema>;

/** A single stage in a pipeline dispatch */
export interface PipelineStage {
  request: RoutingRequest;
  bundleData: string;
}

/** Result of a pipeline dispatch */
export interface PipelineResult {
  stages: DispatchResult[];
  completed: number;
  total: number;
  success: boolean;
}

// ============================================================================
// MeshCoordinator
// ============================================================================

/**
 * Central orchestration agent that routes tasks to optimal mesh nodes.
 *
 * Uses applyCostPolicy for routing decisions, MeshTransport for delivery,
 * and DiscoveryService for node pool management.
 */
export class MeshCoordinator {
  private readonly loads: Map<string, number>;
  private readonly passRates: Map<string, number>;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly transport: MeshTransport,
    private readonly localNodeId: string,
    config?: { loads?: Map<string, number>; passRates?: Map<string, number> },
  ) {
    this.loads = config?.loads ?? new Map();
    this.passRates = config?.passRates ?? new Map();
  }

  /** Update load factor for a node */
  updateLoad(nodeId: string, load: number): void {
    this.loads.set(nodeId, load);
  }

  /** Update pass rate for a node */
  updatePassRate(nodeId: string, rate: number): void {
    this.passRates.set(nodeId, rate);
  }

  // ── dispatchTask ──────────────────────────────────────────────────────────

  /**
   * Dispatches a single task to the best-scored node.
   * On primary failure with fallback available, automatically reroutes (MESH-04).
   */
  async dispatchTask(
    request: RoutingRequest,
    bundleData: string,
  ): Promise<DispatchResult> {
    const nodes = this.discoveryService.listHealthy();
    const decision = applyCostPolicy(
      nodes,
      request.requiredCapability,
      this.loads,
      this.passRates,
      this.localNodeId,
    );
    // Set taskId on decision
    decision.taskId = request.taskId;

    if (nodes.length === 0) {
      return {
        success: false,
        decision,
        failoverUsed: false,
        error: 'No healthy nodes available',
      };
    }

    // Attempt primary send
    const primaryResult = await this.transport.send(
      this.localNodeId,
      decision.target.nodeId,
      bundleData,
    );

    if (primaryResult.success) {
      return {
        success: true,
        decision,
        transportResult: primaryResult,
        failoverUsed: false,
      };
    }

    // Primary failed -- attempt failover (MESH-04)
    if (decision.fallback) {
      const fallbackResult = await this.transport.send(
        this.localNodeId,
        decision.fallback.nodeId,
        bundleData,
      );

      const updatedDecision: RoutingDecision = {
        ...decision,
        routingJustification: `${decision.routingJustification}; Primary failed (${primaryResult.error}), rerouted to fallback ${decision.fallback.nodeId}`,
      };

      return {
        success: fallbackResult.success,
        decision: updatedDecision,
        transportResult: fallbackResult,
        failoverUsed: true,
        error: fallbackResult.success
          ? undefined
          : `Fallback also failed: ${fallbackResult.error}`,
      };
    }

    // No fallback available
    return {
      success: false,
      decision,
      failoverUsed: false,
      error: `Primary failed (${primaryResult.error}), no fallback available`,
    };
  }

  // ── dispatchParallel ──────────────────────────────────────────────────────

  /**
   * Dispatches the same task to multiple specific nodes simultaneously (MESH-02).
   * Returns one DispatchResult per target node.
   */
  async dispatchParallel(
    request: RoutingRequest,
    bundleData: string,
    targetNodeIds: string[],
  ): Promise<DispatchResult[]> {
    const promises = targetNodeIds.map(async (targetNodeId) => {
      const node = this.discoveryService.getNode(targetNodeId);
      const targetScore: NodeScore = node
        ? scoreNode(
            node,
            request.requiredCapability,
            this.loads.get(targetNodeId) ?? 0,
            this.passRates.get(targetNodeId) ?? 0,
          )
        : {
            nodeId: targetNodeId,
            chipName: request.requiredCapability.chipName,
            capabilityScore: 0,
            loadScore: 0,
            performanceScore: 0,
            totalScore: 0,
            justification: `Node '${targetNodeId}' not found`,
          };

      const decision: RoutingDecision = {
        taskId: request.taskId,
        target: targetScore,
        routingJustification: `Parallel dispatch to ${targetNodeId}`,
      };

      const transportResult = await this.transport.send(
        this.localNodeId,
        targetNodeId,
        bundleData,
      );

      return {
        success: transportResult.success,
        decision,
        transportResult,
        failoverUsed: false,
        error: transportResult.success ? undefined : transportResult.error,
      } as DispatchResult;
    });

    const settled = await Promise.allSettled(promises);
    return settled.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        decision: {
          taskId: request.taskId,
          target: {
            nodeId: '',
            chipName: request.requiredCapability.chipName,
            capabilityScore: 0,
            loadScore: 0,
            performanceScore: 0,
            totalScore: 0,
            justification: 'Promise rejected',
          },
          routingJustification: `Parallel dispatch failed: ${result.reason}`,
        },
        failoverUsed: false,
        error: String(result.reason),
      } as DispatchResult;
    });
  }

  // ── dispatchPipeline ──────────────────────────────────────────────────────

  /**
   * Dispatches stages sequentially. Each stage dispatches independently.
   * Aborts on stage failure, returning partial results (MESH-02).
   */
  async dispatchPipeline(stages: PipelineStage[]): Promise<PipelineResult> {
    const results: DispatchResult[] = [];
    let completed = 0;

    for (const stage of stages) {
      const result = await this.dispatchTask(stage.request, stage.bundleData);
      results.push(result);

      if (!result.success) {
        return {
          stages: results,
          completed,
          total: stages.length,
          success: false,
        };
      }

      completed++;
    }

    return {
      stages: results,
      completed,
      total: stages.length,
      success: true,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a MeshCoordinator with the given dependencies.
 */
export function createMeshCoordinator(
  discoveryService: DiscoveryService,
  transport: MeshTransport,
  localNodeId: string,
  config?: { loads?: Map<string, number>; passRates?: Map<string, number> },
): MeshCoordinator {
  return new MeshCoordinator(discoveryService, transport, localNodeId, config);
}
