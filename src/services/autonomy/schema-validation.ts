/**
 * Schema validation utilities for autonomy execution state and gate configs.
 *
 * Wraps Zod `.safeParse()` with domain-specific error messages,
 * returning structured `ValidationResult<T>` instead of throwing.
 *
 * Use the JSON Schema files in `data/schemas/autonomy/` for external
 * tooling (editors, CI, documentation). Use these TypeScript validators
 * for runtime validation within the application.
 *
 * @module autonomy/schema-validation
 */

import { z } from 'zod';
import {
  ExecutionStateSchema,
  GateDefinitionSchema,
  type ExecutionState,
} from './types.js';

// ============================================================================
// ValidationResult type
// ============================================================================

/**
 * Structured validation result.
 *
 * On success, contains the parsed and typed data with defaults applied.
 * On failure, contains an array of human-readable error strings.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

// ============================================================================
// GateConfigSchema
// ============================================================================

/**
 * Zod schema for top-level gate configuration YAML files.
 *
 * Defines the structure for milestone-level gate definitions,
 * organized by gate type (per_subversion, checkpoint, etc.).
 */
export const GateConfigSchema = z.object({
  /** Gate configuration schema version */
  version: z.string(),
  /** Milestone identifier this gate config applies to */
  milestone: z.string(),
  /** Type of milestone for gate template selection */
  milestone_type: z.enum(['pedagogical', 'implementation', 'validation', 'integration']),
  /** Gate definitions organized by gate type */
  gates: z.object({
    per_subversion: z.array(GateDefinitionSchema).default(() => []),
    checkpoint: z.array(GateDefinitionSchema).default(() => []),
    half_transition: z.array(GateDefinitionSchema).default(() => []),
    graduation: z.array(GateDefinitionSchema).default(() => []),
    summary: z.array(GateDefinitionSchema).default(() => []),
  }).passthrough(),
}).passthrough();

/** Inferred TypeScript type for gate configuration */
export type GateConfig = z.infer<typeof GateConfigSchema>;

// ============================================================================
// Error formatting
// ============================================================================

/**
 * Converts a ZodError into an array of human-readable error strings.
 *
 * Each string includes the field path and a descriptive message,
 * e.g., "status: Expected 'INITIALIZED' | 'RUNNING' | ... but received 'UNKNOWN'"
 */
function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0
      ? issue.path.join('.')
      : 'root';

    // Zod 4 uses 'invalid_value' for enum mismatches and 'invalid_type' for type errors.
    // All issues have a `.message` field; we prefix with the field path for clarity.
    return `${path}: ${issue.message}`;
  });
}

// ============================================================================
// validateExecutionState
// ============================================================================

/**
 * Validates unknown data against the ExecutionState Zod schema.
 *
 * On success, returns the parsed ExecutionState with defaults applied
 * (version=1, total_subversions=100, empty arrays, null optionals).
 *
 * On failure, returns human-readable error strings describing each issue.
 *
 * @param data - Unknown data to validate
 * @returns Structured validation result
 */
export function validateExecutionState(data: unknown): ValidationResult<ExecutionState> {
  const result = ExecutionStateSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

// ============================================================================
// validateGateConfig
// ============================================================================

/**
 * Validates unknown data against the GateConfig Zod schema.
 *
 * On success, returns the parsed GateConfig with defaults applied
 * (empty arrays for unspecified gate type categories).
 *
 * On failure, returns human-readable error strings describing each issue.
 *
 * @param data - Unknown data to validate
 * @returns Structured validation result
 */
export function validateGateConfig(data: unknown): ValidationResult<GateConfig> {
  const result = GateConfigSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}
