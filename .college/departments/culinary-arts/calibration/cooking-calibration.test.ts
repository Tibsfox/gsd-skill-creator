import { describe, it, expect } from 'vitest';
import { CalibrationEngine } from '../../../calibration/engine.js';
import { registerCookingModels } from './cooking-calibration.js';
import type { CalibrationDelta } from '../../../rosetta-core/types.js';

function createMockStore() {
  const deltas: CalibrationDelta[] = [];
  return {
    deltas,
    async save(delta: CalibrationDelta) { deltas.push(delta); },
    async getHistory() { return deltas; },
  };
}

describe('Cooking calibration wiring', () => {
  it('registerCookingModels registers all 4 models without throwing', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => registerCookingModels(engine)).not.toThrow();
  });

  it('engine processes cooking-temperature overdone feedback with negative oven_temp', async () => {
    const engine = new CalibrationEngine(createMockStore());
    registerCookingModels(engine);
    const result = await engine.process({
      domain: 'cooking-temperature',
      translationId: 'test-1',
      observedResult: 'overdone, too high temperature',
      expectedResult: 'properly cooked',
      parameters: { oven_temp: 400 },
    });
    expect(result.adjustment.oven_temp).toBeLessThan(0);
  });

  it('engine processes cooking-timing undercooked feedback with positive cook_time', async () => {
    const engine = new CalibrationEngine(createMockStore());
    registerCookingModels(engine);
    const result = await engine.process({
      domain: 'cooking-timing',
      translationId: 'test-2',
      observedResult: 'undercooked, too raw',
      expectedResult: 'properly cooked',
      parameters: { cook_time: 30 },
    });
    expect(result.adjustment.cook_time).toBeGreaterThan(0);
  });

  it('engine processes cooking-seasoning bland feedback with positive salt_amount', async () => {
    const engine = new CalibrationEngine(createMockStore());
    registerCookingModels(engine);
    const result = await engine.process({
      domain: 'cooking-seasoning',
      translationId: 'test-3',
      observedResult: 'too little seasoning, under-seasoned',
      expectedResult: 'well seasoned',
      parameters: { salt_amount: 5 },
    });
    expect(result.adjustment.salt_amount).toBeGreaterThan(0);
  });

  it('engine processes cooking-texture too dry feedback with adjustments', async () => {
    const engine = new CalibrationEngine(createMockStore());
    registerCookingModels(engine);
    const result = await engine.process({
      domain: 'cooking-texture',
      translationId: 'test-4',
      observedResult: 'too dry, overcooked texture',
      expectedResult: 'moist and tender',
      parameters: { heat_level: 375 },
    });
    expect(result.adjustment).toBeDefined();
    expect(Object.keys(result.adjustment).length).toBeGreaterThan(0);
  });

  it('calling registerCookingModels twice throws TypeError', () => {
    const engine = new CalibrationEngine(createMockStore());
    registerCookingModels(engine);
    expect(() => registerCookingModels(engine)).toThrow(TypeError);
  });
});
