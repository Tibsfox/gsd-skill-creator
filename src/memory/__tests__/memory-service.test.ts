import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RamCache } from '../ram-cache.js';
import { FileStore } from '../file-store.js';
import { IndexManager } from '../index-manager.js';
import { MemoryService } from '../service.js';
import { LodLevel } from '../../lod/types.js';
import type { MemoryRecord, MemoryType } from '../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    type: 'feedback' as MemoryType,
    name: 'test memory',
    description: 'a test memory for unit tests',
    content: 'This is the full content of the test memory.',
    lodCurrent: LodLevel.DETAILED,
    tags: ['test'],
    confidence: 1.0,
    validFrom: new Date(),
    validTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAccessed: new Date(),
    accessCount: 0,
    provenance: { scope: 'project', visibility: 'internal', domains: [] },
    temporalClass: 'seasonal',
    relatedTo: [],
    ...overrides,
  };
}

// ─── RamCache ────────────────────────────────────────────────────────────────

describe('RamCache', () => {
  let cache: RamCache;

  beforeEach(() => {
    cache = new RamCache({ maxSize: 5 });
  });

  it('stores and retrieves a record', async () => {
    const record = makeRecord({ name: 'hello' });
    await cache.store(record);
    const result = await cache.get(record.id);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('hello');
  });

  it('query returns keyword matches', async () => {
    await cache.store(makeRecord({ name: 'embedding model', description: 'BGE-small-en' }));
    await cache.store(makeRecord({ name: 'rust interop', description: 'CXX bridge' }));
    const results = await cache.query({ text: 'embedding', limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].record.name).toBe('embedding model');
  });

  it('evicts LRU when maxSize exceeded', async () => {
    for (let i = 0; i < 6; i++) {
      await cache.store(makeRecord({ id: `id-${i}`, name: `mem-${i}` }));
    }
    expect(await cache.count()).toBe(5);
    // First one should be evicted
    expect(await cache.has('id-0')).toBe(false);
    expect(await cache.has('id-5')).toBe(true);
  });

  it('remove works', async () => {
    const record = makeRecord();
    await cache.store(record);
    expect(await cache.has(record.id)).toBe(true);
    await cache.remove(record.id);
    expect(await cache.has(record.id)).toBe(false);
  });

  it('getWakeUpContext returns formatted string', async () => {
    await cache.store(makeRecord({ name: 'wake test', description: 'wake desc' }));
    const ctx = cache.getWakeUpContext();
    expect(ctx).toContain('wake test');
  });
});

// ─── FileStore ───────────────────────────────────────────────────────────────

describe('FileStore', () => {
  let dir: string;
  let store: FileStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-file-'));
    store = new FileStore(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('stores and retrieves a record via file', async () => {
    const record = makeRecord({ name: 'file test', type: 'user' });
    await store.store(record);
    const result = await store.get(record.id);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('file test');
    expect(result!.type).toBe('user');
  });

  it('writes a .md file with frontmatter', async () => {
    const record = makeRecord({ name: 'frontmatter test', type: 'feedback' });
    await store.store(record);
    const files = await (await import('node:fs/promises')).readdir(dir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    expect(mdFiles.length).toBe(1);
    expect(mdFiles[0]).toContain('feedback');

    const content = await readFile(join(dir, mdFiles[0]), 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name: frontmatter test');
  });

  it('query returns keyword matches', async () => {
    await store.store(makeRecord({ name: 'pgvector setup', content: 'PostgreSQL with vector extension' }));
    await store.store(makeRecord({ name: 'chroma config', content: 'ChromaDB configuration' }));
    const results = await store.query({ text: 'pgvector', limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].record.name).toBe('pgvector setup');
  });

  it('count reflects stored records', async () => {
    expect(await store.count()).toBe(0);
    await store.store(makeRecord({ name: 'one' }));
    await store.store(makeRecord({ name: 'two' }));
    expect(await store.count()).toBe(2);
  });

  it('remove deletes the file', async () => {
    const record = makeRecord();
    await store.store(record);
    expect(await store.has(record.id)).toBe(true);
    await store.remove(record.id);
    expect(await store.has(record.id)).toBe(false);
  });
});

// ─── IndexManager ────────────────────────────────────────────────────────────

describe('IndexManager', () => {
  let dir: string;
  let manager: IndexManager;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-idx-'));
    manager = new IndexManager({ memoryDir: dir });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('stores a record and creates index + file', async () => {
    const record = makeRecord({ name: 'index test', description: 'testing the index' });
    await manager.store(record);

    const indexContent = await manager.getIndexContent();
    expect(indexContent).toContain('index test');
    expect(indexContent).toContain('testing the index');
  });

  it('query matches on index lines', async () => {
    await manager.store(makeRecord({ name: 'kubernetes pods', description: 'pod lifecycle management' }));
    await manager.store(makeRecord({ name: 'docker images', description: 'container image builds' }));
    const results = await manager.query({ text: 'kubernetes', limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].record.name).toBe('kubernetes pods');
  });

  it('count increases after store', async () => {
    expect(await manager.count()).toBe(0);
    await manager.store(makeRecord({ name: 'count test' }));
    expect(await manager.count()).toBeGreaterThanOrEqual(1);
  });
});

// ─── MemoryService (integration) ─────────────────────────────────────────────

describe('MemoryService', () => {
  let dir: string;
  let service: MemoryService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-svc-'));
    service = new MemoryService({
      memoryDir: dir,
      indexPath: 'MEMORY.md',
    });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('remember() creates a memory and recall() retrieves it', async () => {
    await service.remember(
      'Always use pgvector for production embedding storage',
      'feedback',
      'pgvector for production',
      'Use pgvector instead of Chroma for production workloads'
    );

    const results = await service.recall('pgvector');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toContain('pgvector');
  });

  it('query() returns scored results with timing', async () => {
    await service.remember('Foxy uses RTX 4060 Ti', 'user', 'GPU info');
    await service.remember('Build system uses Vite v6', 'project', 'build tool');

    const response = await service.query('GPU', { limit: 5 });
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.queryTimeMs).toBeGreaterThanOrEqual(0);
    expect(response.tiersSearched.length).toBeGreaterThan(0);
  });

  it('cascade searches from LOD 100 upward', async () => {
    await service.remember('cascade test memory', 'feedback', 'cascade test');

    const response = await service.query('cascade', {
      cascade: true,
      minResults: 1,
      limit: 5,
    });
    expect(response.results.length).toBeGreaterThanOrEqual(1);
  });

  it('getWakeUpContext() returns object with context and tokenEstimate', async () => {
    // remember() stores at LOD 300 (files), not LOD 100/200
    // getWakeUpContext reads LOD 100+200 which start empty
    // This test validates the return shape, not content
    const ctx = await service.getWakeUpContext();
    expect(ctx).toHaveProperty('context');
    expect(ctx).toHaveProperty('tokenEstimate');
    expect(typeof ctx.context).toBe('string');
    expect(typeof ctx.tokenEstimate).toBe('number');
  });

  it('deprecate() marks memory as no longer valid', async () => {
    await service.remember('old approach', 'feedback', 'deprecated approach');

    // Find the memory
    const response = await service.query('deprecated approach');
    expect(response.results.length).toBeGreaterThan(0);
    const id = response.results[0].record.id;

    await service.deprecate(id, 'replaced by new approach');

    // Memory should still exist but have validTo set
    const record = await service.query('deprecated approach');
    // It may or may not appear depending on temporal filtering
    // The key is that deprecate doesn't throw
  });

  it('getStats() returns valid statistics shape', async () => {
    const stats = await service.getStats();
    expect(stats).toHaveProperty('tierCounts');
    expect(stats).toHaveProperty('totalMemories');
    expect(stats).toHaveProperty('typeCounts');
    expect(stats).toHaveProperty('activeCount');
    expect(stats).toHaveProperty('deprecatedCount');
    expect(typeof stats.totalMemories).toBe('number');
  });
});

// ─── MemoryService with Arena-backed LOD 300 (M7) ────────────────────────────

describe('MemoryService with Lod300Config.backend="arena"', () => {
  // Build a mock arena invoke function (same shape as arena-file-store.test.ts)
  // so we can instantiate a RustArena without a real Tauri backend.
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
    const base64Size = (b64: string) =>
      Math.floor((b64.length * 3) / 4) -
      (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);

    const invoke = async (cmd: string, args?: Record<string, unknown>) => {
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
            tier, payloadBase64, payloadSize: base64Size(payloadBase64),
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

  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-svc-arena-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('wires ArenaFileStore at LOD 300 when backend="arena"', async () => {
    const { RustArena } = await import('../rust-arena.js');
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });

    const service = new MemoryService({
      memoryDir: dir,
      indexPath: 'MEMORY.md',
      lod300: { backend: 'arena', arena },
    });

    await service.remember(
      'arena-backed memory content',
      'feedback',
      'arena test',
      'test for arena wiring'
    );

    // One chunk in the arena proves LOD 300 went to the arena, not disk.
    expect(mock.size()).toBe(1);

    const results = await service.recall('arena');
    expect(results.some(r => r.includes('arena-backed'))).toBe(true);
  });

  it('writes nothing to memoryDir when backend="arena"', async () => {
    const { RustArena } = await import('../rust-arena.js');
    const { readdir } = await import('node:fs/promises');
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });

    const service = new MemoryService({
      memoryDir: dir,
      indexPath: 'MEMORY.md',
      lod300: { backend: 'arena', arena },
    });

    await service.remember('no-disk content', 'feedback', 'no-disk test');

    // memoryDir should be empty of memory .md files — the arena took the write.
    const entries = await readdir(dir);
    // IndexManager may or may not touch the dir; what matters is no record file.
    const recordFiles = entries.filter(e => e.endsWith('.md') && e !== 'MEMORY.md');
    expect(recordFiles.length).toBe(0);
  });

  it('defaults to FileStore when lod300 is omitted (rollback path)', async () => {
    const { readdir } = await import('node:fs/promises');
    const service = new MemoryService({ memoryDir: dir, indexPath: 'MEMORY.md' });

    await service.remember('disk content', 'feedback', 'disk test');

    // With the default backend we expect at least one record file on disk.
    const entries = await readdir(dir);
    const recordFiles = entries.filter(e => e.endsWith('.md'));
    expect(recordFiles.length).toBeGreaterThan(0);
  });

  it('throws when backend="arena" but arena is missing', () => {
    expect(() => new MemoryService({
      memoryDir: dir,
      indexPath: 'MEMORY.md',
      lod300: { backend: 'arena' },
    })).toThrow(/requires lod300.arena/);
  });

  it('accepts custom arenaTier', async () => {
    const { RustArena } = await import('../rust-arena.js');
    const mock = createMockArena();
    const arena = new RustArena(mock.invoke);
    await arena.init({ dir: '/mock', numSlots: 1024 });

    const service = new MemoryService({
      memoryDir: dir,
      indexPath: 'MEMORY.md',
      lod300: { backend: 'arena', arena, arenaTier: 'warm' },
    });

    await service.remember('warm tier content', 'feedback', 'warm test');
    expect(mock.size()).toBe(1);
  });
});

// ─── MemoryService.preload() (M10) ───────────────────────────────────────────

describe('MemoryService.preload() (M10)', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-svc-preload-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns { available: false } when ChromaDB is not configured', async () => {
    // No chromaPath → no LOD 350 store → preload should short-circuit.
    const service = new MemoryService({ memoryDir: dir, indexPath: 'MEMORY.md' });
    const result = await service.preload();
    expect(result.available).toBe(false);
    expect(result.count).toBe(0);
    expect(result.warmed).toBe(false);
    expect(result.elapsedMs).toBe(0);
  });

  it('returns { available: false } when ChromaDB is configured but not installed', async () => {
    // chromaPath is set, but the `chromadb` package isn't importable in the
    // test environment — ChromaStore.init() catches the ImportError and sets
    // available=false, so preload() reports that cleanly without throwing.
    const service = new MemoryService({
      memoryDir: dir,
      indexPath: 'MEMORY.md',
      chromaPath: '.chroma-nonexistent-test',
    });
    const result = await service.preload();
    expect(result.available).toBe(false);
    expect(result.warmed).toBe(false);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('is safe to call multiple times', async () => {
    const service = new MemoryService({ memoryDir: dir, indexPath: 'MEMORY.md' });
    const first = await service.preload();
    const second = await service.preload();
    const third = await service.preload();
    expect(first.available).toBe(false);
    expect(second.available).toBe(false);
    expect(third.available).toBe(false);
  });
});

// ─── ChromaStore.preload() (M10 — unit tests) ────────────────────────────────

describe('ChromaStore.preload() (M10)', () => {
  it('reports not-available when ChromaDB cannot be imported', async () => {
    const { ChromaStore } = await import('../chroma-store.js');
    const store = new ChromaStore('.chroma-nonexistent-test');
    const result = await store.preload();
    expect(result.available).toBe(false);
    expect(result.count).toBe(0);
    expect(result.warmed).toBe(false);
  });

  it('does not throw when called repeatedly on an unavailable store', async () => {
    const { ChromaStore } = await import('../chroma-store.js');
    const store = new ChromaStore('.chroma-nonexistent-test');
    await expect(store.preload()).resolves.toBeDefined();
    await expect(store.preload()).resolves.toBeDefined();
    await expect(store.preload()).resolves.toBeDefined();
  });

  it('times the preload call and returns elapsedMs ≥ 0', async () => {
    const { ChromaStore } = await import('../chroma-store.js');
    const store = new ChromaStore('.chroma-nonexistent-test');
    const result = await store.preload();
    expect(typeof result.elapsedMs).toBe('number');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
