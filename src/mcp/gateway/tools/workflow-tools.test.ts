/**
 * Unit tests for workflow gateway tools (workflow:research, workflow:requirements,
 * workflow:plan, workflow:execute).
 *
 * Tests the workflow engine and end-to-end tool invocation through MCP.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WorkflowEngine } from './workflow-engine.js';
import { registerWorkflowTools } from './workflow-tools.js';
import type {
  ResearchResult,
  RequirementsResult,
  PlanResult,
  ExecuteResult,
} from './workflow-types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Call a tool on an MCP server and parse the JSON response.
 */
async function callTool(
  server: McpServer,
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: Record<string, unknown>; isError?: boolean }> {
  const toolMap = (server as unknown as {
    _registeredTools: Record<string, {
      handler: (args: Record<string, unknown>, extra: Record<string, unknown>) => Promise<{
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
      }>;
    }>;
  })._registeredTools;

  if (!toolMap) {
    throw new Error('Cannot access tool handlers');
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

// ── WorkflowEngine Tests ────────────────────────────────────────────────

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  describe('research', () => {
    it('returns structured findings for a domain', async () => {
      const result = await engine.research('my-project', 'mcp-integration', 2);

      expect(result.project).toBe('my-project');
      expect(result.domain).toBe('mcp-integration');
      expect(result.depth).toBe(2);
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
      expect(result.completedAt).toBeGreaterThan(0);
    });

    it('defaults depth to 1', async () => {
      const result = await engine.research('project', 'testing');

      expect(result.depth).toBe(1);
      expect(result.findings.length).toBe(2);
    });

    it('scales findings and recommendations with depth', async () => {
      const shallow = await engine.research('project', 'domain', 1);
      const deep = await engine.research('project', 'domain', 3);

      expect(deep.findings.length).toBeGreaterThan(shallow.findings.length);
      expect(deep.recommendations.length).toBeGreaterThan(shallow.recommendations.length);
    });
  });

  describe('requirements', () => {
    it('returns all requirements without scope filter', async () => {
      const result = await engine.requirements('my-project');

      expect(result.project).toBe('my-project');
      expect(result.scope).toBeNull();
      expect(result.requirements.length).toBe(6);
      expect(Object.keys(result.categories).length).toBeGreaterThan(0);
    });

    it('filters requirements by scope', async () => {
      const result = await engine.requirements('my-project', 'core');

      expect(result.scope).toBe('core');
      expect(result.requirements.every((r) => r.category === 'core')).toBe(true);
      expect(result.requirements.length).toBe(2);
    });

    it('returns empty for unknown scope', async () => {
      const result = await engine.requirements('my-project', 'nonexistent');

      expect(result.requirements.length).toBe(0);
      expect(Object.keys(result.categories).length).toBe(0);
    });
  });

  describe('plan', () => {
    it('returns all phases without filter', async () => {
      const result = await engine.plan('my-project');

      expect(result.project).toBe('my-project');
      expect(result.phaseNumber).toBeNull();
      expect(result.phases.length).toBe(5);
      expect(result.totalWaves).toBe(3);
      expect(result.totalTasks).toBeGreaterThan(0);
    });

    it('filters to a specific phase', async () => {
      const result = await engine.plan('my-project', 3);

      expect(result.phaseNumber).toBe(3);
      expect(result.phases.length).toBe(1);
      expect(result.phases[0]!.phase).toBe(3);
    });

    it('includes wave assignments and dependencies', async () => {
      const result = await engine.plan('my-project');

      const phase3 = result.phases.find((p) => p.phase === 3);
      expect(phase3).toBeDefined();
      expect(phase3!.wave).toBe(2);
      expect(phase3!.dependencies).toEqual([1, 2]);
    });
  });

  describe('execute', () => {
    it('returns all stages on full execution', async () => {
      const result = await engine.execute('my-project');

      expect(result.project).toBe('my-project');
      expect(result.dryRun).toBe(false);
      expect(result.stages.length).toBe(4);
      expect(result.success).toBe(true);
      expect(result.totalDurationMs).toBeGreaterThan(0);
    });

    it('returns zero-duration stages for dry run', async () => {
      const result = await engine.execute('my-project', { dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(result.stages.every((s) => s.durationMs === 0)).toBe(true);
      expect(result.totalDurationMs).toBe(0);
      // Dry run summaries should indicate planned actions
      expect(result.stages[0]!.summary).toContain('Would');
    });

    it('passes phase filter to execute', async () => {
      const result = await engine.execute('my-project', { phaseFilter: 2 });

      expect(result.phaseFilter).toBe(2);
    });
  });

  describe('invocation tracking', () => {
    it('records all invocations', async () => {
      await engine.research('p1', 'domain');
      await engine.requirements('p2');
      await engine.plan('p1');

      const all = engine.getInvocations();
      expect(all.length).toBe(3);
    });

    it('filters invocations by project', async () => {
      await engine.research('p1', 'domain');
      await engine.requirements('p2');
      await engine.plan('p1');

      const p1 = engine.getProjectInvocations('p1');
      expect(p1.length).toBe(2);
      expect(p1.every((i) => i.project === 'p1')).toBe(true);
    });
  });
});

// ── Workflow Tool Tests ─────────────────────────────────────────────────

describe('Workflow Tools (MCP)', () => {
  let server: McpServer;
  let engine: WorkflowEngine;

  beforeEach(() => {
    server = new McpServer({ name: 'test-workflow-tools', version: '1.0.0' });
    engine = new WorkflowEngine();
    registerWorkflowTools(server, engine);
  });

  describe('workflow:research', () => {
    it('returns structured findings for a domain', async () => {
      const { result } = await callTool(server, 'workflow:research', {
        project: 'my-project',
        domain: 'mcp-integration',
        depth: 2,
      });

      const typed = result as unknown as ResearchResult;
      expect(typed.project).toBe('my-project');
      expect(typed.domain).toBe('mcp-integration');
      expect(typed.findings.length).toBeGreaterThanOrEqual(2);
      expect(typed.recommendations.length).toBeGreaterThanOrEqual(2);
    });

    it('uses default depth of 1', async () => {
      const { result } = await callTool(server, 'workflow:research', {
        project: 'my-project',
        domain: 'testing',
      });

      const typed = result as unknown as ResearchResult;
      expect(typed.depth).toBe(1);
    });
  });

  describe('workflow:requirements', () => {
    it('generates requirements without scope filter', async () => {
      const { result } = await callTool(server, 'workflow:requirements', {
        project: 'my-project',
      });

      const typed = result as unknown as RequirementsResult;
      expect(typed.project).toBe('my-project');
      expect(typed.scope).toBeNull();
      expect(typed.requirements.length).toBe(6);
    });

    it('filters requirements by scope', async () => {
      const { result } = await callTool(server, 'workflow:requirements', {
        project: 'my-project',
        scope: 'testing',
      });

      const typed = result as unknown as RequirementsResult;
      expect(typed.scope).toBe('testing');
      expect(typed.requirements.every((r) => r.category === 'testing')).toBe(true);
    });
  });

  describe('workflow:plan', () => {
    it('creates plan for all phases', async () => {
      const { result } = await callTool(server, 'workflow:plan', {
        project: 'my-project',
      });

      const typed = result as unknown as PlanResult;
      expect(typed.phases.length).toBe(5);
      expect(typed.totalWaves).toBe(3);
    });

    it('creates plan for a specific phase', async () => {
      const { result } = await callTool(server, 'workflow:plan', {
        project: 'my-project',
        phaseNumber: 2,
      });

      const typed = result as unknown as PlanResult;
      expect(typed.phaseNumber).toBe(2);
      expect(typed.phases.length).toBe(1);
    });
  });

  describe('workflow:execute', () => {
    it('executes full pipeline', async () => {
      const { result } = await callTool(server, 'workflow:execute', {
        project: 'my-project',
      });

      const typed = result as unknown as ExecuteResult;
      expect(typed.success).toBe(true);
      expect(typed.stages.length).toBe(4);
      expect(typed.dryRun).toBe(false);
    });

    it('performs dry run without executing', async () => {
      const { result } = await callTool(server, 'workflow:execute', {
        project: 'my-project',
        dryRun: true,
      });

      const typed = result as unknown as ExecuteResult;
      expect(typed.dryRun).toBe(true);
      expect(typed.totalDurationMs).toBe(0);
    });

    it('accepts phase filter', async () => {
      const { result } = await callTool(server, 'workflow:execute', {
        project: 'my-project',
        phaseFilter: 3,
      });

      const typed = result as unknown as ExecuteResult;
      expect(typed.phaseFilter).toBe(3);
    });
  });
});
