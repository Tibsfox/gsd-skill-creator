/**
 * Coordinator agent for the GSD Den.
 *
 * Top-level orchestrator with operational authority over all positions.
 * Makes go/no-go decisions before phase transitions, resolves conflicts
 * between positions, manages escalation through 4 levels, and logs all
 * decisions in append-only JSONL format.
 *
 * Provides 5 core capabilities:
 *   1. Decision logging (JSONL) -- append-only audit trail
 *   2. Readiness check -- polls positions, aggregates GO/NO-GO
 *   3. Phase transition -- sends EXEC + notification messages
 *   4. Escalation chain -- routes through 4 levels (0-4)
 *   5. Coordinator class -- stateful wrapper with bound config
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { AgentIdSchema, BusMessageSchema } from './types.js';
import type { BusConfig, BusMessage, AgentId } from './types.js';
import { formatTimestamp } from './encoder.js';
import { sendMessage } from './bus.js';

// ============================================================================
// Decision Entry schema
// ============================================================================

/**
 * Schema for a single decision log entry.
 *
 * Each entry is one line of JSONL in the coordinator's decision log.
 */
export const DecisionEntrySchema = z.object({
  /** Compact timestamp when the decision was made */
  timestamp: z.string(),
  /** Type of decision */
  type: z.enum(['readiness-check', 'phase-transition', 'conflict', 'escalation', 'override']),
  /** Phase context for the decision */
  phase: z.string(),
  /** Outcome of the decision */
  result: z.string(),
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for decision entries */
export type DecisionEntry = z.infer<typeof DecisionEntrySchema>;

// ============================================================================
// Readiness schemas
// ============================================================================

/**
 * A single position's readiness response.
 */
export const ReadinessResponseSchema = z.object({
  /** Which position responded */
  position: AgentIdSchema,
  /** GO or NO-GO decision */
  decision: z.enum(['GO', 'NO-GO']),
  /** Reason for the decision */
  reason: z.string(),
});

/** TypeScript type for readiness responses */
export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;

/**
 * Aggregated result of a readiness check across all positions.
 */
export const ReadinessResultSchema = z.object({
  /** Target phase being checked */
  phase: z.string(),
  /** Overall result: GO only if ALL positions GO and no timeouts */
  result: z.enum(['GO', 'NO-GO']),
  /** Individual responses received */
  responses: z.array(ReadinessResponseSchema),
  /** Positions that did not respond within the timeout */
  timedOut: z.array(AgentIdSchema),
});

/** TypeScript type for readiness results */
export type ReadinessResult = z.infer<typeof ReadinessResultSchema>;

// ============================================================================
// Phase transition schema
// ============================================================================

/**
 * Result of a phase transition operation.
 */
export const PhaseTransitionResultSchema = z.object({
  /** Phase transitioning from */
  fromPhase: z.string(),
  /** Phase transitioning to */
  toPhase: z.string(),
  /** Target position receiving the EXEC message */
  target: AgentIdSchema,
  /** Path to the EXEC message file */
  execMessagePath: z.string(),
  /** Paths to notification message files */
  notificationPaths: z.array(z.string()),
});

/** TypeScript type for phase transition results */
export type PhaseTransitionResult = z.infer<typeof PhaseTransitionResultSchema>;

// ============================================================================
// Escalation schemas
// ============================================================================

/**
 * Request to escalate an issue through the escalation chain.
 */
export const EscalationRequestSchema = z.object({
  /** Escalation level (0-4) */
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  /** Description of the issue */
  issue: z.string(),
  /** Positions involved in the issue */
  positionsInvolved: z.array(AgentIdSchema),
  /** Optional recommendation for resolution */
  recommendation: z.string().optional(),
  /** Urgency level */
  urgency: z.enum(['blocking', 'soon', 'when_convenient']),
});

/** TypeScript type for escalation requests */
export type EscalationRequest = z.infer<typeof EscalationRequestSchema>;

/**
 * Result of an escalation operation.
 */
export const EscalationResultSchema = z.object({
  /** Escalation level that was processed */
  level: z.number(),
  /** Action taken at this level */
  action: z.enum(['self-resolve', 'coordinator-evaluate', 'coordinator-resolve', 'user-via-relay', 'emergency']),
  /** Paths to any messages generated */
  messagesGenerated: z.array(z.string()),
});

/** TypeScript type for escalation results */
export type EscalationResult = z.infer<typeof EscalationResultSchema>;

// ============================================================================
// Coordinator config schema
// ============================================================================

/**
 * Configuration for the Coordinator agent.
 */
export const CoordinatorConfigSchema = z.object({
  /** Bus configuration for message sending */
  busConfig: z.any(),
  /** Path to the JSONL decision log file */
  logPath: z.string().default('.planning/den/logs/coordinator.jsonl'),
  /** Default positions to poll during readiness checks */
  positions: z.array(AgentIdSchema).default(['planner', 'configurator', 'monitor', 'verifier']),
});

/** TypeScript type for coordinator config */
export type CoordinatorConfig = z.infer<typeof CoordinatorConfigSchema>;

// ============================================================================
// Decision logging (JSONL)
// ============================================================================

/**
 * Append a decision entry to a JSONL log file.
 *
 * Creates the file if it does not exist. Each entry is one JSON object
 * per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Decision entry to append
 */
export async function appendDecision(logPath: string, entry: DecisionEntry): Promise<void> {
  const validated = DecisionEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all decision entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated DecisionEntry objects
 */
export async function readDecisionLog(logPath: string): Promise<DecisionEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => DecisionEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Response collector type
// ============================================================================

/**
 * Callback that collects readiness responses from positions.
 *
 * The default implementation would poll the bus; for tests, a mock
 * collector is injected to avoid filesystem timing complexity.
 */
export type ResponseCollector = (
  positions: AgentId[],
  targetPhase: string,
) => Promise<ReadinessResponse[]>;

// ============================================================================
// Readiness check
// ============================================================================

/** Options for readiness check */
export interface ReadinessCheckOptions {
  /** Timeout in ms per position (default: 30000) */
  timeoutMs?: number;
  /** Path to log the result automatically */
  logPath?: string;
  /** Custom response collector (for testing) */
  responseCollector?: ResponseCollector;
}

/**
 * Run a readiness check across all specified positions.
 *
 * Sends CMP #readiness messages to each position, then collects responses.
 * If ALL responses are GO and no timeouts, result is GO. Otherwise NO-GO.
 *
 * @param config - Bus configuration
 * @param positions - Positions to poll
 * @param targetPhase - Phase being checked for readiness
 * @param options - Optional timeout, logPath, responseCollector
 * @returns Aggregated readiness result
 */
export async function readinessCheck(
  config: BusConfig,
  positions: AgentId[],
  targetPhase: string,
  options?: ReadinessCheckOptions,
): Promise<ReadinessResult> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  // Send CMP messages to each position
  for (const position of positions) {
    const msg: BusMessage = BusMessageSchema.parse({
      header: {
        timestamp,
        priority: 1,
        opcode: 'CMP',
        src: 'coordinator',
        dst: position,
        length: 2,
      },
      payload: ['POLL:readiness', `PHASE:${targetPhase}`],
    });
    await sendMessage(config, msg);
  }

  // Collect responses (mock-injected for tests, default would poll bus)
  const collector = options?.responseCollector;
  const responses: ReadinessResponse[] = collector
    ? await collector(positions, targetPhase)
    : [];

  // Determine which positions timed out (responded positions vs polled positions)
  const respondedPositions = new Set(responses.map((r) => r.position));
  const timedOut = positions.filter((p) => !respondedPositions.has(p));

  // Result is GO only if all responses are GO and no timeouts
  const allGo = responses.every((r) => r.decision === 'GO');
  const noTimeouts = timedOut.length === 0;
  const result: 'GO' | 'NO-GO' = (allGo && noTimeouts) ? 'GO' : 'NO-GO';

  const readinessResult: ReadinessResult = {
    phase: targetPhase,
    result,
    responses,
    timedOut,
  };

  // Log if logPath provided
  if (options?.logPath) {
    await appendDecision(options.logPath, {
      timestamp,
      type: 'readiness-check',
      phase: targetPhase,
      result,
      detail: {
        responses: responses.length,
        timedOut: timedOut.length,
        positions: positions.length,
      },
    });
  }

  return readinessResult;
}

// ============================================================================
// Phase transition
// ============================================================================

/** Options for phase transition */
export interface PhaseTransitionOptions {
  /** Optional plan reference string */
  plan?: string;
  /** Path to log the transition */
  logPath?: string;
}

/**
 * Execute a phase transition: send EXEC to target + STATUS to chronicler + STATUS to monitor.
 *
 * @param config - Bus configuration
 * @param fromPhase - Phase transitioning from
 * @param toPhase - Phase transitioning to
 * @param targetPosition - Position receiving the EXEC message
 * @param options - Optional plan reference and logPath
 * @returns Phase transition result with message paths
 */
export async function phaseTransition(
  config: BusConfig,
  fromPhase: string,
  toPhase: string,
  targetPosition: AgentId,
  options?: PhaseTransitionOptions,
): Promise<PhaseTransitionResult> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const payloadLines = [`PHASE:${toPhase}`, `FROM:${fromPhase}`];
  if (options?.plan) {
    payloadLines.push(`PLAN:${options.plan}`);
  }

  // EXEC message to target position (priority 1)
  const execMsg: BusMessage = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 1,
      opcode: 'EXEC',
      src: 'coordinator',
      dst: targetPosition,
      length: payloadLines.length,
    },
    payload: payloadLines,
  });
  const execPath = await sendMessage(config, execMsg);

  // STATUS notification to chronicler (priority 6)
  const chroniclerMsg: BusMessage = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 6,
      opcode: 'STATUS',
      src: 'coordinator',
      dst: 'chronicler',
      length: 2,
    },
    payload: [`TRANSITION:${fromPhase}->${toPhase}`, `TARGET:${targetPosition}`],
  });
  const chroniclerPath = await sendMessage(config, chroniclerMsg);

  // STATUS notification to monitor (priority 6)
  const monitorMsg: BusMessage = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 6,
      opcode: 'STATUS',
      src: 'coordinator',
      dst: 'monitor',
      length: 2,
    },
    payload: [`TRANSITION:${fromPhase}->${toPhase}`, `TARGET:${targetPosition}`],
  });
  const monitorPath = await sendMessage(config, monitorMsg);

  const result: PhaseTransitionResult = {
    fromPhase,
    toPhase,
    target: targetPosition,
    execMessagePath: execPath,
    notificationPaths: [chroniclerPath, monitorPath],
  };

  // Log if logPath provided
  if (options?.logPath) {
    await appendDecision(options.logPath, {
      timestamp,
      type: 'phase-transition',
      phase: toPhase,
      result: 'completed',
      detail: {
        fromPhase,
        toPhase,
        target: targetPosition,
        plan: options.plan ?? null,
      },
    });
  }

  return result;
}

// ============================================================================
// Escalation chain
// ============================================================================

/** Options for escalation */
export interface EscalationOptions {
  /** Path to log the escalation */
  logPath?: string;
}

/**
 * Escalate an issue through the 4-level escalation chain.
 *
 * Level 0: Self-resolve (no messages)
 * Level 1: Send CMP to coordinator for evaluation
 * Level 2: Coordinator logs conflict resolution
 * Level 3: Send SEND to relay for user escalation
 * Level 4: Send HALT to all (emergency)
 *
 * @param config - Bus configuration
 * @param request - Escalation request with level, issue, positions
 * @param options - Optional logPath
 * @returns Escalation result with action and generated message paths
 */
export async function escalate(
  config: BusConfig,
  request: EscalationRequest,
  options?: EscalationOptions,
): Promise<EscalationResult> {
  const validated = EscalationRequestSchema.parse(request);
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const messagesGenerated: string[] = [];

  let action: EscalationResult['action'];

  switch (validated.level) {
    case 0: {
      // Self-resolve: no messages generated
      action = 'self-resolve';
      break;
    }

    case 1: {
      // Send CMP to coordinator for evaluation
      const msg: BusMessage = BusMessageSchema.parse({
        header: {
          timestamp,
          priority: 1,
          opcode: 'CMP',
          src: 'coordinator',
          dst: 'coordinator',
          length: 2,
        },
        payload: [`ESCALATION:${validated.issue}`, `POSITIONS:${validated.positionsInvolved.join(',')}`],
      });
      const path = await sendMessage(config, msg);
      messagesGenerated.push(path);
      action = 'coordinator-evaluate';
      break;
    }

    case 2: {
      // Coordinator resolves conflict -- log the resolution
      action = 'coordinator-resolve';
      // Log is handled below
      break;
    }

    case 3: {
      // Send SEND to relay for user escalation
      const msg: BusMessage = BusMessageSchema.parse({
        header: {
          timestamp,
          priority: 1,
          opcode: 'SEND',
          src: 'coordinator',
          dst: 'relay',
          length: 3,
        },
        payload: [
          `TYPE:escalation`,
          `ISSUE:${validated.issue}`,
          `URGENCY:${validated.urgency}`,
        ],
      });
      const path = await sendMessage(config, msg);
      messagesGenerated.push(path);
      action = 'user-via-relay';
      break;
    }

    case 4: {
      // Emergency: send HALT to all
      const msg: BusMessage = BusMessageSchema.parse({
        header: {
          timestamp,
          priority: 0,
          opcode: 'HALT',
          src: 'coordinator',
          dst: 'all',
          length: 2,
        },
        payload: [`EMERGENCY:${validated.issue}`, `POSITIONS:${validated.positionsInvolved.join(',')}`],
      });
      const path = await sendMessage(config, msg);
      messagesGenerated.push(path);
      action = 'emergency';
      break;
    }
  }

  // Log if logPath provided
  if (options?.logPath) {
    const logType = validated.level === 2 ? 'conflict' : 'escalation';
    await appendDecision(options.logPath, {
      timestamp,
      type: logType,
      phase: 'current',
      result: action!,
      detail: {
        level: validated.level,
        issue: validated.issue,
        positionsInvolved: validated.positionsInvolved,
        recommendation: validated.recommendation ?? null,
        urgency: validated.urgency,
      },
    });
  }

  return {
    level: validated.level,
    action: action!,
    messagesGenerated,
  };
}

// ============================================================================
// Coordinator class (stateful wrapper)
// ============================================================================

/**
 * Stateful Coordinator wrapping all stateless functions with bound config.
 *
 * Follows the Dispatcher pattern: constructor validates config via Zod,
 * stateless methods do the real work. Use createCoordinator factory for
 * ergonomic creation with filesystem setup.
 */
export class Coordinator {
  private readonly coordConfig: CoordinatorConfig;

  /**
   * Create a new Coordinator instance.
   *
   * @param config - Coordinator configuration (validated through Zod)
   */
  constructor(config: CoordinatorConfig) {
    this.coordConfig = CoordinatorConfigSchema.parse(config);
  }

  /**
   * Run a readiness check across configured positions.
   *
   * @param targetPhase - Phase to check readiness for
   * @param responseCollector - Optional mock collector for testing
   * @returns Readiness result
   */
  async runReadinessCheck(
    targetPhase: string,
    responseCollector?: ResponseCollector,
  ): Promise<ReadinessResult> {
    return readinessCheck(
      this.coordConfig.busConfig,
      this.coordConfig.positions,
      targetPhase,
      {
        logPath: this.coordConfig.logPath,
        responseCollector,
      },
    );
  }

  /**
   * Execute a phase transition.
   *
   * @param fromPhase - Phase transitioning from
   * @param toPhase - Phase transitioning to
   * @param target - Target position for EXEC
   * @param plan - Optional plan reference
   * @returns Phase transition result
   */
  async runPhaseTransition(
    fromPhase: string,
    toPhase: string,
    target: AgentId,
    plan?: string,
  ): Promise<PhaseTransitionResult> {
    return phaseTransition(
      this.coordConfig.busConfig,
      fromPhase,
      toPhase,
      target,
      {
        plan,
        logPath: this.coordConfig.logPath,
      },
    );
  }

  /**
   * Escalate an issue through the chain.
   *
   * @param request - Escalation request
   * @returns Escalation result
   */
  async runEscalation(request: EscalationRequest): Promise<EscalationResult> {
    return escalate(
      this.coordConfig.busConfig,
      request,
      { logPath: this.coordConfig.logPath },
    );
  }

  /**
   * Read the full decision log.
   *
   * @returns Array of all decision entries
   */
  async getDecisionLog(): Promise<DecisionEntry[]> {
    return readDecisionLog(this.coordConfig.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create and initialize a Coordinator.
 *
 * Ensures the log directory exists before returning the ready-to-use instance.
 *
 * @param config - Coordinator configuration
 * @returns Initialized Coordinator instance
 */
export async function createCoordinator(config: CoordinatorConfig): Promise<Coordinator> {
  const validated = CoordinatorConfigSchema.parse(config);
  await mkdir(dirname(validated.logPath), { recursive: true });
  return new Coordinator(validated);
}
