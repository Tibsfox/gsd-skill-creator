/**
 * Pattern analyzer for the DACP retrospective system.
 *
 * Groups handoff outcomes by type, tracks drift statistics per pattern,
 * and recommends fidelity level changes with cooldown enforcement.
 *
 * - Promotion: 3+ consecutive outcomes with drift > 0.3
 * - Demotion: 10+ consecutive outcomes with drift < 0.05
 * - Promotion cooldown: 7 days
 * - Demotion cooldown: 14 days
 * - Max 1 fidelity level change per recommendation
 *
 * @module dacp/retrospective/analyzer
 */

import type {
  HandoffOutcome,
  HandoffPattern,
  FidelityLevel,
  FidelityChange,
  BusOpcode,
} from '../types.js';
import type { PatternAnalysisResult } from './types.js';
import { calculateDriftScore } from './drift.js';

/** Handoff outcome with handoff type classification */
export type HandoffOutcomeWithType = HandoffOutcome & {
  handoff_type: string;
};

/** Promotion threshold configuration */
export const PROMOTION_THRESHOLD = {
  drift_score: 0.3,
  consecutive_required: 3,
  cooldown_days: 7,
};

/** Demotion threshold configuration */
export const DEMOTION_THRESHOLD = {
  drift_score: 0.05,
  consecutive_required: 10,
  cooldown_days: 14,
};

/**
 * Check if the last N scores are all above a threshold.
 *
 * @param scores - Array of drift scores in chronological order
 * @param threshold - The threshold to check against
 * @param required - Number of consecutive scores required
 * @returns True if the last `required` scores are all above threshold
 */
function checkConsecutiveAbove(
  scores: number[],
  threshold: number,
  required: number,
): boolean {
  if (scores.length < required) return false;
  const tail = scores.slice(-required);
  return tail.every((s) => s > threshold);
}

/**
 * Check if the last N scores are all below a threshold.
 *
 * @param scores - Array of drift scores in chronological order
 * @param threshold - The threshold to check against
 * @param required - Number of consecutive scores required
 * @returns True if the last `required` scores are all below threshold
 */
function checkConsecutiveBelow(
  scores: number[],
  threshold: number,
  required: number,
): boolean {
  if (scores.length < required) return false;
  const tail = scores.slice(-required);
  return tail.every((s) => s < threshold);
}

/**
 * Find the most recent fidelity change of a given direction.
 *
 * @param history - Array of fidelity changes
 * @param direction - 'promotion' (to > from) or 'demotion' (to < from)
 * @returns The most recent matching change, or undefined
 */
function lastChangeOfType(
  history: FidelityChange[],
  direction: 'promotion' | 'demotion',
): FidelityChange | undefined {
  // Iterate in reverse to find most recent
  for (let i = history.length - 1; i >= 0; i--) {
    const change = history[i];
    if (direction === 'promotion' && change.to > change.from) return change;
    if (direction === 'demotion' && change.to < change.from) return change;
  }
  return undefined;
}

/**
 * Calculate the number of days between a timestamp and now.
 *
 * @param isoTimestamp - ISO 8601 timestamp
 * @param now - Reference time (defaults to current time)
 * @returns Number of days elapsed
 */
function daysSince(isoTimestamp: string, now: Date = new Date()): number {
  const then = new Date(isoTimestamp);
  return (now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000);
}

/**
 * Group outcomes by their handoff_type field.
 */
function groupByType(
  outcomes: HandoffOutcomeWithType[],
): Map<string, HandoffOutcomeWithType[]> {
  const groups = new Map<string, HandoffOutcomeWithType[]>();
  for (const outcome of outcomes) {
    const existing = groups.get(outcome.handoff_type);
    if (existing) {
      existing.push(outcome);
    } else {
      groups.set(outcome.handoff_type, [outcome]);
    }
  }
  return groups;
}

/**
 * Analyze handoff outcomes for patterns and recommend fidelity changes.
 *
 * Groups outcomes by handoff type, calculates per-type drift statistics,
 * detects patterns requiring fidelity changes, and enforces cooldowns.
 *
 * @param outcomes - Handoff outcomes with type classification
 * @param existingPatterns - Previously detected patterns
 * @param now - Optional current time for cooldown calculation (defaults to new Date())
 * @returns Analysis result with updated patterns and recommendations
 */
export function analyzePatterns(
  outcomes: HandoffOutcomeWithType[],
  existingPatterns: HandoffPattern[],
  now: Date = new Date(),
): PatternAnalysisResult {
  if (outcomes.length === 0) {
    return {
      patterns_created: 0,
      patterns_updated: 0,
      promotions_recommended: [],
      demotions_recommended: [],
      summary: {
        total_handoffs_analyzed: 0,
        avg_drift_score: 0,
        highest_drift_pattern: '',
        lowest_drift_pattern: '',
      },
    };
  }

  const grouped = groupByType(outcomes);
  const patternMap = new Map<string, HandoffPattern>();
  for (const p of existingPatterns) {
    patternMap.set(p.type, { ...p });
  }

  let patternsCreated = 0;
  let patternsUpdated = 0;
  const promotionsRecommended: HandoffPattern[] = [];
  const demotionsRecommended: HandoffPattern[] = [];
  const allDriftScores: number[] = [];
  const patternDriftAverages = new Map<string, number>();

  for (const [handoffType, typeOutcomes] of grouped) {
    // Calculate drift scores for all outcomes in this group
    const driftScores = typeOutcomes.map((o) => calculateDriftScore(o));
    const scores = driftScores.map((d) => d.score);
    allDriftScores.push(...scores);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    patternDriftAverages.set(handoffType, avgScore);

    // Find or create pattern
    let pattern = patternMap.get(handoffType);
    if (pattern) {
      // Update existing pattern
      const totalCount = pattern.observed_count + typeOutcomes.length;
      const weightedAvg =
        (pattern.avg_drift_score * pattern.observed_count + avgScore * typeOutcomes.length) /
        totalCount;

      pattern = {
        ...pattern,
        observed_count: totalCount,
        avg_drift_score: weightedAvg,
        max_drift_score: Math.max(pattern.max_drift_score, maxScore),
        last_observed: typeOutcomes[typeOutcomes.length - 1].timestamp,
        contributing_bundles: [
          ...pattern.contributing_bundles,
          ...typeOutcomes.map((o) => o.bundle_id),
        ],
      };
      patternsUpdated++;
    } else {
      // Create new pattern
      pattern = {
        id: `pattern-${handoffType}`,
        type: handoffType,
        source_agent_type: extractSourceAgent(handoffType),
        target_agent_type: extractTargetAgent(handoffType),
        opcode: extractOpcode(handoffType),
        observed_count: typeOutcomes.length,
        avg_drift_score: avgScore,
        max_drift_score: maxScore,
        current_fidelity: typeOutcomes[0].fidelity_level,
        recommended_fidelity: typeOutcomes[0].fidelity_level,
        last_observed: typeOutcomes[typeOutcomes.length - 1].timestamp,
        promotion_history: [],
        contributing_bundles: typeOutcomes.map((o) => o.bundle_id),
      };
      patternsCreated++;
    }

    // Check for promotion recommendation
    const shouldPromote = checkConsecutiveAbove(
      scores,
      PROMOTION_THRESHOLD.drift_score,
      PROMOTION_THRESHOLD.consecutive_required,
    );

    if (shouldPromote && pattern.current_fidelity < 4) {
      // Check promotion cooldown
      const lastPromotion = lastChangeOfType(pattern.promotion_history, 'promotion');
      const cooldownOk =
        !lastPromotion ||
        daysSince(lastPromotion.timestamp, now) >= PROMOTION_THRESHOLD.cooldown_days;

      if (cooldownOk) {
        const newLevel = Math.min(pattern.current_fidelity + 1, 4) as FidelityLevel;
        const change: FidelityChange = {
          from: pattern.current_fidelity,
          to: newLevel,
          reason: `High drift detected: ${PROMOTION_THRESHOLD.consecutive_required}+ consecutive outcomes above ${PROMOTION_THRESHOLD.drift_score}`,
          timestamp: now.toISOString(),
        };
        pattern = {
          ...pattern,
          recommended_fidelity: newLevel,
          promotion_history: [...pattern.promotion_history, change],
        };
        promotionsRecommended.push(pattern);
      }
    }

    // Check for demotion recommendation (only if not already promoting)
    if (!shouldPromote || pattern.current_fidelity >= 4) {
      const shouldDemote = checkConsecutiveBelow(
        scores,
        DEMOTION_THRESHOLD.drift_score,
        DEMOTION_THRESHOLD.consecutive_required,
      );

      if (shouldDemote && pattern.current_fidelity > 0) {
        // Check demotion cooldown
        const lastDemotion = lastChangeOfType(pattern.promotion_history, 'demotion');
        const cooldownOk =
          !lastDemotion ||
          daysSince(lastDemotion.timestamp, now) >= DEMOTION_THRESHOLD.cooldown_days;

        if (cooldownOk) {
          const newLevel = Math.max(pattern.current_fidelity - 1, 0) as FidelityLevel;
          const change: FidelityChange = {
            from: pattern.current_fidelity,
            to: newLevel,
            reason: `Low drift detected: ${DEMOTION_THRESHOLD.consecutive_required}+ consecutive outcomes below ${DEMOTION_THRESHOLD.drift_score}`,
            timestamp: now.toISOString(),
          };
          pattern = {
            ...pattern,
            recommended_fidelity: newLevel,
            promotion_history: [...pattern.promotion_history, change],
          };
          demotionsRecommended.push(pattern);
        }
      }
    }

    patternMap.set(handoffType, pattern);
  }

  // Compute summary
  const totalDrift = allDriftScores.reduce((a, b) => a + b, 0);
  const avgDrift = allDriftScores.length > 0 ? totalDrift / allDriftScores.length : 0;

  let highestDriftPattern = '';
  let lowestDriftPattern = '';
  let highestAvg = -Infinity;
  let lowestAvg = Infinity;

  for (const [type, avg] of patternDriftAverages) {
    if (avg > highestAvg) {
      highestAvg = avg;
      highestDriftPattern = type;
    }
    if (avg < lowestAvg) {
      lowestAvg = avg;
      lowestDriftPattern = type;
    }
  }

  return {
    patterns_created: patternsCreated,
    patterns_updated: patternsUpdated,
    promotions_recommended: promotionsRecommended,
    demotions_recommended: demotionsRecommended,
    summary: {
      total_handoffs_analyzed: outcomes.length,
      avg_drift_score: avgDrift,
      highest_drift_pattern: highestDriftPattern,
      lowest_drift_pattern: lowestDriftPattern,
    },
  };
}

/**
 * Extract source agent type from a handoff type string.
 * Expected format: "source->target:opcode" or just a plain string.
 */
function extractSourceAgent(handoffType: string): string {
  const arrow = handoffType.indexOf('->');
  if (arrow === -1) return 'unknown';
  return handoffType.slice(0, arrow);
}

/**
 * Extract target agent type from a handoff type string.
 * Expected format: "source->target:opcode" or just a plain string.
 */
function extractTargetAgent(handoffType: string): string {
  const arrow = handoffType.indexOf('->');
  if (arrow === -1) return 'unknown';
  const afterArrow = handoffType.slice(arrow + 2);
  const colon = afterArrow.indexOf(':');
  if (colon === -1) return afterArrow;
  return afterArrow.slice(0, colon);
}

/**
 * Extract opcode from a handoff type string.
 * Expected format: "source->target:opcode" or just a plain string.
 * Falls back to 'EXEC' if no opcode is found.
 */
function extractOpcode(handoffType: string): BusOpcode {
  const colon = handoffType.lastIndexOf(':');
  if (colon === -1) return 'EXEC';
  const opcode = handoffType.slice(colon + 1).toUpperCase();
  const validOpcodes = [
    'EXEC', 'VERIFY', 'TRANSFORM', 'CONFIG',
    'RESEARCH', 'REPORT', 'QUESTION', 'PATCH', 'ALERT',
  ];
  if (validOpcodes.includes(opcode)) return opcode as BusOpcode;
  return 'EXEC';
}
