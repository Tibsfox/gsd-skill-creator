/**
 * Agent Bridge module — MCP adapters for GSD agents.
 *
 * Provides two adapter patterns:
 * - Agent-Server Adapter: wraps agent capabilities as MCP servers
 * - Agent-Client Adapter: gives agents MCP client capability
 *
 * @module mcp/agent-bridge
 */

// Types
export type {
  AgentServerConfig,
  AgentClientConfig,
  AgentToolDef,
  AgentResourceDef,
  AgentToolHandler,
  AgentToolResult,
  InvocationContext,
} from './types.js';

// Server adapter
export { createAgentServer } from './agent-server-adapter.js';

// Agent servers
export { createScoutServer, SCOUT_SERVER_CONFIG } from './scout-server.js';
export { createVerifyServer, VERIFY_SERVER_CONFIG } from './verify-server.js';

// Client adapter
export { AgentClientAdapter } from './agent-client-adapter.js';

// EXEC client
export { ExecClient, createExecClient } from './exec-client.js';
