/**
 * Type definitions for the HITL gate evaluation module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - GateDecision (output of gate evaluation)
 * - GateEvaluatorOptions (configuration for threshold/command overrides)
 * - DEFAULT_DESTRUCTIVE_COMMANDS (commands that always require confirmation)
 *
 * All schemas use .passthrough() for forward compatibility.
 */

import { z } from 'zod';

// ============================================================================
// Gate Decision
// ============================================================================

/**
 * Zod schema for a gate evaluation decision.
 *
 * Describes the action to take (proceed, confirm, block), which gate
 * triggered the decision, a human-readable reason, and whether YOLO
 * mode affected the outcome.
 */
export const GateDecisionSchema = z.object({
  /** Action to take: proceed (auto-execute), confirm (ask user), block (deny) */
  action: z.enum(['proceed', 'confirm', 'block']),
  /** Human-readable explanation of the decision */
  reason: z.string(),
  /** Which gate type produced this decision */
  gateType: z.enum(['routing', 'destructive', 'low-confidence', 'confirmation']),
  /** Whether YOLO mode influenced the decision */
  skippedByYolo: z.boolean(),
}).passthrough();

export type GateDecision = z.infer<typeof GateDecisionSchema>;

// ============================================================================
// Gate Evaluator Options
// ============================================================================

/**
 * Configuration options for the gate evaluator.
 *
 * All fields are optional with sensible defaults applied in evaluateGate.
 */
export interface GateEvaluatorOptions {
  /** Override the default set of destructive commands */
  destructiveCommands?: Set<string>;
  /** Confidence threshold below which low-confidence gate triggers (default 0.5) */
  lowConfidenceThreshold?: number;
}

// ============================================================================
// Default Destructive Commands
// ============================================================================

/**
 * Commands that always require user confirmation, regardless of mode.
 *
 * These are irreversible or high-impact operations where YOLO mode
 * should NOT auto-proceed. Callers can override with a custom set
 * via GateEvaluatorOptions.destructiveCommands.
 */
export const DEFAULT_DESTRUCTIVE_COMMANDS: Set<string> = new Set([
  'gsd:remove-phase',
  'gsd:complete-milestone',
]);
