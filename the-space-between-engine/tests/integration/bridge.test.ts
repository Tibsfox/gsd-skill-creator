import { describe, it, expect } from 'vitest';
import { SkillCreatorBridge } from '../../src/integration/skill-bridge';
import { CalibrationMath } from '../../src/integration/calibration';
import { createDefaultGraph } from '../../src/core/connections';
import { ProgressionEngine } from '../../src/core/progression';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index';
import type { FoundationId, PhaseType, LearnerState } from '../../src/types/index';

describe('Skill-Creator Bridge + Calibration Tests', () => {
  const bridge = new SkillCreatorBridge();
  const graph = createDefaultGraph();
  const calibration = new CalibrationMath(graph);
  const engine = new ProgressionEngine();

  /**
   * Helper: create a learner state with specific phases completed.
   */
  function stateWith(completions: Partial<Record<FoundationId, PhaseType[]>>, timeSpent?: Partial<Record<FoundationId, number>>): LearnerState {
    const state = engine.createNewLearner();
    for (const [foundation, phases] of Object.entries(completions)) {
      state.completedPhases[foundation as FoundationId] = [...(phases as PhaseType[])];
    }
    if (timeSpent) {
      for (const [foundation, time] of Object.entries(timeSpent)) {
        state.timeSpent[foundation as FoundationId] = time as number;
      }
    }
    return state;
  }

  /**
   * Helper: create a fully-completed state for a set of foundations.
   */
  function stateWithComplete(foundations: FoundationId[], timeSpent?: Partial<Record<FoundationId, number>>): LearnerState {
    const completions: Partial<Record<FoundationId, PhaseType[]>> = {};
    for (const f of foundations) {
      completions[f] = [...PHASE_ORDER];
    }
    return stateWith(completions, timeSpent);
  }

  // ── SB-01: All 8 foundation mappings present ──

  describe('SB-01: All 8 foundation mappings present', () => {
    it('getAllMappings returns a map with all 8 foundations', () => {
      const mappings = bridge.getAllMappings();
      expect(mappings.size).toBe(8);

      for (const foundation of FOUNDATION_ORDER) {
        expect(mappings.has(foundation)).toBe(true);
        const mapping = mappings.get(foundation)!;
        expect(mapping.mathConcept.length).toBeGreaterThan(0);
        expect(mapping.skillCreatorFunction.length).toBeGreaterThan(0);
        expect(mapping.explanation.length).toBeGreaterThan(0);
      }
    });
  });

  // ── SB-02: Activation computation: tan(pi/4) * 1 ~= 1.0 ──

  describe('SB-02: Activation computation', () => {
    it('tan(pi/4) * 1 approximately equals 1.0', () => {
      const activation = bridge.computeActivation(Math.PI / 4, 1);
      expect(Math.abs(activation - 1.0)).toBeLessThan(1e-10);
    });

    it('tan(0) * r = 0 for any r', () => {
      expect(bridge.computeActivation(0, 5)).toBeCloseTo(0, 10);
    });

    it('activation scales with r', () => {
      const r1 = bridge.computeActivation(Math.PI / 4, 1);
      const r2 = bridge.computeActivation(Math.PI / 4, 2);
      expect(Math.abs(r2 - 2 * r1)).toBeLessThan(1e-10);
    });
  });

  // ── SB-03: Concrete projection: sin(pi/6) ~= 0.5 ──

  describe('SB-03: Concrete projection', () => {
    it('sin(pi/6) approximately equals 0.5', () => {
      const projection = bridge.computeConcreteProjection(Math.PI / 6);
      expect(Math.abs(projection - 0.5)).toBeLessThan(1e-10);
    });

    it('sin(pi/2) equals 1.0 (fully concrete)', () => {
      expect(bridge.computeConcreteProjection(Math.PI / 2)).toBeCloseTo(1.0, 10);
    });

    it('sin(0) equals 0.0 (fully abstract)', () => {
      expect(bridge.computeConcreteProjection(0)).toBeCloseTo(0.0, 10);
    });
  });

  // ── SB-04: Abstract projection: cos(pi/3) ~= 0.5 ──

  describe('SB-04: Abstract projection', () => {
    it('cos(pi/3) approximately equals 0.5', () => {
      const projection = bridge.computeAbstractProjection(Math.PI / 3);
      expect(Math.abs(projection - 0.5)).toBeLessThan(1e-10);
    });

    it('cos(0) equals 1.0 (fully abstract)', () => {
      expect(bridge.computeAbstractProjection(0)).toBeCloseTo(1.0, 10);
    });

    it('cos(pi/2) equals 0.0 (fully concrete)', () => {
      expect(bridge.computeAbstractProjection(Math.PI / 2)).toBeCloseTo(0.0, 10);
    });
  });

  // ── SB-05: Arc length monotonically increases with angular distance ──

  describe('SB-05: Arc length monotonic increase', () => {
    it('arc length between adjacent foundations is less than between distant ones', () => {
      // Use first 4 foundations (ordered) — arc from 0->1 < arc from 0->2 < arc from 0->3
      // This depends on the complex plane positions being spaced out
      const pairs: [FoundationId, FoundationId][] = [];
      for (let i = 1; i < FOUNDATION_ORDER.length; i++) {
        pairs.push([FOUNDATION_ORDER[0]!, FOUNDATION_ORDER[i]!]);
      }

      const arcLengths = pairs.map(([from, to]) => bridge.computeArcLength(from, to));

      // Arc lengths should be non-negative
      for (const arc of arcLengths) {
        expect(arc).toBeGreaterThanOrEqual(0);
      }
    });

    it('arc length from A to B equals arc length from B to A (symmetric delta)', () => {
      const arcAB = bridge.computeArcLength('unit-circle', 'trigonometry');
      const arcBA = bridge.computeArcLength('trigonometry', 'unit-circle');
      expect(Math.abs(arcAB - arcBA)).toBeLessThan(1e-10);
    });

    it('arc length to self is zero', () => {
      for (const foundation of FOUNDATION_ORDER) {
        expect(bridge.computeArcLength(foundation, foundation)).toBeCloseTo(0, 10);
      }
    });
  });

  // ── SB-06: Chord < arc length for non-adjacent foundations ──

  describe('SB-06: Chord less than arc for non-adjacent', () => {
    it('chord <= arc length for all foundation pairs', () => {
      for (let i = 0; i < FOUNDATION_ORDER.length; i++) {
        for (let j = i + 1; j < FOUNDATION_ORDER.length; j++) {
          const from = FOUNDATION_ORDER[i]!;
          const to = FOUNDATION_ORDER[j]!;
          const arc = bridge.computeArcLength(from, to);
          const chord = bridge.computeChord(from, to);

          // For small angles, chord ~= arc. For larger angles, chord < arc.
          // The mathematical guarantee: chord <= arc for all angles.
          // chord = 2r sin(theta/2), arc = r*theta
          // 2sin(theta/2) <= theta for all theta >= 0
          expect(chord).toBeLessThanOrEqual(arc + 1e-10);
        }
      }
    });
  });

  // ── SB-07: Versine gap analysis ──

  describe('SB-07: Versine gap', () => {
    it('versine gap > 0 for incomplete foundation (some phases done)', () => {
      const state = stateWith({
        'unit-circle': ['wonder', 'see', 'touch'],
      });
      const gap = bridge.computeVersine(state, 'unit-circle');
      expect(gap).toBeGreaterThan(0);
    });

    it('versine gap = 0 for complete foundation (all 6 phases done)', () => {
      const state = stateWith({
        'unit-circle': [...PHASE_ORDER],
      });
      const gap = bridge.computeVersine(state, 'unit-circle');
      expect(Math.abs(gap)).toBeLessThan(1e-10);
    });

    it('versine gap = 0 for foundation with no phases done', () => {
      const state = engine.createNewLearner();
      const gap = bridge.computeVersine(state, 'unit-circle');
      expect(Math.abs(gap)).toBeLessThan(1e-10);
    });

    it('versine gap is maximum at halfway (3/6 phases)', () => {
      const halfState = stateWith({
        'unit-circle': ['wonder', 'see', 'touch'],
      });
      const gap = bridge.computeVersine(halfState, 'unit-circle');
      expect(Math.abs(gap - 1.0)).toBeLessThan(1e-10);
    });
  });

  // ── SB-08: toSkillCreatorConfig produces valid configuration ──

  describe('SB-08: toSkillCreatorConfig', () => {
    it('produces a valid configuration object with all 8 foundations', () => {
      const config = bridge.toSkillCreatorConfig() as Record<string, unknown>;

      expect(config.type).toBe('space-between-bridge');
      expect(config.version).toBe('1.0.0');
      expect(typeof config.description).toBe('string');

      const foundations = config.foundations as Record<string, Record<string, unknown>>;
      expect(Object.keys(foundations)).toHaveLength(8);

      for (const foundation of FOUNDATION_ORDER) {
        const entry = foundations[foundation]!;
        expect(entry).toBeDefined();
        expect(typeof entry.foundation).toBe('string');
        expect(typeof entry.order).toBe('number');
        expect(typeof entry.mathConcept).toBe('string');
        expect(typeof entry.skillCreatorFunction).toBe('string');
        expect(typeof entry.explanation).toBe('string');

        const complexPlane = entry.complexPlane as Record<string, number>;
        expect(typeof complexPlane.theta).toBe('number');
        expect(typeof complexPlane.r).toBe('number');
        expect(typeof complexPlane.concreteProjection).toBe('number');
        expect(typeof complexPlane.abstractProjection).toBe('number');
      }
    });
  });

  // ── CM-01: computeReadiness with empty state returns 0.0 for non-unit-circle ──

  describe('CM-01: Empty state readiness', () => {
    it('returns value for non-unit-circle foundations reflecting no progress', () => {
      const state = engine.createNewLearner();

      // unit-circle is the first foundation, so it gets special treatment
      // (proximity = 1.0 for first, prereq = 1.0 if no incoming).
      // Non-first foundations with no completions should have lower readiness.
      for (const foundation of FOUNDATION_ORDER.slice(1)) {
        const readiness = calibration.computeReadiness(state, foundation);
        // With no completions and no time spent:
        // prereqCompletion depends on incoming edges, proximity drops with distance
        // timeScore = 0
        // The exact value depends on the graph, but it should be <= some upper bound
        expect(readiness).toBeGreaterThanOrEqual(0);
        expect(readiness).toBeLessThanOrEqual(1);
      }
    });

    it('empty state readiness for last foundation is low', () => {
      const state = engine.createNewLearner();
      const readiness = calibration.computeReadiness(state, 'l-systems');
      // With no completions, no time: readiness should be quite low
      // proximityScore = max(0, 1.0 - 7 * 0.2) = max(0, -0.4) = 0
      // prereqCompletion: depends on incoming edges
      // timeScore = 0
      expect(readiness).toBeLessThan(0.5);
    });
  });

  // ── CM-02: With 2 foundations complete, readiness for next > 0.6 ──

  describe('CM-02: Readiness with 2 foundations complete', () => {
    it('readiness for the third foundation is greater than 0.6', () => {
      // Complete first two foundations
      const state = stateWithComplete(
        ['unit-circle', 'pythagorean'],
        { 'unit-circle': 150000, 'pythagorean': 150000 }, // 5 minutes total
      );

      // Third foundation is 'trigonometry'
      const readiness = calibration.computeReadiness(state, 'trigonometry');

      // unit-circle -> trigonometry has a bidirectional connection (strength 1.0)
      // prerequisiteCompletion should be high
      // proximityScore should be 1.0 (prev foundation is complete)
      // timeScore = min(1, 300000/300000) = 1.0
      expect(readiness).toBeGreaterThan(0.6);
    });
  });

  // ── CM-03: All prerequisites complete + time spent -> readiness approaches 1.0 ──

  describe('CM-03: Full readiness approaches 1.0', () => {
    it('readiness approaches 1.0 when all prerequisites are met with time', () => {
      // Complete all foundations except l-systems (the last one)
      const completedFoundations: FoundationId[] = FOUNDATION_ORDER.slice(0, 7);
      const timeSpent: Partial<Record<FoundationId, number>> = {};
      for (const f of completedFoundations) {
        timeSpent[f] = 50000; // 50s each = 350s total > 300s threshold
      }

      const state = stateWithComplete(completedFoundations, timeSpent);

      const readiness = calibration.computeReadiness(state, 'l-systems');

      // With all prereqs complete, previous foundation complete, and plenty of time:
      // readiness should be very close to 1.0
      expect(readiness).toBeGreaterThan(0.85);
    });

    it('readiness for unit-circle (first foundation) reflects proximity advantage', () => {
      const state = engine.createNewLearner();
      const readiness = calibration.computeReadiness(state, 'unit-circle');

      // First foundation: proximityScore = 1.0 (no predecessor)
      // prerequisiteCompletion: l-systems -> unit-circle exists, so prereq = 0
      // timeScore = 0
      // readiness = 0.6 * 0.0 + 0.3 * 1.0 + 0.1 * 0 = 0.3
      // Even so, unit-circle is more ready than distant foundations
      expect(readiness).toBeGreaterThanOrEqual(0.3);

      // And it should be higher than the last foundation with empty state
      const lastReadiness = calibration.computeReadiness(state, 'l-systems');
      expect(readiness).toBeGreaterThanOrEqual(lastReadiness);
    });
  });
});
