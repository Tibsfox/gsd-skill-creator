/**
 * Queue state machine for transitioning queue items between states.
 *
 * Validates transitions against VALID_QUEUE_TRANSITIONS and returns
 * a new immutable QueueEntry with updated state and timestamp.
 * The original entry is never mutated.
 *
 * @module staging/queue/state-machine
 */

import type { QueueEntry, QueueState } from './types.js';
import { VALID_QUEUE_TRANSITIONS } from './types.js';

/**
 * Transition a queue item to a new state.
 *
 * Validates the transition against the allowed transition map,
 * then returns a new QueueEntry with the updated state and
 * a fresh updatedAt timestamp.
 *
 * @param entry - The current queue entry.
 * @param toState - The target state.
 * @returns A new QueueEntry with updated state and updatedAt.
 * @throws Error if transitioning to the same state.
 * @throws Error if the transition is not allowed by VALID_QUEUE_TRANSITIONS.
 */
export function transitionQueueItem(
  entry: QueueEntry,
  toState: QueueState,
): QueueEntry {
  // Validate: same-state transition
  if (entry.state === toState) {
    throw new Error(
      `Cannot transition queue item to same state: ${toState}`,
    );
  }

  // Validate: allowed transition
  const allowed = VALID_QUEUE_TRANSITIONS[entry.state];
  if (!allowed.includes(toState)) {
    throw new Error(
      `Invalid queue transition: ${entry.state} -> ${toState}`,
    );
  }

  // Return new object (do not mutate original)
  return {
    ...entry,
    state: toState,
    updatedAt: new Date().toISOString(),
  };
}
