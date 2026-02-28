/**
 * Monitor agent for the GSD Den (BUDGET position).
 *
 * Tracks token consumption per agent, monitors context window utilization,
 * raises alerts when resources are constrained, and projects budget overages.
 * Practices what it preaches -- allocated only 3% budget itself, it is lean.
 *
 * Provides 6 core capabilities:
 *   1. Consumption tracking -- per-agent token usage snapshots
 *   2. Alert level calculation -- 5-tier threshold mapping
 *   3. Rate projection -- tokens-per-phase with overage detection
 *   4. Budget checking -- aggregate alert with recommendations
 *   5. JSONL logging -- append-only audit trail
 *   6. Monitor class -- stateful wrapper with bound config
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { AgentIdSchema } from './types.js';
import type { AgentId } from './types.js';
import { formatTimestamp } from './encoder.js';

// ============================================================================
// Alert thresholds
// ============================================================================

/**
 * Alert threshold constants mapping utilization percentage ranges to actions.
 *
 * GREEN:    Normal operation, no action needed
 * YELLOW:   Consumption trending up, log for awareness
 * ORANGE:   Alert coordinator to consider simplification
 * RED:      Urgent -- recommend skipping optional work
 * CRITICAL: Emergency conservation required, halt non-essential
 */
export const ALERT_THRESHOLDS = {
  GREEN:    { min: 0,  max: 50, action: 'none' },
  YELLOW:   { min: 50, max: 70, action: 'log' },
  ORANGE:   { min: 70, max: 85, action: 'alert_coordinator' },
  RED:      { min: 85, max: 95, action: 'urgent_alert' },
  CRITICAL: { min: 95, max: Infinity, action: 'halt' },
} as const;

// ============================================================================
// Schemas
// ============================================================================

/** Alert level enum */
export const AlertLevelSchema = z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED', 'CRITICAL']);

/** TypeScript type for alert levels */
export type AlertLevel = z.infer<typeof AlertLevelSchema>;

/**
 * Per-agent consumption snapshot with utilization percentage.
 */
export const BudgetSnapshotSchema = z.object({
  /** Which agent this snapshot tracks */
  agentId: AgentIdSchema,
  /** Tokens consumed so far */
  tokensUsed: z.number().int().nonnegative(),
  /** Allocated token budget for this agent */
  budgetLimit: z.number().int().positive(),
  /** Utilization percentage: tokensUsed / budgetLimit * 100 */
  utilizationPct: z.number().nonnegative(),
});

/** TypeScript type for budget snapshots */
export type BudgetSnapshot = z.infer<typeof BudgetSnapshotSchema>;

/**
 * Consumption rate projection based on phases completed.
 */
export const ConsumptionRateSchema = z.object({
  /** Average tokens consumed per phase */
  tokensPerPhase: z.number().nonnegative(),
  /** Phases remaining to complete */
  phasesRemaining: z.number().int().nonnegative(),
  /** Projected total consumption: current + remaining * rate */
  projectedTotal: z.number().int().nonnegative(),
  /** Whether projected total exceeds total budget */
  projectedOverage: z.boolean(),
});

/** TypeScript type for consumption rates */
export type ConsumptionRate = z.infer<typeof ConsumptionRateSchema>;

/**
 * Full budget alert with breakdown and recommendation.
 */
export const BudgetAlertSchema = z.object({
  /** Compact timestamp */
  timestamp: z.string(),
  /** Overall alert level */
  level: AlertLevelSchema,
  /** Overall utilization percentage */
  utilizationPct: z.number().nonnegative(),
  /** Per-agent consumption breakdown */
  agentBreakdown: z.array(BudgetSnapshotSchema),
  /** Consumption rate projection */
  rate: ConsumptionRateSchema,
  /** Human-readable recommendation */
  recommendation: z.string(),
});

/** TypeScript type for budget alerts */
export type BudgetAlert = z.infer<typeof BudgetAlertSchema>;

/**
 * JSONL log entry for monitor events.
 */
export const MonitorEntrySchema = z.object({
  /** Compact timestamp */
  timestamp: z.string(),
  /** Entry type */
  type: z.enum(['budget-check', 'alert', 'rate-update']),
  /** Alert level at time of entry */
  level: AlertLevelSchema,
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for monitor entries */
export type MonitorEntry = z.infer<typeof MonitorEntrySchema>;

/**
 * Monitor agent configuration.
 */
export const MonitorConfigSchema = z.object({
  /** Bus configuration for context */
  busConfig: z.any(),
  /** Path to the JSONL log file */
  logPath: z.string().default('.planning/den/logs/monitor.jsonl'),
  /** Total token budget for the session */
  totalBudget: z.number().int().positive(),
  /** Per-agent budgets keyed by agent ID */
  agentBudgets: z.record(z.string(), z.number().int().positive()),
});

/** TypeScript type for monitor config */
export type MonitorConfig = z.infer<typeof MonitorConfigSchema>;

// ============================================================================
// Stateless functions
// ============================================================================

/**
 * Create a consumption snapshot with utilization percentage.
 *
 * Pure function -- no side effects.
 *
 * @param agentId - Agent position ID
 * @param tokensUsed - Tokens consumed so far
 * @param budgetLimit - Agent's allocated token budget
 * @returns Validated BudgetSnapshot with calculated utilizationPct
 */
export function trackConsumption(agentId: AgentId, tokensUsed: number, budgetLimit: number): BudgetSnapshot {
  const utilizationPct = (tokensUsed / budgetLimit) * 100;
  return BudgetSnapshotSchema.parse({
    agentId,
    tokensUsed,
    budgetLimit,
    utilizationPct,
  });
}

/**
 * Map utilization percentage to alert level.
 *
 * @param utilizationPct - Overall utilization percentage
 * @returns Alert level string
 */
export function calculateAlertLevel(utilizationPct: number): AlertLevel {
  if (utilizationPct >= 95) return 'CRITICAL';
  if (utilizationPct >= 85) return 'RED';
  if (utilizationPct >= 70) return 'ORANGE';
  if (utilizationPct >= 50) return 'YELLOW';
  return 'GREEN';
}

/**
 * Calculate consumption rate and project budget usage.
 *
 * @param tokensConsumed - Total tokens consumed so far
 * @param phasesCompleted - Number of phases completed
 * @param totalPhases - Total phases planned
 * @param totalBudget - Total token budget
 * @returns ConsumptionRate with projection
 */
export function calculateConsumptionRate(
  tokensConsumed: number,
  phasesCompleted: number,
  totalPhases: number,
  totalBudget: number,
): ConsumptionRate {
  const tokensPerPhase = phasesCompleted > 0 ? tokensConsumed / phasesCompleted : 0;
  const phasesRemaining = totalPhases - phasesCompleted;
  const projectedTotal = Math.round(tokensConsumed + (phasesRemaining * tokensPerPhase));
  const projectedOverage = projectedTotal > totalBudget;

  return ConsumptionRateSchema.parse({
    tokensPerPhase,
    phasesRemaining,
    projectedTotal,
    projectedOverage,
  });
}

/** Recommendation messages per alert level */
const RECOMMENDATIONS: Record<AlertLevel, string> = {
  GREEN: 'Budget nominal',
  YELLOW: 'Monitor consumption trend',
  ORANGE: 'Recommend simplifying remaining phases',
  RED: 'Recommend skipping optional phases',
  CRITICAL: 'Emergency conservation required',
};

/**
 * Produce a budget alert from current snapshots and rate projection.
 *
 * @param snapshots - Per-agent consumption snapshots
 * @param rate - Current consumption rate projection
 * @param totalBudget - Total token budget
 * @returns BudgetAlert with level, recommendation, and breakdown
 */
export function checkBudget(
  snapshots: BudgetSnapshot[],
  rate: ConsumptionRate,
  totalBudget: number,
): BudgetAlert {
  const totalUsed = snapshots.reduce((sum, s) => sum + s.tokensUsed, 0);
  const utilizationPct = (totalUsed / totalBudget) * 100;
  const level = calculateAlertLevel(utilizationPct);

  let recommendation = RECOMMENDATIONS[level];
  if (rate.projectedOverage) {
    recommendation += ' -- projected overage';
  }

  return BudgetAlertSchema.parse({
    timestamp: formatTimestamp(new Date()),
    level,
    utilizationPct,
    agentBreakdown: snapshots,
    rate,
    recommendation,
  });
}

// ============================================================================
// JSONL logging
// ============================================================================

/**
 * Append a monitor entry to a JSONL log file.
 *
 * Creates the directory and file if they do not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Monitor entry to append
 */
export async function appendMonitorEntry(logPath: string, entry: MonitorEntry): Promise<void> {
  const validated = MonitorEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all monitor entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated MonitorEntry objects
 */
export async function readMonitorLog(logPath: string): Promise<MonitorEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => MonitorEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Monitor class (stateful wrapper)
// ============================================================================

/**
 * Stateful Monitor wrapping all stateless functions with bound config.
 *
 * Maintains a Map of agent ID to BudgetSnapshot for per-agent tracking.
 * Use createMonitor factory for ergonomic creation with filesystem setup.
 */
export class Monitor {
  private readonly monitorConfig: MonitorConfig;
  private readonly snapshots: Map<string, BudgetSnapshot> = new Map();

  /**
   * Create a new Monitor instance.
   *
   * @param config - Monitor configuration (validated through Zod)
   */
  constructor(config: MonitorConfig) {
    this.monitorConfig = MonitorConfigSchema.parse(config);
  }

  /**
   * Record token consumption for an agent.
   *
   * Creates or updates the snapshot for the given agent. Uses the
   * agent's budget from config, falling back to totalBudget if not
   * specified in agentBudgets.
   *
   * @param agentId - Agent position ID
   * @param tokensUsed - Current token usage for this agent
   * @returns Updated BudgetSnapshot
   */
  recordConsumption(agentId: AgentId, tokensUsed: number): BudgetSnapshot {
    const budgetLimit = this.monitorConfig.agentBudgets[agentId]
      ?? this.monitorConfig.totalBudget;
    const snapshot = trackConsumption(agentId, tokensUsed, budgetLimit);
    this.snapshots.set(agentId, snapshot);
    return snapshot;
  }

  /**
   * Run a full budget check pipeline.
   *
   * Gathers all snapshots, calculates consumption rate, produces alert,
   * and logs the entry to the JSONL file.
   *
   * @param phasesCompleted - Number of phases completed
   * @param totalPhases - Total phases planned
   * @returns BudgetAlert with level, recommendation, and breakdown
   */
  async checkBudget(phasesCompleted: number, totalPhases: number): Promise<BudgetAlert> {
    const allSnapshots = this.getSnapshots();
    const totalUsed = allSnapshots.reduce((sum, s) => sum + s.tokensUsed, 0);

    const rate = calculateConsumptionRate(
      totalUsed,
      phasesCompleted,
      totalPhases,
      this.monitorConfig.totalBudget,
    );

    const alert = checkBudget(allSnapshots, rate, this.monitorConfig.totalBudget);

    // Log the budget check
    await appendMonitorEntry(this.monitorConfig.logPath, {
      timestamp: formatTimestamp(new Date()),
      type: 'budget-check',
      level: alert.level,
      detail: {
        utilizationPct: alert.utilizationPct,
        totalUsed,
        totalBudget: this.monitorConfig.totalBudget,
        agentCount: allSnapshots.length,
      },
    });

    return alert;
  }

  /**
   * Quick-check overall alert level across all snapshots.
   *
   * @returns Current alert level based on aggregate utilization
   */
  getAlertLevel(): AlertLevel {
    const allSnapshots = this.getSnapshots();
    if (allSnapshots.length === 0) return 'GREEN';

    const totalUsed = allSnapshots.reduce((sum, s) => sum + s.tokensUsed, 0);
    const utilizationPct = (totalUsed / this.monitorConfig.totalBudget) * 100;
    return calculateAlertLevel(utilizationPct);
  }

  /**
   * Return current snapshots as an array.
   *
   * @returns Array of all tracked BudgetSnapshot objects
   */
  getSnapshots(): BudgetSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  /**
   * Read the full monitor log.
   *
   * @returns Array of all MonitorEntry objects from the log file
   */
  async getLog(): Promise<MonitorEntry[]> {
    return readMonitorLog(this.monitorConfig.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create and initialize a Monitor.
 *
 * Ensures the log directory exists before returning the ready-to-use instance.
 *
 * @param config - Monitor configuration
 * @returns Initialized Monitor instance
 */
export async function createMonitor(config: MonitorConfig): Promise<Monitor> {
  const validated = MonitorConfigSchema.parse(config);
  await mkdir(dirname(validated.logPath), { recursive: true });
  return new Monitor(validated);
}
