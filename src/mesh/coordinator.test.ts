import { describe, it, expect, vi } from 'vitest';
import { MeshCoordinator, createMeshCoordinator } from './coordinator.js';
import type { DiscoveryService } from './discovery.js';
import type { MeshTransport, TransportResult } from './transport.js';
import type { MeshNode } from './types.js';
import type { RoutingRequest } from './routing-types.js';

// ============================================================================
// Mock factories
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
const CLOUD_ID = 'cloud-222-2222-2222-222222222222';
const THIRD_ID = 'third-333-3333-3333-333333333333';

const localNode = makeNode({
  nodeId: LOCAL_ID,
  name: 'local-workstation',
  capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
});

const cloudNode = makeNode({
  nodeId: CLOUD_ID,
  name: 'cloud-gpu',
  capabilities: [{ chipName: 'gpt-4', models: ['gpt-4-turbo'], maxContextLength: 128000 }],
});

const thirdNode = makeNode({
  nodeId: THIRD_ID,
  name: 'third-node',
  capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
});

function successResult(): TransportResult {
  return {
    success: true,
    payload: 'compressed-data',
    compression: { type: 'none', originalSize: 100, compressedSize: 100 },
  };
}

function failResult(error: string): TransportResult {
  return { success: false, error };
}

function makeMockDiscovery(nodes: MeshNode[]): DiscoveryService {
  const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
  return {
    listHealthy: vi.fn(() => nodes.filter((n) => n.status === 'healthy')),
    listAll: vi.fn(() => nodes),
    getNode: vi.fn((id: string) => nodeMap.get(id)),
    register: vi.fn(),
    deregister: vi.fn(),
    heartbeat: vi.fn(),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    evictStale: vi.fn(),
  } as unknown as DiscoveryService;
}

function makeMockTransport(sendFn: (source: string, target: string, data: string) => Promise<TransportResult>): MeshTransport {
  return {
    send: vi.fn(sendFn),
    receive: vi.fn(),
    relay: vi.fn(),
  } as unknown as MeshTransport;
}

const defaultRequest: RoutingRequest = {
  taskId: 'task-1',
  requiredCapability: { chipName: 'gpt-4', minContextLength: 0 },
  preferLocal: true,
};

// ============================================================================
// dispatchTask
// ============================================================================

describe('MeshCoordinator.dispatchTask', () => {
  it('routes to best-scored node and returns success', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode]);
    const transport = makeMockTransport(async () => successResult());
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID, {
      passRates: new Map([[LOCAL_ID, 0.80]]),
    });

    const result = await coord.dispatchTask(defaultRequest, 'bundle-data');

    expect(result.success).toBe(true);
    expect(result.decision.taskId).toBe('task-1');
    expect(result.failoverUsed).toBe(false);
    expect(transport.send).toHaveBeenCalledOnce();
  });

  it('returns error when no healthy nodes', async () => {
    const discovery = makeMockDiscovery([]);
    const transport = makeMockTransport(async () => successResult());
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID);

    const result = await coord.dispatchTask(defaultRequest, 'bundle-data');

    expect(result.success).toBe(false);
    expect(result.error).toContain('No healthy nodes');
  });

  it('automatically fails over to fallback when primary fails (MESH-04)', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode]);
    let callCount = 0;
    const transport = makeMockTransport(async (_s, target) => {
      callCount++;
      if (callCount === 1) return failResult('Connection refused');
      return successResult();
    });
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID, {
      passRates: new Map([[LOCAL_ID, 0.80], [CLOUD_ID, 0.90]]),
    });

    const result = await coord.dispatchTask(defaultRequest, 'bundle-data');

    expect(result.success).toBe(true);
    expect(result.failoverUsed).toBe(true);
    expect(result.decision.routingJustification).toContain('rerouted to fallback');
    expect(transport.send).toHaveBeenCalledTimes(2);
  });

  it('returns failure when primary fails and no fallback', async () => {
    const discovery = makeMockDiscovery([localNode]);
    const transport = makeMockTransport(async () => failResult('Timeout'));
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID, {
      passRates: new Map([[LOCAL_ID, 0.80]]),
    });

    const result = await coord.dispatchTask(defaultRequest, 'bundle-data');

    expect(result.success).toBe(false);
    expect(result.error).toContain('no fallback available');
    expect(result.failoverUsed).toBe(false);
  });

  it('returns failure when both primary and fallback fail', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode]);
    const transport = makeMockTransport(async () => failResult('Network error'));
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID, {
      passRates: new Map([[LOCAL_ID, 0.80], [CLOUD_ID, 0.90]]),
    });

    const result = await coord.dispatchTask(defaultRequest, 'bundle-data');

    expect(result.success).toBe(false);
    expect(result.failoverUsed).toBe(true);
    expect(result.error).toContain('Fallback also failed');
  });

  it('uses updateLoad and updatePassRate for scoring', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode]);
    const transport = makeMockTransport(async () => successResult());
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID);

    coord.updateLoad(LOCAL_ID, 0.1);
    coord.updatePassRate(LOCAL_ID, 0.85);
    coord.updatePassRate(CLOUD_ID, 0.70);

    const result = await coord.dispatchTask(defaultRequest, 'bundle-data');

    expect(result.success).toBe(true);
    // Local should be selected due to pass rate >= 0.70
    expect(result.decision.target.nodeId).toBe(LOCAL_ID);
  });
});

// ============================================================================
// dispatchParallel
// ============================================================================

describe('MeshCoordinator.dispatchParallel', () => {
  it('sends same bundle to all targets via Promise.allSettled (MESH-02)', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode, thirdNode]);
    const transport = makeMockTransport(async () => successResult());
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID);

    const results = await coord.dispatchParallel(
      defaultRequest,
      'parallel-bundle',
      [LOCAL_ID, CLOUD_ID, THIRD_ID],
    );

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
    expect(transport.send).toHaveBeenCalledTimes(3);
  });

  it('returns individual failures without affecting others', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode]);
    const transport = makeMockTransport(async (_s, target) => {
      if (target === CLOUD_ID) return failResult('Node down');
      return successResult();
    });
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID);

    const results = await coord.dispatchParallel(
      defaultRequest,
      'bundle',
      [LOCAL_ID, CLOUD_ID],
    );

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].error).toContain('Node down');
  });

  it('handles unknown target node gracefully', async () => {
    const discovery = makeMockDiscovery([localNode]);
    const transport = makeMockTransport(async () => failResult('Not found'));
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID);

    const results = await coord.dispatchParallel(
      defaultRequest,
      'bundle',
      ['unknown-node-id'],
    );

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
  });
});

// ============================================================================
// dispatchPipeline
// ============================================================================

describe('MeshCoordinator.dispatchPipeline', () => {
  it('executes stages sequentially (MESH-02)', async () => {
    const discovery = makeMockDiscovery([localNode, cloudNode]);
    const callOrder: string[] = [];
    const transport = makeMockTransport(async (_s, target) => {
      callOrder.push(target);
      return successResult();
    });
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID, {
      passRates: new Map([[LOCAL_ID, 0.80]]),
    });

    const stages = [
      { request: { ...defaultRequest, taskId: 'stage-1' }, bundleData: 'data-1' },
      { request: { ...defaultRequest, taskId: 'stage-2' }, bundleData: 'data-2' },
    ];

    const result = await coord.dispatchPipeline(stages);

    expect(result.success).toBe(true);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(2);
    expect(result.stages).toHaveLength(2);
  });

  it('aborts on stage failure and returns partial results', async () => {
    const discovery = makeMockDiscovery([localNode]);
    let callCount = 0;
    const transport = makeMockTransport(async () => {
      callCount++;
      if (callCount === 2) return failResult('Stage 2 failed');
      return successResult();
    });
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID, {
      passRates: new Map([[LOCAL_ID, 0.80]]),
    });

    const stages = [
      { request: { ...defaultRequest, taskId: 'stage-1' }, bundleData: 'data-1' },
      { request: { ...defaultRequest, taskId: 'stage-2' }, bundleData: 'data-2' },
      { request: { ...defaultRequest, taskId: 'stage-3' }, bundleData: 'data-3' },
    ];

    const result = await coord.dispatchPipeline(stages);

    expect(result.success).toBe(false);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(3);
    expect(result.stages).toHaveLength(2); // Stage 1 success + Stage 2 failure
  });

  it('handles empty pipeline', async () => {
    const discovery = makeMockDiscovery([localNode]);
    const transport = makeMockTransport(async () => successResult());
    const coord = new MeshCoordinator(discovery, transport, LOCAL_ID);

    const result = await coord.dispatchPipeline([]);

    expect(result.success).toBe(true);
    expect(result.completed).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ============================================================================
// createMeshCoordinator factory
// ============================================================================

describe('createMeshCoordinator', () => {
  it('creates a MeshCoordinator instance', () => {
    const discovery = makeMockDiscovery([]);
    const transport = makeMockTransport(async () => successResult());
    const coord = createMeshCoordinator(discovery, transport, LOCAL_ID);
    expect(coord).toBeInstanceOf(MeshCoordinator);
  });
});
