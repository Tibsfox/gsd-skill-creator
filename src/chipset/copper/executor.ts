/**
 * Pipeline executor -- processes WAIT/MOVE/SKIP instruction programs.
 *
 * The executor is the heart of the Pipeline coprocessor. It drives the
 * instruction pointer through a Pipeline sequentially, synchronizing
 * skill/script/team activations to GSD lifecycle events via LifecycleSync.
 *
 * Instruction processing:
 * - WAIT: blocks until the matching GSD lifecycle event fires (via LifecycleSync)
 * - MOVE: dispatches to the activation handler (skill/script/team activation)
 * - SKIP: evaluates a condition; if true, skips the next instruction
 *
 * The built-in condition evaluator supports three operand prefixes:
 * - file: -- filesystem existence and content checks
 * - env: -- environment variable checks
 * - var: -- runtime variable checks
 */

import { access } from 'node:fs/promises';
import type {
  Pipeline,
  PipelineInstruction,
  WaitInstruction,
  MoveInstruction,
  SkipInstruction,
  SkipCondition,
  SkipOperator,
} from './types.js';
import { LifecycleSync } from './lifecycle-sync.js';

// ============================================================================
// Configuration and Result Types
// ============================================================================

/**
 * Configuration for a PipelineExecutor instance.
 */
export interface PipelineExecutorConfig {
  /** The lifecycle sync bridge for WAIT instruction event resolution. */
  lifecycleSync: LifecycleSync;

  /** Callback invoked for each MOVE instruction (activation dispatch). */
  activationHandler: (instruction: MoveInstruction) => Promise<void>;

  /** Optional custom condition evaluator for SKIP instructions. */
  conditionEvaluator?: (condition: SkipCondition) => Promise<boolean>;

  /** Optional runtime variables for var: condition checks. */
  runtimeVars?: Record<string, string>;
}

/**
 * Result of executing a Pipeline.
 */
export interface PipelineExecutionResult {
  /** Overall execution status. */
  status: 'completed' | 'timeout' | 'error';

  /** Number of instructions that executed (WAIT, MOVE, and SKIP itself). */
  executed: number;

  /** Number of instructions skipped by SKIP conditions. */
  skipped: number;

  /** Number of WAIT instructions that blocked on lifecycle events. */
  waited: number;

  /** Total number of instructions in the Pipeline. */
  instructionCount: number;

  /** Execution duration in milliseconds. */
  durationMs: number;

  /** Error message if status is 'timeout' or 'error'. */
  error?: string;
}

// ============================================================================
// Built-in Condition Evaluator
// ============================================================================

/**
 * Evaluate a binary/unary operator against a value.
 */
function evalOperator(
  value: string | undefined,
  op: SkipOperator,
  right?: string,
): boolean {
  switch (op) {
    case 'exists':
      return value !== undefined;
    case 'not-exists':
      return value === undefined;
    case 'equals':
      return value === right;
    case 'not-equals':
      return value !== right;
    case 'contains':
      return value !== undefined && right !== undefined && value.includes(right);
    case 'gt':
      return value !== undefined && right !== undefined && Number(value) > Number(right);
    case 'lt':
      return value !== undefined && right !== undefined && Number(value) < Number(right);
    default:
      return false;
  }
}

/**
 * Built-in condition evaluator for SKIP instructions.
 *
 * Parses the left operand prefix to determine the check type:
 * - file:path -- filesystem checks (exists, not-exists, contains)
 * - env:VAR -- environment variable checks
 * - var:name -- runtime variable checks
 *
 * For unknown prefixes, returns false (condition not met, next instruction runs).
 */
async function evaluateCondition(
  condition: SkipCondition,
  runtimeVars?: Record<string, string>,
): Promise<boolean> {
  const { left, op, right } = condition;

  // Determine the prefix and extract the key
  const colonIdx = left.indexOf(':');
  if (colonIdx === -1) {
    // No prefix -- unknown, return false
    return false;
  }

  const prefix = left.slice(0, colonIdx);
  const key = left.slice(colonIdx + 1);

  switch (prefix) {
    case 'file': {
      // Filesystem checks
      if (op === 'exists') {
        try {
          await access(key);
          return true; // File exists
        } catch {
          return false; // File does not exist
        }
      }
      if (op === 'not-exists') {
        try {
          await access(key);
          return false; // File exists, so not-exists is false
        } catch {
          return true; // File does not exist, so not-exists is true
        }
      }
      // For other operators on file: prefix, we would need to read file content
      // Not implemented in this version -- return false
      return false;
    }

    case 'env': {
      const value = process.env[key];
      return evalOperator(value, op, right);
    }

    case 'var': {
      const value = runtimeVars?.[key];
      return evalOperator(value, op, right);
    }

    default:
      // Unknown prefix
      return false;
  }
}

// ============================================================================
// PipelineExecutor
// ============================================================================

/**
 * Executes a Pipeline by processing instructions sequentially.
 *
 * The instruction pointer advances through the list one instruction at
 * a time. WAIT instructions block until the matching lifecycle event fires.
 * SKIP instructions conditionally advance the pointer by 2 (skipping the
 * next instruction) when their condition evaluates to true.
 */
export class PipelineExecutor {
  private config: PipelineExecutorConfig;

  constructor(config: PipelineExecutorConfig) {
    this.config = config;
  }

  /**
   * Run a Pipeline to completion.
   *
   * Processes each instruction sequentially:
   * - WAIT: blocks on LifecycleSync.waitFor() until the event fires
   * - MOVE: calls the activation handler
   * - SKIP: evaluates condition; if true, skips the next instruction
   *
   * @param list - The Pipeline to execute
   * @returns Execution result with status and stats
   */
  async run(list: Pipeline): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    let executed = 0;
    let skipped = 0;
    let waited = 0;
    let ip = 0;

    try {
      while (ip < list.instructions.length) {
        const instr = list.instructions[ip];

        switch (instr.type) {
          case 'wait': {
            const waitInstr = instr as WaitInstruction;
            const timeoutMs = waitInstr.timeout !== undefined
              ? waitInstr.timeout * 1000 // Convert seconds to milliseconds
              : undefined;

            await this.config.lifecycleSync.waitFor(waitInstr.event, {
              timeoutMs,
            });

            waited++;
            executed++;
            ip++;
            break;
          }

          case 'move': {
            const moveInstr = instr as MoveInstruction;
            await this.config.activationHandler(moveInstr);
            executed++;
            ip++;
            break;
          }

          case 'skip': {
            const skipInstr = instr as SkipInstruction;

            // Evaluate condition using custom or built-in evaluator
            const conditionResult = this.config.conditionEvaluator
              ? await this.config.conditionEvaluator(skipInstr.condition)
              : await evaluateCondition(skipInstr.condition, this.config.runtimeVars);

            if (conditionResult && ip + 1 < list.instructions.length) {
              // Condition true and there is a next instruction to skip
              executed++; // The SKIP itself executed
              skipped++;  // The next instruction is skipped
              ip += 2;    // Skip current SKIP + next instruction
            } else {
              // Condition false, or nothing to skip (SKIP is last instruction)
              executed++;
              ip++;
            }
            break;
          }

          default: {
            // Unknown instruction type -- skip it
            ip++;
            break;
          }
        }
      }

      return {
        status: 'completed',
        executed,
        skipped,
        waited,
        instructionCount: list.instructions.length,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const isTimeout = error.message.toLowerCase().includes('timeout');

      return {
        status: isTimeout ? 'timeout' : 'error',
        executed,
        skipped,
        waited,
        instructionCount: list.instructions.length,
        durationMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
