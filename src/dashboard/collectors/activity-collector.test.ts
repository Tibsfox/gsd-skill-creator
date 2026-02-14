import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GitCommitMetric, SessionMetric } from './types.js';
import type { FeedEntry } from '../activity-feed.js';

// ---------------------------------------------------------------------------
// Mock collectors before importing the module under test
// ---------------------------------------------------------------------------

const { mockCollectGitMetrics, mockCollectSessionMetrics } = vi.hoisted(() => ({
  mockCollectGitMetrics: vi.fn(),
  mockCollectSessionMetrics: vi.fn(),
}));

vi.mock('./git-collector.js', () => ({
  collectGitMetrics: mockCollectGitMetrics,
}));

vi.mock('./session-collector.js', () => ({
  collectSessionMetrics: mockCollectSessionMetrics,
}));

// Import after mocks are set up
import { collectActivityFeed } from './activity-collector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCommit(overrides: Partial<GitCommitMetric> = {}): GitCommitMetric {
  return {
    hash: 'abc1234',
    type: 'feat',
    scope: '154-01',
    phase: 154,
    subject: 'implement activity collector',
    timestamp: '2026-02-14T10:00:00+00:00',
    author: 'Alice',
    filesChanged: 1,
    insertions: 50,
    deletions: 3,
    files: ['src/dashboard/collectors/activity-collector.ts'],
    ...overrides,
  };
}

function makeSession(overrides: Partial<SessionMetric> = {}): SessionMetric {
  return {
    sessionId: 'session-001',
    startTime: 1700000000000,
    endTime: 1700003600000,
    durationMinutes: 60,
    model: 'opus',
    source: 'startup',
    userMessages: 10,
    assistantMessages: 8,
    toolCalls: 15,
    filesRead: 5,
    filesWritten: 3,
    commandsRun: 2,
    topFiles: ['src/index.ts'],
    topCommands: ['npm test'],
    activeSkills: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectActivityFeed', () => {
  beforeEach(() => {
    mockCollectGitMetrics.mockReset();
    mockCollectSessionMetrics.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Git commit with plan-style scope (digits-dash-digits) -> entityType: 'plan'
  // -------------------------------------------------------------------------
  it('maps git commit with plan scope to plan entity type', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [makeCommit({ scope: '154-01', subject: 'implement collector' })],
      totalCommits: 1,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe('plan');
    expect(entries[0].identifier).toBe('154-01');
    expect(entries[0].description).toBe('implement collector');
    expect(entries[0].domain).toBe('infrastructure');
  });

  // -------------------------------------------------------------------------
  // 2. Git commit with phase-only scope (pure digits) -> entityType: 'phase'
  // -------------------------------------------------------------------------
  it('maps git commit with phase-only scope to phase entity type', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [makeCommit({ scope: '154', subject: 'complete phase' })],
      totalCommits: 1,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe('phase');
    expect(entries[0].identifier).toBe('154');
  });

  // -------------------------------------------------------------------------
  // 3. Git commit with non-numeric scope -> entityType: 'skill'
  // -------------------------------------------------------------------------
  it('maps git commit with non-numeric scope to skill entity type', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [makeCommit({ scope: 'auth', subject: 'fix login bug' })],
      totalCommits: 1,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe('skill');
    expect(entries[0].identifier).toBe('auth');
  });

  // -------------------------------------------------------------------------
  // 4. Git commit with no scope -> entityType: 'plan', identifier: hash
  // -------------------------------------------------------------------------
  it('maps git commit with no scope to plan entity with hash identifier', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [makeCommit({ scope: null, hash: 'def5678', subject: 'update deps' })],
      totalCommits: 1,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe('plan');
    expect(entries[0].identifier).toBe('def5678');
    expect(entries[0].domain).toBe('infrastructure');
  });

  // -------------------------------------------------------------------------
  // 5. Session with activeSkills -> one FeedEntry per skill
  // -------------------------------------------------------------------------
  it('maps session with activeSkills to one entry per skill', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [],
      totalCommits: 0,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [
        makeSession({
          sessionId: 'session-abc',
          activeSkills: ['beautiful-commits', 'gsd-orchestrator'],
          endTime: 1700003600000,
        }),
      ],
      totalSessions: 1,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(2);
    expect(entries[0].entityType).toBe('skill');
    expect(entries[0].domain).toBe('observation');
    expect(entries[0].identifier).toBe('beautiful-commits');
    expect(entries[0].description).toBe('Active in session session-abc');
    expect(entries[1].identifier).toBe('gsd-orchestrator');
  });

  // -------------------------------------------------------------------------
  // 6. Session without activeSkills -> single 'agent' entry
  // -------------------------------------------------------------------------
  it('maps session without activeSkills to agent entry', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [],
      totalCommits: 0,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [
        makeSession({
          sessionId: 'session-xyz',
          activeSkills: [],
          durationMinutes: 45,
          endTime: 1700003600000,
        }),
      ],
      totalSessions: 1,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe('agent');
    expect(entries[0].domain).toBe('observation');
    expect(entries[0].identifier).toBe('session-xyz');
    expect(entries[0].description).toBe('Session ended (45m)');
  });

  // -------------------------------------------------------------------------
  // 7. Merge both sources and sort newest-first
  // -------------------------------------------------------------------------
  it('merges git and session entries sorted newest-first', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [
        makeCommit({
          hash: 'aaa1111',
          scope: '154-01',
          subject: 'older commit',
          timestamp: '2026-02-14T08:00:00+00:00',
        }),
        makeCommit({
          hash: 'ccc3333',
          scope: '154-02',
          subject: 'newest commit',
          timestamp: '2026-02-14T12:00:00+00:00',
        }),
      ],
      totalCommits: 2,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [
        makeSession({
          sessionId: 'session-mid',
          activeSkills: [],
          durationMinutes: 30,
          endTime: new Date('2026-02-14T10:00:00+00:00').getTime(),
        }),
      ],
      totalSessions: 1,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(3);
    // Newest first: commit at 12:00, session at 10:00, commit at 08:00
    expect(entries[0].description).toBe('newest commit');
    expect(entries[1].identifier).toBe('session-mid');
    expect(entries[2].description).toBe('older commit');
  });

  // -------------------------------------------------------------------------
  // 8. Limits entries to configurable max (default 50)
  // -------------------------------------------------------------------------
  it('limits entries to maxEntries (default 50)', async () => {
    const commits = Array.from({ length: 60 }, (_, i) =>
      makeCommit({
        hash: `hash${String(i).padStart(4, '0')}`,
        scope: '154-01',
        subject: `commit ${i}`,
        timestamp: `2026-02-14T${String(i % 24).padStart(2, '0')}:00:00+00:00`,
      }),
    );

    mockCollectGitMetrics.mockResolvedValue({
      commits,
      totalCommits: 60,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();
    expect(entries).toHaveLength(50);
  });

  it('respects custom maxEntries option', async () => {
    const commits = Array.from({ length: 20 }, (_, i) =>
      makeCommit({
        hash: `hash${String(i).padStart(4, '0')}`,
        scope: '154-01',
        subject: `commit ${i}`,
        timestamp: `2026-02-14T${String(i % 24).padStart(2, '0')}:00:00+00:00`,
      }),
    );

    mockCollectGitMetrics.mockResolvedValue({
      commits,
      totalCommits: 20,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed({ maxEntries: 5 });
    expect(entries).toHaveLength(5);
  });

  // -------------------------------------------------------------------------
  // 9. Empty inputs produce empty output
  // -------------------------------------------------------------------------
  it('returns empty array when both sources are empty', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [],
      totalCommits: 0,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();
    expect(entries).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 10. Fault tolerance: git collector failure does not block sessions
  // -------------------------------------------------------------------------
  it('returns session entries when git collector fails', async () => {
    mockCollectGitMetrics.mockRejectedValue(new Error('git not found'));
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [
        makeSession({
          sessionId: 'session-ok',
          activeSkills: ['my-skill'],
          endTime: 1700003600000,
        }),
      ],
      totalSessions: 1,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe('skill');
    expect(entries[0].identifier).toBe('my-skill');
  });

  // -------------------------------------------------------------------------
  // 11. Fault tolerance: session collector failure does not block git
  // -------------------------------------------------------------------------
  it('returns git entries when session collector fails', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [makeCommit({ scope: '154-01', subject: 'git works' })],
      totalCommits: 1,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockRejectedValue(new Error('ENOENT'));

    const entries = await collectActivityFeed();

    expect(entries).toHaveLength(1);
    expect(entries[0].description).toBe('git works');
  });

  // -------------------------------------------------------------------------
  // 12. Fault tolerance: both collectors fail -> empty array
  // -------------------------------------------------------------------------
  it('returns empty array when both collectors fail', async () => {
    mockCollectGitMetrics.mockRejectedValue(new Error('git error'));
    mockCollectSessionMetrics.mockRejectedValue(new Error('session error'));

    const entries = await collectActivityFeed();
    expect(entries).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 13. Domain inference from non-numeric scope keywords
  // -------------------------------------------------------------------------
  it('infers domain from scope keywords', async () => {
    const commits = [
      makeCommit({ hash: 'a', scope: 'dashboard', subject: 'update UI', timestamp: '2026-02-14T01:00:00+00:00' }),
      makeCommit({ hash: 'b', scope: 'api', subject: 'add endpoint', timestamp: '2026-02-14T02:00:00+00:00' }),
      makeCommit({ hash: 'c', scope: 'test', subject: 'fix tests', timestamp: '2026-02-14T03:00:00+00:00' }),
      makeCommit({ hash: 'd', scope: 'ci', subject: 'update pipeline', timestamp: '2026-02-14T04:00:00+00:00' }),
    ];

    mockCollectGitMetrics.mockResolvedValue({
      commits,
      totalCommits: 4,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    // Sorted newest-first: ci, test, api, dashboard
    const byIdentifier = (id: string) => entries.find((e) => e.identifier === id)!;
    expect(byIdentifier('dashboard').domain).toBe('frontend');
    expect(byIdentifier('api').domain).toBe('backend');
    expect(byIdentifier('test').domain).toBe('testing');
    expect(byIdentifier('ci').domain).toBe('infrastructure');
  });

  // -------------------------------------------------------------------------
  // 14. occurredAt is set correctly from git timestamp and session endTime
  // -------------------------------------------------------------------------
  it('sets occurredAt from git timestamp', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [makeCommit({ timestamp: '2026-02-14T15:30:00+00:00' })],
      totalCommits: 1,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries[0].occurredAt).toBe('2026-02-14T15:30:00+00:00');
  });

  it('sets occurredAt from session endTime as ISO string', async () => {
    const endTime = new Date('2026-02-14T12:00:00Z').getTime();
    mockCollectGitMetrics.mockResolvedValue({
      commits: [],
      totalCommits: 0,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [makeSession({ endTime, activeSkills: [] })],
      totalSessions: 1,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    expect(entries[0].occurredAt).toBe(new Date(endTime).toISOString());
  });

  // -------------------------------------------------------------------------
  // 15. Passes maxCommits option to git collector
  // -------------------------------------------------------------------------
  it('passes maxCommits option to git collector', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [],
      totalCommits: 0,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [],
      totalSessions: 0,
      activeSession: null,
    });

    await collectActivityFeed({ maxCommits: 15 });

    expect(mockCollectGitMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ maxCommits: 15 }),
    );
  });

  // -------------------------------------------------------------------------
  // 16. All returned entries conform to FeedEntry shape
  // -------------------------------------------------------------------------
  it('all entries have valid FeedEntry shape', async () => {
    mockCollectGitMetrics.mockResolvedValue({
      commits: [
        makeCommit({ scope: '154-01', subject: 'plan commit', timestamp: '2026-02-14T10:00:00+00:00' }),
        makeCommit({ scope: 'auth', subject: 'skill commit', timestamp: '2026-02-14T11:00:00+00:00' }),
      ],
      totalCommits: 2,
      timeRange: null,
    });
    mockCollectSessionMetrics.mockResolvedValue({
      sessions: [
        makeSession({ activeSkills: ['my-skill'], endTime: 1700003600000 }),
        makeSession({ sessionId: 'session-002', activeSkills: [], endTime: 1700007200000 }),
      ],
      totalSessions: 2,
      activeSession: null,
    });

    const entries = await collectActivityFeed();

    for (const entry of entries) {
      expect(entry).toHaveProperty('entityType');
      expect(entry).toHaveProperty('domain');
      expect(entry).toHaveProperty('identifier');
      expect(entry).toHaveProperty('description');
      expect(entry).toHaveProperty('occurredAt');
      expect(typeof entry.entityType).toBe('string');
      expect(typeof entry.domain).toBe('string');
      expect(typeof entry.identifier).toBe('string');
      expect(typeof entry.description).toBe('string');
      expect(typeof entry.occurredAt).toBe('string');
    }
  });
});
