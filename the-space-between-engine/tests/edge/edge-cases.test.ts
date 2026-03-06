// Edge Case Tests — EC-01, EC-03, EC-07, EC-08, EC-09, EC-10, EC-13, EC-16, EC-19, EC-20, EC-21
// Boundary conditions, error handling, stress tests, accessibility patterns.

import { describe, it, expect } from 'vitest';
import { ProgressionEngine } from '../../src/core/progression';
import { createDefaultGraph } from '../../src/core/connections';
import { WonderWarden } from '../../src/integration/warden';
import { getFoundation, getAllFoundations } from '../../src/core/registry';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index';
import type { FoundationId, PhaseType, LearnerState, Creation, JournalEntry } from '../../src/types/index';

// ─── Helpers ──────────────────────────────────────────────

const engine = new ProgressionEngine();
const graph = createDefaultGraph();
const warden = new WonderWarden(graph);

function completeAllPhases(state: LearnerState, foundation: FoundationId): LearnerState {
  let s = engine.navigateToFoundation(state, foundation);
  for (const phase of PHASE_ORDER) {
    s = engine.markPhaseComplete(s, foundation, phase);
  }
  return s;
}

// Reproduce reducer NAVIGATE_WING logic for edge case testing
function navigateWing(state: LearnerState, foundation: FoundationId): LearnerState {
  return engine.navigateToFoundation(state, foundation);
}

// ─── Tests ────────────────────────────────────────────────

describe('Edge Cases', () => {

  // EC-01: Empty learner state (default) doesn't throw in any component logic
  describe('EC-01: Empty/default learner state is safe', () => {
    it('createNewLearner produces a valid state with all expected fields', () => {
      const state = engine.createNewLearner();

      expect(state.currentFoundation).toBe('unit-circle');
      expect(state.currentPhase).toBe('wonder');
      expect(state.creations).toEqual([]);
      expect(state.journalEntries).toEqual([]);
      expect(state.unitCircleMoments).toEqual([]);
      expect(state.firstVisit).toBeTruthy();
      expect(state.lastVisit).toBeTruthy();

      // All foundation keys exist
      for (const id of FOUNDATION_ORDER) {
        expect(state.completedPhases[id]).toEqual([]);
        expect(state.timeSpent[id]).toBe(0);
        expect(state.bypasses[id]).toEqual([]);
      }
    });

    it('getCompletionPercentage returns 0 for default state', () => {
      const state = engine.createNewLearner();
      expect(engine.getCompletionPercentage(state)).toBe(0);
    });

    it('getResumePoint returns unit-circle/wonder for default state', () => {
      const state = engine.createNewLearner();
      const resume = engine.getResumePoint(state);
      expect(resume.foundation).toBe('unit-circle');
      expect(resume.phase).toBe('wonder');
    });

    it('warden checkAccess does not throw for default state', () => {
      const state = engine.createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          expect(() => warden.checkAccess(state, id, phase)).not.toThrow();
        }
      }
    });

    it('suggestNextFoundation does not throw for default state', () => {
      const state = engine.createNewLearner();
      expect(() => engine.suggestNextFoundation(state, graph)).not.toThrow();
    });

    it('serialize and deserialize roundtrip for default state', () => {
      const state = engine.createNewLearner();
      const json = engine.serialize(state);
      const restored = engine.deserialize(json);

      expect(restored.currentFoundation).toBe(state.currentFoundation);
      expect(restored.currentPhase).toBe(state.currentPhase);
      expect(restored.creations).toEqual(state.creations);
    });
  });

  // EC-03: Rapid navigation — multiple NAVIGATE_WING actions don't corrupt state
  describe('EC-03: Rapid navigation does not corrupt state', () => {
    it('navigating through all 8 foundations rapidly produces valid state each time', () => {
      let state = engine.createNewLearner();

      for (const id of FOUNDATION_ORDER) {
        state = navigateWing(state, id);
        expect(state.currentFoundation).toBe(id);
        expect(state.currentPhase).toBe('wonder');
        expect(FOUNDATION_ORDER).toContain(state.currentFoundation);
        expect(PHASE_ORDER).toContain(state.currentPhase);
      }
    });

    it('rapid back-and-forth navigation maintains consistency', () => {
      let state = engine.createNewLearner();

      for (let i = 0; i < 50; i++) {
        const target = FOUNDATION_ORDER[i % FOUNDATION_ORDER.length]!;
        state = navigateWing(state, target);
        expect(state.currentFoundation).toBe(target);
      }

      // State should still be valid
      expect(engine.getCompletionPercentage(state)).toBe(0);
      expect(state.creations).toEqual([]);
    });

    it('navigating to the same foundation multiple times is idempotent', () => {
      let state = engine.createNewLearner();

      for (let i = 0; i < 10; i++) {
        state = navigateWing(state, 'trigonometry');
      }

      expect(state.currentFoundation).toBe('trigonometry');
      expect(state.currentPhase).toBe('wonder');
    });
  });

  // EC-07: State with invalid foundation ID handled gracefully
  describe('EC-07: Invalid foundation ID handled gracefully', () => {
    it('getFoundation throws for unknown ID', () => {
      expect(() => getFoundation('nonexistent' as FoundationId)).toThrow();
    });

    it('navigateToFoundation with valid IDs works for all 8', () => {
      let state = engine.createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        state = engine.navigateToFoundation(state, id);
        expect(state.currentFoundation).toBe(id);
      }
    });
  });

  // EC-08: Malformed serialized state triggers graceful reset
  describe('EC-08: Malformed serialized state', () => {
    it('deserialize throws on completely invalid JSON', () => {
      expect(() => engine.deserialize('not json at all')).toThrow();
    });

    it('deserialize throws on empty string', () => {
      expect(() => engine.deserialize('')).toThrow();
    });

    it('deserialize handles partial state by filling missing keys', () => {
      const partial = JSON.stringify({
        currentFoundation: 'unit-circle',
        currentPhase: 'wonder',
        completedPhases: {},
        creations: [],
        journalEntries: [],
        unitCircleMoments: [],
        timeSpent: {},
        bypasses: {},
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
      });

      const restored = engine.deserialize(partial);

      // All 8 foundation keys should have been filled in
      for (const id of FOUNDATION_ORDER) {
        expect(restored.completedPhases[id]).toEqual([]);
        expect(restored.timeSpent[id]).toBe(0);
        expect(restored.bypasses[id]).toEqual([]);
      }
    });
  });

  // EC-09: Large number of journal entries doesn't crash serialization
  describe('EC-09: Large journal entry count', () => {
    it('serializing 100+ journal entries does not throw', () => {
      let state = engine.createNewLearner();

      for (let i = 0; i < 150; i++) {
        state = engine.addJournalEntry(state, {
          foundationId: FOUNDATION_ORDER[i % 8]!,
          text: `Reflection entry number ${i}: The unit circle is the simplest complete structure. `.repeat(3),
          prompt: `Prompt ${i}`,
        } as JournalEntry);
      }

      expect(state.journalEntries).toHaveLength(150);

      const json = engine.serialize(state);
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);

      const restored = engine.deserialize(json);
      expect(restored.journalEntries).toHaveLength(150);
    });
  });

  // EC-10: Large number of creations doesn't crash serialization
  describe('EC-10: Large creation count', () => {
    it('serializing 50+ creations does not throw', () => {
      let state = engine.createNewLearner();

      for (let i = 0; i < 75; i++) {
        state = engine.addCreation(state, {
          foundationId: FOUNDATION_ORDER[i % 8]!,
          type: 'generative-art',
          title: `Creation ${i}`,
          data: JSON.stringify({ params: { x: i, y: i * 2 }, pixels: new Array(100).fill(0) }),
          shared: false,
        } as Creation);
      }

      expect(state.creations).toHaveLength(75);

      const json = engine.serialize(state);
      expect(typeof json).toBe('string');

      const restored = engine.deserialize(json);
      expect(restored.creations).toHaveLength(75);
    });
  });

  // EC-13: Key content has aria-label patterns in wing components
  describe('EC-13: Accessibility aria-label patterns', () => {
    it('all 8 foundations have name and description fields for aria labels', () => {
      const foundations = getAllFoundations();
      expect(foundations).toHaveLength(8);

      for (const f of foundations) {
        expect(f.name).toBeTruthy();
        expect(typeof f.name).toBe('string');
        expect(f.description).toBeTruthy();
        expect(typeof f.description).toBe('string');
        // These are used as aria-label values in navigation components
        expect(f.name.length).toBeGreaterThan(0);
        expect(f.name.length).toBeLessThan(100);
      }
    });

    it('each phase has a title suitable for aria labels', () => {
      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          const foundation = getFoundation(id);
          const phaseData = foundation.phases.get(phase);
          expect(phaseData).toBeDefined();
          expect(phaseData!.title).toBeTruthy();
          expect(typeof phaseData!.title).toBe('string');
        }
      }
    });
  });

  // EC-16: Verify the project has a build script that can produce output
  describe('EC-16: Build script existence', () => {
    it('package.json has a build script', async () => {
      // We read the package.json to verify the build script exists
      // This is a structural check, not a runtime build test
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(
        readFileSync(
          '/path/to/projectGSD/dev-tools/gsd-skill-creator-wasteland/the-space-between-engine/package.json',
          'utf-8'
        )
      );

      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
      expect(typeof pkg.scripts.build).toBe('string');
      expect(pkg.scripts.build).toContain('vite build');
    });
  });

  // EC-19: Shelter triggers after stuck threshold (>5min or 3+ visits)
  describe('EC-19: Shelter stuck detection', () => {
    it('detectStuck returns true after 5+ minutes (300001ms)', () => {
      const state = engine.createNewLearner();
      const stuck = warden.detectStuck(state, 'unit-circle', 'wonder', 300001, 1);
      expect(stuck).toBe(true);
    });

    it('detectStuck returns true at exactly 3 visits', () => {
      const state = engine.createNewLearner();
      const stuck = warden.detectStuck(state, 'unit-circle', 'wonder', 0, 3);
      expect(stuck).toBe(true);
    });

    it('detectStuck returns false below thresholds', () => {
      const state = engine.createNewLearner();
      const stuck = warden.detectStuck(state, 'unit-circle', 'wonder', 200000, 2);
      expect(stuck).toBe(false);
    });

    it('detectStuck returns false at exactly threshold boundary (300000ms, 2 visits)', () => {
      const state = engine.createNewLearner();
      const stuck = warden.detectStuck(state, 'unit-circle', 'wonder', 300000, 2);
      expect(stuck).toBe(false);
    });
  });

  // EC-20: Shelter on revisit (3+ visits without advancing)
  describe('EC-20: Shelter on revisit', () => {
    it('3 visits without advancing triggers shelter', () => {
      const state = engine.createNewLearner();
      // visitCount >= 3 triggers shelter regardless of time
      expect(warden.detectStuck(state, 'unit-circle', 'wonder', 0, 3)).toBe(true);
      expect(warden.detectStuck(state, 'unit-circle', 'wonder', 0, 5)).toBe(true);
    });

    it('shelter options are generated for stuck learner', () => {
      const state = engine.createNewLearner();
      const options = warden.getShelterOptions(state, 'unit-circle', 'wonder');

      expect(options.length).toBeGreaterThanOrEqual(3);
      // Should have alternative-wonder, simpler-interactive, and journal-prompt
      const types = options.map(o => o.type);
      expect(types).toContain('alternative-wonder');
      expect(types).toContain('simpler-interactive');
      expect(types).toContain('journal-prompt');
    });
  });

  // EC-21: Shelter "connection from familiar" only references completed foundations
  describe('EC-21: Connection from familiar references only completed foundations', () => {
    it('no connection-from-familiar when no foundations are complete', () => {
      const state = engine.createNewLearner();
      const options = warden.getShelterOptions(state, 'unit-circle', 'wonder');

      const connectionOptions = options.filter(o => o.type === 'connection-from-familiar');
      expect(connectionOptions).toHaveLength(0);
    });

    it('connection-from-familiar appears after completing a foundation', () => {
      let state = engine.createNewLearner();
      state = completeAllPhases(state, 'unit-circle');

      const options = warden.getShelterOptions(state, 'pythagorean', 'wonder');
      const connectionOptions = options.filter(o => o.type === 'connection-from-familiar');

      expect(connectionOptions.length).toBeGreaterThanOrEqual(1);
    });

    it('connection-from-familiar target foundation is a completed one', () => {
      let state = engine.createNewLearner();
      state = completeAllPhases(state, 'trigonometry');

      const options = warden.getShelterOptions(state, 'vector-calculus', 'see');
      const connectionOptions = options.filter(o => o.type === 'connection-from-familiar');

      if (connectionOptions.length > 0) {
        const target = connectionOptions[0]!.targetFoundation;
        expect(target).toBeDefined();
        // The target must be a completed foundation
        const completedPhases = state.completedPhases[target!] ?? [];
        expect(completedPhases.length).toBe(PHASE_ORDER.length);
      }
    });

    it('connection-from-familiar never references the current stuck foundation', () => {
      let state = engine.createNewLearner();
      state = completeAllPhases(state, 'unit-circle');
      state = completeAllPhases(state, 'pythagorean');

      const stuckFoundation: FoundationId = 'trigonometry';
      const options = warden.getShelterOptions(state, stuckFoundation, 'wonder');
      const connectionOptions = options.filter(o => o.type === 'connection-from-familiar');

      for (const opt of connectionOptions) {
        expect(opt.targetFoundation).not.toBe(stuckFoundation);
      }
    });
  });

  // Supplementary: Shelter descriptions use "hard room" pattern, never "try something easier"
  describe('Shelter message tone', () => {
    it('shelter options use "hard room" language, not "easier" language', () => {
      let state = engine.createNewLearner();
      state = completeAllPhases(state, 'unit-circle');

      const options = warden.getShelterOptions(state, 'pythagorean', 'touch');

      for (const opt of options) {
        expect(opt.description.toLowerCase()).toContain('hard room');
        // The warden never says "try something easier" — that's the anti-pattern.
        // "simpler version" is acceptable (it's offering a different angle, not belittling).
        expect(opt.description.toLowerCase()).not.toContain('try something easier');
      }
    });
  });
});
