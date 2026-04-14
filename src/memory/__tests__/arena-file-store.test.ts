/**
 * Tests for ArenaFileStore — the arena-backed MemoryStore implementation.
 *
 * These tests use a stateful in-memory mock of the Rust arena (the same
 * kind used in rust-arena.test.ts end-to-end test) so we can exercise
 * the full storage semantics without a real Tauri backend.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArenaFileStore } from '../arena-file-store.js';
import { RustArena, type InvokeFn, bytesToBase64, base64ToBytes } from '../rust-arena.js';
import { LodLevel } from '../../lod/types.js';
import type { MemoryRecord } from '../types.js';

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
      case 'arena_init': {
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
      }
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
        if (!chunks.delete(chunkId))
          throw new Error(`not found: ${chunkId}`);
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
      case 'arena_list_ids': {
        return { chunkIds: Array.from(chunks.keys()) };
      }
      case 'arena_checkpoint': {
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
      }
      case 'arena_stats': {
        return {
          totalSlots: 1024,
          freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size,
          totalBytes: 0,
          freeBytes: 0,
          allocatedBytes: 0,
          nextChunkId: nextId,
        };
      }
      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };

  return { invoke, size: () => chunks.size };
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  const now = new Date('2026-04-08T00:00:00Z');
  return {
    id: overrides.id ?? 'test-id-1',
    name: 'test record',
    description: 'a test record',
    type: 'feedback',
    tags: ['test', 'memory'],
    confidence: 0.9,
    content: 'this is the content body',
    lodCurrent: 300,
    validFrom: now,
    validTo: null,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    relatedTo: [],
    provenance: {
      scope: 'project',
      visibility: 'internal',
      domains: ['test'],
    },
    temporalClass: 'durable',
    ...overrides,
  };
}

// ─── Setup helper ────────────────────────────────────────────────────────────

async function buildStore() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const store = new ArenaFileStore({ arena });
  await store.loadIndex();
  return { store, arena, mock };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ArenaFileStore — basic CRUD', () => {
  it('starts with empty index and zero count', async () => {
    const { store } = await buildStore();
    expect(await store.count()).toBe(0);
    expect(store.lod).toBe(LodLevel.DETAILED);
  });

  it('stores and retrieves a single record', async () => {
    const { store } = await buildStore();
    const record = makeRecord({ id: 'rec-1', name: 'alpha' });
    await store.store(record);

    expect(await store.count()).toBe(1);
    expect(await store.has('rec-1')).toBe(true);

    const got = await store.get('rec-1');
    expect(got).not.toBeNull();
    expect(got!.id).toBe('rec-1');
    expect(got!.name).toBe('alpha');
    expect(got!.content).toBe('this is the content body');
  });

  it('returns null for missing ids', async () => {
    const { store } = await buildStore();
    expect(await store.get('does-not-exist')).toBeNull();
    expect(await store.has('does-not-exist')).toBe(false);
  });

  it('remove deletes a record and returns true; returns false for missing', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'rec-1' }));
    expect(await store.remove('rec-1')).toBe(true);
    expect(await store.has('rec-1')).toBe(false);
    expect(await store.remove('rec-1')).toBe(false);
  });

  it('replaces an existing record on store (same id)', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'rec-1', name: 'original' }));
    await store.store(makeRecord({ id: 'rec-1', name: 'updated' }));

    expect(await store.count()).toBe(1);
    const got = await store.get('rec-1');
    expect(got!.name).toBe('updated');
  });
});

describe('ArenaFileStore — multiple records', () => {
  it('stores and retrieves multiple distinct records', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'a', name: 'alpha record' }));
    await store.store(makeRecord({ id: 'b', name: 'bravo record' }));
    await store.store(makeRecord({ id: 'c', name: 'charlie record' }));

    expect(await store.count()).toBe(3);
    expect((await store.get('a'))?.name).toBe('alpha record');
    expect((await store.get('b'))?.name).toBe('bravo record');
    expect((await store.get('c'))?.name).toBe('charlie record');
  });

  it('handles removal of middle records correctly', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'a' }));
    await store.store(makeRecord({ id: 'b' }));
    await store.store(makeRecord({ id: 'c' }));

    await store.remove('b');
    expect(await store.count()).toBe(2);
    expect(await store.has('a')).toBe(true);
    expect(await store.has('b')).toBe(false);
    expect(await store.has('c')).toBe(true);
  });
});

describe('ArenaFileStore — query', () => {
  it('returns empty array on empty store', async () => {
    const { store } = await buildStore();
    const results = await store.query({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('matches keyword in record name', async () => {
    const { store } = await buildStore();
    await store.store(
      makeRecord({ id: 'a', name: 'amiga principle', content: 'body' }),
    );
    await store.store(
      makeRecord({ id: 'b', name: 'systems engineering', content: 'body' }),
    );

    const results = await store.query({ text: 'amiga' });
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe('a');
  });

  it('matches keyword in content', async () => {
    const { store } = await buildStore();
    await store.store(
      makeRecord({
        id: 'a',
        name: 'first',
        content: 'discussion of checkpoint strategies',
      }),
    );
    await store.store(
      makeRecord({ id: 'b', name: 'second', content: 'unrelated content' }),
    );

    const results = await store.query({ text: 'checkpoint' });
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe('a');
  });

  it('matches across tags', async () => {
    const { store } = await buildStore();
    await store.store(
      makeRecord({ id: 'a', name: 'r1', tags: ['rust', 'arena'] }),
    );
    await store.store(
      makeRecord({ id: 'b', name: 'r2', tags: ['typescript', 'benchmark'] }),
    );

    const results = await store.query({ text: 'rust' });
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe('a');
  });

  it('applies type filter', async () => {
    const { store } = await buildStore();
    await store.store(
      makeRecord({ id: 'a', name: 'alpha', type: 'feedback', content: 'match' }),
    );
    await store.store(
      makeRecord({ id: 'b', name: 'bravo', type: 'project', content: 'match' }),
    );

    const results = await store.query({ text: 'match', type: 'feedback' });
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe('a');
  });

  it('applies tag filter', async () => {
    const { store } = await buildStore();
    await store.store(
      makeRecord({ id: 'a', name: 'alpha', tags: ['rust'], content: 'match' }),
    );
    await store.store(
      makeRecord({ id: 'b', name: 'bravo', tags: ['typescript'], content: 'match' }),
    );

    const results = await store.query({ text: 'match', tags: ['rust'] });
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe('a');
  });

  it('sorts results by score descending', async () => {
    const { store } = await buildStore();
    // Record A: keyword in name (+3) + content (+1) = 4
    await store.store(
      makeRecord({ id: 'a', name: 'checkpoint alpha', content: 'checkpoint' }),
    );
    // Record B: keyword in content only (+1) = 1
    await store.store(
      makeRecord({ id: 'b', name: 'beta', content: 'checkpoint' }),
    );

    const results = await store.query({ text: 'checkpoint' });
    expect(results).toHaveLength(2);
    expect(results[0].record.id).toBe('a');
    expect(results[1].record.id).toBe('b');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('applies limit', async () => {
    const { store } = await buildStore();
    for (let i = 0; i < 5; i++) {
      await store.store(
        makeRecord({ id: `r${i}`, name: `record${i}`, content: 'common' }),
      );
    }

    const results = await store.query({ text: 'common', limit: 3 });
    expect(results).toHaveLength(3);
  });
});

describe('ArenaFileStore — access tracking', () => {
  it('bumps accessCount on get', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'a', accessCount: 0 }));

    const before = await store.get('a');
    expect(before!.accessCount).toBe(1); // bumped on first get

    const again = await store.get('a');
    expect(again!.accessCount).toBe(2);
  });

  it('updates lastAccessed on get', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'a' }));

    const got = await store.get('a');
    expect(got!.lastAccessed).not.toBeNull();
    expect(got!.lastAccessed).toBeInstanceOf(Date);
  });
});

describe('ArenaFileStore — date roundtrip', () => {
  it('preserves validFrom, validTo, createdAt, updatedAt across store/get', async () => {
    const { store } = await buildStore();
    const validFrom = new Date('2025-01-01T00:00:00Z');
    const validTo = new Date('2030-01-01T00:00:00Z');
    const createdAt = new Date('2025-06-15T12:00:00Z');

    await store.store(
      makeRecord({
        id: 'a',
        validFrom,
        validTo,
        createdAt,
      }),
    );

    const got = await store.get('a');
    expect(got!.validFrom.toISOString()).toBe(validFrom.toISOString());
    expect(got!.validTo?.toISOString()).toBe(validTo.toISOString());
    expect(got!.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('handles null validTo correctly', async () => {
    const { store } = await buildStore();
    await store.store(makeRecord({ id: 'a', validTo: null }));

    const got = await store.get('a');
    expect(got!.validTo).toBeNull();
  });
});

describe('ArenaFileStore — index rebuild', () => {
  it('loadIndex rebuilds from existing arena chunks', async () => {
    // Stage 1: populate a store.
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });
    const store1 = new ArenaFileStore({ arena });
    await store1.loadIndex();

    await store1.store(makeRecord({ id: 'a', name: 'alpha' }));
    await store1.store(makeRecord({ id: 'b', name: 'bravo' }));

    // Stage 2: second store sharing the same arena — must rebuild its index.
    const store2 = new ArenaFileStore({ arena });
    await store2.loadIndex();

    expect(store2.indexSize()).toBe(2);
    expect(await store2.has('a')).toBe(true);
    expect(await store2.has('b')).toBe(true);
    const alpha = await store2.get('a');
    expect(alpha!.name).toBe('alpha');
  });

  it('reports index loaded status correctly', async () => {
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });
    const store = new ArenaFileStore({ arena });

    expect(store.isIndexLoaded()).toBe(false);
    await store.loadIndex();
    expect(store.isIndexLoaded()).toBe(true);
  });
});

describe('ArenaFileStore — MemoryStore interface compliance', () => {
  it('exposes the LOD level', async () => {
    const { store } = await buildStore();
    expect(store.lod).toBe(LodLevel.DETAILED);
  });

  it('has all required methods', async () => {
    const { store } = await buildStore();
    expect(typeof store.store).toBe('function');
    expect(typeof store.query).toBe('function');
    expect(typeof store.get).toBe('function');
    expect(typeof store.remove).toBe('function');
    expect(typeof store.has).toBe('function');
    expect(typeof store.count).toBe('function');
  });
});
