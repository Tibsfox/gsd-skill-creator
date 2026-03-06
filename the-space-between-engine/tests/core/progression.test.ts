import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNewLearner,
  loadState,
  saveState,
  navigateToFoundation,
  advancePhase,
  getCurrentPhase,
  markPhaseComplete,
  isPhaseComplete,
  isFoundationComplete,
  getCompletionPercentage,
  addCreation,
  addJournalEntry,
  recordUnitCircleMoment,
  recordTimeSpent,
  getTotalTimeSpent,
  suggestNextFoundation,
  getResumePoint,
} from '../../src/core/progression.js';
import type { FoundationId, PhaseType, LearnerState } from '../../src/types/index.js';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index.js';

describe('Progression Engine', () => {
  let state: LearnerState;

  beforeEach(() => {
    state = createNewLearner();
  });

  // ─── Lifecycle ──────────────────────────────────────

  describe('createNewLearner', () => {
    it('starts at unit-circle/wonder', () => {
      expect(state.currentFoundation).toBe('unit-circle');
      expect(state.currentPhase).toBe('wonder');
    });

    it('has no completed phases', () => {
      for (const id of FOUNDATION_ORDER) {
        expect(state.completedPhases[id]).toEqual([]);
      }
    });

    it('has empty collections', () => {
      expect(state.creations).toEqual([]);
      expect(state.journalEntries).toEqual([]);
      expect(state.unitCircleMoments).toEqual([]);
    });

    it('has zero time spent everywhere', () => {
      for (const id of FOUNDATION_ORDER) {
        expect(state.timeSpent[id]).toBe(0);
      }
    });

    it('has stateVersion 1', () => {
      expect(state.stateVersion).toBe(1);
    });

    it('has firstVisit and lastVisit set', () => {
      expect(state.firstVisit).toBeTruthy();
      expect(state.lastVisit).toBeTruthy();
    });
  });

  // ─── Serialization ─────────────────────────────────

  describe('saveState / loadState', () => {
    it('round-trips a state', () => {
      const serialized = saveState(state);
      const loaded = loadState(serialized);
      expect(loaded.currentFoundation).toBe(state.currentFoundation);
      expect(loaded.currentPhase).toBe(state.currentPhase);
      expect(loaded.stateVersion).toBe(state.stateVersion);
    });

    it('loadState rejects invalid JSON', () => {
      expect(() => loadState('not json')).toThrow();
    });

    it('loadState rejects missing fields', () => {
      expect(() => loadState('{}')).toThrow('Invalid learner state');
    });

    it('loadState rejects invalid foundation', () => {
      const bad = { ...state, currentFoundation: 'bogus' };
      expect(() => loadState(JSON.stringify(bad))).toThrow('Invalid foundation');
    });

    it('loadState rejects invalid phase', () => {
      const bad = { ...state, currentPhase: 'bogus' };
      expect(() => loadState(JSON.stringify(bad))).toThrow('Invalid phase');
    });
  });

  // ─── Immutability ──────────────────────────────────

  describe('immutability', () => {
    it('navigateToFoundation returns a new object', () => {
      const next = navigateToFoundation(state, 'pythagorean');
      expect(next).not.toBe(state);
      expect(state.currentFoundation).toBe('unit-circle'); // original unchanged
      expect(next.currentFoundation).toBe('pythagorean');
    });

    it('advancePhase returns a new object', () => {
      const next = advancePhase(state);
      expect(next).not.toBe(state);
      expect(state.currentPhase).toBe('wonder');
      expect(next.currentPhase).toBe('see');
    });

    it('markPhaseComplete returns a new object', () => {
      const next = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(next).not.toBe(state);
      expect(state.completedPhases['unit-circle']).toEqual([]);
      expect(next.completedPhases['unit-circle']).toContain('wonder');
    });

    it('addCreation returns a new object', () => {
      const next = addCreation(state, {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'Test Art',
        data: '{}',
        shared: false,
      });
      expect(next).not.toBe(state);
      expect(state.creations).toHaveLength(0);
      expect(next.creations).toHaveLength(1);
    });

    it('stateVersion increments on every mutation', () => {
      const s1 = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(s1.stateVersion).toBe(2);
      const s2 = advancePhase(s1);
      expect(s2.stateVersion).toBe(3);
    });
  });

  // ─── Navigation ─────────────────────────────────────

  describe('navigateToFoundation', () => {
    it('navigates to specified foundation', () => {
      const next = navigateToFoundation(state, 'trigonometry');
      expect(next.currentFoundation).toBe('trigonometry');
      expect(next.currentPhase).toBe('wonder'); // first phase since nothing complete
    });

    it('resumes at earliest incomplete phase when some phases are complete', () => {
      let s = markPhaseComplete(state, 'trigonometry', 'wonder');
      s = markPhaseComplete(s, 'trigonometry', 'see');
      const next = navigateToFoundation(s, 'trigonometry');
      expect(next.currentPhase).toBe('touch');
    });

    it('throws for invalid foundation', () => {
      expect(() => navigateToFoundation(state, 'bogus' as FoundationId)).toThrow('Invalid foundation');
    });
  });

  describe('advancePhase', () => {
    it('moves to the next phase', () => {
      const next = advancePhase(state);
      expect(next.currentPhase).toBe('see');
    });

    it('moves to next foundation when at last phase', () => {
      let s = state;
      s = { ...s, currentPhase: 'create' as PhaseType };
      // Force via clone
      s = JSON.parse(JSON.stringify(s));
      const next = advancePhase(s);
      expect(next.currentFoundation).toBe('pythagorean');
    });

    it('stays at last phase of last foundation', () => {
      let s = state;
      s = { ...s, currentFoundation: 'l-systems' as FoundationId, currentPhase: 'create' as PhaseType };
      s = JSON.parse(JSON.stringify(s));
      const next = advancePhase(s);
      expect(next.currentFoundation).toBe('l-systems');
      expect(next.currentPhase).toBe('create');
    });
  });

  describe('getCurrentPhase', () => {
    it('returns current foundation and phase', () => {
      const current = getCurrentPhase(state);
      expect(current).toEqual({ foundation: 'unit-circle', phase: 'wonder' });
    });
  });

  // ─── Phase completion ──────────────────────────────

  describe('markPhaseComplete', () => {
    it('marks a phase as complete', () => {
      const next = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(isPhaseComplete(next, 'unit-circle', 'wonder')).toBe(true);
    });

    it('is idempotent — marking complete phase again is a no-op', () => {
      const s1 = markPhaseComplete(state, 'unit-circle', 'wonder');
      const s2 = markPhaseComplete(s1, 'unit-circle', 'wonder');
      expect(s2.completedPhases['unit-circle']).toEqual(['wonder']);
    });

    it('enforces phase ordering — cannot skip wonder', () => {
      expect(() => markPhaseComplete(state, 'unit-circle', 'see')).toThrow(
        "Cannot complete phase 'see'",
      );
    });

    it('enforces phase ordering — cannot skip to understand', () => {
      const s = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(() => markPhaseComplete(s, 'unit-circle', 'understand')).toThrow(
        "Cannot complete phase 'understand'",
      );
    });

    it('allows completing phases in order', () => {
      let s = state;
      for (const phase of PHASE_ORDER) {
        s = markPhaseComplete(s, 'unit-circle', phase);
        expect(isPhaseComplete(s, 'unit-circle', phase)).toBe(true);
      }
    });
  });

  describe('isPhaseComplete', () => {
    it('returns false for incomplete phase', () => {
      expect(isPhaseComplete(state, 'unit-circle', 'wonder')).toBe(false);
    });

    it('returns true after marking complete', () => {
      const next = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(isPhaseComplete(next, 'unit-circle', 'wonder')).toBe(true);
    });
  });

  describe('isFoundationComplete', () => {
    it('returns false when no phases complete', () => {
      expect(isFoundationComplete(state, 'unit-circle')).toBe(false);
    });

    it('returns false when only some phases complete', () => {
      const s = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(isFoundationComplete(s, 'unit-circle')).toBe(false);
    });

    it('returns true when all 6 phases are complete', () => {
      let s = state;
      for (const phase of PHASE_ORDER) {
        s = markPhaseComplete(s, 'unit-circle', phase);
      }
      expect(isFoundationComplete(s, 'unit-circle')).toBe(true);
    });
  });

  describe('getCompletionPercentage', () => {
    it('returns 0 for a new learner', () => {
      expect(getCompletionPercentage(state)).toBe(0);
    });

    it('returns correct percentage for partial completion', () => {
      // 1 phase out of 48 total = ~2%
      const s = markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(getCompletionPercentage(s)).toBe(Math.round((1 / 48) * 100));
    });

    it('returns 100 for all foundations complete', () => {
      let s = state;
      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          s = markPhaseComplete(s, id, phase);
        }
      }
      expect(getCompletionPercentage(s)).toBe(100);
    });

    it('returns 50 for half complete', () => {
      let s = state;
      // Complete first 4 foundations (4 * 6 = 24 out of 48)
      for (const id of FOUNDATION_ORDER.slice(0, 4)) {
        for (const phase of PHASE_ORDER) {
          s = markPhaseComplete(s, id, phase);
        }
      }
      expect(getCompletionPercentage(s)).toBe(50);
    });
  });

  // ─── Creations & journal ────────────────────────────

  describe('addCreation', () => {
    it('adds a creation with generated id and timestamp', () => {
      const next = addCreation(state, {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'My Circle Art',
        data: '{}',
        shared: false,
      });
      expect(next.creations).toHaveLength(1);
      expect(next.creations[0].id).toBeTruthy();
      expect(next.creations[0].createdAt).toBeTruthy();
      expect(next.creations[0].title).toBe('My Circle Art');
    });
  });

  describe('addJournalEntry', () => {
    it('adds a journal entry', () => {
      const next = addJournalEntry(state, {
        text: 'I wonder about circles',
        foundationId: 'unit-circle',
      });
      expect(next.journalEntries).toHaveLength(1);
      expect(next.journalEntries[0].text).toBe('I wonder about circles');
      expect(next.journalEntries[0].id).toBeTruthy();
    });
  });

  describe('recordUnitCircleMoment', () => {
    it('records a moment with foundations and insight', () => {
      const next = recordUnitCircleMoment(
        state,
        ['unit-circle', 'trigonometry'],
        'Sine IS the unit circle in motion!',
      );
      expect(next.unitCircleMoments).toHaveLength(1);
      expect(next.unitCircleMoments[0].foundations).toEqual(['unit-circle', 'trigonometry']);
      expect(next.unitCircleMoments[0].insight).toBe('Sine IS the unit circle in motion!');
    });
  });

  // ─── Time tracking ─────────────────────────────────

  describe('recordTimeSpent', () => {
    it('adds time for a foundation', () => {
      const next = recordTimeSpent(state, 'unit-circle', 5000);
      expect(next.timeSpent['unit-circle']).toBe(5000);
    });

    it('accumulates time across calls', () => {
      const s1 = recordTimeSpent(state, 'unit-circle', 5000);
      const s2 = recordTimeSpent(s1, 'unit-circle', 3000);
      expect(s2.timeSpent['unit-circle']).toBe(8000);
    });
  });

  describe('getTotalTimeSpent', () => {
    it('returns 0 for a new learner', () => {
      expect(getTotalTimeSpent(state)).toBe(0);
    });

    it('sums time across all foundations', () => {
      let s = recordTimeSpent(state, 'unit-circle', 5000);
      s = recordTimeSpent(s, 'pythagorean', 3000);
      s = recordTimeSpent(s, 'trigonometry', 2000);
      expect(getTotalTimeSpent(s)).toBe(10000);
    });
  });

  // ─── Suggestions & resume ──────────────────────────

  describe('suggestNextFoundation', () => {
    it('suggests current foundation when nothing is complete', () => {
      const suggestion = suggestNextFoundation(state);
      expect(suggestion).toBe('unit-circle');
    });

    it('suggests next foundation after completing one', () => {
      let s = state;
      for (const phase of PHASE_ORDER) {
        s = markPhaseComplete(s, 'unit-circle', phase);
      }
      const suggestion = suggestNextFoundation(s);
      // Should suggest something that is connected from unit-circle
      expect(FOUNDATION_ORDER).toContain(suggestion);
      expect(suggestion).not.toBe('unit-circle'); // unit-circle is complete
    });

    it('returns current foundation when everything is complete', () => {
      let s = state;
      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          s = markPhaseComplete(s, id, phase);
        }
      }
      const suggestion = suggestNextFoundation(s);
      expect(suggestion).toBe(s.currentFoundation);
    });

    it('favors strongly-connected foundations', () => {
      // Complete unit-circle -> should suggest trigonometry (strength 1.0 cross)
      // or pythagorean (strength 1.0 sequential)
      let s = state;
      for (const phase of PHASE_ORDER) {
        s = markPhaseComplete(s, 'unit-circle', phase);
      }
      const suggestion = suggestNextFoundation(s);
      // Both pythagorean and trigonometry have connections from unit-circle
      expect(['pythagorean', 'trigonometry']).toContain(suggestion);
    });
  });

  describe('getResumePoint', () => {
    it('returns wonder for a new learner', () => {
      const resume = getResumePoint(state);
      expect(resume).toEqual({ foundation: 'unit-circle', phase: 'wonder' });
    });

    it('returns next incomplete phase', () => {
      let s = markPhaseComplete(state, 'unit-circle', 'wonder');
      s = markPhaseComplete(s, 'unit-circle', 'see');
      const resume = getResumePoint(s);
      expect(resume).toEqual({ foundation: 'unit-circle', phase: 'touch' });
    });

    it('respects current foundation', () => {
      const s = navigateToFoundation(state, 'trigonometry');
      const resume = getResumePoint(s);
      expect(resume.foundation).toBe('trigonometry');
      expect(resume.phase).toBe('wonder');
    });
  });
});
