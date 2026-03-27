/**
 * LLM MCP Wrapper -- exposes local model access as four MCP tools.
 *
 * Tools:
 *   llm.chat         -- send messages to a named chip, receive chat response
 *   llm.health       -- check availability and latency for one or all chips
 *   llm.capabilities -- query models, context length, and feature flags
 *   llm.models       -- list all chip names with their available model IDs
 *
 * Design:
 *   - Connection pool: single ChipRegistry instance shared across all requests
 *   - Request queue: per-chip Map<string, Promise<void>> chain serializes
 *     concurrent requests to the same chip (protects local hardware)
 *   - Parallel chips: requests to different chips are not blocked by each other
 *   - Timeout: AbortController + Promise.race enforces requestTimeoutMs limit
 *   - Error handling: MCP-compatible error responses (never throw to MCP caller)
 *
 * CRITICAL: Never use console.log (stdout is MCP protocol on stdio transport).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChipRegistry } from '../chips/chip-registry.js';
import type { ChatMessage, ChatOptions } from '../chips/types.js';
import {
  LlmChatRequestSchema,
  LlmToolRequestSchema,
  QueueConfigSchema,
  LLM_WRAPPER_VERSION,
  DEFAULT_MAX_CONCURRENT_PER_CHIP,
  DEFAULT_REQUEST_TIMEOUT_MS,
} from './llm-types.js';
import type { LlmChatRequest, LlmToolRequest, QueueConfig } from './llm-types.js';

// ============================================================================
// MCP response types
// ============================================================================

type McpTextContent = { type: 'text'; text: string };
type McpToolResponse = {
  content: McpTextContent[];
  isError?: boolean;
};

function textResponse(data: unknown): McpToolResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
  };
}

function errorResponse(message: string): McpToolResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

// ============================================================================
// LlmMcpWrapper
// ============================================================================

/**
 * Wraps ChipRegistry as four MCP-compatible tool handlers.
 *
 * The wrapper manages:
 * 1. Connection pool: `registry` is the single shared instance (no re-creation)
 * 2. Request queue: `chipQueues` Map chains promises per chip for serial execution
 * 3. Timeout: `requestTimeoutMs` from QueueConfig, enforced via Promise.race
 */
export class LlmMcpWrapper {
  private readonly registry: ChipRegistry;
  private readonly config: QueueConfig;
  /**
   * Per-chip request queue.
   *
   * Maps chipName -> last enqueued promise. Each new request awaits the
   * previous promise for the same chip, ensuring FIFO serial execution.
   * Requests to different chips are independent.
   */
  private readonly chipQueues: Map<string, Promise<void>>;

  constructor(registry: ChipRegistry, config?: Partial<QueueConfig>) {
    this.registry = registry;
    // Apply defaults via schema parse
    this.config = QueueConfigSchema.parse(config ?? {});
    this.chipQueues = new Map();
  }

  // --------------------------------------------------------------------------
  // handleChat
  // --------------------------------------------------------------------------

  /**
   * Handle llm.chat tool invocation.
   *
   * Resolves chip from registry, enqueues the request (per-chip serialization),
   * calls chip.chat(), and returns the response as JSON-serialized text.
   *
   * Unknown chip or timeout produce isError:true responses.
   */
  async handleChat(request: LlmChatRequest): Promise<McpToolResponse> {
    const chip = this.registry.get(request.chipName);
    if (!chip) {
      return errorResponse(`Chip not found: ${request.chipName}`);
    }

    const { messages, options } = request;

    // Enqueue: await previous request for this chip, then run ours
    const previous = this.chipQueues.get(request.chipName) ?? Promise.resolve();

    let resolveCurrent!: () => void;
    const current = new Promise<void>((res) => { resolveCurrent = res; });

    // The queue chain: wait for previous, execute, then release
    const queued = previous.then(async () => {
      try {
        await this.executeWithTimeout(async (signal) => {
          const chatArgs: [ChatMessage[], ChatOptions | undefined] = [messages, options];
          const response = await Promise.race([
            chip.chat(...chatArgs),
            new Promise<never>((_, reject) =>
              signal.addEventListener('abort', () => reject(new Error('Request timeout')))
            ),
          ]);
          // Store result for extraction below
          (queued as QueuedPromise)._result = { ok: true, value: response };
        });
      } catch (err) {
        (queued as QueuedPromise)._result = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        resolveCurrent();
      }
    });

    // Register this request as the new tail of the queue
    this.chipQueues.set(request.chipName, current);

    // Wait for our slot to complete
    await queued;

    const queuedResult = (queued as QueuedPromise)._result;
    if (!queuedResult) {
      return errorResponse('Internal queue error');
    }
    if (!queuedResult.ok) {
      const isTimeout = queuedResult.error.includes('timeout') ||
                        queuedResult.error.includes('Timeout');
      return errorResponse(
        isTimeout
          ? `Request timeout after ${this.config.requestTimeoutMs}ms`
          : queuedResult.error,
      );
    }

    return textResponse(queuedResult.value);
  }

  // --------------------------------------------------------------------------
  // handleHealth
  // --------------------------------------------------------------------------

  /**
   * Handle llm.health tool invocation.
   *
   * Without chipName: delegates to registry.healthCheck() for all chips.
   * With chipName: calls chip.health() directly for a single chip.
   */
  async handleHealth(request: LlmToolRequest): Promise<McpToolResponse> {
    if (request.chipName === undefined) {
      const result = await this.registry.healthCheck();
      return textResponse(result);
    }

    const chip = this.registry.get(request.chipName);
    if (!chip) {
      return errorResponse(`Chip not found: ${request.chipName}`);
    }

    try {
      const health = await chip.health();
      return textResponse(health);
    } catch (err) {
      return errorResponse(
        `Health check failed for ${request.chipName}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // --------------------------------------------------------------------------
  // handleCapabilities
  // --------------------------------------------------------------------------

  /**
   * Handle llm.capabilities tool invocation.
   *
   * Without chipName: delegates to registry.capabilitiesReport() for all chips.
   * With chipName: calls chip.capabilities() directly for a single chip.
   */
  async handleCapabilities(request: LlmToolRequest): Promise<McpToolResponse> {
    if (request.chipName === undefined) {
      const result = await this.registry.capabilitiesReport();
      return textResponse(result);
    }

    const chip = this.registry.get(request.chipName);
    if (!chip) {
      return errorResponse(`Chip not found: ${request.chipName}`);
    }

    try {
      const capabilities = await chip.capabilities();
      return textResponse(capabilities);
    } catch (err) {
      return errorResponse(
        `Capabilities query failed for ${request.chipName}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // --------------------------------------------------------------------------
  // handleModels
  // --------------------------------------------------------------------------

  /**
   * Handle llm.models tool invocation.
   *
   * Returns an array of { chipName, models } tuples, one per registered chip.
   * Uses Promise.allSettled so one failing chip doesn't block the rest.
   */
  async handleModels(): Promise<McpToolResponse> {
    const names = this.registry.list();

    const results = await Promise.allSettled(
      names.map(async (chipName) => {
        const chip = this.registry.get(chipName);
        if (!chip) {
          return { chipName, models: [] as string[] };
        }
        const caps = await chip.capabilities();
        return { chipName, models: caps.models };
      }),
    );

    const output = results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return { chipName: names[i] ?? 'unknown', models: [] as string[] };
    });

    return textResponse(output);
  }

  // --------------------------------------------------------------------------
  // Private: timeout helper
  // --------------------------------------------------------------------------

  /**
   * Execute an async callback with an AbortController timeout.
   *
   * Passes a signal to the callback; aborts after requestTimeoutMs.
   * The callback is responsible for racing against the signal.
   */
  private async executeWithTimeout(
    fn: (signal: AbortSignal) => Promise<void>,
  ): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.config.requestTimeoutMs);

    try {
      await fn(controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }
}

// ============================================================================
// Internal: QueuedPromise
// ============================================================================

// Extends Promise with a _result slot used by the queue mechanism
// to pass results back to the awaiting code without creating closures
// that would capture the whole response in the queue chain.
type QueuedResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

interface QueuedPromise extends Promise<void> {
  _result?: QueuedResult;
}

// ============================================================================
// createLlmMcpServer
// ============================================================================

/**
 * Create an McpServer with all 4 LLM wrapper tools registered.
 *
 * Tools:
 *   llm.chat         -- chipName, messages, options?
 *   llm.health       -- chipName?
 *   llm.capabilities -- chipName?
 *   llm.models       -- (no input)
 *
 * @param registry - ChipRegistry instance (connection pool -- shared across all tool calls)
 * @param config   - Optional queue configuration (maxConcurrentPerChip, requestTimeoutMs)
 * @returns Configured McpServer instance ready to connect to a transport
 */
export function createLlmMcpServer(
  registry: ChipRegistry,
  config?: Partial<QueueConfig>,
): McpServer {
  const wrapper = new LlmMcpWrapper(registry, config);

  const server = new McpServer({
    name: 'llm-wrapper',
    version: String(LLM_WRAPPER_VERSION),
  });

  // ── llm.chat ──────────────────────────────────────────────────────────────
  server.tool(
    'llm.chat',
    'Send a chat request to a named local model chip and receive a response',
    {
      chipName: z.string().min(1).describe('Name of the chip to use'),
      messages: z.array(
        z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        }),
      ).min(1).describe('Conversation messages'),
      options: z.object({
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
      }).optional().describe('Optional per-request overrides'),
    },
    async (args) => {
      return wrapper.handleChat(args);
    },
  );

  // ── llm.health ────────────────────────────────────────────────────────────
  server.tool(
    'llm.health',
    'Check availability and latency for one or all configured chips',
    {
      chipName: z.string().min(1).optional().describe('Chip name to check; omit for all chips'),
    },
    async (args) => {
      return wrapper.handleHealth(args);
    },
  );

  // ── llm.capabilities ──────────────────────────────────────────────────────
  server.tool(
    'llm.capabilities',
    'Query models, context length, and feature flags for one or all chips',
    {
      chipName: z.string().min(1).optional().describe('Chip name to query; omit for all chips'),
    },
    async (args) => {
      return wrapper.handleCapabilities(args);
    },
  );

  // ── llm.models ────────────────────────────────────────────────────────────
  server.tool(
    'llm.models',
    'List all registered chip names with their available model identifiers',
    {},
    async () => {
      return wrapper.handleModels();
    },
  );

  return server;
}

// Re-export constants for consumers
export {
  DEFAULT_MAX_CONCURRENT_PER_CHIP,
  DEFAULT_REQUEST_TIMEOUT_MS,
  LLM_WRAPPER_VERSION,
};
