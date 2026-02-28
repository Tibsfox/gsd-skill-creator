/**
 * Type definitions and constants for the staging queue.
 *
 * Defines the queue state machine (distinct from StagingState filesystem
 * states), queue entry metadata, and audit log entry structure.
 *
 * Queue states track items through the execution pipeline:
 * uploaded -> checking -> needs-attention -> ready -> queued -> executing
 * with set-aside as a parking state available from any non-terminal state.
 *
 * @module staging/queue/types
 */

// ============================================================================
// Queue State
// ============================================================================

/** Valid queue states -- lifecycle of an item through the execution pipeline. */
export type QueueState =
  | 'uploaded'
  | 'checking'
  | 'needs-attention'
  | 'ready'
  | 'queued'
  | 'executing'
  | 'set-aside';

/** All valid queue states as a const array for runtime use. */
export const QUEUE_STATES = [
  'uploaded',
  'checking',
  'needs-attention',
  'ready',
  'queued',
  'executing',
  'set-aside',
] as const;

// ============================================================================
// Valid Transitions
// ============================================================================

/**
 * Allowed queue state transitions.
 *
 * - uploaded -> checking: start processing
 * - uploaded -> set-aside: park before processing
 * - checking -> needs-attention: issues found requiring human attention
 * - checking -> ready: passed all checks
 * - checking -> set-aside: park during processing
 * - needs-attention -> checking: re-check after user addresses issues
 * - needs-attention -> ready: user approves despite findings
 * - needs-attention -> set-aside: user defers
 * - ready -> queued: scheduled for execution
 * - ready -> set-aside: user defers
 * - queued -> executing: execution started
 * - queued -> set-aside: pulled from queue
 * - executing -> (none): terminal state
 * - set-aside -> uploaded: re-enter pipeline
 */
export const VALID_QUEUE_TRANSITIONS: Record<QueueState, QueueState[]> = {
  'uploaded': ['checking', 'set-aside'],
  'checking': ['needs-attention', 'ready', 'set-aside'],
  'needs-attention': ['checking', 'ready', 'set-aside'],
  'ready': ['queued', 'set-aside'],
  'queued': ['executing', 'set-aside'],
  'executing': [],
  'set-aside': ['uploaded'],
};

// ============================================================================
// Queue Entry
// ============================================================================

/**
 * A single item in the staging queue.
 *
 * Tracks a document's progress through the execution pipeline
 * with metadata for scheduling and organization.
 */
export interface QueueEntry {
  /** Unique queue entry identifier (format: 'q-YYYYMMDD-NNN'). */
  id: string;
  /** Document filename in staging. */
  filename: string;
  /** Current queue state. */
  state: QueueState;
  /** Human-readable milestone name. */
  milestoneName: string;
  /** Primary domain from resource analysis tags. */
  domain: string;
  /** Classification tags from ResourceManifest.queueContext.tags. */
  tags: string[];
  /** Path to the .manifest.json in ready/. */
  resourceManifestPath: string;
  /** ISO 8601 timestamp of entry creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last state change. */
  updatedAt: string;
}

// ============================================================================
// Queue Audit Entry
// ============================================================================

/**
 * A single audit log entry for a queue state change.
 *
 * Every queue operation is recorded as a timestamped entry in
 * queue.jsonl for full traceability.
 */
export interface QueueAuditEntry {
  /** Unique audit entry identifier (format: 'audit-YYYYMMDD-HHMMSS-NNN'). */
  id: string;
  /** References QueueEntry.id. */
  entryId: string;
  /** Human-readable action (e.g., 'transition', 'create', 'set-aside'). */
  action: string;
  /** Previous state (null for creation). */
  fromState: QueueState | null;
  /** New state after the action. */
  toState: QueueState;
  /** Who triggered this (e.g., 'system', 'user', agent name). */
  actor: string;
  /** Why this action was taken. */
  rationale: string;
  /** ISO 8601 timestamp of the action. */
  timestamp: string;
}
