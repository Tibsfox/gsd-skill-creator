/**
 * Timeout fallback logic for question responses.
 *
 * When a question times out without a user response, the fallback
 * action determines what happens next: auto-answer with the default,
 * block (stay pending), skip, or escalate urgency.
 *
 * Pure function -- no filesystem side effects.
 *
 * @module console/question-responder
 */

import type { Question } from './question-schema.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Discriminated union of possible timeout fallback results. */
export type QuestionTimeoutResult =
  | { action: 'answered'; question_id: string; answer: unknown }
  | { action: 'block'; question_id: string }
  | { action: 'skipped'; question_id: string }
  | { action: 'escalated'; question_id: string; new_urgency: string }
  | { action: 'error'; reason: string }
  | { action: 'no-timeout' };

// ---------------------------------------------------------------------------
// Urgency escalation ladder
// ---------------------------------------------------------------------------

/**
 * Map of current urgency to next-higher urgency level.
 *
 * - low -> high
 * - medium -> critical
 * - high -> critical
 * - critical -> critical (ceiling)
 */
const URGENCY_LADDER: Record<string, string> = {
  low: 'high',
  medium: 'critical',
  high: 'critical',
  critical: 'critical',
};

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Apply timeout fallback behavior to a question.
 *
 * @param question - Validated Question object
 * @returns A discriminated union describing the timeout action
 */
export function applyTimeoutFallback(question: Question): QuestionTimeoutResult {
  // No timeout configured -- nothing to do
  if (!question.timeout) {
    return { action: 'no-timeout' };
  }

  const { fallback } = question.timeout;

  switch (fallback) {
    case 'use_default': {
      if (question.default_value === undefined) {
        return {
          action: 'error',
          reason: 'no default_value configured for use_default fallback',
        };
      }
      return {
        action: 'answered',
        question_id: question.question_id,
        answer: question.default_value,
      };
    }

    case 'block':
      return {
        action: 'block',
        question_id: question.question_id,
      };

    case 'skip':
      return {
        action: 'skipped',
        question_id: question.question_id,
      };

    case 'escalate': {
      const currentUrgency = question.urgency ?? 'medium';
      const newUrgency = URGENCY_LADDER[currentUrgency] ?? 'critical';
      return {
        action: 'escalated',
        question_id: question.question_id,
        new_urgency: newUrgency,
      };
    }

    default:
      return {
        action: 'error',
        reason: `unknown fallback action: ${String(fallback)}`,
      };
  }
}
