/**
 * ScoreAdjuster — applies bounded score modifications from historical usage patterns.
 *
 * High-value skills receive a boost multiplier (default +20%).
 * Dead skills receive a dampening multiplier (default -20%).
 * All other skills are unchanged (multiplier = 1.0).
 *
 * The ±20% bound is the default configuration. The pipeline always uses defaults.
 * Scores are clamped to [0, 1] after adjustment.
 *
 * Privacy: operates only on skill names and scores — no user content.
 */

import type { ScoredSkill } from '../types/application.js';
import type { PatternReport } from './types.js';

/** Configuration for ScoreAdjuster. All fields optional with documented defaults. */
export interface ScoreAdjusterConfig {
  /**
   * Multiplier factor applied to high-value skills.
   * Final multiplier = 1 + boostFactor. Default: 0.20 (i.e., ×1.20 max boost).
   */
  boostFactor?: number;
  /**
   * Multiplier factor applied to dead skills.
   * Final multiplier = 1 - dampenFactor. Default: 0.20 (i.e., ×0.80 max dampening).
   */
  dampenFactor?: number;
}

const DEFAULT_BOOST_FACTOR = 0.20;
const DEFAULT_DAMPEN_FACTOR = 0.20;

export class ScoreAdjuster {
  private boostFactor: number;
  private dampenFactor: number;

  constructor(config?: ScoreAdjusterConfig) {
    this.boostFactor = config?.boostFactor ?? DEFAULT_BOOST_FACTOR;
    this.dampenFactor = config?.dampenFactor ?? DEFAULT_DAMPEN_FACTOR;
  }

  /**
   * Apply historical pattern adjustments to a list of scored skills.
   *
   * Returns a new array — the input is not mutated.
   * Each skill's score is adjusted by a multiplier then clamped to [0, 1].
   *
   * Multiplier rules:
   *   - highValueSkill → score × (1 + boostFactor)   [default: ×1.20]
   *   - deadSkill      → score × (1 - dampenFactor)   [default: ×0.80]
   *   - otherwise      → score × 1.0 (unchanged)
   */
  adjust(skills: ScoredSkill[], report: PatternReport): ScoredSkill[] {
    const highValueSet = new Set(report.highValueSkills);
    const deadSet = new Set(report.deadSkills);

    return skills.map(skill => {
      let multiplier: number;

      if (highValueSet.has(skill.name)) {
        multiplier = 1 + this.boostFactor;
      } else if (deadSet.has(skill.name)) {
        multiplier = 1 - this.dampenFactor;
      } else {
        multiplier = 1.0;
      }

      const newScore = Math.min(1, Math.max(0, skill.score * multiplier));

      return {
        ...skill,
        score: newScore,
      };
    });
  }
}
