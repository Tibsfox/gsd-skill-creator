/**
 * Type definitions for the autonomy foundation module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - ExecutionStatus (state machine states)
 * - SubversionPhase (4-phase execution cycle)
 * - GateType, GateCheck, GateDefinition, GateResult (artifact verification)
 * - TeachForwardEntry (automated insight extraction)
 * - ContextBudget (token usage tracking)
 * - SubversionRecord (completed subversion metadata)
 * - StateTransition (state machine transition record)
 * - ExecutionState (top-level persisted state)
 *
 * All downstream modules (autonomy engine, gates, context management,
 * integration, report) import their shared types from this single entry point.
 *
 * All object schemas use .passthrough() for forward compatibility
 * with new fields added in future versions.
 */

import { z } from 'zod';

// ============================================================================
// ExecutionStatus
// ============================================================================

/**
 * The 7 states of the autonomy execution state machine.
 *
 * INITIALIZED -> RUNNING -> CHECKPOINTING -> RUNNING -> ... -> COMPLETING -> DONE
 *                   |                                              |
 *                   +--- PAUSED (context exhaustion) ---------------+
 *                   |                                              |
 *                   +--- FAILED (unrecoverable) -------------------+
 */
export const ExecutionStatusSchema = z.enum([
  'INITIALIZED',
  'RUNNING',
  'CHECKPOINTING',
  'PAUSED',
  'COMPLETING',
  'DONE',
  'FAILED',
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

// ============================================================================
// SubversionPhase
// ============================================================================

/**
 * The 4-phase execution cycle for each subversion.
 *
 * Each subversion progresses through: prepare -> execute -> verify -> journal
 */
export const SubversionPhaseSchema = z.enum([
  'prepare',
  'execute',
  'verify',
  'journal',
]);

export type SubversionPhase = z.infer<typeof SubversionPhaseSchema>;

// ============================================================================
// GateType
// ============================================================================

/**
 * Categories of artifact verification gates.
 *
 * - per_subversion: Runs after every subversion completes
 * - checkpoint: Runs at checkpoint intervals (e.g., every 10 subversions)
 * - half_transition: Runs at the midpoint (e.g., subversion 50)
 * - graduation: Runs at final completion
 * - summary: Runs for synthesis/summary documents
 */
export const GateTypeSchema = z.enum([
  'per_subversion',
  'checkpoint',
  'half_transition',
  'graduation',
  'summary',
]);

export type GateType = z.infer<typeof GateTypeSchema>;

// ============================================================================
// GateCheck
// ============================================================================

/**
 * A single content check specification within a gate definition.
 *
 * Defines a regex pattern to search for in artifact content,
 * whether it is required, and an optional human-readable description.
 */
export const GateCheckSchema = z.object({
  /** Regex pattern to match against file content */
  pattern: z.string(),
  /** Whether this check must pass for the gate to succeed */
  required: z.boolean(),
  /** Human-readable description of what this check validates */
  description: z.string().optional(),
}).passthrough();

export type GateCheck = z.infer<typeof GateCheckSchema>;

// ============================================================================
// GateDefinition
// ============================================================================

/**
 * Full specification for an artifact verification gate.
 *
 * Loaded from YAML gate definitions. Describes what artifact to check,
 * minimum size, whether it blocks execution, and content checks to run.
 */
export const GateDefinitionSchema = z.object({
  /** Unique name for this gate */
  name: z.string(),
  /** Human-readable description of what this gate validates */
  description: z.string(),
  /** Glob or template pattern for the artifact path */
  path_pattern: z.string(),
  /** Minimum file size in bytes for the artifact to pass */
  min_size_bytes: z.number(),
  /** Whether a gate failure blocks continued execution */
  blocking: z.boolean(),
  /** Content checks to run against the artifact */
  content_checks: z.array(GateCheckSchema),
  /** Optional condition expression for when this gate applies */
  applies_when: z.string().optional(),
}).passthrough();

export type GateDefinition = z.infer<typeof GateDefinitionSchema>;

// ============================================================================
// GateResult
// ============================================================================

/**
 * Outcome of running a single gate check against an artifact.
 *
 * Records whether the gate passed, which gate type it was,
 * a summary message, and optional details about individual checks.
 */
export const GateResultSchema = z.object({
  /** Name of the gate that produced this result */
  gate_name: z.string(),
  /** Category of gate that was evaluated */
  gate_type: GateTypeSchema,
  /** Whether the gate check passed */
  passed: z.boolean(),
  /** Summary message describing the outcome */
  message: z.string(),
  /** Optional array of detail messages for individual checks */
  details: z.array(z.string()).optional(),
  /** Optional path that was checked */
  checked_path: z.string().optional(),
}).passthrough();

export type GateResult = z.infer<typeof GateResultSchema>;

// ============================================================================
// TeachForwardEntry
// ============================================================================

/**
 * Automated insight extraction record from teach-forward chain.
 *
 * Captures insights passed from one subversion to the next,
 * enabling continuous learning across the execution sequence.
 */
export const TeachForwardEntrySchema = z.object({
  /** Source subversion number */
  from_subversion: z.number(),
  /** Target subversion number */
  to_subversion: z.number(),
  /** Array of insight strings extracted */
  insights: z.array(z.string()),
  /** ISO timestamp when insights were extracted */
  extracted_at: z.string(),
}).passthrough();

export type TeachForwardEntry = z.infer<typeof TeachForwardEntrySchema>;

// ============================================================================
// ContextBudget
// ============================================================================

/**
 * Token usage tracking for context window management.
 *
 * Monitors estimated token usage against the maximum budget,
 * triggering pause/checkpoint when the threshold is exceeded.
 */
export const ContextBudgetSchema = z.object({
  /** Estimated tokens currently used in context */
  estimated_tokens: z.number(),
  /** Maximum token budget for the context window */
  max_tokens: z.number(),
  /** Current usage as a percentage (0-100) */
  usage_percent: z.number(),
  /** Percentage threshold that triggers context exhaustion (default 80) */
  threshold_percent: z.number().default(80),
  /** ISO timestamp of last measurement */
  last_measured_at: z.string().optional(),
}).passthrough();

export type ContextBudget = z.infer<typeof ContextBudgetSchema>;

// ============================================================================
// SubversionRecord
// ============================================================================

/**
 * Metadata for a completed subversion execution.
 *
 * Records timing, phase results, produced artifacts, and gate outcomes
 * for a single subversion in the execution sequence.
 */
export const SubversionRecordSchema = z.object({
  /** Subversion number (0-99 for a 100-subversion milestone) */
  subversion: z.number(),
  /** ISO timestamp when this subversion started */
  started_at: z.string(),
  /** ISO timestamp when this subversion completed */
  completed_at: z.string(),
  /** Map of phase name to pass/fail result */
  phase_results: z.record(z.string(), z.boolean()),
  /** Optional list of artifact paths produced */
  artifacts_produced: z.array(z.string()).optional(),
  /** Optional gate results from verification */
  gate_results: z.array(GateResultSchema).optional(),
}).passthrough();

export type SubversionRecord = z.infer<typeof SubversionRecordSchema>;

// ============================================================================
// StateTransition
// ============================================================================

/**
 * Record of a single state machine transition.
 *
 * Captures what triggered the transition, the before/after states,
 * and optional metadata for debugging and audit.
 */
export const StateTransitionSchema = z.object({
  /** State before the transition */
  from: ExecutionStatusSchema,
  /** State after the transition */
  to: ExecutionStatusSchema,
  /** What triggered this transition */
  trigger: z.string(),
  /** ISO timestamp of the transition */
  timestamp: z.string(),
  /** Optional metadata record for debugging */
  metadata: z.record(z.string(), z.string()).optional(),
}).passthrough();

export type StateTransition = z.infer<typeof StateTransitionSchema>;

// ============================================================================
// ExecutionState
// ============================================================================

/**
 * Top-level persisted state for autonomous execution.
 *
 * This is the master state object written to execution-state.json.
 * It combines the state machine status, completed subversion records,
 * checkpoint history, transition log, context budget, and error state.
 *
 * All downstream modules read/write this single state object.
 */
export const ExecutionStateSchema = z.object({
  /** Schema version for forward compatibility */
  version: z.number().default(1),
  /** Milestone identifier (e.g., 'v1.53') */
  milestone: z.string(),
  /** Optional milestone type for gate template selection */
  milestone_type: z.string().optional(),
  /** Current state machine status */
  status: ExecutionStatusSchema,
  /** Current subversion being executed */
  current_subversion: z.number(),
  /** Total subversions in this milestone (default 100) */
  total_subversions: z.number().default(100),
  /** ISO timestamp when execution started */
  started_at: z.string(),
  /** ISO timestamp of last state update */
  updated_at: z.string(),
  /** Array of completed subversion records */
  completed_subversions: z.array(SubversionRecordSchema).default(() => []),
  /** Subversion numbers where checkpoints occurred */
  checkpoints: z.array(z.number()).default(() => []),
  /** Full transition history for audit */
  transitions: z.array(StateTransitionSchema).default(() => []),
  /** Current phase within the active subversion (null if between subversions) */
  current_phase: SubversionPhaseSchema.nullable().default(null),
  /** Current context budget tracking (null if not yet measured) */
  context_budget: ContextBudgetSchema.nullable().default(null),
  /** Last error message if status is FAILED (null otherwise) */
  last_error: z.string().nullable().default(null),
  /** Subversion to resume from after PAUSED state (null if not resuming) */
  resume_from: z.number().nullable().default(null),
}).passthrough();

export type ExecutionState = z.infer<typeof ExecutionStateSchema>;
