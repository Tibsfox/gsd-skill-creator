/**
 * Type definitions for persistent work state.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - QueuedTask: tasks waiting to be executed
 * - WorkCheckpoint: current position within a workflow
 * - WorkState: complete serializable work state
 *
 * All object schemas use .passthrough() for forward compatibility
 * with new fields added in future versions.
 */

import { z } from 'zod';

/**
 * Default filename for the work state persistence file.
 * Stored at `.planning/hooks/current-work.yaml`.
 */
export const DEFAULT_WORK_STATE_FILENAME = 'current-work.yaml';

// ============================================================================
// QueuedTask
// ============================================================================

/**
 * Schema for a task waiting to be executed.
 *
 * Required: id, description, created_at
 * Optional with defaults: skills_needed ([]), priority ('medium'), source (undefined)
 */
export const QueuedTaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  skills_needed: z.array(z.string()).default(() => []),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  created_at: z.string(),
  source: z.string().nullable().optional(),
}).passthrough();

export type QueuedTask = z.infer<typeof QueuedTaskSchema>;

// ============================================================================
// WorkCheckpoint
// ============================================================================

/**
 * Schema for the current position within a workflow.
 *
 * Required: timestamp
 * Optional with defaults: phase (null), plan (null), step (null), status ('in-progress')
 */
export const WorkCheckpointSchema = z.object({
  phase: z.number().nullable().default(null),
  plan: z.string().nullable().default(null),
  step: z.string().nullable().default(null),
  status: z.enum(['in-progress', 'paused', 'blocked']).default('in-progress'),
  timestamp: z.string(),
}).passthrough();

export type WorkCheckpoint = z.infer<typeof WorkCheckpointSchema>;

// ============================================================================
// WorkState
// ============================================================================

/**
 * Schema for the complete persistent work state.
 *
 * Required: saved_at
 * Optional with defaults: version (1), session_id (null), active_task (null),
 *   checkpoint (null), loaded_skills ([]), queued_tasks ([]), workflow (null)
 */
export const WorkStateSchema = z.object({
  version: z.number().default(1),
  session_id: z.string().nullable().default(null),
  saved_at: z.string(),
  active_task: z.string().nullable().default(null),
  checkpoint: WorkCheckpointSchema.nullable().default(null),
  loaded_skills: z.array(z.string()).default(() => []),
  queued_tasks: z.array(QueuedTaskSchema).default(() => []),
  workflow: z.object({
    name: z.string(),
    current_step: z.string(),
    completed_steps: z.array(z.string()),
  }).nullable().default(null),
}).passthrough();

export type WorkState = z.infer<typeof WorkStateSchema>;
