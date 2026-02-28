/**
 * Unit tests for MCP prompt templates.
 *
 * Tests all three prompt templates using the MCP SDK's InMemoryTransport
 * for fast, isolated testing without HTTP.
 */

import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerPromptTemplates } from './prompt-templates.js';

// ── Helpers ─────────────────────────────────────────────────────────────

async function createTestSetup() {
  const server = new McpServer({
    name: 'test-prompts',
    version: '1.0.0',
  });

  registerPromptTemplates(server);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server };
}

function getMessageText(messages: Array<{ role: string; content: { type: string; text: string } }>): string {
  return messages.map((m) => m.content.text).join('\n');
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('Prompt Templates', () => {
  // ── Prompt Discovery ────────────────────────────────────────────────

  describe('prompt discovery', () => {
    it('lists all three prompt templates', async () => {
      const { client } = await createTestSetup();

      const result = await client.listPrompts();
      const names = result.prompts.map((p) => p.name);
      expect(names).toContain('create-project');
      expect(names).toContain('diagnose-agent');
      expect(names).toContain('optimize-chipset');
      expect(names).toHaveLength(3);

      await client.close();
    });
  });

  // ── create-project ──────────────────────────────────────────────────

  describe('create-project', () => {
    it('returns messages with project name and description filled in', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'create-project',
        arguments: {
          name: 'my-awesome-project',
          description: 'A tool for managing widgets',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = getMessageText(result.messages as any);
      expect(text).toContain('my-awesome-project');
      expect(text).toContain('A tool for managing widgets');

      await client.close();
    });

    it('includes domain when provided', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'create-project',
        arguments: {
          name: 'web-app',
          description: 'A web application',
          domain: 'web',
        },
      });

      const text = getMessageText(result.messages as any);
      expect(text).toContain('web');

      await client.close();
    });

    it('works without optional domain', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'create-project',
        arguments: {
          name: 'cli-tool',
          description: 'A command-line tool',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = getMessageText(result.messages as any);
      expect(text).toContain('cli-tool');

      await client.close();
    });

    it('messages have user role', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'create-project',
        arguments: {
          name: 'test',
          description: 'test',
        },
      });

      for (const msg of result.messages) {
        expect(msg.role).toBe('user');
      }

      await client.close();
    });
  });

  // ── diagnose-agent ──────────────────────────────────────────────────

  describe('diagnose-agent', () => {
    it('returns messages with agentId and symptoms filled in', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'diagnose-agent',
        arguments: {
          agentId: 'executor-1',
          symptoms: 'Agent is stuck in a loop and not completing tasks',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = getMessageText(result.messages as any);
      expect(text).toContain('executor-1');
      expect(text).toContain('stuck in a loop');

      await client.close();
    });

    it('includes context when provided', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'diagnose-agent',
        arguments: {
          agentId: 'verifier-1',
          symptoms: 'Tests failing intermittently',
          context: 'Running on low-memory machine with 4GB RAM',
        },
      });

      const text = getMessageText(result.messages as any);
      expect(text).toContain('4GB RAM');

      await client.close();
    });

    it('works without optional context', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'diagnose-agent',
        arguments: {
          agentId: 'monitor-1',
          symptoms: 'High latency',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = getMessageText(result.messages as any);
      expect(text).toContain('monitor-1');

      await client.close();
    });

    it('includes diagnostic steps', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'diagnose-agent',
        arguments: {
          agentId: 'test',
          symptoms: 'test',
        },
      });

      const text = getMessageText(result.messages as any);
      expect(text).toContain('Diagnostic Steps');
      expect(text).toContain('Check Agent Status');

      await client.close();
    });
  });

  // ── optimize-chipset ────────────────────────────────────────────────

  describe('optimize-chipset', () => {
    it('returns messages with goal filled in', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'optimize-chipset',
        arguments: {
          goal: 'Reduce context window usage by 20%',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = getMessageText(result.messages as any);
      expect(text).toContain('Reduce context window usage by 20%');

      await client.close();
    });

    it('includes constraints when provided', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'optimize-chipset',
        arguments: {
          goal: 'Improve throughput',
          constraints: 'Must keep coordinator and verifier positions',
        },
      });

      const text = getMessageText(result.messages as any);
      expect(text).toContain('Must keep coordinator and verifier positions');

      await client.close();
    });

    it('includes current config when provided', async () => {
      const { client } = await createTestSetup();

      const yamlConfig = 'name: test-chipset\nversion: 1.0.0';
      const result = await client.getPrompt({
        name: 'optimize-chipset',
        arguments: {
          goal: 'Reduce latency',
          currentConfig: yamlConfig,
        },
      });

      const text = getMessageText(result.messages as any);
      expect(text).toContain('test-chipset');

      await client.close();
    });

    it('works without optional args', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'optimize-chipset',
        arguments: {
          goal: 'Simplify topology',
        },
      });

      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      const text = getMessageText(result.messages as any);
      expect(text).toContain('Simplify topology');
      expect(text).toContain('chipset.get');

      await client.close();
    });

    it('includes optimization process steps', async () => {
      const { client } = await createTestSetup();

      const result = await client.getPrompt({
        name: 'optimize-chipset',
        arguments: {
          goal: 'test',
        },
      });

      const text = getMessageText(result.messages as any);
      expect(text).toContain('Optimization Process');
      expect(text).toContain('Analyze Current State');
      expect(text).toContain('Budget Rules');

      await client.close();
    });
  });
});
