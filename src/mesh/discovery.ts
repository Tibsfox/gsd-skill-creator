/**
 * DiscoveryService -- manages mesh node registration, heartbeat monitoring,
 * and automatic stale node eviction.
 *
 * Every lifecycle event (register, deregister, heartbeat, eviction) is logged
 * to the append-only MeshEventLog (IMP-07).
 *
 * IMP-01: startMonitoring() sets up automatic periodic evictStale() calls.
 * Integration tests in discovery.test.ts verify auto-invocation, not just
 * that evictStale() works when called manually.
 */

import { randomUUID } from 'node:crypto';
import type { MeshNode, NodeCapability, HeartbeatConfig } from './types.js';
import { HeartbeatConfigSchema } from './types.js';
import type { MeshEventLog } from './event-log.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Input for registering a new mesh node.
 * nodeId, registeredAt, lastHeartbeat, and status are generated automatically.
 */
export interface RegisterNodeInput {
  /** Human-readable node name */
  name: string;
  /** HTTP endpoint where this node accepts DACP bundles */
  endpoint: string;
  /** Capabilities advertised by this node's chips */
  capabilities: NodeCapability[];
}

// ─── DiscoveryService ─────────────────────────────────────────────────────────

/**
 * Manages mesh node registration, heartbeat monitoring, and auto-eviction.
 *
 * Nodes register once, send periodic heartbeats, and are automatically evicted
 * when they miss more than maxMissed consecutive heartbeat intervals.
 *
 * All lifecycle events are logged to the append-only MeshEventLog (IMP-07).
 */
export class DiscoveryService {
  private readonly nodes = new Map<string, MeshNode>();
  private readonly config: HeartbeatConfig;
  private intervalHandle: ReturnType<typeof setInterval> | undefined;

  /**
   * @param eventLog - Append-only log for all lifecycle events (IMP-07)
   * @param config - Heartbeat configuration (defaults applied via Zod)
   */
  constructor(
    private readonly eventLog: MeshEventLog,
    config?: Partial<HeartbeatConfig>,
  ) {
    this.config = HeartbeatConfigSchema.parse(config ?? {});
  }

  // ── register ──────────────────────────────────────────────────────────────

  /**
   * Registers a new mesh node with status='healthy'.
   * Generates nodeId, registeredAt, and lastHeartbeat automatically.
   * Logs a 'register' event to the event log.
   */
  async register(input: RegisterNodeInput): Promise<MeshNode> {
    const now = new Date().toISOString();
    const node: MeshNode = {
      nodeId: randomUUID(),
      name: input.name,
      endpoint: input.endpoint,
      capabilities: input.capabilities,
      registeredAt: now,
      lastHeartbeat: now,
      status: 'healthy',
    };

    this.nodes.set(node.nodeId, node);

    await this.eventLog.write({
      nodeId: node.nodeId,
      eventType: 'register',
      payload: { name: node.name, endpoint: node.endpoint },
    });

    return node;
  }

  // ── deregister ────────────────────────────────────────────────────────────

  /**
   * Voluntarily removes a node from the registry.
   * Logs a 'deregister' event. Returns false if nodeId not found.
   */
  async deregister(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    this.nodes.delete(nodeId);

    await this.eventLog.write({
      nodeId,
      eventType: 'deregister',
      payload: { name: node.name },
    });

    return true;
  }

  // ── heartbeat ─────────────────────────────────────────────────────────────

  /**
   * Updates a node's lastHeartbeat timestamp.
   * Logs a 'heartbeat' event. Returns false if nodeId not found (no throw).
   */
  async heartbeat(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    const now = new Date().toISOString();
    node.lastHeartbeat = now;

    await this.eventLog.write({
      nodeId,
      eventType: 'heartbeat',
      payload: { lastHeartbeat: now },
    });

    return true;
  }

  // ── getNode / listHealthy / listAll ───────────────────────────────────────

  /** Returns the node with the given nodeId, or undefined if not found. */
  getNode(nodeId: string): MeshNode | undefined {
    return this.nodes.get(nodeId);
  }

  /** Returns all nodes with status='healthy'. */
  listHealthy(): MeshNode[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'healthy');
  }

  /** Returns all registered nodes regardless of status. */
  listAll(): MeshNode[] {
    return Array.from(this.nodes.values());
  }

  // ── evictStale ────────────────────────────────────────────────────────────

  /**
   * Checks each healthy node's lastHeartbeat against the eviction threshold.
   * If (now - lastHeartbeat) > (intervalMs * maxMissed), marks node as 'evicted'
   * and logs an 'eviction' event.
   *
   * Evicted nodes remain in the registry with status='evicted' but are excluded
   * from listHealthy() and therefore from the routing pool.
   *
   * @param now - Reference time for staleness check (defaults to Date.now())
   * @returns Array of evicted nodeIds
   */
  async evictStale(now?: Date): Promise<string[]> {
    const referenceTime = now ?? new Date();
    const threshold = this.config.intervalMs * this.config.maxMissed;
    const evicted: string[] = [];

    for (const node of this.nodes.values()) {
      if (node.status !== 'healthy') continue;

      const lastHeartbeatMs = new Date(node.lastHeartbeat).getTime();
      const elapsed = referenceTime.getTime() - lastHeartbeatMs;

      if (elapsed > threshold) {
        node.status = 'evicted';
        evicted.push(node.nodeId);

        await this.eventLog.write({
          nodeId: node.nodeId,
          eventType: 'eviction',
          payload: {
            name: node.name,
            elapsedMs: elapsed,
            threshold,
          },
        });
      }
    }

    return evicted;
  }

  // ── startMonitoring / stopMonitoring ──────────────────────────────────────

  /**
   * Starts periodic automatic eviction checks at config.checkIntervalMs.
   *
   * IMP-01: This is the lifecycle wrapper that drives auto-eviction.
   * Integration tests verify that nodes are automatically evicted without
   * manual evictStale() calls.
   *
   * Idempotent -- calling again while monitoring is active replaces the interval.
   */
  startMonitoring(): void {
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle);
    }

    this.intervalHandle = setInterval(() => {
      // Fire and forget -- evictStale is async but interval callbacks are sync.
      // Errors are non-fatal; next check interval will retry.
      void this.evictStale();
    }, this.config.checkIntervalMs);
  }

  /**
   * Stops periodic eviction checks.
   * Idempotent -- safe to call even if monitoring was never started.
   */
  stopMonitoring(): void {
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a DiscoveryService with the given event log and optional config.
 *
 * Preferred entry point over direct construction in application code.
 */
export function createDiscoveryService(
  eventLog: MeshEventLog,
  config?: Partial<HeartbeatConfig>,
): DiscoveryService {
  return new DiscoveryService(eventLog, config);
}
