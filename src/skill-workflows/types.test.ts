/**
 * Tests for workflow Zod schemas and types.
 *
 * Covers:
 * - Valid workflow definition parses correctly with defaults filled
 * - Missing steps or empty steps array fails validation
 * - Step with needs defaults to empty array
 * - WorkflowRunEntry validates all status values
 * - .passthrough() allows unknown fields
 * - extends defaults to null when not specified
 * - WorkflowValidationResult schema
 */

import { describe, it, expect } from 'vitest';
import {
  WorkflowStepSchema,
  WorkflowDefinitionSchema,
  WorkflowRunEntrySchema,
  WorkflowValidationResultSchema,
} from './types.js';

// ============================================================================
// WorkflowStepSchema
// ============================================================================

describe('WorkflowStepSchema', () => {
  it('parses a valid step with all fields', () => {
    const result = WorkflowStepSchema.safeParse({
      id: 'lint',
      skill: 'code-linter',
      description: 'Run linting checks',
      needs: ['setup'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('lint');
      expect(result.data.skill).toBe('code-linter');
      expect(result.data.description).toBe('Run linting checks');
      expect(result.data.needs).toEqual(['setup']);
    }
  });

  it('defaults needs to empty array when not specified', () => {
    const result = WorkflowStepSchema.safeParse({
      id: 'build',
      skill: 'builder',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.needs).toEqual([]);
    }
  });

  it('allows unknown fields via passthrough', () => {
    const result = WorkflowStepSchema.safeParse({
      id: 'deploy',
      skill: 'deployer',
      custom_timeout: 30,
      retry_count: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_timeout).toBe(30);
      expect((result.data as Record<string, unknown>).retry_count).toBe(3);
    }
  });

  it('rejects step missing required id', () => {
    const result = WorkflowStepSchema.safeParse({
      skill: 'builder',
    });
    expect(result.success).toBe(false);
  });

  it('rejects step missing required skill', () => {
    const result = WorkflowStepSchema.safeParse({
      id: 'build',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WorkflowDefinitionSchema
// ============================================================================

describe('WorkflowDefinitionSchema', () => {
  it('parses a valid workflow definition with defaults filled', () => {
    const result = WorkflowDefinitionSchema.safeParse({
      name: 'ci-pipeline',
      steps: [
        { id: 'lint', skill: 'linter' },
        { id: 'test', skill: 'tester', needs: ['lint'] },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('ci-pipeline');
      expect(result.data.version).toBe(1);
      expect(result.data.extends).toBeNull();
      expect(result.data.description).toBeUndefined();
      expect(result.data.steps).toHaveLength(2);
      expect(result.data.steps[0].needs).toEqual([]);
      expect(result.data.steps[1].needs).toEqual(['lint']);
    }
  });

  it('rejects missing steps field', () => {
    const result = WorkflowDefinitionSchema.safeParse({
      name: 'no-steps',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty steps array', () => {
    const result = WorkflowDefinitionSchema.safeParse({
      name: 'empty-steps',
      steps: [],
    });
    expect(result.success).toBe(false);
  });

  it('defaults extends to null', () => {
    const result = WorkflowDefinitionSchema.safeParse({
      name: 'no-extends',
      steps: [{ id: 'a', skill: 'sa' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extends).toBeNull();
    }
  });

  it('accepts explicit extends value', () => {
    const result = WorkflowDefinitionSchema.safeParse({
      name: 'child-workflow',
      extends: 'parent-workflow',
      steps: [{ id: 'a', skill: 'sa' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extends).toBe('parent-workflow');
    }
  });

  it('allows unknown fields via passthrough', () => {
    const result = WorkflowDefinitionSchema.safeParse({
      name: 'extra-fields',
      steps: [{ id: 'a', skill: 'sa' }],
      custom_metadata: { author: 'test' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_metadata).toEqual({
        author: 'test',
      });
    }
  });
});

// ============================================================================
// WorkflowRunEntrySchema
// ============================================================================

describe('WorkflowRunEntrySchema', () => {
  const validEntry = {
    run_id: 'run-001',
    workflow_name: 'ci-pipeline',
    step_id: 'lint',
    status: 'started' as const,
    started_at: '2026-02-08T12:00:00Z',
  };

  it('validates all status values', () => {
    for (const status of ['started', 'completed', 'failed', 'skipped'] as const) {
      const result = WorkflowRunEntrySchema.safeParse({
        ...validEntry,
        status,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(status);
      }
    }
  });

  it('defaults completed_at and error to null', () => {
    const result = WorkflowRunEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed_at).toBeNull();
      expect(result.data.error).toBeNull();
    }
  });

  it('rejects invalid status value', () => {
    const result = WorkflowRunEntrySchema.safeParse({
      ...validEntry,
      status: 'cancelled',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = WorkflowRunEntrySchema.safeParse({
      run_id: 'run-001',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WorkflowValidationResultSchema
// ============================================================================

describe('WorkflowValidationResultSchema', () => {
  it('parses valid result with execution order', () => {
    const result = WorkflowValidationResultSchema.safeParse({
      valid: true,
      errors: [],
      executionOrder: ['lint', 'test', 'deploy'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valid).toBe(true);
      expect(result.data.executionOrder).toEqual(['lint', 'test', 'deploy']);
    }
  });

  it('defaults errors to empty array and executionOrder to null', () => {
    const result = WorkflowValidationResultSchema.safeParse({
      valid: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.errors).toEqual([]);
      expect(result.data.executionOrder).toBeNull();
    }
  });
});
