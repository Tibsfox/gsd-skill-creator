/**
 * Token budget estimator for the resource analysis pipeline.
 *
 * Computes token budget breakdown across 7 categories based on
 * complexity level, topology type, requirement count, and skill count.
 * Pure function with no I/O -- deterministic output from inputs.
 *
 * @module staging/resource/budget
 */

import type {
  ComplexityLevel,
  TopologyType,
  BudgetCategory,
  TokenBudgetBreakdown,
} from './types.js';
import { BUDGET_CATEGORIES } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Default context window size in tokens. */
const DEFAULT_CONTEXT_WINDOW = 200_000;

/** Minimum safety margin as percentage of context window (0-1). */
const MIN_SAFETY_MARGIN_PERCENT = 0.05;

/** Maximum skill-loading allocation as percentage of utilized budget (0-1). */
const MAX_SKILL_LOADING_PERCENT = 0.20;

/** Base utilization targets by complexity level. */
const UTILIZATION_TARGETS: Record<ComplexityLevel, number> = {
  low: 0.40,
  medium: 0.55,
  high: 0.70,
  critical: 0.80,
};

// ============================================================================
// Types
// ============================================================================

/** Options for budget estimation. */
export interface BudgetEstimateOptions {
  /** Complexity level of the work. */
  complexity: ComplexityLevel;
  /** Topology type for agent execution. */
  topology: TopologyType;
  /** Number of extracted requirements. */
  requirementCount: number;
  /** Number of matched skills. */
  skillCount: number;
  /** Context window size in tokens (defaults to 200,000). */
  contextWindowSize?: number;
}

// ============================================================================
// Budget Estimation
// ============================================================================

/**
 * Compute base category proportions (of utilized budget) given options.
 *
 * Returns raw proportions before normalization. Categories:
 * - skill-loading: 5% base + 2% per matched skill (cap 20%)
 * - planning: 15% base + 5% if topology != 'single'
 * - execution: 40% base (the bulk)
 * - research: 5% base + 10% if complexity >= 'high'
 * - verification: 10% base + 5% if complexity >= 'medium'
 * - hitl: 5% base + 5% if topology is 'hybrid' or 'router'
 * - safety-margin: remainder (min 5% of context window)
 */
function computeProportions(options: BudgetEstimateOptions): Record<BudgetCategory, number> {
  const { complexity, topology, skillCount } = options;

  // Skill loading: 5% base + 2% per skill, capped at 20%
  const skillLoading = Math.min(
    0.05 + 0.02 * skillCount,
    MAX_SKILL_LOADING_PERCENT,
  );

  // Planning: 15% base + 5% if not single agent
  const planning = topology !== 'single' ? 0.20 : 0.15;

  // Execution: 40% base (always the bulk)
  const execution = 0.40;

  // Research: 5% base + 10% if complexity >= high
  const isHighComplexity = complexity === 'high' || complexity === 'critical';
  const research = isHighComplexity ? 0.15 : 0.05;

  // Verification: 10% base + 5% if complexity >= medium
  const isMediumPlus = complexity !== 'low';
  const verification = isMediumPlus ? 0.15 : 0.10;

  // HITL: 5% base + 5% if topology is hybrid or router
  const isInteractiveTopology = topology === 'hybrid' || topology === 'router';
  const hitl = isInteractiveTopology ? 0.10 : 0.05;

  // Safety margin: placeholder (will be computed as remainder)
  const safetyMargin = 0;

  return {
    'skill-loading': skillLoading,
    'planning': planning,
    'execution': execution,
    'research': research,
    'verification': verification,
    'hitl': hitl,
    'safety-margin': safetyMargin,
  };
}

/**
 * Estimate token budget breakdown across categories.
 *
 * Algorithm:
 * 1. Compute total = contextWindowSize * utilization target
 * 2. Compute raw proportions for each category
 * 3. Ensure safety margin is at least 5% of context window
 * 4. Normalize so all categories sum to total
 *
 * @param options - Budget estimation parameters
 * @returns Token budget breakdown with categories summing to total
 */
export function estimateBudget(options: BudgetEstimateOptions): TokenBudgetBreakdown {
  const contextWindowSize = options.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW;
  const utilizationTarget = UTILIZATION_TARGETS[options.complexity];
  const total = Math.round(contextWindowSize * utilizationTarget);

  // Minimum safety margin in tokens
  const minSafetyTokens = Math.round(contextWindowSize * MIN_SAFETY_MARGIN_PERCENT);

  // Get raw proportions (excludes safety margin)
  const proportions = computeProportions(options);

  // Sum of non-safety proportions
  const nonSafetyCategories = BUDGET_CATEGORIES.filter(
    (c) => c !== 'safety-margin',
  );
  const rawSum = nonSafetyCategories.reduce(
    (sum, cat) => sum + proportions[cat],
    0,
  );

  // Allocate safety margin first (at least minSafetyTokens)
  // Remaining budget goes to other categories
  const remainingBudget = total - minSafetyTokens;

  // Distribute remaining budget across non-safety categories proportionally
  const categories: Record<string, number> = {};
  for (const cat of nonSafetyCategories) {
    categories[cat] = Math.round((proportions[cat] / rawSum) * remainingBudget);
  }

  // Compute actual non-safety total after rounding
  const allocatedNonSafety = nonSafetyCategories.reduce(
    (sum, cat) => sum + categories[cat],
    0,
  );

  // Safety margin gets whatever remains to make categories sum exactly to total
  categories['safety-margin'] = total - allocatedNonSafety;

  // Final safety check: if rounding pushed safety below minimum, redistribute
  if (categories['safety-margin'] < minSafetyTokens) {
    const deficit = minSafetyTokens - categories['safety-margin'];
    categories['safety-margin'] = minSafetyTokens;

    // Remove deficit proportionally from non-safety categories
    const currentNonSafety = nonSafetyCategories.reduce(
      (sum, cat) => sum + categories[cat],
      0,
    );
    for (const cat of nonSafetyCategories) {
      const proportion = categories[cat] / currentNonSafety;
      categories[cat] = Math.round(categories[cat] - deficit * proportion);
    }

    // Fix any rounding error
    const newNonSafety = nonSafetyCategories.reduce(
      (sum, cat) => sum + categories[cat],
      0,
    );
    const rounding = total - newNonSafety - categories['safety-margin'];
    if (rounding !== 0) {
      // Apply rounding correction to execution (largest category)
      categories['execution'] += rounding;
    }
  }

  const utilizationPercent = (total / contextWindowSize) * 100;

  return {
    total,
    categories: categories as Record<BudgetCategory, number>,
    contextWindowSize,
    utilizationPercent,
  };
}
