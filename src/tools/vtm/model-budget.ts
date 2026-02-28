/**
 * Budget validator and auto-rebalancer for model assignments.
 *
 * Enforces the 60/40 principle across model assignments within a phase:
 * ~55-65% Sonnet, ~25-35% Opus, ~5-15% Haiku by token volume.
 *
 * When violations are detected, the auto-rebalancer downgrades the smallest
 * unpinned tasks first (opus -> sonnet -> haiku) to restore compliance.
 * User-pinned tasks are never modified during rebalancing.
 *
 * Exports:
 * - validateBudget(): checks task allocations against BUDGET_RANGES
 * - rebalanceAssignments(): iteratively downgrades to restore compliance
 *
 * @module vtm/model-budget
 */

import { BUDGET_RANGES, type ModelAssignment, type TokenBudgetConstraint } from './types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Input task for budget validation. */
export interface BudgetTask {
  model: ModelAssignment;
  estimatedTokens: number;
  pinned?: boolean;
}

/** A single budget violation. */
export interface BudgetViolation {
  tier: ModelAssignment;
  actualPercent: number;
  expectedMin: number;
  expectedMax: number;
  direction: 'over' | 'under';
}

/** Result of budget validation. */
export interface BudgetValidationResult {
  valid: boolean;
  violations: BudgetViolation[];
  allocation: { opus: number; sonnet: number; haiku: number };
  pinnedTokens: { opus: number; sonnet: number; haiku: number };
}

/** A single rebalance change. */
export interface RebalanceChange {
  taskIndex: number;
  from: ModelAssignment;
  to: ModelAssignment;
}

/** Result of auto-rebalance. */
export interface RebalanceResult {
  tasks: BudgetTask[];
  changes: RebalanceChange[];
  warning?: string;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Tier ordering for downgrade direction: opus -> sonnet -> haiku. */
const TIER_ORDER: ModelAssignment[] = ['opus', 'sonnet', 'haiku'];

/** Maximum rebalance iterations to prevent infinite loops. */
const MAX_ITERATIONS = 50;

// ---------------------------------------------------------------------------
// validateBudget
// ---------------------------------------------------------------------------

/**
 * Validate task allocations against budget constraint ranges.
 *
 * Single-task phases (length <= 1) are exempt and always valid.
 * Empty arrays are also valid.
 *
 * Pinned tasks are included in percentage calculations but their
 * token totals are tracked separately in the result.
 *
 * @param tasks - Array of budget tasks to validate
 * @param budgetRanges - Optional custom ranges (defaults to BUDGET_RANGES)
 * @returns Validation result with violations, allocation percentages, and pinned info
 */
export function validateBudget(
  tasks: BudgetTask[],
  budgetRanges: TokenBudgetConstraint = BUDGET_RANGES,
): BudgetValidationResult {
  const allocation = { opus: 0, sonnet: 0, haiku: 0 };
  const pinnedTokens = { opus: 0, sonnet: 0, haiku: 0 };

  // Empty or single-task phases are exempt
  if (tasks.length <= 1) {
    return { valid: true, violations: [], allocation, pinnedTokens };
  }

  // Compute total tokens
  const totalTokens = tasks.reduce((sum, t) => sum + t.estimatedTokens, 0);

  if (totalTokens === 0) {
    return { valid: true, violations: [], allocation, pinnedTokens };
  }

  // Compute per-tier token totals
  const tierTokens = { opus: 0, sonnet: 0, haiku: 0 };
  for (const t of tasks) {
    tierTokens[t.model] += t.estimatedTokens;
    if (t.pinned) {
      pinnedTokens[t.model] += t.estimatedTokens;
    }
  }

  // Compute percentages
  for (const tier of TIER_ORDER) {
    allocation[tier] = (tierTokens[tier] / totalTokens) * 100;
  }

  // Check each tier against budget ranges
  const violations: BudgetViolation[] = [];
  for (const tier of TIER_ORDER) {
    const range = budgetRanges[tier];
    const actual = allocation[tier];

    if (actual < range.min) {
      violations.push({
        tier,
        actualPercent: actual,
        expectedMin: range.min,
        expectedMax: range.max,
        direction: 'under',
      });
    } else if (actual > range.max) {
      violations.push({
        tier,
        actualPercent: actual,
        expectedMin: range.min,
        expectedMax: range.max,
        direction: 'over',
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    allocation,
    pinnedTokens,
  };
}

// ---------------------------------------------------------------------------
// rebalanceAssignments
// ---------------------------------------------------------------------------

/**
 * Auto-rebalance model assignments to satisfy budget constraints.
 *
 * Strategy: iteratively find the most pressing violation, then downgrade
 * the smallest unpinned task from the over-budget tier (or from a higher
 * tier contributing to over-budget when a lower tier is under).
 *
 * Downgrade direction is always opus -> sonnet -> haiku (never upgrade).
 * Pinned tasks are never modified. When all movable tasks are pinned,
 * returns unchanged assignments with a warning.
 *
 * Determinism: tasks of equal size use original array index as tiebreaker
 * (stable sort).
 *
 * @param tasks - Array of budget tasks to rebalance
 * @param budgetRanges - Optional custom ranges (defaults to BUDGET_RANGES)
 * @returns Rebalance result with modified tasks, changes, and optional warning
 */
export function rebalanceAssignments(
  tasks: BudgetTask[],
  budgetRanges: TokenBudgetConstraint = BUDGET_RANGES,
): RebalanceResult {
  // Deep copy tasks (don't mutate input)
  const workingTasks: BudgetTask[] = tasks.map(t => ({ ...t }));
  const changes: RebalanceChange[] = [];

  // Check if there are any non-pinned tasks to work with
  const hasMovable = workingTasks.some(t => !t.pinned);
  if (!hasMovable) {
    const validation = validateBudget(workingTasks, budgetRanges);
    if (!validation.valid) {
      return {
        tasks: workingTasks,
        changes: [],
        warning: 'All tasks are pinned; cannot rebalance to satisfy budget constraints.',
      };
    }
    return { tasks: workingTasks, changes: [] };
  }

  // Iterative rebalancing
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const validation = validateBudget(workingTasks, budgetRanges);
    if (validation.valid) break;

    // Sort violations by deviation (largest first) to prioritize most pressing
    const sortedViolations = [...validation.violations]
      .map(v => ({
        violation: v,
        deviation: v.direction === 'over'
          ? v.actualPercent - v.expectedMax
          : v.expectedMin - v.actualPercent,
      }))
      .sort((a, b) => b.deviation - a.deviation);

    if (sortedViolations.length === 0) break;

    let moved = false;

    // Try each violation in priority order until one can be addressed
    for (const { violation } of sortedViolations) {
      if (violation.direction === 'over') {
        // Tier is over budget: downgrade smallest unpinned task in that tier
        moved = downgradeSmallestInTier(workingTasks, violation.tier, changes);
      } else {
        // Tier is under budget: find a higher tier that has an 'over' violation
        // and downgrade the smallest task from that higher tier toward this tier
        const higherTiers = getHigherTiers(violation.tier);

        // Prefer tiers that are currently over their max
        for (const higherTier of higherTiers) {
          const higherOverBudget = validation.violations.some(
            v => v.tier === higherTier && v.direction === 'over',
          );
          if (higherOverBudget) {
            moved = downgradeSmallestInTier(workingTasks, higherTier, changes);
            if (moved) break;
          }
        }

        // If no higher tier is explicitly over budget, still try to downgrade
        // from any higher tier that has unpinned tasks
        if (!moved) {
          for (const higherTier of higherTiers) {
            moved = downgradeSmallestInTier(workingTasks, higherTier, changes);
            if (moved) break;
          }
        }
      }

      if (moved) break;
    }

    if (!moved) {
      // No violation could be addressed -- unfixable constraints remain
      return {
        tasks: workingTasks,
        changes,
        warning: 'Unable to fully rebalance: some violations cannot be resolved with downgrade-only strategy.',
      };
    }
  }

  // Final check: if still invalid after max iterations, add warning
  const finalValidation = validateBudget(workingTasks, budgetRanges);
  if (!finalValidation.valid) {
    return {
      tasks: workingTasks,
      changes,
      warning: 'Unable to fully rebalance: some violations cannot be resolved with downgrade-only strategy.',
    };
  }

  return { tasks: workingTasks, changes };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Get tiers that are higher (more expensive) than the given tier.
 * Order: opus > sonnet > haiku, so higher tiers are those earlier in TIER_ORDER.
 */
function getHigherTiers(tier: ModelAssignment): ModelAssignment[] {
  const idx = TIER_ORDER.indexOf(tier);
  return TIER_ORDER.slice(0, idx);
}

/**
 * Get the next lower tier for downgrade.
 * opus -> sonnet, sonnet -> haiku, haiku -> null (can't downgrade further).
 */
function getNextLowerTier(tier: ModelAssignment): ModelAssignment | null {
  const idx = TIER_ORDER.indexOf(tier);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

/**
 * Find the smallest unpinned task in the given tier and downgrade it
 * to the next lower tier.
 *
 * Uses stable sort: tasks of equal estimatedTokens are ordered by their
 * original index (lower index first).
 *
 * @returns true if a task was downgraded, false otherwise
 */
function downgradeSmallestInTier(
  tasks: BudgetTask[],
  tier: ModelAssignment,
  changes: RebalanceChange[],
): boolean {
  const nextTier = getNextLowerTier(tier);
  if (!nextTier) return false;

  // Collect unpinned tasks in this tier with their original indices
  const candidates: Array<{ index: number; tokens: number }> = [];
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].model === tier && !tasks[i].pinned) {
      candidates.push({ index: i, tokens: tasks[i].estimatedTokens });
    }
  }

  if (candidates.length === 0) return false;

  // Stable sort by tokens ascending, tiebreak by index ascending
  candidates.sort((a, b) => a.tokens - b.tokens || a.index - b.index);

  // Downgrade the smallest
  const target = candidates[0];
  const from = tasks[target.index].model;
  tasks[target.index] = { ...tasks[target.index], model: nextTier };
  changes.push({ taskIndex: target.index, from, to: nextTier });

  return true;
}
