/**
 * Git metrics collector.
 *
 * Extracts commit history from git log with conventional commit parsing.
 * Returns typed {@link GitCollectorResult} objects — never HTML strings.
 *
 * @module dashboard/collectors/git-collector
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type {
  GitCommitMetric,
  GitCollectorResult,
  GitCollectorOptions,
} from './types.js';

const execFileAsync = promisify(execFile);

/**
 * Regex for conventional commit subjects.
 *
 * Matches: `type(scope)!: subject` or `type: subject`
 * - Group 1: type (feat, fix, test, refactor, docs, chore, style, perf, build, ci)
 * - Group 2: scope (optional, parenthesized)
 * - Group 3: subject (everything after `: `)
 */
const CONVENTIONAL_COMMIT_RE = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/;

/**
 * Extract phase number from a conventional commit scope.
 *
 * If scope starts with digits (e.g., "93-01", "94"), extracts the leading
 * number as the phase. Returns null for non-numeric scopes like "auth".
 */
function extractPhase(scope: string | null): number | null {
  if (!scope) return null;
  const match = scope.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse a single numstat line into insertions, deletions, and file path.
 *
 * Binary files show as `-\t-\tpath` — treated as 0 insertions, 0 deletions.
 */
function parseNumstatLine(line: string): {
  insertions: number;
  deletions: number;
  path: string;
} | null {
  const parts = line.split('\t');
  if (parts.length < 3) return null;

  const ins = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
  const del = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
  const path = parts.slice(2).join('\t'); // Handle paths with tabs (rare)

  if (isNaN(ins) || isNaN(del)) return null;

  return { insertions: ins, deletions: del, path };
}

/**
 * Parse a conventional commit subject into type, scope, and subject parts.
 */
function parseConventionalCommit(rawSubject: string): {
  type: string;
  scope: string | null;
  subject: string;
} {
  const match = rawSubject.match(CONVENTIONAL_COMMIT_RE);
  if (match) {
    return {
      type: match[1],
      scope: match[2] ?? null,
      subject: match[3],
    };
  }
  return {
    type: 'other',
    scope: null,
    subject: rawSubject,
  };
}

/**
 * Parse raw git log output into an array of GitCommitMetric objects.
 *
 * Expected format (produced by `git log --format="%h%x00%s%x00%aI%x00%an" --numstat`):
 *   hash\0subject\0timestamp\0author\n
 *   insertions\tdeletions\tpath\n
 *   ...
 *
 * Commits are separated by double newlines.
 */
function parseGitLogOutput(stdout: string): GitCommitMetric[] {
  if (!stdout.trim()) return [];

  const commits: GitCommitMetric[] = [];
  const blocks = stdout.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.length > 0);
    if (lines.length === 0) continue;

    // First line is the header: hash\0subject\0timestamp\0author
    const headerParts = lines[0].split('\0');
    if (headerParts.length < 4) continue;

    const [hash, rawSubject, timestamp, author] = headerParts;
    const { type, scope, subject } = parseConventionalCommit(rawSubject);
    const phase = extractPhase(scope);

    // Remaining lines are numstat
    let totalInsertions = 0;
    let totalDeletions = 0;
    const files: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const stat = parseNumstatLine(lines[i]);
      if (stat) {
        totalInsertions += stat.insertions;
        totalDeletions += stat.deletions;
        files.push(stat.path);
      }
    }

    commits.push({
      hash,
      type,
      scope,
      phase,
      subject,
      timestamp,
      author,
      filesChanged: files.length,
      insertions: totalInsertions,
      deletions: totalDeletions,
      files,
    });
  }

  return commits;
}

/**
 * Compute the time range (earliest and latest timestamps) from a list of commits.
 */
function computeTimeRange(
  commits: GitCommitMetric[],
): GitCollectorResult['timeRange'] {
  if (commits.length === 0) return null;

  let earliest = commits[0].timestamp;
  let latest = commits[0].timestamp;

  for (const commit of commits) {
    if (commit.timestamp < earliest) earliest = commit.timestamp;
    if (commit.timestamp > latest) latest = commit.timestamp;
  }

  return { earliest, latest };
}

/**
 * Collect git metrics from the repository's commit history.
 *
 * Runs `git log` with conventional commit parsing. Returns typed
 * {@link GitCollectorResult} with commit metrics, total count, and time range.
 *
 * Fault-tolerant: returns empty result on git failures (not a repo, etc.)
 * instead of throwing.
 *
 * @param options - Collector options (maxCommits, since, phase, cwd)
 * @returns Parsed git commit metrics
 */
export async function collectGitMetrics(
  options: GitCollectorOptions = {},
): Promise<GitCollectorResult> {
  const { maxCommits = 500, since, phase, cwd } = options;

  const args = [
    'log',
    `--format=%h%x00%s%x00%aI%x00%an`,
    '--numstat',
    '-n',
    String(maxCommits),
  ];

  if (since) {
    args.push(`--since=${since}`);
  }

  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: cwd ?? undefined,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
    });

    let commits = parseGitLogOutput(stdout);

    // Post-filter by phase if requested
    if (phase !== undefined) {
      commits = commits.filter((c) => c.phase === phase);
    }

    return {
      commits,
      totalCommits: commits.length,
      timeRange: computeTimeRange(commits),
    };
  } catch {
    // Fault-tolerant: return empty result on any git failure
    return {
      commits: [],
      totalCommits: 0,
      timeRange: null,
    };
  }
}
