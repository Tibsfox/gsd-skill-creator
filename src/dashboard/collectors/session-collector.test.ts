import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SessionObservation } from '../../types/observation.js';

// ---------------------------------------------------------------------------
// Mock fs/promises before importing the module under test
// ---------------------------------------------------------------------------

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

// Import after mocks are set up
import { collectSessionMetrics } from './session-collector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock SessionObservation JSONL entry. */
function buildSessionLine(overrides: Partial<SessionObservation> = {}): string {
  const defaults: SessionObservation = {
    sessionId: 'sess-001',
    startTime: 1707580800000,   // 2024-02-11T00:00:00Z
    endTime: 1707584400000,     // 2024-02-11T01:00:00Z
    durationMinutes: 60,
    source: 'startup',
    reason: 'clear',
    metrics: {
      userMessages: 10,
      assistantMessages: 12,
      toolCalls: 25,
      uniqueFilesRead: 8,
      uniqueFilesWritten: 3,
      uniqueCommandsRun: 5,
    },
    topCommands: ['git status', 'npm test'],
    topFiles: ['src/index.ts', 'src/types.ts'],
    topTools: ['Read', 'Write'],
    activeSkills: ['git-commit', 'beautiful-commits'],
  };
  return JSON.stringify({ ...defaults, ...overrides });
}

/** Build a mock SessionStartData cache object. */
function buildCacheData(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    sessionId: 'active-001',
    transcriptPath: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    source: 'startup',
    model: 'claude-opus-4-6',
    startTime: 1707590000000,
    ...overrides,
  });
}

/** Create an ENOENT error like Node does. */
function makeEnoent(path: string): NodeJS.ErrnoException {
  const err = new Error(`ENOENT: no such file or directory, open '${path}'`) as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectSessionMetrics', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Reads sessions.jsonl and returns session metrics
  // -------------------------------------------------------------------------
  it('reads sessions.jsonl and returns session metrics', async () => {
    const lines = [
      buildSessionLine({ sessionId: 'sess-001', durationMinutes: 30 }),
      buildSessionLine({
        sessionId: 'sess-002',
        durationMinutes: 45,
        metrics: {
          userMessages: 5,
          assistantMessages: 7,
          toolCalls: 12,
          uniqueFilesRead: 4,
          uniqueFilesWritten: 2,
          uniqueCommandsRun: 3,
        },
        topFiles: ['a.ts'],
        topCommands: ['git log'],
        activeSkills: ['skill-a'],
      }),
      buildSessionLine({
        sessionId: 'sess-003',
        durationMinutes: 15,
      }),
    ].join('\n');

    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes('sessions.jsonl')) return lines;
      if (path.includes('.session-cache.json')) throw makeEnoent(path);
      throw makeEnoent(path);
    });

    const result = await collectSessionMetrics({
      sessionsPath: '/mock/sessions.jsonl',
      cachePath: '/mock/.session-cache.json',
    });

    expect(result.sessions).toHaveLength(3);
    expect(result.totalSessions).toBe(3);

    const first = result.sessions[0];
    expect(first.sessionId).toBe('sess-001');
    expect(first.durationMinutes).toBe(30);
    expect(first.userMessages).toBe(10);
    expect(first.assistantMessages).toBe(12);
    expect(first.toolCalls).toBe(25);
    expect(first.filesRead).toBe(8);
    expect(first.filesWritten).toBe(3);
    expect(first.topFiles).toEqual(['src/index.ts', 'src/types.ts']);
    expect(first.topCommands).toEqual(['git status', 'npm test']);
    expect(first.activeSkills).toEqual(['git-commit', 'beautiful-commits']);

    const second = result.sessions[1];
    expect(second.sessionId).toBe('sess-002');
    expect(second.userMessages).toBe(5);
    expect(second.toolCalls).toBe(12);
    expect(second.filesRead).toBe(4);
    expect(second.activeSkills).toEqual(['skill-a']);
  });

  // -------------------------------------------------------------------------
  // 2. Reads .session-cache.json for active session
  // -------------------------------------------------------------------------
  it('reads .session-cache.json for active session', async () => {
    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes('sessions.jsonl')) return buildSessionLine();
      if (path.includes('.session-cache.json')) {
        return buildCacheData({
          sessionId: 'active-live',
          model: 'claude-sonnet-4',
          startTime: 1707595000000,
        });
      }
      throw makeEnoent(path);
    });

    const result = await collectSessionMetrics({
      sessionsPath: '/mock/sessions.jsonl',
      cachePath: '/mock/.session-cache.json',
    });

    expect(result.activeSession).not.toBeNull();
    expect(result.activeSession!.sessionId).toBe('active-live');
    expect(result.activeSession!.model).toBe('claude-sonnet-4');
    expect(result.activeSession!.startTime).toBe(1707595000000);
  });

  // -------------------------------------------------------------------------
  // 3. Handles missing sessions.jsonl gracefully
  // -------------------------------------------------------------------------
  it('handles missing sessions.jsonl gracefully', async () => {
    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes('sessions.jsonl')) throw makeEnoent(path);
      if (path.includes('.session-cache.json')) return buildCacheData();
      throw makeEnoent(path);
    });

    const result = await collectSessionMetrics({
      sessionsPath: '/mock/sessions.jsonl',
      cachePath: '/mock/.session-cache.json',
    });

    expect(result.sessions).toEqual([]);
    expect(result.totalSessions).toBe(0);
    // Active session still works independently
    expect(result.activeSession).not.toBeNull();
    expect(result.activeSession!.sessionId).toBe('active-001');
  });

  // -------------------------------------------------------------------------
  // 4. Handles missing .session-cache.json gracefully
  // -------------------------------------------------------------------------
  it('handles missing .session-cache.json gracefully', async () => {
    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes('sessions.jsonl')) return buildSessionLine();
      if (path.includes('.session-cache.json')) throw makeEnoent(path);
      throw makeEnoent(path);
    });

    const result = await collectSessionMetrics({
      sessionsPath: '/mock/sessions.jsonl',
      cachePath: '/mock/.session-cache.json',
    });

    expect(result.activeSession).toBeNull();
    expect(result.sessions).toHaveLength(1);
    expect(result.totalSessions).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 5. Handles malformed JSONL lines
  // -------------------------------------------------------------------------
  it('handles malformed JSONL lines', async () => {
    const lines = [
      buildSessionLine({ sessionId: 'good-001' }),
      'THIS IS NOT VALID JSON {{{',
      '',
      buildSessionLine({ sessionId: 'good-002' }),
      '{"incomplete": true',
    ].join('\n');

    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes('sessions.jsonl')) return lines;
      if (path.includes('.session-cache.json')) throw makeEnoent(path);
      throw makeEnoent(path);
    });

    const result = await collectSessionMetrics({
      sessionsPath: '/mock/sessions.jsonl',
      cachePath: '/mock/.session-cache.json',
    });

    // Only valid entries with sessionId/startTime/endTime are kept
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0].sessionId).toBe('good-001');
    expect(result.sessions[1].sessionId).toBe('good-002');
  });

  // -------------------------------------------------------------------------
  // 6. Returns totalSessions count matching sessions.length
  // -------------------------------------------------------------------------
  it('returns totalSessions count', async () => {
    const lines = [
      buildSessionLine({ sessionId: 's1' }),
      buildSessionLine({ sessionId: 's2' }),
    ].join('\n');

    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes('sessions.jsonl')) return lines;
      throw makeEnoent(path);
    });

    const result = await collectSessionMetrics({
      sessionsPath: '/mock/sessions.jsonl',
      cachePath: '/mock/.session-cache.json',
    });

    expect(result.totalSessions).toBe(result.sessions.length);
    expect(result.totalSessions).toBe(2);
  });
});
