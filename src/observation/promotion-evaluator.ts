import type { SessionObservation } from '../types/observation.js';

/** Result of evaluating an observation for promotion */
export interface PromotionResult {
  /** Whether the observation should be promoted to persistent storage */
  promote: boolean;
  /** Composite score from 0-1 representing signal quality */
  score: number;
  /** Human-readable descriptions of each scoring factor */
  reasons: string[];
}

/** Optional context for cross-session evaluation */
export interface EvaluationContext {
  /** Number of distinct sessions this observation pattern was seen in */
  crossSessionCount?: number;
}

/** Default promotion criteria */
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
 */
export class PromotionEvaluator {
  private minScore: number;

  constructor(minScore: number = DEFAULT_PROMOTION_CRITERIA.minScore) {
    this.minScore = minScore;
  }

  /**
   * Evaluate an observation and return promotion decision with score breakdown.
   * Optional context provides cross-session frequency data for bonus scoring.
   */
  evaluate(observation: SessionObservation, context?: EvaluationContext): PromotionResult {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Tool calls (weight 0.3) - strongest signal
    if (observation.metrics.toolCalls > 0) {
      score += 0.3;
      reasons.push(`${observation.metrics.toolCalls} tool calls`);
    }

    // Factor 2: Duration (weight 0.2, partial 0.1)
    if (observation.durationMinutes >= 5) {
      score += 0.2;
      reasons.push(`${observation.durationMinutes}min duration`);
    } else if (observation.durationMinutes >= 2) {
      score += 0.1;
    }

    // Factor 3: File activity (weight 0.2)
    if (observation.metrics.uniqueFilesRead > 0 || observation.metrics.uniqueFilesWritten > 0) {
      score += 0.2;
      reasons.push('files accessed');
    }

    // Factor 4: User engagement (weight 0.15, partial 0.05)
    if (observation.metrics.userMessages >= 5) {
      score += 0.15;
      reasons.push(`${observation.metrics.userMessages} user messages`);
    } else if (observation.metrics.userMessages >= 3) {
      score += 0.05;
    }

    // Factor 5: Rich metadata (weight 0.15)
    if (
      observation.topCommands.length > 0 ||
      observation.topFiles.length > 0 ||
      observation.topTools.length > 0
    ) {
      score += 0.15;
      reasons.push('rich metadata');
    }

    // Factor 6: Cross-session frequency (weight 0.3)
    const crossSessionCount = context?.crossSessionCount ?? 0;
    if (crossSessionCount >= 2) {
      score += 0.3;
      reasons.push(`seen in ${crossSessionCount} sessions`);
    } else if (crossSessionCount < 2 && observation.squashedFrom && observation.squashedFrom >= 2) {
      // Fallback: squashedFrom as cross-session signal (backward compat)
      score += 0.2;
      reasons.push(`squashed from ${observation.squashedFrom} observations`);
    }

    // Cap at 1.0
    score = Math.min(score, 1.0);

    return {
      promote: score >= this.minScore,
      score,
      reasons,
    };
  }
}
