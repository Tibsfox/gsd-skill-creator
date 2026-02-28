/**
 * Learner Observation Types and Schemas
 *
 * Zod schemas for all learner interaction observations: activity completion,
 * assessment results, time spent, and pack lifecycle events.
 *
 * These schemas validate observations emitted by the skill-creator integration
 * point. All observations include:
 * - Unique ID (UUID)
 * - ISO 8601 timestamp
 * - Learner ID and pack ID for correlation
 * - Discriminant 'kind' field
 * - Type-specific fields (activity ID, score, duration, etc.)
 *
 * Usage: import { LearnerObservationSchema, ActivityCompletionSchema } from './observation-types.js'
 */

import { z } from 'zod';

// ============================================================================
// ObservationKind
// ============================================================================

/**
 * Enumeration of all observation kinds that can be emitted.
 *
 * - activity_completion: learner completed an activity
 * - assessment_result: learner completed an assessment and received a rubric level
 * - time_spent: learner spent time on pack/module/activity
 * - module_start: learner started a module
 * - pack_start: learner started a pack
 * - pack_complete: learner completed an entire pack
 */
export const ObservationKind = [
  'activity_completion',
  'assessment_result',
  'time_spent',
  'module_start',
  'pack_start',
  'pack_complete',
] as const;

export type ObservationKind = (typeof ObservationKind)[number];

// ============================================================================
// BaseObservationSchema
// ============================================================================

/**
 * Shared fields present in all observations.
 *
 * - id: auto-generated UUID, uniquely identifies this observation
 * - timestamp: ISO 8601 string, when the observation was recorded
 * - learnerId: identifier for the learner
 * - packId: identifier for the knowledge pack
 * - kind: discriminant field, determines which type union member this is
 */
const BaseObservationSchema = z.object({
  id: z.string().min(1).describe('UUID, auto-generated'),
  timestamp: z.string().describe('ISO 8601 timestamp'),
  learnerId: z.string().min(1).describe('Learner identifier'),
  packId: z.string().min(1).describe('Knowledge pack identifier'),
  kind: z.enum(ObservationKind).describe('Observation type discriminant'),
});

// ============================================================================
// ActivityCompletionSchema
// ============================================================================

/**
 * Activity completion observation.
 *
 * Emitted when a learner finishes an activity. Includes activity ID, module ID,
 * time spent, and completion status. Score is optional for activities that
 * don't produce numeric scores.
 */
export const ActivityCompletionSchema = BaseObservationSchema.extend({
  kind: z.literal('activity_completion'),
  activityId: z.string().min(1).describe('Activity identifier'),
  moduleId: z.string().min(1).describe('Module identifier'),
  durationMinutes: z.number().nonnegative().describe('Time spent in minutes'),
  completed: z.boolean().describe('Whether activity was completed'),
  score: z.number().min(0).max(100).optional().describe('Optional numeric score'),
});

export type ActivityCompletion = z.infer<typeof ActivityCompletionSchema>;

// ============================================================================
// AssessmentResultSchema
// ============================================================================

/**
 * Assessment result observation.
 *
 * Emitted when a learner completes an assessment and receives evaluation.
 * Includes rubric level (Beginning, Developing, Proficient, Advanced),
 * numeric score, time spent, and optional strengths/areas for growth.
 */
export const AssessmentResultSchema = BaseObservationSchema.extend({
  kind: z.literal('assessment_result'),
  moduleId: z.string().min(1).describe('Module identifier'),
  rubricLevel: z
    .enum(['beginning', 'developing', 'proficient', 'advanced'])
    .describe('Rubric performance level'),
  score: z.number().min(0).max(100).describe('Numeric score 0-100'),
  timeSpentMinutes: z.number().nonnegative().describe('Time spent in minutes'),
  strengths: z
    .array(z.string())
    .default([])
    .describe('Observed strengths from assessment'),
  areasForGrowth: z
    .array(z.string())
    .default([])
    .describe('Areas identified for growth'),
});

export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

// ============================================================================
// TimeSpentSchema
// ============================================================================

/**
 * Time spent observation.
 *
 * Emitted to track engagement. Can be at pack level (moduleId and activityId
 * both omitted), module level (activityId omitted), or activity level (both
 * specified). Requires positive minutes and ISO date.
 */
export const TimeSpentSchema = BaseObservationSchema.extend({
  kind: z.literal('time_spent'),
  moduleId: z.string().min(1).optional().describe('Module identifier (optional)'),
  activityId: z.string().min(1).optional().describe('Activity identifier (optional)'),
  minutes: z.number().positive().describe('Minutes spent (must be positive)'),
  sessionDate: z.string().describe('ISO date string'),
});

export type TimeSpent = z.infer<typeof TimeSpentSchema>;

// ============================================================================
// PackLifecycleSchema
// ============================================================================

/**
 * Pack lifecycle observation.
 *
 * Emitted when learner starts a module, starts a pack, or completes a pack.
 * The 'kind' discriminant determines which lifecycle event this is.
 */
export const PackLifecycleSchema = BaseObservationSchema.extend({
  kind: z.enum(['module_start', 'pack_start', 'pack_complete']),
});

export type PackLifecycle = z.infer<typeof PackLifecycleSchema>;

// ============================================================================
// LearnerObservationSchema (Discriminated Union)
// ============================================================================

/**
 * Discriminated union of all learner observation types.
 *
 * The 'kind' field determines which type this observation is. Zod's
 * discriminatedUnion ensures type narrowing and exhaustive pattern matching.
 *
 * Usage:
 *   const result = LearnerObservationSchema.safeParse(data)
 *   if (result.success) {
 *     const obs: LearnerObservation = result.data
 *     // TypeScript knows the exact kind and fields
 *   }
 */
export const LearnerObservationSchema = z.discriminatedUnion('kind', [
  ActivityCompletionSchema,
  AssessmentResultSchema,
  TimeSpentSchema,
  PackLifecycleSchema,
]);

export type LearnerObservation = z.infer<typeof LearnerObservationSchema>;
