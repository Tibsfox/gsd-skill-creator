/**
 * TDD tests for AllergenManager -- Big 9 allergen detection, substitution checking.
 *
 * RED phase: tests written first, implementation follows.
 *
 * @module safety/allergen-manager.test
 */

import { describe, it, expect } from 'vitest';
import { AllergenManager } from './allergen-manager.js';

describe('AllergenManager', () => {
  const manager = new AllergenManager();

  // ─── flagAllergens ─────────────────────────────────────────────────────────

  describe('flagAllergens', () => {
    it('Test 1: flags milk as major-ingredient allergen', () => {
      const flags = manager.flagAllergens('milk');
      expect(flags.length).toBe(1);
      expect(flags[0].allergen).toBe('milk');
      expect(flags[0].severity).toBe('major-ingredient');
      expect(flags[0].ingredient).toBe('milk');
    });

    it('Test 2: flags butter as milk allergen', () => {
      const flags = manager.flagAllergens('butter');
      expect(flags.length).toBe(1);
      expect(flags[0].allergen).toBe('milk');
    });

    it('Test 3: flags soy sauce for both soybeans and wheat', () => {
      const flags = manager.flagAllergens('soy sauce');
      expect(flags.length).toBe(2);
      const allergens = flags.map(f => f.allergen).sort();
      expect(allergens).toEqual(['soybeans', 'wheat']);
    });

    it('Test 4: returns empty array for non-allergen ingredient', () => {
      const flags = manager.flagAllergens('olive oil');
      expect(flags.length).toBe(0);
    });

    it('Test 9: recognizes all 9 allergen categories', () => {
      const allergenIngredients = [
        ['milk', 'milk'],
        ['egg', 'eggs'],
        ['salmon', 'fish'],
        ['shrimp', 'shellfish'],
        ['almond', 'tree-nuts'],
        ['peanut', 'peanuts'],
        ['wheat', 'wheat'],
        ['tofu', 'soybeans'],
        ['tahini', 'sesame'],
      ];

      for (const [ingredient, expectedAllergen] of allergenIngredients) {
        const flags = manager.flagAllergens(ingredient);
        expect(flags.length).toBeGreaterThan(0, `Expected ${ingredient} to flag ${expectedAllergen}`);
        expect(flags.some(f => f.allergen === expectedAllergen)).toBe(true);
      }
    });

    it('Test 13: flags tahini as sesame allergen', () => {
      const flags = manager.flagAllergens('tahini');
      expect(flags.length).toBe(1);
      expect(flags[0].allergen).toBe('sesame');
    });

    it('Test 14: flags shrimp as shellfish allergen', () => {
      const flags = manager.flagAllergens('shrimp');
      expect(flags.length).toBe(1);
      expect(flags[0].allergen).toBe('shellfish');
    });

    it('is case-insensitive', () => {
      const flags = manager.flagAllergens('MILK');
      expect(flags.length).toBe(1);
      expect(flags[0].allergen).toBe('milk');
    });
  });

  // ─── checkSubstitution ────────────────────────────────────────────────────

  describe('checkSubstitution', () => {
    it('Test 5: butter -> coconut oil is safe (removes milk allergen)', () => {
      const result = manager.checkSubstitution('butter', 'coconut oil');
      expect(result.original.length).toBeGreaterThan(0);
      expect(result.original[0].allergen).toBe('milk');
      expect(result.replacement.length).toBe(0);
      expect(result.safe).toBe(true);
    });

    it('Test 6: butter -> ghee flags same allergen in both', () => {
      const result = manager.checkSubstitution('butter', 'ghee');
      expect(result.original.length).toBeGreaterThan(0);
      expect(result.replacement.length).toBeGreaterThan(0);
      expect(result.original[0].allergen).toBe('milk');
      expect(result.replacement[0].allergen).toBe('milk');
      expect(result.safe).toBe(false);
      expect(result.warnings.some(w => w.includes('same allergen'))).toBe(true);
    });

    it('Test 7: wheat flour -> almond flour flags wheat (original) AND tree nuts (replacement)', () => {
      const result = manager.checkSubstitution('wheat flour', 'almond flour');
      expect(result.original.some(f => f.allergen === 'wheat')).toBe(true);
      expect(result.replacement.some(f => f.allergen === 'tree-nuts')).toBe(true);
      expect(result.safe).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('Test 8: egg -> flax egg removes egg allergen', () => {
      const result = manager.checkSubstitution('egg', 'flax egg');
      expect(result.original.some(f => f.allergen === 'eggs')).toBe(true);
      expect(result.replacement.length).toBe(0);
      expect(result.safe).toBe(true);
    });

    it('Test 12: allergen check runs without constructor params', () => {
      // AllergenManager is stateless -- no user profile or calibration needed
      const freshManager = new AllergenManager();
      const result = freshManager.checkSubstitution('milk', 'oat milk');
      expect(result.original.length).toBeGreaterThan(0);
      expect(result.safe).toBe(true);
    });
  });

  // ─── getSubstitutions ─────────────────────────────────────────────────────

  describe('getSubstitutions', () => {
    it('Test 10: returns substitutions for milk with allergen annotations', () => {
      const subs = manager.getSubstitutions('milk');
      expect(subs.length).toBeGreaterThan(0);
      const ingredients = subs.map(s => s.ingredient);
      expect(ingredients).toContain('oat milk');
      expect(ingredients).toContain('coconut milk');

      // Almond milk should have tree-nut flag
      const almondMilk = subs.find(s => s.ingredient === 'almond milk');
      if (almondMilk) {
        expect(almondMilk.allergenFlags.some(f => f.allergen === 'tree-nuts')).toBe(true);
      }
    });

    it('Test 11: returns substitutions for wheat flour with allergen annotations', () => {
      const subs = manager.getSubstitutions('wheat flour');
      expect(subs.length).toBeGreaterThan(0);

      // Almond flour should have tree-nut flag
      const almondFlour = subs.find(s => s.ingredient === 'almond flour');
      if (almondFlour) {
        expect(almondFlour.allergenFlags.some(f => f.allergen === 'tree-nuts')).toBe(true);
      }
    });

    it('returns empty array for unknown ingredient', () => {
      const subs = manager.getSubstitutions('dragon fruit');
      expect(subs).toEqual([]);
    });
  });

  // ─── registerIngredient ───────────────────────────────────────────────────

  describe('registerIngredient', () => {
    it('Test 15: registers custom ingredient with no allergens', () => {
      const customManager = new AllergenManager();
      customManager.registerIngredient('nutritional yeast', []);
      const flags = customManager.flagAllergens('nutritional yeast');
      expect(flags.length).toBe(0);
    });

    it('Test 16: registers custom ingredient with allergen mapping', () => {
      const customManager = new AllergenManager();
      customManager.registerIngredient('seitan', ['wheat']);
      const flags = customManager.flagAllergens('seitan');
      expect(flags.length).toBe(1);
      expect(flags[0].allergen).toBe('wheat');
    });
  });
});
