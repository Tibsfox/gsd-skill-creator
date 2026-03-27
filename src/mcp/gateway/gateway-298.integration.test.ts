/**
 * Integration tests for Phase 298: Chipset tools, resource providers,
 * and prompt templates over real HTTP connections.
 *
 * Starts a real gateway server with createGsdGatewayFactory, connects
 * MCP clients over Streamable HTTP, and verifies end-to-end behavior.
 *
 * Follows the pattern from Phase 295's gateway.integration.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startGateway, type GatewayHandle } from './server.js';
import { createGsdGatewayFactory } from './create-gateway-server.js';
import { createChipsetStateManager } from './tools/chipset-state.js';
import { createTokenInfo, writeToken } from './token-manager.js';
import type { TokenInfo } from './types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

let portCounter = 14300;

function getPort(): number {
  return portCounter++;
}

function createClientTransport(port: number, token: string): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${port}/mcp`),
    {
      requestInit: {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
    },
  );
}

function parseToolResult(result: unknown): unknown {
  const r = result as { content: Array<{ type: string; text: string }> };
  return JSON.parse(r.content[0]!.text);
}

// ── Test Suite ──────────────────────────────────────────────────────────

describe('Gateway 298 Integration', () => {
  let tempDir: string;
  let gateway: GatewayHandle;
  let storedToken: TokenInfo;
  let port: number;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gateway-298-'));
    port = getPort();

    // Create a known token
    storedToken = createTokenInfo(['admin']);
    const tokenPath = join(tempDir, 'gateway-token');
    await writeToken(tokenPath, storedToken);

    // Create shared chipset state
    const chipsetState = createChipsetStateManager();

    // Start gateway with full GSD factory
    const factory = createGsdGatewayFactory({
      chipsetState,
      providers: {
        projectConfig: async (name) => ({
          name,
          status: 'active',
          phaseCount: 3,
          lastActivity: '2026-02-22',
          config: { name },
        }),
        skillRegistry: async () => [
          { name: 'test-skill', domain: 'testing', version: '1.0.0', activations: 5, lastActivated: '2026-02-22' },
        ],
        agentTelemetry: async (agentId) => ({
          agentId,
          role: 'executor',
          tokenUsage: 5000,
          taskCount: 2,
          lastActivity: '2026-02-22',
          status: 'active',
        }),
      },
    });

    gateway = await startGateway(
      {
        port,
        host: '127.0.0.1',
        tokenPath,
        enableJsonResponse: true,
      },
      factory,
    );
  });

  afterEach(async () => {
    if (gateway) {
      await gateway.stop();
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── Chipset Tools ─────────────────────────────────────────────────

  describe('chipset tools end-to-end', () => {
    it('chipset.get returns valid chipset config', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'chipset-get', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.callTool({
        name: 'chipset.get',
        arguments: {},
      });

      const config = parseToolResult(result) as any;
      expect(config.name).toBe('den-v1.28');
      expect(config.positions).toHaveLength(10);
      expect(config.topology.type).toBe('squadron');

      await client.close();
    });

    it('chipset.modify updates config and returns diff', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'chipset-modify', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.callTool({
        name: 'chipset.modify',
        arguments: { name: 'modified-via-http' },
      });

      const response = parseToolResult(result) as any;
      expect(response.config.name).toBe('modified-via-http');
      expect(response.diff).toContain('den-v1.28');
      expect(response.diff).toContain('modified-via-http');

      await client.close();
    });

    it('chipset.synthesize produces valid config from description', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'chipset-synth', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.callTool({
        name: 'chipset.synthesize',
        arguments: {
          description: 'A sequential pipeline with stages for building, testing, and documenting code',
        },
      });

      const config = parseToolResult(result) as any;
      expect(config.topology.type).toBe('pipeline');
      expect(config.positions.length).toBeGreaterThanOrEqual(2);
      expect(config.version).toBe('1.0.0');

      await client.close();
    });

    it('chipset.get reflects modifications', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'chipset-persist', version: '1.0.0' });

      await client.connect(transport);

      // Modify
      await client.callTool({
        name: 'chipset.modify',
        arguments: { name: 'persistent-change' },
      });

      // Verify with get
      const result = await client.callTool({
        name: 'chipset.get',
        arguments: {},
      });

      const config = parseToolResult(result) as any;
      expect(config.name).toBe('persistent-change');

      await client.close();
    });
  });

  // ── Resource Providers ────────────────────────────────────────────

  describe('resources end-to-end', () => {
    it('lists resources including static ones', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'res-list', version: '1.0.0' });

      await client.connect(transport);

      const resources = await client.listResources();
      const names = resources.resources.map((r) => r.name);
      expect(names).toContain('skill-registry');
      expect(names).toContain('chipset-state');

      await client.close();
    });

    it('lists resource templates', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'res-templates', version: '1.0.0' });

      await client.connect(transport);

      const templates = await client.listResourceTemplates();
      const names = templates.resourceTemplates.map((r) => r.name);
      expect(names).toContain('project-config');
      expect(names).toContain('agent-telemetry');

      await client.close();
    });

    it('reads chipset state resource', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'res-chipset', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.readResource({
        uri: 'gsd://chipset/state',
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]!.mimeType).toBe('text/yaml');
      const parsed = JSON.parse((result.contents[0] as { text: string }).text);
      expect(parsed.name).toBe('den-v1.28');

      await client.close();
    });

    it('reads skill registry resource', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'res-skills', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.readResource({
        uri: 'gsd://skills/registry',
      });

      const skills = JSON.parse((result.contents[0] as { text: string }).text);
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('test-skill');

      await client.close();
    });

    it('reads project config template resource', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'res-project', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.readResource({
        uri: 'gsd://projects/my-project/config',
      });

      const data = JSON.parse((result.contents[0] as { text: string }).text);
      expect(data.name).toBe('my-project');
      expect(data.status).toBe('active');

      await client.close();
    });

    it('reads agent telemetry template resource', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'res-agent', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.readResource({
        uri: 'gsd://agents/executor-1/telemetry',
      });

      const data = JSON.parse((result.contents[0] as { text: string }).text);
      expect(data.agentId).toBe('executor-1');
      expect(data.role).toBe('executor');

      await client.close();
    });
  });

  // ── Prompt Templates ──────────────────────────────────────────────

  describe('prompts end-to-end', () => {
    it('lists all three prompt templates', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'prompt-list', version: '1.0.0' });

      await client.connect(transport);

      const prompts = await client.listPrompts();
      const names = prompts.prompts.map((p) => p.name);
      expect(names).toContain('create-project');
      expect(names).toContain('diagnose-agent');
      expect(names).toContain('optimize-chipset');

      await client.close();
    });

    it('gets create-project prompt with filled arguments', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'prompt-create', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.getPrompt({
        name: 'create-project',
        arguments: {
          name: 'integration-test-project',
          description: 'Testing prompt templates over HTTP',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = (result.messages[0] as any).content.text;
      expect(text).toContain('integration-test-project');
      expect(text).toContain('Testing prompt templates over HTTP');

      await client.close();
    });

    it('gets diagnose-agent prompt with symptoms', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'prompt-diagnose', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.getPrompt({
        name: 'diagnose-agent',
        arguments: {
          agentId: 'sentinel-1',
          symptoms: 'Recovery loops exceeding retry limit',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = (result.messages[0] as any).content.text;
      expect(text).toContain('sentinel-1');
      expect(text).toContain('Recovery loops');

      await client.close();
    });

    it('gets optimize-chipset prompt with goal', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'prompt-optimize', version: '1.0.0' });

      await client.connect(transport);

      const result = await client.getPrompt({
        name: 'optimize-chipset',
        arguments: {
          goal: 'Minimize token budget while maintaining coverage',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = (result.messages[0] as any).content.text;
      expect(text).toContain('Minimize token budget');

      await client.close();
    });
  });

  // ── Concurrent Access ─────────────────────────────────────────────

  describe('concurrent access', () => {
    it('concurrent chipset.modify calls do not corrupt state', async () => {
      // Create 3 concurrent clients
      const clients: Client[] = [];
      for (let i = 0; i < 3; i++) {
        const transport = createClientTransport(port, storedToken.token);
        const client = new Client({ name: `concurrent-${i}`, version: '1.0.0' });
        await client.connect(transport);
        clients.push(client);
      }

      // Fire concurrent modifications
      const results = await Promise.all(
        clients.map((client, i) =>
          client.callTool({
            name: 'chipset.modify',
            arguments: { name: `concurrent-${i}` },
          }),
        ),
      );

      // All should succeed (no crashes)
      expect(results).toHaveLength(3);
      for (const result of results) {
        const content = result.content as Array<{ type: string; text: string }>;
        expect(content[0]!.text).toBeTruthy();
        // Should be valid JSON
        expect(() => JSON.parse(content[0]!.text)).not.toThrow();
      }

      // Final state should be one of the concurrent values
      const getResult = await clients[0]!.callTool({
        name: 'chipset.get',
        arguments: {},
      });
      const config = parseToolResult(getResult) as any;
      expect(config.name).toMatch(/^concurrent-/);

      await Promise.all(clients.map((c) => c.close()));
    });
  });

  // ── Tool + Resource Interaction ───────────────────────────────────

  describe('tool-resource interaction', () => {
    it('chipset state resource reflects tool modifications', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'interaction', version: '1.0.0' });

      await client.connect(transport);

      // Modify chipset via tool
      await client.callTool({
        name: 'chipset.modify',
        arguments: { name: 'resource-sync-test' },
      });

      // Read chipset state via resource
      const resource = await client.readResource({
        uri: 'gsd://chipset/state',
      });

      const state = JSON.parse((resource.contents[0] as { text: string }).text);
      expect(state.name).toBe('resource-sync-test');

      await client.close();
    });
  });
});
