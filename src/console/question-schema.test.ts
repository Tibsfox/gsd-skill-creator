/**
 * TDD tests for the QuestionSchema Zod validation.
 *
 * Covers question types (binary, choice, multi-select, text, confirmation),
 * default values, rejection of invalid fields, timeout validation,
 * options validation, and roundtrip preservation.
 *
 * @module console/question-schema.test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { QuestionSchema } from './question-schema.js';

/** Helper: minimal valid question for reuse across tests. */
const validQuestion = {
  question_id: 'q-001',
  text: 'Continue with TDD?',
  type: 'binary' as const,
  status: 'pending' as const,
};

// ============================================================================
// Valid question parsing -- one per question type
// ============================================================================

describe('QuestionSchema valid question types', () => {
  it('parses a binary question (minimal valid)', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-001',
      text: 'Continue with TDD?',
      type: 'binary',
      status: 'pending',
    });
    expect(result).toBeDefined();
    expect(result.type).toBe('binary');
  });

  it('parses a choice question with options', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-002',
      text: 'Select a framework',
      type: 'choice',
      status: 'pending',
      options: ['option-a', 'option-b', 'option-c'],
    });
    expect(result.type).toBe('choice');
    expect(result.options).toEqual(['option-a', 'option-b', 'option-c']);
  });

  it('parses a multi-select question with options', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-003',
      text: 'Select features to enable',
      type: 'multi-select',
      status: 'pending',
      options: ['feature-a', 'feature-b'],
    });
    expect(result.type).toBe('multi-select');
    expect(result.options).toEqual(['feature-a', 'feature-b']);
  });

  it('parses a text question with default_value', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-004',
      text: 'Enter the entry file path',
      type: 'text',
      status: 'pending',
      default_value: 'src/index.ts',
    });
    expect(result.type).toBe('text');
    expect(result.default_value).toBe('src/index.ts');
  });

  it('parses a confirmation question (minimal)', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-005',
      text: 'Deploy to production?',
      type: 'confirmation',
      status: 'pending',
    });
    expect(result.type).toBe('confirmation');
  });
});

// ============================================================================
// Default value tests
// ============================================================================

describe('QuestionSchema defaults', () => {
  it('defaults status to "pending" when omitted', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-010',
      text: 'Proceed?',
      type: 'binary',
    });
    expect(result.status).toBe('pending');
  });

  it('defaults urgency to "medium" when omitted', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-011',
      text: 'Proceed?',
      type: 'binary',
    });
    expect(result.urgency).toBe('medium');
  });

  it('leaves timeout as undefined when omitted', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-012',
      text: 'Proceed?',
      type: 'binary',
    });
    expect(result.timeout).toBeUndefined();
  });

  it('leaves options as undefined when omitted', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-013',
      text: 'Proceed?',
      type: 'binary',
    });
    expect(result.options).toBeUndefined();
  });
});

// ============================================================================
// Rejection tests -- missing required fields
// ============================================================================

describe('QuestionSchema rejects missing required fields', () => {
  it('rejects missing question_id', () => {
    const { question_id: _, ...noId } = validQuestion;
    expect(() => QuestionSchema.parse(noId)).toThrow(z.ZodError);
  });

  it('rejects missing text', () => {
    const { text: _, ...noText } = validQuestion;
    expect(() => QuestionSchema.parse(noText)).toThrow(z.ZodError);
  });

  it('rejects missing type', () => {
    const { type: _, ...noType } = validQuestion;
    expect(() => QuestionSchema.parse(noType)).toThrow(z.ZodError);
  });
});

// ============================================================================
// Rejection tests -- invalid enum values
// ============================================================================

describe('QuestionSchema rejects invalid enum values', () => {
  it('rejects invalid type "dropdown"', () => {
    expect(() => QuestionSchema.parse({ ...validQuestion, type: 'dropdown' })).toThrow(z.ZodError);
  });

  it('rejects invalid status "done"', () => {
    expect(() => QuestionSchema.parse({ ...validQuestion, status: 'done' })).toThrow(z.ZodError);
  });

  it('rejects invalid urgency "extreme"', () => {
    expect(() => QuestionSchema.parse({ ...validQuestion, urgency: 'extreme' })).toThrow(z.ZodError);
  });

  it('rejects invalid timeout fallback "retry"', () => {
    expect(() => QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: 60, fallback: 'retry' },
    })).toThrow(z.ZodError);
  });
});

// ============================================================================
// Timeout object tests
// ============================================================================

describe('QuestionSchema timeout validation', () => {
  it('parses valid timeout with use_default fallback', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: 300, fallback: 'use_default' },
    });
    expect(result.timeout?.seconds).toBe(300);
    expect(result.timeout?.fallback).toBe('use_default');
  });

  it('parses timeout with "block" fallback', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: 60, fallback: 'block' },
    });
    expect(result.timeout?.fallback).toBe('block');
  });

  it('parses timeout with "skip" fallback', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: 120, fallback: 'skip' },
    });
    expect(result.timeout?.fallback).toBe('skip');
  });

  it('parses timeout with "escalate" fallback', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: 30, fallback: 'escalate' },
    });
    expect(result.timeout?.fallback).toBe('escalate');
  });

  it('rejects timeout with seconds: 0 (must be positive)', () => {
    expect(() => QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: 0, fallback: 'use_default' },
    })).toThrow(z.ZodError);
  });

  it('rejects timeout with negative seconds', () => {
    expect(() => QuestionSchema.parse({
      ...validQuestion,
      timeout: { seconds: -10, fallback: 'use_default' },
    })).toThrow(z.ZodError);
  });
});

// ============================================================================
// Options validation
// ============================================================================

describe('QuestionSchema options validation', () => {
  it('accepts choice type without options (schema is structural)', () => {
    const result = QuestionSchema.parse({
      question_id: 'q-020',
      text: 'Pick one',
      type: 'choice',
      status: 'pending',
    });
    expect(result.options).toBeUndefined();
  });

  it('accepts empty options array', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      options: [],
    });
    expect(result.options).toEqual([]);
  });

  it('rejects options with non-string elements', () => {
    expect(() => QuestionSchema.parse({
      ...validQuestion,
      options: [1, 2, 3],
    })).toThrow(z.ZodError);
  });
});

// ============================================================================
// Roundtrip test
// ============================================================================

describe('QuestionSchema roundtrip', () => {
  it('parse output matches input for a fully populated question', () => {
    const input = {
      question_id: 'q-100',
      text: 'Select deployment target',
      type: 'choice' as const,
      status: 'pending' as const,
      urgency: 'high' as const,
      options: ['staging', 'production', 'canary'],
      default_value: 'staging',
      timeout: { seconds: 600, fallback: 'use_default' as const },
      timestamp: '2026-02-13T15:00:00Z',
    };

    const result = QuestionSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('accepts boolean default_value', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      default_value: true,
    });
    expect(result.default_value).toBe(true);
  });

  it('accepts string array default_value', () => {
    const result = QuestionSchema.parse({
      ...validQuestion,
      default_value: ['opt-a', 'opt-b'],
    });
    expect(result.default_value).toEqual(['opt-a', 'opt-b']);
  });
});
