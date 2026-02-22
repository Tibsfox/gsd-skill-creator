/**
 * Unit tests for MCP resource providers.
 *
 * Tests all four resource providers using the MCP SDK's InMemoryTransport
 * for fast, isolated testing without HTTP.
 *
 * Template resources (project config, agent telemetry) are read by
 * resolving the URI template with actual values. Static resources
 * (skill registry, chipset state) are read by their fixed URIs.
 */

import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerResourceProviders } from './resource-providers.js';
import type { ResourceProviders } from './types.js';

/** Narrow text/blob resource union to extract text content. */
function resourceText(contents: Array<Record<string, unknown>>, index = 0): string {
  return (contents[index] as { text: string }).text;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function createMockProviders(overrides?: Partial<ResourceProviders>): ResourceProviders {
  return {
    projectConfig: async (name: string) => ({
      name,
      status: 'active',
      phaseCount: 5,
      lastActivity: '2026-02-22T00:00:00Z',
      config: { name, initialized: true },
    }),
    skillRegistry: async () => [
      { name: 'test-skill', domain: 'testing', version: '1.0.0', activations: 3, lastActivated: '2026-02-22' },
      { name: 'build-skill', domain: 'build', version: '2.1.0', activations: 7, lastActivated: '2026-02-21' },
    ],
    agentTelemetry: async (agentId: string) => {
      if (agentId === 'unknown-agent') return null;
      return {
        agentId,
        role: 'executor',
        tokenUsage: 12500,
        taskCount: 3,
        lastActivity: '2026-02-22T00:00:00Z',
        status: 'active',
      };
    },
    chipsetState: () => JSON.stringify({ name: 'den-v1.28', version: '1.0.0' }, null, 2),
    ...overrides,
  };
}

async function createTestSetup(providers?: ResourceProviders) {
  const mockProviders = providers ?? createMockProviders();

  const server = new McpServer({
    name: 'test-resources',
    version: '1.0.0',
  });

  registerResourceProviders(server, mockProviders);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server, mockProviders };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('Resource Providers', () => {
  // ── Resource Discovery ──────────────────────────────────────────────

  describe('resource discovery', () => {
    it('lists static resources', async () => {
      const { client } = await createTestSetup();

      const resources = await client.listResources();
      const names = resources.resources.map((r) => r.name);
      expect(names).toContain('skill-registry');
      expect(names).toContain('chipset-state');

      await client.close();
    });

    it('lists template resources', async () => {
      const { client } = await createTestSetup();

      const templates = await client.listResourceTemplates();
      const names = templates.resourceTemplates.map((r) => r.name);
      expect(names).toContain('project-config');
      expect(names).toContain('agent-telemetry');

      await client.close();
    });
  });

  // ── Project Config Resource ─────────────────────────────────────────

  describe('gsd://projects/{name}/config', () => {
    it('returns project config for a valid project', async () => {
      const { client } = await createTestSetup();

      const result = await client.readResource({
        uri: 'gsd://projects/my-project/config',
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]!.mimeType).toBe('application/json');
      const data = JSON.parse(resourceText(result.contents));
      expect(data.name).toBe('my-project');
      expect(data.status).toBe('active');
      expect(data.phaseCount).toBe(5);

      await client.close();
    });

    it('returns error for missing project', async () => {
      const providers = createMockProviders({
        projectConfig: async () => null,
      });
      const { client } = await createTestSetup(providers);

      const result = await client.readResource({
        uri: 'gsd://projects/nonexistent/config',
      });

      const data = JSON.parse(resourceText(result.contents));
      expect(data.error).toContain('not found');

      await client.close();
    });
  });

  // ── Skill Registry Resource ─────────────────────────────────────────

  describe('gsd://skills/registry', () => {
    it('returns array of skill entries', async () => {
      const { client } = await createTestSetup();

      const result = await client.readResource({
        uri: 'gsd://skills/registry',
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]!.mimeType).toBe('application/json');
      const data = JSON.parse(resourceText(result.contents));
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('test-skill');
      expect(data[1].name).toBe('build-skill');

      await client.close();
    });

    it('handles empty registry', async () => {
      const providers = createMockProviders({
        skillRegistry: async () => [],
      });
      const { client } = await createTestSetup(providers);

      const result = await client.readResource({
        uri: 'gsd://skills/registry',
      });

      const data = JSON.parse(resourceText(result.contents));
      expect(data).toEqual([]);

      await client.close();
    });
  });

  // ── Agent Telemetry Resource ────────────────────────────────────────

  describe('gsd://agents/{agentId}/telemetry', () => {
    it('returns telemetry for a valid agent', async () => {
      const { client } = await createTestSetup();

      const result = await client.readResource({
        uri: 'gsd://agents/executor-1/telemetry',
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]!.mimeType).toBe('application/json');
      const data = JSON.parse(resourceText(result.contents));
      expect(data.agentId).toBe('executor-1');
      expect(data.role).toBe('executor');
      expect(data.tokenUsage).toBe(12500);
      expect(data.status).toBe('active');

      await client.close();
    });

    it('returns error for unknown agent', async () => {
      const { client } = await createTestSetup();

      const result = await client.readResource({
        uri: 'gsd://agents/unknown-agent/telemetry',
      });

      const data = JSON.parse(resourceText(result.contents));
      expect(data.error).toContain('not found');

      await client.close();
    });
  });

  // ── Chipset State Resource ──────────────────────────────────────────

  describe('gsd://chipset/state', () => {
    it('returns chipset state as YAML-like string', async () => {
      const { client } = await createTestSetup();

      const result = await client.readResource({
        uri: 'gsd://chipset/state',
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]!.mimeType).toBe('text/yaml');
      const text = resourceText(result.contents);
      expect(text).toContain('den-v1.28');

      await client.close();
    });

    it('returned content is parseable JSON', async () => {
      const { client } = await createTestSetup();

      const result = await client.readResource({
        uri: 'gsd://chipset/state',
      });

      const parsed = JSON.parse(resourceText(result.contents));
      expect(parsed.name).toBe('den-v1.28');

      await client.close();
    });
  });

  // ── Dependency Injection ────────────────────────────────────────────

  describe('dependency injection', () => {
    it('uses injected providers', async () => {
      let calledWith = '';
      const providers = createMockProviders({
        projectConfig: async (name) => {
          calledWith = name;
          return { name, status: 'injected', phaseCount: 99, lastActivity: 'now', config: {} };
        },
      });
      const { client } = await createTestSetup(providers);

      const result = await client.readResource({
        uri: 'gsd://projects/injected-test/config',
      });

      expect(calledWith).toBe('injected-test');
      const data = JSON.parse(resourceText(result.contents));
      expect(data.status).toBe('injected');
      expect(data.phaseCount).toBe(99);

      await client.close();
    });
  });
});
