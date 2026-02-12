/**
 * Health scorer for skill quality assessment.
 *
 * Aggregates metrics from multiple sources (test results, success signals,
 * skill metadata) into a weighted composite health score per skill.
 *
 * Components:
 * - Precision from latest test run (0-1, null if no test data)
 * - Success rate from post-activation signals (0-1, null if no signals)
 * - Token efficiency (0-1, based on character budget usage)
 * - Staleness (days since last update, null if unknown)
 *
 * Overall score is a weighted composite (0-100) with configurable thresholds
 * for flagging underperforming skills with actionable suggestions.
 */

import type { HealthScore, HealthThresholds } from '../types/evaluator.js';
import { DEFAULT_HEALTH_THRESHOLDS } from '../types/evaluator.js';
import type { ResultStore } from '../testing/result-store.js';
import type { SuccessTracker } from './success-tracker.js';
import type { SkillStore } from '../storage/skill-store.js';

/** Budget limit in characters (matches BudgetValidator default) */
const CHAR_BUDGET = 15000;

/** Staleness decay period: score reaches 0 after this many days */
const STALENESS_DECAY_DAYS = 365;

/** Weights for composite score calculation */
const WEIGHTS = {
  precision: 0.35,
  successRate: 0.25,
  tokenEfficiency: 0.15,
  freshness: 0.25,
} as const;

/**
 * Extract extension data from skill metadata safely.
 */
function getExtensionData(metadata: Record<string, unknown>): Record<string, unknown> {
  const meta = metadata?.metadata as Record<string, unknown> | undefined;
  const extensions = meta?.extensions as Record<string, unknown> | undefined;
  return (extensions?.['gsd-skill-creator'] ?? {}) as Record<string, unknown>;
}

/**
 * Compute days since a given ISO date string.
 */
function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (24 * 60 * 60 * 1000));
}

export class HealthScorer {
  private readonly thresholds: HealthThresholds;

  /**
   * Create a new HealthScorer.
   *
   * @param resultStore - Store for test run results (precision source)
   * @param successTracker - Tracker for post-activation success signals
   * @param skillStore - Store for skill metadata and content
   * @param thresholds - Optional partial overrides for health thresholds
   */
  constructor(
    private readonly resultStore: ResultStore,
    private readonly successTracker: SuccessTracker,
    private readonly skillStore: SkillStore,
    thresholds?: Partial<HealthThresholds>,
  ) {
    this.thresholds = { ...DEFAULT_HEALTH_THRESHOLDS, ...thresholds };
  }

  /**
   * Score a single skill's health.
   *
   * Aggregates precision, success rate, token efficiency, and staleness
   * into a weighted composite score (0-100). Skills below the flag threshold
   * receive actionable improvement suggestions.
   *
   * @param skillName - Name of the skill to score
   * @returns HealthScore with all metrics and suggestions
   */
  async scoreSkill(skillName: string): Promise<HealthScore> {
    // 1. Precision from latest test run
    const precision = await this.getPrecision(skillName);

    // 2. Success rate from tracker
    const successRate = await this.getSuccessRate(skillName);

    // 3. Token efficiency from skill content
    const tokenEfficiency = await this.getTokenEfficiency(skillName);

    // 4. Staleness from skill metadata
    const staleness = await this.getStaleness(skillName);

    // 5. Compute overall score
    const overallScore = this.computeOverallScore(precision, successRate, tokenEfficiency, staleness);

    // 6. Flagging and suggestions
    const suggestions = this.generateSuggestions(skillName, precision, successRate, tokenEfficiency, staleness);

    // Flagged if overall score is below threshold OR any individual metric
    // is below its threshold (skills with critical issues need attention
    // even if the composite score is passable)
    const flagged = overallScore < this.thresholds.flagThreshold
      || (precision !== null && precision < this.thresholds.minPrecision)
      || (successRate !== null && successRate < this.thresholds.minSuccessRate);

    return {
      skillName,
      precision,
      successRate,
      tokenEfficiency,
      staleness,
      overallScore,
      flagged,
      suggestions,
    };
  }

  /**
   * Score all skills and return sorted by overall score ascending (worst first).
   *
   * @returns Array of HealthScore objects, sorted worst-first
   */
  async scoreAll(): Promise<HealthScore[]> {
    const skillNames = await this.skillStore.list();
    const scores: HealthScore[] = [];

    for (const name of skillNames) {
      scores.push(await this.scoreSkill(name));
    }

    // Sort ascending (worst first, so flagged skills appear at top)
    scores.sort((a, b) => a.overallScore - b.overallScore);

    return scores;
  }

  /**
   * Return only flagged (underperforming) skills.
   *
   * @returns Array of HealthScore objects where flagged === true
   */
  async flagUnderperforming(): Promise<HealthScore[]> {
    const all = await this.scoreAll();
    return all.filter(s => s.flagged);
  }

  /**
   * Get precision from latest test run.
   * Returns null when no test data exists.
   */
  private async getPrecision(skillName: string): Promise<number | null> {
    const latest = await this.resultStore.getLatest(skillName);
    if (!latest) return null;
    return latest.metrics.precision;
  }

  /**
   * Get success rate from tracker.
   * Returns null when no signals exist (total === 0).
   */
  private async getSuccessRate(skillName: string): Promise<number | null> {
    const result = await this.successTracker.getSuccessRate(skillName);
    if (result.total === 0) return null;
    return result.rate;
  }

  /**
   * Get token efficiency from skill content size.
   * Efficiency = 1 - (charCount / budget), clamped to [0, 1].
   */
  private async getTokenEfficiency(skillName: string): Promise<number> {
    const skill = await this.skillStore.read(skillName);
    const charCount = skill.body.length;
    return Math.max(0, Math.min(1, 1 - charCount / CHAR_BUDGET));
  }

  /**
   * Get staleness in days from skill metadata.
   * Fallback chain: extension updatedAt -> createdAt -> null.
   */
  private async getStaleness(skillName: string): Promise<number | null> {
    const skill = await this.skillStore.read(skillName);
    const ext = getExtensionData(skill.metadata as unknown as Record<string, unknown>);

    // Try updatedAt first
    if (ext.updatedAt && typeof ext.updatedAt === 'string') {
      return daysSince(ext.updatedAt);
    }

    // Fallback to createdAt
    if (ext.createdAt && typeof ext.createdAt === 'string') {
      return daysSince(ext.createdAt);
    }

    return null;
  }

  /**
   * Compute weighted overall score (0-100).
   *
   * For null values, exclude from weighted average and redistribute weights
   * among available components.
   */
  private computeOverallScore(
    precision: number | null,
    successRate: number | null,
    tokenEfficiency: number,
    staleness: number | null,
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;

    // Precision component
    if (precision !== null) {
      totalWeight += WEIGHTS.precision;
      weightedSum += WEIGHTS.precision * precision;
    }

    // Success rate component
    if (successRate !== null) {
      totalWeight += WEIGHTS.successRate;
      weightedSum += WEIGHTS.successRate * successRate;
    }

    // Token efficiency component (always available)
    totalWeight += WEIGHTS.tokenEfficiency;
    weightedSum += WEIGHTS.tokenEfficiency * tokenEfficiency;

    // Freshness component (derived from staleness)
    if (staleness !== null) {
      const freshnessScore = Math.max(0, 1 - staleness / STALENESS_DECAY_DAYS);
      totalWeight += WEIGHTS.freshness;
      weightedSum += WEIGHTS.freshness * freshnessScore;
    }

    // Normalize and scale to 0-100
    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 100);
  }

  /**
   * Generate actionable suggestions based on metric values and thresholds.
   */
  private generateSuggestions(
    skillName: string,
    precision: number | null,
    successRate: number | null,
    tokenEfficiency: number,
    staleness: number | null,
  ): string[] {
    const suggestions: string[] = [];

    if (precision !== null && precision < this.thresholds.minPrecision) {
      const pct = (precision * 100).toFixed(0);
      const threshPct = (this.thresholds.minPrecision * 100).toFixed(0);
      suggestions.push(
        `Precision is ${pct}% (below ${threshPct}%). Consider refining the skill description for better activation targeting.`,
      );
    }

    if (successRate !== null && successRate < this.thresholds.minSuccessRate) {
      const pct = (successRate * 100).toFixed(0);
      const threshPct = (this.thresholds.minSuccessRate * 100).toFixed(0);
      suggestions.push(
        `Success rate is ${pct}% (below ${threshPct}%). Review post-activation feedback for improvement opportunities.`,
      );
    }

    if (precision === null) {
      suggestions.push(
        `No test data available. Run \`skill-creator test generate ${skillName}\` to create test cases.`,
      );
    }

    if (staleness !== null && staleness > this.thresholds.maxStaleDays) {
      suggestions.push(
        `Skill hasn't been updated in ${staleness} days. Consider reviewing for relevance.`,
      );
    }

    if (tokenEfficiency < 0.3) {
      const pct = ((1 - tokenEfficiency) * 100).toFixed(0);
      suggestions.push(
        `Skill uses ${pct}% of token budget. Consider extracting content to references/ subdirectory.`,
      );
    }

    return suggestions;
  }
}
