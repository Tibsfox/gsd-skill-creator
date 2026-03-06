import { describe, it, expect } from 'vitest';
import { WonderWarden } from '../../src/integration/warden';
import { createDefaultGraph } from '../../src/core/connections';
import { ProgressionEngine } from '../../src/core/progression';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index';
import type { FoundationId, PhaseType, LearnerState } from '../../src/types/index';

describe('WonderWarden — Safety-Critical Tests', () => {
  const graph = createDefaultGraph();
  const warden = new WonderWarden(graph);
  const engine = new ProgressionEngine();

  /**
   * Helper: create a learner state with specific phases completed for a foundation.
   */
  function stateWith(completions: Partial<Record<FoundationId, PhaseType[]>>): LearnerState {
    const state = engine.createNewLearner();
    for (const [foundation, phases] of Object.entries(completions)) {
      state.completedPhases[foundation as FoundationId] = [...(phases as PhaseType[])];
    }
    return state;
  }

  // ── SC-02: Cannot access UnderstandPhase without WonderPhase completion ──

  describe('SC-02: Understand requires Wonder', () => {
    it('gates understand when wonder is not complete', () => {
      for (const foundation of FOUNDATION_ORDER) {
        // State with see + touch complete but NOT wonder
        const state = stateWith({ [foundation]: ['see', 'touch'] });
        const decision = warden.checkAccess(state, foundation, 'understand');
        expect(decision.allowed).toBe(false);
        expect(decision.mode).toBe('gate');
      }
    });
  });

  // ── SC-03: Cannot access UnderstandPhase without SeePhase completion ──

  describe('SC-03: Understand requires See', () => {
    it('gates understand when see is not complete', () => {
      for (const foundation of FOUNDATION_ORDER) {
        const state = stateWith({ [foundation]: ['wonder', 'touch'] });
        const decision = warden.checkAccess(state, foundation, 'understand');
        expect(decision.allowed).toBe(false);
        expect(decision.mode).toBe('gate');
      }
    });
  });

  // ── SC-04: Cannot access UnderstandPhase without TouchPhase completion ──

  describe('SC-04: Understand requires Touch', () => {
    it('gates understand when touch is not complete', () => {
      for (const foundation of FOUNDATION_ORDER) {
        const state = stateWith({ [foundation]: ['wonder', 'see'] });
        const decision = warden.checkAccess(state, foundation, 'understand');
        expect(decision.allowed).toBe(false);
        expect(decision.mode).toBe('gate');
      }
    });
  });

  // ── SC-05: Inter-wing navigation NEVER blocked ──

  describe('SC-05: Inter-wing navigation never blocked', () => {
    it('allows navigation from any foundation to any other foundation wonder phase', () => {
      const state = engine.createNewLearner();

      for (const from of FOUNDATION_ORDER) {
        for (const to of FOUNDATION_ORDER) {
          if (from === to) continue;
          // Navigating to a different foundation's wonder phase is always allowed
          const decision = warden.checkAccess(state, to, 'wonder');
          expect(decision.allowed).toBe(true);
        }
      }
    });

    it('warden returns allowed=true for wing changes (wonder phase entry)', () => {
      // Even a brand-new learner can jump to any foundation's wonder
      const state = engine.createNewLearner();
      for (const foundation of FOUNDATION_ORDER) {
        const decision = warden.checkAccess(state, foundation, 'wonder');
        expect(decision.allowed).toBe(true);
      }
    });
  });

  // ── SC-06: Bypass mechanism exists ──

  describe('SC-06: Bypass mechanism exists', () => {
    it('recordBypass creates a bypass entry in the state', () => {
      const state = engine.createNewLearner();
      const updated = warden.recordBypass(state, 'unit-circle', 'understand');
      expect(warden.hasBypassed(updated, 'unit-circle', 'understand')).toBe(true);
    });

    it('a determined learner can bypass the understand gate', () => {
      // Learner has only wonder complete, bypasses to understand
      const state = stateWith({ 'unit-circle': ['wonder'] });
      const updated = warden.recordBypass(state, 'unit-circle', 'understand');
      const decision = warden.checkAccess(updated, 'unit-circle', 'understand');
      expect(decision.allowed).toBe(true);
    });
  });

  // ── SC-07: Bypass tracked — each bypass increments counter ──

  describe('SC-07: Bypass tracking increments counter', () => {
    it('getBypassCount increases with each new bypass', () => {
      let state = engine.createNewLearner();
      expect(warden.getBypassCount(state)).toBe(0);

      state = warden.recordBypass(state, 'unit-circle', 'understand');
      expect(warden.getBypassCount(state)).toBe(1);

      state = warden.recordBypass(state, 'pythagorean', 'understand');
      expect(warden.getBypassCount(state)).toBe(2);

      state = warden.recordBypass(state, 'trigonometry', 'see');
      expect(warden.getBypassCount(state)).toBe(3);
    });

    it('duplicate bypasses do not double-count', () => {
      let state = engine.createNewLearner();
      state = warden.recordBypass(state, 'unit-circle', 'understand');
      state = warden.recordBypass(state, 'unit-circle', 'understand');
      expect(warden.getBypassCount(state)).toBe(1);
    });
  });

  // ── SC-08: Warden messages contain NONE of the forbidden words ──

  describe('SC-08: Warden messages contain no shaming language', () => {
    const FORBIDDEN_PHRASES = [
      'wrong',
      'failed',
      'behind',
      'slow',
      'should have',
      'Try something easier',
    ];

    it('checkAccess messages never contain forbidden phrases', () => {
      for (const foundation of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          // Test with empty state (maximally unqualified)
          const emptyState = engine.createNewLearner();
          const decision = warden.checkAccess(emptyState, foundation, phase);

          for (const phrase of FORBIDDEN_PHRASES) {
            expect(decision.reason.toLowerCase()).not.toContain(phrase.toLowerCase());
          }

          // Test with partial state
          const partialState = stateWith({ [foundation]: ['wonder'] });
          const partialDecision = warden.checkAccess(partialState, foundation, phase);

          for (const phrase of FORBIDDEN_PHRASES) {
            expect(partialDecision.reason.toLowerCase()).not.toContain(phrase.toLowerCase());
          }
        }
      }
    });

    it('shelter option descriptions never contain forbidden phrases', () => {
      for (const foundation of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          const state = engine.createNewLearner();
          const options = warden.getShelterOptions(state, foundation, phase);

          for (const option of options) {
            for (const phrase of FORBIDDEN_PHRASES) {
              expect(option.description.toLowerCase()).not.toContain(phrase.toLowerCase());
            }
          }
        }
      }
    });
  });

  // ── SC-19: Shelter NEVER triggers on first visit ──

  describe('SC-19: Shelter never triggers on first visit', () => {
    it('detectStuck returns false for first visit (time=0, visits=1)', () => {
      const state = engine.createNewLearner();
      for (const foundation of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          // First visit: 0ms spent, 1 visit
          const stuck = warden.detectStuck(state, foundation, phase, 0, 1);
          expect(stuck).toBe(false);
        }
      }
    });

    it('detectStuck returns false for short time and low visit count', () => {
      const state = engine.createNewLearner();
      // 60 seconds, 2 visits — not stuck
      const stuck = warden.detectStuck(state, 'unit-circle', 'wonder', 60000, 2);
      expect(stuck).toBe(false);
    });

    it('detectStuck returns true only after threshold (>300s or >=3 visits)', () => {
      const state = engine.createNewLearner();

      // Over 5 minutes
      expect(warden.detectStuck(state, 'unit-circle', 'wonder', 300001, 1)).toBe(true);

      // 3 visits
      expect(warden.detectStuck(state, 'unit-circle', 'wonder', 1000, 3)).toBe(true);
    });
  });

  // ── SC-21: After bypass recorded, subsequent checkAccess returns allowed ──

  describe('SC-21: Bypass persistence', () => {
    it('after bypass for (foundation, phase), checkAccess returns allowed=true', () => {
      for (const foundation of FOUNDATION_ORDER) {
        // Start with empty state — understand is gated
        let state = engine.createNewLearner();
        const beforeBypass = warden.checkAccess(state, foundation, 'understand');
        expect(beforeBypass.allowed).toBe(false);

        // Record bypass
        state = warden.recordBypass(state, foundation, 'understand');

        // Now it should be allowed
        const afterBypass = warden.checkAccess(state, foundation, 'understand');
        expect(afterBypass.allowed).toBe(true);
      }
    });

    it('bypass for one foundation does not affect another foundation', () => {
      let state = engine.createNewLearner();
      state = warden.recordBypass(state, 'unit-circle', 'understand');

      // unit-circle is bypassed
      expect(warden.checkAccess(state, 'unit-circle', 'understand').allowed).toBe(true);

      // pythagorean is NOT bypassed
      expect(warden.checkAccess(state, 'pythagorean', 'understand').allowed).toBe(false);
    });
  });
});
