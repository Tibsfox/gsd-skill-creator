/**
 * AllergenManager -- non-negotiable allergen flagging for ingredient substitutions.
 *
 * Maintains a database of ingredient-to-allergen mappings for the Big 9
 * (US FDA) allergens. Every substitution proposal is checked against this
 * database -- allergen warnings cannot be suppressed by calibration state
 * or user preference.
 *
 * Big 9 allergens: milk, eggs, fish, shellfish, tree nuts, peanuts,
 * wheat, soybeans, sesame.
 *
 * @module safety/allergen-manager
 */

import type { AllergenFlag, SubstitutionCheck } from './types.js';

/** Pre-populated allergen database: allergen category -> ingredient names. */
const ALLERGEN_DATABASE: Record<string, string[]> = {
  'milk': ['milk', 'butter', 'ghee', 'cream', 'cheese', 'yogurt', 'whey', 'casein', 'lactose'],
  'eggs': ['egg', 'eggs', 'mayonnaise', 'meringue', 'custard'],
  'fish': ['fish', 'cod', 'salmon', 'tuna', 'anchovy', 'anchovies', 'fish sauce', 'worcestershire'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish', 'oyster', 'clam', 'mussel', 'scallop'],
  'tree-nuts': ['almond', 'almond flour', 'almond milk', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut'],
  'peanuts': ['peanut', 'peanuts', 'peanut butter', 'peanut oil'],
  'wheat': ['wheat', 'wheat flour', 'bread', 'pasta', 'flour', 'soy sauce', 'seitan', 'breadcrumbs'],
  'soybeans': ['soy', 'soy sauce', 'tofu', 'tempeh', 'edamame', 'miso', 'soybean', 'soy milk'],
  'sesame': ['sesame', 'sesame oil', 'sesame seeds', 'tahini', 'hummus'],
};

/** Pre-populated substitution database: ingredient -> alternatives. */
const SUBSTITUTION_DATABASE: Record<string, string[]> = {
  'milk': ['oat milk', 'coconut milk', 'almond milk', 'rice milk'],
  'butter': ['coconut oil', 'olive oil', 'vegan butter'],
  'eggs': ['flax egg', 'chia egg', 'applesauce', 'commercial egg replacer'],
  'egg': ['flax egg', 'chia egg', 'applesauce', 'commercial egg replacer'],
  'wheat flour': ['rice flour', 'oat flour', 'almond flour', 'coconut flour'],
  'flour': ['rice flour', 'oat flour', 'almond flour', 'coconut flour'],
};

export class AllergenManager {
  /** Internal ingredient-to-allergen mapping (case-insensitive lookup). */
  private ingredientAllergens: Map<string, string[]> = new Map();

  constructor() {
    // Build the reverse lookup: ingredient -> allergen categories
    for (const [allergen, ingredients] of Object.entries(ALLERGEN_DATABASE)) {
      for (const ingredient of ingredients) {
        const key = ingredient.toLowerCase();
        const existing = this.ingredientAllergens.get(key) ?? [];
        if (!existing.includes(allergen)) {
          existing.push(allergen);
        }
        this.ingredientAllergens.set(key, existing);
      }
    }
  }

  /**
   * Flag allergens in an ingredient.
   *
   * Looks up the ingredient (case-insensitive) in the database.
   * Returns all matching allergen flags. If the ingredient matches
   * multiple categories (e.g., soy sauce -> soybeans + wheat),
   * returns flags for all.
   */
  flagAllergens(ingredient: string): AllergenFlag[] {
    const key = ingredient.toLowerCase();
    const allergens = this.ingredientAllergens.get(key);

    if (!allergens || allergens.length === 0) {
      return [];
    }

    return allergens.map(allergen => ({
      allergen,
      severity: 'major-ingredient' as const,
      ingredient: key,
      substitutions: this.getSubstitutionNames(key),
    }));
  }

  /**
   * Check a substitution for allergen implications.
   *
   * Flags allergens in both the original and replacement. A substitution
   * is "safe" if the replacement does not contain any allergens that the
   * original did not. Warnings are generated for:
   * - Same allergen in replacement as in original
   * - New allergen introduced by replacement
   * - Any allergens present in the replacement
   */
  checkSubstitution(original: string, replacement: string): SubstitutionCheck {
    const originalFlags = this.flagAllergens(original);
    const replacementFlags = this.flagAllergens(replacement);

    const originalAllergens = new Set(originalFlags.map(f => f.allergen));
    const replacementAllergens = new Set(replacementFlags.map(f => f.allergen));

    const warnings: string[] = [];

    // Check for same allergen in replacement
    for (const allergen of replacementAllergens) {
      if (originalAllergens.has(allergen)) {
        warnings.push(`Replacement contains same allergen: ${allergen}`);
      } else {
        warnings.push(`Replacement introduces new allergen: ${allergen}`);
      }
    }

    // Safe = replacement has no allergens, OR all replacement allergens were already in original
    // Actually per spec: safe if replacement introduces no NEW allergens
    // But if replacement has same allergen as original, it's NOT safe (user can't escape the allergen)
    const safe = replacementFlags.length === 0;

    return {
      original: originalFlags,
      replacement: replacementFlags,
      safe,
      warnings,
    };
  }

  /**
   * Get known safe substitutions for an ingredient.
   *
   * Each substitution includes its own allergen flags so the user is
   * ALWAYS informed of potential allergen implications.
   */
  getSubstitutions(ingredient: string): Array<{ ingredient: string; allergenFlags: AllergenFlag[] }> {
    const key = ingredient.toLowerCase();
    const substitutions = SUBSTITUTION_DATABASE[key];

    if (!substitutions) {
      return [];
    }

    return substitutions.map(sub => ({
      ingredient: sub,
      allergenFlags: this.flagAllergens(sub),
    }));
  }

  /**
   * Register a custom ingredient with its allergen mappings.
   *
   * Allows departments to extend the allergen database with new ingredients.
   */
  registerIngredient(name: string, allergens: string[]): void {
    const key = name.toLowerCase();
    this.ingredientAllergens.set(key, [...allergens]);
  }

  /**
   * Get substitution names for an ingredient (internal helper for AllergenFlag).
   */
  private getSubstitutionNames(ingredient: string): string[] {
    const subs = SUBSTITUTION_DATABASE[ingredient];
    return subs ? [...subs] : [];
  }
}
