/**
 * Barrel exports for the chips module.
 *
 * Re-exports all types, constants, the ModelChip interface,
 * and both chip implementations (OpenAI-compatible and Anthropic).
 *
 * Consumers import from 'src/chips/index.js' to access the full
 * chip abstraction layer without importing individual files.
 */

// Types, schemas, and constants
export {
  // Schemas
  ChatMessageSchema,
  ChatResponseSchema,
  ChipCapabilitiesSchema,
  ChipHealthSchema,
  ChipConfigSchema,
  ChatOptionsSchema,
  // Constants
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from './types.js';

// TypeScript types (type-only re-exports)
export type {
  ChatMessage,
  ChatResponse,
  ChipCapabilities,
  ChipHealth,
  ChipConfig,
  ChatOptions,
  ChipRole,
  ModelChip,
} from './types.js';

// Chip implementations
export { OpenAICompatibleChip } from './openai-compatible-chip.js';
export { AnthropicChip } from './anthropic-chip.js';
