import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeshExecutor } from './executor.js';
import type { MeshCoordinator, DispatchResult } from './coordinator.js';
import type { MeshTransport, TransportResult } from './transport.js';
import type { DiscoveryService } from './discovery.js';
import type { MeshEventLog } from './event-log.js';
import type { AnnotatedTask, MeshWavePlan } from './wave-planner.js';
import type { RoutingDecision, NodeScore } from './routing-types.js';

// ============================================================================
// Mock factories
// ============================================================================

const LOCAL_ID = 'local-111';
const CLOUD_ID = 'cloud-222';
const THIRD_ID = 'third-333';

function makeNodeScore(nodeId: string): NodeScore {
  return {
    nodeId,
    chipName: 'gpt-4',
    capabilityScore: 0.8,
    loadScore: 0.9,
    performanceScore: 0.85,
    totalScore: 0.85,
    justification: `Score for ${nodeId}`,
  };
}

function makeRouting(taskId: string, targetId: string, fallbackId?: string): RoutingDecision {
  return {
    taskId,
    target: makeNodeScore(targetId),
    fallback: fallbackId ? makeNodeScore(fallbackId) : undefined,
    routingJustification: `Route ${taskId} to ${targetId}`,
  };
}

function makeTask(taskId: string, targetId: string, fallbackId?: string): AnnotatedTask {
  return {
    taskId,
    skillName: `skill-${taskId}`,
    requiredChip: 'gpt-4',
    minContextLength: 0,
    routing: makeRouting(taskId, targetId, fallbackId),
  };
}

function makePlan(tasks: AnnotatedTask[]): MeshWavePlan {
  return {
    waveId: 'wave-test-1',
    tasks,
    createdAt: new Date().toISOString(),
  };
}

function successDispatch(taskId: string, failoverUsed = false): DispatchResult {
  return {
    success: true,
    decision: makeRouting(taskId, LOCAL_ID),
    transportResult: { success: true, payload: 'result-data', compression: { type: 'none', originalSize: 10, compressedSize: 10 } },
    failoverUsed,
  };
}

function failDispatch(taskId: string, error: string): DispatchResult {
  return {
    success: false,
    decision: makeRouting(taskId, LOCAL_ID),
    failoverUsed: false,
    error,
  };
}

function failoverSuccessDispatch(taskId: string, fallbackId: string): DispatchResult {
  return {
    success: true,
    decision: makeRouting(taskId, LOCAL_ID, fallbackId),
    transportResult: { success: true, payload: 'fallback-data' },
    failoverUsed: true,
  };
}

function failoverFailDispatch(taskId: string, fallbackId: string): DispatchResult {
  return {
    success: false,
    decision: makeRouting(taskId, LOCAL_ID, fallbackId),
    failoverUsed: true,
    error: 'Primary: connection refused; Fallback: timeout',
  };
}

function makeMockCoordinator(dispatchFn?: (req: unknown, data: string) => Promise<DispatchResult>): MeshCoordinator {
  return {
    dispatchTask: vi.fn(dispatchFn ?? (async () => successDispatch('task-1'))),
    dispatchParallel: vi.fn(async (_req: unknown, _data: string, targetIds: string[]) =>
      targetIds.map((id) => ({
        success: id !== 'fail-node',
        decision: makeRouting('task-1', id),
        transportResult: id !== 'fail-node' ? { success: true, payload: `data-${id}` } : undefined,
        failoverUsed: false,
        error: id === 'fail-node' ? 'Node down' : undefined,
      } as DispatchResult)),
    ),
    dispatchPipeline: vi.fn(),
    updateLoad: vi.fn(),
    updatePassRate: vi.fn(),
  } as unknown as MeshCoordinator;
}

function makeMockTransport(): MeshTransport {
  return {
    send: vi.fn(async () => ({ success: true, payload: 'data' })),
    receive: vi.fn(),
    relay: vi.fn(),
  } as unknown as MeshTransport;
}

function makeMockDiscovery(): DiscoveryService {
  return {
    listHealthy: vi.fn(() => []),
    listAll: vi.fn(() => []),
    getNode: vi.fn(),
    register: vi.fn(),
    deregister: vi.fn(),
    heartbeat: vi.fn(),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    evictStale: vi.fn(),
  } as unknown as DiscoveryService;
}

function makeMockEventLog(): MeshEventLog {
  return {
    write: vi.fn(async () => ({
      id: 'evt-1',
      timestamp: new Date().toISOString(),
      nodeId: 'local',
      eventType: 'health-change' as const,
      payload: {},
    })),
    readAll: vi.fn(async () => []),
  } as unknown as MeshEventLog;
}

// ============================================================================
// executeWave
// ============================================================================

describe('MeshExecutor.executeWave', () => {
  let coordinator: MeshCoordinator;
  let transport: MeshTransport;
  let discovery: DiscoveryService;
  let eventLog: MeshEventLog;

  beforeEach(() => {
    coordinator = makeMockCoordinator();
    transport = makeMockTransport();
    discovery = makeMockDiscovery();
    eventLog = makeMockEventLog();
  });

  it('3 tasks all succeed', async () => {
    const coord = makeMockCoordinator(async (req: any) => successDispatch(req.taskId));
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([
      makeTask('t1', LOCAL_ID),
      makeTask('t2', CLOUD_ID),
      makeTask('t3', THIRD_ID),
    ]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(true);
    expect(result.partialSuccess).toBe(false);
    expect(result.completedCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.waveId).toBe('wave-test-1');
    expect(result.tasks).toHaveLength(3);
  });

  it('3 tasks, 1 fails (no fallback) -> partial success', async () => {
    let callIdx = 0;
    const coord = makeMockCoordinator(async (req: any) => {
      callIdx++;
      if (callIdx === 2) return failDispatch(req.taskId, 'Node unreachable');
      return successDispatch(req.taskId);
    });
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([
      makeTask('t1', LOCAL_ID),
      makeTask('t2', CLOUD_ID),
      makeTask('t3', THIRD_ID),
    ]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(false);
    expect(result.partialSuccess).toBe(true);
    expect(result.completedCount).toBe(2);
    expect(result.failedCount).toBe(1);
    const failedTask = result.tasks.find((t) => !t.success);
    expect(failedTask?.error).toContain('Node unreachable');
  });

  it('all tasks fail -> no partial success', async () => {
    const coord = makeMockCoordinator(async (req: any) => failDispatch(req.taskId, 'Down'));
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([
      makeTask('t1', LOCAL_ID),
      makeTask('t2', CLOUD_ID),
      makeTask('t3', THIRD_ID),
    ]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(false);
    expect(result.partialSuccess).toBe(false);
    expect(result.completedCount).toBe(0);
    expect(result.failedCount).toBe(3);
  });

  it('empty plan -> success with zero counts', async () => {
    const executor = new MeshExecutor(coordinator, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(true);
    expect(result.partialSuccess).toBe(false);
    expect(result.completedCount).toBe(0);
    expect(result.failedCount).toBe(0);
  });

  it('task timeout -> failed with timeout error', async () => {
    const coord = makeMockCoordinator(async (req: any) => {
      // Simulate slow dispatch
      await new Promise((resolve) => setTimeout(resolve, 200));
      return successDispatch(req.taskId);
    });
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([makeTask('t1', LOCAL_ID)]);

    const result = await executor.executeWave(plan, { taskTimeoutMs: 50 });

    expect(result.success).toBe(false);
    expect(result.tasks[0].success).toBe(false);
    expect(result.tasks[0].error).toContain('timeout');
  });

  it('totalDurationMs is positive', async () => {
    const coord = makeMockCoordinator(async (req: any) => successDispatch(req.taskId));
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([makeTask('t1', LOCAL_ID)]);

    const result = await executor.executeWave(plan);

    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('each task has stateTransitions array', async () => {
    const coord = makeMockCoordinator(async (req: any) => successDispatch(req.taskId));
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([makeTask('t1', LOCAL_ID)]);

    const result = await executor.executeWave(plan);

    const task = result.tasks[0];
    expect(task.stateTransitions.length).toBeGreaterThanOrEqual(2);
    for (const t of task.stateTransitions) {
      expect(t.from).toBeDefined();
      expect(t.to).toBeDefined();
      expect(t.timestamp).toBeDefined();
    }
  });

  it('maxConcurrency limits parallel dispatch', async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;
    const coord = makeMockCoordinator(async (req: any) => {
      concurrentCount++;
      if (concurrentCount > maxConcurrent) maxConcurrent = concurrentCount;
      await new Promise((resolve) => setTimeout(resolve, 20));
      concurrentCount--;
      return successDispatch(req.taskId);
    });
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([
      makeTask('t1', LOCAL_ID),
      makeTask('t2', CLOUD_ID),
      makeTask('t3', THIRD_ID),
      makeTask('t4', LOCAL_ID),
    ]);

    await executor.executeWave(plan, { maxConcurrency: 2 });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  // ── Failover ────────────────────────────────────────────────────────────

  it('primary fails + fallback succeeds -> failoverUsed: true', async () => {
    const coord = makeMockCoordinator(async (req: any) =>
      failoverSuccessDispatch(req.taskId, CLOUD_ID),
    );
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([makeTask('t1', LOCAL_ID, CLOUD_ID)]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(true);
    expect(result.tasks[0].success).toBe(true);
    expect(result.tasks[0].failoverUsed).toBe(true);
  });

  it('primary fails + fallback fails -> both errors', async () => {
    const coord = makeMockCoordinator(async (req: any) =>
      failoverFailDispatch(req.taskId, CLOUD_ID),
    );
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([makeTask('t1', LOCAL_ID, CLOUD_ID)]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(false);
    expect(result.tasks[0].success).toBe(false);
    expect(result.tasks[0].failoverUsed).toBe(true);
    expect(result.tasks[0].error).toBeDefined();
  });

  it('never throws even on unexpected errors', async () => {
    const coord = makeMockCoordinator(async () => {
      throw new Error('Unexpected crash');
    });
    const executor = new MeshExecutor(coord, transport, discovery, eventLog, LOCAL_ID);
    const plan = makePlan([makeTask('t1', LOCAL_ID)]);

    const result = await executor.executeWave(plan);

    expect(result.success).toBe(false);
    expect(result.tasks[0].success).toBe(false);
    expect(result.tasks[0].error).toContain('Unexpected crash');
  });
});

// ============================================================================
// executePipeline
// ============================================================================

describe('MeshExecutor.executePipeline', () => {
  it('3 stages succeed, output chains as input', async () => {
    let stageIdx = 0;
    const coord = makeMockCoordinator(async (_req: any, data: string) => {
      stageIdx++;
      return {
        success: true,
        decision: makeRouting(`stage-${stageIdx}`, LOCAL_ID),
        transportResult: { success: true, payload: `output-stage-${stageIdx}` },
        failoverUsed: false,
      };
    });
    const executor = new MeshExecutor(coord, makeMockTransport(), makeMockDiscovery(), makeMockEventLog(), LOCAL_ID);

    const stages = [
      { task: makeTask('s1', LOCAL_ID), bundleData: 'initial-data' },
      { task: makeTask('s2', CLOUD_ID), bundleData: '' },
      { task: makeTask('s3', THIRD_ID), bundleData: '' },
    ];

    const result = await executor.executePipeline(stages);

    expect(result.success).toBe(true);
    expect(result.completed).toBe(3);
    expect(result.total).toBe(3);
    expect(result.finalOutput).toBeDefined();

    // Verify chaining: stage 2 should receive stage 1's output
    const dispatchCalls = (coord.dispatchTask as ReturnType<typeof vi.fn>).mock.calls;
    expect(dispatchCalls[1][1]).toBe('output-stage-1');
    expect(dispatchCalls[2][1]).toBe('output-stage-2');
  });

  it('stage 2 fails -> abort, return partial', async () => {
    let callIdx = 0;
    const coord = makeMockCoordinator(async (req: any) => {
      callIdx++;
      if (callIdx === 2) return failDispatch(req.taskId, 'Stage 2 broken');
      return successDispatch(req.taskId);
    });
    const executor = new MeshExecutor(coord, makeMockTransport(), makeMockDiscovery(), makeMockEventLog(), LOCAL_ID);

    const stages = [
      { task: makeTask('s1', LOCAL_ID), bundleData: 'data-1' },
      { task: makeTask('s2', CLOUD_ID), bundleData: 'data-2' },
      { task: makeTask('s3', THIRD_ID), bundleData: 'data-3' },
    ];

    const result = await executor.executePipeline(stages);

    expect(result.success).toBe(false);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(3);
    expect(result.stages).toHaveLength(2);
    // Stage 3 was never attempted
    expect(coord.dispatchTask).toHaveBeenCalledTimes(2);
  });

  it('empty pipeline succeeds', async () => {
    const executor = new MeshExecutor(
      makeMockCoordinator(), makeMockTransport(), makeMockDiscovery(), makeMockEventLog(), LOCAL_ID,
    );
    const result = await executor.executePipeline([]);

    expect(result.success).toBe(true);
    expect(result.completed).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ============================================================================
// executeParallel
// ============================================================================

describe('MeshExecutor.executeParallel', () => {
  it('dispatches to 3 nodes, all return results', async () => {
    const executor = new MeshExecutor(
      makeMockCoordinator(), makeMockTransport(), makeMockDiscovery(), makeMockEventLog(), LOCAL_ID,
    );
    const task = makeTask('t1', LOCAL_ID);

    const result = await executor.executeParallel(task, [LOCAL_ID, CLOUD_ID, THIRD_ID]);

    expect(result.taskId).toBe('t1');
    expect(result.results).toHaveLength(3);
    expect(result.completedCount).toBe(3);
    expect(result.failedCount).toBe(0);
  });

  it('1 of 3 nodes fails -> still returns all 3 results', async () => {
    const executor = new MeshExecutor(
      makeMockCoordinator(), makeMockTransport(), makeMockDiscovery(), makeMockEventLog(), LOCAL_ID,
    );
    const task = makeTask('t1', LOCAL_ID);

    const result = await executor.executeParallel(task, [LOCAL_ID, 'fail-node', THIRD_ID]);

    expect(result.results).toHaveLength(3);
    expect(result.completedCount).toBe(2);
    expect(result.failedCount).toBe(1);
  });

  it('results include per-node targetNodeId', async () => {
    const executor = new MeshExecutor(
      makeMockCoordinator(), makeMockTransport(), makeMockDiscovery(), makeMockEventLog(), LOCAL_ID,
    );
    const task = makeTask('t1', LOCAL_ID);

    const result = await executor.executeParallel(task, [LOCAL_ID, CLOUD_ID]);

    expect(result.results[0].targetNodeId).toBe(LOCAL_ID);
    expect(result.results[1].targetNodeId).toBe(CLOUD_ID);
  });
});
