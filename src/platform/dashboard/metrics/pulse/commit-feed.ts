/**
 * Recent commit feed renderer for the live session pulse section.
 *
 * Renders a list of the 10 most recent commits with conventional commit
 * type badges, scope, subject, relative timestamp, and +/- diff stats.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/pulse/commit-feed
 */

import { escapeHtml } from '../../renderer.js';
import type { GitCommitMetric } from '../../collectors/types.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of commits to display. */
const MAX_COMMITS = 10;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format an ISO timestamp as a relative time string (e.g., "2m ago").
 *
 * Uses Date.now() for the current time reference.
 */
function formatRelativeTime(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  const now = Date.now();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 0) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a commit feed showing recent commits with type badges and diff stats.
 *
 * Commits arrive most-recent-first from the git collector. Only the first
 * 10 are displayed. Each commit row includes a type badge with CSS class
 * `badge-{type}`, optional scope, escaped subject, relative timestamp,
 * and green/red diff stats.
 *
 * @param commits - Array of GitCommitMetric from the git collector
 * @returns HTML string for the commit feed
 */
export function renderCommitFeed(commits: GitCommitMetric[]): string {
  if (commits.length === 0) {
    return '<div class="pulse-card commit-feed empty">No recent commits</div>';
  }

  const visible = commits.slice(0, MAX_COMMITS);

  const rows = visible
    .map((commit) => {
      const hash = `<span class="commit-hash">${escapeHtml(commit.hash)}</span>`;
      const badge = `<span class="badge badge-${escapeHtml(commit.type)}">${escapeHtml(commit.type)}</span>`;
      const scope =
        commit.scope !== null
          ? ` <span class="commit-scope">(${escapeHtml(commit.scope)})</span>`
          : '';
      const subject = `<span class="commit-subject">${escapeHtml(commit.subject)}</span>`;
      const time = `<span class="commit-time">${formatRelativeTime(commit.timestamp)}</span>`;
      const diffStats = `<span class="diff-add">+${commit.insertions}</span> <span class="diff-del">-${commit.deletions}</span>`;

      return `  <div class="commit-row">${hash} ${badge}${scope} ${subject} ${time} ${diffStats}</div>`;
    })
    .join('\n');

  return `<div class="pulse-card commit-feed">
${rows}
</div>`;
}
