/**
 * HB-04 — Worker role.
 *
 * The Worker generates candidate skills against the input task. In the
 * existing skill-creator six-step loop this is the Suggest/Auto-Load step;
 * the Worker here is a *named* re-entry into that path, not a replacement.
 *
 * Worker writes its own state only — see {@link assertRoleWrite}.
 *
 * @module skill-creator/roles/worker
 */

import { assertRoleWrite } from './role-isolation.js';
import { isWelerRolesEnabled } from './settings.js';
import type { WorkerOutput, WorkerState } from './types.js';

/** Sentinel returned when the flag is off. */
export const WORKER_DISABLED_STATE: WorkerState = Object.freeze({
  role: 'worker',
  taskId: '',
  candidates: Object.freeze([]) as ReadonlyArray<WorkerOutput>,
  internalNotes: Object.freeze([]) as ReadonlyArray<string>,
});

/** Inputs the Worker accepts when generating a candidate. */
export interface WorkerGenerateInput {
  readonly taskId: string;
  readonly summary: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  /** Optional internal note recorded into Worker state only. */
  readonly note?: string;
}

let candidateCounter = 0;
function nextCandidateId(taskId: string): string {
  candidateCounter = (candidateCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${taskId}::cand-${candidateCounter}`;
}

/**
 * Reset the internal candidate counter. Test-only; production code never
 * calls this.
 */
export function resetWorkerCounter(): void {
  candidateCounter = 0;
}

/**
 * Generate a Worker candidate, returning the new {@link WorkerState}. The
 * input state is treated as immutable; this function never mutates it.
 *
 * Returns the disabled sentinel when the flag is off.
 */
export function workerGenerate(
  state: WorkerState,
  input: WorkerGenerateInput,
  settingsPath?: string,
): WorkerState {
  if (!isWelerRolesEnabled(settingsPath)) {
    return WORKER_DISABLED_STATE;
  }
  // Worker is the actor + the target — write to its own state only.
  assertRoleWrite('worker', state.role, 'candidates');
  const output: WorkerOutput = Object.freeze({
    role: 'worker',
    taskId: input.taskId,
    candidateId: nextCandidateId(input.taskId),
    summary: input.summary,
    payload: Object.freeze({ ...(input.payload ?? {}) }),
    producedAt: new Date().toISOString(),
  });
  const candidates: ReadonlyArray<WorkerOutput> = Object.freeze([
    ...state.candidates,
    output,
  ]);
  const internalNotes: ReadonlyArray<string> =
    typeof input.note === 'string' && input.note.length > 0
      ? Object.freeze([...state.internalNotes, input.note])
      : state.internalNotes;
  return Object.freeze({
    role: 'worker',
    taskId: input.taskId,
    candidates,
    internalNotes,
  });
}

/** Empty Worker state factory. */
export function emptyWorkerState(taskId: string): WorkerState {
  return Object.freeze({
    role: 'worker',
    taskId,
    candidates: Object.freeze([]) as ReadonlyArray<WorkerOutput>,
    internalNotes: Object.freeze([]) as ReadonlyArray<string>,
  });
}
