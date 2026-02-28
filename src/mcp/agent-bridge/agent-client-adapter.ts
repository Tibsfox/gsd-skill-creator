/**
 * Generic Agent-Client Adapter.
 *
 * Gives agents MCP client capability with connection management,
 * tool discovery, tool invocation with timeout, and resource reading.
 *
 * @module mcp/agent-bridge/agent-client-adapter
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Tool } from '../../core/types/mcp.js';
import type { AgentClientConfig, AgentToolResult } from './types.js';
import type { StagingPipeline } from '../security/staging-pipeline.js';

/** Default timeout for tool invocations (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Agent-Client Adapter for MCP communication.
 *
 * Wraps the MCP Client SDK to provide a simplified API for agents to:
 * - Connect to agent-servers via in-memory transport
 * - Discover available tools
 * - Invoke tools with timeout handling
 * - Read resources
 */
export class AgentClientAdapter {
  private readonly config: AgentClientConfig;
  private readonly stagingPipeline?: StagingPipeline;
  private client: Client | null = null;
  private connected = false;

  constructor(config: AgentClientConfig, stagingPipeline?: StagingPipeline) {
    this.config = config;
    this.stagingPipeline = stagingPipeline;
  }

  /**
   * Connect to an MCP server via in-memory transport.
   *
   * Used for local agent-to-agent communication where both the client
   * and server live in the same process.
   *
   * @param server - McpServer instance to connect to
   */
  async connectToServer(server: McpServer): Promise<void> {
    if (this.connected) {
      throw new Error(`Agent "${this.config.agentName}" is already connected`);
    }

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    this.client = new Client({
      name: this.config.agentName,
      version: '1.0.0',
    });

    await server.connect(serverTransport);
    await this.client.connect(clientTransport);
    this.connected = true;
  }

  /**
   * Discover tools available on the connected server.
   *
   * @returns Array of tool definitions
   * @throws Error if not connected
   */
  async listTools(): Promise<Tool[]> {
    this.assertConnected();
    const result = await this.client!.listTools();
    return result.tools.map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: (t.inputSchema ?? {}) as Record<string, unknown>,
    }));
  }

  /**
   * Invoke a tool on the connected server.
   *
   * Wraps the MCP `callTool` method with timeout handling. If the
   * invocation exceeds the configured timeout, a structured error
   * is returned (not an unhandled rejection).
   *
   * @param toolName - Name of the tool to invoke
   * @param params - Parameters to pass to the tool
   * @returns Structured tool result
   * @throws Error if not connected
   */
  async invokeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    this.assertConnected();

    // Pass through staging pipeline if configured (SECR-13: agent-to-agent staging)
    if (this.stagingPipeline) {
      const stagingResult = await this.stagingPipeline.validateAndExecute({
        caller: this.config.agentId,
        serverId: this.config.targetServer,
        toolName,
        params,
        source: 'agent-to-agent',
      });

      if (!stagingResult.allowed) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            code: -32000,
            message: `Staging gate blocked: ${stagingResult.reason}`,
            source: 'agent-to-agent',
            auditEntryId: stagingResult.auditEntryId,
          })}],
          isError: true,
        };
      }
    }

    const timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    try {
      const result = await Promise.race([
        this.client!.callTool({ name: toolName, arguments: params }),
        this.createTimeout(timeoutMs, toolName),
      ]);

      // Map MCP result to AgentToolResult
      const content = (result.content as Array<{ type: string; text: string }>) ?? [];
      return {
        content: content.map((c) => ({
          type: 'text' as const,
          text: c.text ?? '',
        })),
        isError: result.isError === true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          code: -32603,
          message: `Tool invocation failed: ${message}`,
        })}],
        isError: true,
      };
    }
  }

  /**
   * Read a resource from the connected server.
   *
   * @param uri - Resource URI to read
   * @returns Resource content as string
   * @throws Error if not connected
   */
  async readResource(uri: string): Promise<string> {
    this.assertConnected();

    const result = await this.client!.readResource({ uri });
    const contents = result.contents ?? [];
    if (contents.length === 0) {
      return '';
    }

    // Return the text content of the first resource
    const first = contents[0];
    if ('text' in first && typeof first.text === 'string') {
      return first.text;
    }
    return '';
  }

  /**
   * Check if the adapter is connected to a server.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from the server and clean up resources.
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * Assert that the adapter is connected; throw descriptive error if not.
   */
  private assertConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error(
        `Agent "${this.config.agentName}" is not connected to server "${this.config.targetServer}". ` +
        `Call connectToServer() first.`,
      );
    }
  }

  /**
   * Create a timeout promise that rejects after the specified delay.
   */
  private createTimeout(ms: number, toolName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool "${toolName}" invocation timed out after ${ms}ms`));
      }, ms);
    });
  }
}
