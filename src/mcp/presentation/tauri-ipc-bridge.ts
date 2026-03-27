/**
 * TypeScript frontend bridge to Tauri MCP IPC commands.
 *
 * Provides typed async functions wrapping the Rust host manager's Tauri
 * IPC commands. Detects the Tauri runtime and throws descriptive errors
 * when called outside a Tauri context (e.g., during testing in Node.js).
 *
 * Satisfies PRES-08 (Tauri IPC commands exposed to frontend).
 *
 * @module mcp/presentation/tauri-ipc-bridge
 */

import type { TraceEvent, TrustState, TransportConfig } from '../../types/mcp.js';

// ============================================================================
// Types (mirrors Rust IPC response shapes)
// ============================================================================

/** Server information returned by mcp_list_servers (mirrors Rust ServerInfo). */
export interface ServerInfo {
  /** Server identifier. */
  id: string;
  /** Connection status. */
  status: 'Connected' | 'Disconnected' | 'Failed' | 'Connecting' | 'Handshaking';
  /** Human-readable server name (null if not yet discovered). */
  serverName: string | null;
  /** Number of tools discovered. */
  toolCount: number;
  /** Number of resources discovered. */
  resourceCount: number;
  /** Number of prompts discovered. */
  promptCount: number;
}

/** Tool call result returned by mcp_call_tool (mirrors Rust ToolCallResult). */
export interface ToolCallResult {
  /** Tool that was called. */
  toolName: string;
  /** Server that executed the tool. */
  serverId: string;
  /** Whether the call succeeded. */
  success: boolean;
  /** Result payload (null if failed). */
  result: unknown | null;
  /** Error message (null if succeeded). */
  error: string | null;
  /** Time taken in milliseconds. */
  latencyMs: number;
}

// ============================================================================
// Runtime Detection
// ============================================================================

/**
 * Check if running in a Tauri context.
 *
 * Returns true if the `window.__TAURI__` global is present, indicating
 * that the Tauri IPC bridge is available.
 */
function isTauriAvailable(): boolean {
  return typeof globalThis !== 'undefined'
    && typeof (globalThis as Record<string, unknown>).window !== 'undefined'
    && '__TAURI__' in ((globalThis as Record<string, unknown>).window as Record<string, unknown>);
}

/**
 * Invoke a Tauri IPC command with type safety.
 *
 * @param command - The Tauri command name.
 * @param args - Optional arguments to pass.
 * @returns The command result.
 * @throws Error if not running in a Tauri context.
 */
async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriAvailable()) {
    throw new Error(`Tauri IPC not available: ${command}`);
  }
  // Dynamic import to avoid bundler errors in non-Tauri environments.
  // The @tauri-apps/api package is only present in the Tauri desktop build.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tauriModule = await (Function('return import("@tauri-apps/api/core")')() as Promise<any>);
  return tauriModule.invoke(command, args) as T;
}

// ============================================================================
// IPC Functions (PRES-08)
// ============================================================================

/**
 * Connect to an MCP server.
 *
 * Spawns the server process, completes the MCP handshake, and registers
 * the server in the host manager's registry.
 *
 * @param serverId - Unique identifier for the server.
 * @param config - Transport configuration (stdio or streamable-http).
 * @returns Connection status as a string.
 */
export async function mcpConnect(serverId: string, config: TransportConfig): Promise<string> {
  return invoke<string>('mcp_connect', { serverId, config });
}

/**
 * Disconnect an MCP server.
 *
 * Gracefully shuts down the connection but preserves the server's
 * registry entry for future reconnection.
 *
 * @param serverId - Server to disconnect.
 */
export async function mcpDisconnect(serverId: string): Promise<void> {
  return invoke<void>('mcp_disconnect', { serverId });
}

/**
 * List all managed MCP servers with their status and capability summary.
 *
 * @returns Array of server information objects.
 */
export async function mcpListServers(): Promise<ServerInfo[]> {
  return invoke<ServerInfo[]>('mcp_list_servers');
}

/**
 * Invoke a tool by name, routing to the correct server.
 *
 * The tool router resolves the server that owns the tool and dispatches
 * the JSON-RPC request. Trace events are recorded for observability.
 *
 * @param toolName - Name of the tool to invoke.
 * @param params - Tool parameters as a key-value object.
 * @returns Tool call result with response and latency.
 */
export async function mcpInvokeTool(
  toolName: string,
  params: Record<string, unknown>,
): Promise<ToolCallResult> {
  return invoke<ToolCallResult>('mcp_call_tool', { toolName, params });
}

/**
 * Get recent trace events from the host manager.
 *
 * @param count - Maximum number of events to return (default: 50).
 * @param serverId - Optional server ID to filter by.
 * @returns Array of trace events.
 */
export async function mcpGetTrace(count?: number, serverId?: string): Promise<TraceEvent[]> {
  return invoke<TraceEvent[]>('mcp_get_trace', { count, serverId });
}

/**
 * Get the trust state for a specific server.
 *
 * Reads the persisted trust state from the server registry, which
 * survives app restarts.
 *
 * @param serverId - Server to query.
 * @returns The current trust state.
 */
export async function mcpGetTrustState(serverId: string): Promise<TrustState> {
  return invoke<TrustState>('mcp_get_trust_state', { serverId });
}
