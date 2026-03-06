/**
 * Calibration Math
 *
 * Computes learner position on the complex plane, readiness scores
 * for target foundations, and optimal path suggestions based on
 * current learner state.
 */

import type { FoundationId, LearnerState } from '@/types';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types';
import { getComplexPlanePosition, computeArcLength } from '@/integration/skill-bridge';

/**
 * Compute the learner's current position on the complex plane.
 *
 * theta = weighted average of completed foundations' theta values,
 *         weighted by fraction of phases completed in each foundation.
 * r     = overall completion percentage / 100 (0 = no progress, 1 = all done).
 *
 * If no phases are completed, returns theta=0, r=0 (the origin).
 */
export function computeLearnerPosition(state: LearnerState): { theta: number; r: number } {
  let totalWeight = 0;
  let weightedTheta = 0;
  let totalCompleted = 0;
  const totalPhases = FOUNDATION_ORDER.length * PHASE_ORDER.length; // 48

  for (const id of FOUNDATION_ORDER) {
    const completed = state.completedPhases[id] ?? [];
    totalCompleted += completed.length;

    if (completed.length > 0) {
      const weight = completed.length / PHASE_ORDER.length;
      const pos = getComplexPlanePosition(id);
      weightedTheta += pos.theta * weight;
      totalWeight += weight;
    }
  }

  const theta = totalWeight > 0 ? weightedTheta / totalWeight : 0;
  const r = totalCompleted / totalPhases;

  return { theta, r };
}

/**
 * Compute readiness score (0-1) for a target foundation.
 *
 * Readiness is based on:
 * 1. Completion of the target foundation's own phases (50% weight)
 * 2. Proximity on the complex plane — closer foundations are more ready (30% weight)
 * 3. Completion of prerequisite foundations in sequential order (20% weight)
 *
 * Returns 1.0 if the target is fully complete.
 * Returns 0.0 if nothing is complete and the target is far away.
 */
export function computeReadiness(state: LearnerState, target: FoundationId): number {
  // 1. Direct completion factor (50%)
  const targetCompleted = (state.completedPhases[target] ?? []).length;
  const directFactor = targetCompleted / PHASE_ORDER.length;

  // 2. Proximity factor (30%) — based on arc length from learner position
  //    to target position. Closer = higher readiness.
  const learnerPos = computeLearnerPosition(state);
  const targetPos = getComplexPlanePosition(target);
  const arcDist = Math.abs(targetPos.theta - learnerPos.theta) * ((learnerPos.r + targetPos.r) / 2 || 0.5);
  // Normalize: arc distances range roughly 0 to pi, map to 1..0
  const proximityFactor = Math.max(0, 1 - arcDist / Math.PI);

  // 3. Prerequisite factor (20%) — how many foundations before this one
  //    in sequential order are complete?
  const targetIndex = FOUNDATION_ORDER.indexOf(target);
  let prereqCompleted = 0;
  for (let i = 0; i < targetIndex; i++) {
    const phases = state.completedPhases[FOUNDATION_ORDER[i]] ?? [];
    if (phases.length === PHASE_ORDER.length) {
      prereqCompleted++;
    }
  }
  const prereqFactor = targetIndex > 0 ? prereqCompleted / targetIndex : 1;

  return Math.min(1, directFactor * 0.5 + proximityFactor * 0.3 + prereqFactor * 0.2);
}

/**
 * Suggest an optimal path through the foundations based on current state.
 *
 * Strategy: sort incomplete foundations by readiness (highest first),
 * then by sequential order as tiebreaker. Returns the full ordered list
 * of foundation IDs representing the suggested exploration order.
 *
 * Already-completed foundations are placed at the end (for revisiting).
 */
export function suggestOptimalPath(state: LearnerState): FoundationId[] {
  const incomplete: Array<{ id: FoundationId; readiness: number; seqOrder: number }> = [];
  const complete: FoundationId[] = [];

  for (const id of FOUNDATION_ORDER) {
    const phases = state.completedPhases[id] ?? [];
    if (phases.length === PHASE_ORDER.length) {
      complete.push(id);
    } else {
      incomplete.push({
        id,
        readiness: computeReadiness(state, id),
        seqOrder: FOUNDATION_ORDER.indexOf(id),
      });
    }
  }

  // Sort by readiness descending, then sequential order ascending
  incomplete.sort((a, b) => {
    const readinessDiff = b.readiness - a.readiness;
    if (Math.abs(readinessDiff) > 0.001) return readinessDiff;
    return a.seqOrder - b.seqOrder;
  });

  return [...incomplete.map((item) => item.id), ...complete];
}
