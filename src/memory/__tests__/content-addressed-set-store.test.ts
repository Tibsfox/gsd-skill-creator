/**
 * Unit tests for ContentAddressedSetStore — tier-aware content-addressed
 * store backed by RustArenaSet.
 *
 * Uses a mock RustArenaSet that stores chunks in memory, keyed by
 * "tier:chunkId". Validates: put/get roundtrip, deduplication, tier
 * routing, removal, sweep/gc/flush passthrough.
 */

import { describe, it, expect } from 'vitest';
import {
  ContentAddressedSetStore,
  sha256,
} from '../content-addressed-set-store.js';
import { RustArenaSet } from '../rust-arena-set.js';
import { bytesToBase64, base64ToBytes, type InvokeFn } from '../rust-arena.js';

// ─── mock RustArenaSet ──────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
}

function makeMockArenaSet(): RustArenaSet {
  const chunks = new Map<string, MockChunk>();
  let nextId = 1;
  let sweepCalls = 0;
  let gcCalls = 0;
  let flushCalls = 0;

  const invoke: InvokeFn = async (cmd, args) => {
    switch (cmd) {
      case 'arena_set_init':
        return { initialized: true, poolCount: 3, tiers: ['hot', 'warm', 'blob'] };

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
        if (!chunks.delete(`${f.tier}:${f.chunkId}`)) throw new Error('not found');
        return null;
      }

      case 'arena_set_list_ids': {
        const l = args as { tier: string };
        const ids: number[] = [];
        for (const key of chunks.keys()) {
          const [t, id] = key.split(':');
          if (t === l.tier) ids.push(parseInt(id, 10));
        }
        return { chunkIds: ids };
      }

      case 'arena_set_sweep':
        sweepCalls++;
        return {
          promotesInitiated: 0, promotesCompleted: 0,
          demotesInitiated: 0, demotesCompleted: 0,
          evictions: 0, skippedCooldown: 0, errorCount: 0,
        };

      case 'arena_set_gc':
        gcCalls++;
        return { targetsFreed: 0, sourcesReverted: 0 };

      case 'arena_set_flush':
        flushCalls++;
        return null;

      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };

  return new RustArenaSet(invoke);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function makeStore(arena?: RustArenaSet): ContentAddressedSetStore {
  return new ContentAddressedSetStore({
    arena: arena ?? makeMockArenaSet(),
    defaultTier: 'blob',
  });
}

// ─── put / get roundtrip ────────────────────────────────────────────────────

describe('ContentAddressedSetStore.put + getByHash', () => {
  it('stores and retrieves bytes by hash', async () => {
    const store = makeStore();
    const bytes = new TextEncoder().encode('hello grove');
    const hash = sha256(bytes);

    const result = await store.put(hash, bytes);
    expect(result.created).toBe(true);
    expect(result.tier).toBe('blob');

    const retrieved = await store.getByHash(hash);
    expect(retrieved).not.toBeNull();
    expect(new TextDecoder().decode(retrieved!)).toBe('hello grove');
  });

  it('accepts hex string hashes', async () => {
    const store = makeStore();
    const bytes = new Uint8Array([1, 2, 3]);
    const hashHex = Buffer.from(sha256(bytes)).toString('hex');

    const result = await store.put(hashHex, bytes);
    expect(result.created).toBe(true);

    const back = await store.getByHash(hashHex);
    expect(Array.from(back!)).toEqual([1, 2, 3]);
  });

  it('returns null for missing hash', async () => {
    const store = makeStore();
    const result = await store.getByHash('aa'.repeat(32));
    expect(result).toBeNull();
  });
});

// ─── deduplication ──────────────────────────────────────────────────────────

describe('deduplication', () => {
  it('second put with same hash returns created=false', async () => {
    const store = makeStore();
    const bytes = new TextEncoder().encode('deduplicate me');
    const hash = sha256(bytes);

    const first = await store.put(hash, bytes);
    const second = await store.put(hash, bytes);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.chunkId).toBe(first.chunkId);
    expect(store.size()).toBe(1);
  });
});

// ─── tier routing ───────────────────────────────────────────────────────────

describe('tier routing', () => {
  it('defaults to blob tier', async () => {
    const store = makeStore();
    const bytes = new Uint8Array([42]);
    const result = await store.put(sha256(bytes), bytes);
    expect(result.tier).toBe('blob');
  });

  it('respects explicit tier hint', async () => {
    const store = makeStore();
    const bytes = new Uint8Array([42]);
    const result = await store.put(sha256(bytes), bytes, 'hot');
    expect(result.tier).toBe('hot');
  });

  it('different tier hint for different records', async () => {
    const store = makeStore();
    const bytes1 = new TextEncoder().encode('bootstrap');
    const bytes2 = new TextEncoder().encode('large payload');

    const r1 = await store.put(sha256(bytes1), bytes1, 'hot');
    const r2 = await store.put(sha256(bytes2), bytes2, 'blob');

    expect(r1.tier).toBe('hot');
    expect(r2.tier).toBe('blob');
  });
});

// ─── putAuto ────────────────────────────────────────────────────────────────

describe('putAuto', () => {
  it('auto-hashes with SHA-256 and stores', async () => {
    const store = makeStore();
    const bytes = new TextEncoder().encode('auto-hashed');

    const result = await store.putAuto(bytes);
    expect(result.created).toBe(true);

    // Verify retrievable via the same SHA-256 hash.
    const hash = sha256(bytes);
    const back = await store.getByHash(hash);
    expect(new TextDecoder().decode(back!)).toBe('auto-hashed');
  });

  it('auto-hashed deduplicates', async () => {
    const store = makeStore();
    const bytes = new TextEncoder().encode('same content');

    const r1 = await store.putAuto(bytes);
    const r2 = await store.putAuto(bytes);
    expect(r1.created).toBe(true);
    expect(r2.created).toBe(false);
    expect(r2.chunkId).toBe(r1.chunkId);
  });
});

// ─── hasHash ────────────────────────────────────────────────────────────────

describe('hasHash', () => {
  it('returns true for stored hash', async () => {
    const store = makeStore();
    const bytes = new Uint8Array([10]);
    const hash = sha256(bytes);
    await store.put(hash, bytes);
    expect(await store.hasHash(hash)).toBe(true);
  });

  it('returns false for missing hash', async () => {
    const store = makeStore();
    expect(await store.hasHash('bb'.repeat(32))).toBe(false);
  });
});

// ─── removeByHash ───────────────────────────────────────────────────────────

describe('removeByHash', () => {
  it('removes and returns true', async () => {
    const store = makeStore();
    const bytes = new Uint8Array([99]);
    const hash = sha256(bytes);
    await store.put(hash, bytes);

    const removed = await store.removeByHash(hash);
    expect(removed).toBe(true);
    expect(await store.hasHash(hash)).toBe(false);
    expect(await store.getByHash(hash)).toBeNull();
  });

  it('returns false for missing hash', async () => {
    const store = makeStore();
    expect(await store.removeByHash('cc'.repeat(32))).toBe(false);
  });
});

// ─── listHashes / count ─────────────────────────────────────────────────────

describe('listHashes / count', () => {
  it('returns all stored hashes', async () => {
    const store = makeStore();
    const a = new Uint8Array([1]);
    const b = new Uint8Array([2]);
    await store.put(sha256(a), a);
    await store.put(sha256(b), b);

    const hashes = await store.listHashes();
    expect(hashes).toHaveLength(2);
    expect(await store.count()).toBe(2);
  });
});

// ─── sweep / gc / flush passthrough ─────────────────────────────────────────

describe('arena operations passthrough', () => {
  it('sweep delegates to arena', async () => {
    const store = makeStore();
    const report = await store.sweep();
    expect(report.promotesCompleted).toBe(0);
  });

  it('gc delegates to arena', async () => {
    const store = makeStore();
    const report = await store.gc();
    expect(report.targetsFreed).toBe(0);
  });

  it('flush delegates to arena', async () => {
    const store = makeStore();
    await store.flush(); // Should not throw.
  });
});

// ─── registerEntry ──────────────────────────────────────────────────────────

describe('registerEntry', () => {
  it('pre-populates index for migration', async () => {
    const store = makeStore();
    store.registerEntry('aa'.repeat(32), 'hot', 42);

    expect(await store.hasHash('aa'.repeat(32))).toBe(true);
    expect(store.size()).toBe(1);
  });
});

// ─── end-to-end ─────────────────────────────────────────────────────────────

describe('end-to-end scenario', () => {
  it('multi-tier allocation → retrieval → removal → sweep → flush', async () => {
    const store = makeStore();

    // Store a bootstrap record in hot.
    const bootstrap = new TextEncoder().encode('TypeRecord v1');
    const r1 = await store.putAuto(bootstrap, 'hot');
    expect(r1.tier).toBe('hot');

    // Store a large payload in blob.
    const payload = new Uint8Array(1024).fill(0xAB);
    const r2 = await store.putAuto(payload, 'blob');
    expect(r2.tier).toBe('blob');

    expect(store.size()).toBe(2);

    // Read both back.
    const b1 = await store.getByHash(r1.hash);
    expect(new TextDecoder().decode(b1!)).toBe('TypeRecord v1');

    const b2 = await store.getByHash(r2.hash);
    expect(b2!.length).toBe(1024);

    // Remove the payload.
    await store.removeByHash(r2.hash);
    expect(store.size()).toBe(1);

    // Sweep and GC.
    await store.sweep();
    await store.gc();
    await store.flush();
  });
});
