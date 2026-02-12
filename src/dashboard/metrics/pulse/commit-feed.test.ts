import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GitCommitMetric } from '../../collectors/types.js';
import { renderCommitFeed } from './commit-feed.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW_ISO = '2026-02-12T19:00:00Z';

/** Build a commit fixture with sensible defaults. */
function makeCommit(overrides: Partial<GitCommitMetric> = {}): GitCommitMetric {
  return {
    hash: 'abc1234',
    type: 'feat',
    scope: 'auth',
    phase: 96,
    subject: 'add login endpoint',
    timestamp: NOW_ISO,
    author: 'Alice',
    filesChanged: 2,
    insertions: 10,
    deletions: 3,
    files: ['src/auth.ts', 'src/auth.test.ts'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderCommitFeed', () => {
  // Fix Date.now for relative time calculations
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T19:02:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. Returns HTML with a list of commits
  // -------------------------------------------------------------------------
  it('returns HTML with a list of commits', () => {
    const commits = [makeCommit(), makeCommit({ hash: 'def5678', type: 'fix' })];
    const html = renderCommitFeed(commits);

    expect(html).toContain('commit-feed');
    expect(html).toContain('abc1234');
    expect(html).toContain('def5678');
  });

  // -------------------------------------------------------------------------
  // 2. Each commit shows type badge, scope, subject, timestamp, diff stats
  // -------------------------------------------------------------------------
  it('shows type badge, scope, subject, timestamp, and diff stats', () => {
    const commits = [makeCommit()];
    const html = renderCommitFeed(commits);

    // Type badge
    expect(html).toContain('badge badge-feat');
    expect(html).toContain('>feat<');
    // Scope
    expect(html).toContain('commit-scope');
    expect(html).toContain('auth');
    // Subject
    expect(html).toContain('commit-subject');
    expect(html).toContain('add login endpoint');
    // Relative time
    expect(html).toContain('commit-time');
    expect(html).toContain('2m ago');
    // Diff stats
    expect(html).toContain('+10');
    expect(html).toContain('-3');
  });

  // -------------------------------------------------------------------------
  // 3. Limits display to last 10 commits
  // -------------------------------------------------------------------------
  it('limits display to last 10 commits', () => {
    const commits = Array.from({ length: 15 }, (_, i) =>
      makeCommit({ hash: `hash${String(i).padStart(4, '0')}`, subject: `commit ${i}` }),
    );
    const html = renderCommitFeed(commits);

    // Should show first 10 (most recent)
    expect(html).toContain('hash0000');
    expect(html).toContain('hash0009');
    // Should NOT show 11th+
    expect(html).not.toContain('hash0010');
    expect(html).not.toContain('hash0014');
  });

  // -------------------------------------------------------------------------
  // 4. Type badge has CSS class badge-{type}
  // -------------------------------------------------------------------------
  it('type badge has CSS class badge-{type} for various types', () => {
    const types = ['feat', 'fix', 'test', 'refactor', 'docs', 'chore'];
    const commits = types.map((t) => makeCommit({ hash: `h-${t}`, type: t }));
    const html = renderCommitFeed(commits);

    for (const t of types) {
      expect(html).toContain(`badge-${t}`);
    }
  });

  // -------------------------------------------------------------------------
  // 5. Shows "No recent commits" empty state
  // -------------------------------------------------------------------------
  it('shows empty state when given empty array', () => {
    const html = renderCommitFeed([]);

    expect(html).toContain('No recent commits');
    expect(html).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // 6. Escapes HTML in commit subject
  // -------------------------------------------------------------------------
  it('escapes HTML in commit subject', () => {
    const commits = [makeCommit({ subject: '<img onerror=alert(1)>' })];
    const html = renderCommitFeed(commits);

    expect(html).not.toContain('<img onerror');
    expect(html).toContain('&lt;img onerror');
  });

  // -------------------------------------------------------------------------
  // 7. Shows compact diff stats with green/red styling
  // -------------------------------------------------------------------------
  it('shows compact diff stats with add/del classes', () => {
    const commits = [makeCommit({ insertions: 42, deletions: 7 })];
    const html = renderCommitFeed(commits);

    expect(html).toContain('diff-add');
    expect(html).toContain('+42');
    expect(html).toContain('diff-del');
    expect(html).toContain('-7');
  });

  // -------------------------------------------------------------------------
  // 8. Handles commits with null scope
  // -------------------------------------------------------------------------
  it('handles commits with null scope', () => {
    const commits = [makeCommit({ scope: null })];
    const html = renderCommitFeed(commits);

    // Should not render scope element
    expect(html).not.toContain('commit-scope');
    // Should still render everything else
    expect(html).toContain('badge-feat');
    expect(html).toContain('add login endpoint');
  });
});
