/**
 * Type definitions and constants for the staging pipeline.
 *
 * Defines the staging state machine, directory layout, and
 * metadata interface for items flowing through the staging
 * pipeline (.planning/staging/).
 *
 * @module staging/types
 */

/** Valid staging states -- lifecycle of an item through the pipeline. */
export type StagingState = 'inbox' | 'checking' | 'attention' | 'ready' | 'aside';

/** All valid staging states as a const array for runtime use and Zod enum. */
export const STAGING_STATES = [
  'inbox',
  'checking',
  'attention',
  'ready',
  'aside',
] as const;

/**
 * Staging directory layout under .planning/staging/.
 * Keys are logical names, values are relative paths from project root.
 */
export const STAGING_DIRS = {
  root: '.planning/staging',
  inbox: '.planning/staging/inbox',
  checking: '.planning/staging/checking',
  attention: '.planning/staging/attention',
  ready: '.planning/staging/ready',
  aside: '.planning/staging/aside',
  queue: '.planning/staging/queue.jsonl',
} as const;

/**
 * All directory paths that must be created.
 * Excludes root (created implicitly by recursive mkdir) and
 * queue.jsonl (a file, not a directory -- managed by queue module).
 */
export const ALL_STAGING_DIRS: string[] = [
  STAGING_DIRS.inbox,
  STAGING_DIRS.checking,
  STAGING_DIRS.attention,
  STAGING_DIRS.ready,
  STAGING_DIRS.aside,
];

/**
 * Metadata attached to every staged item.
 *
 * The index signature allows additional fields for future
 * extensibility (INTAKE-02 says "built incrementally").
 */
export interface StagingMetadata {
  /** ISO 8601 timestamp of when the item was submitted. */
  submitted_at: string;
  /** Origin of the item (e.g., 'dashboard', 'cli', 'session'). */
  source: string;
  /** Current staging state. */
  status: StagingState;
  /** Additional fields for future extensibility. */
  [key: string]: unknown;
}
