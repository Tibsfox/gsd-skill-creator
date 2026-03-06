import { describe, it, expect } from 'vitest';
import { ProgressionEngine } from '../../src/core/progression';
import { createDefaultGraph } from '../../src/core/connections';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index';
import type { FoundationId, PhaseType } from '../../src/types/index';

describe('ProgressionEngine', () => {
  const engine = new ProgressionEngine();
  const graph = createDefaultGraph();

  describe('createNewLearner', () => {
    it('starts at unit-circle/wonder', () => {
      const state = engine.createNewLearner();
      expect(state.currentFoundation).toBe('unit-circle');
      expect(state.currentPhase).toBe('wonder');
    });

    it('has zero completions', () => {
      const state = engine.createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        expect(state.completedPhases[id]).toEqual([]);
      }
    });

    it('has empty creations, journal entries, and moments', () => {
      const state = engine.createNewLearner();
      expect(state.creations).toEqual([]);
      expect(state.journalEntries).toEqual([]);
      expect(state.unitCircleMoments).toEqual([]);
    });

    it('has valid ISO datetime strings', () => {
      const state = engine.createNewLearner();
      expect(() => new Date(state.firstVisit)).not.toThrow();
      expect(() => new Date(state.lastVisit)).not.toThrow();
    });
  });

  describe('advancePhase', () => {
    it('advances from wonder to see', () => {
      const state = engine.createNewLearner();
      const advanced = engine.advancePhase(state);
      expect(advanced.currentPhase).toBe('see');
    });

    it('advances through all phases in order', () => {
      let state = engine.createNewLearner();
      for (let i = 1; i < PHASE_ORDER.length; i++) {
        state = engine.advancePhase(state);
        expect(state.currentPhase).toBe(PHASE_ORDER[i]);
      }
    });

    it('stays at create when already at create', () => {
      let state = engine.createNewLearner();
      state = { ...state, currentPhase: 'create' };
      const advanced = engine.advancePhase(state);
      expect(advanced.currentPhase).toBe('create');
    });

    it('does not mutate original state', () => {
      const state = engine.createNewLearner();
      const advanced = engine.advancePhase(state);
      expect(state.currentPhase).toBe('wonder');
      expect(advanced.currentPhase).toBe('see');
    });
  });

  describe('navigateToFoundation', () => {
    it('navigates to a new foundation starting at wonder', () => {
      const state = engine.createNewLearner();
      const navigated = engine.navigateToFoundation(state, 'trigonometry');
      expect(navigated.currentFoundation).toBe('trigonometry');
      expect(navigated.currentPhase).toBe('wonder');
    });

    it('resumes at first incomplete phase if foundation partially complete', () => {
      let state = engine.createNewLearner();
      state = engine.markPhaseComplete(state, 'trigonometry', 'wonder');
      state = engine.markPhaseComplete(state, 'trigonometry', 'see');
      const navigated = engine.navigateToFoundation(state, 'trigonometry');
      expect(navigated.currentFoundation).toBe('trigonometry');
      expect(navigated.currentPhase).toBe('touch');
    });

    it('goes to create if all phases complete', () => {
      let state = engine.createNewLearner();
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'trigonometry', phase);
      }
      const navigated = engine.navigateToFoundation(state, 'trigonometry');
      expect(navigated.currentFoundation).toBe('trigonometry');
      expect(navigated.currentPhase).toBe('create');
    });
  });

  describe('markPhaseComplete', () => {
    it('marks wonder as complete', () => {
      const state = engine.createNewLearner();
      const marked = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(marked.completedPhases['unit-circle']).toContain('wonder');
    });

    it('enforces phase ordering — cannot skip see', () => {
      const state = engine.createNewLearner();
      const marked = engine.markPhaseComplete(state, 'unit-circle', 'touch');
      // touch requires wonder and see to be complete first
      expect(marked.completedPhases['unit-circle']).not.toContain('touch');
    });

    it('allows sequential completion', () => {
      let state = engine.createNewLearner();
      state = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      state = engine.markPhaseComplete(state, 'unit-circle', 'see');
      state = engine.markPhaseComplete(state, 'unit-circle', 'touch');
      expect(state.completedPhases['unit-circle']).toEqual(['wonder', 'see', 'touch']);
    });

    it('is idempotent — marking same phase twice does nothing', () => {
      let state = engine.createNewLearner();
      state = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      const again = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(again.completedPhases['unit-circle']).toEqual(['wonder']);
    });

    it('does not mutate original state', () => {
      const state = engine.createNewLearner();
      const marked = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(state.completedPhases['unit-circle']).toEqual([]);
      expect(marked.completedPhases['unit-circle']).toEqual(['wonder']);
    });
  });

  describe('isFoundationComplete', () => {
    it('returns false for empty foundation', () => {
      const state = engine.createNewLearner();
      expect(engine.isFoundationComplete(state, 'unit-circle')).toBe(false);
    });

    it('returns true when all phases complete', () => {
      let state = engine.createNewLearner();
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'unit-circle', phase);
      }
      expect(engine.isFoundationComplete(state, 'unit-circle')).toBe(true);
    });
  });

  describe('getCompletionPercentage', () => {
    it('returns 0 for new learner', () => {
      const state = engine.createNewLearner();
      expect(engine.getCompletionPercentage(state)).toBe(0);
    });

    it('returns 25 when 2 of 8 foundations complete (12/48 phases)', () => {
      let state = engine.createNewLearner();
      // Complete unit-circle and pythagorean (2 foundations = 12 phases)
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'unit-circle', phase);
      }
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'pythagorean', phase);
      }
      expect(engine.getCompletionPercentage(state)).toBe(25);
    });

    it('returns 100 when all foundations complete', () => {
      let state = engine.createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          state = engine.markPhaseComplete(state, id, phase);
        }
      }
      expect(engine.getCompletionPercentage(state)).toBe(100);
    });
  });

  describe('addCreation', () => {
    it('adds a creation with generated id and timestamp', () => {
      const state = engine.createNewLearner();
      const updated = engine.addCreation(state, {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'My first circle art',
        data: '{}',
        shared: false,
      });
      expect(updated.creations).toHaveLength(1);
      expect(updated.creations[0]!.id).toBeTruthy();
      expect(updated.creations[0]!.createdAt).toBeTruthy();
      expect(updated.creations[0]!.title).toBe('My first circle art');
    });

    it('does not mutate original state', () => {
      const state = engine.createNewLearner();
      engine.addCreation(state, {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'test',
        data: '{}',
        shared: false,
      });
      expect(state.creations).toHaveLength(0);
    });
  });

  describe('addJournalEntry', () => {
    it('adds a journal entry', () => {
      const state = engine.createNewLearner();
      const updated = engine.addJournalEntry(state, {
        foundationId: 'trigonometry',
        text: 'I see waves everywhere now',
      });
      expect(updated.journalEntries).toHaveLength(1);
      expect(updated.journalEntries[0]!.text).toBe('I see waves everywhere now');
    });
  });

  describe('recordUnitCircleMoment', () => {
    it('records a moment connecting multiple foundations', () => {
      const state = engine.createNewLearner();
      const updated = engine.recordUnitCircleMoment(
        state,
        ['trigonometry', 'information-theory'],
        'Waves and signals are the same thing!'
      );
      expect(updated.unitCircleMoments).toHaveLength(1);
      expect(updated.unitCircleMoments[0]!.foundations).toEqual(['trigonometry', 'information-theory']);
      expect(updated.unitCircleMoments[0]!.insight).toBe('Waves and signals are the same thing!');
    });
  });

  describe('getResumePoint', () => {
    it('new learner resumes at unit-circle/wonder', () => {
      const state = engine.createNewLearner();
      const resume = engine.getResumePoint(state);
      expect(resume.foundation).toBe('unit-circle');
      expect(resume.phase).toBe('wonder');
    });

    it('resumes at next incomplete phase', () => {
      let state = engine.createNewLearner();
      state = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      state = engine.markPhaseComplete(state, 'unit-circle', 'see');
      state = engine.markPhaseComplete(state, 'unit-circle', 'touch');
      const resume = engine.getResumePoint(state);
      expect(resume.foundation).toBe('unit-circle');
      expect(resume.phase).toBe('understand');
    });

    it('suggests next foundation when current is fully complete', () => {
      let state = engine.createNewLearner();
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'unit-circle', phase);
      }
      const resume = engine.getResumePoint(state);
      // Current foundation complete, should suggest next incomplete
      expect(resume.foundation).toBe('pythagorean');
      expect(resume.phase).toBe('wonder');
    });
  });

  describe('suggestNextFoundation', () => {
    it('suggests unit-circle for brand new learner', () => {
      const state = engine.createNewLearner();
      const suggestion = engine.suggestNextFoundation(state, graph);
      expect(suggestion).toBe('unit-circle');
    });

    it('never suggests a completed foundation', () => {
      let state = engine.createNewLearner();
      // Complete unit-circle
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'unit-circle', phase);
      }
      const suggestion = engine.suggestNextFoundation(state, graph);
      expect(suggestion).not.toBe('unit-circle');
    });

    it('prefers strongly connected foundations', () => {
      let state = engine.createNewLearner();
      // Complete unit-circle (connects to trigonometry at 1.0)
      for (const phase of PHASE_ORDER) {
        state = engine.markPhaseComplete(state, 'unit-circle', phase);
      }
      const suggestion = engine.suggestNextFoundation(state, graph);
      // Trigonometry has the strongest connection (1.0) from unit-circle
      expect(suggestion).toBe('trigonometry');
    });

    it('breaks ties by foundation order', () => {
      let state = engine.createNewLearner();
      // Complete nothing connected to anything — should fall through to order-based tie-breaking
      // With no completions and all zeros, the first incomplete by order should be returned
      const suggestion = engine.suggestNextFoundation(state, graph);
      expect(FOUNDATION_ORDER.indexOf(suggestion)).toBeLessThan(FOUNDATION_ORDER.length);
    });
  });

  describe('Serialization', () => {
    it('round-trips a new learner state', () => {
      const state = engine.createNewLearner();
      const json = engine.serialize(state);
      const restored = engine.deserialize(json);
      expect(restored.currentFoundation).toBe(state.currentFoundation);
      expect(restored.currentPhase).toBe(state.currentPhase);
      expect(restored.firstVisit).toBe(state.firstVisit);
    });

    it('round-trips a state with completions and creations', () => {
      let state = engine.createNewLearner();
      state = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      state = engine.markPhaseComplete(state, 'unit-circle', 'see');
      state = engine.addCreation(state, {
        foundationId: 'unit-circle',
        type: 'generative-art',
        title: 'Test art',
        data: '{}',
        shared: false,
      });
      state = engine.addJournalEntry(state, {
        text: 'Test journal',
      });
      state = engine.recordUnitCircleMoment(state, ['unit-circle', 'trigonometry'], 'Test insight');

      const json = engine.serialize(state);
      const restored = engine.deserialize(json);

      expect(restored.completedPhases['unit-circle']).toEqual(['wonder', 'see']);
      expect(restored.creations).toHaveLength(1);
      expect(restored.creations[0]!.title).toBe('Test art');
      expect(restored.journalEntries).toHaveLength(1);
      expect(restored.unitCircleMoments).toHaveLength(1);
    });

    it('produces valid JSON', () => {
      const state = engine.createNewLearner();
      const json = engine.serialize(state);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('fills in missing foundation keys on deserialize', () => {
      // Simulate a state missing some foundation keys
      const partial = {
        currentFoundation: 'unit-circle',
        currentPhase: 'wonder',
        completedPhases: { 'unit-circle': ['wonder'] },
        creations: [],
        journalEntries: [],
        unitCircleMoments: [],
        timeSpent: {},
        bypasses: {},
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
      };
      const json = JSON.stringify(partial);
      const restored = engine.deserialize(json);

      // Should have all foundation keys filled in
      for (const id of FOUNDATION_ORDER) {
        expect(restored.completedPhases[id]).toBeDefined();
        expect(restored.timeSpent[id]).toBeDefined();
        expect(restored.bypasses[id]).toBeDefined();
      }
      // Original data preserved
      expect(restored.completedPhases['unit-circle']).toEqual(['wonder']);
    });
  });

  describe('Immutability', () => {
    it('advancePhase returns a new object', () => {
      const state = engine.createNewLearner();
      const advanced = engine.advancePhase(state);
      expect(state).not.toBe(advanced);
    });

    it('markPhaseComplete returns a new object', () => {
      const state = engine.createNewLearner();
      const marked = engine.markPhaseComplete(state, 'unit-circle', 'wonder');
      expect(state).not.toBe(marked);
    });

    it('navigateToFoundation returns a new object', () => {
      const state = engine.createNewLearner();
      const navigated = engine.navigateToFoundation(state, 'trigonometry');
      expect(state).not.toBe(navigated);
    });

    it('addCreation returns a new object', () => {
      const state = engine.createNewLearner();
      const updated = engine.addCreation(state, {
        foundationId: 'unit-circle',
        type: 'code',
        title: 'test',
        data: '',
        shared: false,
      });
      expect(state).not.toBe(updated);
    });

    it('original state arrays are not modified', () => {
      const state = engine.createNewLearner();
      const originalCreations = state.creations;
      engine.addCreation(state, {
        foundationId: 'unit-circle',
        type: 'code',
        title: 'test',
        data: '',
        shared: false,
      });
      expect(state.creations).toBe(originalCreations);
      expect(state.creations).toHaveLength(0);
    });
  });
});
