/**
 * Pipeline activation dispatch -- routes MOVE instructions to the
 * appropriate activation mode (lite/full/offload/async).
 *
 * The dispatch is the bridge between the Pipeline executor's instruction
 * pointer and actual skill/script/team execution. It decouples the
 * executor from mode-specific activation logic via pluggable resolvers
 * in the ActivationContext.
 *
 * Activation modes:
 * - lite: lightweight (~200 tokens, summary context only)
 * - full: complete skill loaded (token estimate = ceil(content.length / 4))
 * - offload: delegate to offload engine for script execution outside context
 * - async: fire-and-forget, return immediately without waiting
 */

import type { MoveInstruction, ActivationMode, MoveTargetType } from './types.js';
import type { OffloadOperation, OffloadResult } from '../blitter/types.js';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Pluggable context providing resolvers and executors for activation.
 *
 * The Pipeline executor provides real implementations; tests inject mocks.
 * All resolvers are optional -- missing resolvers produce clear failure
 * results rather than thrown exceptions.
 */
export interface ActivationContext {
  /** Resolve a skill name to its content/path. Returns undefined if not found. */
  resolveSkill?: (name: string) => Promise<{ path: string; content: string } | undefined>;

  /** Resolve a script name to an OffloadOperation. Returns undefined if not found. */
  resolveScript?: (name: string) => Promise<OffloadOperation | undefined>;

  /** Resolve a team name to its definition. Returns undefined if not found. */
  resolveTeam?: (name: string) => Promise<{ name: string; members: string[] } | undefined>;

  /** Execute an offload operation. Returns the result. */
  executeOffload?: (operation: OffloadOperation) => Promise<OffloadResult>;
}

/**
 * Result of activating a MOVE instruction.
 *
 * Always returned (never thrown) -- errors are captured in the status
 * and error fields for graceful handling by the executor.
 */
export interface ActivationResult {
  /** Whether the activation succeeded, failed, or was skipped. */
  status: 'success' | 'failure' | 'skipped';

  /** The activation mode that was used. */
  mode: ActivationMode;

  /** The target type that was resolved. */
  target: MoveTargetType;

  /** The name of the target. */
  name: string;

  /** Estimated token cost. Lite: 200, Full: ceil(content.length / 4). */
  tokenEstimate?: number;

  /** Execution duration in milliseconds. */
  durationMs: number;

  /** Error message if status is 'failure'. */
  error?: string;
}

/** Internal dispatch result: status is always present, other fields optional. */
type DispatchResult = Pick<ActivationResult, 'status'> &
  Partial<Omit<ActivationResult, 'status'>>;

// ============================================================================
// PipelineActivationDispatch
// ============================================================================

/**
 * Routes MOVE instructions to the appropriate activation mode handler.
 *
 * Each activation mode has different behavior:
 * - lite: resolve skill, return ~200 token estimate
 * - full: resolve skill, return content-based token estimate
 * - offload: resolve script/promoted-skill, execute via offload engine
 * - async: fire activation in background, return immediately
 */
export class PipelineActivationDispatch {
  private context: ActivationContext;

  constructor(context: ActivationContext) {
    this.context = context;
  }

  /**
   * Activate a MOVE instruction.
   *
   * Routes to the appropriate mode handler based on the instruction's
   * mode and target fields. Never throws -- all errors are captured
   * in the returned ActivationResult.
   */
  async activate(instruction: MoveInstruction): Promise<ActivationResult> {
    const startTime = Date.now();

    const base = {
      mode: instruction.mode,
      target: instruction.target,
      name: instruction.name,
    };

    // Async mode: fire-and-forget
    if (instruction.mode === 'async') {
      // Schedule the activation in the background; swallow any errors
      Promise.resolve()
        .then(() => this.dispatchByTarget(instruction))
        .catch(() => {
          /* fire-and-forget: intentionally swallowed */
        });

      return {
        ...base,
        status: 'success',
        durationMs: Date.now() - startTime,
      };
    }

    // Synchronous modes: lite, full, offload
    try {
      const result = await this.dispatchByTarget(instruction);
      return {
        ...base,
        ...result,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ...base,
        status: 'failure',
        durationMs: Date.now() - startTime,
        error: message,
      };
    }
  }

  // ==========================================================================
  // Target Dispatch
  // ==========================================================================

  /**
   * Route by target type (skill/script/team).
   */
  private async dispatchByTarget(
    instruction: MoveInstruction,
  ): Promise<DispatchResult> {
    switch (instruction.target) {
      case 'skill':
        return this.handleSkill(instruction);
      case 'script':
        return this.handleScript(instruction);
      case 'team':
        return this.handleTeam(instruction);
      default:
        return {
          status: 'failure',
          error: `Unknown target type: ${instruction.target}`,
        };
    }
  }

  // ==========================================================================
  // Mode Handlers
  // ==========================================================================

  /**
   * Handle skill target: lite, full, or offload mode.
   */
  private async handleSkill(
    instruction: MoveInstruction,
  ): Promise<DispatchResult> {
    // Offload mode for skills: try resolveScript first (skill may be promoted)
    if (instruction.mode === 'offload') {
      return this.handleOffloadSkill(instruction);
    }

    // Lite or full mode: need resolveSkill
    if (!this.context.resolveSkill) {
      return {
        status: 'failure',
        error: 'No resolver configured for skill target',
      };
    }

    const skill = await this.context.resolveSkill(instruction.name);
    if (!skill) {
      return {
        status: 'failure',
        error: `Skill "${instruction.name}" not found`,
      };
    }

    if (instruction.mode === 'lite') {
      return {
        status: 'success',
        tokenEstimate: 200,
      };
    }

    // Full mode
    return {
      status: 'success',
      tokenEstimate: Math.ceil(skill.content.length / 4),
    };
  }

  /**
   * Handle offload mode for skill targets (promoted skills).
   *
   * Tries resolveScript first (skill promoted to script). If script
   * resolver is available and returns an operation, delegates to offload.
   * Otherwise falls back to failure.
   */
  private async handleOffloadSkill(
    instruction: MoveInstruction,
  ): Promise<DispatchResult> {
    // Try to resolve as a script (promoted skill)
    if (this.context.resolveScript) {
      const op = await this.context.resolveScript(instruction.name);
      if (op) {
        return this.executeOffloadOp(op);
      }
    }

    // No script found -- skill wasn't promoted
    if (this.context.resolveSkill) {
      const skill = await this.context.resolveSkill(instruction.name);
      if (skill) {
        return {
          status: 'failure',
          error: `Skill "${instruction.name}" not promoted to offload script`,
        };
      }
    }

    return {
      status: 'failure',
      error: `Skill "${instruction.name}" not found`,
    };
  }

  /**
   * Handle script target: resolve and execute via offload.
   */
  private async handleScript(
    instruction: MoveInstruction,
  ): Promise<DispatchResult> {
    if (!this.context.resolveScript) {
      return {
        status: 'failure',
        error: 'No resolver configured for script target',
      };
    }

    const op = await this.context.resolveScript(instruction.name);
    if (!op) {
      return {
        status: 'failure',
        error: `Script "${instruction.name}" not found`,
      };
    }

    if (!this.context.executeOffload) {
      return {
        status: 'failure',
        error: 'No offload executor configured',
      };
    }

    return this.executeOffloadOp(op);
  }

  /**
   * Handle team target: resolve team definition.
   */
  private async handleTeam(
    instruction: MoveInstruction,
  ): Promise<DispatchResult> {
    if (!this.context.resolveTeam) {
      return {
        status: 'failure',
        error: 'No resolver configured for team target',
      };
    }

    const team = await this.context.resolveTeam(instruction.name);
    if (!team) {
      return {
        status: 'failure',
        error: `Team "${instruction.name}" not found`,
      };
    }

    return {
      status: 'success',
    };
  }

  // ==========================================================================
  // Offload Execution
  // ==========================================================================

  /**
   * Execute an OffloadOperation and map the result to activation status.
   */
  private async executeOffloadOp(
    op: OffloadOperation,
  ): Promise<DispatchResult> {
    if (!this.context.executeOffload) {
      return {
        status: 'failure',
        error: 'No offload executor configured',
      };
    }

    const result = await this.context.executeOffload(op);

    if (result.exitCode === 0) {
      return { status: 'success' };
    }

    return {
      status: 'failure',
      error: `Offload operation "${op.id}" failed with exit code ${result.exitCode}`,
    };
  }
}
