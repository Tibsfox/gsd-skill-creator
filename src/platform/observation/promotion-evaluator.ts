/**
 * promotion-evaluator.ts — Session Tracking: Storage Tier Decision
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * PromotionEvaluator decides whether a SessionObservation is worth keeping
 * in persistent storage (PatternStore 'sessions') or should be buffered in
 * the ephemeral store. It uses a 5-factor weighted scoring model to make this
 * decision.
 *
 * WHY SCORING EXISTS
 * ------------------
 * The observation system is designed to learn from meaningful sessions.
 * Not all sessions are meaningful: a 10-second session that reads one file
 * and exits has almost no signal value. If every such session were stored
 * permanently, the sessions file would fill with noise that obscures patterns.
 *
 * PromotionEvaluator embodies the principle from CENTERCAMP-PERSONAL-JOURNAL,
 * "Philosophy 5: Measuring What Matters, Not What's Easy":
 * "Ask: What would make me proud of this work in 5 years? That's the metric worth tracking."
 *
 * For session observations, that metric is: did this session contain real work?
 * The scoring model answers that question without guessing.
 *
 * THE 5-FACTOR SCORING MODEL
 * --------------------------
 * Each factor has an independent weight (weights sum to exactly 1.0 for solo factors):
 *
 *   Factor 1: Tool Calls (weight 0.30)
 *     Strongest signal of substantive work. Any session with tool calls scores 0.30.
 *     If there are no tool calls, the session was likely empty or trivial.
 *
 *   Factor 2: Duration (weight 0.20, partial 0.10)
 *     Sessions >= 5 minutes score 0.20 (full weight).
 *     Sessions 2-5 minutes score 0.10 (partial).
 *     Very short sessions (< 2 min) score 0.
 *
 *   Factor 3: File Activity (weight 0.20)
 *     Any files read or written: 0.20.
 *     File interactions indicate the session touched actual code or docs.
 *
 *   Factor 4: User Engagement (weight 0.15, partial 0.05)
 *     >= 5 user messages: 0.15 (interactive, engaged session)
 *     3-4 user messages: 0.05 (minimal engagement)
 *     < 3 user messages: 0 (possibly scripted or non-interactive)
 *
 *   Factor 5: Rich Metadata (weight 0.15)
 *     Non-empty topCommands, topFiles, or topTools: 0.15.
 *     Rich metadata indicates a session with varied activity patterns.
 *
 *   Factor 6: Cross-Session Frequency (weight 0.30, bonus)
 *     Seen in >= 2 sessions (via context.crossSessionCount): 0.30.
 *     OR squashedFrom >= 2 (squashed aggregate fallback): 0.20.
 *     Repeated patterns are more valuable than one-off sessions.
 *
 * Minimum score for promotion: 0.30 (minScore). This threshold requires at
 * least one strong factor (tool calls) or a combination of weaker factors.
 *
 * Score is capped at 1.0 regardless of how many factors trigger.
 *
 * THRESHOLD JUSTIFICATION
 * -----------------------
 * The minScore of 0.30 is documented with a justification comment:
 *   "Accepted heuristic. minScore 0.3 is the lowest composite score at which
 *   an observation has enough signal (tool calls, duration, file activity) to
 *   justify persistence."
 *
 * This is honest uncertainty (like the classifier's 0.3 default): we can't
 * prove 0.30 is optimal, but it's calibrated to exclude trivially empty sessions
 * while including all sessions with real tool usage.
 *
 * Cross-session threshold of 2 prevents single-occurrence noise from being
 * promoted via the cross-session bonus path.
 *
 * OPTIONAL CONTEXT
 * ----------------
 * evaluate() accepts an optional EvaluationContext with crossSessionCount.
 * When not provided, Factor 6 falls back to squashedFrom (from the observation
 * itself, set by ObservationSquasher). This enables cross-session scoring even
 * without a live frequency tracker.
 *
 * SCORE BREAKDOWN
 * ---------------
 * The returned PromotionResult includes:
 *   promote: boolean — the final decision
 *   score: number — composite score (0.0 to 1.0)
 *   reasons: string[] — human-readable description of each triggered factor
 *
 * reasons enables debugging and transparency: "Why was this session promoted?"
 * "3 tool calls, 7min duration, files accessed, rich metadata" is a clear answer.
 *
 * @see SessionObserver (session-observer.ts) — calls evaluate() on every session
 * @see ObservationSquasher (observation-squasher.ts) — sets squashedFrom for aggregates
 * @see EphemeralStore (ephemeral-store.ts) — receives non-promoted observations
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Philosophy 5: Measuring What Matters"
 */

import type { SessionObservation } from '../../core/types/observation.js';

/**
 * Result of evaluating an observation for promotion.
 * reasons provides transparency into which scoring factors triggered.
 */
export interface PromotionResult {
  /** Whether the observation should be promoted to persistent storage */
  promote: boolean;
  /** Composite score from 0-1 representing signal quality */
  score: number;
  /** Human-readable descriptions of each scoring factor that triggered */
  reasons: string[];
}

/**
 * Optional context for cross-session evaluation.
 * crossSessionCount should be populated from EphemeralStore.getSessionCounts()
 * when the caller wants to use cross-session frequency as a scoring factor.
 */
export interface EvaluationContext {
  /** Number of distinct sessions this observation pattern was seen in */
  crossSessionCount?: number;
}

/**
 * Default promotion criteria.
 *
 * @justification Type: Accepted heuristic. minScore 0.3 is the lowest
 * composite score at which an observation has enough signal (tool calls,
 * duration, file activity) to justify persistence. Cross-session threshold
 * of 2 (line 88) prevents single-occurrence noise from being promoted.
 */
export const DEFAULT_PROMOTION_CRITERIA = {
  minScore: 0.3,
} as const;

/**
 * Evaluates session observations for promotion from ephemeral to persistent storage.
 * Uses multi-factor scoring across 5 weighted dimensions:
 *   - Tool calls (0.3) - strongest signal of substantive work
 *   - Duration (0.2) - longer sessions tend to be more meaningful
 *   - File activity (0.2) - file reads/writes indicate code interaction
 *   - User engagement (0.15) - message count suggests interactive session
 *   - Rich metadata (0.15) - populated command/file/tool arrays indicate variety
 *
 * Plus optional Factor 6: Cross-session frequency (0.3 bonus) when context is provided.
 * Score is capped at 1.0.
 */
export class PromotionEvaluator {
  private minScore: number;

  constructor(minScore: number = DEFAULT_PROMOTION_CRITERIA.minScore) {
    this.minScore = minScore;
  }

  /**
   * Evaluate an observation and return promotion decision with score breakdown.
   *
   * Factors are evaluated independently — each factor contributes to the score
   * if its threshold is met. No factor's presence prevents another from triggering.
   *
   * Optional context provides cross-session frequency data for bonus scoring.
   * If context is omitted, squashedFrom is used as a fallback cross-session signal.
   *
   * @param observation - The session observation to evaluate
   * @param context - Optional cross-session frequency data
   * @returns Decision with promote boolean, score, and reason breakdown
   */
  evaluate(observation: SessionObservation, context?: EvaluationContext): PromotionResult {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Tool calls (weight 0.3) - strongest signal
    // Any tool calls at all indicate substantive agent work was done
    if (observation.metrics.toolCalls > 0) {
      score += 0.3;
      reasons.push(`${observation.metrics.toolCalls} tool calls`);
    }

    // Factor 2: Duration (weight 0.2, partial 0.1)
    // Full weight for >= 5 min (focused work); partial for 2-5 min (brief but real)
    if (observation.durationMinutes >= 5) {
      score += 0.2;
      reasons.push(`${observation.durationMinutes}min duration`);
    } else if (observation.durationMinutes >= 2) {
      score += 0.1; // Partial credit for 2-5 minute sessions
    }

    // Factor 3: File activity (weight 0.2)
    // Either reads or writes count — both indicate interaction with the codebase
    if (observation.metrics.uniqueFilesRead > 0 || observation.metrics.uniqueFilesWritten > 0) {
      score += 0.2;
      reasons.push('files accessed');
    }

    // Factor 4: User engagement (weight 0.15, partial 0.05)
    // >= 5 messages: genuinely interactive; 3-4: minimal interaction
    if (observation.metrics.userMessages >= 5) {
      score += 0.15;
      reasons.push(`${observation.metrics.userMessages} user messages`);
    } else if (observation.metrics.userMessages >= 3) {
      score += 0.05; // Partial credit for light engagement
    }

    // Factor 5: Rich metadata (weight 0.15)
    // Non-empty arrays indicate the session had varied activity worth recording
    if (
      observation.topCommands.length > 0 ||
      observation.topFiles.length > 0 ||
      observation.topTools.length > 0
    ) {
      score += 0.15;
      reasons.push('rich metadata');
    }

    // Factor 6: Cross-session frequency (weight 0.3)
    // Primary: crossSessionCount from explicit context
    // Fallback: squashedFrom for aggregated observations (backward compat)
    const crossSessionCount = context?.crossSessionCount ?? 0;
    if (crossSessionCount >= 2) {
      score += 0.3;
      reasons.push(`seen in ${crossSessionCount} sessions`);
    } else if (crossSessionCount < 2 && observation.squashedFrom && observation.squashedFrom >= 2) {
      // Fallback: squashedFrom as cross-session signal (backward compat)
      score += 0.2;
      reasons.push(`squashed from ${observation.squashedFrom} observations`);
    }

    // Cap at 1.0 — multiple factors can trigger, but score never exceeds ceiling
    score = Math.min(score, 1.0);

    return {
      promote: score >= this.minScore,
      score,
      reasons,
    };
  }
}
