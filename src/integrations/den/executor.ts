/**
 * Executor agent for the GSD Den.
 *
 * The engine of the Den -- runs planned work in fresh context windows,
 * produces code/commits/documentation, reports progress via the bus,
 * and hands off artifacts to the Verifier for independent quality assessment.
 *
 * Provides 6 core capabilities:
 *   1. Context loading -- creates execution context from phase/plan reference
 *   2. Progress reporting -- sends STATUS messages to Coordinator via bus
 *   3. Artifact handoff -- sends MOV messages to Verifier with git SHA
 *   4. Blocker reporting -- sends priority 1 STATUS for blocking issues
 *   5. JSONL logging -- append-only audit trail of execution events
 *   6. Executor class -- stateful wrapper with bound config
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { BusMessageSchema } from './types.js';
import type { BusConfig } from './types.js';
import { formatTimestamp } from './encoder.js';
import { sendMessage } from './bus.js';

// ============================================================================
// ExecutorConfig schema
// ============================================================================

/**
 * Configuration for the Executor agent.
 */
export const ExecutorConfigSchema = z.object({
  /** Bus configuration for message sending */
  busConfig: z.any(),
  /** Path to the JSONL execution log file */
  logPath: z.string().default('.planning/den/logs/executor.jsonl'),
  /** Agent identifier */
  agentId: z.string().default('executor'),
});

/** TypeScript type for executor config */
export type ExecutorConfig = z.infer<typeof ExecutorConfigSchema>;

// ============================================================================
// ExecutionContext schema
// ============================================================================

/**
 * Execution context tracking state of a plan execution.
 *
 * Created by loadExecutionContext, updated as execution progresses.
 */
export const ExecutionContextSchema = z.object({
  /** Phase being executed */
  phase: z.string(),
  /** Plan being executed */
  plan: z.string(),
  /** List of artifact file paths produced */
  artifacts: z.array(z.string()),
  /** Git SHA of the commit, null until committed */
  gitSha: z.string().nullable(),
  /** Tokens consumed during execution */
  tokensUsed: z.number().int().nonnegative(),
  /** Current execution status */
  status: z.enum(['running', 'complete', 'blocked']),
});

/** TypeScript type for execution context */
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

// ============================================================================
// ArtifactHandoff schema
// ============================================================================

/**
 * Artifact handoff payload sent to the Verifier via MOV message.
 */
export const ArtifactHandoffSchema = z.object({
  /** List of artifact file paths */
  artifacts: z.array(z.string()),
  /** Git SHA of the commit containing the artifacts */
  gitSha: z.string().min(1),
  /** Phase the artifacts were produced in */
  phase: z.string(),
  /** Plan the artifacts were produced from */
  plan: z.string(),
});

/** TypeScript type for artifact handoff */
export type ArtifactHandoff = z.infer<typeof ArtifactHandoffSchema>;

// ============================================================================
// ProgressReport schema
// ============================================================================

/**
 * Progress report sent to the Coordinator via STATUS message.
 */
export const ProgressReportSchema = z.object({
  /** Phase being executed */
  phase: z.string(),
  /** Plan being executed */
  plan: z.string(),
  /** Current status (complete or blocked -- running not reported) */
  status: z.enum(['complete', 'blocked']),
  /** Artifacts produced so far */
  artifacts: z.array(z.string()),
  /** Git SHA if committed, null otherwise */
  gitSha: z.string().nullable(),
  /** Tokens consumed */
  tokensUsed: z.number().int().nonnegative(),
  /** List of blocking issues (empty if status is complete) */
  blockers: z.array(z.string()),
});

/** TypeScript type for progress report */
export type ProgressReport = z.infer<typeof ProgressReportSchema>;

// ============================================================================
// ExecutorEntry schema (JSONL log)
// ============================================================================

/**
 * Schema for a single executor log entry.
 *
 * Each entry is one line of JSONL in the executor's execution log.
 */
export const ExecutorEntrySchema = z.object({
  /** Compact timestamp when the event occurred */
  timestamp: z.string(),
  /** Type of executor event */
  type: z.enum(['execution-start', 'progress', 'handoff', 'blocker', 'execution-complete']),
  /** Phase context */
  phase: z.string(),
  /** Plan context */
  plan: z.string(),
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for executor entries */
export type ExecutorEntry = z.infer<typeof ExecutorEntrySchema>;

// ============================================================================
// Stateless functions
// ============================================================================

/**
 * Create an initial execution context for a phase/plan.
 *
 * Returns a context with status 'running', empty artifacts, null gitSha,
 * and 0 tokensUsed. Pure function with no side effects.
 *
 * @param phase - Phase identifier
 * @param plan - Plan identifier
 * @returns Initialized execution context
 */
export function loadExecutionContext(phase: string, plan: string): ExecutionContext {
  return {
    phase,
    plan,
    artifacts: [],
    gitSha: null,
    tokensUsed: 0,
    status: 'running',
  };
}

/**
 * Report progress to the Coordinator via a STATUS bus message.
 *
 * Sends a STATUS message (priority 6) from executor to coordinator
 * with the current execution context as payload.
 *
 * @param config - Executor configuration
 * @param context - Current execution context
 * @returns The context (unchanged)
 */
export async function reportProgress(
  config: ExecutorConfig,
  context: ExecutionContext,
): Promise<ExecutionContext> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const payloadLines = [
    `PHASE:${context.phase}`,
    `PLAN:${context.plan}`,
    `STATUS:${context.status}`,
    `ARTIFACTS:${context.artifacts.join(',')}`,
    `SHA:${context.gitSha ?? 'null'}`,
    `TOKENS:${context.tokensUsed}`,
  ];

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 6,
      opcode: 'STATUS',
      src: 'executor',
      dst: 'coordinator',
      length: payloadLines.length,
    },
    payload: payloadLines,
  });

  await sendMessage(config.busConfig, msg);

  return context;
}

/**
 * Hand off artifacts to the Verifier via a MOV bus message.
 *
 * Validates that the execution context is complete and has a git SHA
 * before sending. Fails fast if preconditions not met.
 *
 * @param config - Executor configuration
 * @param context - Completed execution context with gitSha
 * @returns Artifact handoff details
 * @throws Error if context.status !== 'complete' or context.gitSha is null
 */
export async function handoffToVerifier(
  config: ExecutorConfig,
  context: ExecutionContext,
): Promise<ArtifactHandoff> {
  if (context.status !== 'complete') {
    throw new Error(
      `Cannot hand off to verifier: status must be 'complete', got '${context.status}'`,
    );
  }

  if (context.gitSha === null) {
    throw new Error(
      'Cannot hand off to verifier: gitSha is required (must not be null)',
    );
  }

  const now = new Date();
  const timestamp = formatTimestamp(now);

  const payloadLines = [
    `PHASE:${context.phase}`,
    `PLAN:${context.plan}`,
    `ARTIFACTS:${context.artifacts.join(',')}`,
    `SHA:${context.gitSha}`,
    `TOKENS:${context.tokensUsed}`,
  ];

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 4,
      opcode: 'MOV',
      src: 'executor',
      dst: 'verifier',
      length: payloadLines.length,
    },
    payload: payloadLines,
  });

  await sendMessage(config.busConfig, msg);

  return {
    artifacts: context.artifacts,
    gitSha: context.gitSha,
    phase: context.phase,
    plan: context.plan,
  };
}

/**
 * Report a blocker to the Coordinator via a priority 1 STATUS message.
 *
 * Blockers are urgent -- they use priority 1 (PHASE level) because
 * they block phase progress and require coordinator attention.
 *
 * @param config - Executor configuration
 * @param phase - Phase where blocker occurred
 * @param plan - Plan where blocker occurred
 * @param blocker - Description of the blocking issue
 */
export async function reportBlocker(
  config: ExecutorConfig,
  phase: string,
  plan: string,
  blocker: string,
): Promise<void> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const payloadLines = [
    `PHASE:${phase}`,
    `PLAN:${plan}`,
    `BLOCKER:${blocker}`,
  ];

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 1,
      opcode: 'STATUS',
      src: 'executor',
      dst: 'coordinator',
      length: payloadLines.length,
    },
    payload: payloadLines,
  });

  await sendMessage(config.busConfig, msg);
}

/**
 * Append an executor entry to a JSONL log file.
 *
 * Creates the directory if it does not exist. Each entry is one JSON
 * object per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Executor entry to append
 */
export async function appendExecutorEntry(logPath: string, entry: ExecutorEntry): Promise<void> {
  const validated = ExecutorEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all executor entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated ExecutorEntry objects
 */
export async function readExecutorLog(logPath: string): Promise<ExecutorEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => ExecutorEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Executor class (stateful wrapper)
// ============================================================================

/**
 * Stateful Executor wrapping all stateless functions with bound config.
 *
 * Follows the Coordinator pattern: constructor validates config via Zod,
 * methods delegate to stateless functions. Use createExecutor factory
 * for ergonomic creation.
 */
export class Executor {
  private readonly execConfig: ExecutorConfig;

  /**
   * Create a new Executor instance.
   *
   * @param config - Executor configuration (validated through Zod)
   */
  constructor(config: ExecutorConfig) {
    this.execConfig = ExecutorConfigSchema.parse(config);
  }

  /**
   * Load an execution context for a phase/plan.
   *
   * @param phase - Phase identifier
   * @param plan - Plan identifier
   * @returns Initialized execution context
   */
  loadContext(phase: string, plan: string): ExecutionContext {
    return loadExecutionContext(phase, plan);
  }

  /**
   * Report progress to the Coordinator.
   *
   * @param context - Current execution context
   * @returns The context (unchanged)
   */
  async reportProgress(context: ExecutionContext): Promise<ExecutionContext> {
    return reportProgress(this.execConfig, context);
  }

  /**
   * Hand off artifacts to the Verifier.
   *
   * @param context - Completed execution context with gitSha
   * @returns Artifact handoff details
   */
  async handoffToVerifier(context: ExecutionContext): Promise<ArtifactHandoff> {
    return handoffToVerifier(this.execConfig, context);
  }

  /**
   * Report a blocker to the Coordinator.
   *
   * @param phase - Phase where blocker occurred
   * @param plan - Plan where blocker occurred
   * @param blocker - Description of the blocking issue
   */
  async reportBlocker(phase: string, plan: string, blocker: string): Promise<void> {
    return reportBlocker(this.execConfig, phase, plan, blocker);
  }

  /**
   * Append an entry to the executor log.
   *
   * @param entry - Entry to append
   */
  async appendEntry(entry: ExecutorEntry): Promise<void> {
    return appendExecutorEntry(this.execConfig.logPath, entry);
  }

  /**
   * Read the full executor log.
   *
   * @returns Array of all executor entries
   */
  async readLog(): Promise<ExecutorEntry[]> {
    return readExecutorLog(this.execConfig.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create an Executor with defaults applied.
 *
 * Synchronous factory -- no directory creation needed (bus dirs managed
 * by initBus, log dirs created on first append).
 *
 * @param config - Executor configuration (defaults applied via Zod)
 * @returns Executor instance
 */
export function createExecutor(config: Partial<ExecutorConfig> & { busConfig: BusConfig }): Executor {
  const validated = ExecutorConfigSchema.parse(config);
  return new Executor(validated);
}
