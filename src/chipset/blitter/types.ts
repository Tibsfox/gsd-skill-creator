/**
 * Blitter type system: Zod schemas for operations, promotion declarations,
 * completion signals, and execution results.
 *
 * The Blitter promotes deterministic skill operations to standalone scripts
 * that execute outside the context window. This module defines the type
 * foundation that the executor and promoter build on.
 */

import { z } from 'zod';

// ============================================================================
// BlitterStatus
// ============================================================================

/** Lifecycle status of a blitter operation. */
export type BlitterStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timed-out';

// ============================================================================
// BlitterOperationSchema
// ============================================================================

/**
 * Schema for a single blitter operation -- a script ready for execution.
 *
 * Operations are constructed from promotion declarations in skill metadata.
 * The `id` follows the convention `{skillName}:{promotionName}`.
 */
export const BlitterOperationSchema = z.object({
  /** Unique identifier, typically `{skillName}:{promotionName}` */
  id: z.string().min(1),

  /** Script content to execute */
  script: z.string().min(1),

  /** Interpreter selection */
  scriptType: z.enum(['bash', 'node', 'python', 'custom']),

  /** Working directory for execution */
  workingDir: z.string().default('.'),

  /** Timeout in milliseconds (default 30 seconds) */
  timeout: z.number().positive().default(30000),

  /** Additional environment variables */
  env: z.record(z.string(), z.string()).default({}),

  /** Human-readable label for display */
  label: z.string().optional(),
});

export type BlitterOperation = z.infer<typeof BlitterOperationSchema>;

// ============================================================================
// PromotionConditionsSchema
// ============================================================================

/**
 * Conditions under which a promotion should be activated.
 * All fields optional -- when omitted, promotion is unconditional.
 */
export const PromotionConditionsSchema = z.object({
  /** Glob patterns for file-based activation */
  filePatterns: z.array(z.string()).optional(),

  /** GSD phase names where this promotion applies */
  phases: z.array(z.string()).optional(),

  /** If true, always promote regardless of conditions */
  alwaysPromote: z.boolean().optional(),
});

// ============================================================================
// PromotionDeclarationSchema
// ============================================================================

/**
 * Schema for a promotion declaration in skill metadata.
 *
 * Skills declare deterministic operations as promotable via
 * `metadata.extensions['gsd-skill-creator'].blitter.promotions`.
 */
export const PromotionDeclarationSchema = z.object({
  /** Promotion name (used to build operation ID) */
  name: z.string().min(1),

  /** The actual script content */
  scriptContent: z.string().min(1),

  /** Interpreter selection */
  scriptType: z.enum(['bash', 'node', 'python', 'custom']),

  /** Working directory for execution */
  workingDir: z.string().optional(),

  /** Timeout in milliseconds */
  timeout: z.number().positive().optional(),

  /** Additional environment variables */
  env: z.record(z.string(), z.string()).optional(),

  /** Activation conditions */
  conditions: PromotionConditionsSchema.optional(),
});

export type PromotionDeclaration = z.infer<typeof PromotionDeclarationSchema>;

// ============================================================================
// BlitterResultSchema
// ============================================================================

/**
 * Schema for execution results from a blitter operation.
 * Captures exit code, output streams, timing, and timeout status.
 */
export const BlitterResultSchema = z.object({
  /** ID of the operation that produced this result */
  operationId: z.string().min(1),

  /** Process exit code */
  exitCode: z.number().int(),

  /** Standard output content */
  stdout: z.string(),

  /** Standard error content */
  stderr: z.string(),

  /** Execution duration in milliseconds */
  durationMs: z.number().nonnegative(),

  /** Whether the operation was killed due to timeout */
  timedOut: z.boolean().default(false),
});

export type BlitterResult = z.infer<typeof BlitterResultSchema>;

// ============================================================================
// CompletionSignalSchema
// ============================================================================

/**
 * Schema for completion signals emitted after blitter operation finishes.
 * Combines operation identity, status, full result, and optional error info.
 */
export const CompletionSignalSchema = z.object({
  /** ID of the completed operation */
  operationId: z.string().min(1),

  /** Outcome status */
  status: z.enum(['success', 'failure', 'timeout', 'error']),

  /** Full execution result */
  result: BlitterResultSchema,

  /** ISO 8601 timestamp of completion */
  timestamp: z.string(),

  /** Error message (present when status is 'error') */
  error: z.string().optional(),
});

export type CompletionSignal = z.infer<typeof CompletionSignalSchema>;
