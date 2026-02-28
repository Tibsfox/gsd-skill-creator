/**
 * SessionBus test suite.
 *
 * Integration tests for the 4-loop filesystem message bus. Includes the
 * INTEG-02 load test: 4 concurrent writers, 12 messages, <200ms, 0 loss.
 *
 * Uses tmpdir isolation pattern: each test gets a fresh temporary directory
 * created in beforeEach and removed in afterEach. No production .brainstorm/
 * writes, no inter-test interference.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { SessionBus } from './session-bus.js';
import type { SessionBusConfig } from './session-bus.js';
import { initBrainstormSession, resetBrainstormCounter } from '../shared/schemas.js';
import type { BrainstormMessage, MessageType } from '../shared/types.js';

// ============================================================================
// Test helpers
// ============================================================================

let testDir: string;
let cleanupDirs: string[] = [];

beforeEach(() => {
  resetBrainstormCounter();
  cleanupDirs = [];
});

afterEach(async () => {
  for (const dir of cleanupDirs) {
    await rm(dir, { recursive: true, force: true });
  }
});

/**
 * Create an isolated test bus with initialized session directories.
 *
 * Returns the bus instance, session ID, and brainstorm directory path.
 * The temp directory is tracked for cleanup in afterEach.
 */
async function createTestBus(): Promise<{
  bus: SessionBus;
  sessionId: string;
  brainstormDir: string;
  config: SessionBusConfig;
}> {
  const brainstormDir = await mkdtemp(join(tmpdir(), 'brainstorm-bus-test-'));
  cleanupDirs.push(brainstormDir);

  const sessionId = randomUUID();
  const config: SessionBusConfig = { brainstormDir, sessionId };

  // Initialize the 4 bus subdirectories
  await initBrainstormSession({ brainstormDir, sessionId });

  const bus = new SessionBus(config);
  return { bus, sessionId, brainstormDir, config };
}

/**
 * Create a minimal valid BrainstormMessage for testing.
 */
function makeMessage(
  overrides: Partial<BrainstormMessage> & { session_id: string },
): BrainstormMessage {
  return {
    id: randomUUID(),
    from: 'facilitator',
    to: 'broadcast',
    type: 'phase_transition',
    phase: 'diverge',
    payload: {},
    timestamp: Date.now(),
    priority: 1,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('SessionBus', () => {
  // ==========================================================================
  // Test 1: publish() writes a valid .msg file to the correct loop directory
  // ==========================================================================

  it('publish() writes a valid .msg file to the correct loop directory', async () => {
    const { bus, sessionId, brainstormDir } = await createTestBus();

    const message = makeMessage({
      session_id: sessionId,
      type: 'idea',
      from: 'ideator',
      to: 'scribe',
    });

    const filePath = await bus.publish('capture', message);

    // File should exist in the capture loop directory
    expect(filePath).toContain('/bus/capture/');
    expect(filePath).toMatch(/\.msg$/);

    // Verify the file is in the capture directory
    const captureDir = join(
      brainstormDir, 'sessions', sessionId, 'bus', 'capture',
    );
    const files = await readdir(captureDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.msg$/);
  });

  // ==========================================================================
  // Test 2: poll() returns messages in monotonic counter order
  // ==========================================================================

  it('poll() returns messages in monotonic counter order', async () => {
    const { bus, sessionId } = await createTestBus();

    // Publish 3 messages with publishRouted (all session loop type)
    const messages = [
      makeMessage({ session_id: sessionId, payload: { seq: 0 } }),
      makeMessage({ session_id: sessionId, payload: { seq: 1 } }),
      makeMessage({ session_id: sessionId, payload: { seq: 2 } }),
    ];

    for (const msg of messages) {
      await bus.publishRouted(msg);
    }

    const polled = await bus.poll('session');
    expect(polled).toHaveLength(3);

    // Verify order matches write order (monotonic counter guarantees this)
    expect(polled[0].payload).toEqual({ seq: 0 });
    expect(polled[1].payload).toEqual({ seq: 1 });
    expect(polled[2].payload).toEqual({ seq: 2 });
  });

  // ==========================================================================
  // Test 3: routeMessage() routes all 14 message types to correct loops
  // ==========================================================================

  it('routeMessage() routes all 14 message types to correct loops', async () => {
    const { bus, sessionId } = await createTestBus();

    // Capture loop types
    const captureTypes: MessageType[] = [
      'idea', 'question', 'cluster', 'evaluation', 'artifact_ready',
    ];
    for (const type of captureTypes) {
      const msg = makeMessage({ session_id: sessionId, type });
      expect(bus.routeMessage(msg)).toBe('capture');
    }

    // Energy loop
    const energyMsg = makeMessage({ session_id: sessionId, type: 'energy_signal' });
    expect(bus.routeMessage(energyMsg)).toBe('energy');

    // User loop
    const userMsg = makeMessage({ session_id: sessionId, type: 'user_input' });
    expect(bus.routeMessage(userMsg)).toBe('user');

    // Session loop types
    const sessionTypes: MessageType[] = [
      'phase_transition', 'technique_switch', 'timer_event',
      'hat_color', 'rule_violation', 'agent_activated', 'agent_deactivated',
    ];
    for (const type of sessionTypes) {
      const msg = makeMessage({ session_id: sessionId, type });
      expect(bus.routeMessage(msg)).toBe('session');
    }

    // Verify we covered all 14 types
    const totalCovered = captureTypes.length + 1 + 1 + sessionTypes.length;
    expect(totalCovered).toBe(14);
  });

  // ==========================================================================
  // Test 4: INTEG-02 load test -- 4 concurrent writers, 12 messages, 200ms, 0 loss
  // ==========================================================================

  it('load test: 4 concurrent writers produce 12 messages with zero loss in 200ms', async () => {
    const { bus, sessionId } = await createTestBus();

    const start = Date.now();

    // 4 concurrent writer agents, 3 messages each = 12 total
    const writers = ['facilitator', 'ideator', 'analyst', 'scribe'] as const;
    const writePromises = writers.flatMap(agent =>
      Array.from({ length: 3 }, (_, i) =>
        bus.publish('session', makeMessage({
          session_id: sessionId,
          from: agent,
          to: 'broadcast',
          type: 'phase_transition',
          payload: { writer: agent, seq: i },
        })),
      ),
    );

    await Promise.all(writePromises);
    const elapsed = Date.now() - start;

    // Verify timing: all 12 writes complete in under 200ms
    expect(elapsed).toBeLessThan(200);

    // Verify zero loss: all 12 messages readable
    const messages = await bus.poll('session');
    expect(messages).toHaveLength(12);

    // Verify each writer contributed exactly 3 messages
    for (const agent of writers) {
      const fromAgent = messages.filter(m => m.from === agent);
      expect(fromAgent).toHaveLength(3);
    }

    // Verify no duplicate filenames (zero collision) by checking unique IDs
    const ids = new Set(messages.map(m => m.id));
    expect(ids.size).toBe(12);
  });

  // ==========================================================================
  // Test 5: drain() returns all messages and subsequent poll() returns empty
  // ==========================================================================

  it('drain() returns all messages and subsequent poll() returns empty', async () => {
    const { bus, sessionId } = await createTestBus();

    // Publish 5 messages
    for (let i = 0; i < 5; i++) {
      await bus.publish('session', makeMessage({
        session_id: sessionId,
        payload: { seq: i },
      }));
    }

    // Drain should return all 5
    const drained = await bus.drain('session');
    expect(drained).toHaveLength(5);

    // Subsequent poll should return empty
    const remaining = await bus.poll('session');
    expect(remaining).toHaveLength(0);
  });

  // ==========================================================================
  // Test 6: poll(since) filters messages by timestamp prefix
  // ==========================================================================

  it('poll(since) filters messages by timestamp prefix', async () => {
    const { bus, sessionId } = await createTestBus();

    // Publish 2 messages before the marker
    await bus.publish('session', makeMessage({
      session_id: sessionId,
      payload: { batch: 'before', seq: 0 },
    }));
    await bus.publish('session', makeMessage({
      session_id: sessionId,
      payload: { batch: 'before', seq: 1 },
    }));

    // Record timestamp for filtering -- wait 2ms to ensure distinct timestamps
    await new Promise(resolve => setTimeout(resolve, 2));
    const since = Date.now();

    // Publish 3 messages after the marker
    await bus.publish('session', makeMessage({
      session_id: sessionId,
      payload: { batch: 'after', seq: 0 },
    }));
    await bus.publish('session', makeMessage({
      session_id: sessionId,
      payload: { batch: 'after', seq: 1 },
    }));
    await bus.publish('session', makeMessage({
      session_id: sessionId,
      payload: { batch: 'after', seq: 2 },
    }));

    // Poll with since filter -- should return only the 3 "after" messages
    const filtered = await bus.poll('session', since);
    expect(filtered).toHaveLength(3);

    for (const msg of filtered) {
      expect((msg.payload as Record<string, unknown>).batch).toBe('after');
    }

    // Full poll without filter should still return all 5
    const all = await bus.poll('session');
    expect(all).toHaveLength(5);
  });

  // ==========================================================================
  // Test 7: publishRouted() selects correct loop for each message type
  // ==========================================================================

  it('publishRouted() selects correct loop for each message type', async () => {
    const { bus, sessionId, brainstormDir } = await createTestBus();

    // Publish an energy_signal via publishRouted
    await bus.publishRouted(makeMessage({
      session_id: sessionId,
      type: 'energy_signal',
      from: 'ideator',
      to: 'facilitator',
    }));

    // Should appear in energy loop, NOT session loop
    const energyDir = join(
      brainstormDir, 'sessions', sessionId, 'bus', 'energy',
    );
    const sessionDir = join(
      brainstormDir, 'sessions', sessionId, 'bus', 'session',
    );

    const energyFiles = await readdir(energyDir);
    const sessionFiles = await readdir(sessionDir);

    expect(energyFiles).toHaveLength(1);
    expect(sessionFiles).toHaveLength(0);

    // Verify the message is readable from the energy loop
    const energyMessages = await bus.poll('energy');
    expect(energyMessages).toHaveLength(1);
    expect(energyMessages[0].type).toBe('energy_signal');
  });

  // ==========================================================================
  // Edge case: poll on empty/nonexistent loop returns empty array
  // ==========================================================================

  it('poll() returns empty array for empty loop directory', async () => {
    const { bus } = await createTestBus();

    const messages = await bus.poll('session');
    expect(messages).toEqual([]);
  });

  // ==========================================================================
  // Validation: publish rejects invalid messages
  // ==========================================================================

  it('publish() rejects messages that fail Zod validation', async () => {
    const { bus } = await createTestBus();

    const invalidMessage = {
      id: 'not-a-uuid',
      from: 'facilitator',
      to: 'broadcast',
      type: 'phase_transition',
      phase: 'diverge',
      payload: {},
      timestamp: Date.now(),
      session_id: 'not-a-uuid',
      priority: 1,
    };

    await expect(
      bus.publish('session', invalidMessage as unknown as BrainstormMessage),
    ).rejects.toThrow();
  });
});
