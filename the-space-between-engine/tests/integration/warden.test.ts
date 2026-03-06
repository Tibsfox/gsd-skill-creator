import { describe, it, expect } from 'vitest';
import {
  checkAccess,
  getMode,
  isWonderComplete,
  isSeeComplete,
  isTouchComplete,
  recordBypass,
  getBypassCount,
} from '@/integration/warden';
import { createNewLearner, markPhaseComplete } from '@/core/progression';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types';
import type { FoundationId, PhaseType } from '@/types';

// ─── Helper ──────────────────────────────────────────

function learnerWith(phases: Partial<Record<FoundationId, PhaseType[]>>) {
  let state = createNewLearner();
  for (const [foundationId, phaseList] of Object.entries(phases)) {
    for (const phase of phaseList as PhaseType[]) {
      state = markPhaseComplete(state, foundationId as FoundationId, phase);
    }
  }
  return state;
}

// ─── Warden Rules Matrix ─────────────────────────────

describe('Wonder Warden', () => {
  describe('Wonder phase — always allowed', () => {
    it('should allow wonder with no prior completion', () => {
      const state = createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        const decision = checkAccess(state, id, 'wonder');
        expect(decision.allowed).toBe(true);
      }
    });
  });

  describe('See phase — requires wonder (soft)', () => {
    it('should annotate when wonder is not complete', () => {
      const state = createNewLearner();
      const decision = checkAccess(state, 'unit-circle', 'see');
      expect(decision.allowed).toBe(true);
      expect(decision.mode).toBe('annotate');
      expect(decision.reason).toContain('wonder');
    });

    it('should allow when wonder is complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder'] });
      const decision = checkAccess(state, 'unit-circle', 'see');
      expect(decision.allowed).toBe(true);
    });
  });

  describe('Touch phase — requires see (soft)', () => {
    it('should annotate when see is not complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder'] });
      const decision = checkAccess(state, 'unit-circle', 'touch');
      expect(decision.allowed).toBe(true);
      expect(decision.mode).toBe('annotate');
      expect(decision.reason).toContain('visually');
    });

    it('should allow when see is complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see'] });
      const decision = checkAccess(state, 'unit-circle', 'touch');
      expect(decision.allowed).toBe(true);
    });
  });

  describe('Understand phase — requires wonder + see + touch (gate)', () => {
    it('should block when prerequisites are missing', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see'] });
      const decision = checkAccess(state, 'unit-circle', 'understand');
      expect(decision.allowed).toBe(false);
      expect(decision.mode).toBe('gate');
      expect(decision.reason).toContain('Formal notation');
    });

    it('should block when only wonder is complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder'] });
      const decision = checkAccess(state, 'unit-circle', 'understand');
      expect(decision.allowed).toBe(false);
      expect(decision.mode).toBe('gate');
    });

    it('should allow when wonder + see + touch are all complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see', 'touch'] });
      const decision = checkAccess(state, 'unit-circle', 'understand');
      expect(decision.allowed).toBe(true);
    });

    it('should provide a suggestion when blocking', () => {
      const state = createNewLearner();
      const decision = checkAccess(state, 'unit-circle', 'understand');
      expect(decision.allowed).toBe(false);
      expect(decision.suggestion).toBeTruthy();
    });
  });

  describe('Connect phase — requires understand (soft)', () => {
    it('should annotate when understand is not complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see', 'touch'] });
      const decision = checkAccess(state, 'unit-circle', 'connect');
      expect(decision.allowed).toBe(true);
      expect(decision.mode).toBe('annotate');
      expect(decision.reason).toContain('Connections');
    });

    it('should allow when understand is complete', () => {
      const state = learnerWith({
        'unit-circle': ['wonder', 'see', 'touch', 'understand'],
      });
      const decision = checkAccess(state, 'unit-circle', 'connect');
      expect(decision.allowed).toBe(true);
    });
  });

  describe('Create phase — requires touch (soft)', () => {
    it('should annotate when touch is not complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see'] });
      const decision = checkAccess(state, 'unit-circle', 'create');
      expect(decision.allowed).toBe(true);
      expect(decision.mode).toBe('annotate');
      expect(decision.reason).toContain('Creating');
    });

    it('should allow when touch is complete', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see', 'touch'] });
      const decision = checkAccess(state, 'unit-circle', 'create');
      expect(decision.allowed).toBe(true);
    });
  });

  // ─── Inter-wing navigation ──────────────────────────

  describe('Inter-wing navigation is NEVER gated', () => {
    it('should allow wonder phase on any foundation regardless of other wings', () => {
      const state = createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        const decision = checkAccess(state, id, 'wonder');
        expect(decision.allowed).toBe(true);
      }
    });

    it('should apply warden rules per-foundation independently', () => {
      // Complete unit-circle wonder, check pythagorean see still works (annotate)
      const state = learnerWith({ 'unit-circle': ['wonder'] });
      const decision = checkAccess(state, 'pythagorean', 'see');
      // pythagorean wonder is NOT complete, so see is annotated
      expect(decision.allowed).toBe(true);
      expect(decision.mode).toBe('annotate');
    });

    it('completing phases in one wing does not affect another wing', () => {
      const state = learnerWith({
        'unit-circle': ['wonder', 'see', 'touch'],
      });
      // pythagorean understand should still be gated (pythagorean has no phases complete)
      const decision = checkAccess(state, 'pythagorean', 'understand');
      expect(decision.allowed).toBe(false);
      expect(decision.mode).toBe('gate');
    });
  });

  // ─── Warden mode ────────────────────────────────────

  describe('getMode', () => {
    it('should return annotate for wonder', () => {
      expect(getMode('unit-circle', 'wonder')).toBe('annotate');
    });

    it('should return annotate for see', () => {
      expect(getMode('unit-circle', 'see')).toBe('annotate');
    });

    it('should return annotate for touch', () => {
      expect(getMode('unit-circle', 'touch')).toBe('annotate');
    });

    it('should return gate for understand', () => {
      expect(getMode('unit-circle', 'understand')).toBe('gate');
    });

    it('should return annotate for connect', () => {
      expect(getMode('unit-circle', 'connect')).toBe('annotate');
    });

    it('should return annotate for create', () => {
      expect(getMode('unit-circle', 'create')).toBe('annotate');
    });
  });

  // ─── Phase completion checks ────────────────────────

  describe('Phase completion checks', () => {
    it('isWonderComplete returns false for new learner', () => {
      const state = createNewLearner();
      expect(isWonderComplete(state, 'unit-circle')).toBe(false);
    });

    it('isWonderComplete returns true after completing wonder', () => {
      const state = learnerWith({ 'unit-circle': ['wonder'] });
      expect(isWonderComplete(state, 'unit-circle')).toBe(true);
    });

    it('isSeeComplete returns false when only wonder is done', () => {
      const state = learnerWith({ 'unit-circle': ['wonder'] });
      expect(isSeeComplete(state, 'unit-circle')).toBe(false);
    });

    it('isSeeComplete returns true after completing see', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see'] });
      expect(isSeeComplete(state, 'unit-circle')).toBe(true);
    });

    it('isTouchComplete returns true after completing touch', () => {
      const state = learnerWith({ 'unit-circle': ['wonder', 'see', 'touch'] });
      expect(isTouchComplete(state, 'unit-circle')).toBe(true);
    });
  });

  // ─── Bypass tracking ───────────────────────────────

  describe('Bypass tracking', () => {
    it('new learner has 0 bypasses', () => {
      const state = createNewLearner();
      expect(getBypassCount(state)).toBe(0);
    });

    it('recordBypass increments bypass count', () => {
      const state = createNewLearner();
      const next = recordBypass(state, 'unit-circle', 'see');
      expect(getBypassCount(next)).toBe(1);
    });

    it('recordBypass increments version', () => {
      const state = createNewLearner();
      const next = recordBypass(state, 'unit-circle', 'see');
      expect(next.stateVersion).toBe(state.stateVersion + 1);
    });

    it('multiple bypasses accumulate', () => {
      let state = createNewLearner();
      state = recordBypass(state, 'unit-circle', 'see');
      state = recordBypass(state, 'pythagorean', 'touch');
      state = recordBypass(state, 'unit-circle', 'see'); // same phase again
      expect(getBypassCount(state)).toBe(3);
    });

    it('recordBypass does not mutate original state', () => {
      const state = createNewLearner();
      const next = recordBypass(state, 'unit-circle', 'see');
      expect(getBypassCount(state)).toBe(0);
      expect(getBypassCount(next)).toBe(1);
    });
  });

  // ─── Non-punitive messaging ─────────────────────────

  describe('Non-punitive messaging', () => {
    it('warden messages should be warm and encouraging', () => {
      const state = createNewLearner();
      const negativePatterns = [
        /\byou must\b/i,
        /\byou cannot\b/i,
        /\bforbidden\b/i,
        /\bdenied\b/i,
        /\berror\b/i,
        /\bfailure\b/i,
        /\bwrong\b/i,
        /\bnot allowed\b/i,
      ];

      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          const decision = checkAccess(state, id, phase);
          for (const pattern of negativePatterns) {
            expect(
              pattern.test(decision.reason),
              `Warden message for ${id}/${phase} contains punitive language: "${decision.reason}"`,
            ).toBe(false);
            if (decision.suggestion) {
              expect(
                pattern.test(decision.suggestion),
                `Warden suggestion for ${id}/${phase} contains punitive language: "${decision.suggestion}"`,
              ).toBe(false);
            }
          }
        }
      }
    });
  });
});
