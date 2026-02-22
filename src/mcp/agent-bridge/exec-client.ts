/**
 * EXEC Agent MCP Client.
 *
 * Extends AgentClientAdapter with typed convenience methods for invoking
 * SCOUT tools. EXEC is the primary consumer of inter-agent MCP communication.
 *
 * @module mcp/agent-bridge/exec-client
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgentClientAdapter } from './agent-client-adapter.js';
import type { AgentClientConfig, AgentToolResult } from './types.js';

/** Default EXEC client configuration. */
const EXEC_CLIENT_CONFIG: AgentClientConfig = {
  agentId: 'exec',
  agentName: 'EXEC',
  targetServer: 'SCOUT',
  timeoutMs: 30000,
};

/**
 * EXEC agent MCP client with typed SCOUT tool helpers.
 *
 * Provides convenience methods that map to SCOUT's tool interface,
 * removing the need for callers to know tool names or parameter shapes.
 */
export class ExecClient extends AgentClientAdapter {
  constructor(config?: Partial<AgentClientConfig>) {
    super({ ...EXEC_CLIENT_CONFIG, ...config });
  }

  /**
   * Invoke SCOUT's research tool.
   *
   * @param topic - Research topic
   * @param depth - Research depth: 'shallow' or 'deep'
   * @returns Research findings
   */
  async execResearch(
    topic: string,
    depth?: 'shallow' | 'deep',
  ): Promise<AgentToolResult> {
    const params: Record<string, unknown> = { topic };
    if (depth) {
      params.depth = depth;
    }
    return this.invokeTool('scout.research', params);
  }

  /**
   * Invoke SCOUT's dependency evaluation tool.
   *
   * @param name - Package/dependency name
   * @param version - Specific version to evaluate
   * @returns Dependency evaluation report
   */
  async execEvaluateDep(
    name: string,
    version?: string,
  ): Promise<AgentToolResult> {
    const params: Record<string, unknown> = { name };
    if (version) {
      params.version = version;
    }
    return this.invokeTool('scout.evaluate-dependency', params);
  }

  /**
   * Invoke SCOUT's landscape survey tool.
   *
   * @param domain - Domain to survey
   * @returns Landscape survey report
   */
  async execSurveyLandscape(
    domain: string,
  ): Promise<AgentToolResult> {
    return this.invokeTool('scout.survey-landscape', { domain });
  }
}

/**
 * Create a pre-configured EXEC client.
 *
 * @param scoutServer - Optional SCOUT server to auto-connect to
 * @returns ExecClient instance (call connectToServer if server not provided)
 */
export async function createExecClient(
  scoutServer?: McpServer,
): Promise<ExecClient> {
  const client = new ExecClient();
  if (scoutServer) {
    await client.connectToServer(scoutServer);
  }
  return client;
}
