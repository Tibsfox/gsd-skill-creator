/**
 * Gateway server factory -- wires chipset tools, resource providers,
 * and prompt templates onto MCP server instances.
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
import { registerResourceProviders } from './resources/resource-providers.js';
import type { ResourceProviders } from './resources/types.js';
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
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an MCP server factory for the GSD-OS gateway.
 *
 * The factory creates MCP server instances with:
 * - Chipset tools (get, modify, synthesize)
 * - Resource providers (project config, skill registry, agent telemetry, chipset state)
 * - Prompt templates (added by Plan 298-02)
 *
 * All sessions share the same chipset state manager (single source of truth).
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

  return () => {
    const server = new McpServer({
      name: 'gsd-os-gateway',
      version: '1.0.0',
    });

    // Register chipset tools
    registerChipsetTools(server, chipsetState);

    // Register project tools if config provided
    if (options?.projects) {
      registerProjectReadTools(server, options.projects);
      registerProjectWriteTools(server, options.projects);
    }

    // Register resource providers
    registerResourceProviders(server, providers);

    return server;
  };
}
