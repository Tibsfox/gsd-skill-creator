/**
 * Tests for SkillCodebaseAdapter — bridges Grove-backed SkillCodebase
 * to the legacy SkillStoreContract used by SkillCreatorDeps.
 */

import { describe, it, expect } from 'vitest';
import { SkillCodebaseAdapter } from './skill-codebase-adapter.js';
import { SkillCodebase } from './skill-codebase.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';
import type { SkillStoreContract } from './arena-skill-store.js';

// ─── Mock arena ─────────────────────────────────────────────────────────────

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
          initialized: true, recovered: false,
          checkpointPath: '/mock', journalPath: '/mock',
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
      case 'arena_touch': return null;
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
  return { invoke };
}

async function buildFixture() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const codebase = new SkillCodebase({ cas });
  const adapter = new SkillCodebaseAdapter(codebase);
  return { arena, cas, codebase, adapter };
}

const metadata = {
  name: 'vision-to-mission',
  description: "Transform a builder's vision into a GSD mission package.",
};
const body = '# Vision → Mission\n\nBody text here.';

// ─── Contract compliance ───────────────────────────────────────────────────

describe('SkillCodebaseAdapter implements SkillStoreContract', () => {
  it('is assignable to SkillStoreContract', async () => {
    const { adapter } = await buildFixture();
    const contract: SkillStoreContract = adapter;
    expect(contract.create).toBeDefined();
    expect(contract.list).toBeDefined();
    expect(contract.exists).toBeDefined();
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('SkillCodebaseAdapter.create', () => {
  it('returns an arena:// path', async () => {
    const { adapter } = await buildFixture();
    const result = await adapter.create('vision-to-mission', metadata, body);
    expect(result.path.startsWith('arena://')).toBe(true);
    // Followed by a 64-char hex hash.
    const hash = result.path.slice('arena://'.length);
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('persists the skill so exists() returns true', async () => {
    const { adapter } = await buildFixture();
    expect(await adapter.exists('vision-to-mission')).toBe(false);
    await adapter.create('vision-to-mission', metadata, body);
    expect(await adapter.exists('vision-to-mission')).toBe(true);
  });

  it('rejects empty skill names', async () => {
    const { adapter } = await buildFixture();
    await expect(adapter.create('', metadata, body)).rejects.toThrow(/non-empty/);
    await expect(adapter.create('   ', metadata, body)).rejects.toThrow(/non-empty/);
  });

  it('updates an existing skill when create is called again', async () => {
    const { adapter } = await buildFixture();
    await adapter.create('vision-to-mission', metadata, body);
    await adapter.create('vision-to-mission', metadata, body + '\nUpdated.');

    const updated = await adapter.getBody('vision-to-mission');
    expect(updated).toContain('Updated.');
  });
});

// ─── list ───────────────────────────────────────────────────────────────────

describe('SkillCodebaseAdapter.list', () => {
  it('returns empty array for a fresh adapter', async () => {
    const { adapter } = await buildFixture();
    expect(await adapter.list()).toEqual([]);
  });

  it('returns every created skill name, sorted', async () => {
    const { adapter } = await buildFixture();
    await adapter.create('cherry', { name: 'cherry', description: 'x' }, 'x');
    await adapter.create('apple', { name: 'apple', description: 'x' }, 'x');
    await adapter.create('banana', { name: 'banana', description: 'x' }, 'x');
    expect(await adapter.list()).toEqual(['apple', 'banana', 'cherry']);
  });
});

// ─── exists ─────────────────────────────────────────────────────────────────

describe('SkillCodebaseAdapter.exists', () => {
  it('returns false for missing skills', async () => {
    const { adapter } = await buildFixture();
    expect(await adapter.exists('ghost')).toBe(false);
  });

  it('distinguishes between existing and missing skills', async () => {
    const { adapter } = await buildFixture();
    await adapter.create('present', { name: 'present', description: 'x' }, 'x');
    expect(await adapter.exists('present')).toBe(true);
    expect(await adapter.exists('absent')).toBe(false);
  });
});

// ─── Extended helpers ───────────────────────────────────────────────────────

describe('SkillCodebaseAdapter extended helpers', () => {
  it('getBody returns the stored body', async () => {
    const { adapter } = await buildFixture();
    await adapter.create('vision-to-mission', metadata, body);
    expect(await adapter.getBody('vision-to-mission')).toBe(body);
  });

  it('getBody returns null for missing skills', async () => {
    const { adapter } = await buildFixture();
    expect(await adapter.getBody('ghost')).toBeNull();
  });

  it('getMetadata returns name + description', async () => {
    const { adapter } = await buildFixture();
    await adapter.create('vision-to-mission', metadata, body);
    const meta = await adapter.getMetadata('vision-to-mission');
    expect(meta).not.toBeNull();
    expect(meta!.name).toBe(metadata.name);
    expect(meta!.description).toBe(metadata.description);
  });

  it('getCodebase exposes the underlying SkillCodebase', async () => {
    const { adapter, codebase } = await buildFixture();
    expect(adapter.getCodebase()).toBe(codebase);
  });
});

// ─── End-to-end: a user script using the adapter ────────────────────────────

describe('end-to-end: adapter as drop-in SkillStore', () => {
  it('can be used wherever SkillStoreContract is expected', async () => {
    const { adapter } = await buildFixture();

    // Simulate the SkillCreatorDeps.skillStore usage pattern.
    const store: SkillStoreContract = adapter;

    await store.create('my-skill', { name: 'my-skill', description: 'test' }, '# body');
    expect(await store.exists('my-skill')).toBe(true);
    expect(await store.list()).toEqual(['my-skill']);

    // Update the skill.
    await store.create('my-skill', { name: 'my-skill', description: 'updated' }, '# body v2');

    // The underlying history is preserved via Grove auto parent linking.
    const codebase = adapter.getCodebase();
    const history = await codebase.history('my-skill');
    expect(history.length).toBe(2);
  });
});

// ─── createGroveSkillStore bootstrap helper ─────────────────────────────────

describe('createGroveSkillStore (P9 production bootstrap)', () => {
  it('constructs a working adapter + codebase + cas + arena in one call', async () => {
    // Import dynamically so the test file doesn't need the node shim
    // plumbed through at top level (avoids noisy imports).
    const { createGroveSkillStore } = await import('./skill-codebase-adapter.js');
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = await mkdtemp(join(tmpdir(), 'grove-bootstrap-'));
    const arenaPath = join(tempDir, 'arena.json');

    try {
      const grove = await createGroveSkillStore({ arenaPath });
      expect(grove.adapter).toBeDefined();
      expect(grove.codebase).toBeDefined();
      expect(grove.cas).toBeDefined();
      expect(grove.arena).toBeDefined();

      // The adapter satisfies SkillStoreContract out of the box.
      const store: SkillStoreContract = grove.adapter;
      await store.create('bootstrap-test', { name: 'bootstrap-test', description: 'via bootstrap' }, '# body');
      expect(await store.exists('bootstrap-test')).toBe(true);
      expect(await store.list()).toEqual(['bootstrap-test']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('persists across bootstrap calls via the Node snapshot shim', async () => {
    const { createGroveSkillStore } = await import('./skill-codebase-adapter.js');
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = await mkdtemp(join(tmpdir(), 'grove-persist-'));
    const arenaPath = join(tempDir, 'arena.json');

    try {
      // First session: write a skill.
      {
        const grove = await createGroveSkillStore({ arenaPath });
        await grove.adapter.create('persistent', { name: 'persistent', description: 'x' }, '# v1');
        await grove.arena.checkpoint();
      }

      // Second session: fresh bootstrap against the same snapshot.
      {
        const grove2 = await createGroveSkillStore({ arenaPath });
        expect(await grove2.adapter.exists('persistent')).toBe(true);
        const body = await grove2.adapter.getBody('persistent');
        expect(body).toBe('# v1');
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('honors an injected invoke function (Tauri compatibility path)', async () => {
    const { createGroveSkillStore } = await import('./skill-codebase-adapter.js');
    const mock = createMockArena();
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = await mkdtemp(join(tmpdir(), 'grove-invoke-'));
    try {
      const grove = await createGroveSkillStore({
        arenaPath: join(tempDir, 'arena.json'),
        invoke: mock.invoke,
      });
      await grove.adapter.create('mock-skill', { name: 'mock-skill', description: 'via mock invoke' }, '# body');
      expect(await grove.adapter.exists('mock-skill')).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('can be plugged into a SkillCreatorDeps-shaped object', async () => {
    // This is the "one DI change" in action: a user constructs their
    // deps object and drops the Grove-backed skillStore in wherever
    // `SkillStoreContract` is required.
    const { createGroveSkillStore } = await import('./skill-codebase-adapter.js');
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = await mkdtemp(join(tmpdir(), 'grove-deps-'));
    try {
      const grove = await createGroveSkillStore({
        arenaPath: join(tempDir, 'arena.json'),
      });

      // Shape-check: wire into a minimal deps-like object.
      const minimalDeps: { skillStore: SkillStoreContract } = {
        skillStore: grove.adapter,
      };

      await minimalDeps.skillStore.create(
        'di-test',
        { name: 'di-test', description: 'the one DI change' },
        '# body',
      );
      expect(await minimalDeps.skillStore.list()).toEqual(['di-test']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
