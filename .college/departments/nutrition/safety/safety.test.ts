/**
 * Nutrition Safety Warden test suite.
 *
 * Tests NutritionSafetyWarden (annotate/gate/redirect/checkAllergen modes),
 * NUTRITION_ALLERGEN_BOUNDARIES definitions, BIG_9_ALLERGENS list, and
 * SafetyWarden integration (SAFE-04, SAFE-05).
 *
 * @module departments/nutrition/safety/safety.test
 */

import { describe, it, expect } from 'vitest';
import { NutritionSafetyWarden } from './nutrition-safety-warden.js';
import { NUTRITION_ALLERGEN_BOUNDARIES, BIG_9_ALLERGENS } from './nutrition-allergen-boundaries.js';
import { SafetyWarden } from '../../../safety/safety-warden.js';
import { nutritionSafetyModel } from '../calibration/nutrition-calibration.js';

// ─── NutritionSafetyWarden — Annotate Mode ──────────────────────────────────

describe('NutritionSafetyWarden — Annotate Mode', () => {
  const warden = new NutritionSafetyWarden();

  it('flags peanuts as allergen', () => {
    const result = warden.annotate(['peanuts']);
    expect(result.annotations.length).toBeGreaterThan(0);
    expect(result.annotations[0].allergens).toContain('peanuts');
    expect(result.annotations[0].ingredient).toBe('peanuts');
  });

  it('flags milk as allergen', () => {
    const result = warden.annotate(['milk']);
    expect(result.annotations.length).toBeGreaterThan(0);
    const milkAnnotation = result.annotations.find((a) => a.ingredient === 'milk');
    expect(milkAnnotation?.allergens).toContain('milk');
  });

  it('returns safe: true for allergen-free ingredients', () => {
    const result = warden.annotate(['apple', 'water', 'lemon juice']);
    expect(result.safe).toBe(true);
    expect(result.annotations.length).toBe(0);
  });

  it('annotates multiple allergens in ingredient list', () => {
    const result = warden.annotate(['flour', 'milk', 'egg']);
    // flour → wheat, milk → milk, egg → eggs
    expect(result.annotations.length).toBeGreaterThanOrEqual(3);
  });

  it('annotations include substitutions for milk', () => {
    const result = warden.annotate(['milk']);
    const milkAnnotation = result.annotations.find((a) => a.ingredient === 'milk');
    expect(milkAnnotation).toBeDefined();
    // AllergenManager has substitutions: ['oat milk', 'coconut milk', 'almond milk', 'rice milk']
    const hasMilkSubs = milkAnnotation!.substitutions.some(
      (s) => s === 'oat milk' || s === 'coconut milk',
    );
    expect(hasMilkSubs).toBe(true);
  });
});

// ─── NutritionSafetyWarden — Gate Mode ──────────────────────────────────────

describe('NutritionSafetyWarden — Gate Mode', () => {
  const warden = new NutritionSafetyWarden();

  it('blocks recipe with peanuts when user is peanut-allergic', () => {
    const result = warden.gate(['peanuts'], ['rice', 'peanut butter', 'soy sauce']);
    expect(result.allowed).toBe(false);
    expect(result.blockedIngredients).toContain('peanut butter');
  });

  it('blocks recipe with milk when user is milk-allergic', () => {
    const result = warden.gate(['milk'], ['flour', 'butter', 'sugar']);
    expect(result.allowed).toBe(false);
  });

  it('allows recipe when user has no matching allergens', () => {
    const result = warden.gate(['peanuts'], ['apple', 'cinnamon', 'oats']);
    expect(result.allowed).toBe(true);
  });

  it('empty allergen profile allows all ingredients', () => {
    const result = warden.gate([], ['peanuts', 'milk', 'wheat flour']);
    expect(result.allowed).toBe(true);
  });

  it('reason string mentions blocked ingredients', () => {
    const result = warden.gate(['milk'], ['butter', 'cream']);
    expect(result.reason.length).toBeGreaterThan(0);
    const mentionsIngredient = result.reason.includes('butter') || result.reason.includes('cream');
    expect(mentionsIngredient).toBe(true);
  });
});

// ─── NutritionSafetyWarden — Redirect Mode ──────────────────────────────────

describe('NutritionSafetyWarden — Redirect Mode', () => {
  const warden = new NutritionSafetyWarden();

  it('redirects milk to dairy-free substitutions', () => {
    const result = warden.redirect('milk');
    expect(result.redirected).toBe(true);
    expect(result.substitutions.length).toBeGreaterThan(0);
  });

  it('redirected substitutions include oat milk or coconut milk', () => {
    const result = warden.redirect('milk');
    const hasExpected = result.substitutions.some(
      (s) => s.ingredient === 'oat milk' || s.ingredient === 'coconut milk',
    );
    expect(hasExpected).toBe(true);
  });

  it('redirects egg to egg-replacer options', () => {
    const result = warden.redirect('egg');
    expect(result.redirected).toBe(true);
  });

  it('unknown ingredient returns redirected: false with guidance', () => {
    const result = warden.redirect('dragonfruit');
    expect(result.redirected).toBe(false);
    expect(result.guidance.length).toBeGreaterThan(0);
  });
});

// ─── NutritionSafetyWarden — checkAllergen ───────────────────────────────────

describe('NutritionSafetyWarden — checkAllergen', () => {
  const warden = new NutritionSafetyWarden();

  it('peanuts returns present: true with Big 9 warning', () => {
    const result = warden.checkAllergen('peanuts');
    expect(result.present).toBe(true);
    expect(result.warning.length).toBeGreaterThan(0);
  });

  it('milk returns present: true', () => {
    const result = warden.checkAllergen('milk');
    expect(result.present).toBe(true);
  });

  it('dragon fruit returns present: false', () => {
    const result = warden.checkAllergen('dragon fruit');
    expect(result.present).toBe(false);
  });
});

// ─── NUTRITION_ALLERGEN_BOUNDARIES — Definitions ─────────────────────────────

describe('NUTRITION_ALLERGEN_BOUNDARIES — Definitions', () => {
  it('has 3 boundary definitions', () => {
    expect(NUTRITION_ALLERGEN_BOUNDARIES.length).toBe(3);
  });

  it('cross_contamination_storage_hours is absolute with limit 0', () => {
    const boundary = NUTRITION_ALLERGEN_BOUNDARIES.find(
      (b) => b.parameter === 'cross_contamination_storage_hours',
    );
    expect(boundary).toBeDefined();
    expect(boundary?.type).toBe('absolute');
    expect(boundary?.limit).toBe(0);
  });

  it('trace_allergen_threshold_ppm is absolute with limit 20', () => {
    const boundary = NUTRITION_ALLERGEN_BOUNDARIES.find(
      (b) => b.parameter === 'trace_allergen_threshold_ppm',
    );
    expect(boundary).toBeDefined();
    expect(boundary?.type).toBe('absolute');
    expect(boundary?.limit).toBe(20);
  });

  it('all boundaries have non-empty reason strings', () => {
    for (const boundary of NUTRITION_ALLERGEN_BOUNDARIES) {
      expect(boundary.reason.length).toBeGreaterThan(0);
    }
  });
});

// ─── BIG_9_ALLERGENS — List ──────────────────────────────────────────────────

describe('BIG_9_ALLERGENS — List', () => {
  it('has 9 allergens', () => {
    expect(BIG_9_ALLERGENS.length).toBe(9);
  });

  it('contains peanuts', () => {
    expect(BIG_9_ALLERGENS).toContain('peanuts');
  });

  it('contains sesame (FDA Big 9 addition as of January 2023)', () => {
    expect(BIG_9_ALLERGENS).toContain('sesame');
  });
});

// ─── Nutrition Calibration — SafetyBoundary Integration (SAFE-05) ────────────

describe('Nutrition Calibration — SafetyBoundary Integration (SAFE-05)', () => {
  it('nutritionSafetyModel has at least 1 boundary', () => {
    expect(nutritionSafetyModel.safetyBoundaries.length).toBeGreaterThanOrEqual(1);
  });

  it('SafetyWarden accepts nutrition boundaries', () => {
    const warden = new SafetyWarden();
    expect(() => {
      warden.registerBoundaries(nutritionSafetyModel.safetyBoundaries);
    }).not.toThrow();
  });

  it('cross_contamination_storage_hours triggers absolute violation', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(nutritionSafetyModel.safetyBoundaries);
    // 'cross_contamination_storage_hours' contains 'storage' → upper-limit (safe when <= 0)
    // proposedValue=1 > limit=0 → violation
    const result = warden.check(
      { parameter: 'cross_contamination_storage_hours', proposedValue: 1 },
      'gate',
    );
    expect(result.safe).toBe(false);
    expect(result.requiresAcknowledgment).toBe(true);
  });
});
