import { describe, it, expect } from 'vitest';
import {
  computeVelocityPoints,
  renderVelocityTrend,
} from './velocity-trend.js';
import type { MilestonesData } from '../../types.js';
import type { GitCommitMetric } from '../../collectors/types.js';
import type { VelocityPoint } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCommit(
  overrides: Partial<GitCommitMetric> = {},
): GitCommitMetric {
  return {
    hash: 'abc1234',
    type: 'feat',
    scope: null,
    phase: null,
    subject: 'test commit',
    timestamp: '2026-01-15T10:00:00Z',
    author: 'Test Author',
    filesChanged: 1,
    insertions: 10,
    deletions: 2,
    files: ['src/foo.ts'],
    ...overrides,
  };
}

const threeMilestones: MilestonesData = {
  milestones: [
    {
      version: 'v1.0',
      name: 'Core Foundation (Phases 1-10)',
      goal: 'Build core',
      shipped: '2025-06-01',
      stats: { phases: 10, plans: 30, requirements: 15 },
    },
    {
      version: 'v1.1',
      name: 'Skill System (Phases 11-20)',
      goal: 'Build skills',
      shipped: '2025-07-01',
      stats: { phases: 10, plans: 25, requirements: 12 },
    },
    {
      version: 'v1.2',
      name: 'Dashboard (Phases 21-25)',
      goal: 'Build dashboard',
      shipped: '2025-08-01',
      stats: { phases: 5, plans: 15, requirements: 8 },
    },
  ],
  totals: { milestones: 3, phases: 25, plans: 70 },
};

const mixedCommits: GitCommitMetric[] = [
  // v1.0 commits (phases 1-10): LOC = (100-10) + (50-5) + (20-15) = 140
  makeCommit({ hash: 'a1', phase: 1, insertions: 100, deletions: 10 }),
  makeCommit({ hash: 'a2', phase: 5, insertions: 50, deletions: 5 }),
  makeCommit({ hash: 'a3', phase: 10, insertions: 20, deletions: 15 }),
  // v1.1 commits (phases 11-20): LOC = (200-20) + (80-0) = 260
  makeCommit({ hash: 'b1', phase: 12, insertions: 200, deletions: 20 }),
  makeCommit({ hash: 'b2', phase: 15, insertions: 80, deletions: 0 }),
  // v1.2 commits (phases 21-25): LOC = (300-50) + (60-0) + (10-30) = 290
  makeCommit({ hash: 'c1', phase: 22, insertions: 300, deletions: 50 }),
  makeCommit({ hash: 'c2', phase: 23, insertions: 60, deletions: 0 }),
  makeCommit({ hash: 'c3', phase: 25, insertions: 10, deletions: 30 }),
];

// ---------------------------------------------------------------------------
// Tests: computeVelocityPoints
// ---------------------------------------------------------------------------

describe('computeVelocityPoints', () => {
  // 1. Correctly computes locPerPhase and phasesPerMilestone for 3 milestones
  it('computes locPerPhase and phasesPerMilestone for each milestone', () => {
    const points = computeVelocityPoints(threeMilestones, mixedCommits);

    expect(points).toHaveLength(3);

    // v1.0: LOC=140, phases=10 -> locPerPhase=14, phasesPerMilestone=10
    expect(points[0].label).toBe('v1.0');
    expect(points[0].locPerPhase).toBe(14);
    expect(points[0].phasesPerMilestone).toBe(10);

    // v1.1: LOC=260, phases=10 -> locPerPhase=26, phasesPerMilestone=10
    expect(points[1].label).toBe('v1.1');
    expect(points[1].locPerPhase).toBe(26);
    expect(points[1].phasesPerMilestone).toBe(10);

    // v1.2: LOC=290, phases=5 -> locPerPhase=58, phasesPerMilestone=5
    expect(points[2].label).toBe('v1.2');
    expect(points[2].locPerPhase).toBe(58);
    expect(points[2].phasesPerMilestone).toBe(5);
  });

  // 2. Milestone with zero phases returns locPerPhase=0, phasesPerMilestone=0
  it('returns zero values for milestone with zero phases', () => {
    const zeroPhases: MilestonesData = {
      milestones: [
        {
          version: 'v0.0',
          name: 'Empty Milestone (Phase 0)',
          goal: 'Nothing',
          shipped: '2025-01-01',
          stats: { phases: 0, plans: 0 },
        },
      ],
      totals: { milestones: 1, phases: 0, plans: 0 },
    };

    const points = computeVelocityPoints(zeroPhases, []);

    expect(points).toHaveLength(1);
    expect(points[0].locPerPhase).toBe(0);
    expect(points[0].phasesPerMilestone).toBe(0);
  });

  // 3. Empty milestones returns empty array
  it('returns empty array for empty milestones', () => {
    const empty: MilestonesData = {
      milestones: [],
      totals: { milestones: 0, phases: 0, plans: 0 },
    };

    const points = computeVelocityPoints(empty, mixedCommits);

    expect(points).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: renderVelocityTrend
// ---------------------------------------------------------------------------

describe('renderVelocityTrend', () => {
  // 4. Renders CSS-only bar chart with correct height percentages
  it('renders CSS-only bar chart with correct height percentages', () => {
    const points: VelocityPoint[] = [
      { label: 'v1.0', locPerPhase: 14, phasesPerMilestone: 10 },
      { label: 'v1.1', locPerPhase: 26, phasesPerMilestone: 10 },
      { label: 'v1.2', locPerPhase: 58, phasesPerMilestone: 5 },
    ];

    const html = renderVelocityTrend(points);

    // Chart structure
    expect(html).toContain('velocity-chart');
    expect(html).toContain('velocity-bar-group');
    expect(html).toContain('velocity-bar');
    expect(html).toContain('velocity-phases');
    expect(html).toContain('velocity-label');

    // Height percentages: v1.0=14/58*100~24.1%, v1.1=26/58*100~44.8%, v1.2=100%
    expect(html).toContain('height:100%');

    // Labels
    expect(html).toContain('v1.0');
    expect(html).toContain('v1.1');
    expect(html).toContain('v1.2');

    // Phase count display
    expect(html).toContain('10p');
    expect(html).toContain('5p');

    // Section wrapper
    expect(html).toContain('history-section');
    expect(html).toContain('Velocity Trend');
  });

  // 5. Empty points produces empty-state HTML
  it('renders empty-state when given no points', () => {
    const html = renderVelocityTrend([]);

    expect(html).toContain('history-empty');
    expect(html).toContain('No velocity data available');
    expect(html).not.toContain('velocity-chart');
  });

  // 6. Single point renders with 100% height bar
  it('renders single point with 100% height bar', () => {
    const points: VelocityPoint[] = [
      { label: 'v1.0', locPerPhase: 42, phasesPerMilestone: 7 },
    ];

    const html = renderVelocityTrend(points);

    expect(html).toContain('height:100%');
    expect(html).toContain('v1.0');
    expect(html).toContain('7p');
    expect(html).toContain('42 LOC/phase');
  });
});
