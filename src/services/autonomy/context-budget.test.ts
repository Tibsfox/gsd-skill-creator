/**
 * Tests for context budget estimator.
 *
 * Covers:
 * - estimateTokenUsage: formula with named constants
 * - estimateContextBudget: full ContextBudget construction
 * - shouldPause: threshold comparison
 * - estimateRemainingCapacity: remaining tokens and subversion estimate
 * - formatBudgetReport: visual bar and human-readable output
 * - Edge cases: zero subversions, zero metrics, over 100% usage
 */

import { describe, it, expect } from 'vitest';
import {
  estimateTokenUsage,
  estimateContextBudget,
  shouldPause,
  estimateRemainingCapacity,
  formatBudgetReport,
  TOKENS_PER_FILE_READ,
  TOKENS_PER_FILE_WRITE,
  TOKENS_PER_SUBVERSION,
  SESSION_OVERHEAD,
  DEFAULT_MAX_TOKENS,
  DEFAULT_THRESHOLD,
} from './context-budget.js';
import type { BudgetMetrics, PauseDecision, RemainingCapacity } from './context-budget.js';

// ============================================================================
// Named constants
// ============================================================================

describe('named constants', () => {
  it('should export TOKENS_PER_FILE_READ as 2000', () => {
    expect(TOKENS_PER_FILE_READ).toBe(2000);
  });

  it('should export TOKENS_PER_FILE_WRITE as 1000', () => {
    expect(TOKENS_PER_FILE_WRITE).toBe(1000);
  });

  it('should export TOKENS_PER_SUBVERSION as 5000', () => {
    expect(TOKENS_PER_SUBVERSION).toBe(5000);
  });

  it('should export SESSION_OVERHEAD as 15000', () => {
    expect(SESSION_OVERHEAD).toBe(15000);
  });

  it('should export DEFAULT_MAX_TOKENS as 200000', () => {
    expect(DEFAULT_MAX_TOKENS).toBe(200000);
  });

  it('should export DEFAULT_THRESHOLD as 80', () => {
    expect(DEFAULT_THRESHOLD).toBe(80);
  });
});

// ============================================================================
// estimateTokenUsage
// ============================================================================

describe('estimateTokenUsage', () => {
  it('should calculate tokens using the formula', () => {
    const metrics: BudgetMetrics = {
      filesRead: 10,
      filesWritten: 5,
      subversionsCompleted: 3,
    };
    // (10 * 2000) + (5 * 1000) + (3 * 5000) + 15000 = 20000 + 5000 + 15000 + 15000 = 55000
    expect(estimateTokenUsage(metrics)).toBe(55000);
  });

  it('should return session overhead for zero metrics', () => {
    const metrics: BudgetMetrics = {
      filesRead: 0,
      filesWritten: 0,
      subversionsCompleted: 0,
    };
    expect(estimateTokenUsage(metrics)).toBe(SESSION_OVERHEAD);
  });

  it('should handle large values', () => {
    const metrics: BudgetMetrics = {
      filesRead: 100,
      filesWritten: 50,
      subversionsCompleted: 30,
    };
    // (100 * 2000) + (50 * 1000) + (30 * 5000) + 15000 = 200000 + 50000 + 150000 + 15000 = 415000
    expect(estimateTokenUsage(metrics)).toBe(415000);
  });
});

// ============================================================================
// estimateContextBudget
// ============================================================================

describe('estimateContextBudget', () => {
  it('should populate all ContextBudget fields', () => {
    const metrics: BudgetMetrics = {
      filesRead: 20,
      filesWritten: 10,
      subversionsCompleted: 5,
    };
    const budget = estimateContextBudget(metrics);

    expect(budget.estimated_tokens).toBeDefined();
    expect(budget.max_tokens).toBe(DEFAULT_MAX_TOKENS);
    expect(budget.usage_percent).toBeDefined();
    expect(budget.threshold_percent).toBe(DEFAULT_THRESHOLD);
    expect(budget.last_measured_at).toBeDefined();
  });

  it('should use custom max_tokens when provided', () => {
    const metrics: BudgetMetrics = {
      filesRead: 5,
      filesWritten: 3,
      subversionsCompleted: 2,
      maxTokens: 100000,
    };
    const budget = estimateContextBudget(metrics);
    expect(budget.max_tokens).toBe(100000);
  });

  it('should use custom threshold when provided', () => {
    const metrics: BudgetMetrics = {
      filesRead: 5,
      filesWritten: 3,
      subversionsCompleted: 2,
      thresholdPercent: 90,
    };
    const budget = estimateContextBudget(metrics);
    expect(budget.threshold_percent).toBe(90);
  });

  it('should cap usage_percent at 100', () => {
    const metrics: BudgetMetrics = {
      filesRead: 100,
      filesWritten: 50,
      subversionsCompleted: 30,
      maxTokens: 100000,
    };
    const budget = estimateContextBudget(metrics);
    expect(budget.usage_percent).toBe(100);
    // But raw tokens can exceed max
    expect(budget.estimated_tokens).toBeGreaterThan(100000);
  });

  it('should calculate correct percentage', () => {
    const metrics: BudgetMetrics = {
      filesRead: 10,
      filesWritten: 5,
      subversionsCompleted: 3,
      maxTokens: 200000,
    };
    const budget = estimateContextBudget(metrics);
    // 55000 / 200000 * 100 = 27.5
    expect(budget.usage_percent).toBeCloseTo(27.5, 10);
  });
});

// ============================================================================
// shouldPause
// ============================================================================

describe('shouldPause', () => {
  it('should return pause: true when usage exceeds threshold', () => {
    const budget = {
      estimated_tokens: 170000,
      max_tokens: 200000,
      usage_percent: 85,
      threshold_percent: 80,
    };
    const result = shouldPause(budget);
    expect(result.pause).toBe(true);
    expect(result.reason).toBeDefined();
    expect(result.reason).toContain('85%');
    expect(result.reason).toContain('80%');
  });

  it('should return pause: false when usage is below threshold', () => {
    const budget = {
      estimated_tokens: 100000,
      max_tokens: 200000,
      usage_percent: 50,
      threshold_percent: 80,
    };
    const result = shouldPause(budget);
    expect(result.pause).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('should return pause: true when usage equals threshold', () => {
    const budget = {
      estimated_tokens: 160000,
      max_tokens: 200000,
      usage_percent: 80,
      threshold_percent: 80,
    };
    const result = shouldPause(budget);
    expect(result.pause).toBe(true);
  });
});

// ============================================================================
// estimateRemainingCapacity
// ============================================================================

describe('estimateRemainingCapacity', () => {
  it('should calculate remaining tokens', () => {
    const budget = {
      estimated_tokens: 100000,
      max_tokens: 200000,
      usage_percent: 50,
      threshold_percent: 80,
    };
    const result = estimateRemainingCapacity(budget, 10);
    expect(result.remainingTokens).toBe(100000);
  });

  it('should calculate average tokens per subversion', () => {
    const budget = {
      estimated_tokens: 100000,
      max_tokens: 200000,
      usage_percent: 50,
      threshold_percent: 80,
    };
    const result = estimateRemainingCapacity(budget, 10);
    expect(result.avgTokensPerSubversion).toBe(10000);
  });

  it('should estimate remaining subversions', () => {
    const budget = {
      estimated_tokens: 100000,
      max_tokens: 200000,
      usage_percent: 50,
      threshold_percent: 80,
    };
    const result = estimateRemainingCapacity(budget, 10);
    expect(result.canFitMore).toBe(10);
  });

  it('should use default 10K avg when zero subversions completed', () => {
    const budget = {
      estimated_tokens: 15000,
      max_tokens: 200000,
      usage_percent: 7.5,
      threshold_percent: 80,
    };
    const result = estimateRemainingCapacity(budget, 0);
    expect(result.avgTokensPerSubversion).toBe(10000);
    expect(result.remainingTokens).toBe(185000);
  });

  it('should floor remaining tokens at 0', () => {
    const budget = {
      estimated_tokens: 250000,
      max_tokens: 200000,
      usage_percent: 100,
      threshold_percent: 80,
    };
    const result = estimateRemainingCapacity(budget, 10);
    expect(result.remainingTokens).toBe(0);
    expect(result.canFitMore).toBe(0);
  });
});

// ============================================================================
// formatBudgetReport
// ============================================================================

describe('formatBudgetReport', () => {
  it('should include visual bar', () => {
    const budget = {
      estimated_tokens: 164000,
      max_tokens: 200000,
      usage_percent: 82,
      threshold_percent: 80,
    };
    const remaining: RemainingCapacity = {
      remainingTokens: 36000,
      avgTokensPerSubversion: 10000,
      canFitMore: 3,
    };
    const report = formatBudgetReport(budget, remaining);
    expect(report).toMatch(/[\u2588\u2591]/); // filled/empty block chars
  });

  it('should include percentage', () => {
    const budget = {
      estimated_tokens: 100000,
      max_tokens: 200000,
      usage_percent: 50,
      threshold_percent: 80,
    };
    const remaining: RemainingCapacity = {
      remainingTokens: 100000,
      avgTokensPerSubversion: 10000,
      canFitMore: 10,
    };
    const report = formatBudgetReport(budget, remaining);
    expect(report).toContain('50%');
  });

  it('should include token counts in K format', () => {
    const budget = {
      estimated_tokens: 164000,
      max_tokens: 200000,
      usage_percent: 82,
      threshold_percent: 80,
    };
    const remaining: RemainingCapacity = {
      remainingTokens: 36000,
      avgTokensPerSubversion: 10000,
      canFitMore: 3,
    };
    const report = formatBudgetReport(budget, remaining);
    expect(report).toContain('164K');
    expect(report).toContain('200K');
  });

  it('should include remaining subversion estimate', () => {
    const budget = {
      estimated_tokens: 164000,
      max_tokens: 200000,
      usage_percent: 82,
      threshold_percent: 80,
    };
    const remaining: RemainingCapacity = {
      remainingTokens: 36000,
      avgTokensPerSubversion: 10000,
      canFitMore: 3,
    };
    const report = formatBudgetReport(budget, remaining);
    expect(report).toContain('3');
    expect(report).toContain('remaining');
  });
});
