/**
 * Milestone-scoped phase and plan counts.
 *
 * Fixes RC-07: gsd-tools previously reported ever-growing global phase
 * numbers (e.g., "Phase 500 of 502") that were meaningless to users.
 * This module computes milestone-relative positions (e.g., "Phase 4 of 6")
 * so users see their position within the current milestone.
 *
 * Pure function with no I/O — takes a ProjectState, returns a MilestoneScope.
 */

import type { ProjectState } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Milestone-scoped phase and plan counts.
 *
 * All counts are relative to the current milestone, not global.
 */
export interface MilestoneScope {
  /** 1-based phase position within the milestone */
  milestonePhaseIndex: number;
  /** Total phases in the current milestone */
  totalMilestonePhases: number;
  /** Name of the current phase */
  milestonePhaseName: string;
  /** Completed plans across all milestone phases */
  completedPlans: number;
  /** Total plans across all milestone phases */
  totalPlans: number;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Compute milestone-scoped phase and plan counts from project state.
 *
 * The roadmap parser only extracts listed phases (not collapsed shipped
 * milestones), so `state.phases` represents the current milestone's phases.
 * This function finds the current phase within that array and computes
 * milestone-relative indices and plan counts.
 *
 * @param state - Full project state from ProjectStateReader
 * @returns MilestoneScope if computable, null if position or phases are missing
 */
export function computeMilestoneScope(state: ProjectState): MilestoneScope | null {
  // Guard: need both position and phases
  if (!state.position || state.position.phase === null) {
    return null;
  }

  if (state.phases.length === 0) {
    return null;
  }

  const currentPhaseNumber = String(state.position.phase);

  // Find the current phase in the phases array
  const phaseIndex = state.phases.findIndex(
    (p) => String(p.number) === currentPhaseNumber
  );

  if (phaseIndex === -1) {
    return null;
  }

  const currentPhase = state.phases[phaseIndex];

  // Compute milestone plan counts
  let completedPlans = 0;
  let totalPlans = 0;

  for (const phase of state.phases) {
    const plans = state.plansByPhase[String(phase.number)];
    if (plans) {
      totalPlans += plans.length;
      completedPlans += plans.filter((p) => p.complete).length;
    }
  }

  return {
    milestonePhaseIndex: phaseIndex + 1, // 1-based
    totalMilestonePhases: state.phases.length,
    milestonePhaseName: currentPhase.name,
    completedPlans,
    totalPlans,
  };
}
