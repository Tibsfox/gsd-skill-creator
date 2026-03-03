/**
 * Tests for LLM wrapper type schemas and constants.
 *
 * Verifies Zod schema validation for LlmChatRequestSchema,
 * LlmToolRequestSchema, and QueueConfigSchema. Also asserts
 * that exported constants match the IMP-03 specification.
 */

import { describe, it, expect } from 'vitest';
import {
  LlmChatRequestSchema,
  LlmToolRequestSchema,
  QueueConfigSchema,
  DEFAULT_MAX_CONCURRENT_PER_CHIP,
  DEFAULT_REQUEST_TIMEOUT_MS,
  LLM_WRAPPER_VERSION,
} from './llm-types.js';

// ============================================================================
// Constants
// ============================================================================

describe('IMP-03 constants', () => {
  it('DEFAULT_MAX_CONCURRENT_PER_CHIP is 1', () => {
    expect(DEFAULT_MAX_CONCURRENT_PER_CHIP).toBe(1);
  });

  it('DEFAULT_REQUEST_TIMEOUT_MS is 60000', () => {
    expect(DEFAULT_REQUEST_TIMEOUT_MS).toBe(60000);
  });

  it('LLM_WRAPPER_VERSION is 1', () => {
    expect(LLM_WRAPPER_VERSION).toBe(1);
  });
});

// ============================================================================
// LlmChatRequestSchema
// ============================================================================

describe('LlmChatRequestSchema', () => {
  it('accepts valid request with required fields', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid request with options', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ],
      options: { model: 'llama3', temperature: 0.5, maxTokens: 512 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options?.model).toBe('llama3');
    }
  });

  it('rejects empty chipName', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: '',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing chipName', () => {
    const result = LlmChatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty messages array', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects messages with invalid role', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
      messages: [{ role: 'bot', content: 'Hello' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing messages', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
    });
    expect(result.success).toBe(false);
  });

  it('options is optional -- omitting it succeeds', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'my-chip',
      messages: [{ role: 'user', content: 'test' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options).toBeUndefined();
    }
  });

  it('rejects options with negative temperature', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
      messages: [{ role: 'user', content: 'Hello' }],
      options: { temperature: -0.1 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects options with maxTokens of 0', () => {
    const result = LlmChatRequestSchema.safeParse({
      chipName: 'ollama',
      messages: [{ role: 'user', content: 'Hello' }],
      options: { maxTokens: 0 },
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// LlmToolRequestSchema
// ============================================================================

describe('LlmToolRequestSchema', () => {
  it('accepts object without chipName (optional field)', () => {
    const result = LlmToolRequestSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chipName).toBeUndefined();
    }
  });

  it('accepts object with valid chipName', () => {
    const result = LlmToolRequestSchema.safeParse({ chipName: 'my-chip' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chipName).toBe('my-chip');
    }
  });

  it('rejects empty string chipName', () => {
    const result = LlmToolRequestSchema.safeParse({ chipName: '' });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// QueueConfigSchema
// ============================================================================

describe('QueueConfigSchema', () => {
  it('applies defaults when called with empty object', () => {
    const result = QueueConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxConcurrentPerChip).toBe(1);
      expect(result.data.requestTimeoutMs).toBe(60000);
    }
  });

  it('accepts explicit values', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: 2,
      requestTimeoutMs: 30000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxConcurrentPerChip).toBe(2);
      expect(result.data.requestTimeoutMs).toBe(30000);
    }
  });

  it('rejects maxConcurrentPerChip of 0', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: 0,
      requestTimeoutMs: 60000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative maxConcurrentPerChip', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: -1,
      requestTimeoutMs: 60000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative requestTimeoutMs', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: 1,
      requestTimeoutMs: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects requestTimeoutMs of 0', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: 1,
      requestTimeoutMs: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer maxConcurrentPerChip', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: 1.5,
      requestTimeoutMs: 60000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer requestTimeoutMs', () => {
    const result = QueueConfigSchema.safeParse({
      maxConcurrentPerChip: 1,
      requestTimeoutMs: 1000.5,
    });
    expect(result.success).toBe(false);
  });
});
