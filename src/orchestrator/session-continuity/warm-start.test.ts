/**
 * Tests for WarmStartGenerator.
 *
 * Covers:
 * - generate() returns null when no snapshot exists
 * - generate() returns valid WarmStartContext with all fields merged
 * - generate() filters out non-existent files (stale detection)
 * - generate() filters out non-existent skills (both scopes)
 * - generate() filters sensitive paths from files_modified
 * - generate() adds staleness warning for old snapshots
 * - generate() no staleness warning for recent snapshots
 * - generate() handles null state (STATE.md missing) gracefully
 * - generate() produces output passing WarmStartContextSchema validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarmStartGenerator } from './warm-start.js';
import { WarmStartContextSchema } from './types.js';
import type { SessionSnapshot } from './types.js';
import type { SnapshotManager } from './snapshot-manager.js';
import type { SkillPreloadSuggester } from './skill-preload-suggester.js';
import type { ProjectStateReader } from '../state/state-reader.js';

// Mock node:fs/promises at module level
vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
}));

import { access } from 'node:fs/promises';

// ============================================================================
// Fixtures
// ============================================================================

function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    session_id: 'sess-test-123',
    timestamp: Date.now(),
    saved_at: new Date().toISOString(),
    summary: 'Implemented feature X with tests',
    active_skills: ['typescript'],
    files_modified: ['src/a.ts', 'src/b.ts'],
    open_questions: ['How to handle edge case?'],
    metrics: {
      duration_minutes: 15,
      tool_calls: 42,
      files_read: 10,
      files_written: 5,
    },
    top_tools: ['Write', 'Read', 'Bash'],
    top_commands: ['npm', 'git', 'vitest'],
    ...overrides,
  };
}

function makeSnapshotManager(snapshot: SessionSnapshot | null): SnapshotManager {
  return {
    getLatest: vi.fn().mockResolvedValue(snapshot),
  } as unknown as SnapshotManager;
}

function makePreloadSuggester(suggestions: string[]): SkillPreloadSuggester {
  return {
    suggest: vi.fn().mockReturnValue(suggestions),
  } as unknown as SkillPreloadSuggester;
}

function makeStateReader(opts: {
  hasState: boolean;
  decisions?: string[];
  blockers?: string[];
  position?: Record<string, unknown> | null;
}): ProjectStateReader {
  if (!opts.hasState) {
    return {
      read: vi.fn().mockResolvedValue({
        initialized: true,
        hasState: false,
        state: null,
        position: null,
        config: { mode: 'interactive', depth: 'standard' },
        phases: [],
        plansByPhase: {},
        project: null,
        hasRoadmap: false,
        hasProject: false,
        hasConfig: false,
      }),
    } as unknown as ProjectStateReader;
  }

  return {
    read: vi.fn().mockResolvedValue({
      initialized: true,
      hasState: true,
      state: {
        position: opts.position ?? { phase: 68, phaseName: 'Session Continuity' },
        decisions: opts.decisions ?? ['use Zod'],
        blockers: opts.blockers ?? [],
        pendingTodos: [],
        sessionContinuity: { lastSession: null, stoppedAt: null, resumeFile: null },
      },
      position: opts.position ?? { phase: 68, phaseName: 'Session Continuity' },
      config: { mode: 'yolo', depth: 'comprehensive' },
      phases: [],
      plansByPhase: {},
      project: null,
      hasRoadmap: false,
      hasProject: false,
      hasConfig: true,
    }),
  } as unknown as ProjectStateReader;
}

// ============================================================================
// Tests
// ============================================================================

describe('WarmStartGenerator', () => {
  const mockAccess = vi.mocked(access);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all files exist
    mockAccess.mockResolvedValue(undefined);
  });

  it('generate() returns null when no snapshot exists', async () => {
    const gen = new WarmStartGenerator(
      makeSnapshotManager(null),
      makePreloadSuggester([]),
      makeStateReader({ hasState: true }),
      '/tmp/.planning',
    );

    const result = await gen.generate();
    expect(result).toBeNull();
  });

  it('generate() returns valid WarmStartContext with all fields merged', async () => {
    const snapshot = makeSnapshot({
      files_modified: ['src/a.ts', 'src/b.ts'],
      active_skills: ['typescript'],
    });

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester(['typescript', 'testing']),
      makeStateReader({
        hasState: true,
        decisions: ['use Zod'],
        blockers: ['none'],
        position: { phase: 68, phaseName: 'Session Continuity' },
      }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.session_id).toBe('sess-test-123');
    expect(result!.files_modified).toEqual(['src/a.ts', 'src/b.ts']);
    expect(result!.suggested_skills).toContain('typescript');
    expect(result!.suggested_skills).toContain('testing');
    expect(result!.decisions).toEqual(['use Zod']);
    expect(result!.blockers).toEqual(['none']);
    expect(result!.current_phase).toEqual({ phase: 68, phaseName: 'Session Continuity' });
    expect(result!.generated_at).toBeDefined();
    expect(result!.summary).toBe('Implemented feature X with tests');
    expect(result!.metrics.tool_calls).toBe(42);
    expect(result!.top_tools).toEqual(['Write', 'Read', 'Bash']);
    expect(result!.top_commands).toEqual(['npm', 'git', 'vitest']);
  });

  it('generate() filters out non-existent files', async () => {
    const snapshot = makeSnapshot({
      files_modified: ['src/exists.ts', 'src/deleted.ts'],
    });

    // src/exists.ts: resolves (exists), src/deleted.ts: throws ENOENT
    mockAccess.mockImplementation(async (path) => {
      if (String(path).includes('deleted.ts')) {
        const err = new Error('ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        throw err;
      }
    });

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester(['typescript']),
      makeStateReader({ hasState: true }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.files_modified).toEqual(['src/exists.ts']);
    expect(result!.stale_files).toEqual(['src/deleted.ts']);
  });

  it('generate() filters out non-existent skills', async () => {
    const snapshot = makeSnapshot();

    // Mock skill existence: exists-skill found at project scope, gone-skill not found anywhere
    mockAccess.mockImplementation(async (path) => {
      const pathStr = String(path);
      if (pathStr.includes('gone-skill')) {
        const err = new Error('ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        throw err;
      }
    });

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester(['exists-skill', 'gone-skill']),
      makeStateReader({ hasState: true }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.suggested_skills).toContain('exists-skill');
    expect(result!.suggested_skills).not.toContain('gone-skill');
  });

  it('generate() filters sensitive paths from files_modified', async () => {
    const snapshot = makeSnapshot({
      files_modified: ['src/auth.ts', '.env', '.env.local', 'secrets/key.pem'],
    });

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester([]),
      makeStateReader({ hasState: true }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.files_modified).toEqual(['src/auth.ts']);
    // Sensitive paths should NOT appear in stale_files (they're filtered, not stale)
    expect(result!.stale_files).not.toContain('.env');
    expect(result!.stale_files).not.toContain('.env.local');
    expect(result!.stale_files).not.toContain('secrets/key.pem');
  });

  it('generate() adds staleness warning when snapshot is >24h old', async () => {
    const oldTimestamp = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago
    const snapshot = makeSnapshot({ timestamp: oldTimestamp });

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester([]),
      makeStateReader({ hasState: true }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.staleness_warning).not.toBeNull();
    expect(typeof result!.staleness_warning).toBe('string');
    expect(result!.staleness_warning!.length).toBeGreaterThan(0);
  });

  it('generate() no staleness warning when snapshot is recent (<24h)', async () => {
    const recentTimestamp = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago
    const snapshot = makeSnapshot({ timestamp: recentTimestamp });

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester([]),
      makeStateReader({ hasState: true }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.staleness_warning).toBeNull();
  });

  it('generate() handles null state (STATE.md missing) gracefully', async () => {
    const snapshot = makeSnapshot();

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester(['typescript']),
      makeStateReader({ hasState: false }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    expect(result!.decisions).toEqual([]);
    expect(result!.blockers).toEqual([]);
    expect(result!.current_phase).toBeNull();
  });

  it('generate() produces output that passes WarmStartContextSchema validation', async () => {
    const snapshot = makeSnapshot();

    const gen = new WarmStartGenerator(
      makeSnapshotManager(snapshot),
      makePreloadSuggester(['typescript', 'testing']),
      makeStateReader({
        hasState: true,
        decisions: ['use Zod'],
        blockers: [],
        position: { phase: 68, phaseName: 'Session Continuity' },
      }),
      '/tmp/.planning',
    );

    const result = await gen.generate();

    expect(result).not.toBeNull();
    const parsed = WarmStartContextSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
