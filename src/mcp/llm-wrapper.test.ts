/**
 * Tests for LlmMcpWrapper -- 4 MCP tools, connection pooling, request queuing.
 *
 * Tests:
 * - All 4 tool handlers: handleChat, handleHealth, handleCapabilities, handleModels
 * - Connection pool: ChipRegistry reused across requests (no re-instantiation)
 * - Request queue: concurrent requests to same chip execute serially
 * - Request queue: concurrent requests to different chips execute in parallel
 * - Error handling: unknown chip returns MCP error response
 * - Error handling: timeout triggers abort error response
 * - createLlmMcpServer: returns McpServer with all 4 tools registered
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmMcpWrapper, createLlmMcpServer } from './llm-wrapper.js';
import type { ChipRegistry } from '../chips/chip-registry.js';
import type { ModelChip } from '../chips/types.js';
import type { ChatResponse, ChipHealth, ChipCapabilities } from '../chips/types.js';

// ============================================================================
// Mock helpers
// ============================================================================

function makeMockChip(name: string, delayMs = 0): ModelChip {
  return {
    name,
    type: 'openai-compatible',
    chat: vi.fn().mockImplementation(async () => {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return {
        content: `Response from ${name}`,
        model: 'test-model',
        usage: { promptTokens: 10, completionTokens: 20 },
      } satisfies ChatResponse;
    }),
    health: vi.fn().mockResolvedValue({
      available: true,
      latencyMs: 42,
      lastChecked: '2026-03-03T00:00:00.000Z',
    } satisfies ChipHealth),
    capabilities: vi.fn().mockResolvedValue({
      models: ['model-a', 'model-b'],
      maxContextLength: 8192,
      supportsStreaming: false,
      supportsTools: false,
    } satisfies ChipCapabilities),
  };
}

function makeMockRegistry(chips: ModelChip[]): ChipRegistry {
  const chipMap = new Map(chips.map((c) => [c.name, c]));

  const healthCheckResult: Record<string, ChipHealth> = {};
  const capabilitiesResult: Record<string, ChipCapabilities> = {};
  for (const chip of chips) {
    healthCheckResult[chip.name] = {
      available: true,
      latencyMs: 42,
      lastChecked: '2026-03-03T00:00:00.000Z',
    };
    capabilitiesResult[chip.name] = {
      models: ['model-a'],
      maxContextLength: 8192,
      supportsStreaming: false,
      supportsTools: false,
    };
  }

  return {
    get: vi.fn().mockImplementation((name: string) => chipMap.get(name)),
    getByRole: vi.fn().mockReturnValue(chips[0]),
    list: vi.fn().mockReturnValue(chips.map((c) => c.name)),
    isConfigured: vi.fn().mockReturnValue(true),
    register: vi.fn(),
    loadFromFile: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(healthCheckResult),
    capabilitiesReport: vi.fn().mockResolvedValue(capabilitiesResult),
  } as unknown as ChipRegistry;
}

// ============================================================================
// handleChat
// ============================================================================

describe('LlmMcpWrapper.handleChat', () => {
  it('returns chat response for known chip', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleChat({
      chipName: 'ollama',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0]?.type).toBe('text');
    const parsed = JSON.parse((result.content[0] as { type: string; text: string }).text);
    expect(parsed.content).toBe('Response from ollama');
    expect(parsed.model).toBe('test-model');
  });

  it('passes options to chip.chat', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    await wrapper.handleChat({
      chipName: 'ollama',
      messages: [{ role: 'user', content: 'Hi' }],
      options: { model: 'llama3', temperature: 0.7 },
    });

    expect(chip.chat).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hi' }],
      { model: 'llama3', temperature: 0.7 },
    );
  });

  it('returns MCP error for unknown chip', async () => {
    const registry = makeMockRegistry([]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleChat({
      chipName: 'nonexistent',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.error).toContain('nonexistent');
  });

  it('returns MCP error on timeout', async () => {
    // Chip takes 200ms but timeout is 50ms
    const chip = makeMockChip('slow-chip', 200);
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry, { maxConcurrentPerChip: 1, requestTimeoutMs: 50 });

    const result = await wrapper.handleChat({
      chipName: 'slow-chip',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.error).toContain('timeout');
  });
});

// ============================================================================
// handleHealth
// ============================================================================

describe('LlmMcpWrapper.handleHealth', () => {
  it('returns health for all chips when no chipName provided', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleHealth({});

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.ollama).toBeDefined();
    expect(parsed.ollama.available).toBe(true);
    expect(registry.healthCheck).toHaveBeenCalled();
  });

  it('returns health for specific chip when chipName provided', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleHealth({ chipName: 'ollama' });

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.available).toBe(true);
    expect(parsed.latencyMs).toBe(42);
    expect(chip.health).toHaveBeenCalled();
  });

  it('returns MCP error for unknown chip in health', async () => {
    const registry = makeMockRegistry([]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleHealth({ chipName: 'ghost' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.error).toContain('ghost');
  });
});

// ============================================================================
// handleCapabilities
// ============================================================================

describe('LlmMcpWrapper.handleCapabilities', () => {
  it('returns capabilities for all chips when no chipName provided', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleCapabilities({});

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.ollama).toBeDefined();
    expect(registry.capabilitiesReport).toHaveBeenCalled();
  });

  it('returns capabilities for specific chip when chipName provided', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleCapabilities({ chipName: 'ollama' });

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.models).toContain('model-a');
    expect(chip.capabilities).toHaveBeenCalled();
  });

  it('returns MCP error for unknown chip in capabilities', async () => {
    const registry = makeMockRegistry([]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleCapabilities({ chipName: 'ghost' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.error).toContain('ghost');
  });
});

// ============================================================================
// handleModels
// ============================================================================

describe('LlmMcpWrapper.handleModels', () => {
  it('returns list of chip names with their models', async () => {
    const chip1 = makeMockChip('ollama');
    const chip2 = makeMockChip('local-llm');
    const registry = makeMockRegistry([chip1, chip2]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleModels();

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed: Array<{ chipName: string; models: string[] }> = JSON.parse(text);
    expect(parsed).toHaveLength(2);
    const chipNames = parsed.map((p) => p.chipName);
    expect(chipNames).toContain('ollama');
    expect(chipNames).toContain('local-llm');
  });

  it('returns empty array when no chips registered', async () => {
    const registry = makeMockRegistry([]);
    const wrapper = new LlmMcpWrapper(registry);

    const result = await wrapper.handleModels();

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed).toHaveLength(0);
  });
});

// ============================================================================
// Connection pooling
// ============================================================================

describe('Connection pool', () => {
  it('reuses the same ChipRegistry instance across multiple requests', async () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    // Multiple calls
    await wrapper.handleChat({ chipName: 'ollama', messages: [{ role: 'user', content: 'A' }] });
    await wrapper.handleChat({ chipName: 'ollama', messages: [{ role: 'user', content: 'B' }] });
    await wrapper.handleHealth({});

    // registry.get should have been called (not a new registry created)
    expect(registry.get).toHaveBeenCalledTimes(2);
    expect(registry.healthCheck).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Request queue -- serialization per chip
// ============================================================================

describe('Request queue serialization', () => {
  it('serializes concurrent requests to the same chip', async () => {
    const callOrder: string[] = [];

    let resolveFirst!: () => void;
    const firstStarted = new Promise<void>((res) => { resolveFirst = res; });

    const chip = makeMockChip('ollama');
    (chip.chat as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(async () => {
        resolveFirst();
        callOrder.push('first-start');
        await new Promise((res) => setTimeout(res, 30));
        callOrder.push('first-end');
        return { content: 'first', model: 'test', usage: { promptTokens: 1, completionTokens: 1 } };
      })
      .mockImplementationOnce(async () => {
        callOrder.push('second-start');
        callOrder.push('second-end');
        return { content: 'second', model: 'test', usage: { promptTokens: 1, completionTokens: 1 } };
      });

    const registry = makeMockRegistry([chip]);
    const wrapper = new LlmMcpWrapper(registry);

    // Fire both concurrently
    const [r1, r2] = await Promise.all([
      wrapper.handleChat({ chipName: 'ollama', messages: [{ role: 'user', content: 'A' }] }),
      // Wait for first to start before firing second
      firstStarted.then(() =>
        wrapper.handleChat({ chipName: 'ollama', messages: [{ role: 'user', content: 'B' }] }),
      ),
    ]);

    expect(r1.isError).toBeFalsy();
    expect(r2.isError).toBeFalsy();

    // Second must start only after first ends
    const firstEndIdx = callOrder.indexOf('first-end');
    const secondStartIdx = callOrder.indexOf('second-start');
    expect(secondStartIdx).toBeGreaterThan(firstEndIdx);
  });

  it('executes concurrent requests to different chips in parallel', async () => {
    const callOrder: string[] = [];

    const chipA = {
      ...makeMockChip('chip-a'),
      chat: vi.fn().mockImplementation(async () => {
        callOrder.push('a-start');
        await new Promise((res) => setTimeout(res, 30));
        callOrder.push('a-end');
        return { content: 'A', model: 'test', usage: { promptTokens: 1, completionTokens: 1 } };
      }),
    };
    const chipB = {
      ...makeMockChip('chip-b'),
      chat: vi.fn().mockImplementation(async () => {
        callOrder.push('b-start');
        await new Promise((res) => setTimeout(res, 30));
        callOrder.push('b-end');
        return { content: 'B', model: 'test', usage: { promptTokens: 1, completionTokens: 1 } };
      }),
    };

    const registry = makeMockRegistry([chipA, chipB]);
    const wrapper = new LlmMcpWrapper(registry);

    await Promise.all([
      wrapper.handleChat({ chipName: 'chip-a', messages: [{ role: 'user', content: 'A' }] }),
      wrapper.handleChat({ chipName: 'chip-b', messages: [{ role: 'user', content: 'B' }] }),
    ]);

    // Both should have started before either ended (parallel execution)
    const aStartIdx = callOrder.indexOf('a-start');
    const bStartIdx = callOrder.indexOf('b-start');
    const aEndIdx = callOrder.indexOf('a-end');
    const bEndIdx = callOrder.indexOf('b-end');

    // Both start before either ends (true parallel)
    const firstEnd = Math.min(aEndIdx, bEndIdx);
    expect(aStartIdx).toBeLessThan(firstEnd);
    expect(bStartIdx).toBeLessThan(firstEnd);
  });
});

// ============================================================================
// createLlmMcpServer
// ============================================================================

describe('createLlmMcpServer', () => {
  it('creates an McpServer instance', () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const server = createLlmMcpServer(registry);

    // McpServer has a server property and connect method
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });

  it('creates server with custom queue config', () => {
    const chip = makeMockChip('ollama');
    const registry = makeMockRegistry([chip]);
    const server = createLlmMcpServer(registry, { maxConcurrentPerChip: 2, requestTimeoutMs: 5000 });

    expect(server).toBeDefined();
  });
});
