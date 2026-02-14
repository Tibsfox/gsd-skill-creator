/**
 * Zod validation schemas for Pipeline instructions and metadata.
 *
 * Provides runtime validation for WAIT/MOVE/SKIP instructions, metadata,
 * and the Pipeline container. Uses const arrays from types.ts for
 * type-safe enum validation.
 *
 * All schemas produce clear error messages for malformed instructions.
 * PipelineMetadataSchema uses .passthrough() for forward compatibility.
 */

import { z } from 'zod';
import {
  GSD_LIFECYCLE_EVENTS,
  ACTIVATION_MODES,
  MOVE_TARGET_TYPES,
  SKIP_OPERATORS,
} from './types.js';

// ============================================================================
// WaitInstructionSchema
// ============================================================================

/**
 * Schema for WAIT instructions.
 *
 * Validates that the event is a known GSD lifecycle event.
 * Optional timeout (positive number) and description fields.
 */
export const WaitInstructionSchema = z.object({
  type: z.literal('wait'),
  event: z.enum(GSD_LIFECYCLE_EVENTS, {
    error: 'Invalid GSD lifecycle event. Valid events: phase-start, phase-planned, code-complete, tests-passing, verify-complete, end-of-frame, milestone-start, milestone-complete, session-start, session-pause, session-resume, session-stop',
  }),
  timeout: z.number().positive().optional(),
  description: z.string().optional(),
});

// ============================================================================
// MoveInstructionSchema
// ============================================================================

/**
 * Schema for MOVE instructions.
 *
 * Validates target type, activation mode, and requires a non-empty name.
 * Optional args record and description fields.
 */
export const MoveInstructionSchema = z.object({
  type: z.literal('move'),
  target: z.enum(MOVE_TARGET_TYPES, {
    error: 'Invalid move target. Valid targets: skill, script, team',
  }),
  name: z.string().min(1, 'MOVE instruction requires a non-empty name'),
  mode: z.enum(ACTIVATION_MODES, {
    error: 'Invalid activation mode. Valid modes: lite, full, offload, async',
  }),
  args: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional(),
});

// ============================================================================
// SkipInstructionSchema
// ============================================================================

/**
 * Schema for SKIP condition objects.
 *
 * Requires a non-empty left operand and a valid operator.
 * Right operand is optional (not needed for unary operators like exists).
 */
const SkipConditionSchema = z.object({
  left: z.string().min(1, 'SKIP condition requires a non-empty left operand'),
  op: z.enum(SKIP_OPERATORS, {
    error: 'Invalid skip operator. Valid operators: exists, not-exists, equals, not-equals, contains, gt, lt',
  }),
  right: z.string().optional(),
});

/**
 * Schema for SKIP instructions.
 *
 * Validates the condition object with left operand, operator, and optional right.
 * Optional description field.
 */
export const SkipInstructionSchema = z.object({
  type: z.literal('skip'),
  condition: SkipConditionSchema,
  description: z.string().optional(),
});

// ============================================================================
// PipelineInstructionSchema (discriminated union)
// ============================================================================

/**
 * Discriminated union schema for all Pipeline instruction types.
 *
 * Dispatches validation based on the `type` field: 'wait', 'move', or 'skip'.
 * Unknown type values are rejected with a descriptive error.
 */
export const PipelineInstructionSchema = z.discriminatedUnion('type', [
  WaitInstructionSchema,
  MoveInstructionSchema,
  SkipInstructionSchema,
]);

// ============================================================================
// PipelineMetadataSchema
// ============================================================================

/**
 * Schema for Pipeline metadata.
 *
 * Requires a non-empty name. All other fields are optional with sensible defaults.
 * Uses .passthrough() so unknown fields survive parsing for forward compatibility.
 */
export const PipelineMetadataSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  description: z.string().optional(),
  sourcePatterns: z.array(z.string()).optional(),
  tokenEstimate: z.number().nonnegative('Token estimate must be non-negative').optional(),
  priority: z.number().min(1).max(100).default(50),
  confidence: z.number().min(0).max(1).default(1.0),
  tags: z.array(z.string()).optional(),
  version: z.number().int().positive().default(1),
}).passthrough();

// ============================================================================
// PipelineSchema
// ============================================================================

/**
 * Schema for a complete Pipeline.
 *
 * Validates both metadata and instructions array. The instructions array
 * must contain at least one instruction.
 */
export const PipelineSchema = z.object({
  metadata: PipelineMetadataSchema,
  instructions: z.array(PipelineInstructionSchema).min(1, 'Pipeline must have at least one instruction'),
});
