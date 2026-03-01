/**
 * Tests for milestone-scope module.
 *
 * Verifies that computeMilestoneScope correctly computes
 * milestone-relative phase indices and plan counts, fixing RC-07
 * where global counts were shown instead of milestone-scoped ones.
 */

import { describe, it, expect } from 'vitest';
import { computeMilestoneScope, type MilestoneScope } from './milestone-scope.js';
import type { ProjectState, PhaseInfo, PlanInfo, CurrentPosition } from './types.js';

// ============================================================================
// Fixture helpers
// ============================================================================

/**
 * Create a minimal ProjectState for testing.
 */
function makeState(overrides: {
  position?: CurrentPosition | null;
  phases?: PhaseInfo[];
  plansByPhase?: Record<string, PlanInfo[]>;
} = {}): ProjectState {
  return {
    initialized: true,
    config: {
      mode: 'yolo',
      verbosity: 3,
      depth: 'standard',
      model_profile: 'balanced',
      parallelization: true,
      commit_docs: false,
      workflow: { research: true, plan_check: true, verifier: true },
      gates: { require_plan_approval: false, require_checkpoint_approval: true },
      safety: { max_files_per_commit: 20, require_tests: true },
      git: { auto_commit: true, commit_style: 'conventional' },
    },
    position: overrides.position ?? null,
    phases: overrides.phases ?? [],
    plansByPhase: overrides.plansByPhase ?? {},
    project: null,
    state: null,
    hasRoadmap: true,
    hasState: true,
    hasProject: false,
    hasConfig: true,
  };
}

/**
 * Create a PhaseInfo fixture.
 */
function makePhase(number: string, name: string, complete = false): PhaseInfo {
  return { number, name, complete };
}

/**
 * Create a PlanInfo fixture.
 */
function makePlan(id: string, complete = false): PlanInfo {
  return { id, complete };
}

/**
 * Create a CurrentPosition fixture.
 */
function makePosition(phase: number, totalPhases: number, phaseName: string): CurrentPosition {
  return {
    phase,
    totalPhases,
    phaseName,
    phaseStatus: null,
    plan: 1,
    totalPlans: 2,
    status: 'Executing',
    progressPercent: 50,
    lastActivity: '2026-03-01',
  };
}

// ============================================================================
// v1.53 fixture: 6 phases (497-502) with mixed plan completion
// ============================================================================

const V153_PHASES: PhaseInfo[] = [
  makePhase('497', 'Foundation', true),
  makePhase('498', 'Autonomy Engine', true),
  makePhase('499', 'Artifact Verification Gates', true),
  makePhase('500', 'Context Management', true),
  makePhase('501', 'RC-07 Fix and Integration', false),
  makePhase('502', 'Findings Report', false),
];

const V153_PLANS: Record<string, PlanInfo[]> = {
  '497': [makePlan('497-01', true), makePlan('497-02', true)],
  '498': [makePlan('498-01', true), makePlan('498-02', true), makePlan('498-03', true), makePlan('498-04', true)],
  '499': [makePlan('499-01', true), makePlan('499-02', true), makePlan('499-03', true), makePlan('499-04', true)],
  '500': [makePlan('500-01', true), makePlan('500-02', true), makePlan('500-03', true), makePlan('500-04', true)],
  '501': [makePlan('501-01', false), makePlan('501-02', false)],
  '502': [makePlan('502-01', false), makePlan('502-02', false), makePlan('502-03', false), makePlan('502-04', false)],
};

// ============================================================================
// Tests
// ============================================================================

describe('computeMilestoneScope', () => {
  it('returns null when position is null', () => {
    const state = makeState({ position: null, phases: V153_PHASES });
    expect(computeMilestoneScope(state)).toBeNull();
  });

  it('returns null when phases array is empty', () => {
    const state = makeState({
      position: makePosition(500, 502, 'Context Management'),
      phases: [],
    });
    expect(computeMilestoneScope(state)).toBeNull();
  });

  it('returns null when current phase is not found in phases', () => {
    const state = makeState({
      position: makePosition(999, 502, 'Nonexistent'),
      phases: V153_PHASES,
    });
    expect(computeMilestoneScope(state)).toBeNull();
  });

  it('returns milestone-scoped index for phase 500 in a 6-phase milestone', () => {
    const state = makeState({
      position: makePosition(500, 502, 'Context Management'),
      phases: V153_PHASES,
      plansByPhase: V153_PLANS,
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.milestonePhaseIndex).toBe(4);
    expect(scope!.totalMilestonePhases).toBe(6);
    expect(scope!.milestonePhaseName).toBe('Context Management');
  });

  it('returns correct milestone plan counts', () => {
    const state = makeState({
      position: makePosition(500, 502, 'Context Management'),
      phases: V153_PHASES,
      plansByPhase: V153_PLANS,
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    // 497: 2 complete, 498: 4 complete, 499: 4 complete, 500: 4 complete = 14 completed
    // 501: 0 complete, 502: 0 complete = 0
    // Total completed: 14
    expect(scope!.completedPlans).toBe(14);
    // Total plans: 2 + 4 + 4 + 4 + 2 + 4 = 20
    expect(scope!.totalPlans).toBe(20);
  });

  it('handles first phase of a milestone (phase index = 1)', () => {
    const state = makeState({
      position: makePosition(497, 502, 'Foundation'),
      phases: V153_PHASES,
      plansByPhase: V153_PLANS,
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.milestonePhaseIndex).toBe(1);
    expect(scope!.totalMilestonePhases).toBe(6);
    expect(scope!.milestonePhaseName).toBe('Foundation');
  });

  it('handles last phase of a milestone (phase index = N)', () => {
    const state = makeState({
      position: makePosition(502, 502, 'Findings Report'),
      phases: V153_PHASES,
      plansByPhase: V153_PLANS,
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.milestonePhaseIndex).toBe(6);
    expect(scope!.totalMilestonePhases).toBe(6);
    expect(scope!.milestonePhaseName).toBe('Findings Report');
  });

  it('uses phase name from phases array, not from position', () => {
    const state = makeState({
      position: makePosition(501, 502, 'wrong-name'),
      phases: V153_PHASES,
      plansByPhase: V153_PLANS,
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.milestonePhaseName).toBe('RC-07 Fix and Integration');
  });

  it('handles empty plansByPhase gracefully', () => {
    const state = makeState({
      position: makePosition(500, 502, 'Context Management'),
      phases: V153_PHASES,
      plansByPhase: {},
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.completedPlans).toBe(0);
    expect(scope!.totalPlans).toBe(0);
  });

  it('handles partial plansByPhase (not all phases have plan entries)', () => {
    const state = makeState({
      position: makePosition(500, 502, 'Context Management'),
      phases: V153_PHASES,
      plansByPhase: {
        '497': [makePlan('497-01', true)],
        '500': [makePlan('500-01', true), makePlan('500-02', false)],
      },
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.completedPlans).toBe(2); // 497-01 + 500-01
    expect(scope!.totalPlans).toBe(3); // 497-01 + 500-01 + 500-02
  });

  it('works with a single-phase milestone', () => {
    const singlePhase = [makePhase('42', 'Solo Phase', false)];
    const state = makeState({
      position: makePosition(42, 42, 'Solo Phase'),
      phases: singlePhase,
      plansByPhase: { '42': [makePlan('42-01', false)] },
    });

    const scope = computeMilestoneScope(state);
    expect(scope).not.toBeNull();
    expect(scope!.milestonePhaseIndex).toBe(1);
    expect(scope!.totalMilestonePhases).toBe(1);
    expect(scope!.completedPlans).toBe(0);
    expect(scope!.totalPlans).toBe(1);
  });

  it('returns correct scope when position.phase is null', () => {
    const state = makeState({
      position: {
        phase: null,
        totalPhases: null,
        phaseName: null,
        phaseStatus: null,
        plan: null,
        totalPlans: null,
        status: null,
        progressPercent: null,
        lastActivity: null,
      },
      phases: V153_PHASES,
    });
    expect(computeMilestoneScope(state)).toBeNull();
  });
});
