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

    it('returns small fixed adjustment for miss direction', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'miss' };
      const adj = temperatureModel.computeAdjustment(delta);
      expect(adj.oven_temp).toBe(5);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'over' };
      const conf = temperatureModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('confidence for miss direction is 0.4', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'miss' };
      const conf = temperatureModel.confidence(delta);
      expect(conf).toBe(0.4);
    });

    it('caps magnitude scaling at 2', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 5, direction: 'over' };
      const adj = temperatureModel.computeAdjustment(delta);
      // base=20, scaled=20*min(5,2)=40, so oven_temp=-40
      expect(adj.oven_temp).toBe(-40);
    });

    it('includes surface_temp adjustment for over direction', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'over' };
      const adj = temperatureModel.computeAdjustment(delta);
      expect(adj.surface_temp).toBeLessThan(0);
    });

    it('includes surface_temp adjustment for under direction', () => {
      const delta: ComparisonDelta = { category: 'temperature', magnitude: 1, direction: 'under' };
      const adj = temperatureModel.computeAdjustment(delta);
      expect(adj.surface_temp).toBeGreaterThan(0);
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

    it('returns small fixed adjustment for miss direction', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'miss' };
      const adj = timingModel.computeAdjustment(delta);
      expect(adj.cook_time).toBe(5);
    });

    it('includes rest_time in under adjustments', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'under' };
      const adj = timingModel.computeAdjustment(delta);
      expect(adj.rest_time).toBeGreaterThan(0);
    });

    it('includes rest_time in over adjustments', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'over' };
      const adj = timingModel.computeAdjustment(delta);
      expect(adj.rest_time).toBeLessThan(0);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'under' };
      const conf = timingModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('confidence for miss direction is 0.5', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 1, direction: 'miss' };
      const conf = timingModel.confidence(delta);
      expect(conf).toBe(0.5);
    });

    it('caps magnitude scaling at 2', () => {
      const delta: ComparisonDelta = { category: 'timing', magnitude: 5, direction: 'under' };
      const adj = timingModel.computeAdjustment(delta);
      // factor=0.125*min(5,2)=0.25, cook_time=0.25*100=25
      expect(adj.cook_time).toBe(25);
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

    it('returns negative seasoning adjustment for over direction (too salty)', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'over' };
      const adj = seasoningModel.computeAdjustment(delta);
      expect(adj.salt_amount).toBeLessThan(0);
      expect(adj.spice_amount).toBeLessThan(0);
      expect(adj.acid_amount).toBeLessThan(0);
    });

    it('returns small fixed adjustment for miss direction', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'miss' };
      const adj = seasoningModel.computeAdjustment(delta);
      expect(adj.salt_amount).toBe(1);
      expect(adj.spice_amount).toBe(1);
    });

    it('includes spice_amount and acid_amount in under adjustments', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'under' };
      const adj = seasoningModel.computeAdjustment(delta);
      expect(adj.spice_amount).toBeGreaterThan(0);
      expect(adj.acid_amount).toBeGreaterThan(0);
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

    it('confidence for over direction is bounded', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'over' };
      const conf = seasoningModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(0.7);
    });

    it('confidence for miss direction is 0.4', () => {
      const delta: ComparisonDelta = { category: 'seasoning', magnitude: 1, direction: 'miss' };
      const conf = seasoningModel.confidence(delta);
      expect(conf).toBe(0.4);
    });

    it('has sodium_daily_max safety boundary at 2300mg', () => {
      const boundary = seasoningModel.safetyBoundaries.find(b => b.parameter === 'sodium_daily_max');
      expect(boundary).toBeDefined();
      expect(boundary!.limit).toBe(2300);
      expect(boundary!.type).toBe('absolute');
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

    it('returns positive heat and time for under (too wet/raw) direction', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'under' };
      const adj = textureModel.computeAdjustment(delta);
      expect(adj.heat_level).toBeGreaterThan(0);
      expect(adj.cook_time).toBeGreaterThan(0);
      expect(adj.moisture_amount).toBeLessThan(0);
      expect(adj.fat_amount).toBe(0);
    });

    it('returns small fixed adjustment for miss direction', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'miss' };
      const adj = textureModel.computeAdjustment(delta);
      expect(adj.heat_level).toBe(5);
      expect(adj.cook_time).toBe(3);
    });

    it('over direction includes fat_amount and cook_time adjustments', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'over' };
      const adj = textureModel.computeAdjustment(delta);
      expect(adj.fat_amount).toBeGreaterThan(0);
      expect(adj.cook_time).toBeLessThan(0);
    });

    it('caps magnitude scaling at 2', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 5, direction: 'over' };
      const adj = textureModel.computeAdjustment(delta);
      // base=15, scaled=15*min(5,2)=30
      expect(adj.heat_level).toBe(-30);
    });

    it('returns confidence between 0 and 1', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'over' };
      const conf = textureModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });

    it('confidence for under direction is bounded at 0.7', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'under' };
      const conf = textureModel.confidence(delta);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(0.7);
    });

    it('confidence for miss direction is 0.4', () => {
      const delta: ComparisonDelta = { category: 'texture', magnitude: 1, direction: 'miss' };
      const conf = textureModel.confidence(delta);
      expect(conf).toBe(0.4);
    });

    it('has minimum_internal_temp safety boundary at 145F', () => {
      const boundary = textureModel.safetyBoundaries.find(b => b.parameter === 'minimum_internal_temp');
      expect(boundary).toBeDefined();
      expect(boundary!.limit).toBe(145);
      expect(boundary!.type).toBe('absolute');
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
