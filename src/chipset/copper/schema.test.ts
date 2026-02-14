/**
 * Tests for Pipeline Zod schemas and instruction types.
 *
 * Covers:
 * - WaitInstructionSchema validates GSD lifecycle events with optional timeout/description
 * - MoveInstructionSchema validates target types, activation modes, name, optional args
 * - SkipInstructionSchema validates condition with operator, left operand, optional right
 * - PipelineInstructionSchema discriminated union accepts all three instruction types
 * - PipelineMetadataSchema validates name, priority range, confidence range, passthrough
 * - PipelineSchema validates metadata + instructions array (min 1 instruction)
 */

import { describe, it, expect } from 'vitest';
import {
  WaitInstructionSchema,
  MoveInstructionSchema,
  SkipInstructionSchema,
  PipelineInstructionSchema,
  PipelineMetadataSchema,
  PipelineSchema,
} from './schema.js';

// ============================================================================
// WaitInstructionSchema
// ============================================================================

describe('WaitInstructionSchema', () => {
  it('accepts valid WAIT with type and event', () => {
    const result = WaitInstructionSchema.safeParse({
      type: 'wait',
      event: 'phase-start',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('wait');
      expect(result.data.event).toBe('phase-start');
    }
  });

  it('accepts all GSD lifecycle events', () => {
    const events = [
      'phase-start',
      'phase-planned',
      'code-complete',
      'tests-passing',
      'verify-complete',
      'end-of-frame',
      'milestone-start',
      'milestone-complete',
      'session-start',
      'session-pause',
      'session-resume',
      'session-stop',
    ];
    for (const event of events) {
      const result = WaitInstructionSchema.safeParse({ type: 'wait', event });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional timeout number field', () => {
    const result = WaitInstructionSchema.safeParse({
      type: 'wait',
      event: 'phase-start',
      timeout: 30,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeout).toBe(30);
    }
  });

  it('accepts optional description string field', () => {
    const result = WaitInstructionSchema.safeParse({
      type: 'wait',
      event: 'tests-passing',
      description: 'Wait for all tests to pass before proceeding',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Wait for all tests to pass before proceeding');
    }
  });

  it('rejects WAIT with missing event field', () => {
    const result = WaitInstructionSchema.safeParse({ type: 'wait' });
    expect(result.success).toBe(false);
  });

  it('rejects WAIT with invalid event name', () => {
    const result = WaitInstructionSchema.safeParse({
      type: 'wait',
      event: 'invalid-event',
    });
    expect(result.success).toBe(false);
  });

  it('rejects WAIT with wrong type field', () => {
    const result = WaitInstructionSchema.safeParse({
      type: 'move',
      event: 'phase-start',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MoveInstructionSchema
// ============================================================================

describe('MoveInstructionSchema', () => {
  it('accepts valid MOVE with all required fields', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'skill',
      name: 'git-commit',
      mode: 'lite',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('move');
      expect(result.data.target).toBe('skill');
      expect(result.data.name).toBe('git-commit');
      expect(result.data.mode).toBe('lite');
    }
  });

  it('accepts all target types', () => {
    const targets = ['skill', 'script', 'team'];
    for (const target of targets) {
      const result = MoveInstructionSchema.safeParse({
        type: 'move',
        target,
        name: 'test-target',
        mode: 'full',
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all activation modes', () => {
    const modes = ['lite', 'full', 'offload', 'async'];
    for (const mode of modes) {
      const result = MoveInstructionSchema.safeParse({
        type: 'move',
        target: 'skill',
        name: 'test-mode',
        mode,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional args record field', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'skill',
      name: 'git-commit',
      mode: 'lite',
      args: { message: 'initial commit', amend: false },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.args).toEqual({ message: 'initial commit', amend: false });
    }
  });

  it('accepts optional description string field', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'team',
      name: 'review-team',
      mode: 'full',
      description: 'Activate the review team with full context',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Activate the review team with full context');
    }
  });

  it('rejects MOVE with missing name', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'skill',
      mode: 'lite',
    });
    expect(result.success).toBe(false);
  });

  it('rejects MOVE with missing target', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      name: 'git-commit',
      mode: 'lite',
    });
    expect(result.success).toBe(false);
  });

  it('rejects MOVE with missing mode', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'skill',
      name: 'git-commit',
    });
    expect(result.success).toBe(false);
  });

  it('rejects MOVE with invalid target type', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'unknown',
      name: 'test',
      mode: 'lite',
    });
    expect(result.success).toBe(false);
  });

  it('rejects MOVE with invalid activation mode', () => {
    const result = MoveInstructionSchema.safeParse({
      type: 'move',
      target: 'skill',
      name: 'test',
      mode: 'turbo',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// SkipInstructionSchema
// ============================================================================

describe('SkipInstructionSchema', () => {
  it('accepts valid SKIP with condition', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'skip',
      condition: { left: 'file:tsconfig.json', op: 'exists' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('skip');
      expect(result.data.condition).toEqual({ left: 'file:tsconfig.json', op: 'exists' });
    }
  });

  it('accepts all operators', () => {
    const operators = ['exists', 'not-exists', 'equals', 'not-equals', 'contains', 'gt', 'lt'];
    for (const op of operators) {
      const result = SkipInstructionSchema.safeParse({
        type: 'skip',
        condition: { left: 'var:count', op, right: '10' },
      });
      expect(result.success).toBe(true);
    }
  });

  it('left is always required', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'skip',
      condition: { op: 'exists' },
    });
    expect(result.success).toBe(false);
  });

  it('right is optional for unary operators', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'skip',
      condition: { left: 'file:package.json', op: 'exists' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.condition.right).toBeUndefined();
    }
  });

  it('accepts optional description string field', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'skip',
      condition: { left: 'env:CI', op: 'equals', right: 'true' },
      description: 'Skip if running in CI environment',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Skip if running in CI environment');
    }
  });

  it('rejects SKIP with missing condition', () => {
    const result = SkipInstructionSchema.safeParse({ type: 'skip' });
    expect(result.success).toBe(false);
  });

  it('rejects SKIP with missing condition.left', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'skip',
      condition: { op: 'exists' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects SKIP with invalid operator', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'skip',
      condition: { left: 'file:test', op: 'invalid-op' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects SKIP with wrong type', () => {
    const result = SkipInstructionSchema.safeParse({
      type: 'wait',
      condition: { left: 'file:test', op: 'exists' },
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// PipelineInstructionSchema (discriminated union)
// ============================================================================

describe('PipelineInstructionSchema', () => {
  it('accepts a valid WAIT instruction', () => {
    const result = PipelineInstructionSchema.safeParse({
      type: 'wait',
      event: 'phase-start',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid MOVE instruction', () => {
    const result = PipelineInstructionSchema.safeParse({
      type: 'move',
      target: 'skill',
      name: 'git-commit',
      mode: 'lite',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid SKIP instruction', () => {
    const result = PipelineInstructionSchema.safeParse({
      type: 'skip',
      condition: { left: 'file:test', op: 'exists' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects instruction with unknown type', () => {
    const result = PipelineInstructionSchema.safeParse({
      type: 'jump',
      target: 'label-1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects instruction with missing type field', () => {
    const result = PipelineInstructionSchema.safeParse({
      event: 'phase-start',
    });
    expect(result.success).toBe(false);
  });

  it('error message indicates discriminator issue for unknown type', () => {
    const result = PipelineInstructionSchema.safeParse({
      type: 'jump',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorStr = JSON.stringify(result.error.issues);
      expect(errorStr).toContain('type');
    }
  });
});

// ============================================================================
// PipelineMetadataSchema
// ============================================================================

describe('PipelineMetadataSchema', () => {
  it('accepts full metadata with all fields', () => {
    const result = PipelineMetadataSchema.safeParse({
      name: 'tdd-cycle',
      description: 'TDD development cycle automation',
      sourcePatterns: ['test:fail', 'code:edit'],
      tokenEstimate: 500,
      priority: 10,
      confidence: 0.85,
      tags: ['testing', 'automation'],
      version: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('tdd-cycle');
      expect(result.data.description).toBe('TDD development cycle automation');
      expect(result.data.sourcePatterns).toEqual(['test:fail', 'code:edit']);
      expect(result.data.tokenEstimate).toBe(500);
      expect(result.data.priority).toBe(10);
      expect(result.data.confidence).toBe(0.85);
      expect(result.data.tags).toEqual(['testing', 'automation']);
      expect(result.data.version).toBe(2);
    }
  });

  it('name is required as non-empty string', () => {
    const result = PipelineMetadataSchema.safeParse({
      name: 'minimal-list',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('minimal-list');
    }
  });

  it('description is optional string', () => {
    const withDesc = PipelineMetadataSchema.safeParse({
      name: 'test',
      description: 'A test pipeline',
    });
    expect(withDesc.success).toBe(true);

    const withoutDesc = PipelineMetadataSchema.safeParse({ name: 'test' });
    expect(withoutDesc.success).toBe(true);
  });

  it('sourcePatterns is optional array of strings', () => {
    const result = PipelineMetadataSchema.safeParse({
      name: 'test',
      sourcePatterns: ['test:fail', 'code:edit', 'build:start'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourcePatterns).toEqual(['test:fail', 'code:edit', 'build:start']);
    }
  });

  it('tokenEstimate is optional non-negative number', () => {
    const result = PipelineMetadataSchema.safeParse({
      name: 'test',
      tokenEstimate: 0,
    });
    expect(result.success).toBe(true);

    const result2 = PipelineMetadataSchema.safeParse({
      name: 'test',
      tokenEstimate: 1500,
    });
    expect(result2.success).toBe(true);
  });

  it('priority defaults to 50 and is number 1-100', () => {
    const result = PipelineMetadataSchema.safeParse({ name: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(50);
    }
  });

  it('confidence defaults to 1.0 and is number 0-1', () => {
    const result = PipelineMetadataSchema.safeParse({ name: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBe(1.0);
    }
  });

  it('accepts optional tags array of strings', () => {
    const result = PipelineMetadataSchema.safeParse({
      name: 'test',
      tags: ['ci', 'automation', 'tdd'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['ci', 'automation', 'tdd']);
    }
  });

  it('accepts optional version as positive integer with default 1', () => {
    const result = PipelineMetadataSchema.safeParse({ name: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
    }

    const result2 = PipelineMetadataSchema.safeParse({ name: 'test', version: 5 });
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.version).toBe(5);
    }
  });

  it('rejects metadata with empty name', () => {
    const result = PipelineMetadataSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects metadata with priority outside 1-100 range', () => {
    const tooLow = PipelineMetadataSchema.safeParse({ name: 'test', priority: 0 });
    expect(tooLow.success).toBe(false);

    const tooHigh = PipelineMetadataSchema.safeParse({ name: 'test', priority: 101 });
    expect(tooHigh.success).toBe(false);
  });

  it('rejects metadata with confidence outside 0-1 range', () => {
    const tooLow = PipelineMetadataSchema.safeParse({ name: 'test', confidence: -0.1 });
    expect(tooLow.success).toBe(false);

    const tooHigh = PipelineMetadataSchema.safeParse({ name: 'test', confidence: 1.1 });
    expect(tooHigh.success).toBe(false);
  });

  it('rejects metadata with negative tokenEstimate', () => {
    const result = PipelineMetadataSchema.safeParse({ name: 'test', tokenEstimate: -1 });
    expect(result.success).toBe(false);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = PipelineMetadataSchema.safeParse({
      name: 'test',
      customField: 'hello',
      extraNumber: 42,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).customField).toBe('hello');
      expect((result.data as Record<string, unknown>).extraNumber).toBe(42);
    }
  });
});

// ============================================================================
// PipelineSchema
// ============================================================================

describe('PipelineSchema', () => {
  it('accepts valid list with metadata and instructions', () => {
    const result = PipelineSchema.safeParse({
      metadata: { name: 'test-cycle' },
      instructions: [
        { type: 'wait', event: 'phase-start' },
        { type: 'move', target: 'skill', name: 'git-commit', mode: 'lite' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.name).toBe('test-cycle');
      expect(result.data.instructions).toHaveLength(2);
    }
  });

  it('rejects list with missing metadata', () => {
    const result = PipelineSchema.safeParse({
      instructions: [{ type: 'wait', event: 'phase-start' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects list with missing instructions', () => {
    const result = PipelineSchema.safeParse({
      metadata: { name: 'test' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects list with empty instructions array', () => {
    const result = PipelineSchema.safeParse({
      metadata: { name: 'test' },
      instructions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects list with invalid instruction inside array', () => {
    const result = PipelineSchema.safeParse({
      metadata: { name: 'test' },
      instructions: [{ type: 'jump', target: 'nowhere' }],
    });
    expect(result.success).toBe(false);
  });

  it('validates both metadata and instructions (nested validation)', () => {
    const result = PipelineSchema.safeParse({
      metadata: { name: '' },
      instructions: [{ type: 'wait', event: 'phase-start' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts list with mixed instruction types', () => {
    const result = PipelineSchema.safeParse({
      metadata: { name: 'mixed-list' },
      instructions: [
        { type: 'wait', event: 'session-start' },
        { type: 'skip', condition: { left: 'env:CI', op: 'equals', right: 'true' } },
        { type: 'move', target: 'script', name: 'lint-fix', mode: 'offload' },
        { type: 'wait', event: 'code-complete' },
        { type: 'move', target: 'team', name: 'review-team', mode: 'full' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instructions).toHaveLength(5);
    }
  });
});
