/**
 * Sentinel agent for the GSD Den.
 *
 * The safety net -- monitors for failures, classifies severity, selects
 * recovery actions, issues emergency HALT signals, plans rollbacks, and
 * assesses crash damage. When things go wrong, the Sentinel decides what
 * to do before the Coordinator acts.
 *
 * Provides 8 core capabilities:
 *   1. Recovery decision matrix -- maps 9 failure types to recovery actions
 *   2. Emergency HALT -- priority 0 broadcast to all positions
 *   3. HALT clear -- coordinator-authorized resume signal
 *   4. Rollback planning -- 6-step recovery plan (no execution)
 *   5. Crash damage assessment -- pure boolean logic on filesystem state
 *   6. JSONL logging -- append-only audit trail of sentinel events
 *   7. Sentinel class -- stateful wrapper with bound config
 *   8. createSentinel factory -- synchronous construction with defaults
 *
 * Satisfies: INT-02 (recovery from all failure scenarios),
 *            PROC-04 (emergency HALT protocol)
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { BusMessageSchema } from './types.js';
import type { BusConfig, BusMessage } from './types.js';
import { formatTimestamp } from './encoder.js';
import { sendMessage } from './bus.js';

// ============================================================================
// SentinelConfig schema
// ============================================================================

/**
 * Configuration for the Sentinel agent.
 */
export const SentinelConfigSchema = z.object({
  /** Bus configuration for message sending */
  busConfig: z.any(),
  /** Path to the JSONL sentinel log file */
  logPath: z.string().default('.planning/den/logs/sentinel.jsonl'),
  /** Agent identifier */
  agentId: z.string().default('sentinel'),
});

/** TypeScript type for sentinel config */
export type SentinelConfig = z.infer<typeof SentinelConfigSchema>;

// ============================================================================
// FailureType enum
// ============================================================================

/**
 * All failure types the Sentinel can classify.
 *
 * 9 types covering the full spectrum from minor test failures
 * to critical infrastructure corruption.
 */
export const FailureTypeSchema = z.enum([
  'test-failure-single',
  'test-failure-cascade',
  'budget-overage',
  'context-exhaustion',
  'verification-rejection',
  'build-failure',
  'session-crash',
  'bus-failure',
  'git-state-corrupted',
]);

/** TypeScript type for failure types */
export type FailureType = z.infer<typeof FailureTypeSchema>;

// ============================================================================
// RecoveryAction schema
// ============================================================================

/**
 * A recovery action selected by the decision matrix.
 *
 * Maps a failure type to severity, action, escalation path,
 * and whether an emergency HALT is required.
 */
export const RecoveryActionSchema = z.object({
  /** The failure type that triggered this action */
  failureType: FailureTypeSchema,
  /** Severity classification */
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  /** Recovery action to take */
  action: z.enum(['retry', 'rollback', 'conserve', 'rotate', 'assess', 'halt', 'split-session']),
  /** Description of escalation path */
  escalation: z.string(),
  /** Whether this failure requires an emergency HALT */
  requiresHalt: z.boolean(),
});

/** TypeScript type for recovery actions */
export type RecoveryAction = z.infer<typeof RecoveryActionSchema>;

// ============================================================================
// RollbackPlan schema
// ============================================================================

/**
 * A planned rollback to a known-good state.
 *
 * Does NOT execute git commands -- that is the executor's job.
 * This is a pure plan with 6 ordered steps.
 */
export const RollbackPlanSchema = z.object({
  /** Target git SHA to roll back to */
  targetSha: z.string(),
  /** Phase context for the rollback */
  phase: z.string(),
  /** Reason for the rollback */
  reason: z.string(),
  /** Ordered steps to execute the rollback */
  steps: z.array(z.string()),
});

/** TypeScript type for rollback plans */
export type RollbackPlan = z.infer<typeof RollbackPlanSchema>;

// ============================================================================
// DamageAssessment schema
// ============================================================================

/**
 * Assessment of damage after a crash or unexpected termination.
 *
 * Based on 3 filesystem state checks: state exists, bus clean, uncommitted work.
 */
export const DamageAssessmentSchema = z.object({
  /** Damage severity level */
  level: z.enum(['none', 'minor', 'significant']),
  /** Human-readable description of the damage */
  description: z.string(),
  /** Recommended recovery action */
  recommendedAction: z.enum(['resume', 'recover', 'investigate']),
});

/** TypeScript type for damage assessments */
export type DamageAssessment = z.infer<typeof DamageAssessmentSchema>;

// ============================================================================
// SentinelEntry schema (JSONL log)
// ============================================================================

/**
 * Schema for a single sentinel log entry.
 *
 * Each entry is one line of JSONL in the sentinel's audit log.
 */
export const SentinelEntrySchema = z.object({
  /** Compact timestamp when the event occurred */
  timestamp: z.string(),
  /** Type of sentinel event */
  type: z.enum([
    'failure-assessed',
    'halt-issued',
    'halt-cleared',
    'rollback-planned',
    'crash-assessed',
    'recovery-action',
  ]),
  /** Phase context */
  phase: z.string(),
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for sentinel entries */
export type SentinelEntry = z.infer<typeof SentinelEntrySchema>;

// ============================================================================
// Recovery decision matrix
// ============================================================================

/** The decision matrix mapping failure types to recovery actions */
const DECISION_MATRIX: Record<FailureType, RecoveryAction> = {
  'test-failure-single': {
    failureType: 'test-failure-single',
    severity: 'low',
    action: 'retry',
    escalation: 'Sentinel analyzes root cause',
    requiresHalt: false,
  },
  'test-failure-cascade': {
    failureType: 'test-failure-cascade',
    severity: 'medium',
    action: 'rollback',
    escalation: 'Coordinator consults user',
    requiresHalt: false,
  },
  'budget-overage': {
    failureType: 'budget-overage',
    severity: 'medium',
    action: 'conserve',
    escalation: 'Prepare session split',
    requiresHalt: false,
  },
  'context-exhaustion': {
    failureType: 'context-exhaustion',
    severity: 'high',
    action: 'rotate',
    escalation: 'Force session split if insufficient',
    requiresHalt: false,
  },
  'verification-rejection': {
    failureType: 'verification-rejection',
    severity: 'medium',
    action: 'assess',
    escalation: 'Coordinate with Planner for reroute',
    requiresHalt: false,
  },
  'build-failure': {
    failureType: 'build-failure',
    severity: 'high',
    action: 'rollback',
    escalation: 'Coordinator consults user',
    requiresHalt: false,
  },
  'session-crash': {
    failureType: 'session-crash',
    severity: 'critical',
    action: 'assess',
    escalation: 'Report damage to Coordinator',
    requiresHalt: false,
  },
  'bus-failure': {
    failureType: 'bus-failure',
    severity: 'critical',
    action: 'halt',
    escalation: 'Coordinator pauses operation',
    requiresHalt: true,
  },
  'git-state-corrupted': {
    failureType: 'git-state-corrupted',
    severity: 'critical',
    action: 'halt',
    escalation: 'Coordinator pauses operation',
    requiresHalt: true,
  },
};

/** Severity to recommended action mapping for HALT messages */
const HALT_RECOMMENDATIONS: Record<string, string> = {
  low: 'Review and retry',
  medium: 'Rollback to last known good state',
  high: 'Immediate intervention required',
  critical: 'Full stop -- investigate before any action',
};

// ============================================================================
// Stateless functions
// ============================================================================

/**
 * Classify a failure and select the correct recovery action.
 *
 * Pure function -- lookup in the decision matrix. Returns a validated
 * RecoveryAction with severity, action, escalation path, and HALT flag.
 *
 * @param failureType - The failure type to assess
 * @param _context - Optional additional context (reserved for future use)
 * @returns Recovery action from the decision matrix
 */
export function assessFailure(failureType: FailureType, _context?: Record<string, unknown>): RecoveryAction {
  return DECISION_MATRIX[failureType];
}

/**
 * Issue an emergency HALT to all positions via the bus.
 *
 * Sends a priority 0 HALT message from sentinel to 'all' with reason,
 * severity, and recommended action in the payload.
 *
 * @param config - Sentinel configuration
 * @param reason - Human-readable reason for the HALT
 * @param severity - Severity level of the triggering failure
 * @returns The sent BusMessage
 */
export async function issueHalt(
  config: SentinelConfig,
  reason: string,
  severity: string,
): Promise<BusMessage> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const recommendedAction = HALT_RECOMMENDATIONS[severity] ?? 'Investigate immediately';

  const payloadLines = [
    `REASON:${reason}`,
    `SEVERITY:${severity}`,
    `RECOMMENDED_ACTION:${recommendedAction}`,
  ];

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 0,
      opcode: 'HALT',
      src: config.agentId,
      dst: 'all',
      length: payloadLines.length,
    },
    payload: payloadLines,
  });

  await sendMessage(config.busConfig, msg);

  return msg;
}

/**
 * Send a CLEAR signal to cancel a previous HALT.
 *
 * Priority 0, opcode NOP, dst 'all'. By default (coordinatorOverride=true),
 * the src is 'coordinator' because only the coordinator authorizes resume.
 * When coordinatorOverride is false, src is the sentinel's own agentId.
 *
 * @param config - Sentinel configuration
 * @param reason - Reason for clearing (default: 'Recovery complete')
 * @param coordinatorOverride - If true (default), src is 'coordinator'
 * @returns The sent BusMessage
 */
export async function clearHalt(
  config: SentinelConfig,
  reason?: string,
  coordinatorOverride: boolean = true,
): Promise<BusMessage> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const clearReason = reason ?? 'Recovery complete';
  const src = coordinatorOverride ? 'coordinator' : config.agentId;

  const payloadLines = [
    `STATUS:HALT_CLEARED`,
    `REASON:${clearReason}`,
  ];

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 0,
      opcode: 'NOP',
      src,
      dst: 'all',
      length: payloadLines.length,
    },
    payload: payloadLines,
  });

  await sendMessage(config.busConfig, msg);

  return msg;
}

/**
 * Create a rollback plan to a known-good state.
 *
 * Pure function -- produces a RollbackPlan with 6 ordered steps.
 * Does NOT execute any git commands (that is the executor's job).
 *
 * @param targetSha - Git SHA to roll back to
 * @param phase - Phase context
 * @param reason - Reason for the rollback
 * @returns RollbackPlan object
 */
export function planRollback(targetSha: string, phase: string, reason: string): RollbackPlan {
  return {
    targetSha,
    phase,
    reason,
    steps: [
      'Verify target SHA exists',
      'Run tests at target to confirm safety',
      'Execute git reset to target',
      'Update STATE.md to reflect rollback',
      'Notify Coordinator of new position',
      'Notify Planner to recalculate trajectory',
    ],
  };
}

/**
 * Assess crash damage from filesystem state indicators.
 *
 * Pure function -- takes 3 booleans and returns a DamageAssessment.
 * No filesystem access, no side effects.
 *
 * @param stateExists - Whether STATE.md exists and is readable
 * @param busClean - Whether the bus has no orphaned messages
 * @param uncommittedWork - Whether there are uncommitted changes
 * @returns DamageAssessment with level, description, and recommended action
 */
export function assessCrashDamage(
  stateExists: boolean,
  busClean: boolean,
  uncommittedWork: boolean,
): DamageAssessment {
  // State missing is always significant
  if (!stateExists) {
    return {
      level: 'significant',
      description: 'STATE.md missing -- cannot determine project position or recovery point',
      recommendedAction: 'investigate',
    };
  }

  // State exists but bus has orphaned messages
  if (!busClean) {
    return {
      level: 'minor',
      description: 'Bus has orphaned messages -- may need replay or cleanup',
      recommendedAction: 'recover',
    };
  }

  // State exists, bus clean, but uncommitted work
  if (uncommittedWork) {
    return {
      level: 'minor',
      description: 'Uncommitted work detected -- needs commit or stash before resuming',
      recommendedAction: 'recover',
    };
  }

  // All clean
  return {
    level: 'none',
    description: 'No damage detected -- system state is consistent',
    recommendedAction: 'resume',
  };
}

// ============================================================================
// JSONL logging
// ============================================================================

/**
 * Append a sentinel entry to a JSONL log file.
 *
 * Creates the directory if it does not exist. Each entry is one JSON
 * object per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Sentinel entry to append
 */
export async function appendSentinelEntry(logPath: string, entry: SentinelEntry): Promise<void> {
  const validated = SentinelEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all sentinel entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated SentinelEntry objects
 */
export async function readSentinelLog(logPath: string): Promise<SentinelEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => SentinelEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Sentinel class (stateful wrapper)
// ============================================================================

/**
 * Stateful Sentinel wrapping all stateless functions with bound config.
 *
 * Follows the established Den agent pattern: constructor validates config
 * via Zod, methods delegate to stateless functions. Use createSentinel
 * factory for ergonomic creation.
 */
export class Sentinel {
  private readonly sentinelConfig: SentinelConfig;

  /**
   * Create a new Sentinel instance.
   *
   * @param config - Sentinel configuration (validated through Zod)
   */
  constructor(config: SentinelConfig) {
    this.sentinelConfig = SentinelConfigSchema.parse(config);
  }

  /**
   * Classify a failure and select recovery action.
   *
   * @param failureType - The failure type to assess
   * @param context - Optional additional context
   * @returns Recovery action from the decision matrix
   */
  assessFailure(failureType: FailureType, context?: Record<string, unknown>): RecoveryAction {
    return assessFailure(failureType, context);
  }

  /**
   * Issue an emergency HALT to all positions.
   *
   * @param reason - Reason for the HALT
   * @param severity - Severity level
   * @returns The sent BusMessage
   */
  async issueHalt(reason: string, severity: string): Promise<BusMessage> {
    return issueHalt(this.sentinelConfig, reason, severity);
  }

  /**
   * Clear a previous HALT (defaults to coordinator override).
   *
   * @param reason - Reason for clearing
   * @param coordinatorOverride - If true, src is 'coordinator'
   * @returns The sent BusMessage
   */
  async clearHalt(reason?: string, coordinatorOverride?: boolean): Promise<BusMessage> {
    return clearHalt(this.sentinelConfig, reason, coordinatorOverride);
  }

  /**
   * Plan a rollback to a known-good state.
   *
   * @param targetSha - Git SHA to roll back to
   * @param phase - Phase context
   * @param reason - Reason for rollback
   * @returns RollbackPlan object
   */
  planRollback(targetSha: string, phase: string, reason: string): RollbackPlan {
    return planRollback(targetSha, phase, reason);
  }

  /**
   * Assess crash damage from filesystem state.
   *
   * @param stateExists - STATE.md exists
   * @param busClean - Bus has no orphans
   * @param uncommittedWork - Uncommitted changes present
   * @returns DamageAssessment
   */
  assessCrashDamage(stateExists: boolean, busClean: boolean, uncommittedWork: boolean): DamageAssessment {
    return assessCrashDamage(stateExists, busClean, uncommittedWork);
  }

  /**
   * Append an entry to the sentinel log.
   *
   * @param entry - Entry to append
   */
  async appendEntry(entry: SentinelEntry): Promise<void> {
    return appendSentinelEntry(this.sentinelConfig.logPath, entry);
  }

  /**
   * Read the full sentinel log.
   *
   * @returns Array of all sentinel entries
   */
  async getLog(): Promise<SentinelEntry[]> {
    return readSentinelLog(this.sentinelConfig.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a Sentinel with defaults applied.
 *
 * Synchronous factory -- no directory creation needed (bus dirs managed
 * by initBus, log dirs created on first append).
 *
 * @param config - Sentinel configuration (defaults applied via Zod)
 * @returns Sentinel instance
 */
export function createSentinel(config: Partial<SentinelConfig> & { busConfig: BusConfig }): Sentinel {
  const validated = SentinelConfigSchema.parse(config);
  return new Sentinel(validated);
}
