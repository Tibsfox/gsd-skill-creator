/**
 * Tests for graceful degradation wrappers around dashboard collectors.
 *
 * Each safe* function catches errors from the underlying collector and
 * returns a typed empty result instead of throwing.
 *
 * @module dashboard/metrics/graceful.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GitCollectorResult, SessionCollectorResult, PlanningCollectorResult } from '../collectors/types.js';

// Mock the three collector modules
vi.mock('../collectors/git-collector.js', () => ({
  collectGitMetrics: vi.fn(),
}));

vi.mock('../collectors/session-collector.js', () => ({
  collectSessionMetrics: vi.fn(),
}));

vi.mock('../collectors/planning-collector.js', () => ({
  collectPlanningMetrics: vi.fn(),
}));

// Import mocked functions
import { collectGitMetrics } from '../collectors/git-collector.js';
import { collectSessionMetrics } from '../collectors/session-collector.js';
import { collectPlanningMetrics } from '../collectors/planning-collector.js';

// Import the module under test (does not exist yet — RED phase)
import { safeCollectGit, safeCollectSession, safeCollectPlanning } from './graceful.js';

const mockCollectGit = vi.mocked(collectGitMetrics);
const mockCollectSession = vi.mocked(collectSessionMetrics);
const mockCollectPlanning = vi.mocked(collectPlanningMetrics);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// safeCollectGit
// ============================================================================

describe('safeCollectGit', () => {
  it('returns the result as-is when collectGitMetrics resolves normally', async () => {
    const expected: GitCollectorResult = {
      commits: [
        {
          hash: 'abc1234',
          type: 'feat',
          scope: '100-01',
          phase: 100,
          subject: 'add metrics integration',
          timestamp: '2026-02-12T10:00:00Z',
          author: 'dev',
          filesChanged: 2,
          insertions: 50,
          deletions: 10,
          files: ['src/a.ts', 'src/b.ts'],
        },
      ],
      totalCommits: 1,
      timeRange: { earliest: '2026-02-12T10:00:00Z', latest: '2026-02-12T10:00:00Z' },
    };
    mockCollectGit.mockResolvedValueOnce(expected);

    const result = await safeCollectGit('/some/dir');

    expect(result).toEqual(expected);
    expect(mockCollectGit).toHaveBeenCalledOnce();
  });

  it('returns empty result when collectGitMetrics rejects', async () => {
    mockCollectGit.mockRejectedValueOnce(new Error('test error'));

    const result = await safeCollectGit('/some/dir');

    expect(result).toEqual({ commits: [], totalCommits: 0, timeRange: null });
    expect(mockCollectGit).toHaveBeenCalledOnce();
  });
});

// ============================================================================
// safeCollectSession
// ============================================================================

describe('safeCollectSession', () => {
  it('returns the result as-is when collectSessionMetrics resolves normally', async () => {
    const expected: SessionCollectorResult = {
      sessions: [
        {
          sessionId: 'sess-001',
          startTime: 1000,
          endTime: 2000,
          durationMinutes: 16.7,
          model: 'opus',
          source: 'startup',
          userMessages: 5,
          assistantMessages: 5,
          toolCalls: 10,
          filesRead: 3,
          filesWritten: 2,
          commandsRun: 1,
          topFiles: ['a.ts'],
          topCommands: ['git status'],
          activeSkills: [],
        },
      ],
      totalSessions: 1,
      activeSession: { sessionId: 'sess-001', model: 'opus', startTime: 1000 },
    };
    mockCollectSession.mockResolvedValueOnce(expected);

    const result = await safeCollectSession('/planning');

    expect(result).toEqual(expected);
    expect(mockCollectSession).toHaveBeenCalledOnce();
  });

  it('returns empty result when collectSessionMetrics rejects', async () => {
    mockCollectSession.mockRejectedValueOnce(new Error('test error'));

    const result = await safeCollectSession('/planning');

    expect(result).toEqual({ sessions: [], totalSessions: 0, activeSession: null });
    expect(mockCollectSession).toHaveBeenCalledOnce();
  });
});

// ============================================================================
// safeCollectPlanning
// ============================================================================

describe('safeCollectPlanning', () => {
  it('returns the result as-is when collectPlanningMetrics resolves normally', async () => {
    const expected: PlanningCollectorResult = {
      diffs: [],
      totalPlans: 5,
      totalWithSummary: 3,
    };
    mockCollectPlanning.mockResolvedValueOnce(expected);

    const result = await safeCollectPlanning('/planning');

    expect(result).toEqual(expected);
    expect(mockCollectPlanning).toHaveBeenCalledOnce();
  });

  it('returns empty result when collectPlanningMetrics rejects', async () => {
    mockCollectPlanning.mockRejectedValueOnce(new Error('test error'));

    const result = await safeCollectPlanning('/planning');

    expect(result).toEqual({ diffs: [], totalPlans: 0, totalWithSummary: 0 });
    expect(mockCollectPlanning).toHaveBeenCalledOnce();
  });
});
