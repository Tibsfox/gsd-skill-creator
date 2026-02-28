import { describe, it, expect } from 'vitest';
import {
  renderHistoricalTrends,
  renderMilestoneTable,
  renderCommitDistribution,
  renderVelocityTrend,
  renderFileHotspots,
} from './index.js';
import type { MilestonesData } from '../../types.js';
import type { GitCommitMetric } from '../../collectors/types.js';

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

const testMilestones: MilestonesData = {
  milestones: [
    {
      version: 'v1.0',
      name: 'Core Foundation (Phases 1-5)',
      goal: 'Build core',
      shipped: '2025-06-01',
      stats: { phases: 5, plans: 10, requirements: 8 },
    },
  ],
  totals: { milestones: 1, phases: 5, plans: 10 },
};

const testCommits: GitCommitMetric[] = [
  makeCommit({ hash: 'a1', type: 'feat', phase: 1, insertions: 100, deletions: 10, files: ['src/core.ts'] }),
  makeCommit({ hash: 'a2', type: 'test', phase: 2, insertions: 50, deletions: 5, files: ['src/core.ts', 'src/test.ts'] }),
  makeCommit({ hash: 'a3', type: 'fix', phase: 3, insertions: 20, deletions: 15, files: ['src/utils.ts'] }),
];

// ---------------------------------------------------------------------------
// Tests: renderHistoricalTrends
// ---------------------------------------------------------------------------

describe('renderHistoricalTrends', () => {
  // 1. Assembles all four sub-renderers with cold-tier wrapper
  it('assembles all four sub-renderers into cold-tier wrapped section', () => {
    const html = renderHistoricalTrends(testMilestones, testCommits);

    // Cold-tier wrapper attributes
    expect(html).toContain('id="gsd-section-historical-trends"');
    expect(html).toContain('data-tier="cold"');

    // All four sub-sections present
    expect(html).toContain('Milestone Comparison');
    expect(html).toContain('Commit Type Distribution');
    expect(html).toContain('Velocity Trend');
    expect(html).toContain('File Hotspots');

    // Data from sub-renderers
    expect(html).toContain('v1.0');
    expect(html).toContain('milestone-table');
    expect(html).toContain('velocity-chart');
  });

  // 2. Empty data produces all empty-state sub-sections (no crash)
  it('renders all empty states with empty data', () => {
    const empty: MilestonesData = {
      milestones: [],
      totals: { milestones: 0, phases: 0, plans: 0 },
    };

    const html = renderHistoricalTrends(empty, []);

    expect(html).toContain('id="gsd-section-historical-trends"');
    expect(html).toContain('data-tier="cold"');

    // All four empty-state messages
    expect(html).toContain('No milestone data available');
    expect(html).toContain('No commit data available');
    expect(html).toContain('No velocity data available');
    expect(html).toContain('No file hotspot data available');
  });
});

// ---------------------------------------------------------------------------
// Tests: barrel re-exports
// ---------------------------------------------------------------------------

describe('barrel re-exports', () => {
  // 3. All sub-renderer functions are re-exported from index
  it('re-exports all sub-renderer functions', () => {
    expect(typeof renderMilestoneTable).toBe('function');
    expect(typeof renderCommitDistribution).toBe('function');
    expect(typeof renderVelocityTrend).toBe('function');
    expect(typeof renderFileHotspots).toBe('function');
    expect(typeof renderHistoricalTrends).toBe('function');
  });
});
