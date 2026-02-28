/**
 * Critic agent -- Converge-only evaluation with 4-dimension scoring.
 *
 * The Critic is the evaluation specialist that activates exclusively during
 * the Converge phase. Its most important property: architecturally impossible
 * to invoke during Diverge, Explore, Organize, or Act phases.
 *
 * This is the second defense-in-depth point for Osborn Rule 2 enforcement.
 * The first point is RulesEngine.canActivateAgent('critic', phase). The
 * Critic's own activate() method is the second -- both must agree.
 *
 * Evaluation framework: 4 dimensions (feasibility, impact, alignment, risk)
 * with composite score formula: (feasibility + impact + alignment) - risk.
 * Range: min = -2 (1+1+1-5), max = 14 (5+5+5-1). Higher = better.
 *
 * Three prioritization methods:
 * - Dot voting: binary yes/no, rank by vote count
 * - Star rating: 1-5 scale, rank by rating
 * - Weighted scoring: 4-dimension evaluation, rank by composite
 *
 * The Critic presents results as suggestions, not verdicts.
 * "This is a signal, not a verdict -- you make the final selection."
 *
 * Only imports from ../shared/types.js, ../techniques/engine.js,
 * ../core/rules-engine.js, and ./base.js.
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  TechniqueId,
  SessionPhase,
  Idea,
  Evaluation,
} from '../shared/types.js';

import type { TechniqueEngine } from '../techniques/engine.js';
import type { RulesEngine } from '../core/rules-engine.js';

import { TechniqueAgent } from './base.js';

// ============================================================================
// Types
// ============================================================================

/**
 * An idea with its evaluation, composite score, and rank.
 *
 * Produced by all three prioritization methods (dotVote, starRate,
 * weightedScore). Rank 1 = highest.
 */
export type RankedIdea = {
  idea: Idea;
  evaluation: Evaluation;
  composite_score: number;  // (feasibility + impact + alignment) - risk
  rank: number;             // 1 = highest
};

// ============================================================================
// Critic agent
// ============================================================================

/**
 * Critic agent -- Converge-only evaluation with 4-dimension scoring
 * and three prioritization methods.
 *
 * Operates zero techniques (the Critic evaluates, it does not generate).
 * Activation is gated to 'converge' phase only -- throws for all other phases.
 */
export class Critic extends TechniqueAgent {
  /** Tracks whether activate() has been called successfully. */
  private activated = false;

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('critic', engine, rulesEngine);
  }

  /**
   * Critic operates no techniques -- it evaluates output from other agents.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [];
  }

  /**
   * Phase activation gate -- MUST be called before any evaluation.
   *
   * Throws if phase is not 'converge'. This is the second defense-in-depth
   * point (after RulesEngine.canActivateAgent). Both checks must pass.
   *
   * Critical: throws for ALL non-converge phases:
   * 'explore', 'diverge', 'organize', 'act'.
   */
  activate(phase: SessionPhase): void {
    if (phase !== 'converge') {
      throw new Error(
        `Critic cannot activate during '${phase}' phase. ` +
        `Critic is only active during Converge. ` +
        `Osborn Rule 2 (No Criticism) is in effect during ${phase}.`,
      );
    }

    // Double-check with RulesEngine (defense-in-depth)
    const check = this.rulesEngine.canActivateAgent('critic', phase);
    if (!check.allowed) {
      throw new Error(check.reason ?? 'Critic activation blocked by Rules Engine');
    }

    this.currentPhase = phase;
    this.activated = true;
  }

  /**
   * 4-dimension evaluation of a single idea.
   *
   * Returns an Evaluation with composite_score = (feasibility + impact + alignment) - risk.
   * Validates all scores are integers 1-5. Emits to capture loop.
   */
  evaluateIdea(
    idea: Idea,
    feasibility: number,
    impact: number,
    alignment: number,
    risk: number,
    notes?: string,
    session_id?: string,
  ): Evaluation {
    // Validate scores are integers 1-5
    this.validateScore('feasibility', feasibility);
    this.validateScore('impact', impact);
    this.validateScore('alignment', alignment);
    this.validateScore('risk', risk);

    const evaluation: Evaluation = {
      idea_id: idea.id,
      feasibility,
      impact,
      alignment,
      risk,
      notes,
      evaluator: 'critic',
      timestamp: Date.now(),
    };

    // Emit to capture loop
    this.emitToCapture({
      agent: 'critic',
      content_type: 'evaluation',
      content: evaluation,
      session_id: session_id ?? this.currentSessionId,
      timestamp: Date.now(),
    });

    return evaluation;
  }

  /**
   * Dot voting: each idea gets 0 or 1 vote -- rank by vote count.
   *
   * For each idea: voted = votes.get(idea.id) ?? false.
   * Apply a stub evaluation (feasibility: 3, impact: 3, alignment: 3, risk: 2)
   * for all ideas. Sort by vote (true > false), then by idea.timestamp for ties.
   * Assign rank 1..n.
   */
  dotVote(ideas: Idea[], votes: Map<string, boolean>): RankedIdea[] {
    const entries = ideas.map(idea => {
      const voted = votes.get(idea.id) ?? false;
      const evaluation: Evaluation = {
        idea_id: idea.id,
        feasibility: 3,
        impact: 3,
        alignment: 3,
        risk: 2,
        evaluator: 'critic',
        timestamp: Date.now(),
      };
      const composite_score = (evaluation.feasibility + evaluation.impact + evaluation.alignment) - evaluation.risk;
      return { idea, evaluation, composite_score, voted };
    });

    // Sort: voted true first, then by timestamp ascending for ties
    entries.sort((a, b) => {
      if (a.voted !== b.voted) return a.voted ? -1 : 1;
      return a.idea.timestamp - b.idea.timestamp;
    });

    return entries.map((entry, index) => ({
      idea: entry.idea,
      evaluation: entry.evaluation,
      composite_score: entry.composite_score,
      rank: index + 1,
    }));
  }

  /**
   * Star rating: each idea rated 1-5 -- rank by rating.
   *
   * For each idea: rating = ratings.get(idea.id) ?? 3 (default neutral).
   * Use rating to derive composite dimensions:
   * - feasibility/impact/alignment = Math.round(rating * 0.8) clamped to 1-5
   * - risk = Math.max(1, Math.min(5, 5 - Math.round(rating * 0.8)))
   * Sort by rating descending, ties by timestamp ascending.
   * Assign rank 1..n.
   */
  starRate(ideas: Idea[], ratings: Map<string, number>): RankedIdea[] {
    const entries = ideas.map(idea => {
      const rating = ratings.get(idea.id) ?? 3;
      const scaled = Math.max(1, Math.min(5, Math.round(rating * 0.8)));
      const riskVal = Math.max(1, Math.min(5, 5 - scaled));
      const evaluation: Evaluation = {
        idea_id: idea.id,
        feasibility: scaled,
        impact: scaled,
        alignment: scaled,
        risk: riskVal,
        evaluator: 'critic',
        timestamp: Date.now(),
      };
      const composite_score = (evaluation.feasibility + evaluation.impact + evaluation.alignment) - evaluation.risk;
      return { idea, evaluation, composite_score, rating };
    });

    // Sort: rating descending, ties by timestamp ascending
    entries.sort((a, b) => {
      if (a.rating !== b.rating) return b.rating - a.rating;
      return a.idea.timestamp - b.idea.timestamp;
    });

    return entries.map((entry, index) => ({
      idea: entry.idea,
      evaluation: entry.evaluation,
      composite_score: entry.composite_score,
      rank: index + 1,
    }));
  }

  /**
   * Weighted scoring: use 4-dimension evaluations -- rank by composite score.
   *
   * Match each idea to its Evaluation by idea_id.
   * composite = (feasibility + impact + alignment) - risk.
   * Sort by composite descending, ties by timestamp ascending.
   * Ideas with no matching evaluation get composite 0 and rank after all
   * evaluated ideas.
   */
  weightedScore(ideas: Idea[], evaluations: Evaluation[]): RankedIdea[] {
    const evalMap = new Map<string, Evaluation>();
    for (const evaluation of evaluations) {
      evalMap.set(evaluation.idea_id, evaluation);
    }

    const entries = ideas.map(idea => {
      const evaluation = evalMap.get(idea.id);
      if (evaluation) {
        const composite_score = (evaluation.feasibility + evaluation.impact + evaluation.alignment) - evaluation.risk;
        return { idea, evaluation, composite_score, hasEval: true };
      }
      // No evaluation -- stub with zeros and composite 0
      const stubEval: Evaluation = {
        idea_id: idea.id,
        feasibility: 0 as any,
        impact: 0 as any,
        alignment: 0 as any,
        risk: 0 as any,
        evaluator: 'critic',
        timestamp: Date.now(),
      };
      return { idea, evaluation: stubEval, composite_score: 0, hasEval: false };
    });

    // Sort: evaluated ideas first (by composite descending), then unevaluated (by timestamp)
    entries.sort((a, b) => {
      // Evaluated ideas always rank above unevaluated
      if (a.hasEval !== b.hasEval) return a.hasEval ? -1 : 1;
      // Within same evaluation status, sort by composite descending
      if (a.composite_score !== b.composite_score) return b.composite_score - a.composite_score;
      // Tie-break by timestamp ascending
      return a.idea.timestamp - b.idea.timestamp;
    });

    return entries.map((entry, index) => ({
      idea: entry.idea,
      evaluation: entry.evaluation,
      composite_score: entry.composite_score,
      rank: index + 1,
    }));
  }

  /**
   * Format a ranked idea as a suggestion string.
   *
   * Presents results as signals, not verdicts. Ends with:
   * "This is a signal, not a verdict -- you make the final selection."
   */
  formatSuggestion(ranked: RankedIdea): string {
    return (
      `Idea ranks ${ranked.rank} (score: ${ranked.composite_score}). ` +
      `Feasibility: ${ranked.evaluation.feasibility}/5, ` +
      `Impact: ${ranked.evaluation.impact}/5, ` +
      `Alignment: ${ranked.evaluation.alignment}/5, ` +
      `Risk: ${ranked.evaluation.risk}/5. ` +
      `${ranked.evaluation.notes ? 'Notes: ' + ranked.evaluation.notes + '. ' : ''}` +
      `This is a signal, not a verdict -- you make the final selection.`
    );
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Validate that a score is an integer between 1 and 5 (inclusive).
   */
  private validateScore(dimension: string, value: number): void {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(
        `${dimension} score must be an integer between 1 and 5, got ${value}`,
      );
    }
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Critic agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createCritic(engine: TechniqueEngine, rulesEngine: RulesEngine): Critic {
  return new Critic(engine, rulesEngine);
}
