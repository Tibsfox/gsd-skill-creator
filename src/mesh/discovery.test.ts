/**
 * Tests for DiscoveryService -- node registration, heartbeat monitoring, and auto-eviction.
 *
 * IMP-01: Integration tests verify auto-invocation of evictStale() via startMonitoring().
 * Auto-eviction after 3 missed heartbeats is tested end-to-end, not just unit-level.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { MeshEventLog } from './event-log.js';
import { DiscoveryService, createDiscoveryService } from './discovery.js';
import type { MeshNode } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTempLog(): MeshEventLog {
  return new MeshEventLog(join(tmpdir(), `discovery-test-${randomUUID()}.jsonl`));
}

function makeService(overrides?: {
  intervalMs?: number;
  maxMissed?: number;
  checkIntervalMs?: number;
}): DiscoveryService {
  const log = makeTempLog();
  return new DiscoveryService(log, overrides);
}

const baseRegisterInput = {
  name: 'node-alpha',
  endpoint: 'http://localhost:3000',
  capabilities: [
    { chipName: 'local-llama', models: ['llama3'], maxContextLength: 4096 },
  ],
};

// ─── Unit tests: register ─────────────────────────────────────────────────────

describe('DiscoveryService.register', () => {
  it('creates a healthy node with correct fields', async () => {
    const svc = makeService();
    const node = await svc.register(baseRegisterInput);

    expect(node.nodeId).toBeDefined();
    expect(node.name).toBe('node-alpha');
    expect(node.endpoint).toBe('http://localhost:3000');
    expect(node.status).toBe('healthy');
    expect(node.registeredAt).toBeDefined();
    expect(node.lastHeartbeat).toBeDefined();
  });

  it('generates a unique nodeId (UUID v4 format)', async () => {
    const svc = makeService();
    const n1 = await svc.register(baseRegisterInput);
    const n2 = await svc.register({ ...baseRegisterInput, name: 'node-beta' });
    expect(n1.nodeId).not.toBe(n2.nodeId);
    expect(n1.nodeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('logs a register event to the event log', async () => {
    const log = makeTempLog();
    const svc = new DiscoveryService(log, {});
    await svc.register(baseRegisterInput);

    const events = await log.readAll();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('register');
  });

  it('stores node in internal registry (getNode returns it)', async () => {
    const svc = makeService();
    const node = await svc.register(baseRegisterInput);
    const found = svc.getNode(node.nodeId);
    expect(found).toBeDefined();
    expect(found!.nodeId).toBe(node.nodeId);
  });
});

// ─── Unit tests: deregister ───────────────────────────────────────────────────

describe('DiscoveryService.deregister', () => {
  it('removes node from registry and returns true', async () => {
    const svc = makeService();
    const node = await svc.register(baseRegisterInput);
    const result = await svc.deregister(node.nodeId);
    expect(result).toBe(true);
    expect(svc.getNode(node.nodeId)).toBeUndefined();
  });

  it('returns false for unknown nodeId', async () => {
    const svc = makeService();
    const result = await svc.deregister('unknown-node-id');
    expect(result).toBe(false);
  });

  it('logs a deregister event to the event log', async () => {
    const log = makeTempLog();
    const svc = new DiscoveryService(log, {});
    const node = await svc.register(baseRegisterInput);
    await svc.deregister(node.nodeId);

    const events = await log.readAll();
    expect(events).toHaveLength(2);
    expect(events[1].eventType).toBe('deregister');
  });
});

// ─── Unit tests: heartbeat ────────────────────────────────────────────────────

describe('DiscoveryService.heartbeat', () => {
  it('updates lastHeartbeat timestamp and returns true', async () => {
    const svc = makeService();
    const node = await svc.register(baseRegisterInput);
    const before = node.lastHeartbeat;

    // Wait a tick to ensure timestamp differs
    await new Promise(r => setTimeout(r, 2));
    const result = await svc.heartbeat(node.nodeId);

    expect(result).toBe(true);
    const updated = svc.getNode(node.nodeId);
    expect(updated!.lastHeartbeat).not.toBe(before);
  });

  it('returns false for unknown nodeId without throwing', async () => {
    const svc = makeService();
    const result = await svc.heartbeat('nonexistent-id');
    expect(result).toBe(false);
  });

  it('logs a heartbeat event to the event log', async () => {
    const log = makeTempLog();
    const svc = new DiscoveryService(log, {});
    const node = await svc.register(baseRegisterInput);
    await svc.heartbeat(node.nodeId);

    const events = await log.readAll();
    expect(events).toHaveLength(2);
    expect(events[1].eventType).toBe('heartbeat');
  });
});

// ─── Unit tests: listHealthy / listAll ────────────────────────────────────────

describe('DiscoveryService.listHealthy / listAll', () => {
  it('listHealthy returns only healthy nodes', async () => {
    // Use a fixed baseline timestamp to control which nodes are stale.
    // n1's lastHeartbeat will be set to 'now', n2 to 'now - stale'.
    // evictStale(now) will evict n2 but not n1.
    const svc = makeService({ intervalMs: 1000, maxMissed: 1 });
    const n1 = await svc.register(baseRegisterInput);
    const n2 = await svc.register({ ...baseRegisterInput, name: 'node-beta', endpoint: 'http://localhost:3001' });

    // Make n1 fresh by calling heartbeat right now, then evict with 'now+500'
    // threshold = 1000 * 1 = 1000ms; n1 heartbeat is <500ms ago, n2 is ~0ms ago too.
    // Both would survive at +500ms. We need n2 to be old enough to evict.
    //
    // Solution: manually set n2's lastHeartbeat to a fixed old time via internal access.
    // Since MeshNode is mutable, we access it via getNode and mutate directly.
    const staleTime = new Date(Date.now() - 2000).toISOString();
    (svc.getNode(n2.nodeId) as MeshNode).lastHeartbeat = staleTime;

    // Now evict with current 'now': n2 is 2000ms stale (> 1000ms threshold), n1 is fresh
    await svc.evictStale();

    const healthy = svc.listHealthy();
    expect(healthy).toHaveLength(1);
    expect(healthy[0].nodeId).toBe(n1.nodeId);

    const all = svc.listAll();
    expect(all).toHaveLength(2);
  });

  it('listAll returns all nodes regardless of status', async () => {
    const svc = makeService({ intervalMs: 100, maxMissed: 1 });
    const n1 = await svc.register(baseRegisterInput);
    await svc.register({ ...baseRegisterInput, name: 'node-beta', endpoint: 'http://localhost:3001' });

    await svc.evictStale(new Date(Date.now() + 200));
    const all = svc.listAll();
    expect(all).toHaveLength(2);

    await svc.deregister(n1.nodeId);
    // After deregister n1 is fully removed, n2 is evicted
    const afterDeregister = svc.listAll();
    expect(afterDeregister).toHaveLength(1);
    expect(afterDeregister[0].status).toBe('evicted');
  });
});

// ─── Unit tests: evictStale ───────────────────────────────────────────────────

describe('DiscoveryService.evictStale', () => {
  it('evicts nodes exceeding maxMissed * intervalMs since last heartbeat', async () => {
    const svc = makeService({ intervalMs: 1000, maxMissed: 3 });
    const node = await svc.register(baseRegisterInput);

    // Simulate node missed 3 heartbeats (3001ms without contact)
    const staleNow = new Date(Date.now() + 3001);
    const evicted = await svc.evictStale(staleNow);

    expect(evicted).toContain(node.nodeId);
    expect(svc.getNode(node.nodeId)!.status).toBe('evicted');
  });

  it('does NOT evict nodes within the heartbeat window', async () => {
    const svc = makeService({ intervalMs: 1000, maxMissed: 3 });
    await svc.register(baseRegisterInput);

    // Only 1 heartbeat window elapsed -- not stale yet
    const recentNow = new Date(Date.now() + 999);
    const evicted = await svc.evictStale(recentNow);

    expect(evicted).toHaveLength(0);
  });

  it('logs an eviction event for each evicted node', async () => {
    const log = makeTempLog();
    const svc = new DiscoveryService(log, { intervalMs: 500, maxMissed: 1 });
    const n1 = await svc.register(baseRegisterInput);
    const n2 = await svc.register({ ...baseRegisterInput, name: 'node-beta', endpoint: 'http://localhost:3001' });

    await svc.evictStale(new Date(Date.now() + 600));

    const events = await log.readAll();
    const evictionEvents = events.filter(e => e.eventType === 'eviction');
    expect(evictionEvents).toHaveLength(2);
    const evictedNodeIds = evictionEvents.map(e => e.nodeId);
    expect(evictedNodeIds).toContain(n1.nodeId);
    expect(evictedNodeIds).toContain(n2.nodeId);
  });

  it('does NOT evict already-evicted nodes', async () => {
    const log = makeTempLog();
    const svc = new DiscoveryService(log, { intervalMs: 100, maxMissed: 1 });
    await svc.register(baseRegisterInput);

    await svc.evictStale(new Date(Date.now() + 200));
    const firstEviction = (await log.readAll()).filter(e => e.eventType === 'eviction').length;

    // Second evictStale should not produce more eviction events
    await svc.evictStale(new Date(Date.now() + 400));
    const secondEviction = (await log.readAll()).filter(e => e.eventType === 'eviction').length;

    expect(secondEviction).toBe(firstEviction);
  });
});

// ─── Integration tests: startMonitoring / auto-eviction (IMP-01) ──────────────

describe('DiscoveryService.startMonitoring (integration)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(
    // IMP-01: integration test -- verifies auto-invocation of evictStale()
    'IMP-01: auto-evicts node after 3 missed heartbeats when monitoring is active',
    async () => {
      // IMP-01: integration test -- verifies auto-invocation of evictStale()
      const svc = makeService({ intervalMs: 1000, maxMissed: 3, checkIntervalMs: 500 });
      const node = await svc.register(baseRegisterInput);

      expect(svc.getNode(node.nodeId)!.status).toBe('healthy');
      svc.startMonitoring();

      // Advance past 3 missed heartbeats: 3001ms elapsed since last heartbeat
      vi.advanceTimersByTime(3500);

      svc.stopMonitoring();

      // Node should have been automatically evicted by the interval
      expect(svc.getNode(node.nodeId)!.status).toBe('evicted');
    },
  );

  it(
    // IMP-01: integration test -- verifies auto-invocation of evictStale()
    'IMP-01: evicts only the non-heartbeating node when one node sends heartbeats',
    async () => {
      // IMP-01: integration test -- verifies auto-invocation of evictStale()
      const svc = makeService({ intervalMs: 1000, maxMissed: 3, checkIntervalMs: 500 });
      const silent = await svc.register(baseRegisterInput);
      const active = await svc.register({
        ...baseRegisterInput,
        name: 'node-active',
        endpoint: 'http://localhost:3001',
      });

      svc.startMonitoring();

      // Advance time in chunks, sending heartbeats for 'active' between checks
      // 500ms: first check -- neither is stale yet (< 3000ms elapsed)
      vi.advanceTimersByTime(500);
      await svc.heartbeat(active.nodeId); // active node sends heartbeat

      // 1000ms total: second check -- still not 3 intervals for silent
      vi.advanceTimersByTime(500);
      await svc.heartbeat(active.nodeId);

      // 1500ms total: third check
      vi.advanceTimersByTime(500);
      await svc.heartbeat(active.nodeId);

      // 2000ms total
      vi.advanceTimersByTime(500);
      await svc.heartbeat(active.nodeId);

      // 2500ms total
      vi.advanceTimersByTime(500);
      await svc.heartbeat(active.nodeId);

      // 3500ms total -- silent node has missed 3 intervals, active refreshed continuously
      vi.advanceTimersByTime(1000);
      await svc.heartbeat(active.nodeId);

      svc.stopMonitoring();

      expect(svc.getNode(silent.nodeId)!.status).toBe('evicted');
      expect(svc.getNode(active.nodeId)!.status).toBe('healthy');
    },
  );

  it(
    // IMP-01: integration test -- verifies auto-invocation of evictStale()
    'IMP-01: stopMonitoring prevents further auto-eviction',
    async () => {
      // IMP-01: integration test -- verifies auto-invocation of evictStale()
      const svc = makeService({ intervalMs: 1000, maxMissed: 3, checkIntervalMs: 500 });
      const node = await svc.register(baseRegisterInput);

      svc.startMonitoring();
      // Only advance 1 second (not stale yet)
      vi.advanceTimersByTime(1000);
      svc.stopMonitoring();

      // Now advance far past threshold -- but monitoring is stopped
      vi.advanceTimersByTime(5000);

      // Node should still be healthy -- no auto-eviction after stopMonitoring
      expect(svc.getNode(node.nodeId)!.status).toBe('healthy');
    },
  );
});

// ─── Factory function ─────────────────────────────────────────────────────────

describe('createDiscoveryService', () => {
  it('creates a DiscoveryService with the given event log', async () => {
    const log = makeTempLog();
    const svc = createDiscoveryService(log);
    const node = await svc.register(baseRegisterInput);
    expect(node.status).toBe('healthy');
  });

  it('accepts optional config overrides', async () => {
    const log = makeTempLog();
    const svc = createDiscoveryService(log, { intervalMs: 5000, maxMissed: 5, checkIntervalMs: 1000 });
    const node = await svc.register(baseRegisterInput);

    // Should not evict after 5s (5 * 1 missed interval, but maxMissed=5 * 5000ms = 25s needed)
    const evicted = await svc.evictStale(new Date(Date.now() + 5001));
    expect(evicted).toHaveLength(0);
    expect(svc.getNode(node.nodeId)!.status).toBe('healthy');
  });
});
