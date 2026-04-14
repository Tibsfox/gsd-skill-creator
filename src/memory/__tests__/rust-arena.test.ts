/**
 * Unit tests for the RustArena TypeScript client.
 *
 * These tests do NOT talk to the real Rust backend — they use a mock
 * invoke function that records calls and returns canned responses. This
 * validates:
 *   - Command names and argument shapes match the Rust side
 *   - Base64 encoding/decoding works roundtrip
 *   - DTO ↔ public type conversions are correct
 *   - Error wrapping behaves correctly
 *
 * A separate integration test (not in this file) would spin up an actual
 * Tauri backend and exercise the real IPC. That's part of the future
 * benchmark harness, not the unit test suite.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  RustArena,
  RustArenaError,
  bytesToBase64,
  base64ToBytes,
  type InvokeFn,
  type TierKind,
  type ArenaStats,
} from '../rust-arena.js';

// ─── base64 helpers ──────────────────────────────────────────────────────────

describe('bytesToBase64 / base64ToBytes', () => {
  it('roundtrips empty buffer', () => {
    const empty = new Uint8Array(0);
    const b64 = bytesToBase64(empty);
    expect(b64).toBe('');
    expect(base64ToBytes(b64)).toEqual(empty);
  });

  it('roundtrips ASCII string', () => {
    const bytes = new TextEncoder().encode('hello amiga');
    const b64 = bytesToBase64(bytes);
    expect(base64ToBytes(b64)).toEqual(bytes);
  });

  it('roundtrips binary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 255, 254, 128, 127]);
    const b64 = bytesToBase64(bytes);
    const back = base64ToBytes(b64);
    expect(Array.from(back)).toEqual(Array.from(bytes));
  });

  it('roundtrips larger buffer (64 KiB)', () => {
    const bytes = new Uint8Array(64 * 1024);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = (i * 31) & 0xff;
    }
    const back = base64ToBytes(bytesToBase64(bytes));
    expect(back.length).toBe(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      expect(back[i]).toBe(bytes[i]);
    }
  });

  it('matches known base64 encodings', () => {
    expect(bytesToBase64(new TextEncoder().encode('a'))).toBe('YQ==');
    expect(bytesToBase64(new TextEncoder().encode('ab'))).toBe('YWI=');
    expect(bytesToBase64(new TextEncoder().encode('abc'))).toBe('YWJj');
  });
});

// ─── mock invoke factory ─────────────────────────────────────────────────────

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

function stubStats(overrides: Partial<ArenaStats> = {}): ArenaStats {
  return {
    totalSlots: 4,
    freeSlots: 4,
    allocatedSlots: 0,
    totalBytes: 16 * 1024,
    freeBytes: 16 * 1024,
    allocatedBytes: 0,
    nextChunkId: 1,
    ...overrides,
  };
}

// ─── init() ──────────────────────────────────────────────────────────────────

describe('RustArena.init', () => {
  it('sends arena_init with camelCase request', async () => {
    const { invoke, calls } = makeMock(() => ({
      initialized: true,
      recovered: false,
      checkpointPath: '/tmp/arena/arena.checkpoint',
      journalPath: '/tmp/arena/arena.journal',
      stats: stubStats(),
    }));
    const arena = new RustArena(invoke);

    const result = await arena.init({
      dir: '/tmp/arena',
      numSlots: 4,
      chunkSize: 4096,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe('arena_init');
    expect(calls[0].args).toEqual({
      req: {
        dir: '/tmp/arena',
        numSlots: 4,
        chunkSize: 4096,
        minChunkSize: undefined,
        maxChunkSize: undefined,
      },
    });
    expect(result.initialized).toBe(true);
    expect(result.recovered).toBe(false);
    expect(result.stats.totalSlots).toBe(4);
  });

  it('reports recovered flag when loading an existing checkpoint', async () => {
    const { invoke } = makeMock(() => ({
      initialized: true,
      recovered: true,
      checkpointPath: '/tmp/arena/arena.checkpoint',
      journalPath: '/tmp/arena/arena.journal',
      stats: stubStats({ allocatedSlots: 2, freeSlots: 2 }),
    }));
    const arena = new RustArena(invoke);

    const result = await arena.init({ dir: '/tmp/arena', numSlots: 4 });
    expect(result.recovered).toBe(true);
    expect(result.stats.allocatedSlots).toBe(2);
  });
});

// ─── stats() ─────────────────────────────────────────────────────────────────

describe('RustArena.stats', () => {
  it('sends arena_stats and unwraps the response', async () => {
    const { invoke, calls } = makeMock(() =>
      stubStats({ allocatedSlots: 1, freeSlots: 3, nextChunkId: 42 }),
    );
    const arena = new RustArena(invoke);

    const stats = await arena.stats();
    expect(calls[0].command).toBe('arena_stats');
    expect(stats.allocatedSlots).toBe(1);
    expect(stats.nextChunkId).toBe(42);
  });
});

// ─── alloc() ─────────────────────────────────────────────────────────────────

describe('RustArena.alloc', () => {
  it('encodes payload as base64 and returns chunk id', async () => {
    const { invoke, calls } = makeMock(() => ({ chunkId: 7 }));
    const arena = new RustArena(invoke);

    const payload = new TextEncoder().encode('the amiga principle');
    const id = await arena.alloc('warm', payload);

    expect(id).toBe(7);
    expect(calls[0].command).toBe('arena_alloc');
    const req = (calls[0].args as { req: { tier: string; payloadBase64: string } })
      .req;
    expect(req.tier).toBe('warm');
    // Verify the base64 matches what the helper would produce.
    expect(req.payloadBase64).toBe(bytesToBase64(payload));
    // And decodes back to the same bytes.
    expect(base64ToBytes(req.payloadBase64)).toEqual(payload);
  });

  it('handles every tier kind', async () => {
    const tiers: TierKind[] = ['hot', 'warm', 'vector', 'blob', 'resident'];
    let nextId = 1;
    const { invoke, calls } = makeMock(() => ({ chunkId: nextId++ }));
    const arena = new RustArena(invoke);

    for (const tier of tiers) {
      await arena.alloc(tier, new Uint8Array([0]));
    }

    expect(calls).toHaveLength(tiers.length);
    for (let i = 0; i < tiers.length; i++) {
      const req = (calls[i].args as { req: { tier: string } }).req;
      expect(req.tier).toBe(tiers[i]);
    }
  });

  it('handles empty payload', async () => {
    const { invoke, calls } = makeMock(() => ({ chunkId: 1 }));
    const arena = new RustArena(invoke);

    await arena.alloc('resident', new Uint8Array(0));
    const req = (calls[0].args as { req: { payloadBase64: string } }).req;
    expect(req.payloadBase64).toBe('');
  });
});

// ─── get() ───────────────────────────────────────────────────────────────────

describe('RustArena.get', () => {
  it('decodes base64 payload into Uint8Array', async () => {
    const originalBytes = new Uint8Array([10, 20, 30, 40, 50]);
    const { invoke, calls } = makeMock(() => ({
      chunkId: 5,
      tier: 'hot',
      payloadBase64: bytesToBase64(originalBytes),
      payloadSize: originalBytes.length,
      accessCount: 3,
      createdAtNs: 1_000_000,
      lastAccessNs: 2_000_000,
    }));
    const arena = new RustArena(invoke);

    const chunk = await arena.get(5);

    expect(calls[0].command).toBe('arena_get');
    expect(calls[0].args).toEqual({ chunkId: 5 });
    expect(chunk.chunkId).toBe(5);
    expect(chunk.tier).toBe('hot');
    expect(Array.from(chunk.payload)).toEqual(Array.from(originalBytes));
    expect(chunk.accessCount).toBe(3);
    expect(chunk.payloadSize).toBe(5);
  });

  it('returns all 5 tier kinds unchanged', async () => {
    const tiers: TierKind[] = ['hot', 'warm', 'vector', 'blob', 'resident'];
    for (const tier of tiers) {
      const { invoke } = makeMock(() => ({
        chunkId: 1,
        tier,
        payloadBase64: '',
        payloadSize: 0,
        accessCount: 0,
        createdAtNs: 0,
        lastAccessNs: 0,
      }));
      const arena = new RustArena(invoke);
      const chunk = await arena.get(1);
      expect(chunk.tier).toBe(tier);
    }
  });
});

// ─── free() / touch() ────────────────────────────────────────────────────────

describe('RustArena.free', () => {
  it('sends arena_free with chunkId argument', async () => {
    const { invoke, calls } = makeMock(() => null);
    const arena = new RustArena(invoke);

    await arena.free(99);
    expect(calls[0].command).toBe('arena_free');
    expect(calls[0].args).toEqual({ chunkId: 99 });
  });
});

describe('RustArena.touch', () => {
  it('sends arena_touch with chunkId argument', async () => {
    const { invoke, calls } = makeMock(() => null);
    const arena = new RustArena(invoke);

    await arena.touch(3);
    expect(calls[0].command).toBe('arena_touch');
    expect(calls[0].args).toEqual({ chunkId: 3 });
  });
});

// ─── checkpoint() ────────────────────────────────────────────────────────────

describe('RustArena.checkpoint', () => {
  it('sends arena_checkpoint and unwraps stats', async () => {
    const { invoke, calls } = makeMock(() => ({
      checkpointed: true,
      stats: stubStats({ allocatedSlots: 3 }),
    }));
    const arena = new RustArena(invoke);

    const result = await arena.checkpoint();
    expect(calls[0].command).toBe('arena_checkpoint');
    expect(result.checkpointed).toBe(true);
    expect(result.stats.allocatedSlots).toBe(3);
  });
});

// ─── listIds() ───────────────────────────────────────────────────────────────

describe('RustArena.listIds', () => {
  it('returns the ids from the wire response', async () => {
    const { invoke, calls } = makeMock(() => ({ chunkIds: [1, 4, 7, 99] }));
    const arena = new RustArena(invoke);

    const ids = await arena.listIds();
    expect(calls[0].command).toBe('arena_list_ids');
    expect(ids).toEqual([1, 4, 7, 99]);
  });

  it('returns empty array for an empty arena', async () => {
    const { invoke } = makeMock(() => ({ chunkIds: [] }));
    const arena = new RustArena(invoke);
    expect(await arena.listIds()).toEqual([]);
  });
});

// ─── error handling ──────────────────────────────────────────────────────────

describe('error handling', () => {
  it('wraps invoke errors in RustArenaError', async () => {
    const invoke: InvokeFn = vi.fn(async () => {
      throw new Error('arena not initialized');
    });
    const arena = new RustArena(invoke);

    await expect(arena.stats()).rejects.toThrow(RustArenaError);
    try {
      await arena.stats();
    } catch (err) {
      expect(err).toBeInstanceOf(RustArenaError);
      if (err instanceof RustArenaError) {
        expect(err.command).toBe('arena_stats');
        expect(err.message).toBe('arena not initialized');
      }
    }
  });

  it('preserves the command name on error', async () => {
    const invoke: InvokeFn = async (cmd) => {
      throw new Error(`failed: ${cmd}`);
    };
    const arena = new RustArena(invoke);

    try {
      await arena.alloc('hot', new Uint8Array([1, 2, 3]));
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RustArenaError);
      if (err instanceof RustArenaError) {
        expect(err.command).toBe('arena_alloc');
      }
    }
  });

  it('wraps non-Error throwables', async () => {
    const invoke: InvokeFn = async () => {
      throw 'plain string error';
    };
    const arena = new RustArena(invoke);

    try {
      await arena.stats();
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RustArenaError);
      if (err instanceof RustArenaError) {
        expect(err.message).toBe('plain string error');
      }
    }
  });
});

// ─── end-to-end scenario with mock ───────────────────────────────────────────

describe('end-to-end (mock) scenario', () => {
  /**
   * This test simulates a realistic usage pattern against an in-memory
   * mock of the Rust backend. Every IPC call is intercepted and handled
   * by a stateful mock that mirrors (approximately) what the real Rust
   * arena would do. This validates that the client composes correctly.
   */
  it('alloc → get → list → free → checkpoint', async () => {
    // Tiny in-memory mock arena.
    interface MockChunk {
      tier: string;
      payloadBase64: string;
      payloadSize: number;
      accessCount: number;
    }
    const chunks = new Map<number, MockChunk>();
    let nextId = 1;
    let initialized = false;

    const invoke: InvokeFn = async (cmd, args) => {
      switch (cmd) {
        case 'arena_init': {
          initialized = true;
          return {
            initialized: true,
            recovered: false,
            checkpointPath: '/mock/arena.checkpoint',
            journalPath: '/mock/arena.journal',
            stats: stubStats(),
          };
        }
        case 'arena_alloc': {
          if (!initialized) throw new Error('not initialized');
          const { tier, payloadBase64 } = (args as {
            req: { tier: string; payloadBase64: string };
          }).req;
          const id = nextId++;
          chunks.set(id, {
            tier,
            payloadBase64,
            payloadSize: base64ToBytes(payloadBase64).length,
            accessCount: 0,
          });
          return { chunkId: id };
        }
        case 'arena_get': {
          const { chunkId } = args as { chunkId: number };
          const chunk = chunks.get(chunkId);
          if (!chunk) throw new Error(`not found: ${chunkId}`);
          return {
            chunkId,
            tier: chunk.tier,
            payloadBase64: chunk.payloadBase64,
            payloadSize: chunk.payloadSize,
            accessCount: chunk.accessCount,
            createdAtNs: 0,
            lastAccessNs: 0,
          };
        }
        case 'arena_free': {
          const { chunkId } = args as { chunkId: number };
          if (!chunks.delete(chunkId))
            throw new Error(`not found: ${chunkId}`);
          return null;
        }
        case 'arena_list_ids': {
          return { chunkIds: Array.from(chunks.keys()) };
        }
        case 'arena_checkpoint': {
          return { checkpointed: true, stats: stubStats() };
        }
        case 'arena_stats': {
          return stubStats({
            allocatedSlots: chunks.size,
            freeSlots: 4 - chunks.size,
          });
        }
        default:
          throw new Error(`unknown command: ${cmd}`);
      }
    };

    const arena = new RustArena(invoke);
    await arena.init({ dir: '/mock', numSlots: 4 });

    const payload1 = new TextEncoder().encode('alpha');
    const payload2 = new TextEncoder().encode('bravo');

    const id1 = await arena.alloc('hot', payload1);
    const id2 = await arena.alloc('warm', payload2);
    expect(id1).toBe(1);
    expect(id2).toBe(2);

    // Read both back and verify payloads match.
    const chunk1 = await arena.get(id1);
    expect(new TextDecoder().decode(chunk1.payload)).toBe('alpha');
    expect(chunk1.tier).toBe('hot');

    const chunk2 = await arena.get(id2);
    expect(new TextDecoder().decode(chunk2.payload)).toBe('bravo');
    expect(chunk2.tier).toBe('warm');

    // List should have both.
    const ids = await arena.listIds();
    expect(ids.sort()).toEqual([1, 2]);

    // Free one.
    await arena.free(id1);
    const idsAfter = await arena.listIds();
    expect(idsAfter).toEqual([2]);

    // Checkpoint.
    const ckpt = await arena.checkpoint();
    expect(ckpt.checkpointed).toBe(true);

    // Stats reflect state.
    const stats = await arena.stats();
    expect(stats.allocatedSlots).toBe(1);
    expect(stats.freeSlots).toBe(3);
  });
});
