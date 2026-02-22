/**
 * Agent Bridge type definitions.
 *
 * Types for converting GSD agents into MCP servers (Agent-Server Adapter)
 * and giving agents MCP client capabilities (Agent-Client Adapter).
 *
 * @module mcp/agent-bridge/types
 */

// ============================================================================
// Invocation Context
// ============================================================================

/**
 * Per-invocation isolated context.
 *
 * A fresh context is created for each tool invocation, ensuring no shared
 * mutable state between concurrent calls on the same agent server.
 */
export interface InvocationContext {
  /** Unique identifier for this invocation */
  invocationId: string;
  /** Timestamp when the invocation started */
  timestamp: number;
  /** Identifier of the agent handling the invocation */
  agentId: string;
}

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Structured result from an agent tool handler.
 */
export interface AgentToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Function signature for agent tool handlers.
 *
 * Each handler receives the parsed parameters and an isolated invocation
 * context. Handlers must return a structured result; thrown errors are caught
 * by the adapter and converted to MCP error responses.
 */
export type AgentToolHandler = (
  params: Record<string, unknown>,
  context: InvocationContext,
) => Promise<AgentToolResult>;

/**
 * Agent tool definition with handler function.
 *
 * Combines MCP tool metadata (name, description, inputSchema) with the
 * handler that executes when the tool is invoked.
 */
export interface AgentToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: AgentToolHandler;
}

// ============================================================================
// Resource Types
// ============================================================================

/**
 * Agent resource definition with reader function.
 *
 * Resources are read-only data exposed by the agent server via the MCP
 * resource protocol.
 */
export interface AgentResourceDef {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  reader: () => Promise<string>;
}

// ============================================================================
// Server Config
// ============================================================================

/**
 * Configuration for creating an MCP server from agent capabilities.
 *
 * The `AgentServerAdapter` accepts this config and produces a fully
 * functional `McpServer` with concurrency limiting, error handling,
 * and context isolation.
 */
export interface AgentServerConfig {
  /** Unique agent identifier */
  agentId: string;
  /** Human-readable agent name (used as MCP server name) */
  agentName: string;
  /** Semantic version for the agent server */
  version: string;
  /** Tools to expose via MCP */
  tools: AgentToolDef[];
  /** Resources to expose via MCP */
  resources: AgentResourceDef[];
  /** Maximum concurrent invocations (default: 3) */
  maxConcurrency: number;
}

// ============================================================================
// Client Config
// ============================================================================

/**
 * Configuration for an agent MCP client.
 *
 * The `AgentClientAdapter` uses this config to establish connections
 * to other agent servers and invoke their tools.
 */
export interface AgentClientConfig {
  /** Unique agent identifier */
  agentId: string;
  /** Human-readable agent name (used as MCP client name) */
  agentName: string;
  /** Name of the target server to connect to */
  targetServer: string;
  /** Timeout for tool invocations in milliseconds (default: 30000) */
  timeoutMs?: number;
}
