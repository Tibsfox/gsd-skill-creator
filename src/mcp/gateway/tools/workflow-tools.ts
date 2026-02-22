/**
 * Workflow gateway tools — workflow:research, workflow:requirements,
 * workflow:plan, workflow:execute.
 *
 * Registers four MCP tools on a gateway server that allow external clients
 * to trigger GSD pipeline stages and receive structured results.
 *
 * @module mcp/gateway/tools/workflow-tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { WorkflowEngine } from './workflow-engine.js';

// ── Tool Registration ───────────────────────────────────────────────────────

/**
 * Register all workflow:* tools on the given MCP server.
 *
 * @param server - The MCP server to register tools on
 * @param engine - The workflow engine for pipeline execution
 */
export function registerWorkflowTools(server: McpServer, engine: WorkflowEngine): void {
  registerResearchTool(server, engine);
  registerRequirementsTool(server, engine);
  registerPlanTool(server, engine);
  registerExecuteTool(server, engine);
}

// ── workflow:research ───────────────────────────────────────────────────────

function registerResearchTool(server: McpServer, engine: WorkflowEngine): void {
  server.tool(
    'workflow:research',
    'Trigger the GSD research phase for a project and return findings summary',
    {
      project: z.string().min(1).describe('Project name to research'),
      domain: z.string().min(1).describe('Domain or topic to research'),
      depth: z.number().int().min(1).max(3).default(1).describe('Research depth level (1=surface, 2=detailed, 3=deep)'),
    },
    async (args) => {
      const result = await engine.research(args.project, args.domain, args.depth);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );
}

// ── workflow:requirements ───────────────────────────────────────────────────

function registerRequirementsTool(server: McpServer, engine: WorkflowEngine): void {
  server.tool(
    'workflow:requirements',
    'Generate a requirements document for a project',
    {
      project: z.string().min(1).describe('Project name'),
      scope: z.string().optional().describe('Optional category scope filter (e.g., "core", "testing", "performance")'),
    },
    async (args) => {
      const result = await engine.requirements(args.project, args.scope ?? null);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );
}

// ── workflow:plan ───────────────────────────────────────────────────────────

function registerPlanTool(server: McpServer, engine: WorkflowEngine): void {
  server.tool(
    'workflow:plan',
    'Create an execution plan with wave assignments for a project',
    {
      project: z.string().min(1).describe('Project name'),
      phaseNumber: z.number().int().min(1).optional().describe('Optional specific phase number to plan'),
    },
    async (args) => {
      const result = await engine.plan(args.project, args.phaseNumber ?? null);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );
}

// ── workflow:execute ────────────────────────────────────────────────────────

function registerExecuteTool(server: McpServer, engine: WorkflowEngine): void {
  server.tool(
    'workflow:execute',
    'Trigger full GSD pipeline execution for a project',
    {
      project: z.string().min(1).describe('Project name'),
      dryRun: z.boolean().default(false).describe('If true, return planned actions without executing'),
      phaseFilter: z.number().int().min(1).optional().describe('Optional phase number to limit execution'),
    },
    async (args) => {
      const result = await engine.execute(args.project, {
        dryRun: args.dryRun,
        phaseFilter: args.phaseFilter ?? null,
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );
}
