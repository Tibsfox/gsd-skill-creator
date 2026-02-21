/**
 * Verifier agent for the GSD Den.
 *
 * The quality gate -- nothing passes without earning it. Runs in fresh context
 * (by design, not inheritance), receives artifact handoffs from the Executor,
 * runs 4 verification gates, and issues pass/fail verdicts. Independence from
 * the Executor context is the critical design property.
 *
 * Provides 6 core capabilities:
 *   1. Verification gates -- 4 standard quality checks (tests, coverage, review, artifacts)
 *   2. Gate execution -- async checker callbacks with error handling
 *   3. Verdict rendering -- blocking/warning severity determines pass/fail
 *   4. Verdict reporting -- CMP messages on priority 2 (VERIFY channel) to coordinator
 *   5. JSONL logging -- append-only audit trail for verification operations
 *   6. Verifier class -- stateful wrapper with bound config
 *
 * IMPORTANT: This module has NO dependency on executor.ts -- complete independence by design.
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { AgentIdSchema, BusMessageSchema } from './types.js';
import type { BusConfig } from './types.js';
import { formatTimestamp } from './encoder.js';
import { sendMessage } from './bus.js';

// ============================================================================
// VerifierConfigSchema
// ============================================================================

/**
 * Configuration for the Verifier agent.
 */
export const VerifierConfigSchema = z.object({
  /** Bus configuration for sending verdict messages */
  busConfig: z.any(),
  /** Path to the JSONL verifier log file */
  logPath: z.string().default('.planning/den/logs/verifier.jsonl'),
  /** Agent ID for this verifier instance */
  agentId: AgentIdSchema.default('verifier'),
});

/** TypeScript type for verifier configuration */
export type VerifierConfig = z.infer<typeof VerifierConfigSchema>;

// ============================================================================
// VerificationGateSchema
// ============================================================================

/**
 * A single verification gate with name, status, and severity.
 *
 * Gates are the atomic unit of verification. Each gate runs a specific
 * quality check and reports pass/fail/skip with detail.
 */
export const VerificationGateSchema = z.object({
  /** Gate identifier */
  name: z.string(),
  /** Human-readable description of what this gate checks */
  description: z.string(),
  /** Current gate status */
  status: z.enum(['pass', 'fail', 'skip']),
  /** Detail string from the checker (reason for pass/fail/skip) */
  detail: z.string(),
  /** Severity determines blocking behavior: blocking fails the verdict, warning/advisory are informational */
  severity: z.enum(['blocking', 'warning', 'advisory']),
});

/** TypeScript type for verification gates */
export type VerificationGate = z.infer<typeof VerificationGateSchema>;

// ============================================================================
// VerdictSchema
// ============================================================================

/**
 * The final verdict after running all verification gates.
 *
 * PASS if all blocking gates pass. FAIL if any blocking gate fails.
 * Warning/advisory gate failures are recorded but do not block.
 */
export const VerdictSchema = z.object({
  /** Overall result */
  result: z.enum(['PASS', 'FAIL']),
  /** All gates with their final status */
  gates: z.array(VerificationGateSchema),
  /** Phase being verified */
  phase: z.string(),
  /** Plan being verified */
  plan: z.string(),
  /** Artifact paths that were verified */
  artifacts: z.array(z.string()),
  /** Git SHA of the code being verified */
  gitSha: z.string(),
  /** Recommendation from first failing blocking gate, or null if PASS */
  recommendation: z.string().nullable(),
});

/** TypeScript type for verdicts */
export type Verdict = z.infer<typeof VerdictSchema>;

// ============================================================================
// VerificationResultSchema
// ============================================================================

/**
 * Result of a verification operation including bus reporting status.
 */
export const VerificationResultSchema = z.object({
  /** The rendered verdict */
  verdict: VerdictSchema,
  /** Whether the verdict was successfully sent to the coordinator */
  sentToCoordinator: z.boolean(),
});

/** TypeScript type for verification results */
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// ============================================================================
// VerifierEntrySchema
// ============================================================================

/**
 * Schema for a single verifier log entry (JSONL).
 *
 * Each entry is one line of JSONL in the verifier's audit log.
 */
export const VerifierEntrySchema = z.object({
  /** Compact timestamp when the entry was created */
  timestamp: z.string(),
  /** Type of verifier operation */
  type: z.enum(['verification-start', 'gate-result', 'verdict', 'report']),
  /** Phase context */
  phase: z.string(),
  /** Plan context */
  plan: z.string(),
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for verifier entries */
export type VerifierEntry = z.infer<typeof VerifierEntrySchema>;

// ============================================================================
// createVerificationGates
// ============================================================================

/**
 * Create the 4 standard verification gates, all initialized to 'skip'.
 *
 * Gates:
 *   1. tests-pass (blocking) -- Pre-existing test suite passes
 *   2. new-coverage (warning) -- New code has test coverage
 *   3. code-review (blocking) -- Code meets standards, no defects
 *   4. artifact-integrity (blocking) -- Expected outputs exist and are well-formed
 *
 * @returns Array of 4 VerificationGate objects with status 'skip' and empty detail
 */
export function createVerificationGates(): VerificationGate[] {
  return [
    {
      name: 'tests-pass',
      description: 'Pre-existing test suite passes',
      status: 'skip',
      detail: '',
      severity: 'blocking',
    },
    {
      name: 'new-coverage',
      description: 'New code has test coverage',
      status: 'skip',
      detail: '',
      severity: 'warning',
    },
    {
      name: 'code-review',
      description: 'Code meets standards, no defects',
      status: 'skip',
      detail: '',
      severity: 'blocking',
    },
    {
      name: 'artifact-integrity',
      description: 'Expected outputs exist and are well-formed',
      status: 'skip',
      detail: '',
      severity: 'blocking',
    },
  ];
}

// ============================================================================
// runGate
// ============================================================================

/** Checker callback that evaluates a gate and returns status + detail */
export type GateChecker = (gate: VerificationGate) => Promise<{
  status: 'pass' | 'fail';
  detail: string;
}>;

/**
 * Run a verification gate with an async checker callback.
 *
 * Wraps the checker in try/catch. On success, applies the returned status
 * and detail. On throw, sets status to 'fail' with the error message as detail.
 *
 * @param gate - The verification gate to run
 * @param checker - Async callback that evaluates the gate
 * @returns Updated gate with new status and detail (original gate is not mutated)
 */
export async function runGate(gate: VerificationGate, checker: GateChecker): Promise<VerificationGate> {
  try {
    const result = await checker(gate);
    return { ...gate, status: result.status, detail: result.detail };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...gate, status: 'fail', detail: message };
  }
}

// ============================================================================
// renderVerdict
// ============================================================================

/**
 * Render a verdict from completed gates.
 *
 * Examines all gates. If any blocking gate has status 'fail', verdict is 'FAIL'
 * with recommendation from the first failing blocking gate's detail. If all
 * blocking gates pass (or skip), verdict is 'PASS'. Warning/advisory gates
 * don't block but are included in the verdict.
 *
 * @param gates - Array of completed verification gates
 * @param phase - Phase being verified
 * @param plan - Plan being verified
 * @param artifacts - Artifact paths verified
 * @param gitSha - Git SHA of the verified code
 * @returns Rendered Verdict object
 */
export function renderVerdict(
  gates: VerificationGate[],
  phase: string,
  plan: string,
  artifacts: string[],
  gitSha: string,
): Verdict {
  // Find blocking gates that failed
  const failingBlockers = gates.filter(
    (g) => g.severity === 'blocking' && g.status === 'fail',
  );

  const result: 'PASS' | 'FAIL' = failingBlockers.length > 0 ? 'FAIL' : 'PASS';
  const recommendation = failingBlockers.length > 0
    ? failingBlockers[0].detail
    : null;

  return {
    result,
    gates,
    phase,
    plan,
    artifacts,
    gitSha,
    recommendation,
  };
}

// ============================================================================
// reportVerdict
// ============================================================================

/**
 * Report a verdict to the coordinator via CMP message on priority 2 (VERIFY channel).
 *
 * Payload format:
 *   RESULT:PASS or RESULT:FAIL
 *   GATES:{passCount}/{totalCount}
 *   (if FAIL) GATE_FAILED:{name}, DETAIL:{detail}, SEVERITY:{severity}, RECOMMENDATION:{recommendation}
 *
 * @param config - Verifier configuration
 * @param verdict - The verdict to report
 * @returns VerificationResult with verdict and sentToCoordinator status
 */
export async function reportVerdict(
  config: VerifierConfig,
  verdict: Verdict,
): Promise<VerificationResult> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const passCount = verdict.gates.filter((g) => g.status === 'pass').length;
  const totalCount = verdict.gates.length;

  const payloadLines: string[] = [
    `RESULT:${verdict.result}`,
    `GATES:${passCount}/${totalCount}`,
  ];

  // Add failing gate details for FAIL verdicts
  if (verdict.result === 'FAIL') {
    const failingGates = verdict.gates.filter((g) => g.status === 'fail');
    for (const gate of failingGates) {
      payloadLines.push(`GATE_FAILED:${gate.name}`);
      payloadLines.push(`DETAIL:${gate.detail}`);
      payloadLines.push(`SEVERITY:${gate.severity}`);
    }
    if (verdict.recommendation) {
      payloadLines.push(`RECOMMENDATION:${verdict.recommendation}`);
    }
  }

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 2,
      opcode: 'CMP',
      src: config.agentId,
      dst: 'coordinator',
      length: payloadLines.length,
    },
    payload: payloadLines,
  });

  await sendMessage(config.busConfig, msg);

  return {
    verdict,
    sentToCoordinator: true,
  };
}

// ============================================================================
// JSONL logging
// ============================================================================

/**
 * Append a verifier entry to a JSONL log file.
 *
 * Creates the file and parent directories if they do not exist.
 * Each entry is one JSON object per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Verifier entry to append
 */
export async function appendVerifierEntry(logPath: string, entry: VerifierEntry): Promise<void> {
  const validated = VerifierEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all verifier entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated VerifierEntry objects
 */
export async function readVerifierLog(logPath: string): Promise<VerifierEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => VerifierEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Verifier class (stateful wrapper)
// ============================================================================

/**
 * Stateful Verifier wrapping all stateless functions with bound config.
 *
 * Follows the established Den agent pattern: constructor validates config
 * via Zod, stateless methods do the real work.
 */
export class Verifier {
  private readonly verifierConfig: VerifierConfig;

  /**
   * Create a new Verifier instance.
   *
   * @param config - Verifier configuration (validated through Zod)
   */
  constructor(config: VerifierConfig) {
    this.verifierConfig = VerifierConfigSchema.parse(config);
  }

  /**
   * Create the 4 standard verification gates.
   *
   * @returns Array of 4 VerificationGate objects
   */
  createGates(): VerificationGate[] {
    return createVerificationGates();
  }

  /**
   * Run a single verification gate with a checker callback.
   *
   * @param gate - The gate to run
   * @param checker - Async checker callback
   * @returns Updated gate
   */
  async runGate(gate: VerificationGate, checker: GateChecker): Promise<VerificationGate> {
    return runGate(gate, checker);
  }

  /**
   * Render a verdict from completed gates.
   *
   * @param gates - Completed gates
   * @param phase - Phase being verified
   * @param plan - Plan being verified
   * @param artifacts - Artifact paths
   * @param gitSha - Git SHA
   * @returns Rendered verdict
   */
  renderVerdict(
    gates: VerificationGate[],
    phase: string,
    plan: string,
    artifacts: string[],
    gitSha: string,
  ): Verdict {
    return renderVerdict(gates, phase, plan, artifacts, gitSha);
  }

  /**
   * Report a verdict to the coordinator via bus.
   *
   * @param verdict - The verdict to report
   * @returns Verification result
   */
  async reportVerdict(verdict: Verdict): Promise<VerificationResult> {
    return reportVerdict(this.verifierConfig, verdict);
  }

  /**
   * Append an entry to the verifier log.
   *
   * @param entry - Entry to append
   */
  async appendEntry(entry: VerifierEntry): Promise<void> {
    return appendVerifierEntry(this.verifierConfig.logPath, entry);
  }

  /**
   * Read the full verifier log.
   *
   * @returns Array of all verifier entries
   */
  async getLog(): Promise<VerifierEntry[]> {
    return readVerifierLog(this.verifierConfig.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create an initialized Verifier instance.
 *
 * Parses config with defaults and returns a ready-to-use Verifier.
 *
 * @param config - Partial verifier configuration (defaults applied)
 * @returns Initialized Verifier instance
 */
export function createVerifier(config: Partial<VerifierConfig> & { busConfig: BusConfig }): Verifier {
  const validated = VerifierConfigSchema.parse(config);
  return new Verifier(validated);
}
