/**
 * Unit tests for the RustArenaSet TypeScript client.
 *
 * Mock invoke pattern — validates command names, argument shapes, base64
 * encoding, and DTO conversions without hitting the real Rust backend.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  RustArenaSet,
  ArenaSetError,
  type ArenaSetInitOptions,
} from '../rust-arena-set.js';
import { bytesToBase64, base64ToBytes, type InvokeFn } from '../rust-arena.js';

// ─── mock invoke factory ────────────────────────────────────────────────────

interface MockCall {
  command: string;
  args?: Record<string, unknown>;
}

function makeMock(
  handler: (call: MockCall) => unknown,
): { invoke: InvokeFn; calls: MockCall[] } {
  const calls: MockCall[] = [];
  const invoke: InvokeFn = async (command, args) => {
    const call = { command, args };
    calls.push(call);
    return handler(call);
  };
  return { invoke, calls };
}

// ─── init() ─────────────────────────────────────────────────────────────────

describe('RustArenaSet.init', () => {
  it('sends arena_set_init with pool specs', async () => {
    const { invoke, calls } = makeMock(() => ({
      initialized: true,
      poolCount: 2,
      tiers: ['hot', 'blob'],
    }));
    const arena = new RustArenaSet(invoke);

    const result = await arena.init({
      dir: '/tmp/arena-set',
      chunkSize: 4096,
      pools: [
        { tier: 'hot', numSlots: 8 },
        { tier: 'blob', numSlots: 16 },
      ],
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe('arena_set_init');
    expect(result.initialized).toBe(true);
    expect(result.poolCount).toBe(2);
    expect(result.tiers).toEqual(['hot', 'blob']);
  });

  it('idempotent — second call returns existing state', async () => {
    let callCount = 0;
    const { invoke } = makeMock(() => {
      callCount++;
      return {
        initialized: true,
        poolCount: 2,
        tiers: ['hot', 'blob'],
      };
    });
    const arena = new RustArenaSet(invoke);

    await arena.init({ dir: '/tmp/x', pools: [{ tier: 'hot', numSlots: 4 }] });
    await arena.init({ dir: '/tmp/x', pools: [{ tier: 'hot', numSlots: 4 }] });
    expect(callCount).toBe(2); // Both calls go through to IPC
  });
});

// ─── alloc() ────────────────────────────────────────────────────────────────

describe('RustArenaSet.alloc', () => {
  it('sends tier and base64 payload', async () => {
    const { invoke, calls } = makeMock(() => ({ chunkId: 42 }));
    const arena = new RustArenaSet(invoke);

    const payload = new TextEncoder().encode('grove record');
    const id = await arena.alloc('warm', payload);

    expect(id).toBe(42);
    expect(calls[0].command).toBe('arena_set_alloc');
    expect(calls[0].args).toEqual({
      tier: 'warm',
      payloadBase64: bytesToBase64(payload),
    });
  });

  it('handles empty payload', async () => {
    const { invoke, calls } = makeMock(() => ({ chunkId: 1 }));
    const arena = new RustArenaSet(invoke);

    await arena.alloc('resident', new Uint8Array(0));
    expect((calls[0].args as { payloadBase64: string }).payloadBase64).toBe('');
  });
});

// ─── getHot() ───────────────────────────────────────────────────────────────

describe('RustArenaSet.getHot', () => {
  it('decodes base64 payload from hot path response', async () => {
    const original = new Uint8Array([10, 20, 30, 40]);
    const { invoke, calls } = makeMock(() => ({
      chunkId: 7,
      payloadBase64: bytesToBase64(original),
      payloadSize: original.length,
    }));
    const arena = new RustArenaSet(invoke);

    const result = await arena.getHot('hot', 7);
    expect(calls[0].command).toBe('arena_set_get_hot');
    expect(calls[0].args).toEqual({ tier: 'hot', chunkId: 7 });
    expect(result.chunkId).toBe(7);
    expect(Array.from(result.payload)).toEqual([10, 20, 30, 40]);
    expect(result.payloadSize).toBe(4);
  });
});

// ─── free() ─────────────────────────────────────────────────────────────────

describe('RustArenaSet.free', () => {
  it('sends tier and chunkId', async () => {
    const { invoke, calls } = makeMock(() => null);
    const arena = new RustArenaSet(invoke);

    await arena.free('blob', 55);
    expect(calls[0].command).toBe('arena_set_free');
    expect(calls[0].args).toEqual({ tier: 'blob', chunkId: 55 });
  });
});

// ─── sweep() ────────────────────────────────────────────────────────────────

describe('RustArenaSet.sweep', () => {
  it('returns sweep report', async () => {
    const { invoke, calls } = makeMock(() => ({
      promotesInitiated: 3,
      promotesCompleted: 2,
      demotesInitiated: 1,
      demotesCompleted: 1,
      evictions: 0,
      skippedCooldown: 1,
      errorCount: 0,
    }));
    const arena = new RustArenaSet(invoke);

    const report = await arena.sweep();
    expect(calls[0].command).toBe('arena_set_sweep');
    expect(report.promotesCompleted).toBe(2);
    expect(report.demotesCompleted).toBe(1);
    expect(report.skippedCooldown).toBe(1);
  });
});

// ─── gc() ───────────────────────────────────────────────────────────────────

describe('RustArenaSet.gc', () => {
  it('returns GC report', async () => {
    const { invoke, calls } = makeMock(() => ({
      targetsFreed: 5,
      sourcesReverted: 3,
    }));
    const arena = new RustArenaSet(invoke);

    const report = await arena.gc();
    expect(calls[0].command).toBe('arena_set_gc');
    expect(report.targetsFreed).toBe(5);
    expect(report.sourcesReverted).toBe(3);
  });
});

// ─── flush() ────────────────────────────────────────────────────────────────

describe('RustArenaSet.flush', () => {
  it('sends arena_set_flush', async () => {
    const { invoke, calls } = makeMock(() => null);
    const arena = new RustArenaSet(invoke);

    await arena.flush();
    expect(calls[0].command).toBe('arena_set_flush');
  });
});

// ─── error handling ─────────────────────────────────────────────────────────

describe('error handling', () => {
  it('wraps invoke errors in ArenaSetError', async () => {
    const invoke: InvokeFn = vi.fn(async () => {
      throw new Error('arena set not initialized');
    });
    const arena = new RustArenaSet(invoke);

    await expect(arena.sweep()).rejects.toThrow(ArenaSetError);
    try {
      await arena.sweep();
    } catch (err) {
      expect(err).toBeInstanceOf(ArenaSetError);
      if (err instanceof ArenaSetError) {
        expect(err.command).toBe('arena_set_sweep');
      }
    }
  });

  it('wraps non-Error throwables', async () => {
    const invoke: InvokeFn = async () => {
      throw 'plain string error';
    };
    const arena = new RustArenaSet(invoke);

    try {
      await arena.gc();
    } catch (err) {
      expect(err).toBeInstanceOf(ArenaSetError);
      if (err instanceof ArenaSetError) {
        expect(err.message).toBe('plain string error');
      }
    }
  });
});

// ─── end-to-end (mock) scenario ─────────────────────────────────────────────

describe('end-to-end (mock) scenario', () => {
  it('init → alloc → getHot → free → sweep → gc → flush', async () => {
    interface MockChunk {
      tier: string;
      payloadBase64: string;
    }
    const chunks = new Map<string, MockChunk>(); // key = "tier:id"
    let nextId = 1;

    const invoke: InvokeFn = async (cmd, args) => {
      switch (cmd) {
        case 'arena_set_init':
          return { initialized: true, poolCount: 2, tiers: ['hot', 'blob'] };

        case 'arena_set_alloc': {
          const a = args as { tier: string; payloadBase64: string };
          const id = nextId++;
          chunks.set(`${a.tier}:${id}`, { tier: a.tier, payloadBase64: a.payloadBase64 });
          return { chunkId: id };
        }

        case 'arena_set_get_hot': {
          const g = args as { tier: string; chunkId: number };
          const chunk = chunks.get(`${g.tier}:${g.chunkId}`);
          if (!chunk) throw new Error('not found');
          return {
            chunkId: g.chunkId,
            payloadBase64: chunk.payloadBase64,
            payloadSize: base64ToBytes(chunk.payloadBase64).length,
          };
        }

        case 'arena_set_free': {
          const f = args as { tier: string; chunkId: number };
          chunks.delete(`${f.tier}:${f.chunkId}`);
          return null;
        }

        case 'arena_set_sweep':
          return {
            promotesInitiated: 0, promotesCompleted: 0,
            demotesInitiated: 0, demotesCompleted: 0,
            evictions: 0, skippedCooldown: 0, errorCount: 0,
          };

        case 'arena_set_gc':
          return { targetsFreed: 0, sourcesReverted: 0 };

        case 'arena_set_flush':
          return null;

        default:
          throw new Error(`unknown command: ${cmd}`);
      }
    };

    const arena = new RustArenaSet(invoke);
    await arena.init({
      dir: '/mock',
      pools: [{ tier: 'hot', numSlots: 8 }, { tier: 'blob', numSlots: 16 }],
    });

    const payload = new TextEncoder().encode('grove record alpha');
    const id = await arena.alloc('hot', payload);
    expect(id).toBe(1);

    const chunk = await arena.getHot('hot', id);
    expect(new TextDecoder().decode(chunk.payload)).toBe('grove record alpha');

    await arena.free('hot', id);
    await expect(arena.getHot('hot', id)).rejects.toThrow();

    const sweep = await arena.sweep();
    expect(sweep.promotesCompleted).toBe(0);

    const gc = await arena.gc();
    expect(gc.targetsFreed).toBe(0);

    await arena.flush();
  });
});
