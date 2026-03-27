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
  WarmStartContextSchema,
  HandoffSkillMetaSchema,
  SENSITIVE_PATH_PATTERNS,
  filterSensitivePaths,
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

// ============================================================================
// WarmStartContextSchema
// ============================================================================

const VALID_WARM_START_CONTEXT = {
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
  suggested_skills: ['jwt-auth', 'express-middleware'],
  stale_files: ['src/old-auth.ts'],
  decisions: ['Use JWT tokens for auth', 'Refresh tokens in HTTP-only cookies'],
  blockers: ['Redis not yet configured'],
  current_phase: { phase: 3, name: 'Auth System' },
  generated_at: '2026-02-08T12:05:00Z',
  staleness_warning: 'Snapshot is 3 days old',
};

describe('WarmStartContextSchema', () => {
  it('validates a full WarmStartContext with all fields', () => {
    const result = WarmStartContextSchema.safeParse(VALID_WARM_START_CONTEXT);
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
      expect(result.data.top_tools).toEqual(['Write', 'Read', 'Bash']);
      expect(result.data.top_commands).toEqual(['npm', 'git', 'vitest']);
      expect(result.data.suggested_skills).toEqual(['jwt-auth', 'express-middleware']);
      expect(result.data.stale_files).toEqual(['src/old-auth.ts']);
      expect(result.data.decisions).toEqual(['Use JWT tokens for auth', 'Refresh tokens in HTTP-only cookies']);
      expect(result.data.blockers).toEqual(['Redis not yet configured']);
      expect(result.data.current_phase).toEqual({ phase: 3, name: 'Auth System' });
      expect(result.data.generated_at).toBe('2026-02-08T12:05:00Z');
      expect(result.data.staleness_warning).toBe('Snapshot is 3 days old');
    }
  });

  it('validates minimal WarmStartContext (required fields only, defaults filled)', () => {
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
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.session_id).toBe('sess-minimal');
      expect(result.data.generated_at).toBe('2026-02-08T12:05:00Z');
      expect(result.data.active_skills).toEqual([]);
      expect(result.data.files_modified).toEqual([]);
      expect(result.data.open_questions).toEqual([]);
      expect(result.data.top_tools).toEqual([]);
      expect(result.data.top_commands).toEqual([]);
      expect(result.data.suggested_skills).toEqual([]);
      expect(result.data.stale_files).toEqual([]);
      expect(result.data.decisions).toEqual([]);
      expect(result.data.blockers).toEqual([]);
      expect(result.data.current_phase).toBeNull();
      expect(result.data.staleness_warning).toBeNull();
    }
  });

  it('requires generated_at as string', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('defaults suggested_skills to empty array', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.suggested_skills).toEqual([]);
    }
  });

  it('defaults stale_files to empty array', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stale_files).toEqual([]);
    }
  });

  it('defaults decisions to empty array', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.decisions).toEqual([]);
    }
  });

  it('defaults blockers to empty array', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.blockers).toEqual([]);
    }
  });

  it('defaults current_phase to null', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.current_phase).toBeNull();
    }
  });

  it('defaults staleness_warning to null', () => {
    const input = {
      session_id: 'sess-test',
      timestamp: 1706000000000,
      saved_at: '2026-02-08T12:00:00Z',
      summary: 'Test',
      metrics: { duration_minutes: 1, tool_calls: 1, files_read: 0, files_written: 0 },
      generated_at: '2026-02-08T12:05:00Z',
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staleness_warning).toBeNull();
    }
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      ...VALID_WARM_START_CONTEXT,
      custom_field: 'preserved',
      extra_data: { nested: true },
    };
    const result = WarmStartContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('preserved');
      expect((result.data as Record<string, unknown>).extra_data).toEqual({ nested: true });
    }
  });
});

// ============================================================================
// HandoffSkillMetaSchema
// ============================================================================

describe('HandoffSkillMetaSchema', () => {
  it('validates full HandoffSkillMeta with name, description, disable-model-invocation', () => {
    const input = {
      name: 'warm-start',
      description: 'Session warm start context',
      'disable-model-invocation': true,
    };
    const result = HandoffSkillMetaSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('warm-start');
      expect(result.data.description).toBe('Session warm start context');
      expect(result.data['disable-model-invocation']).toBe(true);
    }
  });

  it('requires name as string', () => {
    const input = {
      description: 'Session warm start context',
    };
    const result = HandoffSkillMetaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('requires description as string', () => {
    const input = {
      name: 'warm-start',
    };
    const result = HandoffSkillMetaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('defaults disable-model-invocation to true', () => {
    const input = {
      name: 'warm-start',
      description: 'Session warm start context',
    };
    const result = HandoffSkillMetaSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data['disable-model-invocation']).toBe(true);
    }
  });

  it('preserves extra fields via .passthrough()', () => {
    const input = {
      name: 'warm-start',
      description: 'Session warm start context',
      'disable-model-invocation': false,
      custom_meta: 'extra',
    };
    const result = HandoffSkillMetaSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_meta).toBe('extra');
    }
  });
});

// ============================================================================
// filterSensitivePaths
// ============================================================================

describe('filterSensitivePaths', () => {
  it('filters out .env files (exact and prefixed)', () => {
    const paths = ['.env', '.env.local', '.env.production', 'src/app.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/app.ts']);
  });

  it('filters out credentials files', () => {
    const paths = ['credentials.json', 'credentials.yaml', 'src/auth.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/auth.ts']);
  });

  it('filters out .pem files', () => {
    const paths = ['server.pem', 'src/config.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/config.ts']);
  });

  it('filters out .key files', () => {
    const paths = ['private.key', 'src/config.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/config.ts']);
  });

  it('filters out .p12 files', () => {
    const paths = ['cert.p12', 'src/config.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/config.ts']);
  });

  it('filters out paths containing secrets/ or secret/', () => {
    const paths = ['secrets/api-key.txt', 'secret/config.yaml', 'src/app.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/app.ts']);
  });

  it('filters out paths containing password or token (case-insensitive)', () => {
    const paths = ['config/password.txt', 'auth/Token.json', 'src/app.ts'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/app.ts']);
  });

  it('keeps normal source files', () => {
    const paths = ['src/auth.ts', 'package.json', 'README.md'];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/auth.ts', 'package.json', 'README.md']);
  });

  it('returns empty array for empty input', () => {
    const result = filterSensitivePaths([]);
    expect(result).toEqual([]);
  });

  it('handles mixed input (some sensitive, some safe)', () => {
    const paths = [
      'src/auth.ts',
      '.env',
      'package.json',
      'credentials.json',
      'README.md',
      'server.pem',
    ];
    const result = filterSensitivePaths(paths);
    expect(result).toEqual(['src/auth.ts', 'package.json', 'README.md']);
  });
});

// ============================================================================
// SENSITIVE_PATH_PATTERNS
// ============================================================================

describe('SENSITIVE_PATH_PATTERNS', () => {
  it('is an array of RegExp objects', () => {
    expect(Array.isArray(SENSITIVE_PATH_PATTERNS)).toBe(true);
    expect(SENSITIVE_PATH_PATTERNS.length).toBeGreaterThan(0);
    for (const pattern of SENSITIVE_PATH_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });
});
