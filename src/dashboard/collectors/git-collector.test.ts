import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GitCommitMetric } from './types.js';

// ---------------------------------------------------------------------------
// Mock child_process before importing the module under test
// ---------------------------------------------------------------------------

const { mockExecFile } = vi.hoisted(() => ({
  mockExecFile: vi.fn(),
}));

vi.mock('child_process', () => ({
  execFile: mockExecFile,
}));

vi.mock('util', () => ({
  promisify: (fn: unknown) => fn,
}));

// Import after mocks are set up
import { collectGitMetrics } from './git-collector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build mock git log output in the format:
 *   hash\0subject\0timestamp\0author\n
 *   insertions\tdeletions\tpath\n
 *   ...
 *
 * Commits separated by double newlines.
 */
function buildGitOutput(
  commits: Array<{
    hash: string;
    subject: string;
    timestamp: string;
    author: string;
    numstat?: Array<{ ins: string; del: string; path: string }>;
  }>,
): string {
  return commits
    .map((c) => {
      const header = `${c.hash}\0${c.subject}\0${c.timestamp}\0${c.author}`;
      const stats = (c.numstat ?? [])
        .map((s) => `${s.ins}\t${s.del}\t${s.path}`)
        .join('\n');
      return stats ? `${header}\n${stats}` : header;
    })
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectGitMetrics', () => {
  beforeEach(() => {
    mockExecFile.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Parses conventional commit format
  // -------------------------------------------------------------------------
  it('parses conventional commit format', async () => {
    const output = buildGitOutput([
      {
        hash: 'abc1234',
        subject: 'feat(auth): add login endpoint',
        timestamp: '2026-02-10T14:30:00+00:00',
        author: 'Alice',
        numstat: [{ ins: '50', del: '3', path: 'src/auth/login.ts' }],
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics();

    expect(result.commits).toHaveLength(1);
    const commit = result.commits[0];
    expect(commit.hash).toBe('abc1234');
    expect(commit.type).toBe('feat');
    expect(commit.scope).toBe('auth');
    expect(commit.subject).toBe('add login endpoint');
    expect(commit.timestamp).toBe('2026-02-10T14:30:00+00:00');
    expect(commit.author).toBe('Alice');
    expect(result.totalCommits).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 2. Extracts phase number from scope
  // -------------------------------------------------------------------------
  it('extracts phase number from scope', async () => {
    const output = buildGitOutput([
      {
        hash: 'aaa1111',
        subject: 'feat(93-01): implement collector',
        timestamp: '2026-02-10T10:00:00+00:00',
        author: 'Bob',
      },
      {
        hash: 'bbb2222',
        subject: 'fix(auth): correct validation',
        timestamp: '2026-02-10T11:00:00+00:00',
        author: 'Bob',
      },
      {
        hash: 'ccc3333',
        subject: 'chore: update deps',
        timestamp: '2026-02-10T12:00:00+00:00',
        author: 'Bob',
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics();

    expect(result.commits[0].phase).toBe(93);
    expect(result.commits[1].scope).toBe('auth');
    expect(result.commits[1].phase).toBeNull();
    expect(result.commits[2].scope).toBeNull();
    expect(result.commits[2].phase).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 3. Handles LOC delta from numstat
  // -------------------------------------------------------------------------
  it('handles LOC delta from numstat', async () => {
    const output = buildGitOutput([
      {
        hash: 'ddd4444',
        subject: 'feat(core): add feature',
        timestamp: '2026-02-10T09:00:00+00:00',
        author: 'Carol',
        numstat: [
          { ins: '10', del: '5', path: 'path/file.ts' },
          { ins: '3', del: '1', path: 'path/other.ts' },
        ],
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics();
    const commit = result.commits[0];

    expect(commit.insertions).toBe(13);
    expect(commit.deletions).toBe(6);
    expect(commit.filesChanged).toBe(2);
    expect(commit.files).toEqual(['path/file.ts', 'path/other.ts']);
  });

  // -------------------------------------------------------------------------
  // 4. Handles empty repository
  // -------------------------------------------------------------------------
  it('handles empty repository', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });

    const result = await collectGitMetrics();

    expect(result.commits).toEqual([]);
    expect(result.totalCommits).toBe(0);
    expect(result.timeRange).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 5. Respects maxCommits option
  // -------------------------------------------------------------------------
  it('respects maxCommits option', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });

    await collectGitMetrics({ maxCommits: 100 });

    const callArgs = mockExecFile.mock.calls[0];
    const args: string[] = callArgs[1];
    const nIndex = args.indexOf('-n');
    expect(nIndex).toBeGreaterThanOrEqual(0);
    expect(args[nIndex + 1]).toBe('100');
  });

  // -------------------------------------------------------------------------
  // 6. Respects since option
  // -------------------------------------------------------------------------
  it('respects since option', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });

    await collectGitMetrics({ since: '2026-01-01' });

    const callArgs = mockExecFile.mock.calls[0];
    const args: string[] = callArgs[1];
    expect(args).toContain('--since=2026-01-01');
  });

  // -------------------------------------------------------------------------
  // 7. Handles non-conventional commits
  // -------------------------------------------------------------------------
  it('handles non-conventional commits', async () => {
    const output = buildGitOutput([
      {
        hash: 'eee5555',
        subject: 'WIP stuff',
        timestamp: '2026-02-10T08:00:00+00:00',
        author: 'Dave',
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics();
    const commit = result.commits[0];

    expect(commit.type).toBe('other');
    expect(commit.scope).toBeNull();
    expect(commit.subject).toBe('WIP stuff');
  });

  // -------------------------------------------------------------------------
  // 8. Returns time range from commit timestamps
  // -------------------------------------------------------------------------
  it('returns time range from commit timestamps', async () => {
    const output = buildGitOutput([
      {
        hash: 'fff6666',
        subject: 'feat: first',
        timestamp: '2026-02-08T10:00:00+00:00',
        author: 'Eve',
      },
      {
        hash: 'ggg7777',
        subject: 'feat: middle',
        timestamp: '2026-02-09T10:00:00+00:00',
        author: 'Eve',
      },
      {
        hash: 'hhh8888',
        subject: 'feat: last',
        timestamp: '2026-02-10T10:00:00+00:00',
        author: 'Eve',
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics();

    expect(result.timeRange).not.toBeNull();
    expect(result.timeRange!.earliest).toBe('2026-02-08T10:00:00+00:00');
    expect(result.timeRange!.latest).toBe('2026-02-10T10:00:00+00:00');
  });

  // -------------------------------------------------------------------------
  // 9. Handles git command failure gracefully
  // -------------------------------------------------------------------------
  it('handles git command failure gracefully', async () => {
    mockExecFile.mockRejectedValue(new Error('fatal: not a git repository'));

    const result = await collectGitMetrics();

    expect(result.commits).toEqual([]);
    expect(result.totalCommits).toBe(0);
    expect(result.timeRange).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 10. Handles binary files in numstat (- - path)
  // -------------------------------------------------------------------------
  it('handles binary files in numstat', async () => {
    const output = buildGitOutput([
      {
        hash: 'iii9999',
        subject: 'feat: add image',
        timestamp: '2026-02-10T10:00:00+00:00',
        author: 'Frank',
        numstat: [
          { ins: '-', del: '-', path: 'assets/logo.png' },
          { ins: '5', del: '2', path: 'src/index.ts' },
        ],
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics();
    const commit = result.commits[0];

    expect(commit.insertions).toBe(5);
    expect(commit.deletions).toBe(2);
    expect(commit.filesChanged).toBe(2);
    expect(commit.files).toContain('assets/logo.png');
    expect(commit.files).toContain('src/index.ts');
  });

  // -------------------------------------------------------------------------
  // 11. Filters by phase when option is set
  // -------------------------------------------------------------------------
  it('filters by phase when option is set', async () => {
    const output = buildGitOutput([
      {
        hash: 'jjj0001',
        subject: 'feat(93-01): phase 93 work',
        timestamp: '2026-02-10T10:00:00+00:00',
        author: 'Grace',
      },
      {
        hash: 'kkk0002',
        subject: 'feat(94-01): phase 94 work',
        timestamp: '2026-02-10T11:00:00+00:00',
        author: 'Grace',
      },
    ]);

    mockExecFile.mockResolvedValue({ stdout: output, stderr: '' });

    const result = await collectGitMetrics({ phase: 94 });

    expect(result.commits).toHaveLength(1);
    expect(result.commits[0].phase).toBe(94);
    expect(result.totalCommits).toBe(1);
  });
});
