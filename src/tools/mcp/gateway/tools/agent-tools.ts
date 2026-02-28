/**
 * Agent gateway tools — agent.spawn, agent.status, agent.logs.
 *
 * Registers three MCP tools on a gateway server that allow external clients
 * to create GSD agents, query their runtime state, and retrieve log entries.
 *
 * @module mcp/gateway/tools/agent-tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgentRoleSchema } from './agent-types.js';
import type { AgentRegistry } from './agent-registry.js';

// ── Tool Registration ───────────────────────────────────────────────────────

/**
 * Register all agent:* tools on the given MCP server.
 *
 * @param server - The MCP server to register tools on
 * @param registry - The agent registry for state management
 */
export function registerAgentTools(server: McpServer, registry: AgentRegistry): void {
  registerSpawnTool(server, registry);
  registerStatusTool(server, registry);
  registerLogsTool(server, registry);
}

// ── agent.spawn ─────────────────────────────────────────────────────────────

function registerSpawnTool(server: McpServer, registry: AgentRegistry): void {
  server.tool(
    'agent.spawn',
    'Create a new GSD agent with a specified role, skills, and optional team assignment',
    {
      role: AgentRoleSchema.describe('Agent role (researcher, planner, executor, verifier, scout, coordinator, custom)'),
      skills: z.array(z.string()).describe('Skills to load into the agent'),
      team: z.string().optional().describe('Optional team assignment'),
    },
    async (args) => {
      const record = registry.spawn({
        role: args.role,
        skills: args.skills,
        team: args.team,
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            agentId: record.id,
            role: record.role,
            state: record.state,
            skills: record.skills,
            team: record.team ?? null,
            createdAt: record.createdAt,
          }, null, 2),
        }],
      };
    },
  );
}

// ── agent.status ────────────────────────────────────────────────────────────

function registerStatusTool(server: McpServer, registry: AgentRegistry): void {
  server.tool(
    'agent.status',
    'Get the current status of a GSD agent including role, state, token usage, and last activity',
    {
      agentId: z.string().describe('The agent ID to query'),
    },
    async (args) => {
      const record = registry.getStatus(args.agentId);

      if (!record) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Agent not found',
              agentId: args.agentId,
            }),
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            agentId: record.id,
            role: record.role,
            state: record.state,
            currentTask: record.currentTask,
            tokenUsage: record.tokenUsage,
            skills: record.skills,
            team: record.team ?? null,
            lastActivity: record.lastActivity,
            createdAt: record.createdAt,
          }, null, 2),
        }],
      };
    },
  );
}

// ── agent.logs ──────────────────────────────────────────────────────────────

function registerLogsTool(server: McpServer, registry: AgentRegistry): void {
  server.tool(
    'agent.logs',
    'Get recent log entries for a GSD agent',
    {
      agentId: z.string().describe('The agent ID to query'),
      limit: z.number().int().min(1).max(500).default(50).describe('Maximum number of log entries to return (default 50)'),
    },
    async (args) => {
      const entries = registry.getLogs(args.agentId, args.limit);

      if (entries === null) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Agent not found',
              agentId: args.agentId,
            }),
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            agentId: args.agentId,
            count: entries.length,
            entries,
          }, null, 2),
        }],
      };
    },
  );
}
