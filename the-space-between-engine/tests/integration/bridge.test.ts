import { describe, it, expect } from 'vitest';
import {
  getMapping,
  getAllMappings,
  getComplexPlanePosition,
  computeActivation,
  computeConcreteProjection,
  computeAbstractProjection,
  computeArcLength,
  computeChord,
  computeVersine,
  toSkillCreatorConfig,
} from '@/integration/skill-bridge';
import {
  computeLearnerPosition,
  computeReadiness,
  suggestOptimalPath,
} from '@/integration/calibration';
import { createNewLearner, markPhaseComplete } from '@/core/progression';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types';
import type { FoundationId, LearnerState } from '@/types';

// ─── Tolerance helper ────────────────────────────────

const EPSILON = 1e-10;

function approx(actual: number, expected: number, tolerance = EPSILON): void {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
}

// ─── Skill-Creator Bridge ────────────────────────────

describe('Skill-Creator Bridge', () => {
  describe('getMapping', () => {
    it('should return a mapping for every foundation', () => {
      for (const id of FOUNDATION_ORDER) {
        const mapping = getMapping(id);
        expect(mapping).toBeDefined();
        expect(mapping.mathConcept).toBeTruthy();
        expect(mapping.skillCreatorFunction).toBeTruthy();
      }
    });
  });

  describe('getAllMappings', () => {
    it('should return all 8 mappings', () => {
      const mappings = getAllMappings();
      expect(mappings.size).toBe(8);
      for (const id of FOUNDATION_ORDER) {
        expect(mappings.has(id)).toBe(true);
      }
    });
  });

  describe('getComplexPlanePosition', () => {
    it('should return theta and r for each foundation', () => {
      for (const id of FOUNDATION_ORDER) {
        const pos = getComplexPlanePosition(id);
        expect(pos).toHaveProperty('theta');
        expect(pos).toHaveProperty('r');
        expect(pos.theta).toBeGreaterThan(0);
        expect(pos.r).toBeGreaterThan(0);
        expect(pos.r).toBeLessThanOrEqual(1);
      }
    });

    it('should return pi/4 theta for unit-circle', () => {
      const pos = getComplexPlanePosition('unit-circle');
      approx(pos.theta, Math.PI / 4);
      approx(pos.r, 1.0);
    });
  });

  describe('computeActivation', () => {
    it('activation = tan(theta) * r', () => {
      // tan(pi/4) * 1 = 1.0
      approx(computeActivation(Math.PI / 4, 1.0), 1.0);
    });

    it('activation at theta=0 is 0', () => {
      approx(computeActivation(0, 1.0), 0);
    });

    it('activation scales with r', () => {
      const a1 = computeActivation(Math.PI / 4, 0.5);
      const a2 = computeActivation(Math.PI / 4, 1.0);
      approx(a1, 0.5);
      approx(a2, 1.0);
    });
  });

  describe('computeConcreteProjection', () => {
    it('concrete = sin(theta)', () => {
      // sin(pi/6) = 0.5
      approx(computeConcreteProjection(Math.PI / 6), 0.5);
    });

    it('sin(pi/2) = 1', () => {
      approx(computeConcreteProjection(Math.PI / 2), 1.0);
    });

    it('sin(0) = 0', () => {
      approx(computeConcreteProjection(0), 0);
    });
  });

  describe('computeAbstractProjection', () => {
    it('abstract = cos(theta)', () => {
      // cos(pi/3) = 0.5
      approx(computeAbstractProjection(Math.PI / 3), 0.5);
    });

    it('cos(0) = 1', () => {
      approx(computeAbstractProjection(0), 1.0);
    });

    it('cos(pi/2) = 0', () => {
      approx(computeAbstractProjection(Math.PI / 2), 0, 1e-9);
    });
  });

  describe('computeArcLength', () => {
    it('arc length = |theta_to - theta_from| * average_r', () => {
      // unit-circle: theta=pi/4, r=1.0
      // pythagorean: theta=pi/6, r=0.85
      const arcLength = computeArcLength('unit-circle', 'pythagorean');
      const expectedTheta = Math.abs(Math.PI / 6 - Math.PI / 4);
      const expectedR = (1.0 + 0.85) / 2;
      approx(arcLength, expectedTheta * expectedR);
    });

    it('arc length from self to self is 0', () => {
      approx(computeArcLength('unit-circle', 'unit-circle'), 0);
    });

    it('arc length is always non-negative', () => {
      for (const a of FOUNDATION_ORDER) {
        for (const b of FOUNDATION_ORDER) {
          expect(computeArcLength(a, b)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('computeChord', () => {
    it('chord = 2 * r * sin(|theta_b - theta_a| / 2)', () => {
      const chord = computeChord('unit-circle', 'pythagorean');
      const thetaDiff = Math.abs(Math.PI / 6 - Math.PI / 4);
      const avgR = (1.0 + 0.85) / 2;
      const expected = 2 * avgR * Math.sin(thetaDiff / 2);
      approx(chord, expected);
    });

    it('chord from self to self is 0', () => {
      approx(computeChord('unit-circle', 'unit-circle'), 0);
    });

    it('chord is always non-negative', () => {
      for (const a of FOUNDATION_ORDER) {
        for (const b of FOUNDATION_ORDER) {
          expect(computeChord(a, b)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('chord <= arc length (chord is straight line, arc is curved)', () => {
      for (const a of FOUNDATION_ORDER) {
        for (const b of FOUNDATION_ORDER) {
          if (a === b) continue;
          const chord = computeChord(a, b);
          const arc = computeArcLength(a, b);
          expect(chord).toBeLessThanOrEqual(arc + EPSILON);
        }
      }
    });
  });

  describe('computeVersine', () => {
    it('versine = 0 when all phases are complete', () => {
      let state = createNewLearner();
      // Complete all phases for unit-circle
      for (const phase of PHASE_ORDER) {
        state = markPhaseComplete(state, 'unit-circle', phase);
      }
      approx(computeVersine(state, 'unit-circle'), 0);
    });

    it('versine = 1 - cos(pi) = 2 when no phases are complete', () => {
      const state = createNewLearner();
      approx(computeVersine(state, 'pythagorean'), 2.0);
    });

    it('versine decreases as phases are completed', () => {
      let state = createNewLearner();
      const v0 = computeVersine(state, 'unit-circle');

      state = markPhaseComplete(state, 'unit-circle', 'wonder');
      const v1 = computeVersine(state, 'unit-circle');

      state = markPhaseComplete(state, 'unit-circle', 'see');
      const v2 = computeVersine(state, 'unit-circle');

      expect(v0).toBeGreaterThan(v1);
      expect(v1).toBeGreaterThan(v2);
    });
  });

  describe('toSkillCreatorConfig', () => {
    it('should return a config with all foundations', () => {
      const config = toSkillCreatorConfig();
      expect(config.version).toBe('1.0.0');
      expect(config.foundationOrder).toEqual(FOUNDATION_ORDER);

      const foundations = config.foundations as Record<string, Record<string, unknown>>;
      for (const id of FOUNDATION_ORDER) {
        expect(foundations[id]).toBeDefined();
        expect(foundations[id].activation).toBeDefined();
        expect(foundations[id].concreteProjection).toBeDefined();
        expect(foundations[id].abstractProjection).toBeDefined();
      }
    });
  });
});

// ─── Calibration ─────────────────────────────────────

describe('Calibration', () => {
  describe('computeLearnerPosition', () => {
    it('should return origin (0, 0) for new learner', () => {
      const state = createNewLearner();
      const pos = computeLearnerPosition(state);
      expect(pos.theta).toBe(0);
      expect(pos.r).toBe(0);
    });

    it('should increase r as phases are completed', () => {
      let state = createNewLearner();
      const r0 = computeLearnerPosition(state).r;

      state = markPhaseComplete(state, 'unit-circle', 'wonder');
      const r1 = computeLearnerPosition(state).r;

      expect(r1).toBeGreaterThan(r0);
    });

    it('should set theta to foundation theta when only one foundation has progress', () => {
      let state = createNewLearner();
      state = markPhaseComplete(state, 'unit-circle', 'wonder');
      const pos = computeLearnerPosition(state);
      const ucPos = getComplexPlanePosition('unit-circle');
      approx(pos.theta, ucPos.theta);
    });

    it('r should be 1 when all phases in all foundations are complete', () => {
      let state = createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        for (const phase of PHASE_ORDER) {
          state = markPhaseComplete(state, id, phase);
        }
      }
      const pos = computeLearnerPosition(state);
      approx(pos.r, 1.0);
    });
  });

  describe('computeReadiness', () => {
    it('should return low readiness for distant foundations with no progress', () => {
      const state = createNewLearner();
      const readiness = computeReadiness(state, 'l-systems');
      expect(readiness).toBeLessThan(0.5);
    });

    it('should return 1.0 for a fully completed foundation', () => {
      let state = createNewLearner();
      for (const phase of PHASE_ORDER) {
        state = markPhaseComplete(state, 'unit-circle', phase);
      }
      approx(computeReadiness(state, 'unit-circle'), 0.5 + 0.3 + 0.2, 0.01);
      // Direct=0.5, proximity depends on position, prereq=1 (index 0)
    });

    it('should increase readiness as prerequisites are completed', () => {
      let state = createNewLearner();
      const r0 = computeReadiness(state, 'pythagorean');

      // Complete unit-circle (the prereq in sequential order)
      for (const phase of PHASE_ORDER) {
        state = markPhaseComplete(state, 'unit-circle', phase);
      }
      const r1 = computeReadiness(state, 'pythagorean');

      expect(r1).toBeGreaterThan(r0);
    });

    it('should return value between 0 and 1', () => {
      const state = createNewLearner();
      for (const id of FOUNDATION_ORDER) {
        const readiness = computeReadiness(state, id);
        expect(readiness).toBeGreaterThanOrEqual(0);
        expect(readiness).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('suggestOptimalPath', () => {
    it('should return all 8 foundations', () => {
      const state = createNewLearner();
      const path = suggestOptimalPath(state);
      expect(path).toHaveLength(8);
      expect(new Set(path).size).toBe(8);
    });

    it('should put completed foundations at the end', () => {
      let state = createNewLearner();
      for (const phase of PHASE_ORDER) {
        state = markPhaseComplete(state, 'unit-circle', phase);
      }
      const path = suggestOptimalPath(state);
      expect(path[path.length - 1]).toBe('unit-circle');
    });

    it('should prioritize foundations with higher readiness', () => {
      let state = createNewLearner();
      // Complete some phases of pythagorean
      state = markPhaseComplete(state, 'pythagorean', 'wonder');
      state = markPhaseComplete(state, 'pythagorean', 'see');
      const path = suggestOptimalPath(state);
      // pythagorean should be near the front since it has partial progress
      const pyIdx = path.indexOf('pythagorean');
      expect(pyIdx).toBeLessThan(4);
    });
  });
});
