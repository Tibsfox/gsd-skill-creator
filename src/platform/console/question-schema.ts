/**
 * Zod validation schema for structured questions emitted by the session.
 *
 * Questions are displayed on the dashboard with the correct input type
 * (binary yes/no, choice radio, multi-select checkboxes, free text,
 * confirmation button) and handle timeout/urgency behavior.
 *
 * @module console/question-schema
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Timeout Schema
// ---------------------------------------------------------------------------

/**
 * Zod schema for question timeout configuration.
 *
 * Specifies how long to wait for a response and what to do if the
 * timeout expires.
 */
const TimeoutSchema = z.object({
  /** Timeout duration in seconds. Must be a positive integer. */
  seconds: z.number().int().positive(),
  /** Action to take when the timeout expires. */
  fallback: z.enum(['use_default', 'block', 'skip', 'escalate']),
});

// ---------------------------------------------------------------------------
// Question Schema
// ---------------------------------------------------------------------------

/**
 * Zod schema for question validation.
 *
 * Usage:
 * ```typescript
 * const question = QuestionSchema.parse(rawData);
 * // question is now typed and validated with defaults applied
 * ```
 */
export const QuestionSchema = z.object({
  /** Unique question ID, non-empty string. */
  question_id: z.string().min(1),

  /** Human-readable question text. */
  text: z.string().min(1),

  /** Input type the dashboard should render. */
  type: z.enum(['binary', 'choice', 'multi-select', 'text', 'confirmation']),

  /** Current lifecycle status of the question. Defaults to "pending". */
  status: z.enum(['pending', 'answered', 'timeout', 'skipped']).default('pending'),

  /** How urgently this question needs a response. Defaults to "medium". */
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  /** Available options for choice / multi-select types. */
  options: z.array(z.string()).optional(),

  /** Pre-filled default value. Accepts string, boolean, or string array. */
  default_value: z.union([z.string(), z.boolean(), z.array(z.string())]).optional(),

  /** Optional timeout configuration. */
  timeout: TimeoutSchema.optional(),

  /** ISO 8601 timestamp of when the question was created. */
  timestamp: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

/** A validated question object. */
export type Question = z.infer<typeof QuestionSchema>;

/** Valid question input types for dashboard rendering. */
export type QuestionType = Question['type'];

/** Urgency levels for question prioritization. */
export type QuestionUrgency = Question['urgency'];

/** Question lifecycle status values. */
export type QuestionStatus = Question['status'];

/** Actions to take when a question times out. */
export type TimeoutFallback = NonNullable<Question['timeout']>['fallback'];
