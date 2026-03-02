/**
 * Nutrition allergen safety boundaries extending the AllergenManager with
 * numeric and content-based safety limits.
 *
 * Defines SafetyBoundary entries for allergen storage, trace thresholds,
 * and label review requirements, compatible with SafetyWarden.registerBoundaries().
 *
 * @module departments/nutrition/safety/nutrition-allergen-boundaries
 */

import type { SafetyBoundary } from '../../../rosetta-core/types.js';

/**
 * Numeric allergen safety boundaries for the SafetyWarden.
 *
 * Polarity notes:
 * - 'cross_contamination_storage_hours': 'storage' in name → upper-limit
 *   (proposed <= limit is safe). Limit=0 means any co-storage time is unsafe.
 * - 'trace_allergen_threshold_ppm': no time/zone/storage/hours → lower-limit
 *   (proposed >= limit is safe). Represents minimum ppm detection sensitivity.
 *   Note: For FDA gluten-free (<20 ppm), use headroom: ppm_headroom = 20 - actual.
 *   If actual=25, headroom=-5, -5 >= 0 is false → violation. Register as a
 *   'trace_allergen_threshold_ppm' absolute boundary.
 * - 'label_review_time_hours': 'hours' in name → upper-limit. Limit=0 means
 *   flagged as warning immediately — always review labels.
 */
export const NUTRITION_ALLERGEN_BOUNDARIES: SafetyBoundary[] = [
  {
    parameter: 'cross_contamination_storage_hours',
    limit: 0,
    type: 'absolute' as const,
    reason:
      'Foods stored with major allergens have zero tolerance for cross-contamination — store separately',
  },
  {
    parameter: 'trace_allergen_threshold_ppm',
    limit: 20,
    type: 'absolute' as const,
    reason:
      'FDA gluten threshold: foods must contain less than 20 ppm to be labeled gluten-free; trace allergen thresholds for sensitive individuals',
  },
  {
    parameter: 'label_review_time_hours',
    limit: 0,
    type: 'warning' as const,
    reason:
      'Allergen label review is non-negotiable — always read ingredient labels even for familiar products (formulations change)',
  },
];

/**
 * The FDA Big 9 major food allergens as of January 2023 (FALCPA + FASTER Act).
 * Sesame was added as the 9th major allergen effective January 1, 2023.
 */
export const BIG_9_ALLERGENS: string[] = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree-nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame',
];
