/**
 * Tests for ModelChip type system Zod schema validation.
 *
 * Validates that all schemas accept valid inputs and reject invalid inputs
 * with descriptive errors. No network calls -- purely structural/schema tests.
 */

import { describe, it, expect } from 'vitest';
import {
  ChatMessageSchema,
  ChatResponseSchema,
  ChipCapabilitiesSchema,
  ChipHealthSchema,
  ChipConfigSchema,
  ChatOptionsSchema,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from './types.js';

// ============================================================================
// ChatMessage
// ============================================================================

describe('ChatMessageSchema', () => {
  it('accepts valid user message', () => {
    const result = ChatMessageSchema.safeParse({ role: 'user', content: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('accepts system message', () => {
    const result = ChatMessageSchema.safeParse({ role: 'system', content: 'You are helpful.' });
    expect(result.success).toBe(true);
  });

  it('accepts assistant message', () => {
    const result = ChatMessageSchema.safeParse({ role: 'assistant', content: 'Sure!' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = ChatMessageSchema.safeParse({ role: 'function', content: 'data' });
    expect(result.success).toBe(false);
  });

  it('rejects missing content', () => {
    const result = ChatMessageSchema.safeParse({ role: 'user' });
    expect(result.success).toBe(false);
  });

  it('rejects missing role', () => {
    const result = ChatMessageSchema.safeParse({ content: 'Hello' });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ChatResponse
// ============================================================================

describe('ChatResponseSchema', () => {
  it('accepts valid response', () => {
    const result = ChatResponseSchema.safeParse({
      content: 'Hello world',
      model: 'gpt-4',
      usage: { promptTokens: 10, completionTokens: 5 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing content', () => {
    const result = ChatResponseSchema.safeParse({
      model: 'gpt-4',
      usage: { promptTokens: 10, completionTokens: 5 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing model', () => {
    const result = ChatResponseSchema.safeParse({
      content: 'Hello',
      usage: { promptTokens: 10, completionTokens: 5 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing usage', () => {
    const result = ChatResponseSchema.safeParse({
      content: 'Hello',
      model: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid usage shape', () => {
    const result = ChatResponseSchema.safeParse({
      content: 'Hello',
      model: 'gpt-4',
      usage: { tokens: 10 },
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ChipCapabilities
// ============================================================================

describe('ChipCapabilitiesSchema', () => {
  it('accepts valid capabilities', () => {
    const result = ChipCapabilitiesSchema.safeParse({
      models: ['gpt-4', 'gpt-3.5-turbo'],
      maxContextLength: 8192,
      supportsStreaming: true,
      supportsTools: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty models list', () => {
    const result = ChipCapabilitiesSchema.safeParse({
      models: [],
      maxContextLength: 4096,
      supportsStreaming: false,
      supportsTools: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing models', () => {
    const result = ChipCapabilitiesSchema.safeParse({
      maxContextLength: 4096,
      supportsStreaming: false,
      supportsTools: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-number maxContextLength', () => {
    const result = ChipCapabilitiesSchema.safeParse({
      models: [],
      maxContextLength: 'large',
      supportsStreaming: false,
      supportsTools: false,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ChipHealth
// ============================================================================

describe('ChipHealthSchema', () => {
  it('accepts healthy chip', () => {
    const result = ChipHealthSchema.safeParse({
      available: true,
      latencyMs: 120,
      lastChecked: '2026-03-03T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts unavailable chip with null latency', () => {
    const result = ChipHealthSchema.safeParse({
      available: false,
      latencyMs: null,
      lastChecked: '2026-03-03T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing available', () => {
    const result = ChipHealthSchema.safeParse({
      latencyMs: null,
      lastChecked: '2026-03-03T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing lastChecked', () => {
    const result = ChipHealthSchema.safeParse({
      available: true,
      latencyMs: 10,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ChipConfig - discriminated union on type
// ============================================================================

describe('ChipConfigSchema', () => {
  it('accepts valid openai-compatible config with baseUrl', () => {
    const result = ChipConfigSchema.safeParse({
      name: 'local-ollama',
      type: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid anthropic config', () => {
    const result = ChipConfigSchema.safeParse({
      name: 'claude',
      type: 'anthropic',
      defaultModel: 'claude-sonnet-4-20250514',
    });
    expect(result.success).toBe(true);
  });

  it('accepts anthropic config with optional apiKey', () => {
    const result = ChipConfigSchema.safeParse({
      name: 'claude',
      type: 'anthropic',
      apiKey: 'sk-ant-test123',
      defaultModel: 'claude-sonnet-4-20250514',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown type', () => {
    const result = ChipConfigSchema.safeParse({
      name: 'some-chip',
      type: 'gemini',
      defaultModel: 'gemini-pro',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = ChipConfigSchema.safeParse({
      type: 'anthropic',
      defaultModel: 'claude-sonnet-4-20250514',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing defaultModel', () => {
    const result = ChipConfigSchema.safeParse({
      name: 'my-chip',
      type: 'anthropic',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = ChipConfigSchema.safeParse({
      name: 'my-chip',
      defaultModel: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ChatOptions
// ============================================================================

describe('ChatOptionsSchema', () => {
  it('accepts empty options', () => {
    const result = ChatOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full options', () => {
    const result = ChatOptionsSchema.safeParse({
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative temperature', () => {
    const result = ChatOptionsSchema.safeParse({ temperature: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects temperature above 2', () => {
    const result = ChatOptionsSchema.safeParse({ temperature: 2.1 });
    expect(result.success).toBe(false);
  });

  it('rejects zero maxTokens', () => {
    const result = ChatOptionsSchema.safeParse({ maxTokens: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative maxTokens', () => {
    const result = ChatOptionsSchema.safeParse({ maxTokens: -100 });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
  it('DEFAULT_TIMEOUT_MS is 30000', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30000);
  });

  it('DEFAULT_MAX_TOKENS is 4096', () => {
    expect(DEFAULT_MAX_TOKENS).toBe(4096);
  });

  it('DEFAULT_TEMPERATURE is 0.0', () => {
    expect(DEFAULT_TEMPERATURE).toBe(0.0);
  });
});
