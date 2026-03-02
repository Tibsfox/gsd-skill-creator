/**
 * Queue-based subversion scheduler for the autonomy execution engine.
 *
 * Drives the 4-phase execution cycle (prepare/execute/verify/journal)
 * for each subversion sequentially. Advances the state machine at each
 * boundary and persists state after every subversion.
 *
 * The scheduler is the engine's heartbeat — it iterates through
 * subversions, calling pluggable callbacks for each phase, and
 * provides the onSubversionComplete hook for gate integration.
 *
 * @module autonomy/scheduler
 */

import type { ExecutionState, SubversionRecord, SubversionPhase } from './types.js';
import { transition } from './state-machine.js';
import { writeExecutionState } from './persistence.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a single phase callback.
 */
export interface PhaseResult {
  success: boolean;
  artifacts?: string[];
}

/**
 * Callbacks for each phase of the 4-phase subversion cycle.
 *
 * Each callback receives the subversion number (0-indexed) and
 * returns a PhaseResult indicating success or failure.
 */
export interface SubversionCallbacks {
  prepare(subversion: number): Promise<PhaseResult>;
  execute(subversion: number): Promise<PhaseResult>;
  verify(subversion: number): Promise<PhaseResult>;
  journal(subversion: number): Promise<PhaseResult>;
}

/**
 * Options for creating a scheduler.
 */
export interface SchedulerOptions {
  /** Path to execution-state.json for persistence */
  statePath: string;
  /** Callbacks for each phase of the execution cycle */
  callbacks: SubversionCallbacks;
  /** Optional hook called after each successful subversion */
  onSubversionComplete?: (subversion: number, state: ExecutionState) => Promise<void>;
}

// ============================================================================
// Phase names in execution order
// ============================================================================

const PHASE_ORDER: SubversionPhase[] = ['prepare', 'execute', 'verify', 'journal'];

// ============================================================================
// Scheduler Factory
// ============================================================================

/**
 * Create a scheduler that drives sequential subversion execution.
 *
 * @param options - Scheduler configuration
 * @returns Object with run() method
 */
export function createScheduler(options: SchedulerOptions) {
  const { statePath, callbacks, onSubversionComplete } = options;

  return {
    /**
     * Run the scheduler from the given state.
     *
     * If state is INITIALIZED, transitions to RUNNING first.
     * If state is already RUNNING (resume case), continues without
     * re-transitioning.
     *
     * Iterates from current_subversion through total_subversions - 1.
     * For each subversion, calls prepare/execute/verify/journal in order.
     * Stops on first failure, transitioning to FAILED.
     * When all complete, transitions to COMPLETING.
     *
     * @param initialState - Starting execution state
     * @returns Final execution state after all subversions or failure
     */
    async run(initialState: ExecutionState): Promise<ExecutionState> {
      let state = initialState;

      // Transition to RUNNING if starting fresh
      if (state.status === 'INITIALIZED') {
        state = transition(state, 'RUNNING', 'scheduler started');
      }

      // Main execution loop
      for (let sub = state.current_subversion; sub < state.total_subversions; sub++) {
        const startedAt = new Date().toISOString();
        const phaseResults: Record<string, boolean> = {};
        const artifacts: string[] = [];
        let failed = false;

        // Execute 4-phase cycle
        for (const phase of PHASE_ORDER) {
          // Set current phase
          state = { ...state, current_phase: phase };

          // Call the phase callback
          const result = await callbacks[phase](sub);
          phaseResults[phase] = result.success;

          // Collect artifacts
          if (result.artifacts) {
            artifacts.push(...result.artifacts);
          }

          // Handle failure
          if (!result.success) {
            state = {
              ...state,
              last_error: `Phase '${phase}' failed at subversion ${sub}`,
            };
            state = transition(state, 'FAILED', `${phase} failed at subversion ${sub}`);
            await writeExecutionState(state, statePath);
            return state;
          }
        }

        // Build SubversionRecord
        const record: SubversionRecord = {
          subversion: sub,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          phase_results: phaseResults,
        };

        if (artifacts.length > 0) {
          record.artifacts_produced = artifacts;
        }

        // Update state
        state = {
          ...state,
          current_subversion: sub + 1,
          current_phase: null,
          completed_subversions: [...state.completed_subversions, record],
        };

        // Persist after each subversion
        await writeExecutionState(state, statePath);

        // Call onSubversionComplete hook
        if (onSubversionComplete) {
          await onSubversionComplete(sub, state);
        }
      }

      // All subversions complete — transition to COMPLETING
      state = transition(state, 'COMPLETING', 'all subversions completed');
      await writeExecutionState(state, statePath);

      return state;
    },
  };
}
