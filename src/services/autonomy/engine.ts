/**
 * Unified autonomy engine entry point.
 *
 * Wires together all autonomy components built in Phases 497-500:
 * - State machine (transitions, factory)
 * - Scheduler (4-phase execution cycle)
 * - Resume (crash recovery)
 * - Gates (checkpoint, half-transition, graduation)
 * - State pruner (STATE.md line limit)
 * - Context budget (token usage estimation)
 * - Write watchdog (stuck agent detection)
 * - Persistence (atomic JSON read/write)
 *
 * The engine is a thin orchestrator — each component retains its own
 * logic. All I/O goes through existing component functions.
 *
 * @module autonomy/engine
 */

import type { ExecutionState } from './types.js';
import type { SubversionCallbacks } from './scheduler.js';
import type { GateEvaluatorOptions } from './gates.js';
import type { WatchdogConfig } from './write-watchdog.js';
import type { TeamConfig } from '../../types/team.js';
import { writeFile as writeFileFs, readFile as readFileFs } from 'node:fs/promises';
import { createExecutionState, transition } from './state-machine.js';
import { createScheduler } from './scheduler.js';
import { resumeExecution } from './resume.js';
import { readExecutionState } from './persistence.js';
import { GateEvaluator } from './gates.js';
import { estimateContextBudget, shouldPause } from './context-budget.js';
import { createWatchdog } from './write-watchdog.js';
import { writeExecutionState } from './persistence.js';
import { TeamLifecycleManager } from '../../teams/team-lifecycle.js';
import { TeamStore } from '../../teams/team-store.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Optional team configuration for autonomy-managed teams.
 *
 * When provided, the engine creates a team at startup and
 * optionally dissolves it at completion based on durability.
 */
export interface AutonomyTeamConfig {
  /** Base team config to create (name, leadAgentId, members, etc.) */
  teamConfig: TeamConfig;
  /** Path to teams directory for TeamStore */
  teamsDir: string;
  /** Team durability: 'ephemeral' auto-dissolves on completion */
  durability?: 'ephemeral' | 'persistent';
}

/**
 * Configuration for the autonomy engine.
 */
export interface AutonomyEngineConfig {
  /** Unique identifier for this milestone run */
  milestoneId: string;
  /** Total number of subversions to execute */
  totalSubversions: number;
  /** Path to execution-state.json */
  statePath: string;
  /** Path to STATE.md for pruning */
  stateFilePath?: string;
  /** Callbacks for the 4-phase execution cycle */
  callbacks: SubversionCallbacks;
  /** Gate evaluator options */
  gateOptions?: GateEvaluatorOptions;
  /** Write watchdog configuration overrides */
  watchdogConfig?: Partial<Omit<WatchdogConfig, 'onTimeout'>>;
  /** Context budget pause threshold percentage (default: 80) */
  budgetThreshold?: number;
  /** Maximum lines for STATE.md (default: 100) */
  maxStateLines?: number;
  /** Path for teach-forward output */
  teachForwardDir?: string;
  /** Path for journal input for teach-forward */
  journalDir?: string;
  /** Path to watchdog state JSON file for cross-session persistence */
  watchdogStatePath?: string;
  /** Session identifier for watchdog state (defaults to milestoneId) */
  sessionId?: string;
  /** Optional team lifecycle management */
  team?: AutonomyTeamConfig;
}

/**
 * The autonomy engine interface.
 */
export interface AutonomyEngine {
  /** Run the engine to completion or failure */
  run(): Promise<ExecutionState>;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a unified autonomy engine that wires all components together.
 *
 * @param config - Engine configuration
 * @returns An engine with a run() method
 */
export function createAutonomyEngine(config: AutonomyEngineConfig): AutonomyEngine {
  return {
    async run(): Promise<ExecutionState> {
      // ====================================================================
      // Step 1: Determine initial state (resume or fresh)
      // ====================================================================
      let state: ExecutionState;

      const existingState = await readExecutionState(config.statePath);
      if (existingState.success) {
        // Try to resume
        const resumeResult = await resumeExecution(config.statePath);
        if (resumeResult.canResume) {
          state = resumeResult.state;
        } else {
          // State exists but not resumable (DONE, FAILED, etc.)
          // Start fresh
          state = createExecutionState(config.milestoneId, {
            total_subversions: config.totalSubversions,
          });
        }
      } else {
        // No prior state — fresh start
        state = createExecutionState(config.milestoneId, {
          total_subversions: config.totalSubversions,
        });
      }

      // ====================================================================
      // Step 1b: Team lifecycle -- create and activate team if configured
      // ====================================================================
      let lifecycleManager: TeamLifecycleManager | null = null;
      if (config.team) {
        const teamStore = new TeamStore(config.team.teamsDir);
        lifecycleManager = new TeamLifecycleManager(teamStore, config.team.teamsDir);
        try {
          const teamCfg: TeamConfig = {
            ...config.team.teamConfig,
            durability: config.team.durability ?? 'persistent',
          };
          await lifecycleManager.createTeam(teamCfg, 'auto');
          await lifecycleManager.activateTeam(teamCfg.name);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          state = transition(state, 'FAILED', `team creation failed: ${message}`);
          await writeExecutionState(state, config.statePath);
          return state;
        }
      }

      // ====================================================================
      // Step 2: Create gate evaluator (optional)
      // ====================================================================
      const gateEvaluator = config.gateOptions
        ? new GateEvaluator(config.gateOptions)
        : null;

      // ====================================================================
      // Step 3: Create write watchdog
      // ====================================================================
      let watchdogTriggered = false;
      const watchdog = createWatchdog(
        () => { watchdogTriggered = true; },
        config.watchdogConfig,
      );

      // ====================================================================
      // Step 4: Create scheduler with wired hooks
      // ====================================================================
      const scheduler = createScheduler({
        statePath: config.statePath,
        callbacks: config.callbacks,
        onSubversionComplete: async (subversion: number, currentState: ExecutionState) => {
          // Record write activity to keep watchdog alive
          watchdog.recordWrite();

          // Persist watchdog state to file after each subversion
          if (config.watchdogStatePath) {
            await watchdog.persistState(config.watchdogStatePath, watchdogSessionId, watchdogIO);
          }

          // Gate evaluation
          if (gateEvaluator) {
            const gateResult = await gateEvaluator.evaluateGates(subversion, currentState);
            // Update state from gate evaluation (may have transitioned)
            state = gateResult.state;
          }

          // Context budget check
          const budget = estimateContextBudget({
            filesRead: 0,
            filesWritten: 0,
            subversionsCompleted: subversion + 1,
            thresholdPercent: config.budgetThreshold ?? 80,
          });
          const pauseDecision = shouldPause(budget);
          if (pauseDecision.pause) {
            state = transition(currentState, 'PAUSED', pauseDecision.reason ?? 'context budget exceeded');
          }
        },
      });

      // ====================================================================
      // Step 5: Start watchdog and run scheduler
      // ====================================================================
      watchdog.start();

      // Persist initial watchdog state to file if configured
      const watchdogSessionId = config.sessionId ?? config.milestoneId;
      const watchdogIO = {
        writeFile: async (p: string, c: string) => { await writeFileFs(p, c, 'utf-8'); },
        readFile: async (p: string) => readFileFs(p, 'utf-8'),
      };
      if (config.watchdogStatePath) {
        await watchdog.persistState(config.watchdogStatePath, watchdogSessionId, watchdogIO);
      }

      try {
        const schedulerResult = await scheduler.run(state);
        state = schedulerResult;
      } catch (err) {
        // If the scheduler throws (unexpected error), transition to FAILED
        if (state.status !== 'FAILED' && state.status !== 'DONE') {
          const message = err instanceof Error ? err.message : String(err);
          try {
            state = transition(state, 'FAILED', `unexpected error: ${message}`);
          } catch {
            // If transition itself fails (e.g., already in terminal state), keep current state
            state = { ...state, last_error: message };
          }
        }
      } finally {
        watchdog.stop();
      }

      // ====================================================================
      // Step 6: Final transition to DONE (if COMPLETING)
      // ====================================================================
      if (state.status === 'COMPLETING') {
        state = transition(state, 'DONE', 'all subversions completed successfully');
        await writeExecutionState(state, config.statePath);
      }

      // ====================================================================
      // Step 6b: Team lifecycle -- dissolve ephemeral teams on completion
      // ====================================================================
      if (lifecycleManager && config.team && state.status === 'DONE') {
        const durability = config.team.durability ?? 'persistent';
        if (durability === 'ephemeral') {
          try {
            await lifecycleManager.dissolveTeam(
              config.team.teamConfig.name,
              'autonomy:milestone-complete',
            );
          } catch (err) {
            // Log but don't fail the engine -- milestone completed successfully
            const message = err instanceof Error ? err.message : String(err);
            state = { ...state, last_error: `team dissolution warning: ${message}` };
          }
        }
      }

      return state;
    },
  };
}
