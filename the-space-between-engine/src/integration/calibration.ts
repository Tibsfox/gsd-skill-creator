// Calibration Math — Computes learner position, readiness, and optimal paths
// using the Complex Plane model. Depends on the Foundation Registry and
// Connection Graph for prerequisite and proximity data.

import type {
  FoundationId,
  LearnerState,
} from '../types/index';

import { FOUNDATION_ORDER, PHASE_ORDER } from '../types/index';
import { getFoundation } from '../core/registry';
import type { ConnectionGraph } from '../core/connections';
import { SkillCreatorBridge } from './skill-bridge';

// ─── CalibrationMath ──────────────────────────────────────────

export class CalibrationMath {
  private bridge: SkillCreatorBridge;

  constructor(
    private connectionGraph: ConnectionGraph,
  ) {
    this.bridge = new SkillCreatorBridge();
  }

  // ── Learner Position ───────────────────────────────────

  /**
   * Computes the learner's aggregate position on the complex plane as the
   * weighted average of all foundations where at least one phase is complete.
   *
   * Weights are proportional to the number of completed phases in each
   * foundation (more progress = more influence on position).
   *
   * If no phases are complete anywhere, returns { theta: 0, r: 0 } — the
   * origin, representing a learner who has not yet begun.
   */
  computeLearnerPosition(state: LearnerState): { theta: number; r: number } {
    let totalWeight = 0;
    let weightedTheta = 0;
    let weightedR = 0;

    for (const id of FOUNDATION_ORDER) {
      const completed = state.completedPhases[id] ?? [];
      if (completed.length === 0) continue;

      const weight = completed.length;
      const pos = this.bridge.getComplexPlanePosition(id);

      weightedTheta += pos.theta * weight;
      weightedR += pos.r * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return { theta: 0, r: 0 };
    }

    return {
      theta: weightedTheta / totalWeight,
      r: weightedR / totalWeight,
    };
  }

  // ── Readiness ──────────────────────────────────────────

  /**
   * Computes how ready a learner is for a target foundation.
   *
   * readiness = (prerequisiteCompletion x 0.6)
   *           + (proximityScore x 0.3)
   *           + (timeScore x 0.1)
   *
   * prerequisiteCompletion: fraction of target's incoming graph neighbors
   *   whose foundations are fully complete (all 6 phases done).
   *   If the target has no incoming neighbors, this is 1.0.
   *
   * proximityScore: 1.0 if the immediately previous foundation (by order)
   *   is complete; otherwise max(0, 1.0 - (orderGap x 0.2)), where orderGap
   *   is the distance from the nearest completed foundation by ordering.
   *
   * timeScore: min(1.0, totalTimeSpent / 300000) — caps at 5 minutes total
   *   engagement across all foundations.
   *
   * Returns 0-1.
   */
  computeReadiness(state: LearnerState, targetFoundation: FoundationId): number {
    const prerequisiteCompletion = this.computePrerequisiteCompletion(state, targetFoundation);
    const proximityScore = this.computeProximityScore(state, targetFoundation);
    const timeScore = this.computeTimeScore(state);

    return (prerequisiteCompletion * 0.6) + (proximityScore * 0.3) + (timeScore * 0.1);
  }

  /**
   * Suggests an optimal path through the remaining incomplete foundations,
   * ordered by readiness score (highest readiness first).
   *
   * Excludes foundations where all 6 phases are already complete.
   * Returns an empty array if everything is complete.
   */
  suggestOptimalPath(state: LearnerState): FoundationId[] {
    const incomplete = FOUNDATION_ORDER.filter(id => {
      const completed = state.completedPhases[id] ?? [];
      return completed.length < PHASE_ORDER.length;
    });

    if (incomplete.length === 0) return [];

    // Score each incomplete foundation by readiness
    const scored = incomplete.map(id => ({
      id,
      readiness: this.computeReadiness(state, id),
      order: FOUNDATION_ORDER.indexOf(id),
    }));

    // Sort by readiness descending, then by foundation order ascending for ties
    scored.sort((a, b) => {
      if (b.readiness !== a.readiness) return b.readiness - a.readiness;
      return a.order - b.order;
    });

    return scored.map(s => s.id);
  }

  // ── Private Helpers ────────────────────────────────────

  private isFoundationComplete(state: LearnerState, id: FoundationId): boolean {
    const completed = state.completedPhases[id] ?? [];
    return completed.length >= PHASE_ORDER.length;
  }

  /**
   * Fraction of the target's incoming graph neighbors that are fully complete.
   * If no incoming neighbors exist, returns 1.0 (no prerequisites to block).
   */
  private computePrerequisiteCompletion(state: LearnerState, target: FoundationId): number {
    const incoming = this.connectionGraph.getIncoming(target);
    if (incoming.length === 0) return 1.0;

    // Deduplicate incoming foundation IDs
    const uniqueIncoming = [...new Set(incoming.map(c => c.from))];
    if (uniqueIncoming.length === 0) return 1.0;

    const completedCount = uniqueIncoming.filter(id => this.isFoundationComplete(state, id)).length;
    return completedCount / uniqueIncoming.length;
  }

  /**
   * proximityScore: 1.0 if the immediately previous foundation is complete.
   * Otherwise, find the nearest completed foundation by ordering distance and
   * compute max(0, 1.0 - (orderGap x 0.2)).
   *
   * For the first foundation (unit-circle, order index 0), if no foundation is
   * complete, proximity is 1.0 — there is no previous foundation to wait for.
   */
  private computeProximityScore(state: LearnerState, target: FoundationId): number {
    const targetIndex = FOUNDATION_ORDER.indexOf(target);

    // First foundation has no predecessor — always proximate
    if (targetIndex === 0) return 1.0;

    // Check if the immediately previous foundation is complete
    const prevId = FOUNDATION_ORDER[targetIndex - 1]!;
    if (this.isFoundationComplete(state, prevId)) return 1.0;

    // Find the nearest completed foundation by order distance
    let minGap = Infinity;
    for (const id of FOUNDATION_ORDER) {
      if (this.isFoundationComplete(state, id)) {
        const gap = Math.abs(FOUNDATION_ORDER.indexOf(id) - targetIndex);
        if (gap < minGap) minGap = gap;
      }
    }

    // No foundation complete at all — use the target's own order as the gap
    if (minGap === Infinity) {
      return Math.max(0, 1.0 - (targetIndex * 0.2));
    }

    return Math.max(0, 1.0 - (minGap * 0.2));
  }

  /**
   * Time engagement score: min(1.0, totalTimeSpent / 300000).
   * Sums all time across all foundations. Caps at 5 minutes (300,000 ms).
   */
  private computeTimeScore(state: LearnerState): number {
    let total = 0;
    for (const id of FOUNDATION_ORDER) {
      total += state.timeSpent[id] ?? 0;
    }
    return Math.min(1.0, total / 300000);
  }
}
