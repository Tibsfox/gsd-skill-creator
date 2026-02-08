/**
 * Tests for work state Zod schemas and types.
 *
 * Covers:
 * - QueuedTaskSchema: validates complete object, fills defaults, rejects missing required fields, preserves extra fields
 * - WorkCheckpointSchema: validates complete object, fills defaults, rejects missing timestamp, preserves extra fields
 * - WorkStateSchema: validates complete object, fills defaults for all optional fields, rejects missing saved_at, preserves extra fields
 * - DEFAULT_WORK_STATE_FILENAME constant value
 */

import { describe, it, expect } from 'vitest';
import {
  QueuedTaskSchema,
  WorkCheckpointSchema,
  WorkStateSchema,
  DEFAULT_WORK_STATE_FILENAME,
} from './types.js';

// ============================================================================
// DEFAULT_WORK_STATE_FILENAME
// ============================================================================

describe('DEFAULT_WORK_STATE_FILENAME', () => {
  it('equals current-work.yaml', () => {
    expect(DEFAULT_WORK_STATE_FILENAME).toBe('current-work.yaml');
  });
});

// ============================================================================
// QueuedTaskSchema
// ============================================================================

describe('QueuedTaskSchema', () => {
  it('validates a complete queued task object', () => {
    const input = {
      id: 'task-1',
      description: 'Implement feature X',
      skills_needed: ['typescript', 'zod'],
      priority: 'high' as const,
      created_at: '2026-02-08T12:00:00Z',
      source: 'plan-45-01',
    };
    const result = QueuedTaskSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('task-1');
      expect(result.data.description).toBe('Implement feature X');
      expect(result.data.skills_needed).toEqual(['typescript', 'zod']);
      expect(result.data.priority).toBe('high');
      expect(result.data.created_at).toBe('2026-02-08T12:00:00Z');
      expect(result.data.source).toBe('plan-45-01');
    }
  });

  it('fills defaults for skills_needed, priority, and source', () => {
    const input = {
      id: 'task-2',
      description: 'Another task',
      created_at: '2026-02-08T12:00:00Z',
    };
    const result = QueuedTaskSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills_needed).toEqual([]);
      expect(result.data.priority).toBe('medium');
      expect(result.data.source).toBeUndefined();
    }
  });

  it('rejects missing id', () => {
    const input = {
      description: 'No id',
      created_at: '2026-02-08T12:00:00Z',
    };
    const result = QueuedTaskSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const input = {
      id: 'task-3',
      created_at: '2026-02-08T12:00:00Z',
    };
    const result = QueuedTaskSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing created_at', () => {
    const input = {
      id: 'task-4',
      description: 'No timestamp',
    };
    const result = QueuedTaskSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      id: 'task-5',
      description: 'With extras',
      created_at: '2026-02-08T12:00:00Z',
      custom_field: 'preserved',
      nested: { a: 1 },
    };
    const result = QueuedTaskSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('preserved');
      expect((result.data as Record<string, unknown>).nested).toEqual({ a: 1 });
    }
  });
});

// ============================================================================
// WorkCheckpointSchema
// ============================================================================

describe('WorkCheckpointSchema', () => {
  it('validates a complete checkpoint object', () => {
    const input = {
      phase: 45,
      plan: '45-01',
      step: 'task-2',
      status: 'paused' as const,
      timestamp: '2026-02-08T12:30:00Z',
    };
    const result = WorkCheckpointSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phase).toBe(45);
      expect(result.data.plan).toBe('45-01');
      expect(result.data.step).toBe('task-2');
      expect(result.data.status).toBe('paused');
      expect(result.data.timestamp).toBe('2026-02-08T12:30:00Z');
    }
  });

  it('fills defaults for nullable phase, plan, step and status', () => {
    const input = {
      timestamp: '2026-02-08T12:30:00Z',
    };
    const result = WorkCheckpointSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phase).toBeNull();
      expect(result.data.plan).toBeNull();
      expect(result.data.step).toBeNull();
      expect(result.data.status).toBe('in-progress');
    }
  });

  it('rejects missing timestamp', () => {
    const input = {
      phase: 45,
      plan: '45-01',
    };
    const result = WorkCheckpointSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      timestamp: '2026-02-08T12:30:00Z',
      extra_info: 'kept',
    };
    const result = WorkCheckpointSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extra_info).toBe('kept');
    }
  });
});

// ============================================================================
// WorkStateSchema
// ============================================================================

describe('WorkStateSchema', () => {
  it('validates a complete work state object', () => {
    const input = {
      version: 1,
      session_id: 'sess-abc123',
      saved_at: '2026-02-08T12:00:00Z',
      active_task: 'implement-schemas',
      checkpoint: {
        phase: 45,
        plan: '45-01',
        step: 'task-1',
        status: 'in-progress' as const,
        timestamp: '2026-02-08T12:00:00Z',
      },
      loaded_skills: ['typescript', 'git-commit'],
      queued_tasks: [
        {
          id: 'task-1',
          description: 'Build schemas',
          skills_needed: ['zod'],
          priority: 'high' as const,
          created_at: '2026-02-08T11:00:00Z',
        },
      ],
      workflow: {
        name: 'execute-phase',
        current_step: 'task-1',
        completed_steps: ['init'],
      },
    };
    const result = WorkStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.session_id).toBe('sess-abc123');
      expect(result.data.saved_at).toBe('2026-02-08T12:00:00Z');
      expect(result.data.active_task).toBe('implement-schemas');
      expect(result.data.checkpoint).not.toBeNull();
      expect(result.data.checkpoint!.phase).toBe(45);
      expect(result.data.loaded_skills).toEqual(['typescript', 'git-commit']);
      expect(result.data.queued_tasks).toHaveLength(1);
      expect(result.data.queued_tasks[0].id).toBe('task-1');
      expect(result.data.workflow).not.toBeNull();
      expect(result.data.workflow!.name).toBe('execute-phase');
    }
  });

  it('fills defaults for all optional fields (version, session_id, active_task, checkpoint, loaded_skills, queued_tasks, workflow)', () => {
    const input = {
      saved_at: '2026-02-08T12:00:00Z',
    };
    const result = WorkStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.session_id).toBeNull();
      expect(result.data.active_task).toBeNull();
      expect(result.data.checkpoint).toBeNull();
      expect(result.data.loaded_skills).toEqual([]);
      expect(result.data.queued_tasks).toEqual([]);
      expect(result.data.workflow).toBeNull();
    }
  });

  it('rejects missing saved_at', () => {
    const input = {
      version: 1,
      session_id: 'sess-123',
    };
    const result = WorkStateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      saved_at: '2026-02-08T12:00:00Z',
      future_field: 'forward-compat',
      metadata: { key: 'value' },
    };
    const result = WorkStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).future_field).toBe('forward-compat');
      expect((result.data as Record<string, unknown>).metadata).toEqual({ key: 'value' });
    }
  });
});
