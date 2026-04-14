/**
 * Tests for ArenaSkillStore — arena-backed drop-in alternative to the
 * filesystem SkillStore.
 *
 * Uses the shared mock-arena pattern from content-addressed-store.test.ts
 * so we exercise the full storage round-trip without a real Tauri backend.
 */

import { describe, it, expect } from 'vitest';
import { ArenaSkillStore, SKILL_RECORD_VERSION } from './arena-skill-store.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';

// ─── Mock arena backend ──────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

function createMockArena() {
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
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = nextId++;
        chunks.set(id, {
          tier, payloadBase64,
          payloadSize: base64ToBytes(payloadBase64).length,
          accessCount: 0, createdAtNs: id * 1000, lastAccessNs: id * 1000,
        });
        return { chunkId: id };
      }
      case 'arena_get': {
        const { chunkId } = args as { chunkId: number };
        const chunk = chunks.get(chunkId);
        if (!chunk) throw new Error(`not found: ${chunkId}`);
        return { chunkId, ...chunk };
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
        return null;
      }
      case 'arena_list_ids':
        return { chunkIds: Array.from(chunks.keys()) };
      case 'arena_checkpoint':
        return {
          checkpointed: true,
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_stats':
        return {
          totalSlots: 1024, freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
          allocatedBytes: 0, nextChunkId: nextId,
        };
      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };
  return { invoke, size: () => chunks.size };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

async function buildStore() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const cas = new ContentAddressedStore({ arena, tier: 'resident' });
  await cas.loadIndex();
  const store = new ArenaSkillStore({ cas });
  return { store, cas, arena, mock };
}

const sampleMeta = {
  name: 'vision-to-mission',
  description: "Transform a builder vision into a GSD mission package.",
};
const sampleBody = '# Vision to Mission\n\nBody of the skill...';

// ─── Core create/exists/list ─────────────────────────────────────────────────

describe('ArenaSkillStore.create', () => {
  it('returns an arena:// path on successful create', async () => {
    const { store } = await buildStore();
    const result = await store.create('vision-to-mission', sampleMeta, sampleBody);
    expect(result.path.startsWith('arena://')).toBe(true);
    expect(result.path.length).toBeGreaterThan('arena://'.length);
  });

  it('persists the record so get() returns the full shape', async () => {
    const { store } = await buildStore();
    await store.create('vision-to-mission', sampleMeta, sampleBody);
    const record = await store.get('vision-to-mission');
    expect(record).not.toBeNull();
    expect(record!.name).toBe(sampleMeta.name);
    expect(record!.description).toBe(sampleMeta.description);
    expect(record!.body).toBe(sampleBody);
    expect(record!.version).toBe(SKILL_RECORD_VERSION);
    expect(record!.lifecycle).toBe('draft');
    expect(record!.lifecycleHistory).toEqual([]);
    expect(record!.testedModels).toBe(0);
  });

  it('preserves createdAt on second create (treat as update)', async () => {
    const { store } = await buildStore();
    await store.create('vision-to-mission', sampleMeta, sampleBody);
    const first = await store.get('vision-to-mission');

    // Small delay to make sure updatedAt can change.
    await new Promise((r) => setTimeout(r, 5));

    await store.create('vision-to-mission', sampleMeta, 'new body');
    const second = await store.get('vision-to-mission');
    expect(second!.createdAt).toBe(first!.createdAt);
    expect(second!.updatedAt).toBeGreaterThanOrEqual(first!.updatedAt);
    expect(second!.body).toBe('new body');
  });

  it('rejects empty skill names', async () => {
    const { store } = await buildStore();
    await expect(store.create('', sampleMeta, 'body')).rejects.toThrow(/non-empty/);
    await expect(store.create('   ', sampleMeta, 'body')).rejects.toThrow(/non-empty/);
  });
});

describe('ArenaSkillStore.exists', () => {
  it('returns false before create and true after', async () => {
    const { store } = await buildStore();
    expect(await store.exists('vision-to-mission')).toBe(false);
    await store.create('vision-to-mission', sampleMeta, sampleBody);
    expect(await store.exists('vision-to-mission')).toBe(true);
  });

  it('distinguishes two skills with different names', async () => {
    const { store } = await buildStore();
    await store.create('one', { name: 'one', description: 'x' }, 'x');
    expect(await store.exists('one')).toBe(true);
    expect(await store.exists('two')).toBe(false);
  });
});

describe('ArenaSkillStore.list', () => {
  it('returns an empty array for a fresh store', async () => {
    const { store } = await buildStore();
    expect(await store.list()).toEqual([]);
  });

  it('returns every created skill name, sorted', async () => {
    const { store } = await buildStore();
    await store.create('cherry', { name: 'cherry', description: 'x' }, 'x');
    await store.create('apple', { name: 'apple', description: 'x' }, 'x');
    await store.create('banana', { name: 'banana', description: 'x' }, 'x');
    const names = await store.list();
    expect(names).toEqual(['apple', 'banana', 'cherry']);
  });
});

// ─── Extended API ────────────────────────────────────────────────────────────

describe('ArenaSkillStore.get', () => {
  it('returns null for a missing skill', async () => {
    const { store } = await buildStore();
    expect(await store.get('nonexistent')).toBeNull();
  });
});

describe('ArenaSkillStore.update', () => {
  it('patches body and bumps updatedAt', async () => {
    const { store } = await buildStore();
    await store.create('skill-a', { name: 'skill-a', description: 'd' }, 'body v1');
    const before = await store.get('skill-a');
    await new Promise((r) => setTimeout(r, 5));

    await store.update('skill-a', { body: 'body v2' });
    const after = await store.get('skill-a');
    expect(after!.body).toBe('body v2');
    expect(after!.description).toBe('d'); // unchanged
    expect(after!.updatedAt).toBeGreaterThan(before!.updatedAt);
  });

  it('patches description and leaves body alone', async () => {
    const { store } = await buildStore();
    await store.create('skill-b', { name: 'skill-b', description: 'old' }, 'body');
    await store.update('skill-b', { description: 'new' });
    const record = await store.get('skill-b');
    expect(record!.description).toBe('new');
    expect(record!.body).toBe('body');
  });

  it('throws on unknown skill', async () => {
    const { store } = await buildStore();
    await expect(store.update('ghost', { body: 'x' })).rejects.toThrow(/not found/);
  });
});

describe('ArenaSkillStore.remove', () => {
  it('deletes an existing skill', async () => {
    const { store, mock } = await buildStore();
    await store.create('goner', { name: 'goner', description: 'x' }, 'x');
    expect(await store.exists('goner')).toBe(true);
    expect(mock.size()).toBe(1);

    const removed = await store.remove('goner');
    expect(removed).toBe(true);
    expect(await store.exists('goner')).toBe(false);
    expect(mock.size()).toBe(0);
  });

  it('returns false for a missing skill', async () => {
    const { store } = await buildStore();
    expect(await store.remove('ghost')).toBe(false);
  });
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────

describe('ArenaSkillStore.setLifecycle', () => {
  it('advances through the valid draft→tested→graded→optimized→packaged chain', async () => {
    const { store } = await buildStore();
    await store.create('lifecycle-test', { name: 'lifecycle-test', description: 'x' }, 'x');

    await store.setLifecycle('lifecycle-test', 'tested');
    expect((await store.get('lifecycle-test'))!.lifecycle).toBe('tested');

    await store.setLifecycle('lifecycle-test', 'graded');
    expect((await store.get('lifecycle-test'))!.lifecycle).toBe('graded');

    await store.setLifecycle('lifecycle-test', 'optimized');
    expect((await store.get('lifecycle-test'))!.lifecycle).toBe('optimized');

    await store.setLifecycle('lifecycle-test', 'packaged');
    expect((await store.get('lifecycle-test'))!.lifecycle).toBe('packaged');
  });

  it('records every transition in lifecycleHistory', async () => {
    const { store } = await buildStore();
    await store.create('history-test', { name: 'history-test', description: 'x' }, 'x');
    await store.setLifecycle('history-test', 'tested');
    await store.setLifecycle('history-test', 'graded');

    const record = await store.get('history-test');
    expect(record!.lifecycleHistory).toHaveLength(2);
    expect(record!.lifecycleHistory[0]).toMatchObject({ from: 'draft', to: 'tested' });
    expect(record!.lifecycleHistory[1]).toMatchObject({ from: 'tested', to: 'graded' });
    expect(typeof record!.lifecycleHistory[0].timestamp).toBe('string');
  });

  it('increments testedModels on each tested transition', async () => {
    const { store } = await buildStore();
    await store.create('tested-count', { name: 'tested-count', description: 'x' }, 'x');
    await store.setLifecycle('tested-count', 'tested');
    // Back to tested via a valid path is not possible — lifecycle is
    // monotonic — but we can verify a single "tested" transition counts.
    expect((await store.get('tested-count'))!.testedModels).toBe(1);
  });

  it('rejects invalid transitions', async () => {
    const { store } = await buildStore();
    await store.create('invalid-test', { name: 'invalid-test', description: 'x' }, 'x');
    await expect(store.setLifecycle('invalid-test', 'packaged')).rejects.toThrow(
      /invalid transition/
    );
    await expect(store.setLifecycle('invalid-test', 'graded')).rejects.toThrow(
      /invalid transition/
    );
  });

  it('rejects backward transitions', async () => {
    const { store } = await buildStore();
    await store.create('backward', { name: 'backward', description: 'x' }, 'x');
    await store.setLifecycle('backward', 'tested');
    await expect(store.setLifecycle('backward', 'draft')).rejects.toThrow(
      /invalid transition/
    );
  });

  it('throws on unknown skill', async () => {
    const { store } = await buildStore();
    await expect(store.setLifecycle('ghost', 'tested')).rejects.toThrow(/not found/);
  });
});

// ─── listEntries — SkillWorkspace parity ─────────────────────────────────────

describe('ArenaSkillStore.listEntries', () => {
  it('returns workspace-compatible entries sorted by name', async () => {
    const { store } = await buildStore();
    await store.create('bravo', { name: 'bravo', description: 'x' }, 'x');
    await store.create('alpha', { name: 'alpha', description: 'y' }, 'y');
    await store.create('charlie', { name: 'charlie', description: 'z' }, 'z');

    const entries = await store.listEntries();
    expect(entries.map((e) => e.name)).toEqual(['alpha', 'bravo', 'charlie']);
    for (const entry of entries) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('testedModels');
      expect(entry).toHaveProperty('lastModified');
      expect(entry.status).toBe('draft');
      expect(entry.testedModels).toBe(0);
      expect(typeof entry.lastModified).toBe('string');
      // ISO-8601 round trip check
      expect(new Date(entry.lastModified).toISOString()).toBe(entry.lastModified);
    }
  });

  it('reflects lifecycle transitions', async () => {
    const { store } = await buildStore();
    await store.create('with-lifecycle', { name: 'with-lifecycle', description: 'x' }, 'x');
    await store.setLifecycle('with-lifecycle', 'tested');

    const entries = await store.listEntries();
    expect(entries[0].status).toBe('tested');
    expect(entries[0].testedModels).toBe(1);
  });
});

// ─── Warm-start recovery ─────────────────────────────────────────────────────

describe('ArenaSkillStore warm-start recovery', () => {
  it('a fresh store over the same arena recovers every skill', async () => {
    const { store, arena } = await buildStore();
    await store.create('persistent-a', { name: 'a', description: 'd' }, 'body a');
    await store.create('persistent-b', { name: 'b', description: 'd' }, 'body b');
    await store.setLifecycle('persistent-a', 'tested');

    // Simulate a session restart: build a new CAS + store on the same arena.
    const cas2 = new ContentAddressedStore({ arena, tier: 'resident' });
    await cas2.loadIndex();
    const store2 = new ArenaSkillStore({ cas: cas2 });

    expect((await store2.list()).sort()).toEqual(['a', 'b']);

    const recoveredA = await store2.get('persistent-a');
    expect(recoveredA).not.toBeNull();
    expect(recoveredA!.body).toBe('body a');
    expect(recoveredA!.lifecycle).toBe('tested');
    expect(recoveredA!.lifecycleHistory).toHaveLength(1);

    const recoveredB = await store2.get('persistent-b');
    expect(recoveredB!.body).toBe('body b');
    expect(recoveredB!.lifecycle).toBe('draft');
  });
});

// ─── Count / stress ──────────────────────────────────────────────────────────

describe('ArenaSkillStore count + stress', () => {
  it('count reflects the number of skills', async () => {
    const { store } = await buildStore();
    expect(await store.count()).toBe(0);
    await store.create('one', { name: 'one', description: 'x' }, 'x');
    expect(await store.count()).toBe(1);
    await store.create('two', { name: 'two', description: 'x' }, 'x');
    expect(await store.count()).toBe(2);
    await store.remove('one');
    expect(await store.count()).toBe(1);
  });

  it('handles 50 skills with unique names', async () => {
    const { store } = await buildStore();
    for (let i = 0; i < 50; i++) {
      await store.create(
        `skill-${i}`,
        { name: `skill-${i}`, description: `desc ${i}` },
        `body ${i}`
      );
    }
    const list = await store.list();
    expect(list).toHaveLength(50);
    // Sorted lexically
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].localeCompare(list[i])).toBeLessThan(0);
    }
  });
});
