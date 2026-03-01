/**
 * TDD tests for the CalibrationEngine -- universal Observe->Compare->Adjust->Record feedback loop.
 *
 * Tests cover:
 * - Bounded adjustment invariants (CAL-06)
 * - Full Observe->Compare->Adjust->Record round-trip (CAL-01)
 * - Model pluggability (CAL-02 proof)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CalibrationEngine,
  UserFeedback,
  ComparisonDelta,
  ObservedResult,
  DomainCalibrationModel,
  ProfileSynthesizer,
} from './engine.js';
import type { CalibrationDelta, CalibrationProfile } from '../rosetta-core/types.js';

/** Minimal DeltaStore interface for testing */
interface DeltaStore {
  save(delta: CalibrationDelta): Promise<void>;
  getHistory(): Promise<CalibrationDelta[]>;
}

/** Create a mock DeltaStore */
function createMockDeltaStore(): DeltaStore & { saved: CalibrationDelta[] } {
  const saved: CalibrationDelta[] = [];
  return {
    saved,
    save: vi.fn(async (delta: CalibrationDelta) => {
      saved.push(delta);
    }),
    getHistory: vi.fn(async () => [...saved]),
  };
}

/** Create a mock DomainCalibrationModel for testing */
function createMockModel(domain = 'test'): DomainCalibrationModel {
  return {
    domain,
    parameters: ['temperature', 'time'],
    science: 'Test science model',
    safetyBoundaries: [],
    computeAdjustment(_delta: ComparisonDelta): Record<string, number> {
      return { temperature: -25, time: -5 };
    },
    confidence(_delta: ComparisonDelta): number {
      return 0.8;
    },
  };
}

describe('CalibrationEngine', () => {
  describe('Bounded adjustment invariants (CAL-06)', () => {
    it('clamps adjustment of +50 on parameter valued 100 to +20', () => {
      const engine = new CalibrationEngine(createMockDeltaStore());
      const result = engine.boundAdjustment(
        { temperature: 50 },
        { temperature: 100 },
      );
      expect(result.temperature).toBe(20);
    });

    it('passes through adjustment of -5 on parameter valued 100 unchanged', () => {
      const engine = new CalibrationEngine(createMockDeltaStore());
      const result = engine.boundAdjustment(
        { temperature: -5 },
        { temperature: 100 },
      );
      expect(result.temperature).toBe(-5);
    });

    it('clamps adjustment of +25 on parameter valued 100 to +20', () => {
      const engine = new CalibrationEngine(createMockDeltaStore());
      const result = engine.boundAdjustment(
        { temperature: 25 },
        { temperature: 100 },
      );
      expect(result.temperature).toBe(20);
    });

    it('clamps adjustment of -22 on parameter valued 100 to -20', () => {
      const engine = new CalibrationEngine(createMockDeltaStore());
      const result = engine.boundAdjustment(
        { temperature: -22 },
        { temperature: 100 },
      );
      expect(result.temperature).toBe(-20);
    });

    it('passes through adjustment of 0 unchanged', () => {
      const engine = new CalibrationEngine(createMockDeltaStore());
      const result = engine.boundAdjustment(
        { temperature: 0 },
        { temperature: 100 },
      );
      expect(result.temperature).toBe(0);
    });
  });

  describe('Full Observe->Compare->Adjust->Record round-trip (CAL-01)', () => {
    it('completes all four stages and returns a CalibrationDelta', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);
      const model = createMockModel('test');
      engine.registerModel(model);

      const feedback: UserFeedback = {
        domain: 'test',
        translationId: 'test-translation-1',
        observedResult: 'overdone',
        expectedResult: 'medium',
        parameters: { temperature: 350 },
      };

      const result = await engine.process(feedback);

      // Observe stage: captures observed result
      expect(result.observedResult).toBe('overdone');

      // Compare stage: produces delta with direction
      // (verified implicitly -- process runs compare internally)

      // Adjust stage: bounded adjustment applied
      expect(result.adjustment).toBeDefined();
      expect(typeof result.adjustment.temperature).toBe('number');

      // Record stage: deltaStore.save called exactly once
      expect(mockStore.save).toHaveBeenCalledTimes(1);

      // Result validation
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.domainModel).toBe('test');
    });
  });

  describe('Model pluggability (CAL-02 proof)', () => {
    it('registers a model and selects it based on domain', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);
      const cookingModel = createMockModel('cooking');
      engine.registerModel(cookingModel);

      const feedback: UserFeedback = {
        domain: 'cooking',
        translationId: 'test-2',
        observedResult: 'overdone',
        expectedResult: 'medium',
        parameters: { temperature: 350 },
      };

      const result = await engine.process(feedback);
      expect(result.domainModel).toBe('cooking');
    });

    it('throws error for unknown domain', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);

      const feedback: UserFeedback = {
        domain: 'unknown-domain',
        translationId: 'test-3',
        observedResult: 'bad',
        expectedResult: 'good',
        parameters: { x: 100 },
      };

      await expect(engine.process(feedback)).rejects.toThrow(
        'No calibration model registered for domain: unknown-domain',
      );
    });

    it('supports multiple models registered for different domains', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);

      const mathModel: DomainCalibrationModel = {
        domain: 'mathematics',
        parameters: ['precision'],
        science: 'Numerical analysis',
        safetyBoundaries: [],
        computeAdjustment: () => ({ precision: 10 }),
        confidence: () => 0.9,
      };

      const cookingModel = createMockModel('cooking');

      engine.registerModel(mathModel);
      engine.registerModel(cookingModel);

      const mathFeedback: UserFeedback = {
        domain: 'mathematics',
        translationId: 'test-4',
        observedResult: 'imprecise',
        expectedResult: 'precise',
        parameters: { precision: 100 },
      };

      const result = await engine.process(mathFeedback);
      expect(result.domainModel).toBe('mathematics');
      // Math model returns precision: 10 for param=100, 10% < 20% so passes through
      expect(result.adjustment.precision).toBe(10);
    });
  });

  describe('Profile synthesis (CAL-04)', () => {
    it('synthesizes a single delta into a profile', () => {
      const synthesizer = new ProfileSynthesizer();
      const delta = createTestDelta({
        domainModel: 'cooking',
        timestamp: new Date('2026-03-01T12:00:00Z'),
      });

      const profile = synthesizer.synthesize([delta]);
      expect(profile.deltas).toHaveLength(1);
      expect(profile.lastUpdated).toEqual(new Date('2026-03-01T12:00:00Z'));
      expect(profile.domain).toBe('cooking');
    });

    it('accumulates multiple deltas preserving all entries', () => {
      const synthesizer = new ProfileSynthesizer();
      const deltas = [
        createTestDelta({ adjustment: { temperature: -10 }, timestamp: new Date('2026-01-01T00:00:00Z') }),
        createTestDelta({ adjustment: { temperature: -10 }, timestamp: new Date('2026-02-01T00:00:00Z') }),
        createTestDelta({ adjustment: { temperature: -10 }, timestamp: new Date('2026-03-01T00:00:00Z') }),
      ];

      const profile = synthesizer.synthesize(deltas);
      expect(profile.deltas).toHaveLength(3);
      expect(profile.lastUpdated).toEqual(new Date('2026-03-01T00:00:00Z'));
    });

    it('returns empty profile with zero confidence for empty input', () => {
      const synthesizer = new ProfileSynthesizer();
      const profile = synthesizer.synthesize([]);
      expect(profile.confidenceScore).toBe(0);
      expect(profile.deltas).toEqual([]);
      expect(profile.domain).toBe('unknown');
    });
  });

  describe('Confidence scoring (CAL-05)', () => {
    it('produces higher confidence for consistent repeated feedback than single feedback', () => {
      const synthesizer = new ProfileSynthesizer();

      const singleDelta = [
        createTestDelta({ adjustment: { temperature: -20 }, confidence: 0.6 }),
      ];
      const threeDeltas = [
        createTestDelta({ adjustment: { temperature: -20 }, confidence: 0.6 }),
        createTestDelta({ adjustment: { temperature: -20 }, confidence: 0.6 }),
        createTestDelta({ adjustment: { temperature: -20 }, confidence: 0.6 }),
      ];

      const singleProfile = synthesizer.synthesize(singleDelta);
      const threeProfile = synthesizer.synthesize(threeDeltas);

      expect(threeProfile.confidenceScore).toBeGreaterThan(singleProfile.confidenceScore);
    });

    it('does not apply consistency bonus for contradictory feedback', () => {
      const synthesizer = new ProfileSynthesizer();

      const contradictoryDeltas = [
        createTestDelta({ adjustment: { temperature: -20 }, confidence: 0.7 }),
        createTestDelta({ adjustment: { temperature: +20 }, confidence: 0.7 }),
      ];

      const score = synthesizer.scoreConfidence(contradictoryDeltas);
      // Base is 0.7, no consistency bonus since signs differ
      expect(score).toBe(0.7);
    });

    it('computes single consistent delta confidence correctly', () => {
      const synthesizer = new ProfileSynthesizer();

      const deltas = [
        createTestDelta({ adjustment: { temperature: -10 }, confidence: 0.5 }),
      ];

      const score = synthesizer.scoreConfidence(deltas);
      // base = 0.5, consistency = 1.0 (one param, consistent)
      // final = clamp(0.5 * (1 + 1.0 * 0.5), 0, 1) = 0.75
      expect(score).toBe(0.75);
    });

    it('never exceeds 1.0 even with perfect consistency and high base', () => {
      const synthesizer = new ProfileSynthesizer();

      const deltas = [
        createTestDelta({ adjustment: { temperature: -10 }, confidence: 1.0 }),
        createTestDelta({ adjustment: { temperature: -10 }, confidence: 1.0 }),
      ];

      const score = synthesizer.scoreConfidence(deltas);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('getProfile returns profile with correct delta count after processing', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);
      const model = createMockModel('cooking');
      engine.registerModel(model);

      await engine.process({
        domain: 'cooking',
        translationId: 't1',
        observedResult: 'overdone',
        expectedResult: 'medium',
        parameters: { temperature: 350 },
      });
      await engine.process({
        domain: 'cooking',
        translationId: 't2',
        observedResult: 'overdone',
        expectedResult: 'medium',
        parameters: { temperature: 340 },
      });

      const profile = await engine.getProfile('user1', 'cooking');
      expect(profile.deltas).toHaveLength(2);
    });

    it('keeps score at exactly 1.0 for 100 identical deltas', () => {
      const synthesizer = new ProfileSynthesizer();

      const deltas = Array.from({ length: 100 }, () =>
        createTestDelta({ adjustment: { temperature: -10 }, confidence: 1.0 }),
      );

      const score = synthesizer.scoreConfidence(deltas);
      expect(score).toBe(1.0);
    });
  });

  describe('Pluggability integration (CAL-02)', () => {
    it('processes a full cycle with an inline cooking model', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);

      const cookingModel: DomainCalibrationModel = {
        domain: 'culinary',
        parameters: ['temperature', 'time', 'liquid'],
        science: "Newton's law of cooling; protein denaturation models; starch gelatinization",
        safetyBoundaries: [
          {
            parameter: 'poultry_internal_temp',
            limit: 165,
            type: 'absolute',
            reason: 'FDA minimum safe internal temperature for poultry',
          },
        ],
        computeAdjustment(delta: ComparisonDelta): Record<string, number> {
          if (delta.direction === 'over' && delta.category === 'temperature') {
            return { temperature: -25, time: -0.15 };
          }
          if (delta.direction === 'under' && delta.category === 'temperature') {
            return { temperature: +25, time: +0.15 };
          }
          return {};
        },
        confidence(delta: ComparisonDelta): number {
          return ['temperature', 'time', 'liquid'].includes(delta.category) ? 0.8 : 0.4;
        },
      };

      engine.registerModel(cookingModel);

      const result = await engine.process({
        domain: 'culinary',
        translationId: 'test-cook-1',
        observedResult: 'overdone',
        expectedResult: 'medium',
        parameters: { temperature: 350 },
      });

      // Bounded: raw -25 on param 350 → 7.1% < 20% → passes through
      expect(result.adjustment.temperature).toBe(-25);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.domainModel).toBe('culinary');
    });

    it('swaps between registered models based on domain', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);

      const mathModel: DomainCalibrationModel = {
        domain: 'mathematics',
        parameters: ['precision'],
        science: 'Numerical analysis',
        safetyBoundaries: [],
        computeAdjustment: () => ({ precision: 42 }),
        confidence: () => 0.95,
      };

      const cookingModel: DomainCalibrationModel = {
        domain: 'culinary',
        parameters: ['temperature'],
        science: 'Thermodynamics',
        safetyBoundaries: [],
        computeAdjustment: () => ({ temperature: -10 }),
        confidence: () => 0.7,
      };

      engine.registerModel(mathModel);
      engine.registerModel(cookingModel);

      const result = await engine.process({
        domain: 'mathematics',
        translationId: 'test-math-1',
        observedResult: 'imprecise result',
        expectedResult: 'precise',
        parameters: { precision: 1000 },
      });

      // Math model returns precision: 42, 4.2% of 1000 < 20% → passes through
      expect(result.adjustment.precision).toBe(42);
      expect(result.domainModel).toBe('mathematics');
      // Must NOT be 0.7 (cooking model) — confirms correct routing
      expect(result.confidence).toBe(0.95);
    });

    it('throws clear error for unregistered domain', async () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);

      await expect(
        engine.process({
          domain: 'unknown-domain',
          translationId: 'test-fail',
          observedResult: 'bad',
          expectedResult: 'good',
          parameters: { x: 100 },
        }),
      ).rejects.toThrow('No calibration model registered for domain: unknown-domain');
    });

    it('throws TypeError for duplicate domain registration', () => {
      const mockStore = createMockDeltaStore();
      const engine = new CalibrationEngine(mockStore);

      const model1: DomainCalibrationModel = {
        domain: 'cooking',
        parameters: ['temperature'],
        science: 'Test',
        safetyBoundaries: [],
        computeAdjustment: () => ({}),
        confidence: () => 0.5,
      };

      const model2: DomainCalibrationModel = {
        domain: 'cooking',
        parameters: ['time'],
        science: 'Test v2',
        safetyBoundaries: [],
        computeAdjustment: () => ({}),
        confidence: () => 0.6,
      };

      engine.registerModel(model1);
      expect(() => engine.registerModel(model2)).toThrow(TypeError);
      expect(() => engine.registerModel(model2)).toThrow(
        'Model already registered for domain: cooking',
      );
    });

    /*
     * TypeScript compile-time interface test (intentionally not runnable):
     *
     * The following would NOT compile, proving DomainCalibrationModel
     * requires both computeAdjustment and confidence methods:
     *
     * const incomplete: DomainCalibrationModel = {
     *   domain: 'x',
     *   parameters: [],
     *   science: '',
     *   safetyBoundaries: [],
     *   // Missing computeAdjustment and confidence → TypeScript compile error
     * };
     */
  });
});

/** Helper to create test CalibrationDelta objects. */
function createTestDelta(overrides: Partial<CalibrationDelta> = {}): CalibrationDelta {
  return {
    observedResult: 'overdone',
    expectedResult: 'medium',
    adjustment: { temperature: -15 },
    confidence: 0.7,
    domainModel: 'cooking',
    timestamp: new Date('2026-03-01T12:00:00Z'),
    ...overrides,
  };
}
