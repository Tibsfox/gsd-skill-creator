/**
 * MeshExecutor -- dispatches tasks to mesh nodes via MeshCoordinator.
 *
 * Three dispatch modes:
 * - executeWave: concurrent task dispatch with lifecycle tracking and timeout
 * - executePipeline: sequential stages with output chaining
 * - executeParallel: same task to N nodes for comparative benchmarking
 *
 * MESH-01: Real HTTP dispatch via coordinator
 * MESH-02: Parallel and pipeline dispatch
 * MESH-03: Failover propagation
 * MESH-04: Result aggregation with per-task lifecycle
 */

import type { MeshCoordinator, DispatchResult } from './coordinator.js';
import type { MeshTransport } from './transport.js';
import type { DiscoveryService } from './discovery.js';
import type { MeshEventLog } from './event-log.js';
import type { AnnotatedTask, MeshWavePlan } from './wave-planner.js';
import type { RoutingRequest } from './routing-types.js';
import { TaskTracker } from './task-tracker.js';
import type { TaskState, StateTransitionRecord } from './task-tracker.js';

// ============================================================================
// Types
// ============================================================================

/** Options for wave execution */
export interface WaveExecutionOptions {
  /** Per-task timeout in milliseconds (default 60000) */
  taskTimeoutMs?: number;
  /** Failover timeout in milliseconds (default 5000) */
  failoverTimeoutMs?: number;
  /** Max concurrent tasks (default Infinity) */
  maxConcurrency?: number;
}

/** Result of a single task execution */
export interface TaskExecutionResult {
  taskId: string;
  skillName: string;
  targetNodeId: string;
  success: boolean;
  dispatchResult?: DispatchResult;
  failoverUsed: boolean;
  failoverNodeId?: string;
  state: TaskState;
  error?: string;
  durationMs: number;
  stateTransitions: Array<{ from: string; to: string; timestamp: string }>;
}

/** Result of a wave execution */
export interface WaveExecutionResult {
  waveId: string;
  success: boolean;
  partialSuccess: boolean;
  tasks: TaskExecutionResult[];
  completedCount: number;
  failedCount: number;
  totalDurationMs: number;
}

/** A stage in a pipeline execution */
export interface ExecutorPipelineStage {
  task: AnnotatedTask;
  bundleData: string;
}

/** Result of a pipeline execution */
export interface PipelineExecutionResult {
  stages: TaskExecutionResult[];
  completed: number;
  total: number;
  success: boolean;
  finalOutput?: string;
}

/** Result of a parallel execution */
export interface ParallelExecutionResult {
  taskId: string;
  results: TaskExecutionResult[];
  completedCount: number;
  failedCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TASK_TIMEOUT_MS = 60000;
const DEFAULT_FAILOVER_TIMEOUT_MS = 5000;

// ============================================================================
// MeshExecutor
// ============================================================================

/**
 * Dispatches tasks to mesh nodes with lifecycle tracking, timeout, and failover.
 * Never throws — all errors caught and wrapped into result objects.
 */
export class MeshExecutor {
  constructor(
    private readonly coordinator: MeshCoordinator,
    private readonly transport: MeshTransport,
    private readonly discoveryService: DiscoveryService,
    private readonly eventLog: MeshEventLog,
    private readonly localNodeId: string,
  ) {}

  // ── executeWave ───────────────────────────────────────────────────────────

  async executeWave(
    plan: MeshWavePlan,
    options?: WaveExecutionOptions,
  ): Promise<WaveExecutionResult> {
    const taskTimeoutMs = options?.taskTimeoutMs ?? DEFAULT_TASK_TIMEOUT_MS;
    const maxConcurrency = options?.maxConcurrency ?? Infinity;
    const waveStart = Date.now();
    const tracker = new TaskTracker(this.eventLog);

    if (plan.tasks.length === 0) {
      return {
        waveId: plan.waveId,
        success: true,
        partialSuccess: false,
        tasks: [],
        completedCount: 0,
        failedCount: 0,
        totalDurationMs: 0,
      };
    }

    // Init all tasks
    for (const task of plan.tasks) {
      await tracker.init(task.taskId);
    }

    // Build dispatch functions
    const taskFns = plan.tasks.map(
      (task) => () => this.executeOneTask(task, tracker, taskTimeoutMs),
    );

    // Execute with concurrency control
    const results = await withConcurrencyLimit(taskFns, maxConcurrency);

    const completedCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return {
      waveId: plan.waveId,
      success: completedCount === results.length,
      partialSuccess: completedCount > 0 && completedCount < results.length,
      tasks: results,
      completedCount,
      failedCount,
      totalDurationMs: Date.now() - waveStart,
    };
  }

  // ── executePipeline ───────────────────────────────────────────────────────

  async executePipeline(
    stages: ExecutorPipelineStage[],
  ): Promise<PipelineExecutionResult> {
    if (stages.length === 0) {
      return { stages: [], completed: 0, total: 0, success: true };
    }

    const results: TaskExecutionResult[] = [];
    let completed = 0;
    let currentBundleData = stages[0].bundleData;
    let finalOutput: string | undefined;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const bundleData = i === 0 ? stage.bundleData : currentBundleData;

      const request: RoutingRequest = {
        taskId: stage.task.taskId,
        requiredCapability: {
          chipName: stage.task.requiredChip,
          minContextLength: stage.task.minContextLength,
        },
        preferLocal: true,
      };

      const taskStart = Date.now();
      let dispatchResult: DispatchResult;

      try {
        dispatchResult = await this.coordinator.dispatchTask(request, bundleData);
      } catch (err) {
        const taskResult: TaskExecutionResult = {
          taskId: stage.task.taskId,
          skillName: stage.task.skillName,
          targetNodeId: stage.task.routing.target.nodeId,
          success: false,
          failoverUsed: false,
          state: 'failed',
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - taskStart,
          stateTransitions: [],
        };
        results.push(taskResult);
        return { stages: results, completed, total: stages.length, success: false };
      }

      const taskResult: TaskExecutionResult = {
        taskId: stage.task.taskId,
        skillName: stage.task.skillName,
        targetNodeId: stage.task.routing.target.nodeId,
        success: dispatchResult.success,
        dispatchResult,
        failoverUsed: dispatchResult.failoverUsed,
        state: dispatchResult.success ? 'complete' : 'failed',
        error: dispatchResult.error,
        durationMs: Date.now() - taskStart,
        stateTransitions: [],
      };
      results.push(taskResult);

      if (!dispatchResult.success) {
        return { stages: results, completed, total: stages.length, success: false };
      }

      completed++;
      // Chain output: use transport result payload as next stage input
      const payload = dispatchResult.transportResult?.payload;
      if (typeof payload === 'string') {
        currentBundleData = payload;
        finalOutput = payload;
      }
    }

    return {
      stages: results,
      completed,
      total: stages.length,
      success: true,
      finalOutput,
    };
  }

  // ── executeParallel ───────────────────────────────────────────────────────

  async executeParallel(
    task: AnnotatedTask,
    targetNodeIds: string[],
  ): Promise<ParallelExecutionResult> {
    const request: RoutingRequest = {
      taskId: task.taskId,
      requiredCapability: {
        chipName: task.requiredChip,
        minContextLength: task.minContextLength,
      },
      preferLocal: true,
    };

    const dispatchResults = await this.coordinator.dispatchParallel(
      request,
      'parallel-bundle',
      targetNodeIds,
    );

    const results: TaskExecutionResult[] = dispatchResults.map((dr, idx) => ({
      taskId: task.taskId,
      skillName: task.skillName,
      targetNodeId: targetNodeIds[idx],
      success: dr.success,
      dispatchResult: dr,
      failoverUsed: dr.failoverUsed,
      state: (dr.success ? 'complete' : 'failed') as TaskState,
      error: dr.error,
      durationMs: 0,
      stateTransitions: [],
    }));

    return {
      taskId: task.taskId,
      results,
      completedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async executeOneTask(
    task: AnnotatedTask,
    tracker: TaskTracker,
    taskTimeoutMs: number,
  ): Promise<TaskExecutionResult> {
    const taskStart = Date.now();

    try {
      await tracker.transition(task.taskId, 'dispatching');

      const request: RoutingRequest = {
        taskId: task.taskId,
        requiredCapability: {
          chipName: task.requiredChip,
          minContextLength: task.minContextLength,
        },
        preferLocal: true,
      };

      // Race dispatch against timeout
      const dispatchResult = await raceWithTimeout(
        this.coordinator.dispatchTask(request, 'wave-bundle'),
        taskTimeoutMs,
      );

      if (dispatchResult === TIMEOUT_SENTINEL) {
        await tracker.transition(task.taskId, 'failed');
        return {
          taskId: task.taskId,
          skillName: task.skillName,
          targetNodeId: task.routing.target.nodeId,
          success: false,
          failoverUsed: false,
          state: 'failed',
          error: `Task timeout after ${taskTimeoutMs}ms`,
          durationMs: Date.now() - taskStart,
          stateTransitions: tracker.getTransitions(task.taskId).map((t) => ({
            from: String(t.from),
            to: t.to,
            timestamp: t.timestamp,
          })),
        };
      }

      await tracker.transition(task.taskId, 'executing');
      await tracker.transition(task.taskId, 'collecting');

      const finalState: TaskState = dispatchResult.success ? 'complete' : 'failed';
      await tracker.transition(task.taskId, finalState);

      return {
        taskId: task.taskId,
        skillName: task.skillName,
        targetNodeId: task.routing.target.nodeId,
        success: dispatchResult.success,
        dispatchResult,
        failoverUsed: dispatchResult.failoverUsed,
        failoverNodeId: dispatchResult.failoverUsed
          ? task.routing.fallback?.nodeId
          : undefined,
        state: finalState,
        error: dispatchResult.error,
        durationMs: Date.now() - taskStart,
        stateTransitions: tracker.getTransitions(task.taskId).map((t) => ({
          from: String(t.from),
          to: t.to,
          timestamp: t.timestamp,
        })),
      };
    } catch (err) {
      await tracker.transition(task.taskId, 'failed');
      return {
        taskId: task.taskId,
        skillName: task.skillName,
        targetNodeId: task.routing.target.nodeId,
        success: false,
        failoverUsed: false,
        state: 'failed',
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - taskStart,
        stateTransitions: tracker.getTransitions(task.taskId).map((t) => ({
          from: String(t.from),
          to: t.to,
          timestamp: t.timestamp,
        })),
      };
    }
  }
}

// ============================================================================
// Utilities
// ============================================================================

const TIMEOUT_SENTINEL = Symbol('timeout');

async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | typeof TIMEOUT_SENTINEL> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT_SENTINEL), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

async function withConcurrencyLimit<T>(
  fns: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  if (limit >= fns.length || !isFinite(limit)) {
    // No limiting needed — run all concurrently
    const settled = await Promise.allSettled(fns.map((fn) => fn()));
    return settled.map((s) => {
      if (s.status === 'fulfilled') return s.value;
      throw s.reason;
    });
  }

  // Pool-based concurrency limiting
  const results: T[] = new Array(fns.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < fns.length) {
      const idx = nextIndex++;
      results[idx] = await fns[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, fns.length) }, () => runNext());
  await Promise.all(workers);
  return results;
}
