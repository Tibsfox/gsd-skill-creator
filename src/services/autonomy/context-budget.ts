/**
 * Context budget estimator.
 *
 * Tracks estimated token usage using observable heuristics (files read,
 * files written, subversion count) and triggers a pause when usage
 * exceeds the configurable threshold.
 *
 * All functions are pure — no I/O, no side effects. The autonomy engine
 * calls these functions and decides what to do with the results.
 *
 * @module autonomy/context-budget
 */

import type { ContextBudget } from './types.js';

// ============================================================================
// Named Constants
// ============================================================================

/** Estimated tokens consumed per file read operation */
export const TOKENS_PER_FILE_READ = 2000;

/** Estimated tokens consumed per file write operation */
export const TOKENS_PER_FILE_WRITE = 1000;

/** Estimated tokens consumed per subversion execution */
export const TOKENS_PER_SUBVERSION = 5000;

/** Base session overhead in tokens (system prompt, tools, etc.) */
export const SESSION_OVERHEAD = 15000;

/** Default maximum token budget for a context window */
export const DEFAULT_MAX_TOKENS = 200000;

/** Default threshold percentage that triggers pause */
export const DEFAULT_THRESHOLD = 80;

/** Default average tokens per subversion when none completed */
const DEFAULT_AVG_PER_SUBVERSION = 10000;

// ============================================================================
// Types
// ============================================================================

/** Input metrics for the budget estimator */
export interface BudgetMetrics {
  /** Number of file read operations observed */
  filesRead: number;
  /** Number of file write operations observed */
  filesWritten: number;
  /** Number of subversions completed */
  subversionsCompleted: number;
  /** Override max token budget (default: 200000) */
  maxTokens?: number;
  /** Override threshold percentage (default: 80) */
  thresholdPercent?: number;
}

/** Decision result from threshold check */
export interface PauseDecision {
  /** Whether the executor should pause */
  pause: boolean;
  /** Human-readable reason for pausing (only when pause=true) */
  reason?: string;
}

/** Remaining capacity estimate */
export interface RemainingCapacity {
  /** Estimated tokens remaining before max */
  remainingTokens: number;
  /** Average tokens consumed per subversion */
  avgTokensPerSubversion: number;
  /** Estimated number of subversions that can still fit */
  canFitMore: number;
}

// ============================================================================
// estimateTokenUsage
// ============================================================================

/**
 * Estimate total token usage from observed metrics.
 *
 * Formula: (filesRead * 2000) + (filesWritten * 1000) +
 *          (subversionsCompleted * 5000) + 15000 (session overhead)
 */
export function estimateTokenUsage(metrics: BudgetMetrics): number {
  return (
    metrics.filesRead * TOKENS_PER_FILE_READ +
    metrics.filesWritten * TOKENS_PER_FILE_WRITE +
    metrics.subversionsCompleted * TOKENS_PER_SUBVERSION +
    SESSION_OVERHEAD
  );
}

// ============================================================================
// estimateContextBudget
// ============================================================================

/**
 * Build a full ContextBudget from observed metrics.
 *
 * Usage percentage is capped at 100 for display, but raw estimated_tokens
 * can exceed max_tokens.
 */
export function estimateContextBudget(metrics: BudgetMetrics): ContextBudget {
  const estimatedTokens = estimateTokenUsage(metrics);
  const maxTokens = metrics.maxTokens ?? DEFAULT_MAX_TOKENS;
  const thresholdPercent = metrics.thresholdPercent ?? DEFAULT_THRESHOLD;
  const rawPercent = (estimatedTokens / maxTokens) * 100;
  const usagePercent = Math.min(rawPercent, 100);

  return {
    estimated_tokens: estimatedTokens,
    max_tokens: maxTokens,
    usage_percent: usagePercent,
    threshold_percent: thresholdPercent,
    last_measured_at: new Date().toISOString(),
  };
}

// ============================================================================
// shouldPause
// ============================================================================

/**
 * Determine whether the executor should pause based on budget threshold.
 *
 * Returns pause=true with a descriptive reason when usage_percent >= threshold_percent.
 */
export function shouldPause(budget: Pick<ContextBudget, 'usage_percent' | 'threshold_percent' | 'estimated_tokens' | 'max_tokens'>): PauseDecision {
  if (budget.usage_percent >= budget.threshold_percent) {
    return {
      pause: true,
      reason: `Context usage at ${budget.usage_percent}% (threshold: ${budget.threshold_percent}%). Estimated ${budget.estimated_tokens} tokens used of ${budget.max_tokens} max.`,
    };
  }
  return { pause: false };
}

// ============================================================================
// estimateRemainingCapacity
// ============================================================================

/**
 * Estimate remaining capacity in tokens and subversions.
 *
 * Uses average tokens per completed subversion to project how many more
 * subversions can fit in the remaining budget. Zero subversions completed
 * uses a default of 10K tokens per subversion.
 */
export function estimateRemainingCapacity(
  budget: Pick<ContextBudget, 'estimated_tokens' | 'max_tokens'>,
  subversionsCompleted: number,
): RemainingCapacity {
  const remainingTokens = Math.max(0, budget.max_tokens - budget.estimated_tokens);
  const avgTokensPerSubversion =
    subversionsCompleted > 0
      ? budget.estimated_tokens / subversionsCompleted
      : DEFAULT_AVG_PER_SUBVERSION;
  const canFitMore = Math.floor(remainingTokens / avgTokensPerSubversion);

  return {
    remainingTokens,
    avgTokensPerSubversion,
    canFitMore,
  };
}

// ============================================================================
// formatBudgetReport
// ============================================================================

/**
 * Format a human-readable budget report with visual bar.
 *
 * Example: "Context: [████████░░] 82% | 164K/200K tokens | ~3 subversions remaining"
 */
export function formatBudgetReport(
  budget: Pick<ContextBudget, 'usage_percent' | 'estimated_tokens' | 'max_tokens'>,
  remaining: RemainingCapacity,
): string {
  const barLength = 10;
  const filled = Math.round((budget.usage_percent / 100) * barLength);
  const empty = barLength - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);

  const usedK = Math.round(budget.estimated_tokens / 1000);
  const maxK = Math.round(budget.max_tokens / 1000);

  return `Context: [${bar}] ${budget.usage_percent}% | ${usedK}K/${maxK}K tokens | ~${remaining.canFitMore} subversions remaining`;
}
