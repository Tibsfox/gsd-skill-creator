import { describe, it, expect } from 'vitest';
import {
  computeFileHotspots,
  renderFileHotspots,
} from './file-hotspots.js';
import type { GitCommitMetric } from '../../collectors/types.js';
import type { FileHotspot } from './types.js';

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

/**
 * Creates commits that touch overlapping files to produce hotspots.
 * File modification counts:
 *   src/core.ts: 5 (commits 1-5)
 *   src/utils.ts: 4 (commits 1-4)
 *   src/types.ts: 3 (commits 1-3)
 *   src/index.ts: 2 (commits 1-2)
 *   src/a.ts: 1, src/b.ts: 1, src/c.ts: 1, src/d.ts: 1, src/e.ts: 1, src/f.ts: 1
 *   src/g.ts: 1, src/h.ts: 1 (12 unique files, only top 10 should be returned)
 */
const hotspotCommits: GitCommitMetric[] = [
  makeCommit({
    hash: 'h1',
    timestamp: '2026-01-10T10:00:00Z',
    files: ['src/core.ts', 'src/utils.ts', 'src/types.ts', 'src/index.ts'],
  }),
  makeCommit({
    hash: 'h2',
    timestamp: '2026-01-11T10:00:00Z',
    files: ['src/core.ts', 'src/utils.ts', 'src/types.ts', 'src/index.ts'],
  }),
  makeCommit({
    hash: 'h3',
    timestamp: '2026-01-12T10:00:00Z',
    files: ['src/core.ts', 'src/utils.ts', 'src/types.ts'],
  }),
  makeCommit({
    hash: 'h4',
    timestamp: '2026-01-13T10:00:00Z',
    files: ['src/core.ts', 'src/utils.ts'],
  }),
  makeCommit({
    hash: 'h5',
    timestamp: '2026-01-14T10:00:00Z',
    files: ['src/core.ts'],
  }),
  // Single-touch files to push total above 10
  makeCommit({
    hash: 'h6',
    timestamp: '2026-01-15T10:00:00Z',
    files: ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts', 'src/f.ts', 'src/g.ts', 'src/h.ts'],
  }),
];

// ---------------------------------------------------------------------------
// Tests: computeFileHotspots
// ---------------------------------------------------------------------------

describe('computeFileHotspots', () => {
  // 1. Returns top 10 sorted by count descending with correct lastModified
  it('returns top 10 sorted by count descending with correct lastModified', () => {
    const hotspots = computeFileHotspots(hotspotCommits);

    // 12 unique files, limited to 10
    expect(hotspots).toHaveLength(10);

    // Check ordering by count descending
    expect(hotspots[0].path).toBe('src/core.ts');
    expect(hotspots[0].modificationCount).toBe(5);

    expect(hotspots[1].path).toBe('src/utils.ts');
    expect(hotspots[1].modificationCount).toBe(4);

    expect(hotspots[2].path).toBe('src/types.ts');
    expect(hotspots[2].modificationCount).toBe(3);

    expect(hotspots[3].path).toBe('src/index.ts');
    expect(hotspots[3].modificationCount).toBe(2);

    // Remaining files should have count=1
    for (let i = 4; i < 10; i++) {
      expect(hotspots[i].modificationCount).toBe(1);
    }

    // lastModified should be from the latest commit touching each file
    expect(hotspots[0].lastModified).toBe('2026-01-14T10:00:00Z'); // core.ts last in h5
    expect(hotspots[1].lastModified).toBe('2026-01-13T10:00:00Z'); // utils.ts last in h4
  });

  // 2. Fewer than 10 unique files returns all of them
  it('returns all files when fewer than 10 unique', () => {
    const commits = [
      makeCommit({ hash: 'x1', files: ['src/a.ts', 'src/b.ts'] }),
      makeCommit({ hash: 'x2', files: ['src/a.ts'] }),
    ];

    const hotspots = computeFileHotspots(commits);

    expect(hotspots).toHaveLength(2);
    expect(hotspots[0].path).toBe('src/a.ts');
    expect(hotspots[0].modificationCount).toBe(2);
    expect(hotspots[1].path).toBe('src/b.ts');
    expect(hotspots[1].modificationCount).toBe(1);
  });

  // 3. Empty commits returns empty array
  it('returns empty array for empty commits', () => {
    const hotspots = computeFileHotspots([]);

    expect(hotspots).toEqual([]);
  });

  // 4. Ties in count preserve deterministic order (alphabetical by path)
  it('sorts alphabetically by path on count ties', () => {
    const commits = [
      makeCommit({ hash: 't1', files: ['src/zebra.ts', 'src/alpha.ts', 'src/middle.ts'] }),
    ];

    const hotspots = computeFileHotspots(commits);

    expect(hotspots).toHaveLength(3);
    // All have count=1, so alphabetical by path
    expect(hotspots[0].path).toBe('src/alpha.ts');
    expect(hotspots[1].path).toBe('src/middle.ts');
    expect(hotspots[2].path).toBe('src/zebra.ts');
  });
});

// ---------------------------------------------------------------------------
// Tests: renderFileHotspots
// ---------------------------------------------------------------------------

describe('renderFileHotspots', () => {
  // 5. Renders ordered list with rank, path, count, and recency
  it('renders ordered list with path, count badge, and date', () => {
    const hotspots: FileHotspot[] = [
      { path: 'src/core.ts', modificationCount: 15, lastModified: '2026-01-15T10:00:00Z' },
      { path: 'src/utils.ts', modificationCount: 8, lastModified: '2026-01-14T10:00:00Z' },
    ];

    const html = renderFileHotspots(hotspots);

    // Structure
    expect(html).toContain('<ol');
    expect(html).toContain('hotspot-list');
    expect(html).toContain('hotspot-item');

    // Monospace paths
    expect(html).toContain('hotspot-path');
    expect(html).toContain('<code');
    expect(html).toContain('src/core.ts');
    expect(html).toContain('src/utils.ts');

    // Count badges
    expect(html).toContain('hotspot-count');
    expect(html).toContain('15 modifications');
    expect(html).toContain('8 modifications');

    // Recency (YYYY-MM-DD portion)
    expect(html).toContain('hotspot-recency');
    expect(html).toContain('2026-01-15');
    expect(html).toContain('2026-01-14');

    // Section wrapper
    expect(html).toContain('history-section');
    expect(html).toContain('File Hotspots');
  });

  // 6. Empty hotspots produces empty-state HTML
  it('renders empty-state when given no hotspots', () => {
    const html = renderFileHotspots([]);

    expect(html).toContain('history-empty');
    expect(html).toContain('No file hotspot data available');
    expect(html).not.toContain('hotspot-list');
  });
});
