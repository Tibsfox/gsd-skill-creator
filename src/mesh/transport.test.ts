/**
 * Tests for MeshTransport -- bundle routing with provenance tracking and
 * fidelity-adaptive compression.
 *
 * TDD: tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MeshNode } from './types.js';
import type { DiscoveryService } from './discovery.js';
import type { MeshEventLog } from './event-log.js';
import { MeshTransport, createMeshTransport } from './transport.js';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeNode(nodeId: string, name: string, status: MeshNode['status'] = 'healthy'): MeshNode {
  return {
    nodeId,
    name,
    endpoint: `http://localhost:8080/${nodeId}`,
    capabilities: [],
    registeredAt: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    status,
  };
}

const NODE_A = makeNode('node-a', 'Node Alpha');
const NODE_B = makeNode('node-b', 'Node Beta');
const NODE_C = makeNode('node-c', 'Node Gamma');
const UNHEALTHY_NODE = makeNode('node-u', 'Unhealthy', 'unhealthy');

function makeDiscovery(nodes: MeshNode[]): DiscoveryService {
  const map = new Map(nodes.map(n => [n.nodeId, n]));
  return {
    getNode: vi.fn((id: string) => map.get(id)),
    listHealthy: vi.fn(() => nodes.filter(n => n.status === 'healthy')),
    listAll: vi.fn(() => nodes),
    register: vi.fn(),
    deregister: vi.fn(),
    heartbeat: vi.fn(),
    evictStale: vi.fn(),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
  } as unknown as DiscoveryService;
}

function makeEventLog(): MeshEventLog {
  return {
    write: vi.fn().mockResolvedValue(undefined),
    readAll: vi.fn().mockResolvedValue([]),
  } as unknown as MeshEventLog;
}

const SAMPLE_BUNDLE = JSON.stringify({
  version: '1.0',
  content: 'Test bundle payload. '.repeat(50),
  metadata: { tags: ['test'] },
});

// ─── send() ──────────────────────────────────────────────────────────────────

describe('MeshTransport.send()', () => {
  let discovery: DiscoveryService;
  let transport: MeshTransport;

  beforeEach(() => {
    discovery = makeDiscovery([NODE_A, NODE_B, NODE_C, UNHEALTHY_NODE]);
    transport = new MeshTransport(discovery);
  });

  it('returns success=true for valid healthy source and target nodes', async () => {
    const result = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE);
    expect(result.success).toBe(true);
  });

  it('result contains a provenance header with origin = sourceNodeId', async () => {
    const result = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE);
    expect(result.success).toBe(true);
    expect(result.provenance).toBeDefined();
    expect(result.provenance!.origin.nodeId).toBe('node-a');
    expect(result.provenance!.origin.nodeName).toBe('Node Alpha');
  });

  it('result contains compression stats with originalSize > 0', async () => {
    const result = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE);
    expect(result.success).toBe(true);
    expect(result.compression).toBeDefined();
    expect(result.compression!.originalSize).toBeGreaterThan(0);
    expect(result.compression!.compressedSize).toBeGreaterThan(0);
  });

  it('result contains a payload string (the compressed/encoded bundle data)', async () => {
    const result = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE);
    expect(result.success).toBe(true);
    expect(typeof result.payload).toBe('string');
    expect(result.payload!.length).toBeGreaterThan(0);
  });

  it('returns success=false when target node is not found', async () => {
    const result = await transport.send('node-a', 'node-unknown', SAMPLE_BUNDLE);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('not found');
  });

  it('returns success=false when target node is unhealthy', async () => {
    const result = await transport.send('node-a', 'node-u', SAMPLE_BUNDLE);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('unhealthy');
  });

  it('fidelity adaptation: low latency (local) produces uncompressed result', async () => {
    const result = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 10);
    expect(result.success).toBe(true);
    expect(result.compression!.type).toBe('none');
  });

  it('fidelity adaptation: high latency (remote) produces compressed result', async () => {
    const result = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 1000);
    expect(result.success).toBe(true);
    expect(result.compression!.type).toBe('gzip-maximum');
  });

  it('fidelity adaptation: remote payload is smaller than local payload for large bundle', async () => {
    const localResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 10);
    const remoteResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 1000);
    expect(localResult.success).toBe(true);
    expect(remoteResult.success).toBe(true);
    expect(remoteResult.compression!.compressedSize).toBeLessThan(
      localResult.compression!.compressedSize,
    );
  });

  it('logs transport-send event if eventLog is provided', async () => {
    const eventLog = makeEventLog();
    const t = new MeshTransport(discovery, eventLog);
    await t.send('node-a', 'node-b', SAMPLE_BUNDLE);
    expect(eventLog.write).toHaveBeenCalled();
  });

  it('does not throw if eventLog is not provided', async () => {
    const t = new MeshTransport(discovery);
    await expect(t.send('node-a', 'node-b', SAMPLE_BUNDLE)).resolves.not.toThrow();
  });
});

// ─── receive() ───────────────────────────────────────────────────────────────

describe('MeshTransport.receive()', () => {
  let discovery: DiscoveryService;
  let transport: MeshTransport;

  beforeEach(() => {
    discovery = makeDiscovery([NODE_A, NODE_B, NODE_C]);
    transport = new MeshTransport(discovery);
  });

  it('decompresses the bundle and returns original bundleData', async () => {
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 1000);
    expect(sendResult.success).toBe(true);

    const payload = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };

    const received = transport.receive(payload, 'node-b', 'Node Beta');
    expect(received.success).toBe(true);
    expect(received.bundleData).toBe(SAMPLE_BUNDLE);
  });

  it('adds a hop to provenance for the receiving node', async () => {
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 1000);
    const payload = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };

    const received = transport.receive(payload, 'node-b', 'Node Beta');
    expect(received.success).toBe(true);
    expect(received.provenance!.hops).toHaveLength(1);
    expect(received.provenance!.hops[0].nodeId).toBe('node-b');
  });

  it('preserves origin in provenance after receive', async () => {
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE);
    const payload = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };

    const received = transport.receive(payload, 'node-b', 'Node Beta');
    expect(received.provenance!.origin.nodeId).toBe('node-a');
  });
});

// ─── Full round-trip (send A -> receive B) ────────────────────────────────────

describe('Full round-trip: send A -> receive B', () => {
  let transport: MeshTransport;

  beforeEach(() => {
    transport = new MeshTransport(makeDiscovery([NODE_A, NODE_B]));
  });

  it('provenance has origin=A and 1 hop (B) after full round-trip', async () => {
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE);
    expect(sendResult.success).toBe(true);

    const payload = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };

    const received = transport.receive(payload, 'node-b', 'Node Beta');
    expect(received.success).toBe(true);
    expect(received.provenance!.origin.nodeId).toBe('node-a');
    expect(received.provenance!.hops).toHaveLength(1);
    expect(received.provenance!.hops[0].nodeId).toBe('node-b');
    expect(received.provenance!.hops[0].hopIndex).toBe(0);
  });

  it('received bundleData equals original SAMPLE_BUNDLE', async () => {
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 500);
    const payload = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };
    const received = transport.receive(payload, 'node-b', 'Node Beta');
    expect(received.bundleData).toBe(SAMPLE_BUNDLE);
  });
});

// ─── Multi-hop relay: A->B->C ─────────────────────────────────────────────────

describe('Multi-hop relay: A -> B -> C', () => {
  let transport: MeshTransport;

  beforeEach(() => {
    transport = new MeshTransport(makeDiscovery([NODE_A, NODE_B, NODE_C]));
  });

  it('provenance has origin=A and 2 hops (B, C) with sequential hopIndex', async () => {
    // Step 1: A sends to B
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 200);
    expect(sendResult.success).toBe(true);

    const payloadAtoB = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };

    // Step 2: B relays to C
    const relayResult = transport.relay(payloadAtoB, 'node-b', 'Node Beta', 'node-c', 200);
    expect(relayResult.success).toBe(true);

    // Step 3: C receives
    const payloadBtoC = {
      data: relayResult.payload!,
      compressionType: relayResult.compression!.type,
      provenance: relayResult.provenanceSerialized!,
    };
    const received = transport.receive(payloadBtoC, 'node-c', 'Node Gamma');

    expect(received.success).toBe(true);
    expect(received.provenance!.origin.nodeId).toBe('node-a');
    expect(received.provenance!.hops).toHaveLength(2);
    expect(received.provenance!.hops[0].nodeId).toBe('node-b');
    expect(received.provenance!.hops[0].hopIndex).toBe(0);
    expect(received.provenance!.hops[1].nodeId).toBe('node-c');
    expect(received.provenance!.hops[1].hopIndex).toBe(1);
  });

  it('received bundleData at C equals the original bundle sent from A', async () => {
    const sendResult = await transport.send('node-a', 'node-b', SAMPLE_BUNDLE, 200);
    const payloadAtoB = {
      data: sendResult.payload!,
      compressionType: sendResult.compression!.type,
      provenance: sendResult.provenanceSerialized!,
    };

    const relayResult = transport.relay(payloadAtoB, 'node-b', 'Node Beta', 'node-c', 200);
    const payloadBtoC = {
      data: relayResult.payload!,
      compressionType: relayResult.compression!.type,
      provenance: relayResult.provenanceSerialized!,
    };

    const received = transport.receive(payloadBtoC, 'node-c', 'Node Gamma');
    expect(received.bundleData).toBe(SAMPLE_BUNDLE);
  });
});

// ─── createMeshTransport factory ──────────────────────────────────────────────

describe('createMeshTransport()', () => {
  it('creates a MeshTransport instance', () => {
    const discovery = makeDiscovery([NODE_A]);
    const t = createMeshTransport(discovery);
    expect(t).toBeInstanceOf(MeshTransport);
  });

  it('accepts optional eventLog argument', () => {
    const discovery = makeDiscovery([NODE_A]);
    const eventLog = makeEventLog();
    const t = createMeshTransport(discovery, eventLog);
    expect(t).toBeInstanceOf(MeshTransport);
  });
});
