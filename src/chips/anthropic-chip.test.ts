/**
 * Tests for AnthropicChip.
 *
 * All HTTP calls are mocked via vi.fn() -- no real network calls.
 * Tests verify: message format conversion, system message extraction,
 * health checks, capabilities, and API key handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnthropicChip } from './anthropic-chip.js';
import type { ChipConfig } from './types.js';

// ============================================================================
// Mock fetch globally
// ============================================================================

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  // Ensure env var is not set unless test sets it
  delete process.env['ANTHROPIC_API_KEY'];
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env['ANTHROPIC_API_KEY'];
});

// ============================================================================
// Helpers
// ============================================================================

const baseConfig: ChipConfig = {
  name: 'claude-chip',
  type: 'anthropic',
  apiKey: 'sk-ant-test-key-12345',
  defaultModel: 'claude-sonnet-4-20250514',
};

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function makeAnthropicResponse(text: string, model = 'claude-sonnet-4-20250514') {
  return {
    id: 'msg-123',
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text }],
    usage: { input_tokens: 15, output_tokens: 8 },
    stop_reason: 'end_turn',
  };
}

// ============================================================================
// Constructor
// ============================================================================

describe('AnthropicChip constructor', () => {
  it('stores name and type from config', () => {
    const chip = new AnthropicChip(baseConfig);
    expect(chip.name).toBe('claude-chip');
    expect(chip.type).toBe('anthropic');
  });

  it('uses ANTHROPIC_API_KEY env var when no apiKey in config', () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-env-key-999';
    const chip = new AnthropicChip({
      name: 'claude-chip',
      type: 'anthropic',
      defaultModel: 'claude-haiku-3-20250303',
    });
    expect(chip.name).toBe('claude-chip');
    // No throw = key resolved from env
  });

  it('throws if type is not anthropic', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new AnthropicChip({ name: 'bad', type: 'openai-compatible', baseUrl: 'http://localhost:11434', defaultModel: 'gpt-4' } as any);
    }).toThrow();
  });
});

// ============================================================================
// chat() -- message format conversion
// ============================================================================

describe('AnthropicChip.chat()', () => {
  it('sends POST to api.anthropic.com with correct headers', async () => {
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse(makeAnthropicResponse('Hello!')),
    );

    const chip = new AnthropicChip(baseConfig);
    await chip.chat([{ role: 'user', content: 'Hi' }]);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-test-key-12345');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['content-type']).toBe('application/json');
  });

  it('extracts system message into top-level system field', async () => {
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse(makeAnthropicResponse('Understood.')),
    );

    const chip = new AnthropicChip(baseConfig);
    await chip.chat([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2+2?' },
    ]);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.system).toBe('You are a helpful assistant.');
    expect(body.messages).toEqual([{ role: 'user', content: 'What is 2+2?' }]);
  });

  it('sends messages without system field when no system message', async () => {
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse(makeAnthropicResponse('Fine.')),
    );

    const chip = new AnthropicChip(baseConfig);
    await chip.chat([{ role: 'user', content: 'Hello' }]);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.system).toBeUndefined();
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('parses response content from content[0].text', async () => {
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse(makeAnthropicResponse('My response here.', 'claude-sonnet-4-20250514')),
    );

    const chip = new AnthropicChip(baseConfig);
    const response = await chip.chat([{ role: 'user', content: 'Tell me something.' }]);

    expect(response.content).toBe('My response here.');
    expect(response.model).toBe('claude-sonnet-4-20250514');
    expect(response.usage.promptTokens).toBe(15);
    expect(response.usage.completionTokens).toBe(8);
  });

  it('uses model override from ChatOptions', async () => {
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse(makeAnthropicResponse('Fast response.', 'claude-haiku-3-20250303')),
    );

    const chip = new AnthropicChip(baseConfig);
    await chip.chat(
      [{ role: 'user', content: 'Quick question' }],
      { model: 'claude-haiku-3-20250303', temperature: 0.5, maxTokens: 512 },
    );

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('claude-haiku-3-20250303');
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(512);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse({ error: { type: 'authentication_error', message: 'Invalid key' } }, 401),
    );

    const chip = new AnthropicChip(baseConfig);
    await expect(chip.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow();
  });
});

// ============================================================================
// health()
// ============================================================================

describe('AnthropicChip.health()', () => {
  it('returns available=true on 200 or 400 response (key is valid)', async () => {
    // 200 = auth success
    mockFetch.mockResolvedValueOnce(makeJsonResponse(makeAnthropicResponse('ok'), 200));

    const chip = new AnthropicChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(true);
    expect(typeof health.latencyMs).toBe('number');
    expect(health.lastChecked).toMatch(/^\d{4}-/);
  });

  it('returns available=true on 400 response (key valid, bad payload)', async () => {
    // 400 = bad request but key auth succeeded
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ error: 'bad_request' }, 400));

    const chip = new AnthropicChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(true);
  });

  it('returns available=false on 401 (invalid key)', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ error: 'authentication_error' }, 401));

    const chip = new AnthropicChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(false);
    expect(health.latencyMs).toBeNull();
  });

  it('returns available=false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('DNS error'));

    const chip = new AnthropicChip(baseConfig);
    const health = await chip.health();

    expect(health.available).toBe(false);
    expect(health.latencyMs).toBeNull();
  });
});

// ============================================================================
// capabilities()
// ============================================================================

describe('AnthropicChip.capabilities()', () => {
  it('returns hardcoded Claude model list', async () => {
    const chip = new AnthropicChip(baseConfig);
    const caps = await chip.capabilities();

    expect(caps.models.length).toBeGreaterThan(0);
    expect(caps.models).toContain('claude-sonnet-4-20250514');
    expect(caps.maxContextLength).toBeGreaterThan(0);
  });

  it('does not make any HTTP calls', async () => {
    const chip = new AnthropicChip(baseConfig);
    await chip.capabilities();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns context length for known models', async () => {
    const chip = new AnthropicChip(baseConfig);
    const caps = await chip.capabilities();

    // Known Claude models have 200K context
    expect(caps.maxContextLength).toBeGreaterThanOrEqual(200000);
  });
});
