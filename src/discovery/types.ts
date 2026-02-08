/**
 * Zod schemas and TypeScript types for the Claude Code JSONL session format.
 *
 * Defines schemas for all 7 JSONL entry types (user, assistant, progress,
 * file-history-snapshot, system, summary, queue-operation), content blocks
 * (text, tool_use, tool_result), and the sessions-index.json format.
 *
 * All schemas use `.passthrough()` for forward compatibility with future
 * Claude Code format changes.
 */

import { z } from 'zod';

// ============================================================================
// Content Block Schemas
// ============================================================================

/** Text content block inside assistant message.content arrays */
export const TextBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
}).passthrough();

/** Tool use content block with name and input parameters */
export const ToolUseBlockSchema = z.object({
  type: z.literal('tool_use'),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
}).passthrough();

/** Tool result content block referencing a prior tool_use */
export const ToolResultBlockSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string(),
  content: z.unknown(), // Can be string or array
}).passthrough();

/** Union of known content block types, with fallback for unknown */
export const ContentBlockSchema = z.union([
  TextBlockSchema,
  ToolUseBlockSchema,
  ToolResultBlockSchema,
  z.object({ type: z.string() }).passthrough(), // Unknown block types
]);

// ============================================================================
// Base Entry Schema
// ============================================================================

/** Base entry schema shared by all 7 JSONL entry types */
export const BaseEntrySchema = z.object({
  type: z.string(),
}).passthrough();

// ============================================================================
// Specific Entry Schemas (types we process deeply)
// ============================================================================

/** User entry with message content (string or array) */
export const UserEntrySchema = z.object({
  type: z.literal('user'),
  uuid: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  isSidechain: z.boolean().optional(),
  isMeta: z.boolean().optional(),
  userType: z.string().optional(),
  cwd: z.string().optional(),
  version: z.string().optional(),
  gitBranch: z.string().optional(),
  parentUuid: z.string().optional(),
  message: z.object({
    role: z.literal('user'),
    content: z.union([z.string(), z.array(ContentBlockSchema)]),
  }),
}).passthrough();

/** Assistant entry with nested content blocks and usage stats */
export const AssistantEntrySchema = z.object({
  type: z.literal('assistant'),
  uuid: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().optional(),
  isSidechain: z.boolean().optional(),
  parentUuid: z.string().optional(),
  message: z.object({
    role: z.literal('assistant'),
    model: z.string().optional(),
    content: z.array(ContentBlockSchema), // Array of TextBlock | ToolUseBlock | ToolResultBlock
    usage: z.object({
      input_tokens: z.number(),
      output_tokens: z.number(),
    }).passthrough().optional(),
  }),
}).passthrough();

// ============================================================================
// Noise Entry Schemas (type recognition only, no deep parsing)
// ============================================================================

/** Progress entry -- tool execution progress updates */
export const ProgressEntrySchema = z.object({
  type: z.literal('progress'),
}).passthrough();

/** File history snapshot -- file state captures */
export const FileHistorySnapshotEntrySchema = z.object({
  type: z.literal('file-history-snapshot'),
}).passthrough();

/** System entry -- system messages and configuration */
export const SystemEntrySchema = z.object({
  type: z.literal('system'),
}).passthrough();

/** Summary entry -- conversation summary metadata */
export const SummaryEntrySchema = z.object({
  type: z.literal('summary'),
}).passthrough();

/** Queue operation entry -- task queue operations */
export const QueueOperationEntrySchema = z.object({
  type: z.literal('queue-operation'),
}).passthrough();

// ============================================================================
// Sessions-Index Schemas
// ============================================================================

/** Individual entry in sessions-index.json */
export const SessionsIndexEntrySchema = z.object({
  sessionId: z.string(),
  fullPath: z.string(),
  fileMtime: z.number(),
  firstPrompt: z.string().optional(),
  summary: z.string().optional(),
  messageCount: z.number(),
  created: z.string(),
  modified: z.string(),
  gitBranch: z.string().optional(),
  projectPath: z.string().optional(),
  isSidechain: z.boolean().optional(),
}).passthrough();

/** Top-level sessions-index.json structure */
export const SessionsIndexSchema = z.object({
  version: z.number(),
  entries: z.array(SessionsIndexEntrySchema),
  originalPath: z.string().optional(),
}).passthrough();

// ============================================================================
// Inferred TypeScript Types
// ============================================================================

export type TextBlock = z.infer<typeof TextBlockSchema>;
export type ToolUseBlock = z.infer<typeof ToolUseBlockSchema>;
export type ToolResultBlock = z.infer<typeof ToolResultBlockSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type BaseEntry = z.infer<typeof BaseEntrySchema>;
export type UserEntry = z.infer<typeof UserEntrySchema>;
export type AssistantEntry = z.infer<typeof AssistantEntrySchema>;
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;
export type FileHistorySnapshotEntry = z.infer<typeof FileHistorySnapshotEntrySchema>;
export type SystemEntry = z.infer<typeof SystemEntrySchema>;
export type SummaryEntry = z.infer<typeof SummaryEntrySchema>;
export type QueueOperationEntry = z.infer<typeof QueueOperationEntrySchema>;
export type SessionsIndexEntry = z.infer<typeof SessionsIndexEntrySchema>;
export type SessionsIndex = z.infer<typeof SessionsIndexSchema>;

// ============================================================================
// Processed Result Types (used by downstream code)
// ============================================================================

/** Result of extracting tool uses from an assistant entry */
export interface ExtractedToolUse {
  name: string;
  input: Record<string, unknown>;
}

/** Result of extracting a real user prompt */
export interface ExtractedPrompt {
  text: string;
  sessionId: string;
  timestamp: string;
  cwd: string;
}

/** Parsed session entry after type routing */
export type ParsedEntry =
  | { kind: 'user-prompt'; data: ExtractedPrompt }
  | { kind: 'tool-uses'; data: ExtractedToolUse[] }
  | { kind: 'skipped'; type: string };

/** Session info from sessions-index.json with project context */
export interface SessionInfo extends SessionsIndexEntry {
  projectSlug: string;
}

/** All known entry type strings */
export const KNOWN_ENTRY_TYPES = [
  'user', 'assistant', 'progress', 'file-history-snapshot',
  'system', 'summary', 'queue-operation',
] as const;

export type KnownEntryType = typeof KNOWN_ENTRY_TYPES[number];
