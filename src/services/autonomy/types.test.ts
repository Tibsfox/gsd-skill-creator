/**
 * Tests for autonomy foundation Zod schemas and types.
 *
 * Covers:
 * - ExecutionStatusSchema: validates valid statuses, rejects invalid
 * - SubversionPhaseSchema: validates valid phases, rejects invalid
 * - GateTypeSchema: validates valid gate types, rejects invalid
 * - GateCheckSchema: validates complete object, rejects missing required
 * - GateDefinitionSchema: validates complete object, rejects missing required
 * - GateResultSchema: validates complete object, optional fields, rejects invalid
 * - TeachForwardEntrySchema: validates complete object, rejects missing required
 * - ContextBudgetSchema: validates complete object, defaults, rejects missing required
 * - SubversionRecordSchema: validates complete object, optional fields, rejects missing required
 * - StateTransitionSchema: validates complete object, optional metadata, rejects missing required
 * - ExecutionStateSchema: validates complete object, defaults, nested validation, passthrough
 */

import { describe, it, expect } from 'vitest';
import {
  ExecutionStatusSchema,
  SubversionPhaseSchema,
  GateTypeSchema,
  GateCheckSchema,
  GateDefinitionSchema,
  GateResultSchema,
  TeachForwardEntrySchema,
  ContextBudgetSchema,
  SubversionRecordSchema,
  StateTransitionSchema,
  ExecutionStateSchema,
} from './types.js';

// ============================================================================
// ExecutionStatusSchema
// ============================================================================

describe('ExecutionStatusSchema', () => {
  it.each([
    'INITIALIZED',
    'RUNNING',
    'CHECKPOINTING',
    'PAUSED',
    'COMPLETING',
    'DONE',
    'FAILED',
  ])('accepts valid status: %s', (status) => {
    const result = ExecutionStatusSchema.safeParse(status);
    expect(result.success).toBe(true);
  });

  it.each([
    'UNKNOWN',
    'stopped',
    '',
    'running',
    'initialized',
  ])('rejects invalid status: %s', (status) => {
    const result = ExecutionStatusSchema.safeParse(status);
    expect(result.success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(ExecutionStatusSchema.safeParse(42).success).toBe(false);
    expect(ExecutionStatusSchema.safeParse(null).success).toBe(false);
  });
});

// ============================================================================
// SubversionPhaseSchema
// ============================================================================

describe('SubversionPhaseSchema', () => {
  it.each([
    'prepare',
    'execute',
    'verify',
    'journal',
  ])('accepts valid phase: %s', (phase) => {
    const result = SubversionPhaseSchema.safeParse(phase);
    expect(result.success).toBe(true);
  });

  it.each([
    'plan',
    'unknown',
    'PREPARE',
    '',
  ])('rejects invalid phase: %s', (phase) => {
    const result = SubversionPhaseSchema.safeParse(phase);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// GateTypeSchema
// ============================================================================

describe('GateTypeSchema', () => {
  it.each([
    'per_subversion',
    'checkpoint',
    'half_transition',
    'graduation',
    'summary',
  ])('accepts valid gate type: %s', (type) => {
    const result = GateTypeSchema.safeParse(type);
    expect(result.success).toBe(true);
  });

  it.each([
    'custom',
    'unknown',
    '',
  ])('rejects invalid gate type: %s', (type) => {
    const result = GateTypeSchema.safeParse(type);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// GateCheckSchema
// ============================================================================

describe('GateCheckSchema', () => {
  it('validates a complete gate check object', () => {
    const input = {
      pattern: '^## Summary',
      required: true,
      description: 'Must have a summary section',
    };
    const result = GateCheckSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pattern).toBe('^## Summary');
      expect(result.data.required).toBe(true);
      expect(result.data.description).toBe('Must have a summary section');
    }
  });

  it('validates without optional description', () => {
    const input = { pattern: '\\d+', required: false };
    const result = GateCheckSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('rejects missing pattern', () => {
    const result = GateCheckSchema.safeParse({ required: true });
    expect(result.success).toBe(false);
  });

  it('rejects missing required', () => {
    const result = GateCheckSchema.safeParse({ pattern: 'test' });
    expect(result.success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = { pattern: 'x', required: true, custom: 'kept' };
    const result = GateCheckSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom).toBe('kept');
    }
  });
});

// ============================================================================
// GateDefinitionSchema
// ============================================================================

describe('GateDefinitionSchema', () => {
  const validGateDefinition = {
    name: 'teaching-note-gate',
    description: 'Validates teaching note artifacts',
    path_pattern: '.planning/v1.50a/half-a/teaching-notes/tn-{n}.md',
    min_size_bytes: 512,
    blocking: true,
    content_checks: [
      { pattern: '^## Key Insights', required: true, description: 'Must have insights section' },
    ],
  };

  it('validates a complete gate definition', () => {
    const result = GateDefinitionSchema.safeParse(validGateDefinition);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('teaching-note-gate');
      expect(result.data.blocking).toBe(true);
      expect(result.data.content_checks).toHaveLength(1);
      expect(result.data.content_checks[0].pattern).toBe('^## Key Insights');
    }
  });

  it('validates with optional applies_when', () => {
    const input = { ...validGateDefinition, applies_when: 'half === "a"' };
    const result = GateDefinitionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.applies_when).toBe('half === "a"');
    }
  });

  it('validates without applies_when', () => {
    const result = GateDefinitionSchema.safeParse(validGateDefinition);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.applies_when).toBeUndefined();
    }
  });

  it('rejects missing name', () => {
    const { name: _, ...noName } = validGateDefinition;
    expect(GateDefinitionSchema.safeParse(noName).success).toBe(false);
  });

  it('rejects missing description', () => {
    const { description: _, ...noDesc } = validGateDefinition;
    expect(GateDefinitionSchema.safeParse(noDesc).success).toBe(false);
  });

  it('rejects missing path_pattern', () => {
    const { path_pattern: _, ...noPath } = validGateDefinition;
    expect(GateDefinitionSchema.safeParse(noPath).success).toBe(false);
  });

  it('rejects missing min_size_bytes', () => {
    const { min_size_bytes: _, ...noSize } = validGateDefinition;
    expect(GateDefinitionSchema.safeParse(noSize).success).toBe(false);
  });

  it('rejects missing blocking', () => {
    const { blocking: _, ...noBlocking } = validGateDefinition;
    expect(GateDefinitionSchema.safeParse(noBlocking).success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = { ...validGateDefinition, custom: 'preserved' };
    const result = GateDefinitionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom).toBe('preserved');
    }
  });
});

// ============================================================================
// GateResultSchema
// ============================================================================

describe('GateResultSchema', () => {
  it('validates a complete gate result', () => {
    const input = {
      gate_name: 'teaching-note-gate',
      gate_type: 'per_subversion' as const,
      passed: true,
      message: 'All checks passed',
      details: ['File exists', 'Content valid'],
      checked_path: '.planning/v1.50a/half-a/teaching-notes/tn-01.md',
    };
    const result = GateResultSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gate_name).toBe('teaching-note-gate');
      expect(result.data.gate_type).toBe('per_subversion');
      expect(result.data.passed).toBe(true);
      expect(result.data.details).toEqual(['File exists', 'Content valid']);
      expect(result.data.checked_path).toBe('.planning/v1.50a/half-a/teaching-notes/tn-01.md');
    }
  });

  it('validates without optional details and checked_path', () => {
    const input = {
      gate_name: 'checkpoint-gate',
      gate_type: 'checkpoint' as const,
      passed: false,
      message: 'Missing synthesis document',
    };
    const result = GateResultSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.details).toBeUndefined();
      expect(result.data.checked_path).toBeUndefined();
    }
  });

  it('rejects invalid gate_type', () => {
    const input = {
      gate_name: 'test',
      gate_type: 'custom',
      passed: true,
      message: 'ok',
    };
    expect(GateResultSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing gate_name', () => {
    const input = {
      gate_type: 'per_subversion',
      passed: true,
      message: 'ok',
    };
    expect(GateResultSchema.safeParse(input).success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      gate_name: 'test',
      gate_type: 'summary' as const,
      passed: true,
      message: 'ok',
      extra: 'preserved',
    };
    const result = GateResultSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extra).toBe('preserved');
    }
  });
});

// ============================================================================
// TeachForwardEntrySchema
// ============================================================================

describe('TeachForwardEntrySchema', () => {
  it('validates a complete teach-forward entry', () => {
    const input = {
      from_subversion: 5,
      to_subversion: 6,
      insights: ['Pattern X works well', 'Avoid approach Y'],
      extracted_at: '2026-02-28T12:00:00Z',
    };
    const result = TeachForwardEntrySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from_subversion).toBe(5);
      expect(result.data.to_subversion).toBe(6);
      expect(result.data.insights).toHaveLength(2);
      expect(result.data.extracted_at).toBe('2026-02-28T12:00:00Z');
    }
  });

  it('rejects missing from_subversion', () => {
    const input = {
      to_subversion: 6,
      insights: ['test'],
      extracted_at: '2026-02-28T12:00:00Z',
    };
    expect(TeachForwardEntrySchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing insights', () => {
    const input = {
      from_subversion: 5,
      to_subversion: 6,
      extracted_at: '2026-02-28T12:00:00Z',
    };
    expect(TeachForwardEntrySchema.safeParse(input).success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      from_subversion: 1,
      to_subversion: 2,
      insights: ['insight'],
      extracted_at: '2026-02-28T12:00:00Z',
      custom: 'kept',
    };
    const result = TeachForwardEntrySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom).toBe('kept');
    }
  });
});

// ============================================================================
// ContextBudgetSchema
// ============================================================================

describe('ContextBudgetSchema', () => {
  it('validates a complete context budget', () => {
    const input = {
      estimated_tokens: 50000,
      max_tokens: 200000,
      usage_percent: 25.0,
      threshold_percent: 80,
      last_measured_at: '2026-02-28T12:00:00Z',
    };
    const result = ContextBudgetSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimated_tokens).toBe(50000);
      expect(result.data.max_tokens).toBe(200000);
      expect(result.data.usage_percent).toBe(25.0);
      expect(result.data.threshold_percent).toBe(80);
      expect(result.data.last_measured_at).toBe('2026-02-28T12:00:00Z');
    }
  });

  it('defaults threshold_percent to 80 when omitted', () => {
    const input = {
      estimated_tokens: 10000,
      max_tokens: 200000,
      usage_percent: 5.0,
    };
    const result = ContextBudgetSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold_percent).toBe(80);
    }
  });

  it('validates without optional last_measured_at', () => {
    const input = {
      estimated_tokens: 10000,
      max_tokens: 200000,
      usage_percent: 5.0,
      threshold_percent: 90,
    };
    const result = ContextBudgetSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.last_measured_at).toBeUndefined();
    }
  });

  it('rejects missing estimated_tokens', () => {
    const input = { max_tokens: 200000, usage_percent: 5.0 };
    expect(ContextBudgetSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing max_tokens', () => {
    const input = { estimated_tokens: 10000, usage_percent: 5.0 };
    expect(ContextBudgetSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing usage_percent', () => {
    const input = { estimated_tokens: 10000, max_tokens: 200000 };
    expect(ContextBudgetSchema.safeParse(input).success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      estimated_tokens: 10000,
      max_tokens: 200000,
      usage_percent: 5.0,
      future_field: 'kept',
    };
    const result = ContextBudgetSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).future_field).toBe('kept');
    }
  });
});

// ============================================================================
// SubversionRecordSchema
// ============================================================================

describe('SubversionRecordSchema', () => {
  it('validates a complete subversion record', () => {
    const input = {
      subversion: 42,
      started_at: '2026-02-28T10:00:00Z',
      completed_at: '2026-02-28T10:05:00Z',
      phase_results: { prepare: true, execute: true, verify: true, journal: true },
      artifacts_produced: ['teaching-note-42.md', 'journal-42.md'],
      gate_results: [
        {
          gate_name: 'teaching-note-gate',
          gate_type: 'per_subversion' as const,
          passed: true,
          message: 'All checks passed',
        },
      ],
    };
    const result = SubversionRecordSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subversion).toBe(42);
      expect(result.data.phase_results.prepare).toBe(true);
      expect(result.data.artifacts_produced).toHaveLength(2);
      expect(result.data.gate_results).toHaveLength(1);
    }
  });

  it('validates without optional artifacts_produced and gate_results', () => {
    const input = {
      subversion: 1,
      started_at: '2026-02-28T10:00:00Z',
      completed_at: '2026-02-28T10:01:00Z',
      phase_results: { prepare: true, execute: true, verify: false, journal: false },
    };
    const result = SubversionRecordSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.artifacts_produced).toBeUndefined();
      expect(result.data.gate_results).toBeUndefined();
    }
  });

  it('rejects missing subversion', () => {
    const input = {
      started_at: '2026-02-28T10:00:00Z',
      completed_at: '2026-02-28T10:01:00Z',
      phase_results: {},
    };
    expect(SubversionRecordSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing started_at', () => {
    const input = {
      subversion: 1,
      completed_at: '2026-02-28T10:01:00Z',
      phase_results: {},
    };
    expect(SubversionRecordSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing phase_results', () => {
    const input = {
      subversion: 1,
      started_at: '2026-02-28T10:00:00Z',
      completed_at: '2026-02-28T10:01:00Z',
    };
    expect(SubversionRecordSchema.safeParse(input).success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      subversion: 1,
      started_at: '2026-02-28T10:00:00Z',
      completed_at: '2026-02-28T10:01:00Z',
      phase_results: {},
      custom: 'preserved',
    };
    const result = SubversionRecordSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom).toBe('preserved');
    }
  });
});

// ============================================================================
// StateTransitionSchema
// ============================================================================

describe('StateTransitionSchema', () => {
  it('validates a complete state transition', () => {
    const input = {
      from: 'INITIALIZED' as const,
      to: 'RUNNING' as const,
      trigger: 'mission_loaded',
      timestamp: '2026-02-28T10:00:00Z',
    };
    const result = StateTransitionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBe('INITIALIZED');
      expect(result.data.to).toBe('RUNNING');
      expect(result.data.trigger).toBe('mission_loaded');
    }
  });

  it('validates with optional metadata record', () => {
    const input = {
      from: 'RUNNING' as const,
      to: 'PAUSED' as const,
      trigger: 'context_exhaustion',
      timestamp: '2026-02-28T12:00:00Z',
      metadata: { reason: 'context 85% used', subversion: '42' },
    };
    const result = StateTransitionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({ reason: 'context 85% used', subversion: '42' });
    }
  });

  it('validates without optional metadata', () => {
    const input = {
      from: 'RUNNING' as const,
      to: 'DONE' as const,
      trigger: 'all_complete',
      timestamp: '2026-02-28T15:00:00Z',
    };
    const result = StateTransitionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toBeUndefined();
    }
  });

  it('rejects invalid from status', () => {
    const input = {
      from: 'INVALID',
      to: 'RUNNING',
      trigger: 'test',
      timestamp: '2026-02-28T10:00:00Z',
    };
    expect(StateTransitionSchema.safeParse(input).success).toBe(false);
  });

  it('rejects invalid to status', () => {
    const input = {
      from: 'RUNNING',
      to: 'INVALID',
      trigger: 'test',
      timestamp: '2026-02-28T10:00:00Z',
    };
    expect(StateTransitionSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing trigger', () => {
    const input = {
      from: 'RUNNING',
      to: 'DONE',
      timestamp: '2026-02-28T10:00:00Z',
    };
    expect(StateTransitionSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing timestamp', () => {
    const input = {
      from: 'RUNNING',
      to: 'DONE',
      trigger: 'test',
    };
    expect(StateTransitionSchema.safeParse(input).success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      from: 'INITIALIZED' as const,
      to: 'RUNNING' as const,
      trigger: 'start',
      timestamp: '2026-02-28T10:00:00Z',
      extra: 'kept',
    };
    const result = StateTransitionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extra).toBe('kept');
    }
  });
});

// ============================================================================
// ExecutionStateSchema
// ============================================================================

describe('ExecutionStateSchema', () => {
  const validMinimalState = {
    milestone: 'v1.53',
    status: 'INITIALIZED' as const,
    current_subversion: 0,
    started_at: '2026-02-28T10:00:00Z',
    updated_at: '2026-02-28T10:00:00Z',
  };

  const validFullState = {
    version: 2,
    milestone: 'v1.53',
    milestone_type: 'mission-pack',
    status: 'RUNNING' as const,
    current_subversion: 42,
    total_subversions: 100,
    started_at: '2026-02-28T10:00:00Z',
    updated_at: '2026-02-28T12:00:00Z',
    completed_subversions: [
      {
        subversion: 1,
        started_at: '2026-02-28T10:00:00Z',
        completed_at: '2026-02-28T10:01:00Z',
        phase_results: { prepare: true, execute: true, verify: true, journal: true },
      },
    ],
    checkpoints: [10, 20, 30, 40],
    transitions: [
      {
        from: 'INITIALIZED' as const,
        to: 'RUNNING' as const,
        trigger: 'mission_loaded',
        timestamp: '2026-02-28T10:00:00Z',
      },
    ],
    current_phase: 'execute' as const,
    context_budget: {
      estimated_tokens: 80000,
      max_tokens: 200000,
      usage_percent: 40.0,
      threshold_percent: 80,
    },
    last_error: null,
    resume_from: null,
  };

  it('validates a complete execution state with all fields', () => {
    const result = ExecutionStateSchema.safeParse(validFullState);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(2);
      expect(result.data.milestone).toBe('v1.53');
      expect(result.data.milestone_type).toBe('mission-pack');
      expect(result.data.status).toBe('RUNNING');
      expect(result.data.current_subversion).toBe(42);
      expect(result.data.total_subversions).toBe(100);
      expect(result.data.completed_subversions).toHaveLength(1);
      expect(result.data.checkpoints).toEqual([10, 20, 30, 40]);
      expect(result.data.transitions).toHaveLength(1);
      expect(result.data.current_phase).toBe('execute');
      expect(result.data.context_budget).not.toBeNull();
      expect(result.data.context_budget!.usage_percent).toBe(40.0);
    }
  });

  it('fills defaults for optional fields', () => {
    const result = ExecutionStateSchema.safeParse(validMinimalState);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.total_subversions).toBe(100);
      expect(result.data.completed_subversions).toEqual([]);
      expect(result.data.checkpoints).toEqual([]);
      expect(result.data.transitions).toEqual([]);
      expect(result.data.current_phase).toBeNull();
      expect(result.data.context_budget).toBeNull();
      expect(result.data.last_error).toBeNull();
      expect(result.data.resume_from).toBeNull();
      expect(result.data.milestone_type).toBeUndefined();
    }
  });

  it('rejects missing milestone', () => {
    const { milestone: _, ...noMilestone } = validMinimalState;
    expect(ExecutionStateSchema.safeParse(noMilestone).success).toBe(false);
  });

  it('rejects missing status', () => {
    const { status: _, ...noStatus } = validMinimalState;
    expect(ExecutionStateSchema.safeParse(noStatus).success).toBe(false);
  });

  it('rejects invalid status value', () => {
    const input = { ...validMinimalState, status: 'UNKNOWN' };
    expect(ExecutionStateSchema.safeParse(input).success).toBe(false);
  });

  it('rejects missing current_subversion', () => {
    const { current_subversion: _, ...noSub } = validMinimalState;
    expect(ExecutionStateSchema.safeParse(noSub).success).toBe(false);
  });

  it('rejects missing started_at', () => {
    const { started_at: _, ...noStart } = validMinimalState;
    expect(ExecutionStateSchema.safeParse(noStart).success).toBe(false);
  });

  it('rejects missing updated_at', () => {
    const { updated_at: _, ...noUpdate } = validMinimalState;
    expect(ExecutionStateSchema.safeParse(noUpdate).success).toBe(false);
  });

  it('validates nested SubversionRecord within completed_subversions', () => {
    const input = {
      ...validMinimalState,
      completed_subversions: [
        {
          subversion: 1,
          started_at: '2026-02-28T10:00:00Z',
          completed_at: '2026-02-28T10:01:00Z',
          phase_results: { prepare: true, execute: true, verify: true, journal: true },
          gate_results: [
            {
              gate_name: 'test-gate',
              gate_type: 'per_subversion' as const,
              passed: true,
              message: 'Passed',
            },
          ],
        },
      ],
    };
    const result = ExecutionStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed_subversions[0].gate_results).toHaveLength(1);
    }
  });

  it('validates nested StateTransition within transitions', () => {
    const input = {
      ...validMinimalState,
      transitions: [
        {
          from: 'INITIALIZED' as const,
          to: 'RUNNING' as const,
          trigger: 'start',
          timestamp: '2026-02-28T10:00:00Z',
          metadata: { info: 'test' },
        },
      ],
    };
    const result = ExecutionStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transitions[0].metadata).toEqual({ info: 'test' });
    }
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      ...validMinimalState,
      future_field: 'preserved',
      nested_extra: { a: 1 },
    };
    const result = ExecutionStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).future_field).toBe('preserved');
      expect((result.data as Record<string, unknown>).nested_extra).toEqual({ a: 1 });
    }
  });

  it('handles resume_from with a non-null value', () => {
    const input = { ...validMinimalState, resume_from: 25 };
    const result = ExecutionStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resume_from).toBe(25);
    }
  });

  it('handles last_error with a non-null value', () => {
    const input = { ...validMinimalState, status: 'FAILED' as const, last_error: 'Gate check failed' };
    const result = ExecutionStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.last_error).toBe('Gate check failed');
    }
  });
});
