/**
 * Tests for schema validation utilities.
 *
 * Covers:
 * - validateExecutionState: 7 state transition scenarios, rejection, defaults
 * - validateGateConfig: valid configs, rejection, pedagogical scenario
 * - JSON Schema structural alignment with Zod schemas
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateExecutionState,
  validateGateConfig,
  type ValidationResult,
} from './schema-validation.js';
import type { ExecutionState } from './types.js';

// ============================================================================
// Test Fixtures — 7 state transition scenarios
// ============================================================================

/** Transition 1: Fresh INITIALIZED state with no completed subversions */
const FRESH_STATE = {
  milestone: 'v1.53',
  status: 'INITIALIZED',
  current_subversion: 0,
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

/** Transition 2: INITIALIZED -> RUNNING (mission plan loaded) */
const INITIALIZED_TO_RUNNING = {
  milestone: 'v1.53',
  status: 'RUNNING',
  current_subversion: 0,
  current_phase: 'prepare',
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:01:00Z',
  transitions: [
    {
      from: 'INITIALIZED',
      to: 'RUNNING',
      trigger: 'mission_plan_loaded',
      timestamp: '2026-03-01T00:01:00Z',
    },
  ],
};

/** Transition 3: RUNNING -> RUNNING (subversion complete, increment) */
const RUNNING_TO_RUNNING = {
  milestone: 'v1.53',
  status: 'RUNNING',
  current_subversion: 1,
  current_phase: 'prepare',
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:10:00Z',
  completed_subversions: [
    {
      subversion: 0,
      started_at: '2026-03-01T00:01:00Z',
      completed_at: '2026-03-01T00:10:00Z',
      phase_results: { prepare: true, execute: true, verify: true, journal: true },
    },
  ],
  transitions: [
    {
      from: 'INITIALIZED',
      to: 'RUNNING',
      trigger: 'mission_plan_loaded',
      timestamp: '2026-03-01T00:01:00Z',
    },
  ],
};

/** Transition 4: RUNNING -> CHECKPOINTING (10th subversion) */
const RUNNING_TO_CHECKPOINTING = {
  milestone: 'v1.53',
  status: 'CHECKPOINTING',
  current_subversion: 10,
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T01:00:00Z',
  checkpoints: [10],
  transitions: [
    {
      from: 'RUNNING',
      to: 'CHECKPOINTING',
      trigger: 'checkpoint_interval',
      timestamp: '2026-03-01T01:00:00Z',
    },
  ],
};

/** Transition 5: RUNNING -> PAUSED (context budget exceeded 80%) */
const RUNNING_TO_PAUSED = {
  milestone: 'v1.53',
  status: 'PAUSED',
  current_subversion: 15,
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T01:30:00Z',
  context_budget: {
    estimated_tokens: 85000,
    max_tokens: 100000,
    usage_percent: 85,
    threshold_percent: 80,
    last_measured_at: '2026-03-01T01:30:00Z',
  },
  resume_from: 15,
  transitions: [
    {
      from: 'RUNNING',
      to: 'PAUSED',
      trigger: 'context_budget_exceeded',
      timestamp: '2026-03-01T01:30:00Z',
    },
  ],
};

/** Transition 6: PAUSED -> RUNNING (resume from checkpoint) */
const PAUSED_TO_RUNNING = {
  milestone: 'v1.53',
  status: 'RUNNING',
  current_subversion: 15,
  current_phase: 'prepare',
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T02:00:00Z',
  resume_from: null,
  context_budget: {
    estimated_tokens: 5000,
    max_tokens: 100000,
    usage_percent: 5,
    threshold_percent: 80,
    last_measured_at: '2026-03-01T02:00:00Z',
  },
  transitions: [
    {
      from: 'PAUSED',
      to: 'RUNNING',
      trigger: 'session_resumed',
      timestamp: '2026-03-01T02:00:00Z',
    },
  ],
};

/** Transition 7: RUNNING -> COMPLETING -> DONE (final subversion, graduation) */
const RUNNING_TO_DONE = {
  milestone: 'v1.53',
  status: 'DONE',
  current_subversion: 99,
  total_subversions: 100,
  started_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T10:00:00Z',
  transitions: [
    {
      from: 'RUNNING',
      to: 'COMPLETING',
      trigger: 'final_subversion_complete',
      timestamp: '2026-03-01T09:59:00Z',
    },
    {
      from: 'COMPLETING',
      to: 'DONE',
      trigger: 'graduation_gate_passed',
      timestamp: '2026-03-01T10:00:00Z',
    },
  ],
};

// ============================================================================
// Gate Config Fixtures
// ============================================================================

/** Pedagogical gate config with learning_journal and teach_forward */
const PEDAGOGICAL_GATE_CONFIG = {
  version: '1.0.0',
  milestone: 'v1.53',
  milestone_type: 'pedagogical',
  gates: {
    per_subversion: [
      {
        name: 'learning_journal',
        description: 'Learning journal for each subversion',
        path_pattern: '.planning/{milestone}/learning-journals/{subversion}.md',
        min_size_bytes: 200,
        blocking: true,
        content_checks: [{ pattern: '## What Was Learned', required: true }],
      },
      {
        name: 'teach_forward',
        description: 'Teach-forward document for next subversion',
        path_pattern: '.planning/{milestone}/teach-forward/{next_subversion}.md',
        min_size_bytes: 100,
        blocking: true,
        content_checks: [{ pattern: '## Insights', required: true }],
      },
    ],
    checkpoint: [],
    half_transition: [],
    graduation: [],
    summary: [],
  },
};

/** Implementation gate config */
const IMPLEMENTATION_GATE_CONFIG = {
  version: '1.0.0',
  milestone: 'v1.54',
  milestone_type: 'implementation',
  gates: {
    per_subversion: [
      {
        name: 'test_file',
        description: 'Test file for implementation',
        path_pattern: 'src/**/*.test.ts',
        min_size_bytes: 100,
        blocking: true,
        content_checks: [{ pattern: 'describe\\(', required: true }],
      },
    ],
    checkpoint: [],
    half_transition: [],
    graduation: [],
    summary: [],
  },
};

/** Minimal valid gate config */
const MINIMAL_GATE_CONFIG = {
  version: '1.0.0',
  milestone: 'v1.55',
  milestone_type: 'validation',
  gates: {
    per_subversion: [],
    checkpoint: [],
    half_transition: [],
    graduation: [],
    summary: [],
  },
};

// ============================================================================
// validateExecutionState — 7 state transitions
// ============================================================================

describe('validateExecutionState', () => {
  it('accepts fresh INITIALIZED state (transition 1)', () => {
    const result = validateExecutionState(FRESH_STATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('INITIALIZED');
      expect(result.data.current_subversion).toBe(0);
    }
  });

  it('accepts INITIALIZED -> RUNNING transition (transition 2)', () => {
    const result = validateExecutionState(INITIALIZED_TO_RUNNING);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('RUNNING');
      expect(result.data.current_phase).toBe('prepare');
      expect(result.data.transitions).toHaveLength(1);
    }
  });

  it('accepts RUNNING -> RUNNING transition (transition 3)', () => {
    const result = validateExecutionState(RUNNING_TO_RUNNING);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('RUNNING');
      expect(result.data.current_subversion).toBe(1);
      expect(result.data.completed_subversions).toHaveLength(1);
    }
  });

  it('accepts RUNNING -> CHECKPOINTING transition (transition 4)', () => {
    const result = validateExecutionState(RUNNING_TO_CHECKPOINTING);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('CHECKPOINTING');
      expect(result.data.checkpoints).toContain(10);
    }
  });

  it('accepts RUNNING -> PAUSED transition (transition 5)', () => {
    const result = validateExecutionState(RUNNING_TO_PAUSED);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('PAUSED');
      expect(result.data.context_budget?.usage_percent).toBe(85);
      expect(result.data.resume_from).toBe(15);
    }
  });

  it('accepts PAUSED -> RUNNING transition (transition 6)', () => {
    const result = validateExecutionState(PAUSED_TO_RUNNING);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('RUNNING');
      expect(result.data.resume_from).toBeNull();
      expect(result.data.context_budget?.usage_percent).toBe(5);
    }
  });

  it('accepts RUNNING -> COMPLETING -> DONE transition (transition 7)', () => {
    const result = validateExecutionState(RUNNING_TO_DONE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('DONE');
      expect(result.data.transitions).toHaveLength(2);
      expect(result.data.transitions[1].to).toBe('DONE');
    }
  });
});

// ============================================================================
// validateExecutionState — rejection
// ============================================================================

describe('validateExecutionState rejection', () => {
  it('rejects invalid status enum value', () => {
    const result = validateExecutionState({
      ...FRESH_STATE,
      status: 'UNKNOWN',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('status');
    }
  });

  it('rejects missing required fields', () => {
    const result = validateExecutionState({
      milestone: 'v1.53',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      // Should mention the missing fields
      const combined = result.errors.join(' ');
      expect(combined).toContain('status');
    }
  });

  it('rejects wrong type for current_subversion', () => {
    const result = validateExecutionState({
      ...FRESH_STATE,
      current_subversion: 'not-a-number',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('current_subversion');
    }
  });

  it('rejects invalid nested transition data', () => {
    const result = validateExecutionState({
      ...FRESH_STATE,
      transitions: [{ from: 'INVALID_STATE', to: 'ALSO_INVALID', trigger: 'test', timestamp: 'now' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const combined = result.errors.join(' ');
      expect(combined).toContain('transitions');
    }
  });
});

// ============================================================================
// validateExecutionState — defaults
// ============================================================================

describe('validateExecutionState defaults', () => {
  it('applies default version=1 when not provided', () => {
    const result = validateExecutionState(FRESH_STATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
    }
  });

  it('applies default total_subversions=100 when not provided', () => {
    const result = validateExecutionState(FRESH_STATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_subversions).toBe(100);
    }
  });

  it('applies default empty arrays for optional array fields', () => {
    const result = validateExecutionState(FRESH_STATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed_subversions).toEqual([]);
      expect(result.data.checkpoints).toEqual([]);
      expect(result.data.transitions).toEqual([]);
    }
  });

  it('applies default null for optional nullable fields', () => {
    const result = validateExecutionState(FRESH_STATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.current_phase).toBeNull();
      expect(result.data.context_budget).toBeNull();
      expect(result.data.last_error).toBeNull();
      expect(result.data.resume_from).toBeNull();
    }
  });
});

// ============================================================================
// validateGateConfig — valid configs
// ============================================================================

describe('validateGateConfig', () => {
  it('accepts pedagogical gate config with per_subversion gates', () => {
    const result = validateGateConfig(PEDAGOGICAL_GATE_CONFIG);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.milestone_type).toBe('pedagogical');
      expect(result.data.gates.per_subversion).toHaveLength(2);
      expect(result.data.gates.per_subversion[0].name).toBe('learning_journal');
      expect(result.data.gates.per_subversion[1].name).toBe('teach_forward');
    }
  });

  it('accepts implementation gate config', () => {
    const result = validateGateConfig(IMPLEMENTATION_GATE_CONFIG);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.milestone_type).toBe('implementation');
    }
  });

  it('accepts minimal valid gate config with empty gate arrays', () => {
    const result = validateGateConfig(MINIMAL_GATE_CONFIG);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gates.per_subversion).toEqual([]);
      expect(result.data.gates.checkpoint).toEqual([]);
    }
  });
});

// ============================================================================
// validateGateConfig — rejection
// ============================================================================

describe('validateGateConfig rejection', () => {
  it('rejects invalid milestone_type enum value', () => {
    const result = validateGateConfig({
      ...PEDAGOGICAL_GATE_CONFIG,
      milestone_type: 'invalid_type',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('milestone_type');
    }
  });

  it('rejects missing gates object', () => {
    const result = validateGateConfig({
      version: '1.0.0',
      milestone: 'v1.53',
      milestone_type: 'pedagogical',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const combined = result.errors.join(' ');
      expect(combined).toContain('gates');
    }
  });

  it('rejects gate definition missing required fields', () => {
    const result = validateGateConfig({
      version: '1.0.0',
      milestone: 'v1.53',
      milestone_type: 'pedagogical',
      gates: {
        per_subversion: [
          {
            // Missing: name, description, path_pattern, min_size_bytes, blocking, content_checks
          },
        ],
        checkpoint: [],
        half_transition: [],
        graduation: [],
        summary: [],
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// JSON Schema structural alignment
// ============================================================================

describe('JSON Schema structural alignment', () => {
  const schemasDir = resolve(__dirname, '../../../data/schemas/autonomy');

  it('execution-state.schema.json status enum matches Zod schema', () => {
    const schemaPath = resolve(schemasDir, 'execution-state.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    const expectedStatuses = [
      'INITIALIZED', 'RUNNING', 'CHECKPOINTING', 'PAUSED', 'COMPLETING', 'DONE', 'FAILED',
    ];
    expect(schema.properties.status.enum).toEqual(expectedStatuses);
  });

  it('execution-state.schema.json required fields match Zod schema', () => {
    const schemaPath = resolve(schemasDir, 'execution-state.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    // Required fields in the Zod schema (no defaults)
    expect(schema.required).toContain('milestone');
    expect(schema.required).toContain('status');
    expect(schema.required).toContain('current_subversion');
    expect(schema.required).toContain('started_at');
    expect(schema.required).toContain('updated_at');
  });

  it('artifact-gate.schema.json has gates structure with all 5 gate types', () => {
    const schemaPath = resolve(schemasDir, 'artifact-gate.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    const gateTypes = Object.keys(schema.properties.gates.properties);
    expect(gateTypes).toContain('per_subversion');
    expect(gateTypes).toContain('checkpoint');
    expect(gateTypes).toContain('half_transition');
    expect(gateTypes).toContain('graduation');
    expect(gateTypes).toContain('summary');
  });

  it('artifact-gate.schema.json milestone_type enum matches expected values', () => {
    const schemaPath = resolve(schemasDir, 'artifact-gate.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    expect(schema.properties.milestone_type.enum).toEqual([
      'pedagogical', 'implementation', 'validation', 'integration',
    ]);
  });
});
