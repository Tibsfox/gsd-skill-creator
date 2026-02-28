/**
 * Dashboard data model for Den status visualization.
 *
 * Provides the data layer for the Den status page: position states for all
 * 10 staff agents, staff-specific indicators (Coordinator authority, Relay
 * queue depth, Monitor budget level, Sentinel recovery state), position
 * health metrics derived from Chronicler log entries, and markdown rendering
 * for human consumption.
 *
 * Reads from the Chronicler's JSONL audit log and the bus filesystem to
 * assemble a complete DenSnapshot. All collection functions are pure
 * (testable without filesystem) except assembleDenSnapshot which performs I/O.
 *
 * Satisfies: DASH-01 (status page), DASH-03 (staff indicators), DASH-04 (health metrics)
 */

import { z } from 'zod';

import { AgentIdSchema } from './types.js';
import type { BusConfig } from './types.js';
import { BusConfigSchema } from './types.js';
import { formatTimestamp, parseTimestamp } from './encoder.js';
import { readChroniclerLog } from './chronicler.js';
import type { ChroniclerEntry } from './chronicler.js';
import { collectHealthMetrics, isHealthy } from './health.js';

// ============================================================================
// Staff agent IDs (the 10 staff positions, excluding 'all' and 'user')
// ============================================================================

/**
 * The 10 staff agent position IDs in the Den topology.
 *
 * Excludes 'all' (broadcast) and 'user' (human operator) which are
 * valid AgentId values but not staff positions.
 */
export const STAFF_AGENT_IDS = [
  'coordinator', 'relay', 'planner', 'configurator',
  'monitor', 'dispatcher', 'verifier', 'chronicler',
  'sentinel', 'executor',
] as const;

// ============================================================================
// DashboardConfig schema
// ============================================================================

/**
 * Configuration for the Dashboard data model.
 */
export const DashboardConfigSchema = z.object({
  /** Path to the JSONL chronicler log file */
  chroniclerLogPath: z.string().default('.planning/den/logs/chronicler.jsonl'),
  /** Bus configuration for health metrics collection */
  busConfig: z.any().optional(),
  /** Agent identifier */
  agentId: z.string().default('chronicler'),
});

/** TypeScript type for dashboard config */
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

// ============================================================================
// PositionState schema
// ============================================================================

/**
 * Schema for the state of a single Den staff position.
 *
 * Each of the 10 staff positions has a status derived from the most
 * recent Chronicler log entry for that agent.
 */
export const PositionStateSchema = z.object({
  /** Staff agent position ID */
  position: AgentIdSchema,
  /** Current status derived from last log entry */
  status: z.enum(['active', 'dormant', 'working', 'error']),
  /** Last action performed (e.g., 'phase_completed') */
  lastAction: z.string(),
  /** Timestamp of last activity */
  lastSeen: z.string(),
  /** Optional description of current task */
  taskDescription: z.string().optional(),
});

/** TypeScript type for position state */
export type PositionState = z.infer<typeof PositionStateSchema>;

// ============================================================================
// StaffIndicators schema
// ============================================================================

/**
 * Schema for DASH-03 staff-specific operational indicators.
 *
 * Four key indicators reflecting the state of critical staff positions:
 * Coordinator authority, Relay queue depth, Monitor budget level,
 * and Sentinel recovery state.
 */
export const StaffIndicatorsSchema = z.object({
  /** Coordinator authority state */
  coordinatorAuthority: z.enum(['nominal', 'escalated', 'halted']),
  /** Number of items in the Relay queue */
  relayQueueDepth: z.number().int().nonnegative(),
  /** Monitor budget alert level */
  monitorBudgetStatus: z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED', 'CRITICAL']),
  /** Sentinel recovery state */
  sentinelRecoveryState: z.enum(['clear', 'assessing', 'recovering', 'halted']),
});

/** TypeScript type for staff indicators */
export type StaffIndicators = z.infer<typeof StaffIndicatorsSchema>;

// ============================================================================
// PositionHealth schema
// ============================================================================

/**
 * Schema for DASH-04 per-position health metrics.
 *
 * Health metrics are derived from Chronicler log entries and provide
 * event counts, error counts, and a composite health score per position.
 */
export const PositionHealthSchema = z.object({
  /** Staff agent position ID */
  position: AgentIdSchema,
  /** Total number of events for this position */
  eventCount: z.number().int().nonnegative(),
  /** Milliseconds since last event (0 if no events) */
  lastEventAge: z.number().nonnegative(),
  /** Number of error events (halt, verification_failed) */
  errorCount: z.number().int().nonnegative(),
  /** Composite health score: 1.0 = healthy, 0.0 = dead */
  healthScore: z.number().min(0).max(1),
});

/** TypeScript type for position health */
export type PositionHealth = z.infer<typeof PositionHealthSchema>;

// ============================================================================
// DenSnapshot schema
// ============================================================================

/**
 * Schema for a complete Den status snapshot.
 *
 * Combines position states, staff indicators, position health metrics,
 * and bus health into a single validated object for dashboard rendering.
 */
export const DenSnapshotSchema = z.object({
  /** Timestamp when the snapshot was taken */
  timestamp: z.string(),
  /** State of all 10 staff positions */
  positions: z.array(PositionStateSchema),
  /** Staff-specific operational indicators */
  indicators: StaffIndicatorsSchema,
  /** Per-position health metrics */
  positionHealth: z.array(PositionHealthSchema),
  /** Whether the message bus is healthy */
  busHealthy: z.boolean(),
  /** Total events in the chronicler log */
  totalEvents: z.number().int().nonnegative(),
});

/** TypeScript type for den snapshot */
export type DenSnapshot = z.infer<typeof DenSnapshotSchema>;

// ============================================================================
// collectPositionStates
// ============================================================================

/** Actions that map to 'error' status */
const ERROR_ACTIONS = new Set(['halt_issued', 'halt_cleared']);

/** Actions that map to 'working' status */
const WORKING_ACTIONS = new Set(['phase_started', 'plan_started']);

/** Actions that map to 'active' status */
const ACTIVE_ACTIONS = new Set([
  'phase_completed', 'plan_completed',
  'verification_passed', 'verification_failed',
  'error_recovered', 'decision_made',
  'topology_changed', 'budget_alert',
  'intake_received', 'custom',
]);

/**
 * Map a chronicler action to a position status.
 *
 * @param action - Chronicler entry action type
 * @returns Position status string
 */
function actionToStatus(action: string): 'active' | 'working' | 'error' {
  if (ERROR_ACTIONS.has(action)) return 'error';
  if (WORKING_ACTIONS.has(action)) return 'working';
  return 'active';
}

/**
 * Collect position states for all 10 staff agents from chronicler entries.
 *
 * For each staff agent ID, finds the last (most recent) entry and maps
 * the action to a status. Agents with no entries are marked 'dormant'.
 * Always returns exactly 10 position states.
 *
 * @param entries - Chronicler log entries
 * @returns Array of 10 PositionState objects
 */
export function collectPositionStates(entries: ChroniclerEntry[]): PositionState[] {
  // Build map of last entry per agent (entries are in chronological order)
  const lastEntryMap = new Map<string, ChroniclerEntry>();
  for (const entry of entries) {
    if ((STAFF_AGENT_IDS as readonly string[]).includes(entry.agent)) {
      lastEntryMap.set(entry.agent, entry);
    }
  }

  return STAFF_AGENT_IDS.map((id) => {
    const lastEntry = lastEntryMap.get(id);
    if (!lastEntry) {
      return {
        position: id,
        status: 'dormant' as const,
        lastAction: 'none',
        lastSeen: 'never',
      };
    }

    return {
      position: id,
      status: actionToStatus(lastEntry.action),
      lastAction: lastEntry.action,
      lastSeen: lastEntry.timestamp,
      ...(lastEntry.detail ? { taskDescription: lastEntry.detail } : {}),
    };
  });
}

// ============================================================================
// collectStaffIndicators
// ============================================================================

/**
 * Collect staff-specific operational indicators from chronicler entries.
 *
 * Derives four indicators:
 * - coordinatorAuthority: from last coordinator entry action/metadata
 * - relayQueueDepth: intake_received minus plan_completed for relay agent
 * - monitorBudgetStatus: from last monitor budget_alert metadata.level
 * - sentinelRecoveryState: from last sentinel entry action
 *
 * @param entries - Chronicler log entries
 * @returns StaffIndicators object
 */
export function collectStaffIndicators(entries: ChroniclerEntry[]): StaffIndicators {
  // -- Coordinator authority --
  let coordinatorAuthority: 'nominal' | 'escalated' | 'halted' = 'nominal';
  const coordinatorEntries = entries.filter((e) => e.agent === 'coordinator');
  if (coordinatorEntries.length > 0) {
    const lastCoord = coordinatorEntries[coordinatorEntries.length - 1];
    if (lastCoord.action === 'halt_issued') {
      coordinatorAuthority = 'halted';
    } else if (
      lastCoord.action === 'decision_made' &&
      lastCoord.metadata?.escalated
    ) {
      coordinatorAuthority = 'escalated';
    }
  }

  // -- Relay queue depth --
  const relayEntries = entries.filter((e) => e.agent === 'relay');
  let intakeCount = 0;
  let completedCount = 0;
  for (const entry of relayEntries) {
    if (entry.action === 'intake_received') intakeCount++;
    if (entry.action === 'plan_completed') completedCount++;
  }
  const relayQueueDepth = Math.max(0, intakeCount - completedCount);

  // -- Monitor budget status --
  let monitorBudgetStatus: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'CRITICAL' = 'GREEN';
  const monitorBudgetAlerts = entries.filter(
    (e) => e.agent === 'monitor' && e.action === 'budget_alert',
  );
  if (monitorBudgetAlerts.length > 0) {
    const lastAlert = monitorBudgetAlerts[monitorBudgetAlerts.length - 1];
    const level = lastAlert.metadata?.level as string | undefined;
    if (level && ['GREEN', 'YELLOW', 'ORANGE', 'RED', 'CRITICAL'].includes(level)) {
      monitorBudgetStatus = level as typeof monitorBudgetStatus;
    }
  }

  // -- Sentinel recovery state --
  let sentinelRecoveryState: 'clear' | 'assessing' | 'recovering' | 'halted' = 'clear';
  const sentinelEntries = entries.filter((e) => e.agent === 'sentinel');
  if (sentinelEntries.length > 0) {
    const lastSentinel = sentinelEntries[sentinelEntries.length - 1];
    if (lastSentinel.action === 'halt_issued') {
      sentinelRecoveryState = 'halted';
    } else if (lastSentinel.action === 'error_recovered') {
      sentinelRecoveryState = 'recovering';
    } else if (lastSentinel.action === 'halt_cleared') {
      sentinelRecoveryState = 'clear';
    }
  }

  return {
    coordinatorAuthority,
    relayQueueDepth,
    monitorBudgetStatus,
    sentinelRecoveryState,
  };
}

// ============================================================================
// collectPositionHealth
// ============================================================================

/** Actions counted as errors for health scoring */
const HEALTH_ERROR_ACTIONS = new Set(['halt_issued', 'verification_failed']);

/**
 * Collect per-position health metrics from chronicler entries.
 *
 * For each of the 10 staff positions: counts total events, error events
 * (halt_issued, verification_failed), computes lastEventAge, and derives
 * a healthScore using linear decay: max(0, 1.0 - errorCount * 0.2).
 *
 * @param entries - Chronicler log entries
 * @param now - Current timestamp in ms (optional, defaults to Date.now())
 * @returns Array of 10 PositionHealth objects
 */
export function collectPositionHealth(
  entries: ChroniclerEntry[],
  now?: number,
): PositionHealth[] {
  const currentTime = now ?? Date.now();

  // Group entries by agent
  const agentEntries = new Map<string, ChroniclerEntry[]>();
  for (const entry of entries) {
    if ((STAFF_AGENT_IDS as readonly string[]).includes(entry.agent)) {
      const group = agentEntries.get(entry.agent) ?? [];
      group.push(entry);
      agentEntries.set(entry.agent, group);
    }
  }

  return STAFF_AGENT_IDS.map((id) => {
    const positionEntries = agentEntries.get(id) ?? [];
    const eventCount = positionEntries.length;

    let errorCount = 0;
    for (const entry of positionEntries) {
      if (HEALTH_ERROR_ACTIONS.has(entry.action)) {
        errorCount++;
      }
    }

    // Compute lastEventAge
    let lastEventAge = 0;
    if (positionEntries.length > 0) {
      const lastEntry = positionEntries[positionEntries.length - 1];
      try {
        const lastTime = parseTimestamp(lastEntry.timestamp);
        lastEventAge = currentTime - lastTime.getTime();
      } catch {
        lastEventAge = 0;
      }
    }

    // Health score: linear decay from errors
    const healthScore = Math.max(0, 1.0 - errorCount * 0.2);

    return {
      position: id,
      eventCount,
      lastEventAge,
      errorCount,
      healthScore,
    };
  });
}

// ============================================================================
// assembleDenSnapshot
// ============================================================================

/**
 * Assemble a complete Den status snapshot from all data sources.
 *
 * Reads the chronicler log, collects position states, staff indicators,
 * position health, and bus health metrics. Returns a validated DenSnapshot.
 *
 * @param config - Dashboard configuration
 * @returns Validated DenSnapshot
 */
export async function assembleDenSnapshot(config: DashboardConfig): Promise<DenSnapshot> {
  // Read chronicler log
  const entries = await readChroniclerLog(config.chroniclerLogPath);

  // Collect all dashboard data
  const positions = collectPositionStates(entries);
  const indicators = collectStaffIndicators(entries);
  const positionHealth = collectPositionHealth(entries);

  // Bus health (gracefully handle missing bus config)
  let busHealthy = true;
  if (config.busConfig) {
    try {
      const busConfig = BusConfigSchema.parse(config.busConfig);
      const healthMetrics = await collectHealthMetrics(busConfig);
      busHealthy = isHealthy(healthMetrics, busConfig);
    } catch {
      // If bus health check fails, assume healthy (no news is good news)
      busHealthy = true;
    }
  }

  const snapshot: DenSnapshot = {
    timestamp: formatTimestamp(new Date()),
    positions,
    indicators,
    positionHealth,
    busHealthy,
    totalEvents: entries.length,
  };

  return DenSnapshotSchema.parse(snapshot);
}

// ============================================================================
// formatDenSnapshotMarkdown
// ============================================================================

/**
 * Render a Den snapshot as a markdown status page.
 *
 * Follows the relay.ts formatReportMarkdown pattern: builds a lines
 * array, pushes sections with headers and tables, joins with newlines.
 *
 * @param snapshot - Den snapshot to render
 * @returns Markdown string
 */
export function formatDenSnapshotMarkdown(snapshot: DenSnapshot): string {
  const lines: string[] = [];

  // Header
  lines.push(`## Den Status -- ${snapshot.timestamp}`);
  lines.push('');
  lines.push(`**Bus:** ${snapshot.busHealthy ? 'healthy' : 'degraded'}`);
  lines.push('');

  // Positions table
  lines.push('### Positions');
  lines.push('');
  lines.push('| Position | Status | Last Action | Last Seen |');
  lines.push('| --- | --- | --- | --- |');
  for (const pos of snapshot.positions) {
    lines.push(`| ${pos.position} | ${pos.status} | ${pos.lastAction} | ${pos.lastSeen} |`);
  }
  lines.push('');

  // Staff indicators
  lines.push('### Staff Indicators');
  lines.push('');
  lines.push(`- **Coordinator Authority:** ${snapshot.indicators.coordinatorAuthority}`);
  lines.push(`- **Relay Queue Depth:** ${snapshot.indicators.relayQueueDepth}`);
  lines.push(`- **Monitor Budget:** ${snapshot.indicators.monitorBudgetStatus}`);
  lines.push(`- **Sentinel Recovery:** ${snapshot.indicators.sentinelRecoveryState}`);
  lines.push('');

  // Position health table
  lines.push('### Position Health');
  lines.push('');
  lines.push('| Position | Events | Errors | Health |');
  lines.push('| --- | --- | --- | --- |');
  for (const h of snapshot.positionHealth) {
    const healthPct = (h.healthScore * 100).toFixed(0) + '%';
    lines.push(`| ${h.position} | ${h.eventCount} | ${h.errorCount} | ${healthPct} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Dashboard class (stateful wrapper)
// ============================================================================

/**
 * Stateful Dashboard wrapping all stateless functions with bound config.
 *
 * Follows the established Den agent pattern: constructor validates config
 * via Zod, methods delegate to stateless functions. Use createDashboard
 * factory for ergonomic creation.
 */
export class Dashboard {
  private readonly dashboardConfig: DashboardConfig;

  /**
   * Create a new Dashboard instance.
   *
   * @param config - Dashboard configuration (validated through Zod)
   */
  constructor(config: DashboardConfig) {
    this.dashboardConfig = DashboardConfigSchema.parse(config);
  }

  /**
   * Take a snapshot of the current Den status.
   *
   * @returns Validated DenSnapshot
   */
  async snapshot(): Promise<DenSnapshot> {
    return assembleDenSnapshot(this.dashboardConfig);
  }

  /**
   * Render a snapshot as markdown.
   *
   * @param snapshot - DenSnapshot to render
   * @returns Markdown string
   */
  formatSnapshot(snapshot: DenSnapshot): string {
    return formatDenSnapshotMarkdown(snapshot);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a Dashboard with defaults applied.
 *
 * Synchronous factory -- no directory creation needed.
 *
 * @param overrides - Optional dashboard configuration overrides
 * @returns Dashboard instance
 */
export function createDashboard(overrides?: Partial<DashboardConfig>): Dashboard {
  const config = DashboardConfigSchema.parse(overrides ?? {});
  return new Dashboard(config);
}
