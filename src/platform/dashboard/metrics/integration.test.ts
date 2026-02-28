/**
 * Tests for the metrics integration module.
 *
 * The collectAndRenderMetrics function orchestrates all three collectors
 * and renders all four metric sections into combined HTML.
 *
 * @module dashboard/metrics/integration.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GitCollectorResult, SessionCollectorResult, PlanningCollectorResult } from '../collectors/types.js';
import type { DashboardData } from '../types.js';

// Mock the graceful collectors
vi.mock('./graceful.js', () => ({
  safeCollectGit: vi.fn(),
  safeCollectSession: vi.fn(),
  safeCollectPlanning: vi.fn(),
}));

// Mock all four renderers
vi.mock('./pulse/index.js', () => ({
  assemblePulseSection: vi.fn(),
}));

vi.mock('./velocity/index.js', () => ({
  renderVelocitySection: vi.fn(),
  groupCommitsByPhase: vi.fn(),
  computePhaseStats: vi.fn(),
  extractTddCycles: vi.fn(),
}));

vi.mock('./quality/index.js', () => ({
  assembleQualitySection: vi.fn(),
}));

vi.mock('./history/index.js', () => ({
  renderHistoricalTrends: vi.fn(),
}));

vi.mock('./tier-refresh.js', () => ({
  wrapSectionWithRefresh: vi.fn(),
}));

// Import mocked modules
import { safeCollectGit, safeCollectSession, safeCollectPlanning } from './graceful.js';
import { assemblePulseSection } from './pulse/index.js';
import { renderVelocitySection, groupCommitsByPhase, computePhaseStats, extractTddCycles } from './velocity/index.js';
import { assembleQualitySection } from './quality/index.js';
import { renderHistoricalTrends } from './history/index.js';
import { wrapSectionWithRefresh } from './tier-refresh.js';

// Import the module under test (does not exist yet — RED phase)
import { collectAndRenderMetrics } from './integration.js';
import type { MetricsOptions, MetricsResult } from './integration.js';

const mockSafeGit = vi.mocked(safeCollectGit);
const mockSafeSession = vi.mocked(safeCollectSession);
const mockSafePlanning = vi.mocked(safeCollectPlanning);
const mockPulse = vi.mocked(assemblePulseSection);
const mockVelocity = vi.mocked(renderVelocitySection);
const mockGroupCommits = vi.mocked(groupCommitsByPhase);
const mockComputeStats = vi.mocked(computePhaseStats);
const mockExtractTdd = vi.mocked(extractTddCycles);
const mockQuality = vi.mocked(assembleQualitySection);
const mockHistory = vi.mocked(renderHistoricalTrends);
const mockWrapRefresh = vi.mocked(wrapSectionWithRefresh);

// ============================================================================
// Fixtures
// ============================================================================

const gitResult: GitCollectorResult = {
  commits: [
    {
      hash: 'abc1234',
      type: 'feat',
      scope: '100-01',
      phase: 100,
      subject: 'add metrics',
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

const sessionResult: SessionCollectorResult = {
  sessions: [],
  totalSessions: 0,
  activeSession: { sessionId: 'sess-001', model: 'opus', startTime: 1000 },
};

const planningResult: PlanningCollectorResult = {
  diffs: [],
  totalPlans: 5,
  totalWithSummary: 3,
};

const dashboardData: DashboardData = {
  project: undefined,
  requirements: undefined,
  roadmap: {
    phases: [
      { number: 100, name: 'dashboard-integration', status: 'active', goal: 'integration', requirements: [], deliverables: [] },
    ],
    totalPhases: 1,
  },
  state: {
    milestone: 'v1.12.1',
    phase: '100',
    status: 'active',
    progress: '[===] 6/7',
    focus: 'integration',
    blockers: [],
    metrics: {},
    nextAction: 'execute 100-01',
  },
  milestones: {
    milestones: [],
    totals: { milestones: 15, phases: 93, plans: 286 },
  },
  generatedAt: '2026-02-12T10:00:00Z',
};

function makeOptions(live: boolean): MetricsOptions {
  return {
    planningDir: '/tmp/.planning',
    cwd: '/tmp/project',
    live,
    dashboardData,
  };
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();

  // Default collector mocks
  mockSafeGit.mockResolvedValue(gitResult);
  mockSafeSession.mockResolvedValue(sessionResult);
  mockSafePlanning.mockResolvedValue(planningResult);

  // Default renderer mocks return identifiable markers
  mockPulse.mockReturnValue('<!-- PULSE -->');
  mockVelocity.mockReturnValue('<!-- VELOCITY -->');
  mockQuality.mockReturnValue('<!-- QUALITY -->');
  mockHistory.mockReturnValue('<!-- HISTORY -->');

  // Velocity helpers
  mockGroupCommits.mockReturnValue(new Map());
  mockComputeStats.mockReturnValue({
    phase: 0, wallTimeMs: 0, commitCount: 0, insertions: 0, deletions: 0,
    filesChanged: 0, plansExecuted: 0, commitTypes: {}, firstCommit: '', lastCommit: '',
  });
  mockExtractTdd.mockReturnValue([]);

  // Wrap refresh returns the content with a wrapper marker
  mockWrapRefresh.mockImplementation((sectionId: string, content: string) =>
    `<div data-refresh="${sectionId}">${content}</div>`
  );
});

// ============================================================================
// Tests
// ============================================================================

describe('collectAndRenderMetrics', () => {
  it('returns HTML containing all four sections with valid collector data', async () => {
    const result = await collectAndRenderMetrics(makeOptions(false));

    expect(result.html).toContain('<!-- PULSE -->');
    expect(result.html).toContain('<!-- VELOCITY -->');
    expect(result.html).toContain('<!-- QUALITY -->');
    expect(result.html).toContain('<!-- HISTORY -->');
    expect(result.html).toContain('metrics-dashboard');
  });

  it('does not wrap sections with refresh divs when live is false', async () => {
    const result = await collectAndRenderMetrics(makeOptions(false));

    // wrapSectionWithRefresh should NOT have been called for pulse/velocity/quality
    // (history always wraps internally, but it's mocked)
    const refreshCalls = mockWrapRefresh.mock.calls.filter(
      ([id]) => id === 'session-pulse' || id === 'phase-velocity' || id === 'planning-quality'
    );
    expect(refreshCalls).toHaveLength(0);
  });

  it('wraps sections with tier-appropriate refresh divs when live is true', async () => {
    const result = await collectAndRenderMetrics(makeOptions(true));

    // wrapSectionWithRefresh should have been called for pulse, velocity, quality
    const refreshIds = mockWrapRefresh.mock.calls.map(([id]) => id);
    expect(refreshIds).toContain('session-pulse');
    expect(refreshIds).toContain('phase-velocity');
    expect(refreshIds).toContain('planning-quality');
  });

  it('produces valid HTML with empty-state sections when all collectors return empty', async () => {
    // Override collectors to return empty results
    mockSafeGit.mockResolvedValue({ commits: [], totalCommits: 0, timeRange: null });
    mockSafeSession.mockResolvedValue({ sessions: [], totalSessions: 0, activeSession: null });
    mockSafePlanning.mockResolvedValue({ diffs: [], totalPlans: 0, totalWithSummary: 0 });

    const result = await collectAndRenderMetrics(makeOptions(false));

    // Should still contain all four sections (renderers handle empty inputs)
    expect(result.html).toContain('<!-- PULSE -->');
    expect(result.html).toContain('<!-- VELOCITY -->');
    expect(result.html).toContain('<!-- QUALITY -->');
    expect(result.html).toContain('<!-- HISTORY -->');
    // Should not throw
    expect(result.sections).toBe(4);
  });

  it('returns MetricsResult with section count and timing info', async () => {
    const result = await collectAndRenderMetrics(makeOptions(false));

    expect(result.sections).toBe(4);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.html).toBe('string');
    expect(result.html.length).toBeGreaterThan(0);
  });
});
