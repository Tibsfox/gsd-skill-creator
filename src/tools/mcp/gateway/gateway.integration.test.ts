/**
 * Integration tests for the GSD-OS MCP Gateway Server.
 *
 * These tests start a real HTTP server, connect real MCP clients over
 * Streamable HTTP transport, and verify the full authentication +
 * transport + tool-call flow end to end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { startGateway, type GatewayHandle } from './server.js';
import { createTokenInfo, writeToken } from './token-manager.js';
import type { TokenInfo } from './types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

let portCounter = 13100;

/** Get a unique port for each test to avoid conflicts. */
function getPort(): number {
  return portCounter++;
}

/**
 * Create an MCP server factory that registers test tools.
 * Includes both read-only and write tools for scope testing.
 */
function testServerFactory(): McpServer {
  const server = new McpServer({
    name: 'test-gateway',
    version: '1.0.0',
  });

  // Read-only tool
  server.tool(
    'echo',
    'Echo back the input message',
    { message: z.string().describe('Message to echo') },
    async (args) => ({
      content: [{ type: 'text' as const, text: `Echo: ${args.message}` }],
    }),
  );

  // A tool that simulates slow execution
  server.tool(
    'slow_echo',
    'Echo with a delay',
    {
      message: z.string().describe('Message to echo'),
      delayMs: z.number().describe('Delay in milliseconds'),
    },
    async (args) => {
      await new Promise((resolve) => setTimeout(resolve, args.delayMs));
      return {
        content: [{ type: 'text' as const, text: `Slow echo: ${args.message}` }],
      };
    },
  );

  return server;
}

/**
 * Create a Streamable HTTP client transport with authentication.
 */
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

// ── Test Suite ──────────────────────────────────────────────────────────

describe('Gateway Integration', () => {
  let tempDir: string;
  let gateway: GatewayHandle;
  let storedToken: TokenInfo;
  let port: number;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gateway-integration-'));
    port = getPort();

    // Create a known token
    storedToken = createTokenInfo(['admin']);
    const tokenPath = join(tempDir, 'gateway-token');
    await writeToken(tokenPath, storedToken);

    // Start gateway with test server factory
    gateway = await startGateway(
      {
        port,
        host: '127.0.0.1',
        tokenPath,
        enableJsonResponse: true,
      },
      () => testServerFactory(),
    );
  });

  afterEach(async () => {
    if (gateway) {
      await gateway.stop();
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── Authentication Tests ─────────────────────────────────────────────

  describe('authentication', () => {
    it('accepts requests with valid bearer token', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'auth-test', version: '1.0.0' });

      await client.connect(transport);
      const version = client.getServerVersion();
      expect(version?.name).toBe('test-gateway');

      await client.close();
    });

    it('rejects requests without Authorization header', async () => {
      const transport = new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${port}/mcp`),
      );
      const client = new Client({ name: 'no-auth-test', version: '1.0.0' });

      await expect(client.connect(transport)).rejects.toThrow();
    });

    it('rejects requests with invalid bearer token', async () => {
      const transport = createClientTransport(port, 'invalid-token-value');
      const client = new Client({ name: 'bad-auth-test', version: '1.0.0' });

      await expect(client.connect(transport)).rejects.toThrow();
    });
  });

  // ── Tool Discovery Tests ─────────────────────────────────────────────

  describe('tool discovery', () => {
    it('lists registered tools via MCP protocol', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'discovery-test', version: '1.0.0' });

      await client.connect(transport);
      const toolsResult = await client.listTools();
      const toolNames = toolsResult.tools.map((t) => t.name);

      expect(toolNames).toContain('echo');
      expect(toolNames).toContain('slow_echo');
      expect(toolNames).toHaveLength(2);

      await client.close();
    });
  });

  // ── Tool Invocation Tests ────────────────────────────────────────────

  describe('tool invocation', () => {
    it('calls a tool and receives structured response', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'invoke-test', version: '1.0.0' });

      await client.connect(transport);
      const result = await client.callTool({
        name: 'echo',
        arguments: { message: 'Hello, Gateway!' },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
      expect(text).toBe('Echo: Hello, Gateway!');

      await client.close();
    });

    it('handles tool call with delay without timing out', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'slow-test', version: '1.0.0' });

      await client.connect(transport);
      const result = await client.callTool({
        name: 'slow_echo',
        arguments: { message: 'Slow!', delayMs: 50 },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
      expect(text).toBe('Slow echo: Slow!');

      await client.close();
    });
  });

  // ── Concurrency Tests ────────────────────────────────────────────────

  describe('concurrency', () => {
    it('handles multiple concurrent clients', async () => {
      const clients: Client[] = [];
      const transports: StreamableHTTPClientTransport[] = [];

      // Connect 3 clients simultaneously
      const connectPromises = Array.from({ length: 3 }, async (_, i) => {
        const transport = createClientTransport(port, storedToken.token);
        const client = new Client({ name: `concurrent-${i}`, version: '1.0.0' });
        transports.push(transport);
        clients.push(client);
        await client.connect(transport);
        return client;
      });

      const connectedClients = await Promise.all(connectPromises);
      expect(connectedClients).toHaveLength(3);

      // All clients should be able to list tools
      const toolResults = await Promise.all(
        connectedClients.map((c) => c.listTools()),
      );
      for (const result of toolResults) {
        expect(result.tools).toHaveLength(2);
      }

      // Clean up
      await Promise.all(clients.map((c) => c.close()));
    });

    it('handles concurrent tool calls within a session', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'concurrent-calls', version: '1.0.0' });

      await client.connect(transport);

      // Fire 5 concurrent tool calls
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          client.callTool({
            name: 'echo',
            arguments: { message: `msg-${i}` },
          }),
        ),
      );

      // All should succeed
      expect(results).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        const text = (results[i]!.content as Array<{ type: string; text: string }>)[0]?.text;
        expect(text).toBe(`Echo: msg-${i}`);
      }

      await client.close();
    });
  });

  // ── Error Handling Tests ─────────────────────────────────────────────

  describe('error handling', () => {
    it('returns 404 for non-MCP endpoints', async () => {
      const response = await fetch(`http://127.0.0.1:${port}/invalid`, {
        headers: { 'Authorization': `Bearer ${storedToken.token}` },
      });
      expect(response.status).toBe(404);
    });

    it('returns 405 for unsupported HTTP methods', async () => {
      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${storedToken.token}` },
      });
      expect(response.status).toBe(405);
    });

    it('returns 401 with WWW-Authenticate header for missing auth', async () => {
      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toBe('Bearer');
    });

    it('server continues serving after malformed request', async () => {
      // Send malformed request
      await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken.token}`,
          'Content-Type': 'application/json',
        },
        body: 'this is not json{{{',
      });

      // Server should still work for valid requests
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'after-error', version: '1.0.0' });

      await client.connect(transport);
      const version = client.getServerVersion();
      expect(version?.name).toBe('test-gateway');

      await client.close();
    });
  });

  // ── Session Management Tests ─────────────────────────────────────────

  describe('session management', () => {
    it('tracks active sessions', async () => {
      expect(gateway.activeSessions()).toBe(0);

      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'session-test', version: '1.0.0' });

      await client.connect(transport);
      expect(gateway.activeSessions()).toBeGreaterThanOrEqual(1);

      await client.close();
    });

    it('returns 404 for DELETE with unknown session ID', async () => {
      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${storedToken.token}`,
          'mcp-session-id': 'nonexistent-session-id',
        },
      });
      expect(response.status).toBe(404);
    });
  });
});
