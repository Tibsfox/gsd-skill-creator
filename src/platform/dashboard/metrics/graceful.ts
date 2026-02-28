/**
 * Graceful degradation wrappers for dashboard data collectors.
 *
 * Each safe* function wraps its corresponding collector in a try/catch,
 * returning a typed empty result on failure instead of throwing. This
 * ensures the dashboard renders with empty-state sections rather than
 * crashing when a data source is unavailable.
 *
 * @module dashboard/metrics/graceful
 */

import { collectGitMetrics } from '../collectors/git-collector.js';
import { collectSessionMetrics } from '../collectors/session-collector.js';
import { collectPlanningMetrics } from '../collectors/planning-collector.js';
import type {
  GitCollectorResult,
  SessionCollectorResult,
  PlanningCollectorResult,
} from '../collectors/types.js';

/**
 * Safely collect git metrics, returning empty result on failure.
 *
 * @param cwd - Git working directory
 * @returns Git collector result (empty on error)
 */
export async function safeCollectGit(cwd: string): Promise<GitCollectorResult> {
  try {
    return await collectGitMetrics({ cwd });
  } catch {
    return { commits: [], totalCommits: 0, timeRange: null };
  }
}

/**
 * Safely collect session metrics, returning empty result on failure.
 *
 * Constructs session file paths from the planning directory:
 * - sessions.jsonl at `{planningDir}/patterns/sessions.jsonl`
 * - .session-cache.json at `{planningDir}/patterns/.session-cache.json`
 *
 * @param planningDir - Path to .planning/ directory
 * @returns Session collector result (empty on error)
 */
export async function safeCollectSession(planningDir: string): Promise<SessionCollectorResult> {
  try {
    return await collectSessionMetrics({
      sessionsPath: `${planningDir}/patterns/sessions.jsonl`,
      cachePath: `${planningDir}/patterns/.session-cache.json`,
    });
  } catch {
    return { sessions: [], totalSessions: 0, activeSession: null };
  }
}

/**
 * Safely collect planning metrics, returning empty result on failure.
 *
 * Constructs phases directory path from the planning directory.
 *
 * @param planningDir - Path to .planning/ directory
 * @returns Planning collector result (empty on error)
 */
export async function safeCollectPlanning(planningDir: string): Promise<PlanningCollectorResult> {
  try {
    return await collectPlanningMetrics({
      phasesDir: `${planningDir}/phases`,
    });
  } catch {
    return { diffs: [], totalPlans: 0, totalWithSummary: 0 };
  }
}
