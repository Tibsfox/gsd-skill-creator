/**
 * Unit tests for agent gateway tools (agent:spawn, agent:status, agent:logs).
 *
 * Tests the agent registry, tool registration, and end-to-end tool invocation
 * through the MCP protocol.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgentRegistry } from './agent-registry.js';
import { registerAgentTools } from './agent-tools.js';
import type { AgentRecord, AgentLogEntry } from './agent-types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Call a tool on an MCP server and parse the JSON response.
 * Uses the server's internal tool handler directly.
 */
async function callTool(
  server: McpServer,
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: Record<string, unknown>; isError?: boolean }> {
  // Access the tool handlers through the server's internal state
  const toolMap = (server as unknown as {
    _registeredTools: Record<string, {
      handler: (args: Record<string, unknown>, extra: Record<string, unknown>) => Promise<{
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
      }>;
    }>;
  })._registeredTools;

  if (!toolMap) {
    throw new Error('Cannot access tool handlers -- MCP SDK internal structure may have changed');
  }

  const tool = toolMap[name];
  if (!tool) {
    throw new Error(`Tool "${name}" not found. Available: ${Object.keys(toolMap).join(', ')}`);
  }

  const response = await tool.handler(args, {});
  const text = response.content[0]?.text;
  if (!text) throw new Error('Empty response from tool');

  return {
    result: JSON.parse(text),
    isError: response.isError,
  };
}

// ── AgentRegistry Tests ─────────────────────────────────────────────────

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it('spawns an agent with correct initial state', () => {
    const record = registry.spawn({
      role: 'executor',
      skills: ['code-review', 'testing'],
    });

    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.role).toBe('executor');
    expect(record.skills).toEqual(['code-review', 'testing']);
    expect(record.state).toBe('running');
    expect(record.currentTask).toBeNull();
    expect(record.tokenUsage).toEqual({ prompt: 0, completion: 0, total: 0 });
    expect(record.team).toBeUndefined();
  });

  it('spawns an agent with team assignment', () => {
    const record = registry.spawn({
      role: 'researcher',
      skills: ['search'],
      team: 'alpha-team',
    });

    expect(record.team).toBe('alpha-team');
  });

  it('returns null for unknown agent ID', () => {
    expect(registry.getStatus('nonexistent-id')).toBeNull();
  });

  it('retrieves agent status after spawn', () => {
    const spawned = registry.spawn({ role: 'planner', skills: [] });
    const status = registry.getStatus(spawned.id);

    expect(status).not.toBeNull();
    expect(status!.id).toBe(spawned.id);
    expect(status!.role).toBe('planner');
  });

  it('returns null logs for unknown agent', () => {
    expect(registry.getLogs('nonexistent-id')).toBeNull();
  });

  it('returns spawn log entry after creation', () => {
    const record = registry.spawn({ role: 'verifier', skills: ['lint'] });
    const logs = registry.getLogs(record.id);

    expect(logs).not.toBeNull();
    expect(logs!.length).toBe(1);
    expect(logs![0]!.message).toContain('Agent spawned');
    expect(logs![0]!.level).toBe('info');
  });

  it('respects log limit parameter', () => {
    const record = registry.spawn({ role: 'executor', skills: [] });

    // Add 10 more log entries
    for (let i = 0; i < 10; i++) {
      registry.addLog(record.id, 'info', `Log entry ${i}`);
    }

    const allLogs = registry.getLogs(record.id, 100);
    expect(allLogs!.length).toBe(11); // 1 spawn + 10 added

    const limitedLogs = registry.getLogs(record.id, 3);
    expect(limitedLogs!.length).toBe(3);
    // Most recent first
    expect(limitedLogs![0]!.message).toBe('Log entry 9');
  });

  it('enforces ring buffer max size', () => {
    const maxLogs = 5;
    const smallRegistry = new AgentRegistry(maxLogs);
    const record = smallRegistry.spawn({ role: 'executor', skills: [] });

    // Add more entries than the max (spawn already added 1)
    for (let i = 0; i < 10; i++) {
      smallRegistry.addLog(record.id, 'info', `Entry ${i}`);
    }

    const logs = smallRegistry.getLogs(record.id, 100);
    expect(logs!.length).toBe(maxLogs);
    // Oldest entries should have been evicted
    expect(logs![0]!.message).toBe('Entry 9');
  });

  it('updates agent state', () => {
    const record = registry.spawn({ role: 'scout', skills: [] });
    registry.setState(record.id, 'stopped');

    const status = registry.getStatus(record.id);
    expect(status!.state).toBe('stopped');
  });

  it('updates token usage', () => {
    const record = registry.spawn({ role: 'executor', skills: [] });
    registry.updateTokenUsage(record.id, { prompt: 100, completion: 50 });

    const status = registry.getStatus(record.id);
    expect(status!.tokenUsage).toEqual({ prompt: 100, completion: 50, total: 150 });
  });

  it('sets current task', () => {
    const record = registry.spawn({ role: 'executor', skills: [] });
    registry.setCurrentTask(record.id, 'Building feature X');

    const status = registry.getStatus(record.id);
    expect(status!.currentTask).toBe('Building feature X');
  });

  it('lists all agents', () => {
    registry.spawn({ role: 'executor', skills: [] });
    registry.spawn({ role: 'planner', skills: [] });
    registry.spawn({ role: 'verifier', skills: [] });

    const all = registry.list();
    expect(all.length).toBe(3);
    expect(all.map((a) => a.role).sort()).toEqual(['executor', 'planner', 'verifier']);
  });

  it('removes an agent', () => {
    const record = registry.spawn({ role: 'executor', skills: [] });
    expect(registry.size).toBe(1);

    const removed = registry.remove(record.id);
    expect(removed).toBe(true);
    expect(registry.size).toBe(0);
    expect(registry.getStatus(record.id)).toBeNull();
    expect(registry.getLogs(record.id)).toBeNull();
  });

  it('returns false when removing nonexistent agent', () => {
    expect(registry.remove('nonexistent')).toBe(false);
  });
});

// ── Agent Tool Tests ────────────────────────────────────────────────────

describe('Agent Tools (MCP)', () => {
  let server: McpServer;
  let registry: AgentRegistry;

  beforeEach(() => {
    server = new McpServer({ name: 'test-agent-tools', version: '1.0.0' });
    registry = new AgentRegistry();
    registerAgentTools(server, registry);
  });

  describe('agent:spawn', () => {
    it('creates an agent and returns its ID and state', async () => {
      const { result } = await callTool(server, 'agent:spawn', {
        role: 'executor',
        skills: ['code-review', 'testing'],
      });

      expect(result).toHaveProperty('agentId');
      expect(result.role).toBe('executor');
      expect(result.state).toBe('running');
      expect(result.skills).toEqual(['code-review', 'testing']);
      expect(result.team).toBeNull();
      expect(registry.size).toBe(1);
    });

    it('creates an agent with team assignment', async () => {
      const { result } = await callTool(server, 'agent:spawn', {
        role: 'researcher',
        skills: ['search'],
        team: 'beta-squad',
      });

      expect(result.team).toBe('beta-squad');
    });

    it('handles concurrent spawns', async () => {
      const results = await Promise.all([
        callTool(server, 'agent:spawn', { role: 'executor', skills: ['a'] }),
        callTool(server, 'agent:spawn', { role: 'planner', skills: ['b'] }),
        callTool(server, 'agent:spawn', { role: 'verifier', skills: ['c'] }),
      ]);

      const ids = results.map((r) => r.result.agentId);
      expect(new Set(ids).size).toBe(3); // All unique IDs
      expect(registry.size).toBe(3);
    });
  });

  describe('agent:status', () => {
    it('returns full agent info for valid ID', async () => {
      const { result: spawnResult } = await callTool(server, 'agent:spawn', {
        role: 'executor',
        skills: ['testing'],
      });

      const { result } = await callTool(server, 'agent:status', {
        agentId: spawnResult.agentId as string,
      });

      expect(result.agentId).toBe(spawnResult.agentId);
      expect(result.role).toBe('executor');
      expect(result.state).toBe('running');
      expect(result.currentTask).toBeNull();
      expect(result.tokenUsage).toEqual({ prompt: 0, completion: 0, total: 0 });
      expect(result.skills).toEqual(['testing']);
    });

    it('returns error for unknown agent ID', async () => {
      const { result, isError } = await callTool(server, 'agent:status', {
        agentId: 'nonexistent-agent-id',
      });

      expect(isError).toBe(true);
      expect(result.error).toBe('Agent not found');
    });

    it('reflects token usage updates', async () => {
      const { result: spawnResult } = await callTool(server, 'agent:spawn', {
        role: 'executor',
        skills: [],
      });

      registry.updateTokenUsage(spawnResult.agentId as string, {
        prompt: 500,
        completion: 200,
      });

      const { result } = await callTool(server, 'agent:status', {
        agentId: spawnResult.agentId as string,
      });

      expect(result.tokenUsage).toEqual({ prompt: 500, completion: 200, total: 700 });
    });
  });

  describe('agent:logs', () => {
    it('returns spawn log entry for new agent', async () => {
      const { result: spawnResult } = await callTool(server, 'agent:spawn', {
        role: 'executor',
        skills: ['lint'],
      });

      const { result } = await callTool(server, 'agent:logs', {
        agentId: spawnResult.agentId as string,
      });

      expect(result.count).toBe(1);
      const entries = result.entries as AgentLogEntry[];
      expect(entries[0]!.message).toContain('Agent spawned');
    });

    it('returns error for unknown agent ID', async () => {
      const { result, isError } = await callTool(server, 'agent:logs', {
        agentId: 'nonexistent-agent-id',
      });

      expect(isError).toBe(true);
      expect(result.error).toBe('Agent not found');
    });

    it('respects limit parameter', async () => {
      const { result: spawnResult } = await callTool(server, 'agent:spawn', {
        role: 'executor',
        skills: [],
      });

      // Add extra log entries
      for (let i = 0; i < 10; i++) {
        registry.addLog(spawnResult.agentId as string, 'info', `Work item ${i}`);
      }

      const { result } = await callTool(server, 'agent:logs', {
        agentId: spawnResult.agentId as string,
        limit: 5,
      });

      expect(result.count).toBe(5);
    });

    it('returns empty array for agent with no additional logs', async () => {
      const { result: spawnResult } = await callTool(server, 'agent:spawn', {
        role: 'executor',
        skills: [],
      });

      const { result } = await callTool(server, 'agent:logs', {
        agentId: spawnResult.agentId as string,
        limit: 50,
      });

      // There's always at least the spawn log
      expect(result.count).toBe(1);
    });
  });
});
