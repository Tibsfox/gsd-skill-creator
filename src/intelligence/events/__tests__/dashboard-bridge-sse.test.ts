/**
 * H3-R2: Dashboard SSE bridge — atlas:cache.invalidated forwarding.
 *
 * Validates that publishing atlas:cache.invalidated on the IntelligenceEventBus
 * results in the event being forwarded to all SSE clients within reasonable time.
 *
 * The serve-dashboard.mjs SSE bridge uses a generic bus.subscribe() that
 * broadcasts ALL IntelligenceEvent variants (atlas:indexing.*, atlas:cache.invalidated,
 * intelligence:*). This test drives the bus directly (without starting the HTTP
 * server) and confirms the forwarding contract for the cache-invalidation event.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IntelligenceEvent, AtlasCacheInvalidatedPayload } from '../types.js';

/**
 * Minimal SSE-client double: collects all raw payload strings written to it.
 */
function makeClientDouble() {
  const written: string[] = [];
  return {
    write(chunk: string) {
      written.push(chunk);
    },
    get received() {
      return written;
    },
  };
}

// Reset the event bus singleton before each test so subscriber sets are clean.
beforeEach(async () => {
  const { _resetIntelligenceEventBusForTesting } = await import('../bus.js');
  _resetIntelligenceEventBusForTesting();
});

describe('H3-R2 — atlas:cache.invalidated SSE bridge', () => {
  it('publishing atlas:cache.invalidated delivers the event to all subscribed SSE clients', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();

    // Simulate what serve-dashboard.mjs loadIntelligenceEventBus() does:
    // subscribe once and forward every event to all SSE clients.
    const sseClients: ReturnType<typeof makeClientDouble>[] = [];
    bus.subscribe((event) => {
      const envelope = `data: ${JSON.stringify(event)}\n\n`;
      for (const client of sseClients) {
        try { client.write(envelope); } catch { /* dead client */ }
      }
    });

    // Register two simulated browser clients.
    const clientA = makeClientDouble();
    const clientB = makeClientDouble();
    sseClients.push(clientA, clientB);

    // Emit the cache-invalidated event (the G2 event type under test).
    const payload: AtlasCacheInvalidatedPayload = {
      project_id: 'gsd-skill-creator',
      at: '2026-05-05T00:00:00.000Z',
    };
    const event: IntelligenceEvent = { type: 'atlas:cache.invalidated', payload };
    bus.publish(event);

    // Both clients must have received exactly one SSE envelope.
    expect(clientA.received).toHaveLength(1);
    expect(clientB.received).toHaveLength(1);

    // The envelope must be valid SSE format and contain the event type.
    const envA = clientA.received[0]!;
    expect(envA).toMatch(/^data: /);
    expect(envA).toContain('atlas:cache.invalidated');
    expect(envA).toContain('gsd-skill-creator');

    // Round-trip: the embedded JSON must parse back to the original event.
    const jsonStr = envA.replace(/^data: /, '').replace(/\n\n$/, '');
    const parsed = JSON.parse(jsonStr) as IntelligenceEvent;
    expect(parsed.type).toBe('atlas:cache.invalidated');
    if (parsed.type === 'atlas:cache.invalidated') {
      expect(parsed.payload.project_id).toBe('gsd-skill-creator');
    }
  });

  it('atlas:cache.invalidated does not interfere with other event types on the same bus', async () => {
    const { getIntelligenceEventBus } = await import('../bus.js');
    const bus = getIntelligenceEventBus();

    const received: string[] = [];
    const client = makeClientDouble();
    bus.subscribe((event) => {
      client.write(`data: ${JSON.stringify(event)}\n\n`);
      received.push(event.type);
    });

    // Publish three different event types in sequence.
    bus.publish({
      type: 'atlas:indexing.started',
      payload: { snapshot_id: 'snap-1' },
    });
    bus.publish({
      type: 'atlas:cache.invalidated',
      payload: { project_id: 'proj-a', at: '2026-05-05T00:00:00.000Z' },
    });
    bus.publish({
      type: 'atlas:indexing.completed',
      payload: { snapshot_id: 'snap-1', project_id: 'proj-a', symbols_count: 10, calls_count: 2, files_count: 3 },
    });

    expect(received).toEqual([
      'atlas:indexing.started',
      'atlas:cache.invalidated',
      'atlas:indexing.completed',
    ]);
    expect(client.received).toHaveLength(3);
  });
});
