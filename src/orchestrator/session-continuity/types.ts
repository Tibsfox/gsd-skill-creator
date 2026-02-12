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

// ============================================================================
// WarmStartContext
// ============================================================================

/**
 * Schema for a warm-start context that merges a SessionSnapshot
 * with STATE.md context (decisions, blockers, position).
 *
 * Copies SessionSnapshot fields directly (not via .extend()) to
 * avoid default-propagation issues with Zod schema composition.
 *
 * Additional fields: suggested_skills, stale_files, decisions,
 * blockers, current_phase, generated_at, staleness_warning.
 */
export const WarmStartContextSchema = z.object({
  // -- SessionSnapshot fields (copied) --
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

  // -- WarmStart-specific fields --
  suggested_skills: z.array(z.string()).default(() => []),
  stale_files: z.array(z.string()).default(() => []),
  decisions: z.array(z.string()).default(() => []),
  blockers: z.array(z.string()).default(() => []),
  current_phase: z.any().nullable().default(null),
  generated_at: z.string(),
  staleness_warning: z.string().nullable().default(null),
}).passthrough();

export type WarmStartContext = z.infer<typeof WarmStartContextSchema>;

// ============================================================================
// HandoffSkillMeta
// ============================================================================

/**
 * Schema for handoff skill frontmatter metadata.
 *
 * The 'disable-model-invocation' key uses a hyphenated form matching
 * Claude Code's expected YAML frontmatter format.
 */
export const HandoffSkillMetaSchema = z.object({
  name: z.string(),
  description: z.string(),
  'disable-model-invocation': z.boolean().default(true),
}).passthrough();

export type HandoffSkillMeta = z.infer<typeof HandoffSkillMetaSchema>;

// ============================================================================
// Sensitive Path Filtering
// ============================================================================

/**
 * Patterns matching file paths that should be excluded from
 * session snapshots and handoff contexts for security.
 */
export const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /\.env/i,
  /credentials/i,
  /secrets?\//i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /password/i,
  /token/i,
  /\.secret/i,
];

/**
 * Filter out sensitive file paths from an array.
 *
 * @param paths - Array of file paths to filter
 * @returns Paths that do not match any SENSITIVE_PATH_PATTERNS
 */
export function filterSensitivePaths(paths: string[]): string[] {
  return paths.filter(p =>
    !SENSITIVE_PATH_PATTERNS.some(pattern => pattern.test(p))
  );
}
