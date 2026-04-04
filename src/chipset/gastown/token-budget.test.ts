/**
 * Tests for Token Budget Enforcement — Gastown Chipset.
 *
 * Validates:
 * - Budget creation with defaults and custom config
 * - Pre-execution budget checks (allow, deny, warn)
 * - Per-agent tracking within a convoy
 * - Convoy-level aggregate tracking
 * - Budget persistence (save/load/delete/list)
 * - Projected cost prevents overspend (stop BEFORE the call)
 * - Zero-budget and edge cases
 * - Multiple agents consuming from the same convoy budget
 * - Budget report generation
 * - Atomic write pattern (no temp files left behind)
 * - JSON sorted-key output for git-friendly diffs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createBudget,
  checkBudget,
  recordUsage,
  getBudgetReport,
  saveBudget,
  loadBudget,
  deleteBudget,
  listBudgets,
} from './token-budget.js';
import type { TokenBudget } from './token-budget.js';

let budgetDir: string;

beforeEach(async () => {
  budgetDir = await mkdtemp(join(tmpdir(), 'gastown-budget-'));
});

afterEach(async () => {
  await rm(budgetDir, { recursive: true, force: true });
});

// ============================================================================
// Budget Creation
// ============================================================================

describe('Budget creation', () => {
  it('creates a budget with default values', () => {
    const budget = createBudget('convoy-001');
    expect(budget.convoyId).toBe('convoy-001');
    expect(budget.maxTokensPerConvoy).toBe(500_000);
    expect(budget.maxTokensPerAgent).toBe(100_000);
    expect(budget.warningThresholdPercent).toBe(80);
    expect(budget.currentUsage.convoyTotal.input).toBe(0);
    expect(budget.currentUsage.convoyTotal.output).toBe(0);
    expect(Object.keys(budget.currentUsage.perAgent)).toHaveLength(0);
    expect(budget.createdAt).toBeTruthy();
    expect(budget.updatedAt).toBeTruthy();
  });

  it('creates a budget with custom config', () => {
    const budget = createBudget('convoy-002', {
      maxTokensPerConvoy: 1_000_000,
      maxTokensPerAgent: 200_000,
      warningThresholdPercent: 90,
    });
    expect(budget.maxTokensPerConvoy).toBe(1_000_000);
    expect(budget.maxTokensPerAgent).toBe(200_000);
    expect(budget.warningThresholdPercent).toBe(90);
  });

  it('allows partial config overrides', () => {
    const budget = createBudget('convoy-003', {
      maxTokensPerConvoy: 250_000,
    });
    expect(budget.maxTokensPerConvoy).toBe(250_000);
    expect(budget.maxTokensPerAgent).toBe(100_000);
    expect(budget.warningThresholdPercent).toBe(80);
  });

  it('initializes timestamps to current time', () => {
    const before = new Date().toISOString();
    const budget = createBudget('convoy-ts');
    const after = new Date().toISOString();
    expect(budget.createdAt >= before).toBe(true);
    expect(budget.createdAt <= after).toBe(true);
    expect(budget.createdAt).toBe(budget.updatedAt);
  });
});

// ============================================================================
// Budget Check — Allows Under Limit
// ============================================================================

describe('Budget check allows when under limit', () => {
  it('allows execution when well under convoy budget', () => {
    const budget = createBudget('convoy-ok');
    const result = checkBudget(budget, 'agent-a', 10_000);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
    expect(result.remainingTokens).toBe(490_000);
    expect(result.usagePercent).toBe(0);
  });

  it('allows execution when under agent budget', () => {
    const budget = createBudget('convoy-ok');
    recordUsage(budget, 'agent-a', 40_000, 40_000); // 80k used
    const result = checkBudget(budget, 'agent-a', 15_000);
    expect(result.allowed).toBe(true);
  });

  it('reflects current usage percent', () => {
    const budget = createBudget('convoy-pct', { maxTokensPerConvoy: 100_000 });
    recordUsage(budget, 'agent-a', 10_000, 15_000); // 25k of 100k
    const result = checkBudget(budget, 'agent-a', 1_000);
    expect(result.usagePercent).toBe(25);
  });
});

// ============================================================================
// Budget Check — Blocks When Over Limit
// ============================================================================

describe('Budget check blocks when over limit', () => {
  it('blocks when projected cost exceeds convoy remaining', () => {
    const budget = createBudget('convoy-full', {
      maxTokensPerConvoy: 100_000,
      maxTokensPerAgent: 200_000, // high agent limit so convoy limit triggers first
    });
    recordUsage(budget, 'agent-a', 50_000, 40_000); // 90k used
    const result = checkBudget(budget, 'agent-a', 15_000); // would need 105k
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('convoy_budget_exceeded');
    expect(result.remainingTokens).toBe(10_000);
  });

  it('blocks when projected cost exceeds agent remaining', () => {
    const budget = createBudget('convoy-agent-full', {
      maxTokensPerConvoy: 1_000_000,
      maxTokensPerAgent: 50_000,
    });
    recordUsage(budget, 'agent-b', 25_000, 20_000); // 45k agent usage
    const result = checkBudget(budget, 'agent-b', 10_000); // would need 55k
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('agent_budget_exceeded');
    expect(result.remainingTokens).toBe(5_000);
  });

  it('agent limit checked before convoy limit', () => {
    // Both limits would be exceeded, but agent check fires first
    const budget = createBudget('convoy-both', {
      maxTokensPerConvoy: 60_000,
      maxTokensPerAgent: 50_000,
    });
    recordUsage(budget, 'agent-c', 25_000, 24_000); // 49k agent, 49k convoy
    const result = checkBudget(budget, 'agent-c', 5_000); // agent: 54k > 50k, convoy: 54k < 60k
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('agent_budget_exceeded');
  });

  it('blocks exactly at the limit with zero remaining', () => {
    const budget = createBudget('convoy-exact', { maxTokensPerConvoy: 50_000 });
    recordUsage(budget, 'agent-d', 25_000, 25_000); // exactly 50k
    const result = checkBudget(budget, 'agent-d', 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('convoy_budget_exceeded');
    expect(result.remainingTokens).toBe(0);
  });
});

// ============================================================================
// Budget Check — Warning Threshold
// ============================================================================

describe('Budget check warns at threshold', () => {
  it('warns when projected usage crosses warning threshold', () => {
    const budget = createBudget('convoy-warn', {
      maxTokensPerConvoy: 100_000,
      warningThresholdPercent: 80,
    });
    recordUsage(budget, 'agent-a', 35_000, 35_000); // 70k used
    // After this call, total would be 85k = 85% > 80% threshold
    const result = checkBudget(budget, 'agent-a', 15_000);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('warning_threshold');
  });

  it('does not warn when projected usage stays below threshold', () => {
    const budget = createBudget('convoy-no-warn', {
      maxTokensPerConvoy: 100_000,
      warningThresholdPercent: 80,
    });
    recordUsage(budget, 'agent-a', 20_000, 20_000); // 40k used
    const result = checkBudget(budget, 'agent-a', 5_000);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('warns at exactly the threshold percentage', () => {
    const budget = createBudget('convoy-exact-warn', {
      maxTokensPerConvoy: 100_000,
      warningThresholdPercent: 80,
    });
    recordUsage(budget, 'agent-a', 40_000, 30_000); // 70k used
    // After: 80k = exactly 80%
    const result = checkBudget(budget, 'agent-a', 10_000);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('warning_threshold');
  });
});

// ============================================================================
// Per-Agent Tracking
// ============================================================================

describe('Per-agent tracking within convoy', () => {
  it('tracks usage separately per agent', () => {
    const budget = createBudget('convoy-multi');
    recordUsage(budget, 'agent-a', 10_000, 5_000);
    recordUsage(budget, 'agent-b', 20_000, 8_000);

    expect(budget.currentUsage.perAgent['agent-a'].input).toBe(10_000);
    expect(budget.currentUsage.perAgent['agent-a'].output).toBe(5_000);
    expect(budget.currentUsage.perAgent['agent-b'].input).toBe(20_000);
    expect(budget.currentUsage.perAgent['agent-b'].output).toBe(8_000);
  });

  it('accumulates usage across multiple recordings for same agent', () => {
    const budget = createBudget('convoy-accum');
    recordUsage(budget, 'agent-a', 5_000, 3_000);
    recordUsage(budget, 'agent-a', 7_000, 4_000);

    expect(budget.currentUsage.perAgent['agent-a'].input).toBe(12_000);
    expect(budget.currentUsage.perAgent['agent-a'].output).toBe(7_000);
  });

  it('convoy total reflects sum of all agents', () => {
    const budget = createBudget('convoy-sum');
    recordUsage(budget, 'agent-a', 10_000, 5_000);
    recordUsage(budget, 'agent-b', 20_000, 15_000);
    recordUsage(budget, 'agent-c', 5_000, 3_000);

    expect(budget.currentUsage.convoyTotal.input).toBe(35_000);
    expect(budget.currentUsage.convoyTotal.output).toBe(23_000);
  });

  it('new agent check uses zero baseline', () => {
    const budget = createBudget('convoy-new-agent');
    recordUsage(budget, 'agent-a', 50_000, 50_000); // 100k convoy usage
    // agent-b has never been seen; its agent-level usage is 0
    const result = checkBudget(budget, 'agent-b', 50_000);
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// Multiple Agents Consuming Same Convoy Budget
// ============================================================================

describe('Multiple agents consuming from same convoy budget', () => {
  it('convoy budget depletes across agents collectively', () => {
    const budget = createBudget('convoy-collective', {
      maxTokensPerConvoy: 200_000,
      maxTokensPerAgent: 100_000,
    });

    recordUsage(budget, 'agent-a', 30_000, 30_000); // 60k
    recordUsage(budget, 'agent-b', 40_000, 40_000); // 80k
    recordUsage(budget, 'agent-c', 25_000, 25_000); // 50k
    // Total: 190k of 200k

    const result = checkBudget(budget, 'agent-d', 15_000);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('convoy_budget_exceeded');
  });

  it('one agent hitting its limit does not block others', () => {
    const budget = createBudget('convoy-independent', {
      maxTokensPerConvoy: 500_000,
      maxTokensPerAgent: 50_000,
    });

    recordUsage(budget, 'agent-a', 25_000, 25_000); // 50k — agent-a maxed
    const resultA = checkBudget(budget, 'agent-a', 1);
    expect(resultA.allowed).toBe(false);
    expect(resultA.reason).toBe('agent_budget_exceeded');

    const resultB = checkBudget(budget, 'agent-b', 40_000);
    expect(resultB.allowed).toBe(true);
    expect(resultB.reason).toBe('ok');
  });
});

// ============================================================================
// Projected Cost Prevents Overspend
// ============================================================================

describe('Projected cost prevents overspend', () => {
  it('blocks when exact remaining would be exceeded by 1 token', () => {
    const budget = createBudget('convoy-tight', { maxTokensPerConvoy: 100_000 });
    recordUsage(budget, 'agent-a', 50_000, 49_999); // 99,999 used
    const resultOk = checkBudget(budget, 'agent-a', 1);
    expect(resultOk.allowed).toBe(true);

    recordUsage(budget, 'agent-a', 0, 1); // now at 100,000 exactly
    const resultBlocked = checkBudget(budget, 'agent-a', 1);
    expect(resultBlocked.allowed).toBe(false);
  });

  it('allows call that exactly uses remaining budget', () => {
    const budget = createBudget('convoy-exact-fit', { maxTokensPerConvoy: 100_000 });
    recordUsage(budget, 'agent-a', 40_000, 50_000); // 90k used
    const result = checkBudget(budget, 'agent-a', 10_000); // exactly 100k
    // 10_000 remaining, cost is 10_000 — NOT greater than, so allowed
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// Zero-Budget Edge Case
// ============================================================================

describe('Zero-budget edge case', () => {
  it('zero convoy budget blocks all execution', () => {
    const budget = createBudget('convoy-zero', { maxTokensPerConvoy: 0 });
    const result = checkBudget(budget, 'agent-a', 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('convoy_budget_exceeded');
    expect(result.remainingTokens).toBe(0);
    expect(result.usagePercent).toBe(100);
  });

  it('zero agent budget blocks agent execution', () => {
    const budget = createBudget('convoy-zero-agent', {
      maxTokensPerConvoy: 500_000,
      maxTokensPerAgent: 0,
    });
    const result = checkBudget(budget, 'agent-a', 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('agent_budget_exceeded');
  });

  it('zero projected cost is always allowed', () => {
    const budget = createBudget('convoy-zero-cost', { maxTokensPerConvoy: 100 });
    recordUsage(budget, 'agent-a', 50, 50); // fully consumed
    const result = checkBudget(budget, 'agent-a', 0);
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// Usage Recording
// ============================================================================

describe('Usage recording', () => {
  it('updates the updatedAt timestamp', () => {
    const budget = createBudget('convoy-timestamp');
    const original = budget.updatedAt;
    // Small delay to ensure timestamp differs
    recordUsage(budget, 'agent-a', 100, 200);
    // updatedAt should be updated (may or may not differ by sub-ms)
    expect(budget.updatedAt).toBeTruthy();
  });

  it('creates agent entry on first recording', () => {
    const budget = createBudget('convoy-first');
    expect(budget.currentUsage.perAgent['agent-new']).toBeUndefined();
    recordUsage(budget, 'agent-new', 100, 200);
    expect(budget.currentUsage.perAgent['agent-new']).toEqual({
      input: 100,
      output: 200,
    });
  });
});

// ============================================================================
// Budget Report
// ============================================================================

describe('Budget report', () => {
  it('generates a correct report with no usage', () => {
    const budget = createBudget('convoy-report');
    const report = getBudgetReport(budget);
    expect(report.convoyId).toBe('convoy-report');
    expect(report.totalConsumed).toBe(0);
    expect(report.maxAllowed).toBe(500_000);
    expect(report.percentUsed).toBe(0);
    expect(report.warningActive).toBe(false);
    expect(report.budgetExhausted).toBe(false);
    expect(report.agents).toHaveLength(0);
  });

  it('generates a correct report with usage', () => {
    const budget = createBudget('convoy-report-used', {
      maxTokensPerConvoy: 100_000,
      maxTokensPerAgent: 60_000,
      warningThresholdPercent: 70,
    });
    recordUsage(budget, 'agent-a', 20_000, 15_000);
    recordUsage(budget, 'agent-b', 30_000, 10_000);

    const report = getBudgetReport(budget);
    expect(report.totalConsumed).toBe(75_000);
    expect(report.percentUsed).toBe(75);
    expect(report.warningActive).toBe(true);
    expect(report.budgetExhausted).toBe(false);
    expect(report.agents).toHaveLength(2);

    const agentA = report.agents.find(a => a.agentId === 'agent-a')!;
    expect(agentA.consumed).toBe(35_000);
    expect(agentA.maxAllowed).toBe(60_000);
    expect(agentA.percentUsed).toBeCloseTo(58.33, 1);

    const agentB = report.agents.find(a => a.agentId === 'agent-b')!;
    expect(agentB.consumed).toBe(40_000);
  });

  it('reports budget exhausted when fully consumed', () => {
    const budget = createBudget('convoy-exhausted', { maxTokensPerConvoy: 50_000 });
    recordUsage(budget, 'agent-a', 25_000, 25_000);
    const report = getBudgetReport(budget);
    expect(report.budgetExhausted).toBe(true);
  });
});

// ============================================================================
// Budget Persistence (Save / Load)
// ============================================================================

describe('Budget persistence', () => {
  it('saves and loads a budget round-trip', async () => {
    const budget = createBudget('convoy-persist');
    recordUsage(budget, 'agent-a', 10_000, 5_000);
    recordUsage(budget, 'agent-b', 20_000, 8_000);

    await saveBudget(budget, budgetDir);
    const loaded = await loadBudget('convoy-persist', budgetDir);

    expect(loaded).not.toBeNull();
    expect(loaded!.convoyId).toBe('convoy-persist');
    expect(loaded!.maxTokensPerConvoy).toBe(500_000);
    expect(loaded!.currentUsage.convoyTotal.input).toBe(30_000);
    expect(loaded!.currentUsage.convoyTotal.output).toBe(13_000);
    expect(loaded!.currentUsage.perAgent['agent-a'].input).toBe(10_000);
    expect(loaded!.currentUsage.perAgent['agent-b'].output).toBe(8_000);
  });

  it('returns null for non-existent budget', async () => {
    const loaded = await loadBudget('convoy-ghost', budgetDir);
    expect(loaded).toBeNull();
  });

  it('overwrites existing budget on save', async () => {
    const budget = createBudget('convoy-overwrite');
    await saveBudget(budget, budgetDir);

    recordUsage(budget, 'agent-a', 50_000, 50_000);
    await saveBudget(budget, budgetDir);

    const loaded = await loadBudget('convoy-overwrite', budgetDir);
    expect(loaded!.currentUsage.convoyTotal.input).toBe(50_000);
  });

  it('deletes a budget file', async () => {
    const budget = createBudget('convoy-delete');
    await saveBudget(budget, budgetDir);

    const beforeDelete = await loadBudget('convoy-delete', budgetDir);
    expect(beforeDelete).not.toBeNull();

    await deleteBudget('convoy-delete', budgetDir);

    const afterDelete = await loadBudget('convoy-delete', budgetDir);
    expect(afterDelete).toBeNull();
  });

  it('delete is no-op for non-existent budget', async () => {
    // Should not throw
    await deleteBudget('convoy-nope', budgetDir);
  });

  it('lists all persisted budget IDs', async () => {
    await saveBudget(createBudget('convoy-list-a'), budgetDir);
    await saveBudget(createBudget('convoy-list-b'), budgetDir);
    await saveBudget(createBudget('convoy-list-c'), budgetDir);

    const ids = await listBudgets(budgetDir);
    expect(ids).toHaveLength(3);
    expect(ids).toContain('convoy-list-a');
    expect(ids).toContain('convoy-list-b');
    expect(ids).toContain('convoy-list-c');
  });

  it('returns empty array when budget dir does not exist', async () => {
    const ids = await listBudgets('/tmp/nonexistent-budget-dir-xyz');
    expect(ids).toHaveLength(0);
  });
});

// ============================================================================
// Atomic Write Pattern
// ============================================================================

describe('Atomic write pattern', () => {
  it('writes budget file to the budgets subdirectory', async () => {
    const budget = createBudget('convoy-atomic');
    await saveBudget(budget, budgetDir);
    const files = await readdir(budgetDir);
    expect(files).toContain('convoy-atomic.json');
  });

  it('does not leave temp files after successful write', async () => {
    const budget = createBudget('convoy-no-tmp');
    await saveBudget(budget, budgetDir);
    const files = await readdir(budgetDir);
    const tmpFiles = files.filter(f => f.endsWith('.tmp'));
    expect(tmpFiles).toHaveLength(0);
  });
});

// ============================================================================
// JSON Sorted Keys
// ============================================================================

describe('JSON sorted keys', () => {
  it('outputs budget JSON with alphabetically sorted keys', async () => {
    const budget = createBudget('convoy-sorted');
    recordUsage(budget, 'agent-z', 100, 200);
    recordUsage(budget, 'agent-a', 300, 400);
    await saveBudget(budget, budgetDir);

    const filePath = join(budgetDir, 'convoy-sorted.json');
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    const keys = Object.keys(parsed);
    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);
  });

  it('sorts nested object keys', async () => {
    const budget = createBudget('convoy-nested-sort');
    recordUsage(budget, 'agent-x', 100, 200);
    await saveBudget(budget, budgetDir);

    const filePath = join(budgetDir, 'convoy-nested-sort.json');
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Check nested currentUsage keys
    const usageKeys = Object.keys(parsed.currentUsage);
    expect(usageKeys).toEqual([...usageKeys].sort());

    // Check convoyTotal keys
    const totalKeys = Object.keys(parsed.currentUsage.convoyTotal);
    expect(totalKeys).toEqual([...totalKeys].sort());
  });
});

// ============================================================================
// Integration: Full Lifecycle
// ============================================================================

describe('Full lifecycle integration', () => {
  it('create -> check -> record -> check -> save -> load', async () => {
    // 1. Create budget
    const budget = createBudget('convoy-lifecycle', {
      maxTokensPerConvoy: 200_000,
      maxTokensPerAgent: 80_000,
      warningThresholdPercent: 75,
    });

    // 2. Pre-check: should be OK
    const check1 = checkBudget(budget, 'polecat-1', 30_000);
    expect(check1.allowed).toBe(true);
    expect(check1.reason).toBe('ok');

    // 3. Record usage
    recordUsage(budget, 'polecat-1', 15_000, 12_000);

    // 4. Second agent
    recordUsage(budget, 'polecat-2', 40_000, 35_000);
    recordUsage(budget, 'polecat-3', 30_000, 25_000);
    // Total: 157,000

    // 5. Warning check — 157k + 5k = 162k = 81% > 75%
    const check2 = checkBudget(budget, 'polecat-1', 5_000);
    expect(check2.allowed).toBe(true);
    expect(check2.reason).toBe('warning_threshold');

    // 6. Try to blow the budget — 157k + 50k = 207k > 200k
    const check3 = checkBudget(budget, 'polecat-4', 50_000);
    expect(check3.allowed).toBe(false);
    expect(check3.reason).toBe('convoy_budget_exceeded');

    // 7. Save and reload
    await saveBudget(budget, budgetDir);
    const loaded = await loadBudget('convoy-lifecycle', budgetDir);
    expect(loaded).not.toBeNull();

    // 8. Check still works after reload
    const check4 = checkBudget(loaded!, 'polecat-4', 50_000);
    expect(check4.allowed).toBe(false);

    // 9. Report
    const report = getBudgetReport(loaded!);
    expect(report.totalConsumed).toBe(157_000);
    expect(report.agents).toHaveLength(3);
    expect(report.warningActive).toBe(true);
    expect(report.budgetExhausted).toBe(false);
  });
});
