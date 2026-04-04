/**
 * Token Budget Enforcement for Gastown Convoy Execution.
 *
 * Provides hard limits on token usage with pre-execution budget checking,
 * per-convoy and per-agent (polecat) tracking, and structured stop reasons
 * when budget is exceeded. Budget checks happen BEFORE the API call, not after.
 *
 * Identified by the 12 Primitives analysis (Primitive 5) and confirmed by
 * session 6 research synthesis as the #1 actionable improvement.
 *
 * State directory layout:
 *   {stateDir}/budgets/{convoyId}.json   Per-convoy budget state
 */

import { mkdir, readFile, readdir, rename, open, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// ============================================================================
// Types
// ============================================================================

/** Token count for a single direction (input or output). */
export interface TokenUsage {
  /** Tokens consumed in prompts / requests. */
  input: number;
  /** Tokens consumed in responses / completions. */
  output: number;
}

/** Per-agent usage record within a convoy budget. */
export interface AgentUsageRecord {
  /** Agent identifier. */
  agentId: string;
  /** Cumulative token usage for this agent. */
  usage: TokenUsage;
}

/** Current usage snapshot across the entire convoy and per-agent. */
export interface BudgetUsage {
  /** Total tokens consumed across all agents in the convoy. */
  convoyTotal: TokenUsage;
  /** Per-agent token breakdown. Keys are agent IDs. */
  perAgent: Record<string, TokenUsage>;
}

/** Configuration for creating a new token budget. */
export interface TokenBudgetConfig {
  /** Hard limit for entire convoy (input + output combined). Default: 500,000. */
  maxTokensPerConvoy?: number;
  /** Hard limit per agent (input + output combined). Default: 100,000. */
  maxTokensPerAgent?: number;
  /** Warn at this percentage of budget consumed (0-100). Default: 80. */
  warningThresholdPercent?: number;
}

/**
 * A token budget bound to a specific convoy.
 *
 * Persisted as JSON in `.chipset/state/budgets/{convoyId}.json`.
 */
export interface TokenBudget {
  /** Convoy this budget belongs to. */
  convoyId: string;
  /** Hard limit for the entire convoy (input + output combined). */
  maxTokensPerConvoy: number;
  /** Hard limit per individual agent (input + output combined). */
  maxTokensPerAgent: number;
  /** Warning threshold percentage (0-100). */
  warningThresholdPercent: number;
  /** Current usage state. */
  currentUsage: BudgetUsage;
  /** ISO 8601 timestamp of budget creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last usage update. */
  updatedAt: string;
}

/**
 * Result of a pre-execution budget check.
 *
 * Returned BEFORE an API call to determine whether execution should proceed.
 */
export interface BudgetCheckResult {
  /** Whether the projected execution is allowed. */
  allowed: boolean;
  /**
   * Structured stop reason.
   * - `ok`: Under budget, no concerns.
   * - `warning_threshold`: Under budget but past warning threshold.
   * - `convoy_budget_exceeded`: Convoy-level budget would be exceeded.
   * - `agent_budget_exceeded`: Agent-level budget would be exceeded.
   */
  reason: 'ok' | 'warning_threshold' | 'convoy_budget_exceeded' | 'agent_budget_exceeded';
  /** Tokens remaining before the binding limit is hit. */
  remainingTokens: number;
  /** Current convoy usage as a percentage (0-100). */
  usagePercent: number;
}

/** Summary report for logging and display. */
export interface BudgetReport {
  /** Convoy identifier. */
  convoyId: string;
  /** Total tokens consumed (input + output). */
  totalConsumed: number;
  /** Maximum allowed tokens for the convoy. */
  maxAllowed: number;
  /** Percentage consumed (0-100). */
  percentUsed: number;
  /** Whether the warning threshold has been crossed. */
  warningActive: boolean;
  /** Whether the budget is exhausted. */
  budgetExhausted: boolean;
  /** Per-agent breakdown. */
  agents: Array<{
    agentId: string;
    consumed: number;
    maxAllowed: number;
    percentUsed: number;
  }>;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_MAX_TOKENS_PER_CONVOY = 500_000;
const DEFAULT_MAX_TOKENS_PER_AGENT = 100_000;
const DEFAULT_WARNING_THRESHOLD_PERCENT = 80;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Serialize data to JSON with sorted keys for git-friendly output.
 *
 * Uses a replacer that sorts object keys alphabetically at every level,
 * producing deterministic output regardless of property insertion order.
 */
function serializeSorted(data: unknown): string {
  return JSON.stringify(data, (_key: string, value: unknown) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  }, 2) + '\n';
}

/**
 * Atomic write: write to temp file, fsync, then rename.
 *
 * Guarantees that a reader always sees either the complete old content
 * or the complete new content, never a partial write.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });

  const tmpPath = filePath + '.tmp';
  const fd = await open(tmpPath, 'w');
  try {
    await fd.writeFile(content, 'utf-8');
    await fd.sync();
  } finally {
    await fd.close();
  }
  await rename(tmpPath, filePath);
}

/** Read and parse a JSON file, returning null if not found or corrupt. */
async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/** Total tokens from a usage record (input + output). */
function totalTokens(usage: TokenUsage): number {
  return usage.input + usage.output;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new token budget for a convoy.
 *
 * Initializes all usage counters to zero. The budget is returned in-memory;
 * call `saveBudget` to persist it to disk.
 *
 * @param convoyId - Unique convoy identifier this budget tracks.
 * @param config - Optional overrides for limits and warning threshold.
 * @returns A fresh TokenBudget with zero usage.
 */
export function createBudget(convoyId: string, config?: TokenBudgetConfig): TokenBudget {
  const now = new Date().toISOString();
  return {
    convoyId,
    maxTokensPerConvoy: config?.maxTokensPerConvoy ?? DEFAULT_MAX_TOKENS_PER_CONVOY,
    maxTokensPerAgent: config?.maxTokensPerAgent ?? DEFAULT_MAX_TOKENS_PER_AGENT,
    warningThresholdPercent: config?.warningThresholdPercent ?? DEFAULT_WARNING_THRESHOLD_PERCENT,
    currentUsage: {
      convoyTotal: { input: 0, output: 0 },
      perAgent: {},
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Check whether a projected API call should proceed.
 *
 * This is the gatekeeper — call it BEFORE every API call with the estimated
 * token cost. Returns a structured result with allow/deny and reason.
 *
 * Checks agent-level budget first (tighter scope), then convoy-level.
 * A warning is issued when the convoy is past the warning threshold but
 * the call is still under the hard limit.
 *
 * @param budget - Current budget state.
 * @param agentId - Agent that will make the API call.
 * @param projectedCost - Estimated tokens for the call (input + output).
 * @returns BudgetCheckResult indicating whether to proceed.
 */
export function checkBudget(
  budget: TokenBudget,
  agentId: string,
  projectedCost: number,
): BudgetCheckResult {
  const convoyConsumed = totalTokens(budget.currentUsage.convoyTotal);
  const convoyRemaining = budget.maxTokensPerConvoy - convoyConsumed;

  // Agent-level check
  const agentUsage = budget.currentUsage.perAgent[agentId];
  const agentConsumed = agentUsage ? totalTokens(agentUsage) : 0;
  const agentRemaining = budget.maxTokensPerAgent - agentConsumed;

  const convoyPercent = budget.maxTokensPerConvoy > 0
    ? (convoyConsumed / budget.maxTokensPerConvoy) * 100
    : 100;

  // Agent budget exceeded — stop before the call
  if (projectedCost > agentRemaining) {
    return {
      allowed: false,
      reason: 'agent_budget_exceeded',
      remainingTokens: Math.max(0, agentRemaining),
      usagePercent: convoyPercent,
    };
  }

  // Convoy budget exceeded — stop before the call
  if (projectedCost > convoyRemaining) {
    return {
      allowed: false,
      reason: 'convoy_budget_exceeded',
      remainingTokens: Math.max(0, convoyRemaining),
      usagePercent: convoyPercent,
    };
  }

  // Warning threshold — allow but flag it
  const projectedPercent = budget.maxTokensPerConvoy > 0
    ? ((convoyConsumed + projectedCost) / budget.maxTokensPerConvoy) * 100
    : 100;

  if (projectedPercent >= budget.warningThresholdPercent) {
    return {
      allowed: true,
      reason: 'warning_threshold',
      remainingTokens: convoyRemaining - projectedCost,
      usagePercent: convoyPercent,
    };
  }

  // All clear
  return {
    allowed: true,
    reason: 'ok',
    remainingTokens: convoyRemaining - projectedCost,
    usagePercent: convoyPercent,
  };
}

/**
 * Record actual token usage after an API call completes.
 *
 * Updates both the convoy total and the per-agent breakdown.
 * Mutates the budget in-place. Call `saveBudget` afterward to persist.
 *
 * @param budget - Budget to update.
 * @param agentId - Agent that made the API call.
 * @param input - Actual input tokens consumed.
 * @param output - Actual output tokens consumed.
 */
export function recordUsage(
  budget: TokenBudget,
  agentId: string,
  input: number,
  output: number,
): void {
  // Update convoy total
  budget.currentUsage.convoyTotal.input += input;
  budget.currentUsage.convoyTotal.output += output;

  // Update per-agent
  if (!budget.currentUsage.perAgent[agentId]) {
    budget.currentUsage.perAgent[agentId] = { input: 0, output: 0 };
  }
  budget.currentUsage.perAgent[agentId].input += input;
  budget.currentUsage.perAgent[agentId].output += output;

  // Timestamp
  budget.updatedAt = new Date().toISOString();
}

/**
 * Generate a summary report of the budget for logging and display.
 *
 * @param budget - Budget to summarize.
 * @returns Structured report.
 */
export function getBudgetReport(budget: TokenBudget): BudgetReport {
  const totalConsumed = totalTokens(budget.currentUsage.convoyTotal);
  const percentUsed = budget.maxTokensPerConvoy > 0
    ? (totalConsumed / budget.maxTokensPerConvoy) * 100
    : 0;

  const agents = Object.entries(budget.currentUsage.perAgent).map(
    ([agentId, usage]) => {
      const consumed = totalTokens(usage);
      return {
        agentId,
        consumed,
        maxAllowed: budget.maxTokensPerAgent,
        percentUsed: budget.maxTokensPerAgent > 0
          ? (consumed / budget.maxTokensPerAgent) * 100
          : 0,
      };
    },
  );

  return {
    convoyId: budget.convoyId,
    totalConsumed,
    maxAllowed: budget.maxTokensPerConvoy,
    percentUsed,
    warningActive: percentUsed >= budget.warningThresholdPercent,
    budgetExhausted: totalConsumed >= budget.maxTokensPerConvoy,
    agents,
  };
}

// ============================================================================
// Persistence
// ============================================================================

/**
 * Save a budget to disk using atomic write.
 *
 * Writes to `{path}/{convoyId}.json` with sorted keys for git-friendly diffs.
 *
 * @param budget - Budget state to persist.
 * @param budgetDir - Directory for budget files (e.g., `.chipset/state/budgets`).
 */
export async function saveBudget(budget: TokenBudget, budgetDir: string): Promise<void> {
  const filePath = join(budgetDir, `${budget.convoyId}.json`);
  await atomicWrite(filePath, serializeSorted(budget));
}

/**
 * Load a budget from disk.
 *
 * Returns null if the file does not exist or is corrupt.
 *
 * @param convoyId - Convoy identifier.
 * @param budgetDir - Directory for budget files.
 * @returns The loaded budget, or null if not found.
 */
export async function loadBudget(
  convoyId: string,
  budgetDir: string,
): Promise<TokenBudget | null> {
  const filePath = join(budgetDir, `${convoyId}.json`);
  return readJson<TokenBudget>(filePath);
}

/**
 * Delete a budget file from disk.
 *
 * No-op if the file does not exist.
 *
 * @param convoyId - Convoy identifier.
 * @param budgetDir - Directory for budget files.
 */
export async function deleteBudget(
  convoyId: string,
  budgetDir: string,
): Promise<void> {
  const filePath = join(budgetDir, `${convoyId}.json`);
  try {
    await unlink(filePath);
  } catch {
    // Already deleted or never existed — no-op
  }
}

/**
 * List all persisted budget convoy IDs.
 *
 * @param budgetDir - Directory for budget files.
 * @returns Array of convoy IDs that have persisted budgets.
 */
export async function listBudgets(budgetDir: string): Promise<string[]> {
  try {
    const files = await readdir(budgetDir);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}
