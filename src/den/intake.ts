/**
 * Work Intake procedure for the GSD Den (PROC-07).
 *
 * Entry point for new work into the Den. A vision document arrives, gets
 * hygiene-checked, then triggers the Planner to begin decomposition and the
 * Relay to acknowledge receipt.
 *
 * Provides 4 core capabilities:
 *   1. Hygiene checking -- 3 validation checks on vision text
 *   2. Planner notification -- EXEC message to begin decomposition
 *   3. Relay notification -- STATUS message acknowledging new work
 *   4. Full intake pipeline -- hygiene + conditional notifications
 *   5. Intake class -- stateful wrapper with bound config
 */

import { z } from 'zod';

import { BusMessageSchema } from './types.js';
import type { BusConfig } from './types.js';
import { formatTimestamp } from './encoder.js';
import { sendMessage } from './bus.js';

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for a single hygiene check result.
 */
const HygieneCheckItemSchema = z.object({
  /** Name of the check */
  name: z.string(),
  /** Whether this check passed */
  passed: z.boolean(),
  /** Human-readable reason for the result */
  reason: z.string(),
});

/**
 * Schema for aggregated hygiene check results.
 */
export const HygieneCheckSchema = z.object({
  /** Whether all checks passed */
  passed: z.boolean(),
  /** Individual check results */
  checks: z.array(HygieneCheckItemSchema),
});

/** TypeScript type for hygiene checks */
export type HygieneCheck = z.infer<typeof HygieneCheckSchema>;

/**
 * Schema for the full intake result.
 */
export const IntakeResultSchema = z.object({
  /** Compact timestamp of when intake was processed */
  timestamp: z.string(),
  /** Character count of the vision text */
  visionLength: z.number().int().nonnegative(),
  /** Hygiene check results */
  hygieneResult: HygieneCheckSchema,
  /** Whether the planner was notified */
  plannerNotified: z.boolean(),
  /** Whether the relay was notified */
  relayNotified: z.boolean(),
  /** Path to the planner bus message (if sent) */
  plannerMessagePath: z.string().optional(),
  /** Path to the relay bus message (if sent) */
  relayMessagePath: z.string().optional(),
});

/** TypeScript type for intake results */
export type IntakeResult = z.infer<typeof IntakeResultSchema>;

/**
 * Schema for intake configuration.
 */
export const IntakeConfigSchema = z.object({
  /** Bus configuration for message sending */
  busConfig: z.any(),
});

/** TypeScript type for intake config */
export type IntakeConfig = z.infer<typeof IntakeConfigSchema>;

// ============================================================================
// Stateless functions
// ============================================================================

/**
 * Run 3 hygiene checks on a vision document text.
 *
 * Checks:
 *   1. non-empty: text must have non-whitespace content
 *   2. minimum-length: trimmed text must be >= 50 characters
 *   3. has-structure: text must contain a heading (#/##), bullet (- ), or numbered list (1.)
 *
 * @param visionText - Raw vision document text
 * @returns Hygiene check result with individual check details
 */
export function runHygieneChecks(visionText: string): HygieneCheck {
  const trimmed = visionText.trim();
  const lines = visionText.split('\n');

  // Check 1: non-empty
  const nonEmptyPassed = trimmed.length > 0;
  const nonEmpty = {
    name: 'non-empty',
    passed: nonEmptyPassed,
    reason: nonEmptyPassed ? 'Document has content' : 'Vision document is empty',
  };

  // Check 2: minimum-length
  const minLengthPassed = trimmed.length >= 50;
  const minLength = {
    name: 'minimum-length',
    passed: minLengthPassed,
    reason: minLengthPassed ? 'Sufficient length' : 'Vision too short (min 50 chars)',
  };

  // Check 3: has-structure -- heading, bullet, or numbered list
  const hasHeading = lines.some((line) => /^#{1,6}\s/.test(line));
  const hasBullet = lines.some((line) => /^\s*-\s/.test(line));
  const hasNumbered = lines.some((line) => /^\s*\d+\.\s/.test(line));
  const structurePassed = hasHeading || hasBullet || hasNumbered;

  const structure = {
    name: 'has-structure',
    passed: structurePassed,
    reason: structurePassed ? 'Document has structure' : 'No structural elements found',
  };

  const checks = [nonEmpty, minLength, structure];
  const passed = checks.every((c) => c.passed);

  return HygieneCheckSchema.parse({ passed, checks });
}

/**
 * Send an EXEC message to the planner to begin vision decomposition.
 *
 * Message is sent on priority 3 (SKILL_LOAD channel) from coordinator to planner
 * with decompose action, vision length, and first 100 chars preview.
 *
 * @param config - Bus configuration
 * @param visionText - Raw vision document text
 * @returns Path to the written bus message file
 */
export async function notifyPlanner(config: BusConfig, visionText: string): Promise<string> {
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const preview = visionText.slice(0, 100);

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 3,
      opcode: 'EXEC',
      src: 'coordinator',
      dst: 'planner',
      length: 3,
    },
    payload: [
      'ACTION:decompose',
      `VISION_LENGTH:${visionText.length}`,
      `PREVIEW:${preview}`,
    ],
  });

  return sendMessage(config, msg);
}

/**
 * Send a STATUS message to the relay acknowledging new work received.
 *
 * Message is sent on priority 6 (STATUS channel) from coordinator to relay
 * with intake receipt notification and vision length.
 *
 * @param config - Bus configuration
 * @param visionLength - Character count of the vision document
 * @returns Path to the written bus message file
 */
export async function notifyRelay(config: BusConfig, visionLength: number): Promise<string> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const msg = BusMessageSchema.parse({
    header: {
      timestamp,
      priority: 6,
      opcode: 'STATUS',
      src: 'coordinator',
      dst: 'relay',
      length: 2,
    },
    payload: [
      'INTAKE:new_work_received',
      `VISION_LENGTH:${visionLength}`,
    ],
  });

  return sendMessage(config, msg);
}

/**
 * Full intake pipeline: hygiene check + conditional planner/relay notification.
 *
 * If hygiene passes, sends EXEC to planner and STATUS to relay.
 * If hygiene fails, skips all notifications.
 *
 * @param config - Bus configuration
 * @param visionText - Raw vision document text
 * @returns Intake result with hygiene details and notification status
 */
export async function processIntake(config: BusConfig, visionText: string): Promise<IntakeResult> {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const hygieneResult = runHygieneChecks(visionText);

  let plannerNotified = false;
  let relayNotified = false;
  let plannerMessagePath: string | undefined;
  let relayMessagePath: string | undefined;

  if (hygieneResult.passed) {
    plannerMessagePath = await notifyPlanner(config, visionText);
    plannerNotified = true;

    relayMessagePath = await notifyRelay(config, visionText.length);
    relayNotified = true;
  }

  return IntakeResultSchema.parse({
    timestamp,
    visionLength: visionText.length,
    hygieneResult,
    plannerNotified,
    relayNotified,
    plannerMessagePath,
    relayMessagePath,
  });
}

// ============================================================================
// Intake class (stateful wrapper)
// ============================================================================

/**
 * Stateful Intake wrapping all stateless functions with bound config.
 *
 * Follows the Coordinator pattern: constructor validates config via Zod,
 * stateless methods do the real work. Use createIntake factory for
 * ergonomic creation.
 */
export class Intake {
  private readonly intakeConfig: IntakeConfig;

  /**
   * Create a new Intake instance.
   *
   * @param config - Intake configuration (validated through Zod)
   */
  constructor(config: IntakeConfig) {
    this.intakeConfig = IntakeConfigSchema.parse(config);
  }

  /**
   * Process a vision document through the full intake pipeline.
   *
   * @param visionText - Raw vision document text
   * @returns Intake result with hygiene details and notification status
   */
  async process(visionText: string): Promise<IntakeResult> {
    return processIntake(this.intakeConfig.busConfig, visionText);
  }

  /**
   * Run hygiene checks on a vision document without processing.
   *
   * @param visionText - Raw vision document text
   * @returns Hygiene check result
   */
  checkHygiene(visionText: string): HygieneCheck {
    return runHygieneChecks(visionText);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create an Intake instance.
 *
 * Lightweight factory -- no directory creation needed since the bus
 * directories are managed by initBus.
 *
 * @param config - Intake configuration
 * @returns Initialized Intake instance
 */
export function createIntake(config: IntakeConfig): Intake {
  return new Intake(config);
}
