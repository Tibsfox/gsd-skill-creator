/**
 * Generic Agent-Server Adapter.
 *
 * Converts an AgentServerConfig into a fully functional MCP server with:
 * - Concurrency limiting via semaphore
 * - Structured error handling (no process crashes)
 * - Per-invocation context isolation
 *
 * @module mcp/agent-bridge/agent-server-adapter
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type {
  AgentServerConfig,
  AgentToolDef,
  AgentResourceDef,
  InvocationContext,
} from './types.js';

// ============================================================================
// Concurrency Semaphore
// ============================================================================

/**
 * Simple counting semaphore for concurrency limiting.
 *
 * Tracks active invocations and rejects new ones when at capacity.
 * This is intentionally NOT a queue — rejected callers should retry,
 * matching MCP's request-response model.
 */
class ConcurrencySemaphore {
  private active = 0;
  private readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  /** Try to acquire a slot. Returns false if at capacity. */
  tryAcquire(): boolean {
    if (this.active >= this.max) {
      return false;
    }
    this.active++;
    return true;
  }

  /** Release a slot. */
  release(): void {
    if (this.active > 0) {
      this.active--;
    }
  }

  /** Current active count. */
  get count(): number {
    return this.active;
  }

  /** Maximum concurrency. */
  get limit(): number {
    return this.max;
  }
}

// ============================================================================
// Context Factory
// ============================================================================

/**
 * Create a fresh, isolated invocation context.
 *
 * Each invocation gets a unique ID and timestamp, ensuring no shared
 * mutable state between concurrent handlers.
 */
function createInvocationContext(agentId: string): InvocationContext {
  return {
    invocationId: randomUUID(),
    timestamp: Date.now(),
    agentId,
  };
}

// ============================================================================
// Agent Server Adapter
// ============================================================================

/** Default retry delay hint in milliseconds. */
const DEFAULT_RETRY_AFTER_MS = 1000;

/** MCP error code for agent at capacity. */
const AGENT_CAPACITY_ERROR_CODE = -32000;

/**
 * Convert a JSON Schema-style inputSchema into a Zod shape for the MCP SDK.
 *
 * The MCP SDK's `server.tool()` expects a `Record<string, z.ZodType>` where
 * each key corresponds to a parameter name. We extract property names from
 * the inputSchema and create permissive Zod types for each.
 *
 * Required properties use `z.unknown()`, optional ones use `z.unknown().optional()`.
 */
function inputSchemaToZodShape(
  inputSchema: Record<string, unknown>,
): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  const properties = (inputSchema.properties ?? {}) as Record<string, unknown>;
  const required = (inputSchema.required ?? []) as string[];

  for (const key of Object.keys(properties)) {
    if (required.includes(key)) {
      shape[key] = z.unknown();
    } else {
      shape[key] = z.unknown().optional();
    }
  }

  return shape;
}

/**
 * Create a fully functional MCP server from an agent configuration.
 *
 * The returned server has all tools and resources registered with:
 * - Concurrency limiting (rejects with -32000 when at capacity)
 * - Error handling (handler exceptions become structured MCP errors)
 * - Context isolation (fresh InvocationContext per call)
 *
 * @param config - Agent server configuration
 * @returns Configured McpServer instance ready for transport connection
 */
export function createAgentServer(config: AgentServerConfig): McpServer {
  const semaphore = new ConcurrencySemaphore(config.maxConcurrency);

  const server = new McpServer(
    { name: config.agentName, version: config.version },
  );

  // Register each tool with wrapped handler
  for (const tool of config.tools) {
    registerTool(server, tool, config.agentId, semaphore);
  }

  // Register each resource
  for (const resource of config.resources) {
    registerResource(server, resource);
  }

  return server;
}

/**
 * MCP SDK tool callback return type with index signature.
 */
interface McpToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Register a single tool on the MCP server with concurrency and error wrapping.
 */
function registerTool(
  server: McpServer,
  tool: AgentToolDef,
  agentId: string,
  semaphore: ConcurrencySemaphore,
): void {
  const zodShape = inputSchemaToZodShape(tool.inputSchema);

  server.tool(
    tool.name,
    tool.description,
    zodShape,
    async (args: Record<string, unknown>): Promise<McpToolResult> => {
      // Check concurrency limit
      if (!semaphore.tryAcquire()) {
        const msg =
          `Agent at capacity (${semaphore.count}/${semaphore.limit} concurrent invocations). ` +
          `Retry after ${DEFAULT_RETRY_AFTER_MS}ms.`;
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            code: AGENT_CAPACITY_ERROR_CODE,
            message: msg,
            data: { retryAfterMs: DEFAULT_RETRY_AFTER_MS },
          })}],
          isError: true,
        };
      }

      try {
        // Create isolated context for this invocation
        const context = createInvocationContext(agentId);

        // Execute handler with error catching
        const result = await tool.handler(args, context);
        return { ...result };
      } catch (err) {
        // Convert any handler error to structured MCP error
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            code: -32603,
            message: `Agent handler error: ${message}`,
          })}],
          isError: true,
        };
      } finally {
        semaphore.release();
      }
    },
  );
}

/**
 * Register a single resource on the MCP server.
 *
 * Uses the string URI overload of `server.resource()` for fixed-URI resources.
 * This ensures the resource appears in `listResources` results.
 */
function registerResource(
  server: McpServer,
  resource: AgentResourceDef,
): void {
  server.resource(
    resource.name,
    resource.uri,
    {
      description: resource.description,
      mimeType: resource.mimeType ?? 'application/json',
    },
    async () => {
      try {
        const content = await resource.reader();
        return {
          contents: [{
            uri: resource.uri,
            text: content,
            mimeType: resource.mimeType ?? 'application/json',
          }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          contents: [{
            uri: resource.uri,
            text: JSON.stringify({ error: message }),
            mimeType: 'application/json',
          }],
        };
      }
    },
  );
}
