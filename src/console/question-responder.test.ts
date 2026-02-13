/**
 * Tests for question timeout fallback logic.
 *
 * Covers all 4 fallback actions (use_default, block, skip, escalate),
 * the urgency escalation ladder, edge cases (no default, no timeout),
 * and the error path.
 *
 * @module console/question-responder.test
 */

import { describe, it, expect } from 'vitest';
import { applyTimeoutFallback } from './question-responder.js';
import type { QuestionTimeoutResult } from './question-responder.js';
import type { Question } from './question-schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal pending question with overrides. */
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    question_id: 'q-test-001',
    text: 'Test question?',
    type: 'binary',
    status: 'pending',
    urgency: 'medium',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// use_default fallback
// ---------------------------------------------------------------------------

describe('applyTimeoutFallback -- use_default', () => {
  it('returns answered with default_value when present', () => {
    const q = makeQuestion({
      timeout: { seconds: 60, fallback: 'use_default' },
      default_value: 'yes',
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'answered',
      answer: 'yes',
      question_id: 'q-test-001',
    });
  });

  it('returns error when default_value is missing', () => {
    const q = makeQuestion({
      timeout: { seconds: 60, fallback: 'use_default' },
      // no default_value
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'error',
      reason: 'no default_value configured for use_default fallback',
    });
  });

  it('accepts boolean default_value', () => {
    const q = makeQuestion({
      timeout: { seconds: 30, fallback: 'use_default' },
      default_value: true,
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'answered',
      answer: true,
      question_id: 'q-test-001',
    });
  });

  it('accepts string array default_value', () => {
    const q = makeQuestion({
      timeout: { seconds: 30, fallback: 'use_default' },
      default_value: ['opt-a', 'opt-b'],
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'answered',
      answer: ['opt-a', 'opt-b'],
      question_id: 'q-test-001',
    });
  });
});

// ---------------------------------------------------------------------------
// block fallback
// ---------------------------------------------------------------------------

describe('applyTimeoutFallback -- block', () => {
  it('returns block action with no auto-resolution', () => {
    const q = makeQuestion({
      timeout: { seconds: 60, fallback: 'block' },
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'block',
      question_id: 'q-test-001',
    });
  });
});

// ---------------------------------------------------------------------------
// skip fallback
// ---------------------------------------------------------------------------

describe('applyTimeoutFallback -- skip', () => {
  it('returns skipped action', () => {
    const q = makeQuestion({
      timeout: { seconds: 60, fallback: 'skip' },
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'skipped',
      question_id: 'q-test-001',
    });
  });
});

// ---------------------------------------------------------------------------
// escalate fallback
// ---------------------------------------------------------------------------

describe('applyTimeoutFallback -- escalate', () => {
  it('escalates medium to critical', () => {
    const q = makeQuestion({
      urgency: 'medium',
      timeout: { seconds: 60, fallback: 'escalate' },
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'escalated',
      question_id: 'q-test-001',
      new_urgency: 'critical',
    });
  });

  it('escalates low to high', () => {
    const q = makeQuestion({
      urgency: 'low',
      timeout: { seconds: 60, fallback: 'escalate' },
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'escalated',
      question_id: 'q-test-001',
      new_urgency: 'high',
    });
  });

  it('escalates high to critical', () => {
    const q = makeQuestion({
      urgency: 'high',
      timeout: { seconds: 60, fallback: 'escalate' },
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'escalated',
      question_id: 'q-test-001',
      new_urgency: 'critical',
    });
  });

  it('caps at critical (no higher)', () => {
    const q = makeQuestion({
      urgency: 'critical',
      timeout: { seconds: 60, fallback: 'escalate' },
    });
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({
      action: 'escalated',
      question_id: 'q-test-001',
      new_urgency: 'critical',
    });
  });
});

// ---------------------------------------------------------------------------
// No timeout field
// ---------------------------------------------------------------------------

describe('applyTimeoutFallback -- no timeout', () => {
  it('returns no-timeout when timeout field is absent', () => {
    const q = makeQuestion(); // no timeout
    const result = applyTimeoutFallback(q);
    expect(result).toEqual({ action: 'no-timeout' });
  });
});
