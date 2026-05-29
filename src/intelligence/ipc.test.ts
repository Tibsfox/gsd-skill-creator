/**
 * EgressContext wire test for src/intelligence/ipc.ts (v1.49.881 Track 5 CLOSE).
 *
 * The ipc module uses a setter-based singleton for EgressContext rather than
 * threading ctx? through ~20 exported wrapper functions. Tests verify:
 *   1. The setter accepts undefined (legacy permissive default).
 *   2. The setter accepts a permissive ctx and records audit events.
 *   3. A denying ctx causes invoke() to throw EgressContextDenied.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type EgressContext,
  EgressContextDenied,
  NULL_EGRESS_AUDIT_SINK,
} from '../security/egress-context.js';
import { intelligenceIpc, setIpcEgressContext } from './ipc.js';

describe('intelligence/ipc EgressContext wire (v1.49.881)', () => {
  afterEach(() => {
    // Reset singleton between tests.
    setIpcEgressContext(undefined);
    vi.restoreAllMocks();
  });

  it('default (undefined ctx) preserves legacy behavior: fetch fires through', async () => {
    setIpcEgressContext(undefined);

    // Mock fetch to return a successful response.
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ projects: [] }), { status: 200 }),
      );
    vi.stubGlobal('fetch', mockFetch);

    // Use any function that wraps invoke; listProjects() is the simplest.
    await intelligenceIpc.listProjects();
    expect(mockFetch).toHaveBeenCalled();
  });

  it('throws EgressContextDenied when ctx denies egress', async () => {
    const ctx: EgressContext = {
      allowList: [],
      audit: NULL_EGRESS_AUDIT_SINK,
    };
    setIpcEgressContext(ctx);

    // fetch should NOT be called — the hoist throws first.
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(intelligenceIpc.listProjects()).rejects.toBeInstanceOf(
      EgressContextDenied,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('records audit event with source=intelligence/ipc when ctx is permissive', async () => {
    const events: Array<{ source: string; target: string }> = [];
    const ctx: EgressContext = {
      allowList: [/.*/],
      audit: {
        record: (e) => events.push({ source: e.source, target: e.target }),
      },
    };
    setIpcEgressContext(ctx);

    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    await intelligenceIpc.listProjects();

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].source).toBe('intelligence/ipc');
    expect(events[0].target).toBe('/api/intelligence/invoke');
  });
});
