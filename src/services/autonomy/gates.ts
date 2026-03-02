/**
 * Gate evaluation logic for the autonomy execution engine.
 *
 * Gates fire at specific subversion boundaries during autonomous
 * execution to enforce quality checkpoints:
 *
 * - **Checkpoint** (every 10th): Mini-synthesis artifact check
 * - **Half-transition** (midpoint): Comprehensive synthesis review
 * - **Graduation** (final): Comprehensive synthesis validation
 *
 * Gate results are recorded in the execution state and the
 * state machine transitions accordingly at each boundary.
 *
 * @module autonomy/gates
 */

import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExecutionState, GateResult, GateType } from './types.js';
import { transition } from './state-machine.js';
import { writeExecutionState } from './persistence.js';

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Check if a subversion is a checkpoint boundary.
 *
 * Checkpoints fire at every `interval`th completion (0-indexed).
 * For interval=10: subversions 9, 19, 29, 39, 49, 59, 69, 79, 89, 99
 *
 * @param subversion - 0-indexed subversion number
 * @param interval - Checkpoint interval (default 10)
 * @returns true if this subversion is a checkpoint boundary
 */
export function isCheckpointSubversion(subversion: number, interval = 10): boolean {
  return (subversion + 1) % interval === 0;
}

/**
 * Check if a subversion is the half-transition boundary.
 *
 * The half-transition fires at the midpoint: floor(total/2) - 1
 * For total=100: subversion 49 (the 50th completion)
 *
 * @param subversion - 0-indexed subversion number
 * @param total - Total number of subversions (default 100)
 * @returns true if this is the half-transition boundary
 */
export function isHalfTransition(subversion: number, total = 100): boolean {
  return subversion === Math.floor(total / 2) - 1;
}

/**
 * Check if a subversion is the graduation boundary.
 *
 * Graduation fires at the final subversion: total - 1
 * For total=100: subversion 99
 *
 * @param subversion - 0-indexed subversion number
 * @param total - Total number of subversions (default 100)
 * @returns true if this is the graduation boundary
 */
export function isGraduation(subversion: number, total = 100): boolean {
  return subversion === total - 1;
}

// ============================================================================
// GateEvaluator
// ============================================================================

/**
 * Configuration for the gate evaluator.
 */
export interface GateEvaluatorOptions {
  /** Directory where synthesis artifacts are expected */
  outputDir: string;
  /** Path to execution-state.json for persistence */
  statePath: string;
  /** Checkpoint interval (default 10) */
  checkpointInterval?: number;
}

/**
 * Result of evaluating gates for a subversion.
 */
export interface GateEvaluationResult {
  state: ExecutionState;
  result: GateResult | null;
}

/** Minimum size for half-transition synthesis (bytes) */
const HALF_TRANSITION_MIN_SIZE = 100;

/** Minimum size for graduation synthesis (bytes) */
const GRADUATION_MIN_SIZE = 500;

/**
 * Gate evaluator that checks synthesis artifacts at subversion boundaries.
 *
 * Plugs into the scheduler's onSubversionComplete hook.
 */
export class GateEvaluator {
  private readonly outputDir: string;
  private readonly statePath: string;
  private readonly checkpointInterval: number;

  constructor(options: GateEvaluatorOptions) {
    this.outputDir = options.outputDir;
    this.statePath = options.statePath;
    this.checkpointInterval = options.checkpointInterval ?? 10;
  }

  /**
   * Evaluate gates for the given subversion.
   *
   * Gates are evaluated in priority order:
   * 1. Graduation (final subversion) — highest priority
   * 2. Half-transition (midpoint)
   * 3. Checkpoint (every N)
   *
   * Returns null if no gate applies to this subversion.
   *
   * @param subversion - 0-indexed subversion number
   * @param state - Current execution state
   * @returns Updated state and gate result (null if no gate)
   */
  async evaluateGates(
    subversion: number,
    state: ExecutionState,
  ): Promise<GateEvaluationResult> {
    const total = state.total_subversions;

    // Priority 1: Graduation gate
    if (isGraduation(subversion, total)) {
      return this.evaluateGraduationGate(subversion, state);
    }

    // Priority 2: Half-transition gate
    if (isHalfTransition(subversion, total)) {
      return this.evaluateHalfTransitionGate(subversion, state);
    }

    // Priority 3: Checkpoint gate
    if (isCheckpointSubversion(subversion, this.checkpointInterval)) {
      return this.evaluateCheckpointGate(subversion, state);
    }

    // No gate applies
    return { state, result: null };
  }

  // ==========================================================================
  // Checkpoint gate
  // ==========================================================================

  private async evaluateCheckpointGate(
    subversion: number,
    state: ExecutionState,
  ): Promise<GateEvaluationResult> {
    const checkpointNumber = subversion + 1;
    const artifactPath = join(this.outputDir, `checkpoint-${checkpointNumber}.md`);

    // Transition to CHECKPOINTING
    let currentState = transition(state, 'CHECKPOINTING', `checkpoint gate at subversion ${subversion}`);

    // Add to checkpoints array
    currentState = {
      ...currentState,
      checkpoints: [...currentState.checkpoints, subversion],
    };

    // Check artifact
    const exists = await this.fileExistsAndNonEmpty(artifactPath);

    let gateResult: GateResult;

    if (exists) {
      gateResult = {
        gate_name: `checkpoint-${checkpointNumber}`,
        gate_type: 'checkpoint' as GateType,
        passed: true,
        message: `Checkpoint ${checkpointNumber} synthesis artifact found`,
        checked_path: artifactPath,
      };
      // Transition back to RUNNING
      currentState = transition(currentState, 'RUNNING', `checkpoint ${checkpointNumber} passed`);
    } else {
      gateResult = {
        gate_name: `checkpoint-${checkpointNumber}`,
        gate_type: 'checkpoint' as GateType,
        passed: false,
        message: `Checkpoint ${checkpointNumber} synthesis artifact missing at ${artifactPath}`,
        checked_path: artifactPath,
      };
      // Still transition back to RUNNING — checkpoint failures inform, don't halt
      currentState = transition(currentState, 'RUNNING', `checkpoint ${checkpointNumber} failed (informational)`);
    }

    // Persist
    await writeExecutionState(currentState, this.statePath);

    return { state: currentState, result: gateResult };
  }

  // ==========================================================================
  // Half-transition gate
  // ==========================================================================

  private async evaluateHalfTransitionGate(
    subversion: number,
    state: ExecutionState,
  ): Promise<GateEvaluationResult> {
    const artifactPath = join(this.outputDir, 'half-transition-synthesis.md');

    // Transition to CHECKPOINTING
    let currentState = transition(state, 'CHECKPOINTING', `half-transition gate at subversion ${subversion}`);

    // Add to checkpoints array
    currentState = {
      ...currentState,
      checkpoints: [...currentState.checkpoints, subversion],
    };

    // Check artifact size
    const size = await this.getFileSize(artifactPath);
    const adequate = size !== null && size >= HALF_TRANSITION_MIN_SIZE;

    let gateResult: GateResult;

    if (adequate) {
      gateResult = {
        gate_name: 'half-transition',
        gate_type: 'half_transition' as GateType,
        passed: true,
        message: `Half-transition synthesis found (${size} bytes)`,
        checked_path: artifactPath,
      };
      // Transition back to RUNNING
      currentState = transition(currentState, 'RUNNING', 'half-transition synthesis adequate');
    } else {
      gateResult = {
        gate_name: 'half-transition',
        gate_type: 'half_transition' as GateType,
        passed: false,
        message: size === null
          ? `Half-transition synthesis missing at ${artifactPath}`
          : `Half-transition synthesis too small (${size} bytes, need ${HALF_TRANSITION_MIN_SIZE})`,
        checked_path: artifactPath,
      };
      // Transition to PAUSED — halt execution until synthesis provided
      currentState = transition(currentState, 'RUNNING', 'half-transition returning to RUNNING before PAUSED');
      currentState = transition(currentState, 'PAUSED', 'half-transition synthesis missing/inadequate');
      currentState = {
        ...currentState,
        resume_from: subversion + 1,
      };
    }

    // Persist
    await writeExecutionState(currentState, this.statePath);

    return { state: currentState, result: gateResult };
  }

  // ==========================================================================
  // Graduation gate
  // ==========================================================================

  private async evaluateGraduationGate(
    subversion: number,
    state: ExecutionState,
  ): Promise<GateEvaluationResult> {
    const artifactPath = join(this.outputDir, 'graduation-synthesis.md');

    // Transition to COMPLETING
    let currentState = transition(state, 'COMPLETING', `graduation gate at subversion ${subversion}`);

    // Add to checkpoints array
    currentState = {
      ...currentState,
      checkpoints: [...currentState.checkpoints, subversion],
    };

    // Check artifact size
    const size = await this.getFileSize(artifactPath);
    const adequate = size !== null && size >= GRADUATION_MIN_SIZE;

    let gateResult: GateResult;

    if (adequate) {
      gateResult = {
        gate_name: 'graduation',
        gate_type: 'graduation' as GateType,
        passed: true,
        message: `Graduation synthesis found (${size} bytes)`,
        checked_path: artifactPath,
      };
      // Transition to DONE
      currentState = transition(currentState, 'DONE', 'graduation synthesis adequate');
    } else {
      gateResult = {
        gate_name: 'graduation',
        gate_type: 'graduation' as GateType,
        passed: false,
        message: size === null
          ? `Graduation synthesis missing at ${artifactPath}`
          : `Graduation synthesis too small (${size} bytes, need ${GRADUATION_MIN_SIZE})`,
        checked_path: artifactPath,
      };
      // Stay in COMPLETING — caller must resolve
    }

    // Persist
    await writeExecutionState(currentState, this.statePath);

    return { state: currentState, result: gateResult };
  }

  // ==========================================================================
  // File utilities
  // ==========================================================================

  private async fileExistsAndNonEmpty(filePath: string): Promise<boolean> {
    try {
      const s = await stat(filePath);
      return s.size > 0;
    } catch {
      return false;
    }
  }

  private async getFileSize(filePath: string): Promise<number | null> {
    try {
      const s = await stat(filePath);
      return s.size;
    } catch {
      return null;
    }
  }
}
