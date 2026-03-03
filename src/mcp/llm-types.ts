/**
 * LLM MCP Wrapper type schemas and constants.
 *
 * Defines Zod schemas for the four MCP tools exposed by LlmMcpWrapper:
 * llm.chat, llm.health, llm.capabilities, llm.models.
 *
 * Follows the Zod-schema-first pattern established in src/chips/types.ts.
 * Imports ChatMessageSchema and ChatOptionsSchema from chips -- no redefinition.
 *
 * IMP-03: Constants exported for threshold registry tracking.
 * Pure type definitions -- no IO, no side effects.
 */

import { z } from 'zod';
import { ChatMessageSchema, ChatOptionsSchema } from '../chips/types.js';

// Re-export for consumers who only import from this module
export { ChatMessageSchema, ChatOptionsSchema };

// ============================================================================
// IMP-03 Constants (LLM Wrapper -- Wave 3)
// ============================================================================

/** Maximum concurrent requests per chip (serializes local model access) */
export const DEFAULT_MAX_CONCURRENT_PER_CHIP = 1;

/** Request timeout in milliseconds before aborting a chip.chat() call */
export const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

/** LLM wrapper protocol version -- bump if request/response shapes change */
export const LLM_WRAPPER_VERSION = 1;

// ============================================================================
// LlmChatRequestSchema
// ============================================================================

/**
 * Schema for an llm.chat tool invocation.
 *
 * chipName is required -- caller must name the chip explicitly.
 * messages must be non-empty (at minimum one user message).
 * options is optional -- falls back to chip defaults when omitted.
 */
export const LlmChatRequestSchema = z.object({
  /** Name of the chip to use (must match a registered chip in ChipRegistry) */
  chipName: z.string().min(1),
  /** Conversation history; at least one message required */
  messages: z.array(ChatMessageSchema).min(1),
  /** Optional per-request overrides for model, temperature, maxTokens */
  options: ChatOptionsSchema.optional(),
});

/** TypeScript type for llm.chat tool input */
export type LlmChatRequest = z.infer<typeof LlmChatRequestSchema>;

// ============================================================================
// LlmToolRequestSchema
// ============================================================================

/**
 * Schema for llm.health and llm.capabilities tool invocations.
 *
 * chipName is optional: when omitted, the wrapper reports on all chips.
 * When provided, the wrapper reports only on the named chip.
 * Empty string is rejected -- callers must name a chip or omit the field.
 */
export const LlmToolRequestSchema = z.object({
  /** Optional chip name filter; omit to query all registered chips */
  chipName: z.string().min(1).optional(),
});

/** TypeScript type for llm.health and llm.capabilities tool input */
export type LlmToolRequest = z.infer<typeof LlmToolRequestSchema>;

// ============================================================================
// QueueConfigSchema
// ============================================================================

/**
 * Schema for request queue configuration.
 *
 * maxConcurrentPerChip serializes concurrent requests to the same chip,
 * preventing overload on local LLM servers. Default of 1 is safe for
 * typical consumer hardware running one local model at a time.
 *
 * requestTimeoutMs aborts chip.chat() calls that exceed this duration,
 * preventing infinite hang on unresponsive local models.
 */
export const QueueConfigSchema = z.object({
  /** Maximum concurrent requests per chip (must be positive integer) */
  maxConcurrentPerChip: z.number().int().positive().default(DEFAULT_MAX_CONCURRENT_PER_CHIP),
  /** Milliseconds before a chip.chat() call is aborted (must be positive integer) */
  requestTimeoutMs: z.number().int().positive().default(DEFAULT_REQUEST_TIMEOUT_MS),
});

/** TypeScript type for queue configuration */
export type QueueConfig = z.infer<typeof QueueConfigSchema>;
