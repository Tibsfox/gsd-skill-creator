/**
 * Tests for the Den Dispatcher agent.
 *
 * Verifies: RouteHandler routing, priority ordering, dead-letter on failure,
 * acknowledgement on success, DST:all broadcast, Dispatcher class lifecycle,
 * and full end-to-end round-trip through the bus.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  createDispatcher,
  dispatchCycle,
  Dispatcher,
} from './dispatcher.js';
import type { DispatchResult, RouteHandler } from './dispatcher.js';
import { initBus, sendMessage } from './bus.js';
import { collectHealthMetrics } from './health.js';
import type { BusConfig, BusMessage } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a temp directory and return a BusConfig pointing to it */
async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'den-dispatcher-test-'));
  const busDir = join(dir, 'bus');
  const config: BusConfig = {
    busDir,
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };
  return { config, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

/** Create a test message with given parameters */
function makeMessage(overrides: Partial<{
  priority: number;
  opcode: string;
  src: string;
  dst: string;
  timestamp: string;
  payload: string[];
}> = {}): BusMessage {
  const payload = overrides.payload ?? ['test payload line'];
  return {
    header: {
      timestamp: overrides.timestamp ?? '20260220-130000',
      priority: overrides.priority ?? 1,
      opcode: (overrides.opcode ?? 'EXEC') as BusMessage['header']['opcode'],
      src: (overrides.src ?? 'coordinator') as BusMessage['header']['src'],
      dst: (overrides.dst ?? 'executor') as BusMessage['header']['dst'],
      length: payload.length,
    },
    payload,
  };
}

// ============================================================================
// createDispatcher
// ============================================================================

describe('createDispatcher', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns Dispatcher object with dispatch and getMetrics methods', async () => {
    const d = await createDispatcher(config, {});
    expect(typeof d.dispatch).toBe('function');
    expect(typeof d.getMetrics).toBe('function');
  });

  it('throws if config is invalid', async () => {
    const badConfig = { busDir: '', maxQueueDepth: -1 } as unknown as BusConfig;
    await expect(createDispatcher(badConfig, {})).rejects.toThrow();
  });
});

// ============================================================================
// dispatchCycle
// ============================================================================

describe('dispatchCycle', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('routes message to correct handler based on DST field', async () => {
    const received: BusMessage[] = [];
    const handlers: Record<string, RouteHandler> = {
      coordinator: (msg) => { received.push(msg); },
    };

    await sendMessage(config, makeMessage({ dst: 'coordinator', timestamp: '20260220-130001' }));

    const result = await dispatchCycle(config, handlers);

    expect(received.length).toBe(1);
    expect(received[0].header.dst).toBe('coordinator');
    expect(result.processed).toBe(1);
  });

  it('processes priority-0 before priority-2', async () => {
    const order: number[] = [];
    const handlers: Record<string, RouteHandler> = {
      executor: (msg) => { order.push(msg.header.priority); },
    };

    await sendMessage(config, makeMessage({ priority: 2, dst: 'executor', timestamp: '20260220-130001' }));
    await sendMessage(config, makeMessage({ priority: 0, dst: 'executor', timestamp: '20260220-130002' }));

    await dispatchCycle(config, handlers);

    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
  });

  it('calls handler once per message (3 messages = 3 calls)', async () => {
    const handler = vi.fn();
    const handlers: Record<string, RouteHandler> = {
      coordinator: handler,
    };

    await sendMessage(config, makeMessage({ dst: 'coordinator', timestamp: '20260220-130001' }));
    await sendMessage(config, makeMessage({ dst: 'coordinator', timestamp: '20260220-130002', opcode: 'STATUS' }));
    await sendMessage(config, makeMessage({ dst: 'coordinator', timestamp: '20260220-130003', opcode: 'QUERY' }));

    await dispatchCycle(config, handlers);

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('message to DST:all calls all registered handlers once each', async () => {
    const coordinatorHandler = vi.fn();
    const executorHandler = vi.fn();
    const handlers: Record<string, RouteHandler> = {
      coordinator: coordinatorHandler,
      executor: executorHandler,
    };

    await sendMessage(config, makeMessage({ dst: 'all', timestamp: '20260220-130001', src: 'monitor' }));

    await dispatchCycle(config, handlers);

    expect(coordinatorHandler).toHaveBeenCalledTimes(1);
    expect(executorHandler).toHaveBeenCalledTimes(1);
  });

  it('message to unknown DST moves to dead-letter', async () => {
    const handlers: Record<string, RouteHandler> = {
      coordinator: vi.fn(),
    };

    // Send to 'sentinel' which has no handler registered
    await sendMessage(config, makeMessage({ dst: 'sentinel', timestamp: '20260220-130001', src: 'coordinator' }));

    const result = await dispatchCycle(config, handlers);

    expect(result.deadLettered).toBe(1);

    // Check dead-letter directory has the message
    const dlFiles = await readdir(join(config.busDir, 'dead-letter'));
    const msgFiles = dlFiles.filter((f) => f.endsWith('.msg'));
    expect(msgFiles.length).toBe(1);
  });

  it('successfully routed messages are acknowledged', async () => {
    const handlers: Record<string, RouteHandler> = {
      executor: vi.fn(),
    };

    await sendMessage(config, makeMessage({ dst: 'executor', timestamp: '20260220-130001' }));

    const result = await dispatchCycle(config, handlers);

    expect(result.acknowledged).toBe(1);

    // Check acknowledged directory has the message
    const ackFiles = await readdir(join(config.busDir, 'acknowledged'));
    const msgFiles = ackFiles.filter((f) => f.endsWith('.msg'));
    expect(msgFiles.length).toBe(1);

    // Check priority directory is empty
    const p1Files = await readdir(join(config.busDir, 'priority-1'));
    expect(p1Files.filter((f) => f.endsWith('.msg')).length).toBe(0);
  });

  it('handler that throws sends message to dead-letter with error reason', async () => {
    const handlers: Record<string, RouteHandler> = {
      executor: () => { throw new Error('handler crashed'); },
    };

    await sendMessage(config, makeMessage({ dst: 'executor', timestamp: '20260220-130001' }));

    const result = await dispatchCycle(config, handlers);

    expect(result.deadLettered).toBe(1);
    expect(result.acknowledged).toBe(0);

    const dlFiles = await readdir(join(config.busDir, 'dead-letter'));
    const metaFiles = dlFiles.filter((f) => f.endsWith('.meta'));
    expect(metaFiles.length).toBe(1);
  });

  it('returns DispatchResult with processed, acknowledged, deadLettered, metrics', async () => {
    const handlers: Record<string, RouteHandler> = {
      executor: vi.fn(),
    };

    await sendMessage(config, makeMessage({ dst: 'executor', timestamp: '20260220-130001' }));

    const result = await dispatchCycle(config, handlers);

    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('acknowledged');
    expect(result).toHaveProperty('deadLettered');
    expect(result).toHaveProperty('metrics');
    expect(result.metrics).toHaveProperty('queueDepths');
    expect(result.metrics).toHaveProperty('totalMessages');
  });
});

// ============================================================================
// Dispatcher class
// ============================================================================

describe('Dispatcher', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('dispatch() runs one dispatch cycle and returns DispatchResult', async () => {
    const d = await createDispatcher(config, {
      executor: vi.fn(),
    });

    await sendMessage(config, makeMessage({ dst: 'executor', timestamp: '20260220-130001' }));

    const result = await d.dispatch();

    expect(result.processed).toBe(1);
    expect(result.acknowledged).toBe(1);
  });

  it('getMetrics() returns latest HealthMetrics without dispatching', async () => {
    const d = await createDispatcher(config, {});

    await sendMessage(config, makeMessage({ dst: 'executor', timestamp: '20260220-130001' }));

    const metrics = await d.getMetrics();

    // Message should still be pending (getMetrics does not dispatch)
    expect(metrics.totalMessages).toBe(1);
  });

  it('prune() runs pruneAcknowledged + pruneDeadLetters and returns combined result', async () => {
    const d = await createDispatcher(config, {
      executor: vi.fn(),
    });

    // Send and dispatch a message to create an acknowledged entry
    await sendMessage(config, makeMessage({ dst: 'executor', timestamp: '20260220-130001' }));
    await d.dispatch();

    const pruneResult = await d.prune();

    // Fresh messages should not be pruned (within retention)
    expect(pruneResult).toHaveProperty('pruned');
    expect(pruneResult).toHaveProperty('remaining');
    expect(pruneResult).toHaveProperty('reasons');
  });

  it('constructor calls initBus to ensure directory structure exists', async () => {
    // Create with a fresh busDir that does NOT have initBus called
    const freshDir = await mkdtemp(join(tmpdir(), 'den-fresh-'));
    const freshBusDir = join(freshDir, 'bus');
    const freshConfig: BusConfig = {
      busDir: freshBusDir,
      maxQueueDepth: 100,
      deliveryTimeoutMs: 5000,
      deadLetterRetentionDays: 3,
      archiveMaxMessages: 100,
      archiveMaxAgeDays: 7,
    };

    // createDispatcher should call initBus internally
    const d = await createDispatcher(freshConfig, {});

    // Verify directories exist
    const entries = await readdir(freshConfig.busDir);
    expect(entries).toContain('priority-0');
    expect(entries).toContain('acknowledged');
    expect(entries).toContain('dead-letter');

    await rm(freshDir, { recursive: true, force: true });
  });
});

// ============================================================================
// End-to-end round-trip
// ============================================================================

describe('end-to-end round-trip', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('send -> dispatch -> handler receives -> acknowledged -> health clean', async () => {
    const received: BusMessage[] = [];

    const handlers: Record<string, RouteHandler> = {
      executor: (msg) => { received.push(msg); },
    };

    // Send a message: coordinator -> executor, priority-1, EXEC, 2 payload lines
    const msg = makeMessage({
      priority: 1,
      opcode: 'EXEC',
      src: 'coordinator',
      dst: 'executor',
      timestamp: '20260220-130500',
      payload: ['phase: 255', 'plan: 04'],
    });
    await sendMessage(config, msg);

    // Dispatch
    const result = await dispatchCycle(config, handlers);

    // Handler received the message with correct header and payload
    expect(received.length).toBe(1);
    expect(received[0].header.opcode).toBe('EXEC');
    expect(received[0].header.src).toBe('coordinator');
    expect(received[0].header.dst).toBe('executor');
    expect(received[0].payload).toEqual(['phase: 255', 'plan: 04']);

    // Original file gone from priority-1/
    const p1Files = await readdir(join(config.busDir, 'priority-1'));
    expect(p1Files.filter((f) => f.endsWith('.msg')).length).toBe(0);

    // Message appears in acknowledged/
    const ackFiles = await readdir(join(config.busDir, 'acknowledged'));
    expect(ackFiles.filter((f) => f.endsWith('.msg')).length).toBe(1);

    // Health check: all queue depths should be 0
    const metrics = await collectHealthMetrics(config);
    for (let i = 0; i < 8; i++) {
      expect(metrics.queueDepths[String(i)]).toBe(0);
    }

    expect(result.processed).toBe(1);
    expect(result.acknowledged).toBe(1);
    expect(result.deadLettered).toBe(0);
  });
});

// ============================================================================
// Priority ordering end-to-end
// ============================================================================

describe('priority ordering end-to-end', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('dispatches priority-0 first, priority-3 second, priority-7 third', async () => {
    const order: Array<{ priority: number; opcode: string }> = [];

    const handlers: Record<string, RouteHandler> = {
      executor: (msg) => {
        order.push({ priority: msg.header.priority, opcode: msg.header.opcode });
      },
    };

    // Send 3 messages in reverse priority order
    await sendMessage(config, makeMessage({
      priority: 7,
      opcode: 'NOP',
      dst: 'executor',
      timestamp: '20260220-130001',
    }));
    await sendMessage(config, makeMessage({
      priority: 0,
      opcode: 'HALT',
      dst: 'executor',
      timestamp: '20260220-130002',
    }));
    await sendMessage(config, makeMessage({
      priority: 3,
      opcode: 'SEND',
      dst: 'executor',
      timestamp: '20260220-130003',
    }));

    await dispatchCycle(config, handlers);

    expect(order.length).toBe(3);
    expect(order[0].priority).toBe(0); // HALT first
    expect(order[1].priority).toBe(3); // SEND second
    expect(order[2].priority).toBe(7); // NOP third
  });
});
