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
} from './engine.js';
import type { CalibrationDelta } from '../rosetta-core/types.js';

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
});
