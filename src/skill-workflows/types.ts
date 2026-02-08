/**
 * Type definitions for skill workflow YAML files.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - WorkflowStep: a single step in a workflow (skill + dependencies)
 * - WorkflowDefinition: complete workflow with steps and metadata
 * - WorkflowRunEntry: execution log entry for a step run
 * - WorkflowValidationResult: validation outcome with errors and execution order
 *
 * All object schemas use .passthrough() for forward compatibility
 * with new fields added in future versions.
 */

import { z } from 'zod';

// ============================================================================
// WorkflowStep
// ============================================================================

/**
 * Schema for a single workflow step.
 *
 * Required: id, skill
 * Optional with defaults: description (undefined), needs ([])
 */
export const WorkflowStepSchema = z.object({
  id: z.string(),
  skill: z.string(),
  description: z.string().optional(),
  needs: z.array(z.string()).default(() => []),
}).passthrough();

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

// ============================================================================
// WorkflowDefinition
// ============================================================================

/**
 * Schema for a complete workflow definition parsed from .workflow.yaml.
 *
 * Required: name, steps (min 1)
 * Optional with defaults: description (undefined), version (1), extends (null)
 */
export const WorkflowDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.number().default(1),
  extends: z.string().nullable().default(null),
  steps: z.array(WorkflowStepSchema).min(1),
}).passthrough();

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// ============================================================================
// WorkflowRunEntry
// ============================================================================

/**
 * Schema for a workflow step execution log entry.
 *
 * Required: run_id, workflow_name, step_id, status, started_at
 * Optional with defaults: completed_at (null), error (null)
 */
export const WorkflowRunEntrySchema = z.object({
  run_id: z.string(),
  workflow_name: z.string(),
  step_id: z.string(),
  status: z.enum(['started', 'completed', 'failed', 'skipped']),
  started_at: z.string(),
  completed_at: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
}).passthrough();

export type WorkflowRunEntry = z.infer<typeof WorkflowRunEntrySchema>;

// ============================================================================
// WorkflowValidationResult
// ============================================================================

/**
 * Schema for the outcome of workflow validation.
 *
 * Required: valid
 * Optional with defaults: errors ([]), executionOrder (null)
 */
export const WorkflowValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).default(() => []),
  executionOrder: z.array(z.string()).nullable().default(null),
}).passthrough();

export type WorkflowValidationResult = z.infer<typeof WorkflowValidationResultSchema>;
