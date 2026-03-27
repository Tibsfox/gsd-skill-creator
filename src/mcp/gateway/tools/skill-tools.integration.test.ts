/**
 * Integration tests for skill:* gateway tools.
 *
 * Starts a real gateway server with skill tools registered,
 * connects a real MCP client over Streamable HTTP, and verifies
 * the full tool discovery and invocation flow end to end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { startGateway, type GatewayHandle } from '../server.js';
import { createTokenInfo, writeToken } from '../token-manager.js';
import type { TokenInfo } from '../types.js';
import { registerSkillReadTools, registerSkillWriteTools } from './skill-tools.js';

// ── Helpers ─────────────────────────────────────────────────────────────

let portCounter = 15100;

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

/** Create a mock skill file. */
async function createMockSkill(
  skillsDir: string,
  name: string,
  description: string,
  body: string,
): Promise<void> {
  const skillDir = join(skillsDir, name);
  await mkdir(skillDir, { recursive: true });
  const metadata = { name, description };
  const content = matter.stringify(body, metadata);
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

// ── Test Suite ──────────────────────────────────────────────────────────

describe('Skill Tools Integration', () => {
  let tempDir: string;
  let skillsDir: string;
  let gateway: GatewayHandle;
  let storedToken: TokenInfo;
  let port: number;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'skill-tools-integration-'));
    skillsDir = join(tempDir, '.claude', 'skills');
    await mkdir(skillsDir, { recursive: true });
    port = getPort();

    storedToken = createTokenInfo(['admin']);
    const tokenPath = join(tempDir, 'gateway-token');
    await writeToken(tokenPath, storedToken);

    // Create gateway with skill tools
    gateway = await startGateway(
      {
        port,
        host: '127.0.0.1',
        tokenPath,
        enableJsonResponse: true,
      },
      () => {
        const server = new McpServer({
          name: 'test-skill-gateway',
          version: '1.0.0',
        });
        registerSkillReadTools(server, { skillsDir });
        registerSkillWriteTools(server, { skillsDir });
        return server;
      },
    );
  });

  afterEach(async () => {
    if (gateway) await gateway.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── Tool Discovery ────────────────────────────────────────────────

  it('discovers all 3 skill tools', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'discovery-test', version: '1.0.0' });

    await client.connect(transport);
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t) => t.name).sort();

    expect(toolNames).toContain('skill.search');
    expect(toolNames).toContain('skill.inspect');
    expect(toolNames).toContain('skill.activate');

    await client.close();
  });

  // ── skill.search ──────────────────────────────────────────────────

  it('skill.search returns empty array for unknown query', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'search-empty-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'skill.search',
      arguments: { query: 'nonexistent-query-xyz' },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const results = JSON.parse(text!) as unknown[];
    expect(results).toEqual([]);

    await client.close();
  });

  it('skill.search finds a matching skill', async () => {
    await createMockSkill(skillsDir, 'typescript-helper', 'Helps with TypeScript', 'TS helper body.');

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'search-match-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'skill.search',
      arguments: { query: 'typescript' },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const results = JSON.parse(text!) as Array<{ name: string; score: number }>;
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!.name).toBe('typescript-helper');
    expect(results[0]!.score).toBeGreaterThan(0);

    await client.close();
  });

  // ── skill.inspect ─────────────────────────────────────────────────

  it('skill.inspect returns full content for existing skill', async () => {
    await createMockSkill(
      skillsDir,
      'inspectable',
      'A skill to inspect',
      'This is the full body content of the skill.',
    );

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'inspect-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'skill.inspect',
      arguments: { name: 'inspectable' },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const inspected = JSON.parse(text!) as { found: boolean; name: string; body: string };
    expect(inspected.found).toBe(true);
    expect(inspected.name).toBe('inspectable');
    expect(inspected.body).toContain('full body content');

    await client.close();
  });

  it('skill.inspect returns error for nonexistent skill', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'inspect-error-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'skill.inspect',
      arguments: { name: 'nonexistent' },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const inspected = JSON.parse(text!) as { found: boolean; error: string };
    expect(inspected.found).toBe(false);
    expect(inspected.error).toContain('not found');

    await client.close();
  });

  // ── skill.activate ────────────────────────────────────────────────

  it('skill.activate returns token budget impact', async () => {
    const body = 'X'.repeat(800); // 800 chars -> 200 tokens
    await createMockSkill(skillsDir, 'activatable', 'Activatable skill', body);

    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'activate-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'skill.activate',
      arguments: { name: 'activatable' },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const activated = JSON.parse(text!) as {
      activated: boolean;
      name: string;
      estimatedTokens: number;
      budgetImpact: { tokensAdded: number };
    };
    expect(activated.activated).toBe(true);
    expect(activated.name).toBe('activatable');
    expect(activated.estimatedTokens).toBe(200);
    expect(activated.budgetImpact.tokensAdded).toBe(200);

    await client.close();
  });

  it('skill.activate returns error for nonexistent skill', async () => {
    const transport = createClientTransport(port, storedToken.token);
    const client = new Client({ name: 'activate-error-test', version: '1.0.0' });

    await client.connect(transport);
    const result = await client.callTool({
      name: 'skill.activate',
      arguments: { name: 'nonexistent' },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    const activated = JSON.parse(text!) as { activated: boolean; error: string };
    expect(activated.activated).toBe(false);
    expect(activated.error).toContain('not found');

    await client.close();
  });
});
