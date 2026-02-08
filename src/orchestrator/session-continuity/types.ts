/**
 * Type definitions for session continuity snapshots.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - SessionSnapshot: compact narrative snapshot of a Claude Code session
 *
 * All object schemas use .passthrough() for forward compatibility
 * with new fields added in future versions.
 *
 * The top-level `timestamp` field (Unix ms) ensures RetentionManager
 * compatibility for age-based pruning.
 */

import { z } from 'zod';

/**
 * Default maximum number of snapshots to retain.
 */
export const DEFAULT_MAX_SNAPSHOTS = 20;

/**
 * Default maximum age (in days) for snapshot retention.
 */
export const DEFAULT_SNAPSHOT_MAX_AGE_DAYS = 90;

/**
 * Default filename for snapshot JSONL persistence.
 */
export const SNAPSHOT_FILENAME = 'snapshots.jsonl';

// ============================================================================
// SessionSnapshot
// ============================================================================

/**
 * Schema for a compact session snapshot.
 *
 * Required: session_id, timestamp, saved_at, summary, metrics
 * Optional with defaults: active_skills ([]), files_modified ([]),
 *   open_questions ([]), top_tools ([]), top_commands ([])
 *
 * timestamp is Unix ms (number) for RetentionManager age-based pruning.
 */
export const SessionSnapshotSchema = z.object({
  session_id: z.string(),
  timestamp: z.number(),
  saved_at: z.string(),
  summary: z.string(),
  active_skills: z.array(z.string()).default(() => []),
  files_modified: z.array(z.string()).default(() => []),
  open_questions: z.array(z.string()).default(() => []),
  metrics: z.object({
    duration_minutes: z.number(),
    tool_calls: z.number(),
    files_read: z.number(),
    files_written: z.number(),
  }).passthrough(),
  top_tools: z.array(z.string()).default(() => []),
  top_commands: z.array(z.string()).default(() => []),
}).passthrough();

export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;
