import { describe, it, expect } from 'vitest';
import {
  temperatureModel,
  timingModel,
  seasoningModel,
  textureModel,
} from './cooking.js';
import type { ComparisonDelta } from '../engine.js';

describe('Cooking calibration models', () => {
  describe('temperatureModel', () => {
    it('returns negative temperature adjustment for over direction', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'over' };
      const adj = temperatureModel.computeAdjustment(delta);
      expect(adj.oven_temp).toBeLessThan(0);
    });

    it('returns positive temperature adjustment for under direction', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'under' };
      const adj = temperatureModel.computeAdjustment(delta);
      expect(adj.oven_temp).toBeGreaterThan(0);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'over' };
      const conf = temperatureModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('has poultry_internal_temp safety boundary at 165F absolute', () => {
      const boundary = temperatureModel.safetyBoundaries.find(b => b.parameter === 'poultry_internal_temp');
      expect(boundary).toBeDefined();
      expect(boundary!.limit).toBe(165);
      expect(boundary!.type).toBe('absolute');
    });

    it('has ground_meat_internal_temp safety boundary at 160F absolute', () => {
      const boundary = temperatureModel.safetyBoundaries.find(b => b.parameter === 'ground_meat_internal_temp');
      expect(boundary).toBeDefined();
      expect(boundary!.limit).toBe(160);
      expect(boundary!.type).toBe('absolute');
    });

    it('has whole_cuts_internal_temp safety boundary at 145F absolute', () => {
      const boundary = temperatureModel.safetyBoundaries.find(b => b.parameter === 'whole_cuts_internal_temp');
      expect(boundary).toBeDefined();
      expect(boundary!.limit).toBe(145);
      expect(boundary!.type).toBe('absolute');
    });
  });

  describe('timingModel', () => {
    it('returns positive time adjustment for under direction (cook longer)', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'under' };
      const adj = timingModel.computeAdjustment(delta);
      expect(adj.cook_time).toBeGreaterThan(0);
    });

    it('returns negative time adjustment for over direction (cook shorter)', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'over' };
      const adj = timingModel.computeAdjustment(delta);
      expect(adj.cook_time).toBeLessThan(0);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'under' };
      const conf = timingModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('has danger_zone_time safety boundary at 120 minutes absolute', () => {
      const boundary = timingModel.safetyBoundaries.find(b => b.parameter === 'danger_zone_time');
      expect(boundary).toBeDefined();
      expect(boundary!.limit).toBe(120);
      expect(boundary!.type).toBe('absolute');
    });
  });

  describe('seasoningModel', () => {
    it('returns positive seasoning adjustment for under direction (bland)', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'under' };
      const adj = seasoningModel.computeAdjustment(delta);
      expect(adj.salt_amount).toBeGreaterThan(0);
    });

    it('uses logarithmic scaling (adjustment decreases with higher magnitude)', () => {
      const low: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'under' };
      const high: ComparisonDelta = { category: 'seasoning', magnitude: 3, direction: 'under' };
      const adjLow = seasoningModel.computeAdjustment(low);
      const adjHigh = seasoningModel.computeAdjustment(high);
      // Per unit magnitude, the adjustment should be smaller at higher magnitudes
      const perUnitLow = adjLow.salt_amount / 1;
      const perUnitHigh = adjHigh.salt_amount / 3;
      expect(perUnitHigh).toBeLessThan(perUnitLow);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'under' };
      const conf = seasoningModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('has at least one absolute safety boundary', () => {
      const absolute = seasoningModel.safetyBoundaries.filter(b => b.type === 'absolute');
      expect(absolute.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('textureModel', () => {
    it('returns negative heat and positive moisture for over (too dry) direction', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'over' };
      const adj = textureModel.computeAdjustment(delta);
      expect(adj.heat_level).toBeLessThan(0);
      expect(adj.moisture_amount).toBeGreaterThan(0);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'over' };
      const conf = textureModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('has at least one absolute safety boundary', () => {
      const absolute = textureModel.safetyBoundaries.filter(b => b.type === 'absolute');
      expect(absolute.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('all models', () => {
    it('all have valid domain, parameters, science, and safetyBoundaries', () => {
      const models = [temperatureModel, timingModel, seasoningModel, textureModel];
      for (const model of models) {
        expect(model.domain).toBeTruthy();
        expect(model.parameters.length).toBeGreaterThan(0);
        expect(model.science).toBeTruthy();
        expect(model.safetyBoundaries.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
