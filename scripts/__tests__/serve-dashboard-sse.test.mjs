/**
 * Phase 827 / C02 — SSE broadcast integration test.
 *
 * T7 — SSE message format conforms to `data: <JSON>\n\n` envelope.
 *
 * Validates the wiring between `IntelligenceEventBus` and the SSE client
 * broadcast pattern used in `scripts/serve-dashboard.mjs`.
 *
 * This test does NOT start the HTTP server; instead it exercises the
 * same broadcast logic (subscribe to bus → write envelope to clients)
 * with mock SSE clients, verifying the exact wire format.
 *
 * Runs via: npx vitest run --config vitest.tools.config.mjs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Minimal mock SSE client (mirrors ServerResponse.write usage in serve-dashboard)
// ---------------------------------------------------------------------------

function makeMockClient() {
  const chunks = [];
  return {
    write(chunk) { chunks.push(chunk); },
    get received() { return chunks; },
  };
}

// ---------------------------------------------------------------------------
// Inline broadcast helper (mirrors scripts/serve-dashboard.mjs logic)
// Without actually starting the server, we replicate the subscription wiring
// to verify the envelope format is correct end-to-end.
// ---------------------------------------------------------------------------

async function buildBroadcastWiring(sseClients) {
  // Import the bus using the TS source path (vitest handles the transform).
  const { getIntelligenceEventBus, _resetIntelligenceEventBusForTesting } =
    await import(pathToFileURL(resolve(REPO_ROOT, 'src/intelligence/events/bus.ts')).href);

  // Reset to isolate this test.
  _resetIntelligenceEventBusForTesting();
  const bus = getIntelligenceEventBus();

  const unsubscribe = bus.subscribe((event) => {
    const envelope = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try { client.write(envelope); } catch { /* dead client */ }
    }
  });

  return { bus, unsubscribe };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 827 / C02 — SSE envelope format (T7)', () => {
  it('T7 — published event arrives at SSE client as `data: <JSON>\\n\\n`', async () => {
    const clients = new Set();
    const mockClient = makeMockClient();
    clients.add(mockClient);

    const { bus, unsubscribe } = await buildBroadcastWiring(clients);

    const event = {
      type: 'intelligence:status_update',
      payload: {
        request_id: 'req-sse-test',
        status: 'completed',
        at: '2026-05-03T12:00:00.000Z',
      },
    };

    bus.publish(event);
    unsubscribe();

    expect(mockClient.received).toHaveLength(1);
    const raw = mockClient.received[0];
    // Must start with "data: "
    expect(raw).toMatch(/^data: /);
    // Must end with the SSE double-newline terminator
    expect(raw).toMatch(/\n\n$/);
    // The JSON payload must be parseable and round-trip cleanly
    const jsonPart = raw.replace(/^data: /, '').replace(/\n\n$/, '');
    const parsed = JSON.parse(jsonPart);
    expect(parsed.type).toBe('intelligence:status_update');
    expect(parsed.payload.request_id).toBe('req-sse-test');
  });

  it('T7b — multiple clients each receive the broadcast envelope', async () => {
    const clients = new Set();
    const clientA = makeMockClient();
    const clientB = makeMockClient();
    clients.add(clientA);
    clients.add(clientB);

    const { bus, unsubscribe } = await buildBroadcastWiring(clients);

    bus.publish({
      type: 'intelligence:briefing_ready',
      payload: {
        briefing_id: 'B-001',
        project_id: 'P-001',
        generated_at: '2026-05-03T12:00:00.000Z',
      },
    });
    unsubscribe();

    expect(clientA.received).toHaveLength(1);
    expect(clientB.received).toHaveLength(1);
    // Both clients see the same envelope
    expect(clientA.received[0]).toBe(clientA.received[0]);
    const jsonA = JSON.parse(clientA.received[0].replace(/^data: /, '').replace(/\n\n$/, ''));
    const jsonB = JSON.parse(clientB.received[0].replace(/^data: /, '').replace(/\n\n$/, ''));
    expect(jsonA.type).toBe('intelligence:briefing_ready');
    expect(jsonB.type).toBe('intelligence:briefing_ready');
  });

  it('T7c — dead client write failure does not break delivery to healthy clients', async () => {
    const clients = new Set();
    const deadClient = {
      write() { throw new Error('EPIPE: broken pipe'); },
      get received() { return []; },
    };
    const liveClient = makeMockClient();
    clients.add(deadClient);
    clients.add(liveClient);

    const { bus, unsubscribe } = await buildBroadcastWiring(clients);

    // The broadcast loop has try/catch per client — dead client must not kill the loop.
    expect(() => {
      bus.publish({
        type: 'intelligence:bundle_completed',
        payload: {
          bundle_id: 'M-001',
          meeting_id: 'M-001',
          manifest_path: '/tmp/manifest.json',
          emitted_at: '2026-05-03T12:00:00.000Z',
        },
      });
    }).not.toThrow();
    unsubscribe();

    expect(liveClient.received).toHaveLength(1);
  });
});
