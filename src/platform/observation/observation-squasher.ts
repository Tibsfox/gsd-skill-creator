/**
 * observation-squasher.ts — Session Tracking: Ephemeral Aggregation
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * ObservationSquasher merges multiple ephemeral SessionObservation entries
 * into a single aggregate observation. The aggregate represents the combined
 * signal of all input sessions as if they were one session.
 *
 * WHY SQUASHING EXISTS
 * --------------------
 * Individual low-signal sessions get buffered in the ephemeral store rather
 * than immediately promoted. But what if 10 short sessions all follow the same
 * pattern? Taken together, they represent a real signal.
 *
 * Squashing is how the system converts "10 trivial sessions" into "1 aggregate
 * with meaningful signal." The aggregate captures the union of all tools, files,
 * and commands seen across those sessions, plus summed metrics.
 *
 * This reflects a key insight from CENTERCAMP-PERSONAL-JOURNAL,
 * "Philosophy 3: Making Patterns Visible Over Inferring Them":
 * "Sometimes the best learning is just seeing clearly."
 * Squashing doesn't infer — it aggregates. The aggregate is then evaluated
 * by PromotionEvaluator using the same scoring criteria as individual sessions.
 *
 * MERGE STRATEGY
 * --------------
 * Each field has a defined merge rule:
 *
 * Metrics (userMessages, assistantMessages, toolCalls, etc.):
 *   SUMMED across all observations.
 *   Rationale: more sessions = more total work done. Sum reflects cumulative effort.
 *
 * Timestamps (startTime, endTime, durationMinutes):
 *   earliest startTime, latest endTime, recomputed durationMinutes.
 *   Rationale: the aggregate spans from first to last session.
 *
 * Arrays (topCommands, topFiles, topTools, activeSkills):
 *   UNION with deduplication (Set).
 *   Rationale: if any session used "git", the aggregate used "git".
 *   Union preserves all observed behaviors across the group.
 *
 * Identity (sessionId, source, reason):
 *   Taken from the FIRST observation.
 *   Rationale: these are session-specific; the squashed record represents
 *   "a session like the first one, seen multiple times."
 *
 * Metadata (tier, squashedFrom):
 *   tier = 'persistent' (squashed records are candidates for promotion)
 *   squashedFrom = count of input observations (provenance tracking)
 *
 * SINGLE-ENTRY PASSTHROUGH
 * ------------------------
 * squash([singleObservation]) returns the single observation with tier='persistent'
 * and squashedFrom=1. This avoids unnecessary aggregation work for edge cases
 * where only one ephemeral entry accumulated before evaluation.
 *
 * EMPTY INPUT
 * -----------
 * squash([]) returns null. Callers should check for null before using the result.
 * SessionObserver already checks for empty ephemeral entries before calling squash().
 *
 * PROVENANCE
 * ----------
 * squashedFrom records how many observations were merged. This field is used
 * by PromotionEvaluator as a fallback cross-session signal:
 * "squashed from 5 observations" → treated like "seen in multiple sessions."
 *
 * This enables promotion even when session IDs are not tracked in the ephemeral
 * store (older entries without session_id field). Backward compatible.
 *
 * @see SessionObserver (session-observer.ts) — calls squash() after reading ephemeral entries
 * @see EphemeralStore (ephemeral-store.ts) — provides the entries being squashed
 * @see PromotionEvaluator (promotion-evaluator.ts) — evaluates the squashed result
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Philosophy 3" on making patterns visible
 */

import type { SessionObservation } from '../../core/types/observation.js';

/**
 * Squashes multiple ephemeral observations into a single summary observation.
 * Used during promotion to compress accumulated low-signal entries into
 * a single aggregate that can be evaluated for collective significance.
 *
 * Stateless: each squash() call is independent. Safe as a singleton.
 *
 * Merge strategy:
 * - Metrics: summed across all observations
 * - Timestamps: earliest start, latest end, recalculated duration
 * - Arrays (topCommands, topFiles, topTools, activeSkills): union with deduplication
 * - Identity (sessionId, source, reason): taken from first observation
 * - Metadata: tier set to 'persistent', squashedFrom set to input count
 */
export class ObservationSquasher {
  /**
   * Squash multiple observations into a single summary observation.
   *
   * @param observations - The ephemeral observations to merge. Must be non-empty.
   * @returns Squashed aggregate with tier='persistent', or null if input is empty.
   */
  squash(observations: SessionObservation[]): SessionObservation | null {
    if (observations.length === 0) {
      return null;
    }

    // Edge case: single observation gets promoted directly without aggregation
    if (observations.length === 1) {
      return {
        ...observations[0],
        tier: 'persistent',
        squashedFrom: 1,
      };
    }

    const first = observations[0];
    // Timestamp span: from the earliest session start to the latest session end
    const startTime = Math.min(...observations.map(o => o.startTime));
    const endTime = Math.max(...observations.map(o => o.endTime));

    return {
      // Identity from first observation — represents "what kind of session this is"
      sessionId: first.sessionId,
      startTime,
      endTime,
      durationMinutes: Math.round((endTime - startTime) / 60000),
      source: first.source,
      reason: first.reason,
      // Metrics summed — cumulative effort across all merged sessions
      metrics: {
        userMessages: observations.reduce((sum, o) => sum + o.metrics.userMessages, 0),
        assistantMessages: observations.reduce((sum, o) => sum + o.metrics.assistantMessages, 0),
        toolCalls: observations.reduce((sum, o) => sum + o.metrics.toolCalls, 0),
        uniqueFilesRead: observations.reduce((sum, o) => sum + o.metrics.uniqueFilesRead, 0),
        uniqueFilesWritten: observations.reduce((sum, o) => sum + o.metrics.uniqueFilesWritten, 0),
        uniqueCommandsRun: observations.reduce((sum, o) => sum + o.metrics.uniqueCommandsRun, 0),
      },
      // Arrays: union — "any session used this" propagates to the aggregate
      topCommands: [...new Set(observations.flatMap(o => o.topCommands))],
      topFiles: [...new Set(observations.flatMap(o => o.topFiles))],
      topTools: [...new Set(observations.flatMap(o => o.topTools))],
      activeSkills: [...new Set(observations.flatMap(o => o.activeSkills))],
      // Promotion metadata
      tier: 'persistent',
      squashedFrom: observations.length,
    };
  }
}
