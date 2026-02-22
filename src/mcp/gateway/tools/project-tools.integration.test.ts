/**
 * Integration tests for project:* gateway tools.
 *
 * Starts a real gateway server with project tools registered,
 * connects a real MCP client over Streamable HTTP, and verifies
 * the full tool discovery and invocation flow end to end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { startGateway, type GatewayHandle } from '../server.js';
import { createTokenInfo, writeToken } from '../token-manager.js';
import type { TokenInfo } from '../types.js';
import { registerProjectReadTools, registerProjectWriteTools } from './project-tools.js';

// ── Helpers ─────────────────────────────────────────────────────────────

let portCounter = 14100;

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

/** Create a mock GSD project. */
async function createMockProject(root: string, name: string): Promise<void> {
  const projectDir = join(root, name);
  const planningDir = join(projectDir, '.planning', 'phases');
  await mkdir(planningDir, { recursive: true });
  await writeFile(
    join(projectDir, '.planning', 'PROJECT.md'),
    `# ${name}\n\n## Core Value\nTest project.\n\n## What This Is\nA test.\n`,
  );
  await writeFile(
    join(projectDir, '.planning', 'ROADMAP.md'),
    `# Roadmap\n\n## Phases\n\n- [ ] Phase 1: Foundation\n- [ ] Phase 2: Build\n\n## Progress\n\nIn progress.\n`,
  );
  await writeFile(
    join(projectDir, '.planning', 'STATE.md'),
    `# State\n\n## Current Position\n\nPhase: 1\nStatus: In progress\n`,
  );
}

// ── Test Suite ──────────────────────────────────────────────────────────

describe('Project Tools Integration', () => {
  let tempDir: string;
  let projectsRoot: string;
  let gateway: GatewayHandle;
  let storedToken: TokenInfo;
  let port: number;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'project-tools-integration-'));
    projectsRoot = join(tempDir, 'projects');
    await mkdir(projectsRoot, { recursive: true });
    port = getPort();

    storedToken = createTokenInfo(['admin']);
    const tokenPath = join(tempDir, 'gateway-token');
    await writeToken(tokenPath, storedToken);

    // Create gateway with project tools
    gateway = await startGateway(
      {
        port,
        host: '127.0.0.1',
        tokenPath,
        enableJsonResponse: true,
      },
      () => {
        const server = new McpServer({
          name: 'test-project-gateway',
          version: '1.0.0',
        });
        registerProjectReadTools(server, { projectsRoot });
        registerProjectWriteTools(server, { projectsRoot });
        return server;
      },
    );
  });

  afterEach(async () => {
    if (gateway) await gateway.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── Tool Discovery ────────────────────────────────────────────────

  it('discovers all 4 project tools', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'discovery-test', version: '1.0.0' });

    await client.connect(transport);
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t) => t.name).sort();

    expect(toolNames).toContain('project.list');
    expect(toolNames).toContain('project.get');
    expect(toolNames).toContain('project.create');
    expect(toolNames).toContain('project.execute-phase');

    await client.close();
  });

  // ── project.list ──────────────────────────────────────────────────

  it('project.list returns empty array for clean directory', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'list-empty-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'project.list',
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const projects = JSON.parse(text!) as unknown[];
    expect(projects).toEqual([]);

    await client.close();
  });

  it('project.list returns projects after creation', async () => {
    await createMockProject(projectsRoot, 'test-alpha');

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'list-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'project.list',
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const projects = JSON.parse(text!) as Array<{ name: string }>;
    expect(projects).toHaveLength(1);
    expect(projects[0]!.name).toBe('test-alpha');

    await client.close();
  });

  // ── project.get ───────────────────────────────────────────────────

  it('project.get returns full details for existing project', async () => {
    await createMockProject(projectsRoot, 'detailed-project');

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'get-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'project.get',
      arguments: { name: 'detailed-project' },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const details = JSON.parse(text!) as { name: string; config: { name: string } };
    expect(details.name).toBe('detailed-project');
    expect(details.config.name).toBe('detailed-project');

    await client.close();
  });

  it('project.get returns error for nonexistent project', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'get-error-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'project.get',
      arguments: { name: 'nonexistent' },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    expect(text).toContain('not found');

    await client.close();
  });

  // ── project.create ────────────────────────────────────────────────

  it('project.create creates a new project', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'create-test', version: '1.0.0' });

    await client.connect(transport);

    // Create the project
    const createResult = await client.callTool({
      name: 'project.create',
      arguments: { name: 'new-proj', vision: 'Build something amazing' },
    });

    const createText = (createResult.content as Array<{ type: string; text: string }>)[0]?.text;
    const created = JSON.parse(createText!) as { created: boolean; name: string };
    expect(created.created).toBe(true);
    expect(created.name).toBe('new-proj');

    // Verify it shows up in project.list
    const listResult = await client.callTool({
      name: 'project.list',
      arguments: {},
    });

    const listText = (listResult.content as Array<{ type: string; text: string }>)[0]?.text;
    const projects = JSON.parse(listText!) as Array<{ name: string }>;
    expect(projects).toHaveLength(1);
    expect(projects[0]!.name).toBe('new-proj');

    await client.close();
  });

  // ── project.execute-phase ─────────────────────────────────────────

  it('project.execute-phase returns acknowledgment', async () => {
    await createMockProject(projectsRoot, 'exec-project');

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'exec-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'project.execute-phase',
      arguments: { name: 'exec-project', phase: 1 },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const execResult = JSON.parse(text!) as { triggered: boolean; status: string };
    expect(execResult.triggered).toBe(true);
    expect(execResult.status).toBe('queued');

    await client.close();
  });

  it('project.execute-phase returns error for invalid phase', async () => {
    await createMockProject(projectsRoot, 'limited-project');

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'exec-error-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'project.execute-phase',
      arguments: { name: 'limited-project', phase: 99 },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    expect(text).toContain('Invalid phase');

    await client.close();
  });
});
