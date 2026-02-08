/**
 * Tests for SessionSnapshot Zod schema and constants.
 *
 * Covers:
 * - SessionSnapshotSchema: validates full snapshot, fills defaults, rejects missing required fields, preserves extra fields
 * - Constants: DEFAULT_MAX_SNAPSHOTS, DEFAULT_SNAPSHOT_MAX_AGE_DAYS, SNAPSHOT_FILENAME
 */

import { describe, it, expect } from 'vitest';
import {
  SessionSnapshotSchema,
  DEFAULT_MAX_SNAPSHOTS,
  DEFAULT_SNAPSHOT_MAX_AGE_DAYS,
  SNAPSHOT_FILENAME,
} from './types.js';

// ============================================================================
// Full valid snapshot fixture
// ============================================================================

const VALID_FULL_SNAPSHOT = {
  session_id: 'sess-abc123',
  timestamp: 1706000000000,
  saved_at: '2026-02-08T12:00:00Z',
  summary: 'Implemented authentication system with JWT tokens',
  active_skills: ['typescript', 'git-commit'],
  files_modified: ['src/auth.ts', 'src/config.ts'],
  open_questions: ['How should we handle token refresh?'],
  metrics: {
    duration_minutes: 15,
    tool_calls: 42,
    files_read: 10,
    files_written: 5,
  },
  top_tools: ['Write', 'Read', 'Bash'],
  top_commands: ['npm', 'git', 'vitest'],
};

// ============================================================================
// SessionSnapshotSchema
// ============================================================================

describe('SessionSnapshotSchema', () => {
  it('validates a full snapshot with all fields', () => {
    const result = SessionSnapshotSchema.safeParse(VALID_FULL_SNAPSHOT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.session_id).toBe('sess-abc123');
      expect(result.data.timestamp).toBe(1706000000000);
      expect(result.data.saved_at).toBe('2026-02-08T12:00:00Z');
      expect(result.data.summary).toBe('Implemented authentication system with JWT tokens');
      expect(result.data.active_skills).toEqual(['typescript', 'git-commit']);
      expect(result.data.files_modified).toEqual(['src/auth.ts', 'src/config.ts']);
      expect(result.data.open_questions).toEqual(['How should we handle token refresh?']);
      expect(result.data.metrics.duration_minutes).toBe(15);
      expect(result.data.metrics.tool_calls).toBe(42);
      expect(result.data.metrics.files_read).toBe(10);
      expect(result.data.metrics.files_written).toBe(5);
      expect(result.data.top_tools).toEqual(['Write', 'Read', 'Bash']);
      expect(result.data.top_commands).toEqual(['npm', 'git', 'vitest']);
    }
  });

  it('validates minimal snapshot (only required fields) with defaults filled', () => {
    const input = {
      session_id: 'sess-minimal',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Quick session',
      metrics: {
        duration_minutes: 5,
        tool_calls: 3,
        files_read: 1,
        files_written: 0,
      },
    };
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active_skills).toEqual([]);
      expect(result.data.files_modified).toEqual([]);
      expect(result.data.open_questions).toEqual([]);
      expect(result.data.top_tools).toEqual([]);
      expect(result.data.top_commands).toEqual([]);
    }
  });

  it('requires session_id', () => {
    const input = { ...VALID_FULL_SNAPSHOT };
    delete (input as Record<string, unknown>).session_id;
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('requires timestamp as number (Unix ms)', () => {
    const input = { ...VALID_FULL_SNAPSHOT };
    delete (input as Record<string, unknown>).timestamp;
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects string timestamp', () => {
    const input = { ...VALID_FULL_SNAPSHOT, timestamp: '2026-02-08T12:00:00Z' };
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('requires saved_at as string', () => {
    const input = { ...VALID_FULL_SNAPSHOT };
    delete (input as Record<string, unknown>).saved_at;
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('requires summary as string', () => {
    const input = { ...VALID_FULL_SNAPSHOT };
    delete (input as Record<string, unknown>).summary;
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('defaults active_skills to empty array when omitted', () => {
    const { active_skills, ...rest } = VALID_FULL_SNAPSHOT;
    const result = SessionSnapshotSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active_skills).toEqual([]);
    }
  });

  it('defaults files_modified to empty array when omitted', () => {
    const { files_modified, ...rest } = VALID_FULL_SNAPSHOT;
    const result = SessionSnapshotSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files_modified).toEqual([]);
    }
  });

  it('defaults open_questions to empty array when omitted', () => {
    const { open_questions, ...rest } = VALID_FULL_SNAPSHOT;
    const result = SessionSnapshotSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.open_questions).toEqual([]);
    }
  });

  it('defaults top_tools to empty array when omitted', () => {
    const { top_tools, ...rest } = VALID_FULL_SNAPSHOT;
    const result = SessionSnapshotSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.top_tools).toEqual([]);
    }
  });

  it('defaults top_commands to empty array when omitted', () => {
    const { top_commands, ...rest } = VALID_FULL_SNAPSHOT;
    const result = SessionSnapshotSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.top_commands).toEqual([]);
    }
  });

  it('validates metrics with required sub-fields', () => {
    const input = {
      ...VALID_FULL_SNAPSHOT,
      metrics: { duration_minutes: 10 }, // missing tool_calls, files_read, files_written
    };
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('preserves extra fields via .passthrough() on outer schema', () => {
    const input = {
      ...VALID_FULL_SNAPSHOT,
      custom_field: 'preserved',
      nested: { a: 1 },
    };
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('preserved');
      expect((result.data as Record<string, unknown>).nested).toEqual({ a: 1 });
    }
  });

  it('preserves extra fields on metrics via .passthrough()', () => {
    const input = {
      ...VALID_FULL_SNAPSHOT,
      metrics: {
        ...VALID_FULL_SNAPSHOT.metrics,
        custom_metric: 99,
      },
    };
    const result = SessionSnapshotSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.metrics as Record<string, unknown>).custom_metric).toBe(99);
    }
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
  it('DEFAULT_MAX_SNAPSHOTS equals 20', () => {
    expect(DEFAULT_MAX_SNAPSHOTS).toBe(20);
  });

  it('DEFAULT_SNAPSHOT_MAX_AGE_DAYS equals 90', () => {
    expect(DEFAULT_SNAPSHOT_MAX_AGE_DAYS).toBe(90);
  });

  it('SNAPSHOT_FILENAME equals snapshots.jsonl', () => {
    expect(SNAPSHOT_FILENAME).toBe('snapshots.jsonl');
  });
});
