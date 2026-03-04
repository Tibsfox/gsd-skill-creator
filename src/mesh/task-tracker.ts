/**
 * TaskTracker -- per-task lifecycle state machine with event emission.
 *
 * Tracks task state through: queued -> dispatching -> executing -> collecting -> complete.
 * 'failed' is reachable from any state. Each transition records timestamp and
 * emits a MeshEvent to the event log.
 *
 * MESH-04: Per-task lifecycle tracking for result aggregation.
 */

import type { MeshEventLog } from './event-log.js';

// ============================================================================
// Types
// ============================================================================

/** Possible task lifecycle states */
export type TaskState = 'queued' | 'dispatching' | 'executing' | 'collecting' | 'complete' | 'failed';

/** A recorded state transition */
export interface StateTransitionRecord {
  from: TaskState | 'init';
  to: TaskState;
  timestamp: string;
}

/** Internal entry for a tracked task */
interface TaskTrackerEntry {
  state: TaskState;
  transitions: StateTransitionRecord[];
}

// ============================================================================
// Valid transitions
// ============================================================================

/** Maps current state to its only valid forward target (excluding 'failed') */
const FORWARD_TARGET: Record<TaskState, TaskState | null> = {
  queued: 'dispatching',
  dispatching: 'executing',
  executing: 'collecting',
  collecting: 'complete',
  complete: null,
  failed: null,
};

/**
 * Returns true if transitioning from `current` to `next` is legal.
 * - 'failed' is always reachable from any non-terminal state
 * - Forward transitions must follow the sequence exactly
 */
function isLegalTransition(current: TaskState, next: TaskState): boolean {
  if (next === 'failed') return true;
  return FORWARD_TARGET[current] === next;
}

// ============================================================================
// TaskTracker
// ============================================================================

/**
 * Tracks per-task lifecycle state with event emission.
 *
 * One TaskTracker instance per execution (wave/pipeline). Not shared across executions.
 */
export class TaskTracker {
  private readonly tasks = new Map<string, TaskTrackerEntry>();

  constructor(private readonly eventLog: MeshEventLog) {}

  /**
   * Initializes a task to 'queued' state. Idempotent — if already initialized, no-op.
   */
  async init(taskId: string): Promise<void> {
    if (this.tasks.has(taskId)) return;

    const timestamp = new Date().toISOString();
    const entry: TaskTrackerEntry = {
      state: 'queued',
      transitions: [{ from: 'init', to: 'queued', timestamp }],
    };
    this.tasks.set(taskId, entry);

    await this.eventLog.write({
      nodeId: 'mesh-executor',
      eventType: 'health-change',
      payload: {
        type: 'task-state-change',
        taskId,
        previousState: 'init',
        newState: 'queued',
        timestamp,
      },
    });
  }

  /**
   * Transitions a task to a new state.
   *
   * @returns true if the transition was legal and applied, false otherwise.
   * Never throws — illegal transitions are silently rejected.
   */
  async transition(taskId: string, newState: TaskState): Promise<boolean> {
    const entry = this.tasks.get(taskId);
    if (!entry) return false;

    if (!isLegalTransition(entry.state, newState)) return false;

    const timestamp = new Date().toISOString();
    const previousState = entry.state;
    entry.state = newState;
    entry.transitions.push({ from: previousState, to: newState, timestamp });

    await this.eventLog.write({
      nodeId: 'mesh-executor',
      eventType: 'health-change',
      payload: {
        type: 'task-state-change',
        taskId,
        previousState,
        newState,
        timestamp,
      },
    });

    return true;
  }

  /** Returns current state of a task, or undefined if not tracked. */
  getState(taskId: string): TaskState | undefined {
    return this.tasks.get(taskId)?.state;
  }

  /** Returns all recorded transitions for a task, or empty array if not tracked. */
  getTransitions(taskId: string): StateTransitionRecord[] {
    return this.tasks.get(taskId)?.transitions ?? [];
  }
}
