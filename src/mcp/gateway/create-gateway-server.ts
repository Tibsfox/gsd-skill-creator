/**
 * Gateway server factory -- wires all 19 tools (chipset, project, skill,
 * agent, workflow, session), resource providers, and prompt templates onto
 * MCP server instances.
 *
 * Returns a McpServerFactory function suitable for passing to startGateway().
 * Each new session gets a fresh MCP server with all tools, resources, and
 * prompts pre-registered.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerChipsetTools } from './tools/chipset-tools.js';
import { ChipsetStateManager, createChipsetStateManager } from './tools/chipset-state.js';
import {
  registerProjectReadTools,
  registerProjectWriteTools,
  type ProjectToolsConfig,
} from './tools/project-tools.js';
import {
  registerSkillReadTools,
  registerSkillWriteTools,
  type SkillToolsConfig,
} from './tools/skill-tools.js';
import { registerAgentTools } from './tools/agent-tools.js';
import { AgentRegistry } from './tools/agent-registry.js';
import { registerWorkflowTools } from './tools/workflow-tools.js';
import { WorkflowEngine } from './tools/workflow-engine.js';
import { registerSessionTools } from './tools/session-tools.js';
import { SessionStore } from './tools/session-store.js';
import { registerResourceProviders } from './resources/resource-providers.js';
import type { ResourceProviders } from './resources/types.js';
import { registerPromptTemplates } from './prompts/prompt-templates.js';
import type { McpServerFactory } from './server.js';

// ============================================================================
// Default Providers
// ============================================================================

/**
 * Create default resource providers that return placeholder/demo data.
 * In production, these would be replaced with real data sources.
 */
function createDefaultProviders(chipsetState: ChipsetStateManager): ResourceProviders {
  return {
    projectConfig: async (name: string) => ({
      name,
      status: 'active',
      phaseCount: 0,
      lastActivity: new Date().toISOString(),
      config: { name, initialized: true },
    }),
    skillRegistry: async () => [],
    agentTelemetry: async (agentId: string) => ({
      agentId,
      role: 'unknown',
      tokenUsage: 0,
      taskCount: 0,
      lastActivity: new Date().toISOString(),
      status: 'idle',
    }),
    chipsetState: () => chipsetState.toYaml(),
  };
}

// ============================================================================
// Factory Options
// ============================================================================

/** Options for configuring the gateway server factory. */
export interface GatewayFactoryOptions {
  /** Custom resource providers (defaults to placeholder implementations). */
  providers?: Partial<ResourceProviders>;
  /** Initial chipset configuration (defaults to Den default). */
  chipsetState?: ChipsetStateManager;
  /** Project tools configuration (root directory for GSD projects). */
  projects?: ProjectToolsConfig;
  /** Skill tools configuration (path to skills directory). */
  skills?: SkillToolsConfig;
  /** Shared agent registry (optional -- created internally if not provided). */
  agentRegistry?: AgentRegistry;
  /** Shared workflow engine (optional -- created internally if not provided). */
  workflowEngine?: WorkflowEngine;
  /** Shared session store (optional -- created internally if not provided). */
  sessionStore?: SessionStore;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an MCP server factory for the GSD-OS gateway.
 *
 * The factory creates MCP server instances with all 19 tools across 6 groups:
 * - Chipset tools (chipset.get, chipset.modify, chipset.synthesize)
 * - Project tools (project.list, project.get, project.create, project.execute-phase)
 * - Skill tools (skill.search, skill.inspect, skill.activate)
 * - Agent tools (agent.spawn, agent.status, agent.logs)
 * - Workflow tools (workflow.research, workflow.requirements, workflow.plan, workflow.execute)
 * - Session tools (session.query, session.patterns)
 * - Resource providers (project config, skill registry, agent telemetry, chipset state)
 * - Prompt templates (added by Plan 298-02)
 *
 * All sessions share the same chipset state, agent registry, workflow engine,
 * and session store (single source of truth per gateway instance).
 *
 * @param options - Optional configuration for providers and initial state
 * @returns McpServerFactory function
 */
export function createGsdGatewayFactory(
  options?: GatewayFactoryOptions,
): McpServerFactory {
  const chipsetState = options?.chipsetState ?? createChipsetStateManager();
  const defaultProviders = createDefaultProviders(chipsetState);
  const providers: ResourceProviders = {
    ...defaultProviders,
    ...options?.providers,
  };

  // Shared state instances created outside the factory closure so all
  // sessions for this gateway share state (matches chipsetState pattern).
  const agentRegistry = options?.agentRegistry ?? new AgentRegistry();
  const workflowEngine = options?.workflowEngine ?? new WorkflowEngine();
  const sessionStore = options?.sessionStore ?? new SessionStore();

  return () => {
    const server = new McpServer({
      name: 'gsd-os-gateway',
      version: '1.0.0',
    });

    // Register chipset tools (chipset.get, chipset.modify, chipset.synthesize)
    registerChipsetTools(server, chipsetState);

    // Register project tools if config provided (project.list, project.get, project.create, project.execute-phase)
    if (options?.projects) {
      registerProjectReadTools(server, options.projects);
      registerProjectWriteTools(server, options.projects);
    }

    // Register skill tools if config provided (skill.search, skill.inspect, skill.activate)
    if (options?.skills) {
      registerSkillReadTools(server, options.skills);
      registerSkillWriteTools(server, options.skills);
    }

    // Register agent tools (agent.spawn, agent.status, agent.logs)
    registerAgentTools(server, agentRegistry);

    // Register workflow tools (workflow.research, workflow.requirements, workflow.plan, workflow.execute)
    registerWorkflowTools(server, workflowEngine);

    // Register session tools (session.query, session.patterns)
    registerSessionTools(server, sessionStore);

    // Register resource providers
    registerResourceProviders(server, providers);

    // Register prompt templates
    registerPromptTemplates(server);

    return server;
  };
}
