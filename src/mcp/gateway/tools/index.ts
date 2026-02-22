/**
 * Gateway tool registry -- registers all MCP tools on a server instance.
 *
 * Composes tool registration from domain-specific modules (project, skill,
 * chipset, agent, workflow, session) and provides a factory function for
 * creating gateway servers with all tools pre-registered.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerProjectReadTools,
  registerProjectWriteTools,
  type ProjectToolsConfig,
} from './project-tools.js';
import { registerAgentTools } from './agent-tools.js';
import { AgentRegistry } from './agent-registry.js';
import { registerWorkflowTools } from './workflow-tools.js';
import { WorkflowEngine } from './workflow-engine.js';
import { registerSessionTools } from './session-tools.js';
import { SessionStore } from './session-store.js';

// ── Configuration ───────────────────────────────────────────────────────

export interface GatewayToolsConfig {
  /** Project tool configuration. */
  projects: ProjectToolsConfig;
  /** Shared agent registry (optional -- created internally if not provided). */
  agentRegistry?: AgentRegistry;
  /** Shared workflow engine (optional -- created internally if not provided). */
  workflowEngine?: WorkflowEngine;
  /** Shared session store (optional -- created internally if not provided). */
  sessionStore?: SessionStore;
}

// ── Registration ────────────────────────────────────────────────────────

/**
 * Register all gateway tools on an McpServer instance.
 *
 * @param server - The MCP server to register tools on
 * @param config - Configuration for all tool domains
 */
export function registerAllTools(server: McpServer, config: GatewayToolsConfig): void {
  // Project tools
  registerProjectReadTools(server, config.projects);
  registerProjectWriteTools(server, config.projects);

  // Agent tools (agent:spawn, agent:status, agent:logs)
  const registry = config.agentRegistry ?? new AgentRegistry();
  registerAgentTools(server, registry);

  // Workflow tools (workflow:research, workflow:requirements, workflow:plan, workflow:execute)
  const engine = config.workflowEngine ?? new WorkflowEngine();
  registerWorkflowTools(server, engine);

  // Session tools (session:query, session:patterns)
  const store = config.sessionStore ?? new SessionStore();
  registerSessionTools(server, store);
}

/**
 * Create a factory function that produces McpServer instances with all
 * gateway tools registered. Used as the serverFactory parameter for startGateway().
 *
 * @param config - Configuration for all tool domains
 * @returns A factory function compatible with McpServerFactory
 */
export function createGatewayServerFactory(config: GatewayToolsConfig): () => McpServer {
  return () => {
    const server = new McpServer({
      name: 'gsd-os-gateway',
      version: '1.0.0',
    });
    registerAllTools(server, config);
    return server;
  };
}

// ── Re-exports ──────────────────────────────────────────────────────────

export type { ProjectToolsConfig } from './project-tools.js';
export {
  type ProjectSummary,
  type ProjectDetails,
  type CreateProjectResult,
  type ExecutePhaseResult,
  discoverProjects,
  getProjectDetails,
  createProject,
  triggerPhaseExecution,
} from './project-tools.js';

export {
  registerChipsetTools,
  synthesizeChipset,
} from './chipset-tools.js';

export {
  ChipsetStateManager,
  createChipsetStateManager,
  type ChipsetModifyResult,
  type ChipsetUpdate,
} from './chipset-state.js';

// Agent tools
export {
  AgentStateSchema,
  type AgentState,
  AgentRoleSchema,
  type AgentRole,
  TokenUsageSchema,
  type TokenUsage,
  LogLevelSchema,
  type LogLevel,
  AgentLogEntrySchema,
  type AgentLogEntry,
  AgentRecordSchema,
  type AgentRecord,
  DEFAULT_MAX_LOGS,
} from './agent-types.js';

export {
  AgentRegistry,
  type SpawnOptions,
} from './agent-registry.js';

export { registerAgentTools } from './agent-tools.js';

// Workflow tools
export {
  WorkflowStageSchema,
  type WorkflowStage,
  ResearchResultSchema,
  type ResearchResult,
  RequirementsResultSchema,
  type RequirementsResult,
  PlanResultSchema,
  type PlanResult,
  ExecuteResultSchema,
  type ExecuteResult,
  WorkflowInvocationSchema,
  type WorkflowInvocation,
} from './workflow-types.js';

export { WorkflowEngine } from './workflow-engine.js';

export { registerWorkflowTools } from './workflow-tools.js';

// Session tools
export {
  SessionMatchSchema,
  type SessionMatch,
  PatternRecordSchema,
  type PatternRecord,
  IntelligenceEntrySchema,
  type IntelligenceEntry,
} from './session-types.js';

export { SessionStore } from './session-store.js';

export { registerSessionTools } from './session-tools.js';
