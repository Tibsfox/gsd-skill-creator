/**
 * Unit tests for chipset MCP tools (get, modify, synthesize).
 *
 * Tests the tool handlers directly by creating MCP server instances,
 * registering the tools, and calling them through the MCP SDK.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerChipsetTools, synthesizeChipset } from './chipset-tools.js';
import { createChipsetStateManager, ChipsetStateManager } from './chipset-state.js';

// ── Helpers ─────────────────────────────────────────────────────────────

async function createTestSetup(state?: ChipsetStateManager) {
  const chipsetState = state ?? createChipsetStateManager();

  const server = new McpServer({
    name: 'test-chipset',
    version: '1.0.0',
  });

  registerChipsetTools(server, chipsetState);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server, chipsetState };
}

function parseToolResult(result: unknown): unknown {
  const r = result as { content: Array<{ type: string; text: string }> };
  return JSON.parse(r.content[0]!.text);
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('Chipset Tools', () => {
  // ── chipset.get ─────────────────────────────────────────────────────

  describe('chipset.get', () => {
    it('returns the current chipset configuration as JSON', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.get',
        arguments: {},
      });

      const config = parseToolResult(result);
      expect(config).toHaveProperty('name', 'den-v1.28');
      expect(config).toHaveProperty('version', '1.0.0');
      expect(config).toHaveProperty('positions');
      expect(config).toHaveProperty('topology');
      expect(config).toHaveProperty('totalBudget');

      await client.close();
    });

    it('returns config with all 10 Den positions', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.get',
        arguments: {},
      });

      const config = parseToolResult(result) as any;
      expect(config.positions).toHaveLength(10);
      const ids = config.positions.map((p: any) => p.id);
      expect(ids).toContain('coordinator');
      expect(ids).toContain('executor');
      expect(ids).toContain('verifier');

      await client.close();
    });
  });

  // ── chipset.modify ──────────────────────────────────────────────────

  describe('chipset.modify', () => {
    it('updates chipset name and returns diff', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.modify',
        arguments: { name: 'modified-chipset' },
      });

      const response = parseToolResult(result) as any;
      expect(response.config.name).toBe('modified-chipset');
      expect(response.diff).toContain('den-v1.28');
      expect(response.diff).toContain('modified-chipset');

      await client.close();
    });

    it('updates position token budget', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.modify',
        arguments: {
          positions: [{ id: 'executor', tokenBudget: 0.25 }],
        },
      });

      const response = parseToolResult(result) as any;
      const executor = response.config.positions.find((p: any) => p.id === 'executor');
      expect(executor.tokenBudget).toBe(0.25);

      await client.close();
    });

    it('removes positions', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.modify',
        arguments: { removePositions: ['sentinel'] },
      });

      const response = parseToolResult(result) as any;
      const sentinel = response.config.positions.find((p: any) => p.id === 'sentinel');
      expect(sentinel).toBeUndefined();

      await client.close();
    });

    it('updates topology', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.modify',
        arguments: { topologyType: 'pipeline' },
      });

      const response = parseToolResult(result) as any;
      expect(response.config.topology.type).toBe('pipeline');

      await client.close();
    });

    it('returns no-changes diff for empty update', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.modify',
        arguments: {},
      });

      const response = parseToolResult(result) as any;
      expect(response.diff).toBe('(no changes)');

      await client.close();
    });

    it('persists modification across subsequent gets', async () => {
      const { client } = await createTestSetup();

      await client.callTool({
        name: 'chipset.modify',
        arguments: { name: 'persisted-name' },
      });

      const getResult = await client.callTool({
        name: 'chipset.get',
        arguments: {},
      });

      const config = parseToolResult(getResult) as any;
      expect(config.name).toBe('persisted-name');

      await client.close();
    });
  });

  // ── chipset.synthesize ──────────────────────────────────────────────

  describe('chipset.synthesize', () => {
    it('synthesizes chipset from description with executor keyword', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.synthesize',
        arguments: { description: 'A team that executes and verifies code changes' },
      });

      const config = parseToolResult(result) as any;
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('version', '1.0.0');
      expect(config).toHaveProperty('positions');
      expect(config).toHaveProperty('topology');
      expect(config.positions.length).toBeGreaterThanOrEqual(2);

      await client.close();
    });

    it('synthesizes chipset with pipeline topology keyword', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.synthesize',
        arguments: { description: 'A sequential pipeline for building and testing' },
      });

      const config = parseToolResult(result) as any;
      expect(config.topology.type).toBe('pipeline');

      await client.close();
    });

    it('replaces current state after synthesis', async () => {
      const { client } = await createTestSetup();

      await client.callTool({
        name: 'chipset.synthesize',
        arguments: { description: 'A monitoring and planning team' },
      });

      const getResult = await client.callTool({
        name: 'chipset.get',
        arguments: {},
      });

      const config = parseToolResult(getResult) as any;
      // Should no longer be den-v1.28
      expect(config.name).not.toBe('den-v1.28');

      await client.close();
    });

    it('always includes coordinator and executor', async () => {
      const { client } = await createTestSetup();

      const result = await client.callTool({
        name: 'chipset.synthesize',
        arguments: { description: 'A simple documentation team' },
      });

      const config = parseToolResult(result) as any;
      const ids = config.positions.map((p: any) => p.id);
      expect(ids).toContain('coordinator');
      expect(ids).toContain('executor');

      await client.close();
    });
  });

  // ── synthesizeChipset (pure function) ───────────────────────────────

  describe('synthesizeChipset', () => {
    it('produces valid ChipsetConfig', () => {
      const config = synthesizeChipset('A team for executing code');
      expect(config.name).toBeTruthy();
      expect(config.version).toBe('1.0.0');
      expect(config.positions.length).toBeGreaterThanOrEqual(2);
      expect(config.topology).toBeDefined();
      expect(config.totalBudget).toBeGreaterThan(0);
      expect(config.totalBudget).toBeLessThanOrEqual(1.0);
    });

    it('detects pipeline topology', () => {
      const config = synthesizeChipset('sequential pipeline processing stages');
      expect(config.topology.type).toBe('pipeline');
    });

    it('detects parallel topology', () => {
      const config = synthesizeChipset('parallel distributed independent workers');
      expect(config.topology.type).toBe('parallel');
    });

    it('defaults to squadron for unknown keywords', () => {
      const config = synthesizeChipset('some random unrelated words');
      expect(config.topology.type).toBe('squadron');
    });

    it('extracts verifier role from description', () => {
      const config = synthesizeChipset('we need to verify and test everything');
      const ids = config.positions.map((p) => p.id);
      expect(ids).toContain('verifier');
    });

    it('extracts planner role from description', () => {
      const config = synthesizeChipset('we need to plan and design the architecture');
      const ids = config.positions.map((p) => p.id);
      expect(ids).toContain('planner');
    });

    it('handles empty-ish description gracefully', () => {
      const config = synthesizeChipset('go');
      expect(config.positions.length).toBeGreaterThanOrEqual(2);
      expect(config.topology.fallback).toBe('coordinator');
    });
  });

  // ── Tool Discovery ──────────────────────────────────────────────────

  describe('tool discovery', () => {
    it('registers all three chipset tools', async () => {
      const { client } = await createTestSetup();

      const tools = await client.listTools();
      const names = tools.tools.map((t) => t.name);
      expect(names).toContain('chipset.get');
      expect(names).toContain('chipset.modify');
      expect(names).toContain('chipset.synthesize');

      await client.close();
    });
  });
});
