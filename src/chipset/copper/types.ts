/**
 * Pipeline type system for the coprocessor architecture.
 *
 * Defines TypeScript types for WAIT/MOVE/SKIP instructions, metadata,
 * and the Pipeline container. These types model the instruction programs
 * that synchronize skill/script/team activation to GSD lifecycle events.
 *
 * Uses const arrays with derived types for type-safe enums, following
 * the pattern established in src/types/team.ts and src/events/types.ts.
 */

// ============================================================================
// GSD Lifecycle Events
// ============================================================================

/**
 * GSD lifecycle events that WAIT instructions can reference.
 *
 * These events correspond to phase, milestone, and session transitions
 * in the GSD workflow. A WAIT instruction pauses the Pipeline until
 * the specified event fires.
 */
export const GSD_LIFECYCLE_EVENTS = [
  'phase-start',
  'phase-planned',
  'code-complete',
  'tests-passing',
  'verify-complete',
  'end-of-frame',
  'milestone-start',
  'milestone-complete',
  'session-start',
  'session-pause',
  'session-resume',
  'session-stop',
] as const;

/** Type for a GSD lifecycle event name. */
export type GsdLifecycleEvent = (typeof GSD_LIFECYCLE_EVENTS)[number];

// ============================================================================
// Activation Modes
// ============================================================================

/**
 * How a MOVE instruction activates its target.
 *
 * - `lite`: lightweight activation (~200 tokens, summary context only)
 * - `full`: full context activation (complete skill loaded)
 * - `offload`: delegate to offload engine (script execution outside context)
 * - `async`: fire-and-forget, don't wait for completion
 */
export const ACTIVATION_MODES = ['lite', 'full', 'offload', 'async'] as const;

/** Type for an activation mode. */
export type ActivationMode = (typeof ACTIVATION_MODES)[number];

// ============================================================================
// Move Target Types
// ============================================================================

/**
 * What a MOVE instruction can activate.
 *
 * - `skill`: a Claude Code skill (.claude/commands/)
 * - `script`: a promoted script (scripts/)
 * - `team`: an agent team (.claude/agents/)
 */
export const MOVE_TARGET_TYPES = ['skill', 'script', 'team'] as const;

/** Type for a MOVE target. */
export type MoveTargetType = (typeof MOVE_TARGET_TYPES)[number];

// ============================================================================
// Skip Operators
// ============================================================================

/**
 * Condition evaluation operators for SKIP instructions.
 *
 * Unary operators (require only `left`):
 * - `exists`: check if left operand exists
 * - `not-exists`: check if left operand does not exist
 *
 * Binary operators (require `left` and `right`):
 * - `equals`: left equals right
 * - `not-equals`: left does not equal right
 * - `contains`: left contains right
 * - `gt`: left is greater than right
 * - `lt`: left is less than right
 */
export const SKIP_OPERATORS = [
  'exists',
  'not-exists',
  'equals',
  'not-equals',
  'contains',
  'gt',
  'lt',
] as const;

/** Type for a SKIP operator. */
export type SkipOperator = (typeof SKIP_OPERATORS)[number];

// ============================================================================
// Instruction Interfaces
// ============================================================================

/**
 * WAIT instruction -- pauses the Pipeline until a GSD lifecycle event fires.
 */
export interface WaitInstruction {
  /** Instruction type discriminator. */
  type: 'wait';

  /** The GSD lifecycle event to wait for. */
  event: GsdLifecycleEvent;

  /** Optional timeout in seconds before giving up. */
  timeout?: number;

  /** Optional human-readable description. */
  description?: string;
}

/**
 * MOVE instruction -- activates a skill, script, or team.
 */
export interface MoveInstruction {
  /** Instruction type discriminator. */
  type: 'move';

  /** What to activate: skill, script, or team. */
  target: MoveTargetType;

  /** Name of the target to activate. */
  name: string;

  /** How to activate the target. */
  mode: ActivationMode;

  /** Optional arguments passed to the target. */
  args?: Record<string, unknown>;

  /** Optional human-readable description. */
  description?: string;
}

/**
 * Condition for a SKIP instruction.
 */
export interface SkipCondition {
  /** The operand to check (e.g., 'file:tsconfig.json', 'env:CI'). */
  left: string;

  /** The comparison operator. */
  op: SkipOperator;

  /** The right operand (required for binary operators, optional for unary). */
  right?: string;
}

/**
 * SKIP instruction -- conditionally skips the next instruction(s).
 */
export interface SkipInstruction {
  /** Instruction type discriminator. */
  type: 'skip';

  /** The condition to evaluate. */
  condition: SkipCondition;

  /** Optional human-readable description. */
  description?: string;
}

/** Union of all Pipeline instruction types. */
export type PipelineInstruction = WaitInstruction | MoveInstruction | SkipInstruction;

// ============================================================================
// Metadata and List Interfaces
// ============================================================================

/**
 * Metadata for a Pipeline.
 *
 * Contains identification, origin tracking, token budget estimation,
 * and priority/confidence scores. Unknown fields are preserved for
 * forward compatibility.
 */
export interface PipelineMetadata {
  /** Unique name for this Pipeline. */
  name: string;

  /** Human-readable description of what this list does. */
  description?: string;

  /** Observation patterns that generated this list. */
  sourcePatterns?: string[];

  /** Estimated token cost of executing this list. */
  tokenEstimate?: number;

  /** Priority score (1-100, default 50). Higher = more important. */
  priority?: number;

  /** Confidence score (0-1, default 1.0). Higher = more certain. */
  confidence?: number;

  /** Tags for categorization. */
  tags?: string[];

  /** Version number (positive integer, default 1). */
  version?: number;

  /** Allow unknown fields for forward compatibility. */
  [key: string]: unknown;
}

/**
 * A Pipeline -- a program of WAIT/MOVE/SKIP instructions with metadata.
 *
 * Pipelines are the primary execution unit for the coprocessor.
 * They synchronize skill/script/team activation to GSD lifecycle events.
 */
export interface Pipeline {
  /** Metadata describing this list. */
  metadata: PipelineMetadata;

  /** Ordered list of instructions to execute. */
  instructions: PipelineInstruction[];
}
