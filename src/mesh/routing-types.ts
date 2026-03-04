/**
 * Routing type system for mesh task orchestration.
 *
 * Zod schemas and TypeScript types for routing requests, node scores,
 * and routing decisions. Consumed by scoring.ts, routing-policy.ts,
 * coordinator.ts, and wave-planner.ts.
 *
 * Pure type definitions -- no IO, no side effects (IMP-06).
 */

import { z } from 'zod';

// ============================================================================
// RoutingRequestSchema
// ============================================================================

/**
 * A request to route a task to an optimal mesh node.
 * Contains the task identifier, required capability, and local preference.
 */
export const RoutingRequestSchema = z.object({
  /** Unique identifier for the task being routed */
  taskId: z.string(),
  /** Required chip capability for this task */
  requiredCapability: z.object({
    /** Name of the chip required (must match NodeCapability.chipName) */
    chipName: z.string(),
    /** Minimum context window length in tokens */
    minContextLength: z.number().int().nonnegative(),
  }),
  /** Whether to prefer local node execution (default true) */
  preferLocal: z.boolean().default(true),
});

/** TypeScript type for routing requests */
export type RoutingRequest = z.infer<typeof RoutingRequestSchema>;

// ============================================================================
// NodeScoreSchema
// ============================================================================

/**
 * Score for a single mesh node's suitability for a task.
 * Produced by scoreNode(), consumed by rankNodes() and routing decisions.
 */
export const NodeScoreSchema = z.object({
  /** ID of the scored node */
  nodeId: z.string(),
  /** Name of the matching chip on this node */
  chipName: z.string(),
  /** Capability match score: 0 (no match) or 1 (capable) */
  capabilityScore: z.number(),
  /** Load score: 1 - currentLoad (higher = less loaded) */
  loadScore: z.number(),
  /** Performance score: historical pass rate */
  performanceScore: z.number(),
  /** Weighted total score */
  totalScore: z.number(),
  /** Human-readable explanation of the scoring */
  justification: z.string(),
});

/** TypeScript type for node scores */
export type NodeScore = z.infer<typeof NodeScoreSchema>;

// ============================================================================
// RoutingDecisionSchema
// ============================================================================

/**
 * Final routing decision for a task, selecting a target node and optional fallback.
 */
export const RoutingDecisionSchema = z.object({
  /** Task ID this decision applies to */
  taskId: z.string(),
  /** Primary target node */
  target: NodeScoreSchema,
  /** Fallback node if primary fails (optional) */
  fallback: NodeScoreSchema.optional(),
  /** Explanation of the routing decision */
  routingJustification: z.string(),
});

/** TypeScript type for routing decisions */
export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;
