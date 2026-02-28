/**
 * Tests for event Zod schemas and types.
 *
 * Covers:
 * - SkillEventsSchema validates valid events object with emits/listens
 * - SkillEventsSchema rejects invalid event names not matching category:action format
 * - SkillEventsSchema accepts empty arrays for emits/listens
 * - SkillEventsSchema makes both fields optional
 * - EventEntrySchema validates full entry with all fields
 * - EventEntrySchema defaults consumed_by and consumed_at to null
 * - EventEntrySchema defaults ttl_hours to 24
 * - EventEntrySchema rejects entry with invalid event_name format
 * - EventEntrySchema uses .passthrough() (extra fields survive parse)
 */

import { describe, it, expect } from 'vitest';
import {
  SkillEventsSchema,
  EventEntrySchema,
  EventNameSchema,
} from './types.js';

// ============================================================================
// EventNameSchema
// ============================================================================

describe('EventNameSchema', () => {
  it('accepts valid category:action names', () => {
    expect(EventNameSchema.safeParse('lint:complete').success).toBe(true);
    expect(EventNameSchema.safeParse('test:fail').success).toBe(true);
    expect(EventNameSchema.safeParse('build:start').success).toBe(true);
    expect(EventNameSchema.safeParse('deploy-prod:rollback').success).toBe(true);
  });

  it('rejects names without colon', () => {
    expect(EventNameSchema.safeParse('no-colon').success).toBe(false);
  });

  it('rejects names with uppercase', () => {
    expect(EventNameSchema.safeParse('BadName').success).toBe(false);
    expect(EventNameSchema.safeParse('Lint:Complete').success).toBe(false);
  });

  it('rejects names with leading colon', () => {
    expect(EventNameSchema.safeParse(':leading').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(EventNameSchema.safeParse('').success).toBe(false);
  });
});

// ============================================================================
// SkillEventsSchema
// ============================================================================

describe('SkillEventsSchema', () => {
  it('validates valid events object with emits and listens', () => {
    const result = SkillEventsSchema.safeParse({
      emits: ['lint:complete'],
      listens: ['test:fail'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emits).toEqual(['lint:complete']);
      expect(result.data.listens).toEqual(['test:fail']);
    }
  });

  it('rejects invalid event names in emits', () => {
    const result = SkillEventsSchema.safeParse({
      emits: ['BadName'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid event names in listens', () => {
    const result = SkillEventsSchema.safeParse({
      listens: ['no-colon'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty arrays for emits and listens', () => {
    const result = SkillEventsSchema.safeParse({
      emits: [],
      listens: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emits).toEqual([]);
      expect(result.data.listens).toEqual([]);
    }
  });

  it('makes both fields optional', () => {
    const result = SkillEventsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emits).toBeUndefined();
      expect(result.data.listens).toBeUndefined();
    }
  });

  it('accepts emits without listens', () => {
    const result = SkillEventsSchema.safeParse({
      emits: ['lint:complete'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emits).toEqual(['lint:complete']);
      expect(result.data.listens).toBeUndefined();
    }
  });

  it('preserves unknown fields via passthrough', () => {
    const result = SkillEventsSchema.safeParse({
      emits: ['lint:complete'],
      custom_field: 'hello',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('hello');
    }
  });
});

// ============================================================================
// EventEntrySchema
// ============================================================================

describe('EventEntrySchema', () => {
  it('validates full entry with all fields', () => {
    const result = EventEntrySchema.safeParse({
      event_name: 'lint:complete',
      emitted_by: 'eslint-skill',
      status: 'pending',
      emitted_at: '2026-02-08T12:00:00Z',
      consumed_by: 'report-skill',
      consumed_at: '2026-02-08T12:01:00Z',
      ttl_hours: 48,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event_name).toBe('lint:complete');
      expect(result.data.emitted_by).toBe('eslint-skill');
      expect(result.data.status).toBe('pending');
      expect(result.data.emitted_at).toBe('2026-02-08T12:00:00Z');
      expect(result.data.consumed_by).toBe('report-skill');
      expect(result.data.consumed_at).toBe('2026-02-08T12:01:00Z');
      expect(result.data.ttl_hours).toBe(48);
    }
  });

  it('defaults consumed_by and consumed_at to null', () => {
    const result = EventEntrySchema.safeParse({
      event_name: 'test:fail',
      emitted_by: 'jest-skill',
      status: 'pending',
      emitted_at: '2026-02-08T12:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consumed_by).toBeNull();
      expect(result.data.consumed_at).toBeNull();
    }
  });

  it('defaults ttl_hours to 24', () => {
    const result = EventEntrySchema.safeParse({
      event_name: 'test:fail',
      emitted_by: 'jest-skill',
      status: 'pending',
      emitted_at: '2026-02-08T12:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ttl_hours).toBe(24);
    }
  });

  it('rejects entry with invalid event_name format', () => {
    const result = EventEntrySchema.safeParse({
      event_name: 'BadName',
      emitted_by: 'skill-a',
      status: 'pending',
      emitted_at: '2026-02-08T12:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects entry with empty emitted_by', () => {
    const result = EventEntrySchema.safeParse({
      event_name: 'lint:complete',
      emitted_by: '',
      status: 'pending',
      emitted_at: '2026-02-08T12:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('validates all status values', () => {
    for (const status of ['pending', 'consumed', 'expired'] as const) {
      const result = EventEntrySchema.safeParse({
        event_name: 'lint:complete',
        emitted_by: 'skill-a',
        status,
        emitted_at: '2026-02-08T12:00:00Z',
      });
      expect(result.success).toBe(true);
    }
  });

  it('preserves unknown fields via passthrough', () => {
    const result = EventEntrySchema.safeParse({
      event_name: 'lint:complete',
      emitted_by: 'skill-a',
      status: 'pending',
      emitted_at: '2026-02-08T12:00:00Z',
      custom_field: 'extra',
      priority: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('extra');
      expect((result.data as Record<string, unknown>).priority).toBe(5);
    }
  });
});
