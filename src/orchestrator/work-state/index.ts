/**
 * Work State persistence module.
 *
 * Re-exports all public types, schemas, and classes for the
 * persistent work state subsystem (WKST-01 through WKST-03).
 */

// Type schemas and inferred types
export {
  WorkStateSchema,
  QueuedTaskSchema,
  WorkCheckpointSchema,
  DEFAULT_WORK_STATE_FILENAME,
} from './types.js';
export type {
  WorkState,
  QueuedTask,
  WorkCheckpoint,
} from './types.js';

// Persistence
export { WorkStateWriter } from './work-state-writer.js';
export { WorkStateReader } from './work-state-reader.js';

// Queue management
export { QueueManager } from './queue-manager.js';
export type { AddTaskOptions } from './queue-manager.js';
