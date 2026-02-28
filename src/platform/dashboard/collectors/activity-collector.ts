/**
 * Activity feed data collector.
 *
 * Bridges the gap between raw git/session collectors and the dashboard
 * activity feed renderer. Transforms git commits and session observations
 * into {@link FeedEntry} objects with entityType, domain, identifier,
 * description, and occurredAt fields.
 *
 * Fault-tolerant: uses Promise.allSettled to ensure one source failing
 * does not block the other. Never throws.
 *
 * @module dashboard/collectors/activity-collector
 */

import { collectGitMetrics } from './git-collector.js';
import { collectSessionMetrics } from './session-collector.js';
import type { GitCommitMetric, SessionMetric } from './types.js';
import type { ActivityCollectorOptions } from './types.js';
import type { FeedEntry } from '../activity-feed.js';

// ============================================================================
// Constants
// ============================================================================

/** Scope keywords mapped to frontend domain. */
const FRONTEND_KEYWORDS = new Set([
  'dashboard', 'ui', 'css', 'html', 'render', 'component', 'view', 'page',
  'style', 'layout', 'frontend', 'client',
]);

/** Scope keywords mapped to backend domain. */
const BACKEND_KEYWORDS = new Set([
  'api', 'server', 'endpoint', 'route', 'handler', 'middleware', 'backend',
  'service', 'controller', 'db', 'database', 'query',
]);

/** Scope keywords mapped to testing domain. */
const TESTING_KEYWORDS = new Set([
  'test', 'spec', 'testing', 'coverage', 'mock', 'fixture', 'assert',
  'vitest', 'jest', 'e2e',
]);

/** Regex matching plan-style scopes: digits followed by dash and more content. */
const PLAN_SCOPE_RE = /^\d+-\d/;

/** Regex matching phase-only scopes: pure digits. */
const PHASE_SCOPE_RE = /^\d+$/;

// ============================================================================
// Mapping functions
// ============================================================================

/**
 * Infer the domain from a conventional commit scope.
 *
 * Checks scope against keyword sets for frontend, backend, and testing.
 * Falls back to 'infrastructure' for unrecognized scopes.
 */
function inferDomainFromScope(scope: string | null): string {
  if (!scope) return 'infrastructure';

  const lower = scope.toLowerCase();

  if (FRONTEND_KEYWORDS.has(lower)) return 'frontend';
  if (BACKEND_KEYWORDS.has(lower)) return 'backend';
  if (TESTING_KEYWORDS.has(lower)) return 'testing';

  return 'infrastructure';
}

/**
 * Map a single git commit to a FeedEntry.
 *
 * Scope parsing rules:
 * - Scope with dash after digits (e.g. "154-01") -> entityType: 'plan'
 * - Pure digit scope (e.g. "154") -> entityType: 'phase'
 * - Non-numeric scope (e.g. "auth") -> entityType: 'skill'
 * - No scope -> entityType: 'plan', identifier is commit hash
 */
function gitCommitToFeedEntry(commit: GitCommitMetric): FeedEntry {
  const { scope, hash, subject, timestamp } = commit;

  if (!scope) {
    return {
      entityType: 'plan',
      domain: 'infrastructure',
      identifier: hash,
      description: subject,
      occurredAt: timestamp,
    };
  }

  if (PLAN_SCOPE_RE.test(scope)) {
    return {
      entityType: 'plan',
      domain: 'infrastructure',
      identifier: scope,
      description: subject,
      occurredAt: timestamp,
    };
  }

  if (PHASE_SCOPE_RE.test(scope)) {
    return {
      entityType: 'phase',
      domain: 'infrastructure',
      identifier: scope,
      description: subject,
      occurredAt: timestamp,
    };
  }

  // Non-numeric scope -> skill
  return {
    entityType: 'skill',
    domain: inferDomainFromScope(scope),
    identifier: scope,
    description: subject,
    occurredAt: timestamp,
  };
}

/**
 * Map a single session observation to FeedEntry array.
 *
 * - Sessions with activeSkills produce one entry per skill.
 * - Sessions without activeSkills produce a single 'agent' entry.
 */
function sessionToFeedEntries(session: SessionMetric): FeedEntry[] {
  const occurredAt = new Date(session.endTime).toISOString();

  if (session.activeSkills.length > 0) {
    return session.activeSkills.map((skillName) => ({
      entityType: 'skill' as const,
      domain: 'observation',
      identifier: skillName,
      description: `Active in session ${session.sessionId}`,
      occurredAt,
    }));
  }

  return [
    {
      entityType: 'agent',
      domain: 'observation',
      identifier: session.sessionId,
      description: `Session ended (${session.durationMinutes}m)`,
      occurredAt,
    },
  ];
}

// ============================================================================
// Main collector
// ============================================================================

/**
 * Collect activity feed entries from git commits and session observations.
 *
 * Uses Promise.allSettled to ensure one source failing does not block the
 * other. Merges both sources, sorts newest-first by occurredAt, and limits
 * to configurable maxEntries (default 50).
 *
 * Never throws -- returns empty array on complete failure.
 *
 * @param options - Collector options (maxEntries, maxCommits, sessionsPath, cwd)
 * @returns Sorted, limited array of FeedEntry objects
 */
export async function collectActivityFeed(
  options: ActivityCollectorOptions = {},
): Promise<FeedEntry[]> {
  const {
    maxEntries = 50,
    maxCommits = 30,
    sessionsPath,
    cwd,
  } = options;

  const [gitResult, sessionResult] = await Promise.allSettled([
    collectGitMetrics({ maxCommits, cwd }),
    collectSessionMetrics({ sessionsPath, cwd }),
  ]);

  const entries: FeedEntry[] = [];

  // Process git commits
  if (gitResult.status === 'fulfilled') {
    for (const commit of gitResult.value.commits) {
      entries.push(gitCommitToFeedEntry(commit));
    }
  }

  // Process session observations
  if (sessionResult.status === 'fulfilled') {
    for (const session of sessionResult.value.sessions) {
      entries.push(...sessionToFeedEntries(session));
    }
  }

  // Sort newest-first by occurredAt
  entries.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  // Limit to maxEntries
  return entries.slice(0, maxEntries);
}
