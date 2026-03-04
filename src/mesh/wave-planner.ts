/**
 * VTM mesh-aware wave planner.
 *
 * planMeshWave() annotates each task with a per-node RoutingDecision
 * (target, fallback, routing justification) so the executor knows which
 * mesh node runs which task (MESH-03).
 *
 * Pure function -- no IO, no side effects except Date for timestamp (IMP-06).
 */

import { z } from 'zod';
import type { MeshNode } from './types.js';
import { RoutingDecisionSchema } from './routing-types.js';
import type { RoutingDecision } from './routing-types.js';
import { applyCostPolicy } from './routing-policy.js';

// ============================================================================
// Schemas / Types
// ============================================================================

/** A single task in a wave, before routing annotation */
export const WaveTaskSchema = z.object({
  /** Unique task identifier */
  taskId: z.string(),
  /** Name of the skill to execute */
  skillName: z.string(),
  /** Required chip name for this task */
  requiredChip: z.string(),
  /** Minimum context length required (default 0) */
  minContextLength: z.number().int().nonnegative().default(0),
});

/** TypeScript type for wave tasks */
export type WaveTask = z.infer<typeof WaveTaskSchema>;

/** A wave task annotated with routing decision */
export const AnnotatedTaskSchema = WaveTaskSchema.extend({
  routing: RoutingDecisionSchema,
});

/** TypeScript type for annotated tasks */
export type AnnotatedTask = z.infer<typeof AnnotatedTaskSchema>;

/** A complete mesh wave plan with annotated tasks */
export const MeshWavePlanSchema = z.object({
  /** Unique wave identifier */
  waveId: z.string(),
  /** Tasks annotated with routing decisions */
  tasks: z.array(AnnotatedTaskSchema),
  /** ISO 8601 creation timestamp */
  createdAt: z.string().datetime(),
});

/** TypeScript type for mesh wave plans */
export type MeshWavePlan = z.infer<typeof MeshWavePlanSchema>;

// ============================================================================
// planMeshWave
// ============================================================================

/**
 * Plans a mesh wave by annotating each task with a RoutingDecision.
 *
 * @param waveId - Unique identifier for this wave
 * @param tasks - Tasks to annotate
 * @param nodes - Available mesh nodes
 * @param localNodeId - ID of the local node
 * @param loads - Map of nodeId -> current load (0-1)
 * @param passRates - Map of nodeId -> historical pass rate (0-1)
 * @returns MeshWavePlan with per-task routing annotations
 */
export function planMeshWave(
  waveId: string,
  tasks: WaveTask[],
  nodes: MeshNode[],
  localNodeId: string,
  loads: Map<string, number>,
  passRates: Map<string, number>,
): MeshWavePlan {
  const healthyNodes = nodes.filter((n) => n.status === 'healthy');

  const annotatedTasks: AnnotatedTask[] = tasks.map((task) => {
    const requirement = {
      chipName: task.requiredChip,
      minContextLength: task.minContextLength,
    };

    // Check if any healthy node has the required capability
    const hasCapable = healthyNodes.some((n) =>
      n.capabilities.some(
        (cap) =>
          cap.chipName === requirement.chipName &&
          cap.maxContextLength >= requirement.minContextLength,
      ),
    );

    let routing: RoutingDecision;
    if (!hasCapable || healthyNodes.length === 0) {
      routing = {
        taskId: task.taskId,
        target: {
          nodeId: '',
          chipName: requirement.chipName,
          capabilityScore: 0,
          loadScore: 0,
          performanceScore: 0,
          totalScore: 0,
          justification: `No capable node for chip '${requirement.chipName}'`,
        },
        routingJustification: `No capable node for chip '${requirement.chipName}'`,
      };
    } else {
      routing = applyCostPolicy(
        healthyNodes,
        requirement,
        loads,
        passRates,
        localNodeId,
      );
      routing.taskId = task.taskId;
    }

    return {
      ...task,
      routing,
    };
  });

  return {
    waveId,
    tasks: annotatedTasks,
    createdAt: new Date().toISOString(),
  };
}
