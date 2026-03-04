import { describe, it, expect } from 'vitest';
import {
  planMeshWave,
  WaveTaskSchema,
  AnnotatedTaskSchema,
  MeshWavePlanSchema,
} from './wave-planner.js';
import type { WaveTask, MeshWavePlan } from './wave-planner.js';
import type { MeshNode } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

function makeNode(overrides: Partial<MeshNode> & { nodeId: string }): MeshNode {
  return {
    name: overrides.name ?? `node-${overrides.nodeId.slice(0, 8)}`,
    endpoint: overrides.endpoint ?? `https://${overrides.nodeId}.example.com`,
    capabilities: overrides.capabilities ?? [],
    registeredAt: '2025-01-01T00:00:00Z',
    lastHeartbeat: '2025-01-01T00:00:00Z',
    status: 'healthy',
    ...overrides,
  };
}

const LOCAL_ID = 'local-111-1111-1111-111111111111';

const nodeGpt4 = makeNode({
  nodeId: 'node1-111-1111-1111-111111111111',
  name: 'gpt4-node',
  capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
});

const nodeLlama = makeNode({
  nodeId: 'node2-222-2222-2222-222222222222',
  name: 'llama-node',
  capabilities: [{ chipName: 'llama', models: ['llama-7b'], maxContextLength: 4096 }],
});

const nodeClaude = makeNode({
  nodeId: 'node3-333-3333-3333-333333333333',
  name: 'claude-node',
  capabilities: [{ chipName: 'claude', models: ['claude-3'], maxContextLength: 200000 }],
});

// ============================================================================
// WaveTaskSchema
// ============================================================================

describe('WaveTaskSchema', () => {
  it('parses a valid wave task', () => {
    const input = { taskId: 'task-1', skillName: 'eval-skill', requiredChip: 'gpt-4' };
    const result = WaveTaskSchema.parse(input);
    expect(result.taskId).toBe('task-1');
    expect(result.minContextLength).toBe(0); // default
  });

  it('defaults minContextLength to 0', () => {
    const result = WaveTaskSchema.parse({
      taskId: 'task-2',
      skillName: 'test',
      requiredChip: 'claude',
    });
    expect(result.minContextLength).toBe(0);
  });

  it('rejects negative minContextLength', () => {
    expect(() =>
      WaveTaskSchema.parse({
        taskId: 'task-3',
        skillName: 'test',
        requiredChip: 'gpt-4',
        minContextLength: -1,
      }),
    ).toThrow();
  });
});

// ============================================================================
// planMeshWave
// ============================================================================

describe('planMeshWave', () => {
  it('annotates each task with a RoutingDecision', () => {
    const tasks: WaveTask[] = [
      { taskId: 'task-1', skillName: 'skill-a', requiredChip: 'gpt-4', minContextLength: 0 },
    ];
    const loads = new Map<string, number>();
    const passRates = new Map([['node1-111-1111-1111-111111111111', 0.90]]);

    const plan = planMeshWave('wave-1', tasks, [nodeGpt4], LOCAL_ID, loads, passRates);

    expect(plan.waveId).toBe('wave-1');
    expect(plan.tasks).toHaveLength(1);
    expect(plan.tasks[0].routing).toBeDefined();
    expect(plan.tasks[0].routing.taskId).toBe('task-1');
  });

  it('3 tasks with 3 chips route to 3 different nodes', () => {
    const tasks: WaveTask[] = [
      { taskId: 'task-1', skillName: 'skill-a', requiredChip: 'gpt-4', minContextLength: 0 },
      { taskId: 'task-2', skillName: 'skill-b', requiredChip: 'llama', minContextLength: 0 },
      { taskId: 'task-3', skillName: 'skill-c', requiredChip: 'claude', minContextLength: 0 },
    ];
    const loads = new Map<string, number>();
    const passRates = new Map([
      ['node1-111-1111-1111-111111111111', 0.80],
      ['node2-222-2222-2222-222222222222', 0.85],
      ['node3-333-3333-3333-333333333333', 0.90],
    ]);

    const plan = planMeshWave(
      'wave-2',
      tasks,
      [nodeGpt4, nodeLlama, nodeClaude],
      LOCAL_ID,
      loads,
      passRates,
    );

    // Each task should route to the node with matching capability
    const targetIds = plan.tasks.map((t) => t.routing.target.nodeId);
    expect(new Set(targetIds).size).toBe(3); // All different nodes
  });

  it('produces descriptive justification when no capable node', () => {
    const tasks: WaveTask[] = [
      { taskId: 'task-1', skillName: 'skill-a', requiredChip: 'mistral', minContextLength: 0 },
    ];

    const plan = planMeshWave('wave-3', tasks, [nodeGpt4], LOCAL_ID, new Map(), new Map());

    expect(plan.tasks[0].routing.routingJustification).toContain(
      "No capable node for chip 'mistral'",
    );
    expect(plan.tasks[0].routing.target.totalScore).toBe(0);
  });

  it('handles empty tasks array', () => {
    const plan = planMeshWave('wave-4', [], [nodeGpt4], LOCAL_ID, new Map(), new Map());

    expect(plan.tasks).toHaveLength(0);
    expect(plan.waveId).toBe('wave-4');
  });

  it('handles empty nodes array', () => {
    const tasks: WaveTask[] = [
      { taskId: 'task-1', skillName: 'skill-a', requiredChip: 'gpt-4', minContextLength: 0 },
    ];

    const plan = planMeshWave('wave-5', tasks, [], LOCAL_ID, new Map(), new Map());

    expect(plan.tasks[0].routing.routingJustification).toContain('No capable node');
  });

  it('includes createdAt as ISO 8601 datetime', () => {
    const plan = planMeshWave(
      'wave-6',
      [{ taskId: 't1', skillName: 's1', requiredChip: 'gpt-4', minContextLength: 0 }],
      [nodeGpt4],
      LOCAL_ID,
      new Map(),
      new Map([['node1-111-1111-1111-111111111111', 0.80]]),
    );

    expect(() => new Date(plan.createdAt)).not.toThrow();
    expect(plan.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('filters out unhealthy nodes', () => {
    const unhealthyNode = makeNode({
      nodeId: 'unhealthy-1111-1111-1111-111111111',
      capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
      status: 'evicted',
    });

    const tasks: WaveTask[] = [
      { taskId: 'task-1', skillName: 'skill-a', requiredChip: 'gpt-4', minContextLength: 0 },
    ];

    const plan = planMeshWave(
      'wave-7',
      tasks,
      [unhealthyNode],
      LOCAL_ID,
      new Map(),
      new Map(),
    );

    expect(plan.tasks[0].routing.routingJustification).toContain('No capable node');
  });
});

// ============================================================================
// Schema validation
// ============================================================================

describe('MeshWavePlanSchema', () => {
  it('validates a complete plan', () => {
    const plan = planMeshWave(
      'wave-schema',
      [{ taskId: 't1', skillName: 's1', requiredChip: 'gpt-4', minContextLength: 0 }],
      [nodeGpt4],
      LOCAL_ID,
      new Map(),
      new Map([['node1-111-1111-1111-111111111111', 0.80]]),
    );

    expect(() => MeshWavePlanSchema.parse(plan)).not.toThrow();
  });
});
