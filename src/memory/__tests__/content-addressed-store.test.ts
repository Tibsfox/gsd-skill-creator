/**
 * Tests for ContentAddressedStore — the hash → chunk-id facade over the
 * Rust memory arena.
 *
 * Uses the same in-memory mock arena pattern as arena-file-store.test.ts
 * so we exercise the full put/get/replace/remove/preload path without
 * touching a real Tauri backend.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContentAddressedStore,
  canonicalizeHash,
  sha256,
  sha256Hex,
} from '../content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../rust-arena.js';

// ─── Mock arena backend ──────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

function createMockArena(): { invoke: InvokeFn; size: () => number } {
  const chunks = new Map<number, MockChunk>();
  let nextId = 1;

  const invoke: InvokeFn = async (cmd, args) => {
    switch (cmd) {
      case 'arena_init':
        return {
          initialized: true,
          recovered: false,
          checkpointPath: '/mock/arena.checkpoint',
          journalPath: '/mock/arena.journal',
          stats: {
            totalSlots: 1024,
            freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size,
            totalBytes: 0,
            freeBytes: 0,
            allocatedBytes: 0,
            nextChunkId: nextId,
          },
        };
      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = nextId++;
        chunks.set(id, {
          tier,
          payloadBase64,
          payloadSize: base64ToBytes(payloadBase64).length,
          accessCount: 0,
          createdAtNs: id * 1000,
          lastAccessNs: id * 1000,
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
          createdAtNs: chunk.createdAtNs,
          lastAccessNs: chunk.lastAccessNs,
        };
      }
      case 'arena_free': {
        const { chunkId } = args as { chunkId: number };
        if (!chunks.delete(chunkId)) throw new Error(`not found: ${chunkId}`);
        return null;
      }
      case 'arena_touch': {
        const { chunkId } = args as { chunkId: number };
        const chunk = chunks.get(chunkId);
        if (!chunk) throw new Error(`not found: ${chunkId}`);
        chunk.accessCount += 1;
        chunk.lastAccessNs = Date.now() * 1_000_000;
        return null;
      }
      case 'arena_list_ids':
        return { chunkIds: Array.from(chunks.keys()) };
      case 'arena_checkpoint':
        return {
          checkpointed: true,
          stats: {
            totalSlots: 1024,
            freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size,
            totalBytes: 0,
            freeBytes: 0,
            allocatedBytes: 0,
            nextChunkId: nextId,
          },
        };
      case 'arena_stats':
        return {
          totalSlots: 1024,
          freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size,
          totalBytes: 0,
          freeBytes: 0,
          allocatedBytes: 0,
          nextChunkId: nextId,
        };
      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };

  return { invoke, size: () => chunks.size };
}

// ─── Setup helper ────────────────────────────────────────────────────────────

async function buildStore() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const store = new ContentAddressedStore({ arena });
  await store.loadIndex();
  return { store, arena, mock };
}

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function textBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// ─── canonicalizeHash ────────────────────────────────────────────────────────

describe('canonicalizeHash', () => {
  it('accepts hex strings and lowercases them', () => {
    expect(canonicalizeHash('DEADBEEF')).toBe('deadbeef');
    expect(canonicalizeHash('deadbeef')).toBe('deadbeef');
  });

  it('accepts Uint8Array and produces hex', () => {
    expect(canonicalizeHash(bytes(0xde, 0xad, 0xbe, 0xef))).toBe('deadbeef');
    expect(canonicalizeHash(bytes(0x00))).toBe('00');
    expect(canonicalizeHash(bytes(0x01, 0x0a, 0xff))).toBe('010aff');
  });

  it('rejects non-hex strings', () => {
    expect(() => canonicalizeHash('not-hex')).toThrow(/must be hex/);
    expect(() => canonicalizeHash('deadbeeg')).toThrow(/must be hex/);
  });

  it('rejects odd-length hex strings', () => {
    expect(() => canonicalizeHash('abc')).toThrow(/even length/);
  });

  it('rejects empty hex strings', () => {
    expect(() => canonicalizeHash('')).toThrow(/even length/);
  });
});

// ─── sha256 helpers ──────────────────────────────────────────────────────────

describe('sha256 helpers', () => {
  it('sha256 returns 32 bytes', () => {
    const digest = sha256(textBytes('hello'));
    expect(digest.length).toBe(32);
  });

  it('sha256Hex matches the known SHA-256 of "hello"', () => {
    // Known test vector.
    expect(sha256Hex(textBytes('hello'))).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('sha256 of same bytes is deterministic', () => {
    const a = sha256(textBytes('test'));
    const b = sha256(textBytes('test'));
    expect(canonicalizeHash(a)).toBe(canonicalizeHash(b));
  });
});

// ─── Core put/get ────────────────────────────────────────────────────────────

describe('ContentAddressedStore.put + getByHash', () => {
  it('stores and retrieves a single entry', async () => {
    const { store } = await buildStore();
    const payload = textBytes('hello arena');
    const { chunkId, created } = await store.put('deadbeef', payload);
    expect(created).toBe(true);
    expect(typeof chunkId).toBe('number');

    const got = await store.getByHash('deadbeef');
    expect(got).not.toBeNull();
    expect(new TextDecoder().decode(got!)).toBe('hello arena');
  });

  it('put is idempotent for the same hash (dedup)', async () => {
    const { store, mock } = await buildStore();
    const first = await store.put('0102', textBytes('a'));
    const second = await store.put('0102', textBytes('anything'));
    expect(first.chunkId).toBe(second.chunkId);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    // Only one arena chunk should exist.
    expect(mock.size()).toBe(1);
  });

  it('second put does NOT overwrite the stored bytes', async () => {
    const { store } = await buildStore();
    await store.put('0304', textBytes('original'));
    await store.put('0304', textBytes('different'));
    const got = await store.getByHash('0304');
    expect(new TextDecoder().decode(got!)).toBe('original');
  });

  it('accepts both string and Uint8Array hashes symmetrically', async () => {
    const { store } = await buildStore();
    const hashBytes = bytes(0xab, 0xcd, 0xef);
    await store.put(hashBytes, textBytes('x'));

    const gotByBytes = await store.getByHash(hashBytes);
    const gotByString = await store.getByHash('ABCDEF');
    expect(new TextDecoder().decode(gotByBytes!)).toBe('x');
    expect(new TextDecoder().decode(gotByString!)).toBe('x');
  });

  it('returns null for a missing hash', async () => {
    const { store } = await buildStore();
    expect(await store.getByHash('00')).toBeNull();
  });

  it('rejects hash lengths outside 1..=255 bytes', async () => {
    const { store } = await buildStore();
    await expect(store.put(new Uint8Array(0), textBytes('x'))).rejects.toThrow(
      /length must be 1..=255/
    );
    await expect(store.put(new Uint8Array(256), textBytes('x'))).rejects.toThrow(
      /length must be 1..=255/
    );
  });

  it('supports empty user payloads', async () => {
    const { store } = await buildStore();
    await store.put('aa', new Uint8Array(0));
    const got = await store.getByHash('aa');
    expect(got).not.toBeNull();
    expect(got!.length).toBe(0);
  });

  it('supports long hashes (SHA-256 length, 32 bytes)', async () => {
    const { store } = await buildStore();
    const longHash = new Uint8Array(32);
    for (let i = 0; i < 32; i++) longHash[i] = i;
    await store.put(longHash, textBytes('sha256-style'));
    const got = await store.getByHash(longHash);
    expect(new TextDecoder().decode(got!)).toBe('sha256-style');
  });
});

// ─── putAuto ─────────────────────────────────────────────────────────────────

describe('ContentAddressedStore.putAuto', () => {
  it('computes SHA-256 and stores under it', async () => {
    const { store } = await buildStore();
    const payload = textBytes('hello');
    const { hash, chunkId, created } = await store.putAuto(payload);

    expect(hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
    expect(typeof chunkId).toBe('number');
    expect(created).toBe(true);

    const got = await store.getByHash(hash);
    expect(new TextDecoder().decode(got!)).toBe('hello');
  });

  it('dedupes identical payloads across putAuto calls', async () => {
    const { store, mock } = await buildStore();
    const a = await store.putAuto(textBytes('same'));
    const b = await store.putAuto(textBytes('same'));
    expect(a.chunkId).toBe(b.chunkId);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(mock.size()).toBe(1);
  });

  it('gives different hashes for different payloads', async () => {
    const { store } = await buildStore();
    const a = await store.putAuto(textBytes('one'));
    const b = await store.putAuto(textBytes('two'));
    expect(a.hash).not.toBe(b.hash);
    expect(a.chunkId).not.toBe(b.chunkId);
  });
});

// ─── replaceByHash ───────────────────────────────────────────────────────────

describe('ContentAddressedStore.replaceByHash', () => {
  it('overwrites an existing entry and allocates a new chunk', async () => {
    const { store } = await buildStore();
    const first = await store.put('7f', textBytes('v1'));
    const replaced = await store.replaceByHash('7f', textBytes('v2'));

    // New chunk id (freed ids are never reused).
    expect(replaced.chunkId).not.toBe(first.chunkId);
    expect(replaced.created).toBe(false);

    const got = await store.getByHash('7f');
    expect(new TextDecoder().decode(got!)).toBe('v2');
  });

  it('behaves like put when the hash is absent', async () => {
    const { store } = await buildStore();
    const r = await store.replaceByHash('77', textBytes('new'));
    expect(r.created).toBe(true);

    const got = await store.getByHash('77');
    expect(new TextDecoder().decode(got!)).toBe('new');
  });
});

// ─── removeByHash ────────────────────────────────────────────────────────────

describe('ContentAddressedStore.removeByHash', () => {
  it('removes the entry and frees the chunk', async () => {
    const { store, mock } = await buildStore();
    await store.put('bb', textBytes('gone soon'));
    expect(mock.size()).toBe(1);

    const removed = await store.removeByHash('bb');
    expect(removed).toBe(true);
    expect(mock.size()).toBe(0);
    expect(await store.getByHash('bb')).toBeNull();
  });

  it('returns false for a missing hash', async () => {
    const { store } = await buildStore();
    expect(await store.removeByHash('cc')).toBe(false);
  });
});

// ─── Enumeration ─────────────────────────────────────────────────────────────

describe('ContentAddressedStore enumeration', () => {
  it('listHashes returns every stored hash as hex', async () => {
    const { store } = await buildStore();
    await store.put('01', textBytes('a'));
    await store.put('02', textBytes('b'));
    await store.put('03', textBytes('c'));

    const hashes = (await store.listHashes()).sort();
    expect(hashes).toEqual(['01', '02', '03']);
  });

  it('count reflects current entries', async () => {
    const { store } = await buildStore();
    expect(await store.count()).toBe(0);
    await store.put('01', textBytes('a'));
    await store.put('02', textBytes('b'));
    expect(await store.count()).toBe(2);
    await store.removeByHash('01');
    expect(await store.count()).toBe(1);
  });

  it('hasHash reports presence correctly', async () => {
    const { store } = await buildStore();
    await store.put('aa', textBytes('x'));
    expect(await store.hasHash('aa')).toBe(true);
    expect(await store.hasHash('bb')).toBe(false);
  });

  it('chunkIdForHash returns a stable id for an existing hash', async () => {
    const { store } = await buildStore();
    const { chunkId } = await store.put('22', textBytes('x'));
    expect(await store.chunkIdForHash('22')).toBe(chunkId);
    expect(await store.chunkIdForHash('33')).toBeNull();
  });
});

// ─── loadIndex warm-start ────────────────────────────────────────────────────

describe('ContentAddressedStore.loadIndex warm-start', () => {
  it('rebuilds the hash index from existing arena chunks', async () => {
    const { store, arena } = await buildStore();
    await store.put('01', textBytes('a'));
    await store.put('02', textBytes('b'));
    await store.put('03', textBytes('c'));

    // Build a fresh store over the same arena and rebuild its index.
    const second = new ContentAddressedStore({ arena });
    await second.loadIndex();

    expect(await second.count()).toBe(3);
    expect(await second.hasHash('01')).toBe(true);
    expect(await second.hasHash('02')).toBe(true);
    expect(await second.hasHash('03')).toBe(true);
    expect(new TextDecoder().decode((await second.getByHash('02'))!)).toBe('b');
  });

  it('isIndexLoaded flips to true after loadIndex', async () => {
    const { arena } = await buildStore();
    const store = new ContentAddressedStore({ arena });
    expect(store.isIndexLoaded()).toBe(false);
    await store.loadIndex();
    expect(store.isIndexLoaded()).toBe(true);
  });

  it('lazy index rebuild on first op if loadIndex not called explicitly', async () => {
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });

    const a = new ContentAddressedStore({ arena });
    await a.loadIndex();
    await a.put('01', textBytes('value'));

    // Fresh store without explicit loadIndex — first getByHash should
    // trigger the rebuild automatically.
    const b = new ContentAddressedStore({ arena });
    expect(b.isIndexLoaded()).toBe(false);
    const got = await b.getByHash('01');
    expect(b.isIndexLoaded()).toBe(true);
    expect(new TextDecoder().decode(got!)).toBe('value');
  });

  it('skips chunks from other tiers when filtering by tier', async () => {
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });

    // Put one chunk directly into the Warm tier as an "outsider".
    await arena.alloc('warm', new TextEncoder().encode('not a CAS chunk'));

    // Now our CAS store, scoped to Blob, should ignore it.
    const store = new ContentAddressedStore({ arena, tier: 'blob' });
    await store.loadIndex();
    expect(await store.count()).toBe(0);

    await store.put('ab', textBytes('real entry'));
    await store.loadIndex(); // re-rebuild — outsider still ignored.
    expect(await store.count()).toBe(1);
  });
});

// ─── preload ─────────────────────────────────────────────────────────────────

describe('ContentAddressedStore.preload', () => {
  it('reports hits for hashes that exist', async () => {
    const { store } = await buildStore();
    await store.put('01', textBytes('a'));
    await store.put('02', textBytes('b'));
    await store.put('03', textBytes('c'));

    const hits = await store.preload(['01', '02', '99']);
    expect(hits).toBe(2);
  });

  it('silently ignores missing hashes (advisory semantics)', async () => {
    const { store } = await buildStore();
    const hits = await store.preload(['00', '11', '22']);
    expect(hits).toBe(0);
  });

  it('accepts mixed Uint8Array and string forms', async () => {
    const { store } = await buildStore();
    await store.put('aa', textBytes('x'));
    const hits = await store.preload(['aa', bytes(0xaa)]);
    // Both lookups resolve to the same entry, and preload counts per
    // input so the count is 2.
    expect(hits).toBe(2);
  });
});

// ─── Dedup stress — many entries ─────────────────────────────────────────────

describe('ContentAddressedStore stress', () => {
  it('handles 100 distinct entries with sha256 addressing', async () => {
    const { store, mock } = await buildStore();
    const expected = new Map<string, string>();
    for (let i = 0; i < 100; i++) {
      const msg = `entry-${i}`;
      const { hash } = await store.putAuto(textBytes(msg));
      expected.set(hash, msg);
    }
    expect(mock.size()).toBe(100);
    expect(await store.count()).toBe(100);

    for (const [hash, msg] of expected) {
      const got = await store.getByHash(hash);
      expect(new TextDecoder().decode(got!)).toBe(msg);
    }
  });

  it('dedupe holds: 100 identical payloads produce 1 chunk', async () => {
    const { store, mock } = await buildStore();
    const payload = textBytes('same-content');
    for (let i = 0; i < 100; i++) {
      await store.putAuto(payload);
    }
    expect(mock.size()).toBe(1);
    expect(await store.count()).toBe(1);
  });
});
