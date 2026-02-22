/**
 * Agent tool type definitions for the GSD-OS MCP gateway.
 *
 * Defines the data model for tracked agents: their roles, lifecycle states,
 * token usage, and log entries. All types have companion Zod schemas for
 * runtime validation.
 *
 * @module mcp/gateway/tools/agent-types
 */

import { z } from 'zod';

// ── Agent State ─────────────────────────────────────────────────────────────

/** Lifecycle states for a gateway-managed agent. */
export const AgentStateSchema = z.enum(['spawning', 'running', 'stopped', 'error']);

/** Agent lifecycle state. */
export type AgentState = z.infer<typeof AgentStateSchema>;

// ── Agent Role ──────────────────────────────────────────────────────────────

/** Known agent roles in the GSD ecosystem. */
export const AgentRoleSchema = z.enum([
  'researcher',
  'planner',
  'executor',
  'verifier',
  'scout',
  'coordinator',
  'custom',
]);

/** Agent role identifier. */
export type AgentRole = z.infer<typeof AgentRoleSchema>;

// ── Token Usage ─────────────────────────────────────────────────────────────

/** Token usage counters for an agent session. */
export const TokenUsageSchema = z.object({
  /** Tokens consumed by prompts. */
  prompt: z.number().int().min(0),
  /** Tokens generated in completions. */
  completion: z.number().int().min(0),
  /** Total tokens (prompt + completion). */
  total: z.number().int().min(0),
});

/** Token usage snapshot. */
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

// ── Log Entry ───────────────────────────────────────────────────────────────

/** Severity levels for agent log entries. */
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

/** Log severity level. */
export type LogLevel = z.infer<typeof LogLevelSchema>;

/** A single log entry from an agent. */
export const AgentLogEntrySchema = z.object({
  /** When the entry was recorded (epoch ms). */
  timestamp: z.number(),
  /** Severity level. */
  level: LogLevelSchema,
  /** Log message. */
  message: z.string(),
  /** Optional structured data. */
  data: z.record(z.unknown()).optional(),
});

/** Agent log entry. */
export type AgentLogEntry = z.infer<typeof AgentLogEntrySchema>;

// ── Agent Record ────────────────────────────────────────────────────────────

/** Complete record for a gateway-managed agent. */
export const AgentRecordSchema = z.object({
  /** Unique agent identifier (UUID). */
  id: z.string().uuid(),
  /** Agent role. */
  role: AgentRoleSchema,
  /** Skills loaded into this agent. */
  skills: z.array(z.string()),
  /** Optional team assignment. */
  team: z.string().optional(),
  /** Current lifecycle state. */
  state: AgentStateSchema,
  /** Current task description (null if idle). */
  currentTask: z.string().nullable(),
  /** Token usage counters. */
  tokenUsage: TokenUsageSchema,
  /** Last activity timestamp (epoch ms). */
  lastActivity: z.number(),
  /** When the agent was spawned (epoch ms). */
  createdAt: z.number(),
});

/** Complete agent record. */
export type AgentRecord = z.infer<typeof AgentRecordSchema>;

// ── Default Max Logs ────────────────────────────────────────────────────────

/** Default maximum number of log entries retained per agent. */
export const DEFAULT_MAX_LOGS = 100;
