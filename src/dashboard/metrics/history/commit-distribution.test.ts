import { describe, it, expect } from 'vitest';
import {
  computeCommitDistribution,
  renderCommitDistribution,
} from './commit-distribution.js';
import type { GitCommitMetric } from '../../collectors/types.js';
import type { CommitDistribution } from './types.js';

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

/** Canonical commit type colors. */
const COLORS: Record<string, string> = {
  feat: '#4CAF50',
  test: '#2196F3',
  fix: '#FF5722',
  refactor: '#9C27B0',
  docs: '#FF9800',
  other: '#607D8B',
};

const mixedCommits: GitCommitMetric[] = [
  makeCommit({ type: 'feat' }),
  makeCommit({ type: 'feat' }),
  makeCommit({ type: 'feat' }),
  makeCommit({ type: 'test' }),
  makeCommit({ type: 'test' }),
  makeCommit({ type: 'fix' }),
  makeCommit({ type: 'refactor' }),
  makeCommit({ type: 'docs' }),
  makeCommit({ type: 'chore' }), // maps to "other"
];

// ---------------------------------------------------------------------------
// Tests: computeCommitDistribution
// ---------------------------------------------------------------------------

describe('computeCommitDistribution', () => {
  // 1. Mixed types with correct percentages sorted by count descending
  it('computes distribution sorted by count descending with correct percentages', () => {
    const dist = computeCommitDistribution(mixedCommits);

    // 9 total commits: feat=3(33.3%), test=2(22.2%), fix=1(11.1%),
    // refactor=1(11.1%), docs=1(11.1%), other=1(11.1%)
    expect(dist[0].type).toBe('feat');
    expect(dist[0].count).toBe(3);
    expect(dist[0].percentage).toBeCloseTo(33.3, 0);
    expect(dist[0].color).toBe(COLORS.feat);

    expect(dist[1].type).toBe('test');
    expect(dist[1].count).toBe(2);
    expect(dist[1].percentage).toBeCloseTo(22.2, 0);
    expect(dist[1].color).toBe(COLORS.test);

    // "chore" should be mapped to "other"
    const otherEntry = dist.find((d) => d.type === 'other');
    expect(otherEntry).toBeDefined();
    expect(otherEntry!.count).toBe(1);
    expect(otherEntry!.color).toBe(COLORS.other);

    // No "chore" entry should exist
    expect(dist.find((d) => d.type === 'chore')).toBeUndefined();

    // Percentages should sum to approximately 100
    const totalPct = dist.reduce((sum, d) => sum + d.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  // 2. Empty commits returns all types with count=0
  it('returns all types with count=0 for empty commits', () => {
    const dist = computeCommitDistribution([]);

    expect(dist).toHaveLength(6); // feat, test, fix, refactor, docs, other
    for (const entry of dist) {
      expect(entry.count).toBe(0);
      expect(entry.percentage).toBe(0);
    }
  });

  // 3. Single type gets 100%
  it('gives single type 100 percent', () => {
    const commits = [
      makeCommit({ type: 'feat' }),
      makeCommit({ type: 'feat' }),
    ];
    const dist = computeCommitDistribution(commits);

    const feat = dist.find((d) => d.type === 'feat');
    expect(feat).toBeDefined();
    expect(feat!.count).toBe(2);
    expect(feat!.percentage).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Tests: renderCommitDistribution
// ---------------------------------------------------------------------------

describe('renderCommitDistribution', () => {
  // 4. Renders stacked bar with segments and legend
  it('renders stacked bar with segments and legend', () => {
    const distribution: CommitDistribution[] = [
      { type: 'feat', count: 6, percentage: 60, color: COLORS.feat },
      { type: 'test', count: 3, percentage: 30, color: COLORS.test },
      { type: 'fix', count: 1, percentage: 10, color: COLORS.fix },
    ];

    const html = renderCommitDistribution(distribution);

    // Bar structure
    expect(html).toContain('commit-bar');
    expect(html).toContain('commit-bar-segment');

    // Inline width percentages
    expect(html).toContain('width:60%');
    expect(html).toContain('width:30%');
    expect(html).toContain('width:10%');

    // Inline background colors
    expect(html).toContain(`background:${COLORS.feat}`);
    expect(html).toContain(`background:${COLORS.test}`);
    expect(html).toContain(`background:${COLORS.fix}`);

    // Legend
    expect(html).toContain('commit-legend');
    expect(html).toContain('legend-item');
    expect(html).toContain('legend-swatch');

    // Section wrapper
    expect(html).toContain('history-section');
    expect(html).toContain('Commit Type Distribution');
  });

  // 5. Empty distribution renders empty-state
  it('renders empty-state when all counts are zero', () => {
    const distribution: CommitDistribution[] = [
      { type: 'feat', count: 0, percentage: 0, color: COLORS.feat },
      { type: 'test', count: 0, percentage: 0, color: COLORS.test },
    ];

    const html = renderCommitDistribution(distribution);

    expect(html).toContain('history-empty');
    expect(html).toContain('No commit data available');
    expect(html).not.toContain('commit-bar-segment');
  });

  // 6. Each bar segment has data-type attribute and tooltip title
  it('includes data-type attribute and tooltip on each segment', () => {
    const distribution: CommitDistribution[] = [
      { type: 'feat', count: 5, percentage: 50, color: COLORS.feat },
      { type: 'test', count: 5, percentage: 50, color: COLORS.test },
    ];

    const html = renderCommitDistribution(distribution);

    expect(html).toContain('data-type="feat"');
    expect(html).toContain('data-type="test"');
    expect(html).toContain('title="feat: 5 (50%)');
    expect(html).toContain('title="test: 5 (50%)');
  });
});
