/**
 * MCP resource providers for the gateway server.
 *
 * Registers four resource providers on an MCP server instance:
 * 1. gsd://projects/{name}/config -- Project configuration (template)
 * 2. gsd://skills/registry -- Skill registry (static)
 * 3. gsd://agents/{agentId}/telemetry -- Agent telemetry (template)
 * 4. gsd://chipset/state -- Chipset state as YAML (static)
 *
 * Static resources use `server.resource(name, uri, callback)`.
 * Template resources use `server.resource(name, ResourceTemplate, callback)`.
 *
 * GATE-23: Resource providers expose project configs, skill registry,
 *          agent telemetry, and chipset state via URI templates.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ResourceProviders } from './types.js';

// ============================================================================
// Resource Registration
// ============================================================================

/**
 * Register all resource providers on an MCP server instance.
 *
 * @param server - The MCP server to register resources on
 * @param providers - Injected provider functions for each resource
 */
export function registerResourceProviders(
  server: McpServer,
  providers: ResourceProviders,
): void {
  registerProjectConfigResource(server, providers);
  registerSkillRegistryResource(server, providers);
  registerAgentTelemetryResource(server, providers);
  registerChipsetStateResource(server, providers);
}

// ============================================================================
// gsd://projects/{name}/config (template resource)
// ============================================================================

function registerProjectConfigResource(
  server: McpServer,
  providers: ResourceProviders,
): void {
  const template = new ResourceTemplate('gsd://projects/{name}/config', {
    list: undefined,
  });

  server.resource(
    'project-config',
    template,
    { description: 'Project configuration by name', mimeType: 'application/json' },
    async (uri, variables) => {
      const name = variables.name as string;
      const data = await providers.projectConfig(name);

      if (!data) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: `Project '${name}' not found` }),
          }],
        };
      }

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    },
  );
}

// ============================================================================
// gsd://skills/registry (static resource)
// ============================================================================

function registerSkillRegistryResource(
  server: McpServer,
  providers: ResourceProviders,
): void {
  server.resource(
    'skill-registry',
    'gsd://skills/registry',
    { description: 'Full skill registry', mimeType: 'application/json' },
    async (uri) => {
      const skills = await providers.skillRegistry();

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(skills, null, 2),
        }],
      };
    },
  );
}

// ============================================================================
// gsd://agents/{agentId}/telemetry (template resource)
// ============================================================================

function registerAgentTelemetryResource(
  server: McpServer,
  providers: ResourceProviders,
): void {
  const template = new ResourceTemplate('gsd://agents/{agentId}/telemetry', {
    list: undefined,
  });

  server.resource(
    'agent-telemetry',
    template,
    { description: 'Agent telemetry by agent ID', mimeType: 'application/json' },
    async (uri, variables) => {
      const agentId = variables.agentId as string;
      const data = await providers.agentTelemetry(agentId);

      if (!data) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: `Agent '${agentId}' not found` }),
          }],
        };
      }

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    },
  );
}

// ============================================================================
// gsd://chipset/state (static resource)
// ============================================================================

function registerChipsetStateResource(
  server: McpServer,
  providers: ResourceProviders,
): void {
  server.resource(
    'chipset-state',
    'gsd://chipset/state',
    { description: 'Current chipset state', mimeType: 'text/yaml' },
    async (uri) => {
      const yaml = providers.chipsetState();

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/yaml',
          text: yaml,
        }],
      };
    },
  );
}
