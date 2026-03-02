/**
 * NutritionSafetyWarden — allergen management with three modes.
 *
 * Wraps the existing AllergenManager for nutrition-specific safety enforcement.
 * Three modes:
 *
 * 1. ANNOTATE: Flag allergens in ingredient lists.
 * 2. GATE: Block recipes containing declared allergens for a user's profile.
 * 3. REDIRECT: Provide substitution guidance using AllergenManager.getSubstitutions().
 *
 * @module departments/nutrition/safety/nutrition-safety-warden
 */

import { AllergenManager } from '../../../safety/allergen-manager.js';
import type { AllergenFlag } from '../../../safety/types.js';
import { BIG_9_ALLERGENS } from './nutrition-allergen-boundaries.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single allergen annotation for an ingredient. */
export interface AllergenAnnotation {
  /** The ingredient that was checked */
  ingredient: string;

  /** List of allergen names found (e.g., ['wheat', 'soybeans']) */
  allergens: string[];

  /** Severity of the allergen presence */
  severity: 'trace' | 'contains' | 'major-ingredient';

  /** Suggested substitutions for this ingredient */
  substitutions: string[];
}

/** Result of annotate mode: ingredient list with allergen annotations. */
export interface AllergenAnnotateResult {
  /** Original ingredient list */
  ingredients: string[];

  /** Allergen annotations (one per flagged ingredient) */
  annotations: AllergenAnnotation[];

  /** true if no allergens found in any ingredient */
  safe: boolean;
}

/** Result of gate mode: whether the recipe is allowed for the user's allergen profile. */
export interface AllergenGateResult {
  /** Whether the recipe is allowed for the user's allergen profile */
  allowed: boolean;

  /** Ingredients that contain declared allergens */
  blockedIngredients: string[];

  /** Reason string (empty if allowed) */
  reason: string;
}

/** Result of redirect mode: substitution guidance for an allergen-containing ingredient. */
export interface AllergenRedirectResult {
  /** Whether substitutions were found and redirect triggered */
  redirected: boolean;

  /** The original ingredient that was checked */
  originalIngredient: string;

  /** Substitution options with their allergen flags */
  substitutions: Array<{ ingredient: string; allergenFlags: AllergenFlag[] }>;

  /** Guidance text for using substitutions */
  guidance: string;
}

// ─── NutritionSafetyWarden ──────────────────────────────────────────────────

/**
 * Nutrition Safety Warden — wraps AllergenManager with annotate/gate/redirect modes.
 *
 * Does NOT extend SafetyWarden — domain-specific, follows PhysicalSafetyWarden pattern.
 */
export class NutritionSafetyWarden {
  private allergenManager = new AllergenManager();

  /**
   * ANNOTATE MODE: Flag allergens in an ingredient list.
   *
   * For each ingredient, calls AllergenManager.flagAllergens() and builds
   * annotations. Includes substitution suggestions for flagged ingredients.
   *
   * @param ingredientList - List of ingredient names to check
   * @returns Annotated result with allergen flags and safe status
   */
  annotate(ingredientList: string[]): AllergenAnnotateResult {
    const annotations: AllergenAnnotation[] = [];

    for (const ingredient of ingredientList) {
      const flags = this.allergenManager.flagAllergens(ingredient);
      if (flags.length > 0) {
        annotations.push({
          ingredient,
          allergens: flags.map((f) => f.allergen),
          severity: flags[0]?.severity ?? 'trace',
          substitutions: flags[0]?.substitutions ?? [],
        });
      }
    }

    return {
      ingredients: ingredientList,
      annotations,
      safe: annotations.length === 0,
    };
  }

  /**
   * GATE MODE: Block a recipe if it contains ingredients matching the user's allergen profile.
   *
   * @param userAllergenProfile - List of allergen names the user is allergic to (e.g., ['peanuts', 'tree-nuts'])
   * @param ingredientList - List of ingredient names in the recipe
   * @returns Gate result with allowed status and list of blocked ingredients
   */
  gate(userAllergenProfile: string[], ingredientList: string[]): AllergenGateResult {
    // If no allergen profile declared, allow everything
    if (userAllergenProfile.length === 0) {
      return { allowed: true, blockedIngredients: [], reason: '' };
    }

    const blockedIngredients: string[] = [];

    for (const ingredient of ingredientList) {
      const flags = this.allergenManager.flagAllergens(ingredient);
      const hasMatchingAllergen = flags.some((f) => userAllergenProfile.includes(f.allergen));
      if (hasMatchingAllergen) {
        blockedIngredients.push(ingredient);
      }
    }

    if (blockedIngredients.length > 0) {
      return {
        allowed: false,
        blockedIngredients,
        reason:
          'Recipe contains ingredient(s) with declared allergens: ' + blockedIngredients.join(', '),
      };
    }

    return { allowed: true, blockedIngredients: [], reason: '' };
  }

  /**
   * REDIRECT MODE: Provide substitution guidance for an allergen-containing ingredient.
   *
   * @param ingredient - The ingredient to find substitutions for
   * @returns Redirect result with substitution options and guidance
   */
  redirect(ingredient: string): AllergenRedirectResult {
    const substitutions = this.allergenManager.getSubstitutions(ingredient);

    if (substitutions.length > 0) {
      return {
        redirected: true,
        originalIngredient: ingredient,
        substitutions,
        guidance:
          'Consider the following allergen-free or lower-allergen alternatives. ' +
          'Always check labels — allergen content of substitutes may vary by brand.',
      };
    }

    return {
      redirected: false,
      originalIngredient: ingredient,
      substitutions: [],
      guidance:
        'No pre-mapped substitutions available. Consult a registered dietitian for personalized allergen-free alternatives.',
    };
  }

  /**
   * CHECK ALLERGEN: Check if an allergen is in the FDA Big 9 list.
   *
   * @param allergen - The allergen to check
   * @returns Result with present status and Big 9 warning if applicable
   */
  checkAllergen(allergen: string): { present: boolean; ingredients: string[]; warning: string } {
    const lower = allergen.toLowerCase();
    if (BIG_9_ALLERGENS.includes(lower)) {
      return {
        present: true,
        ingredients: [allergen],
        warning:
          'This is one of the FDA Big 9 major allergens. Always check labels and communicate allergen needs to food service staff.',
      };
    }

    return { present: false, ingredients: [], warning: '' };
  }
}
