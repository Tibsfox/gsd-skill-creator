/**
 * ModelChip type system -- Zod schemas and TypeScript types for the chip abstraction layer.
 *
 * Defines the core types used by all chip implementations (OpenAI-compatible, Anthropic).
 * The ModelChip interface is the single behavioral contract that all backends implement.
 *
 * Follows the project pattern from src/den/chipset.ts: Zod schemas with inferred types.
 * Pure type definitions -- no IO, no side effects.
 */

import { z } from 'zod';

// ============================================================================
// Constants (IMP-03: Threshold registry -- Wave 1 constants)
// ============================================================================

/** Chip health check timeout in milliseconds */
export const DEFAULT_TIMEOUT_MS = 30000;

/** Default maximum tokens for chat completions */
export const DEFAULT_MAX_TOKENS = 4096;

/** Default temperature for eval execution (deterministic) */
export const DEFAULT_TEMPERATURE = 0.0;

// ============================================================================
// ChatMessage
// ============================================================================

/**
 * Schema for a single message in a chat conversation.
 */
export const ChatMessageSchema = z.object({
  /** Message origin -- system prompt, user turn, or assistant turn */
  role: z.enum(['system', 'user', 'assistant']),
  /** Text content of the message */
  content: z.string(),
});

/** TypeScript type for chat messages */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================================================
// ChatResponse
// ============================================================================

/**
 * Schema for a chat completion response from a chip.
 */
export const ChatResponseSchema = z.object({
  /** Generated text content */
  content: z.string(),
  /** Model identifier used for this response */
  model: z.string(),
  /** Token usage accounting */
  usage: z.object({
    /** Tokens consumed by the input messages */
    promptTokens: z.number().int().nonnegative(),
    /** Tokens generated in the completion */
    completionTokens: z.number().int().nonnegative(),
  }),
});

/** TypeScript type for chat responses */
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ============================================================================
// ChipCapabilities
// ============================================================================

/**
 * Schema for static capabilities advertised by a chip.
 */
export const ChipCapabilitiesSchema = z.object({
  /** List of model identifiers available on this chip */
  models: z.array(z.string()),
  /** Maximum context window length in tokens */
  maxContextLength: z.number().int().positive(),
  /** Whether the chip supports streaming responses */
  supportsStreaming: z.boolean(),
  /** Whether the chip supports tool/function calling */
  supportsTools: z.boolean(),
});

/** TypeScript type for chip capabilities */
export type ChipCapabilities = z.infer<typeof ChipCapabilitiesSchema>;

// ============================================================================
// ChipHealth
// ============================================================================

/**
 * Schema for a chip health check result.
 */
export const ChipHealthSchema = z.object({
  /** Whether the chip endpoint is reachable and operational */
  available: z.boolean(),
  /** Round-trip latency in milliseconds; null if unavailable or timed out */
  latencyMs: z.number().nonnegative().nullable(),
  /** ISO 8601 timestamp of when this health check was performed */
  lastChecked: z.string(),
});

/** TypeScript type for chip health */
export type ChipHealth = z.infer<typeof ChipHealthSchema>;

// ============================================================================
// ChatOptions
// ============================================================================

/**
 * Schema for optional parameters that override chip defaults per-request.
 */
export const ChatOptionsSchema = z.object({
  /** Override the default model for this request */
  model: z.string().optional(),
  /** Sampling temperature (0.0 = deterministic, 2.0 = maximum randomness) */
  temperature: z.number().min(0).max(2).optional(),
  /** Maximum tokens to generate */
  maxTokens: z.number().int().positive().optional(),
});

/** TypeScript type for chat options */
export type ChatOptions = z.infer<typeof ChatOptionsSchema>;

// ============================================================================
// ChipConfig -- discriminated union on type
// ============================================================================

/**
 * Schema for OpenAI-compatible chip configuration.
 * Requires baseUrl to reach the local/remote endpoint.
 */
const OpenAICompatibleChipConfigSchema = z.object({
  /** Human-readable chip name (used in logs and registries) */
  name: z.string().min(1),
  /** Discriminant: identifies this as an OpenAI-compatible backend */
  type: z.literal('openai-compatible'),
  /** Base URL of the OpenAI-compatible API (e.g. http://localhost:11434) */
  baseUrl: z.string().url(),
  /** Optional API key for authenticated endpoints */
  apiKey: z.string().optional(),
  /** Default model to use when none is specified in ChatOptions */
  defaultModel: z.string().min(1),
});

/**
 * Schema for Anthropic chip configuration.
 * Does not require baseUrl -- always uses api.anthropic.com.
 */
const AnthropicChipConfigSchema = z.object({
  /** Human-readable chip name */
  name: z.string().min(1),
  /** Discriminant: identifies this as an Anthropic backend */
  type: z.literal('anthropic'),
  /** Optional API key; falls back to ANTHROPIC_API_KEY environment variable */
  apiKey: z.string().optional(),
  /** Default Claude model to use */
  defaultModel: z.string().min(1),
});

/**
 * Discriminated union schema for chip configuration.
 * The `type` field determines which backend implementation is used.
 */
export const ChipConfigSchema = z.discriminatedUnion('type', [
  OpenAICompatibleChipConfigSchema,
  AnthropicChipConfigSchema,
]);

/** TypeScript type for chip configuration */
export type ChipConfig = z.infer<typeof ChipConfigSchema>;

// ============================================================================
// ChipRole
// ============================================================================

/**
 * Roles a chip can be assigned in the ChipRegistry.
 * Used by Plan 02 (ChipRegistry) to assign chips to evaluation roles.
 */
export type ChipRole = 'executor' | 'grader' | 'analyzer';

// ============================================================================
// ModelChip interface -- behavioral contract
// ============================================================================

/**
 * The single behavioral contract for all model backends.
 *
 * Every chip implementation (OpenAI-compatible, Anthropic, future backends)
 * must implement this interface. This allows skill evals to run uniformly
 * across any model backend without knowing implementation details.
 *
 * Not a Zod schema -- this is a structural TypeScript interface.
 */
export interface ModelChip {
  /** Human-readable chip name (matches ChipConfig.name) */
  readonly name: string;
  /** Backend type identifier */
  readonly type: 'openai-compatible' | 'anthropic';

  /**
   * Send a chat completion request.
   *
   * @param messages - Conversation history to send
   * @param options - Optional per-request overrides (model, temperature, maxTokens)
   * @returns Parsed chat response with content, model, and usage
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Check if the chip endpoint is healthy and measure latency.
   *
   * @returns Health status with availability, latency, and timestamp
   */
  health(): Promise<ChipHealth>;

  /**
   * Query the chip's static capabilities.
   *
   * @returns Available models, context length, and feature support flags
   */
  capabilities(): Promise<ChipCapabilities>;
}
