/**
 * Metrics integration module — orchestrates all collectors and renderers.
 *
 * Runs all three data collectors in parallel via graceful wrappers, then
 * renders all four metric sections (pulse, velocity, quality, history)
 * into a combined HTML string.
 *
 * Supports two modes:
 * - `live: true`  — wraps sections with tier-appropriate refresh scripts
 * - `live: false` — renders static HTML suitable for file:// viewing
 *
 * @module dashboard/metrics/integration
 */

import { safeCollectGit, safeCollectSession, safeCollectPlanning } from './graceful.js';
import { assemblePulseSection, type PulseSectionData } from './pulse/index.js';
import {
  renderVelocitySection,
  groupCommitsByPhase,
  computePhaseStats,
  extractTddCycles,
} from './velocity/index.js';
import { assembleQualitySection } from './quality/index.js';
import { renderHistoricalTrends } from './history/index.js';
import { wrapSectionWithRefresh } from './tier-refresh.js';
import type { DashboardData, MilestonesData } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/** Options for the metrics integration pipeline. */
export interface MetricsOptions {
  /** Path to .planning/ directory. */
  planningDir: string;
  /** Git working directory. */
  cwd: string;
  /** Enable hot/warm-tier refresh wrapping (false = static cold-tier). */
  live: boolean;
  /** Parsed dashboard data (for milestones, roadmap, state). */
  dashboardData: DashboardData;
}

/** Result from the metrics integration pipeline. */
export interface MetricsResult {
  /** Combined metrics HTML string. */
  html: string;
  /** Number of rendered sections. */
  sections: number;
  /** Total collection + rendering time in milliseconds. */
  durationMs: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Derive the current phase number from dashboard data.
 *
 * Checks state.phase first, then falls back to the last roadmap phase.
 * Returns 0 if neither is available.
 */
function deriveCurrentPhase(dashboardData: DashboardData): number {
  if (dashboardData.state?.phase) {
    const parsed = parseInt(dashboardData.state.phase, 10);
    if (!isNaN(parsed)) return parsed;
  }
  if (dashboardData.roadmap?.phases?.length) {
    const phases = dashboardData.roadmap.phases;
    return phases[phases.length - 1].number;
  }
  return 0;
}

/**
 * Count completed plans from roadmap or planning data.
 *
 * Uses the planning collector's totalWithSummary as the count of plans
 * that have both a PLAN.md and SUMMARY.md (i.e., completed).
 */
function countCompletedPlans(totalWithSummary: number): number {
  return totalWithSummary;
}

// ============================================================================
// Main Pipeline
// ============================================================================

/**
 * Collect all metrics and render all four dashboard sections.
 *
 * 1. Runs all three safe collectors in parallel (git, session, planning).
 * 2. Builds section HTML for pulse, velocity, quality, and history.
 * 3. Wraps sections with tier-appropriate refresh scripts if `live` is true.
 * 4. Returns combined HTML wrapped in a `<div class="metrics-dashboard">`.
 *
 * @param options - Pipeline configuration
 * @returns Combined metrics HTML with section count and timing
 */
export async function collectAndRenderMetrics(
  options: MetricsOptions,
): Promise<MetricsResult> {
  const startTime = Date.now();

  // 1. Run all three collectors in parallel
  const [gitResult, sessionResult, planningResult] = await Promise.all([
    safeCollectGit(options.cwd),
    safeCollectSession(options.planningDir),
    safeCollectPlanning(options.planningDir),
  ]);

  // 2. Build section HTML

  // --- Pulse section ---
  const pulseData: PulseSectionData = {
    activeSession: sessionResult.activeSession,
    commits: gitResult.commits,
    lastModifiedMs: sessionResult.activeSession?.startTime ?? null,
    messageData: {
      userMessages: 0,
      assistantMessages: 0,
      toolCalls: 0,
    },
  };

  // Derive message data from sessions if available
  if (sessionResult.sessions.length > 0) {
    const latest = sessionResult.sessions[sessionResult.sessions.length - 1];
    pulseData.messageData = {
      userMessages: latest.userMessages,
      assistantMessages: latest.assistantMessages,
      toolCalls: latest.toolCalls,
    };
  }

  let pulseHtml = assemblePulseSection(pulseData);
  if (options.live) {
    pulseHtml = wrapSectionWithRefresh('session-pulse', pulseHtml);
  }

  // --- Velocity section ---
  const currentPhase = deriveCurrentPhase(options.dashboardData);
  const phaseGroups = groupCommitsByPhase(gitResult.commits);
  const allPhaseStats = Array.from(phaseGroups.entries())
    .map(([phase, commits]) => computePhaseStats(phase, commits))
    .sort((a, b) => a.phase - b.phase);

  const currentPhaseStats = allPhaseStats.find((s) => s.phase === currentPhase) ?? null;
  const cycles = extractTddCycles(gitResult.commits);
  const totalPlans = planningResult.totalPlans;
  const completedPlans = countCompletedPlans(planningResult.totalWithSummary);

  let velocityHtml = renderVelocitySection(
    allPhaseStats,
    cycles,
    currentPhase,
    currentPhaseStats,
    totalPlans,
    completedPlans,
  );
  if (options.live) {
    velocityHtml = wrapSectionWithRefresh('phase-velocity', velocityHtml);
  }

  // --- Quality section ---
  let qualityHtml = assembleQualitySection(planningResult.diffs);
  if (options.live) {
    qualityHtml = wrapSectionWithRefresh('planning-quality', qualityHtml);
  }

  // --- History section ---
  // renderHistoricalTrends already wraps with cold-tier internally
  const milestones: MilestonesData = options.dashboardData.milestones ?? {
    milestones: [],
    totals: { milestones: 0, phases: 0, plans: 0 },
  };
  const historyHtml = renderHistoricalTrends(milestones, gitResult.commits);

  // 3. Combine all sections
  const html = `<div class="metrics-dashboard">
${pulseHtml}
${velocityHtml}
${qualityHtml}
${historyHtml}
</div>`;

  const durationMs = Date.now() - startTime;

  return {
    html,
    sections: 4,
    durationMs,
  };
}
