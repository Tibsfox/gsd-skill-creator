import { describe, it, expect } from 'vitest';
import { aggregateMilestoneRows, renderMilestoneTable } from './milestone-table.js';
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
  // v1.0 commits (phases 1-10)
  makeCommit({ hash: 'a1', type: 'feat', phase: 1, insertions: 100, deletions: 10 }),
  makeCommit({ hash: 'a2', type: 'test', phase: 5, insertions: 50, deletions: 5 }),
  makeCommit({ hash: 'a3', type: 'fix', phase: 10, insertions: 20, deletions: 15 }),
  // v1.1 commits (phases 11-20)
  makeCommit({ hash: 'b1', type: 'feat', phase: 12, insertions: 200, deletions: 20 }),
  makeCommit({ hash: 'b2', type: 'test', phase: 15, insertions: 80, deletions: 0 }),
  // v1.2 commits (phases 21-25)
  makeCommit({ hash: 'c1', type: 'feat', phase: 22, insertions: 300, deletions: 50 }),
  makeCommit({ hash: 'c2', type: 'test', phase: 23, insertions: 60, deletions: 0 }),
  makeCommit({ hash: 'c3', type: 'refactor', phase: 25, insertions: 10, deletions: 30 }),
  // Orphan commit (no matching milestone)
  makeCommit({ hash: 'd1', type: 'chore', phase: 99, insertions: 5, deletions: 0 }),
];

// ---------------------------------------------------------------------------
// Tests: aggregateMilestoneRows
// ---------------------------------------------------------------------------

describe('aggregateMilestoneRows', () => {
  // 1. Correctly assigns commits to milestones by phase range
  it('assigns commits to milestones by parsed phase range', () => {
    const rows = aggregateMilestoneRows(threeMilestones, mixedCommits);

    expect(rows).toHaveLength(3);

    // v1.0: phases 1-10, 3 commits, LOC = (100-10) + (50-5) + (20-15) = 140
    expect(rows[0].version).toBe('v1.0');
    expect(rows[0].commits).toBe(3);
    expect(rows[0].loc).toBe(140);
    expect(rows[0].tests).toBe(1);

    // v1.1: phases 11-20, 2 commits, LOC = (200-20) + (80-0) = 260
    expect(rows[1].version).toBe('v1.1');
    expect(rows[1].commits).toBe(2);
    expect(rows[1].loc).toBe(260);
    expect(rows[1].tests).toBe(1);

    // v1.2: phases 21-25, 3 commits, LOC = (300-50) + (60-0) + (10-30) = 290
    expect(rows[2].version).toBe('v1.2');
    expect(rows[2].commits).toBe(3);
    expect(rows[2].loc).toBe(290);
    expect(rows[2].tests).toBe(1);
  });

  // 2. Milestone with no matching commits gets zeros
  it('returns zeros for milestone with no matching commits', () => {
    const noCommits: GitCommitMetric[] = [];
    const rows = aggregateMilestoneRows(threeMilestones, noCommits);

    expect(rows).toHaveLength(3);
    expect(rows[0].commits).toBe(0);
    expect(rows[0].loc).toBe(0);
    expect(rows[0].tests).toBe(0);
  });

  // 3. Empty milestones array returns empty array
  it('returns empty array for empty milestones', () => {
    const empty: MilestonesData = {
      milestones: [],
      totals: { milestones: 0, phases: 0, plans: 0 },
    };
    const rows = aggregateMilestoneRows(empty, mixedCommits);

    expect(rows).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: renderMilestoneTable
// ---------------------------------------------------------------------------

describe('renderMilestoneTable', () => {
  // 4. Renders HTML table with correct columns
  it('renders HTML table with 7 columns', () => {
    const rows = [
      {
        version: 'v1.0',
        name: 'Core Foundation',
        phases: 10,
        plans: 30,
        commits: 50,
        loc: 5000,
        tests: 15,
        accuracy: '85%',
      },
      {
        version: 'v1.1',
        name: 'Skill System',
        phases: 8,
        plans: 20,
        commits: 30,
        loc: 3000,
        tests: 10,
        accuracy: 'N/A',
      },
    ];

    const html = renderMilestoneTable(rows);

    // Structure
    expect(html).toContain('<table');
    expect(html).toContain('milestone-table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');

    // Column headers
    expect(html).toContain('Milestone');
    expect(html).toContain('Phases');
    expect(html).toContain('Plans');
    expect(html).toContain('Commits');
    expect(html).toContain('LOC');
    expect(html).toContain('Tests');
    expect(html).toContain('Accuracy');

    // Row data
    expect(html).toContain('v1.0');
    expect(html).toContain('Core Foundation');
    expect(html).toContain('85%');
    expect(html).toContain('v1.1');
    expect(html).toContain('Skill System');
    expect(html).toContain('N/A');
  });

  // 5. Empty rows produces empty-state HTML
  it('renders empty-state when given no rows', () => {
    const html = renderMilestoneTable([]);

    expect(html).toContain('history-empty');
    expect(html).toContain('No milestone data available');
    expect(html).not.toContain('<table');
  });

  // 6. HTML-escapes milestone name values
  it('escapes HTML in milestone names', () => {
    const rows = [
      {
        version: 'v1.0',
        name: '<script>alert("xss")</script>',
        phases: 1,
        plans: 1,
        commits: 1,
        loc: 100,
        tests: 0,
        accuracy: 'N/A',
      },
    ];

    const html = renderMilestoneTable(rows);

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
