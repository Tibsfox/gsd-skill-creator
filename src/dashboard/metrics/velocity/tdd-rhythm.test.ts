import { describe, it, expect } from 'vitest';
import { extractTddCycles, renderTddRhythm } from './tdd-rhythm.js';
import type { PhaseStats } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures — GitCommitMetric-shaped objects
// ---------------------------------------------------------------------------

function commit(overrides: {
  hash: string;
  type: string;
  phase: number | null;
  timestamp: string;
}) {
  return {
    hash: overrides.hash,
    type: overrides.type,
    scope: overrides.phase !== null ? `${overrides.phase}-01` : null,
    phase: overrides.phase,
    subject: `${overrides.type} commit`,
    timestamp: overrides.timestamp,
    author: 'tester',
    filesChanged: 1,
    insertions: 10,
    deletions: 2,
    files: ['src/foo.ts'],
  };
}

const phaseStats94: PhaseStats = {
  phase: 94,
  wallTimeMs: 600_000,
  commitCount: 5,
  insertions: 200,
  deletions: 50,
  filesChanged: 8,
  plansExecuted: 2,
  commitTypes: { feat: 3, test: 2 },
  firstCommit: '2026-02-10T10:00:00Z',
  lastCommit: '2026-02-10T10:10:00Z',
};

const phaseStats95: PhaseStats = {
  phase: 95,
  wallTimeMs: 1_200_000,
  commitCount: 10,
  insertions: 400,
  deletions: 100,
  filesChanged: 15,
  plansExecuted: 3,
  commitTypes: { feat: 5, test: 3, fix: 2 },
  firstCommit: '2026-02-11T14:00:00Z',
  lastCommit: '2026-02-11T14:20:00Z',
};

// ---------------------------------------------------------------------------
// extractTddCycles
// ---------------------------------------------------------------------------

describe('extractTddCycles', () => {
  // 1. Extracts RED-GREEN cycle from test->feat pair
  it('extracts RED-GREEN cycle from test->feat pair', () => {
    const commits = [
      commit({ hash: 'aaa1111', type: 'test', phase: 94, timestamp: '2026-01-01T10:00:00Z' }),
      commit({ hash: 'bbb2222', type: 'feat', phase: 94, timestamp: '2026-01-01T10:03:00Z' }),
    ];

    const cycles = extractTddCycles(commits);

    expect(cycles).toHaveLength(1);
    expect(cycles[0].cycleTimeMs).toBe(180_000); // 3 minutes
    expect(cycles[0].testCommitHash).toBe('aaa1111');
    expect(cycles[0].implCommitHash).toBe('bbb2222');
    expect(cycles[0].phase).toBe(94);
  });

  // 2. Extracts multiple cycles from interleaved commits
  it('extracts multiple cycles from interleaved commits', () => {
    const commits = [
      commit({ hash: 'aaa1111', type: 'test', phase: 94, timestamp: '2026-01-01T10:00:00Z' }),
      commit({ hash: 'bbb2222', type: 'feat', phase: 94, timestamp: '2026-01-01T10:03:00Z' }),
      commit({ hash: 'ccc3333', type: 'test', phase: 94, timestamp: '2026-01-01T10:05:00Z' }),
      commit({ hash: 'ddd4444', type: 'feat', phase: 94, timestamp: '2026-01-01T10:08:00Z' }),
    ];

    const cycles = extractTddCycles(commits);

    expect(cycles).toHaveLength(2);
    expect(cycles[0].testCommitHash).toBe('aaa1111');
    expect(cycles[0].implCommitHash).toBe('bbb2222');
    expect(cycles[1].testCommitHash).toBe('ccc3333');
    expect(cycles[1].implCommitHash).toBe('ddd4444');
  });

  // 3. Skips non-TDD commits between pairs
  it('skips non-TDD commits between pairs', () => {
    const commits = [
      commit({ hash: 'aaa1111', type: 'test', phase: 94, timestamp: '2026-01-01T10:00:00Z' }),
      commit({ hash: 'bbb2222', type: 'docs', phase: 94, timestamp: '2026-01-01T10:01:00Z' }),
      commit({ hash: 'ccc3333', type: 'fix', phase: 94, timestamp: '2026-01-01T10:02:00Z' }),
      commit({ hash: 'ddd4444', type: 'feat', phase: 94, timestamp: '2026-01-01T10:05:00Z' }),
    ];

    const cycles = extractTddCycles(commits);

    expect(cycles).toHaveLength(1);
    expect(cycles[0].testCommitHash).toBe('aaa1111');
    expect(cycles[0].implCommitHash).toBe('ddd4444');
    expect(cycles[0].cycleTimeMs).toBe(300_000); // 5 minutes
  });

  // 4. Returns empty array when no test commits
  it('returns empty array when no test commits', () => {
    const commits = [
      commit({ hash: 'aaa1111', type: 'feat', phase: 94, timestamp: '2026-01-01T10:00:00Z' }),
      commit({ hash: 'bbb2222', type: 'fix', phase: 94, timestamp: '2026-01-01T10:01:00Z' }),
      commit({ hash: 'ccc3333', type: 'docs', phase: 94, timestamp: '2026-01-01T10:02:00Z' }),
    ];

    const cycles = extractTddCycles(commits);
    expect(cycles).toHaveLength(0);
  });

  // 5. Returns empty array when test has no following feat
  it('returns empty array when test has no following feat', () => {
    const commits = [
      commit({ hash: 'aaa1111', type: 'feat', phase: 94, timestamp: '2026-01-01T10:00:00Z' }),
      commit({ hash: 'bbb2222', type: 'test', phase: 94, timestamp: '2026-01-01T10:03:00Z' }),
    ];

    const cycles = extractTddCycles(commits);
    expect(cycles).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// renderTddRhythm
// ---------------------------------------------------------------------------

describe('renderTddRhythm', () => {
  // 6. Renders cycle time per phase
  it('renders cycle time per phase', () => {
    const cycles = [
      {
        phase: 94,
        testCommitHash: 'aaa1111',
        implCommitHash: 'bbb2222',
        testTimestamp: '2026-01-01T10:00:00Z',
        implTimestamp: '2026-01-01T10:03:00Z',
        cycleTimeMs: 180_000, // 3m
      },
      {
        phase: 95,
        testCommitHash: 'ccc3333',
        implCommitHash: 'ddd4444',
        testTimestamp: '2026-01-02T10:00:00Z',
        implTimestamp: '2026-01-02T10:05:00Z',
        cycleTimeMs: 300_000, // 5m
      },
    ];

    const html = renderTddRhythm(cycles, [phaseStats94, phaseStats95]);

    expect(html).toContain('Phase 94');
    expect(html).toContain('3m');
    expect(html).toContain('Phase 95');
    expect(html).toContain('5m');
  });

  // 7. Shows overall average cycle time
  it('shows overall average cycle time', () => {
    const cycles = [
      {
        phase: 94,
        testCommitHash: 'aaa1111',
        implCommitHash: 'bbb2222',
        testTimestamp: '2026-01-01T10:00:00Z',
        implTimestamp: '2026-01-01T10:03:00Z',
        cycleTimeMs: 180_000,
      },
      {
        phase: 95,
        testCommitHash: 'ccc3333',
        implCommitHash: 'ddd4444',
        testTimestamp: '2026-01-02T10:00:00Z',
        implTimestamp: '2026-01-02T10:05:00Z',
        cycleTimeMs: 300_000,
      },
    ];

    const html = renderTddRhythm(cycles, [phaseStats94, phaseStats95]);

    // Overall average: (180000 + 300000) / 2 = 240000ms = 4m
    expect(html).toContain('Overall');
    expect(html).toContain('4m');
  });

  // 8. Handles empty cycles gracefully
  it('handles empty cycles gracefully', () => {
    const html = renderTddRhythm([], [phaseStats94]);

    expect(html).toContain('No TDD cycles detected');
  });

  // 9. Formats cycle times using formatDuration
  it('formats cycle times using formatDuration', () => {
    const cycles = [
      {
        phase: 94,
        testCommitHash: 'aaa1111',
        implCommitHash: 'bbb2222',
        testTimestamp: '2026-01-01T10:00:00Z',
        implTimestamp: '2026-01-01T12:00:00Z',
        cycleTimeMs: 7_200_000, // 2 hours
      },
    ];

    const html = renderTddRhythm(cycles, [phaseStats94]);

    // 7200000ms = 2h 0m
    expect(html).toContain('2h 0m');
  });
});
