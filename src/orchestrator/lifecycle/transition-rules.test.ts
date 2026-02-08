/**
 * Tests for the transition rules module.
 *
 * Verifies that deriveNextActions correctly maps artifact patterns
 * and lifecycle stages to NextStepSuggestion objects.
 * The logic derives suggestions from artifact existence, not a
 * hardcoded state machine.
 */

import { describe, it, expect } from 'vitest';
import { deriveNextActions } from './transition-rules.js';
import type { PhaseArtifacts } from './types.js';
import type { LifecycleStage } from '../intent/types.js';

// ============================================================================
// Fixtures
// ============================================================================

/** Helper to create a PhaseArtifacts with overrides */
function makeArtifacts(overrides: Partial<PhaseArtifacts> = {}): PhaseArtifacts {
  return {
    phaseNumber: '39',
    phaseName: 'lifecycle-coordination',
    phaseDirectory: '39-lifecycle-coordination',
    hasContext: false,
    hasResearch: false,
    planIds: [],
    summaryIds: [],
    hasUat: false,
    hasVerification: false,
    planCount: 0,
    summaryCount: 0,
    unexecutedPlans: [],
    ...overrides,
  };
}

// ============================================================================
// Stage-level transitions (no artifacts needed)
// ============================================================================

describe('deriveNextActions - stage-level transitions', () => {
  it('suggests gsd:new-project for uninitialized stage', () => {
    const result = deriveNextActions(makeArtifacts(), 'uninitialized');

    expect(result.primary.command).toBe('gsd:new-project');
    expect(result.stage).toBe('uninitialized');
    expect(result.context).toBeTruthy();
  });

  it('suggests gsd:new-milestone for initialized stage', () => {
    const result = deriveNextActions(makeArtifacts(), 'initialized');

    expect(result.primary.command).toBe('gsd:new-milestone');
    expect(result.stage).toBe('initialized');
  });

  it('suggests gsd:audit-milestone for milestone-end stage', () => {
    const result = deriveNextActions(makeArtifacts(), 'milestone-end');

    expect(result.primary.command).toBe('gsd:audit-milestone');
    expect(result.stage).toBe('milestone-end');
  });

  it('includes gsd:complete-milestone as alternative for milestone-end', () => {
    const result = deriveNextActions(makeArtifacts(), 'milestone-end');

    const altCommands = result.alternatives.map(a => a.command);
    expect(altCommands).toContain('gsd:complete-milestone');
  });

  it('suggests gsd:plan-phase for between-phases stage', () => {
    const result = deriveNextActions(makeArtifacts(), 'between-phases');

    expect(result.primary.command).toBe('gsd:plan-phase');
    expect(result.stage).toBe('between-phases');
  });
});

// ============================================================================
// Phase-level transitions (artifact-driven)
// ============================================================================

describe('deriveNextActions - phase-level transitions', () => {
  it('suggests gsd:discuss-phase when no plans and no context', () => {
    const artifacts = makeArtifacts({
      planCount: 0,
      hasContext: false,
      hasResearch: false,
    });

    const result = deriveNextActions(artifacts, 'roadmapped');

    expect(result.primary.command).toBe('gsd:discuss-phase');
    expect(result.primary.args).toBe('39');
  });

  it('includes gsd:plan-phase as alternative when no plans and no context', () => {
    const artifacts = makeArtifacts({
      planCount: 0,
      hasContext: false,
    });

    const result = deriveNextActions(artifacts, 'roadmapped');

    const altCommands = result.alternatives.map(a => a.command);
    expect(altCommands).toContain('gsd:plan-phase');
  });

  it('suggests gsd:plan-phase when no plans but hasContext', () => {
    const artifacts = makeArtifacts({
      planCount: 0,
      hasContext: true,
    });

    const result = deriveNextActions(artifacts, 'planning');

    expect(result.primary.command).toBe('gsd:plan-phase');
    expect(result.primary.args).toBe('39');
  });

  it('includes gsd:research-phase as alternative when hasContext but no research', () => {
    const artifacts = makeArtifacts({
      planCount: 0,
      hasContext: true,
      hasResearch: false,
    });

    const result = deriveNextActions(artifacts, 'planning');

    const altCommands = result.alternatives.map(a => a.command);
    expect(altCommands).toContain('gsd:research-phase');
  });

  it('suggests gsd:plan-phase when no plans but hasResearch', () => {
    const artifacts = makeArtifacts({
      planCount: 0,
      hasResearch: true,
    });

    const result = deriveNextActions(artifacts, 'roadmapped');

    expect(result.primary.command).toBe('gsd:plan-phase');
    expect(result.primary.args).toBe('39');
  });

  it('suggests gsd:execute-phase when unexecuted plans exist', () => {
    const artifacts = makeArtifacts({
      planIds: ['39-01', '39-02', '39-03'],
      summaryIds: ['39-01'],
      planCount: 3,
      summaryCount: 1,
      unexecutedPlans: ['39-02', '39-03'],
    });

    const result = deriveNextActions(artifacts, 'executing');

    expect(result.primary.command).toBe('gsd:execute-phase');
    expect(result.primary.args).toBe('39');
    expect(result.primary.clearContext).toBe(true);
  });

  it('suggests gsd:verify-work when all plans have summaries but no UAT', () => {
    const artifacts = makeArtifacts({
      planIds: ['39-01', '39-02'],
      summaryIds: ['39-01', '39-02'],
      planCount: 2,
      summaryCount: 2,
      unexecutedPlans: [],
      hasUat: false,
    });

    const result = deriveNextActions(artifacts, 'verifying');

    expect(result.primary.command).toBe('gsd:verify-work');
    expect(result.primary.args).toBe('39');
  });

  it('suggests audit-milestone when hasUat and no nextPhaseNumber', () => {
    const artifacts = makeArtifacts({
      planIds: ['39-01', '39-02'],
      summaryIds: ['39-01', '39-02'],
      planCount: 2,
      summaryCount: 2,
      unexecutedPlans: [],
      hasUat: true,
    });

    const result = deriveNextActions(artifacts, 'verifying');

    // No nextPhaseNumber -> suggests audit (phase done, no known next phase)
    expect(result.primary.command).toBe('gsd:audit-milestone');
    expect(result.context).toMatch(/complete|verified/i);
  });

  it('suggests next phase when hasUat and nextPhaseNumber provided', () => {
    const artifacts = makeArtifacts({
      planIds: ['39-01', '39-02'],
      summaryIds: ['39-01', '39-02'],
      planCount: 2,
      summaryCount: 2,
      unexecutedPlans: [],
      hasUat: true,
    });

    const result = deriveNextActions(artifacts, 'verifying', undefined, '40');

    expect(result.primary.command).toBe('gsd:discuss-phase');
    expect(result.primary.args).toBe('40');
    expect(result.context).toMatch(/complete|next|verified/i);
  });
});

// ============================================================================
// completedCommand hint
// ============================================================================

describe('deriveNextActions - completedCommand hint', () => {
  it('enriches context text when completedCommand is provided', () => {
    const artifacts = makeArtifacts({
      planIds: ['39-01', '39-02'],
      planCount: 2,
      summaryCount: 0,
      unexecutedPlans: ['39-01', '39-02'],
    });

    const result = deriveNextActions(artifacts, 'executing', 'plan-phase');

    expect(result.context).toMatch(/plan-phase/i);
    // Primary suggestion is still artifact-derived (execute-phase)
    expect(result.primary.command).toBe('gsd:execute-phase');
  });

  it('does NOT override artifact-derived primary suggestion', () => {
    // Even though we say we just completed execute-phase,
    // artifacts show unexecuted plans still exist
    const artifacts = makeArtifacts({
      planIds: ['39-01', '39-02'],
      summaryIds: ['39-01'],
      planCount: 2,
      summaryCount: 1,
      unexecutedPlans: ['39-02'],
    });

    const result = deriveNextActions(artifacts, 'executing', 'execute-phase');

    // Still suggests execute-phase because there are unexecuted plans
    expect(result.primary.command).toBe('gsd:execute-phase');
    expect(result.context).toMatch(/execute-phase/i);
  });

  it('context enrichment works for stage-level transitions', () => {
    const result = deriveNextActions(makeArtifacts(), 'uninitialized', 'some-command');

    expect(result.context).toMatch(/some-command/i);
    expect(result.primary.command).toBe('gsd:new-project');
  });
});

// ============================================================================
// Edge case transitions
// ============================================================================

describe('deriveNextActions - edge case transitions', () => {
  // --------------------------------------------------------------------------
  // Side-quest commands return to phase flow
  // --------------------------------------------------------------------------

  describe('side-quest commands (quick/debug)', () => {
    it('gsd:quick returns to execute-phase when plans are unexecuted', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02'],
        summaryIds: ['39-01'],
        planCount: 2,
        summaryCount: 1,
        unexecutedPlans: ['39-02'],
      });

      const result = deriveNextActions(artifacts, 'executing', 'gsd:quick');

      expect(result.primary.command).toBe('gsd:execute-phase');
      expect(result.context).toMatch(/returning to phase work/i);
    });

    it('gsd:debug returns to execute-phase when plans are unexecuted', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02', '39-03'],
        summaryIds: ['39-01'],
        planCount: 3,
        summaryCount: 1,
        unexecutedPlans: ['39-02', '39-03'],
      });

      const result = deriveNextActions(artifacts, 'executing', 'gsd:debug');

      expect(result.primary.command).toBe('gsd:execute-phase');
      expect(result.context).toMatch(/returning to phase work/i);
    });

    it('gsd:quick with all plans done still suggests verify-work', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02'],
        summaryIds: ['39-01', '39-02'],
        planCount: 2,
        summaryCount: 2,
        unexecutedPlans: [],
        hasUat: false,
      });

      const result = deriveNextActions(artifacts, 'verifying', 'gsd:quick');

      expect(result.primary.command).toBe('gsd:verify-work');
      expect(result.context).toMatch(/returning to phase work/i);
    });
  });

  // --------------------------------------------------------------------------
  // Phase mutation post-actions
  // --------------------------------------------------------------------------

  describe('phase mutation commands (insert/add/remove)', () => {
    it('gsd:insert-phase suggests gsd:plan-phase', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01'],
        summaryIds: ['39-01'],
        planCount: 1,
        summaryCount: 1,
        unexecutedPlans: [],
      });

      const result = deriveNextActions(artifacts, 'executing', 'gsd:insert-phase');

      expect(result.primary.command).toBe('gsd:plan-phase');
      expect(result.context).toMatch(/newly inserted phase needs planning/i);
    });

    it('gsd:add-phase suggests gsd:plan-phase', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01'],
        summaryIds: [],
        planCount: 1,
        summaryCount: 0,
        unexecutedPlans: ['39-01'],
      });

      const result = deriveNextActions(artifacts, 'executing', 'gsd:add-phase');

      expect(result.primary.command).toBe('gsd:plan-phase');
      expect(result.context).toMatch(/newly added phase needs planning/i);
    });

    it('gsd:remove-phase returns standard artifact-derived suggestion', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02'],
        summaryIds: ['39-01'],
        planCount: 2,
        summaryCount: 1,
        unexecutedPlans: ['39-02'],
      });

      const result = deriveNextActions(artifacts, 'executing', 'gsd:remove-phase');

      // remove-phase is not a mutation override; uses standard artifact-derived
      expect(result.primary.command).toBe('gsd:execute-phase');
      expect(result.context).toMatch(/remove-phase/i);
    });
  });

  // --------------------------------------------------------------------------
  // UAT with gap closure plans
  // --------------------------------------------------------------------------

  describe('UAT with gap closure plans', () => {
    it('UAT exists but gap plans are unexecuted -> suggests execute-phase', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02', '39-04', '39-05'],
        summaryIds: ['39-01', '39-02'],
        planCount: 4,
        summaryCount: 2,
        unexecutedPlans: ['39-04', '39-05'],
        hasUat: true,
      });

      const result = deriveNextActions(artifacts, 'executing');

      expect(result.primary.command).toBe('gsd:execute-phase');
      expect(result.primary.clearContext).toBe(true);
      expect(result.context).toMatch(/gap/i);
    });

    it('UAT exists and ALL plans have summaries -> suggests next phase or audit', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02', '39-04'],
        summaryIds: ['39-01', '39-02', '39-04'],
        planCount: 3,
        summaryCount: 3,
        unexecutedPlans: [],
        hasUat: true,
      });

      const result = deriveNextActions(artifacts, 'verifying');

      // Phase fully complete, should suggest next phase or audit
      expect(['gsd:plan-phase', 'gsd:discuss-phase', 'gsd:audit-milestone']).toContain(result.primary.command);
      expect(result.context).toMatch(/complete|verified|done/i);
    });

    it('UAT exists, all plans done, with nextPhaseNumber -> suggests next phase', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02'],
        summaryIds: ['39-01', '39-02'],
        planCount: 2,
        summaryCount: 2,
        unexecutedPlans: [],
        hasUat: true,
      });

      const result = deriveNextActions(artifacts, 'verifying', undefined, '40');

      expect(result.primary.command).toBe('gsd:discuss-phase');
      expect(result.primary.args).toBe('40');
      expect(result.context).toMatch(/next phase|phase 40/i);
    });

    it('UAT exists, all plans done, no nextPhaseNumber -> suggests audit-milestone', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02'],
        summaryIds: ['39-01', '39-02'],
        planCount: 2,
        summaryCount: 2,
        unexecutedPlans: [],
        hasUat: true,
      });

      const result = deriveNextActions(artifacts, 'verifying', undefined, undefined);

      expect(result.primary.command).toBe('gsd:audit-milestone');
    });
  });

  // --------------------------------------------------------------------------
  // Formatting
  // --------------------------------------------------------------------------

  describe('formatting', () => {
    it('all context fields are non-empty human-readable sentences', () => {
      const scenarios: Array<{ artifacts: PhaseArtifacts; stage: LifecycleStage; cmd?: string; next?: string }> = [
        { artifacts: makeArtifacts(), stage: 'uninitialized' },
        { artifacts: makeArtifacts(), stage: 'initialized' },
        { artifacts: makeArtifacts(), stage: 'milestone-end' },
        { artifacts: makeArtifacts(), stage: 'between-phases' },
        {
          artifacts: makeArtifacts({
            planIds: ['39-01'], summaryIds: [], planCount: 1, summaryCount: 0, unexecutedPlans: ['39-01'],
          }),
          stage: 'executing',
          cmd: 'gsd:quick',
        },
        {
          artifacts: makeArtifacts({
            planIds: ['39-01'], planCount: 1, summaryCount: 0, unexecutedPlans: ['39-01'],
          }),
          stage: 'executing',
          cmd: 'gsd:insert-phase',
        },
      ];

      for (const s of scenarios) {
        const result = deriveNextActions(s.artifacts, s.stage, s.cmd, s.next);
        expect(result.context).toBeTruthy();
        expect(result.context.length).toBeGreaterThan(5);
      }
    });

    it('clearContext is true for execute-phase suggestions', () => {
      const artifacts = makeArtifacts({
        planIds: ['39-01', '39-02'],
        summaryIds: [],
        planCount: 2,
        summaryCount: 0,
        unexecutedPlans: ['39-01', '39-02'],
      });

      const result = deriveNextActions(artifacts, 'executing');

      expect(result.primary.command).toBe('gsd:execute-phase');
      expect(result.primary.clearContext).toBe(true);
    });

    it('clearContext is true for plan-phase suggestions', () => {
      const artifacts = makeArtifacts({
        planCount: 0,
        hasResearch: true,
      });

      const result = deriveNextActions(artifacts, 'roadmapped');

      expect(result.primary.command).toBe('gsd:plan-phase');
      expect(result.primary.clearContext).toBe(true);
    });
  });
});
