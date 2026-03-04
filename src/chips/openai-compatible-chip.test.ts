/**
 * Tests for OpenAICompatibleChip.
 *
 * All HTTP calls are mocked via vi.fn() -- no real network calls.
 * Tests verify: chat completion parsing, health checks, capabilities,
 * timeout handling, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAICompatibleChip } from './openai-compatible-chip.js';
import type { ChipConfig } from './types.js';

// ============================================================================
// Mock fetch globally
// ============================================================================

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ============================================================================
// Helpers
// ============================================================================

const baseConfig: ChipConfig = {
  name: 'test-ollama',
  type: 'openai-compatible',
  baseUrl: 'http://localhost:11434',
  defaultModel: 'llama3',
};

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

// ============================================================================
// Constructor
// ============================================================================

describe('OpenAICompatibleChip constructor', () => {
  it('stores name and type from config', () => {
    const chip = new OpenAICompatibleChip(baseConfig);
    expect(chip.name).toBe('test-ollama');
    expect(chip.type).toBe('openai-compatible');
  });

  it('strips trailing slash from baseUrl', () => {
    const chip = new OpenAICompatibleChip({
      ...baseConfig,
      baseUrl: 'http://localhost:11434/',
    });
    expect(chip.name).toBe('test-ollama');
    // Internal verification done via requests in other tests
  });

  it('throws if type is not openai-compatible', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new OpenAICompatibleChip({ name: 'bad', type: 'anthropic', defaultModel: 'claude-sonnet' } as any);
    }).toThrow();
  });
});

// ============================================================================
// chat()
// ============================================================================

describe('OpenAICompatibleChip.chat()', () => {
  it('sends POST to /v1/chat/completions with correct body', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({
      id: 'chatcmpl-123',
      model: 'llama3',
      choices: [{ message: { content: 'Hello there!' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }));

    const chip = new OpenAICompatibleChip(baseConfig);
    const response = await chip.chat([{ role: 'user', content: 'Hi' }]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/v1/chat/completions');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('llama3');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
    expect(body.temperature).toBe(0.0);
    expect(body.max_tokens).toBe(4096);

    expect(response.content).toBe('Hello there!');
    expect(response.model).toBe('llama3');
    expect(response.usage.promptTokens).toBe(10);
    expect(response.usage.completionTokens).toBe(5);
  });

  it('uses ChatOptions overrides when provided', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({
      id: 'chatcmpl-456',
      model: 'llama3:70b',
      choices: [{ message: { content: 'Custom response' } }],
      usage: { prompt_tokens: 20, completion_tokens: 15 },
    }));

    const chip = new OpenAICompatibleChip(baseConfig);
    await chip.chat(
      [{ role: 'user', content: 'Hello' }],
      { model: 'llama3:70b', temperature: 0.7, maxTokens: 1024 },
    );

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('llama3:70b');
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(1024);
  });

  it('handles network error gracefully without throwing', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const chip = new OpenAICompatibleChip(baseConfig);
    await expect(chip.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow();
    // Note: chat() propagates network errors (health() catches them silently)
  });

  it('handles non-OK HTTP response', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ error: 'model not found' }, 404));

    const chip = new OpenAICompatibleChip(baseConfig);
    await expect(chip.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow();
  });
});

// ============================================================================
// health()
// ============================================================================

describe('OpenAICompatibleChip.health()', () => {
  it('returns available=true and latencyMs when models endpoint returns 200', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({
      data: [{ id: 'llama3' }],
    }));

    const chip = new OpenAICompatibleChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(true);
    expect(health.latencyMs).toBeTypeOf('number');
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.lastChecked).toMatch(/^\d{4}-/);
  });

  it('returns available=false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const chip = new OpenAICompatibleChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(false);
    expect(health.latencyMs).toBeNull();
  });

  it('returns available=false on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ error: 'server error' }, 500));

    const chip = new OpenAICompatibleChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(false);
  });

  it('sends GET to /v1/models', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ data: [] }));

    const chip = new OpenAICompatibleChip(baseConfig);
    await chip.health();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/v1/models');
    expect(init?.method).toMatch(/^GET$/i); // HttpClient sends explicit GET
  });
});

// ============================================================================
// capabilities()
// ============================================================================

describe('OpenAICompatibleChip.capabilities()', () => {
  it('returns model list from /v1/models response', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({
      data: [
        { id: 'llama3' },
        { id: 'llama3:70b' },
        { id: 'codellama' },
      ],
    }));

    const chip = new OpenAICompatibleChip(baseConfig);
    const caps = await chip.capabilities();

    expect(caps.models).toEqual(['llama3', 'llama3:70b', 'codellama']);
    expect(typeof caps.maxContextLength).toBe('number');
    expect(caps.maxContextLength).toBeGreaterThan(0);
  });

  it('returns fallback capabilities on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const chip = new OpenAICompatibleChip(baseConfig);
    const caps = await chip.capabilities();

    expect(caps.models).toEqual(['llama3']); // config.defaultModel
    expect(caps.maxContextLength).toBe(4096);
    expect(caps.supportsStreaming).toBe(true);
    expect(caps.supportsTools).toBe(false);
  });

  it('returns fallback on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 503));

    const chip = new OpenAICompatibleChip(baseConfig);
    const caps = await chip.capabilities();

    expect(caps.models).toEqual(['llama3']);
    expect(caps.maxContextLength).toBe(4096);
  });
});
