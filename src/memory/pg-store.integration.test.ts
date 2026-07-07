/**
 * PG_TEST-gated integration tests for the LOD-400 PostgreSQL tier (PG-1/PG-3).
 *
 * Skipped by default; run against the live `tibsfox` DB with:
 *   PG_TEST=1 npx vitest run --project integration src/memory/pg-store.integration.test.ts
 *
 * The suite uses the canonical RH_POSTGRES_URL credentials (via loadPgEnv),
 * writes into the maple-owned `gsd_memory` schema, and cleans up ONLY the rows
 * it creates (tracked by id; relations cascade). It never drops the schema, so
 * any real memories in `gsd_memory` are left untouched.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PgStore } from './pg-store.js';
import { MemoryService } from './service.js';
import { loadPgEnv } from '../scribe/pg-runtime/env-loader.js';
import { inferTemporalClass } from './types.js';
import type { MemoryRecord, MemoryType, MemoryVisibility } from './types.js';
import { LodLevel } from '../lod/types.js';

const RUN = !!process.env.PG_TEST;

function makeRecord(
  opts: { name?: string; content?: string; type?: MemoryType; visibility?: MemoryVisibility } = {},
): MemoryRecord {
  const now = new Date();
  const type = opts.type ?? 'project';
  return {
    id: randomUUID(),
    type,
    name: opts.name ?? `pgtest-${randomUUID().slice(0, 8)}`,
    description: 'pg-store integration test record',
    content: opts.content ?? 'default content',
    lodCurrent: LodLevel.FABRICATION,
    tags: [],
    confidence: 0.5,
    validFrom: now,
    validTo: null,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    provenance: { scope: 'project', visibility: opts.visibility ?? 'internal', domains: [] },
    temporalClass: inferTemporalClass(type, 'project'),
    relatedTo: [],
  };
}

describe.skipIf(!RUN)('PgStore integration (PG_TEST)', () => {
  let store: PgStore;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const env = loadPgEnv();
    if (!env.ok) throw new Error('PG_TEST set but RH_POSTGRES_URL is not resolvable');
    store = new PgStore({ connectionString: env.url });
    await store.init();
  });

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await store.remove(id);
      } catch {
        /* ignore cleanup errors */
      }
    }
    await store.close();
  });

  function track(r: MemoryRecord): MemoryRecord {
    createdIds.push(r.id);
    return r;
  }

  it('stores and retrieves a record by id', async () => {
    const rec = track(makeRecord({ content: 'topex poseidon ocean altimetry' }));
    await store.store(rec);
    const got = await store.get(rec.id);
    expect(got).not.toBeNull();
    expect(got!.name).toBe(rec.name);
    expect(got!.content).toContain('altimetry');
    expect(got!.lodCurrent).toBe(LodLevel.FABRICATION);
  });

  it('full-text query returns the stored record at LOD 400', async () => {
    const rec = track(makeRecord({ content: 'radar altimetry sea surface height' }));
    await store.store(rec);
    // Query by the record's unique name — matches the ILIKE branch deterministically.
    const results = await store.query({ text: rec.name });
    const hit = results.find((r) => r.record.id === rec.id);
    expect(hit).toBeDefined();
    expect(hit!.sourceLod).toBe(LodLevel.FABRICATION);
  });

  it('count reflects a newly stored record', async () => {
    const before = await store.count();
    await store.store(track(makeRecord()));
    const after = await store.count();
    expect(after).toBeGreaterThan(before);
  });

  it('stores and searches by embedding (pgvector cosine, discriminating)', async () => {
    const near = track(makeRecord({ content: 'embedding near target' }));
    const far = track(makeRecord({ content: 'embedding far target' }));
    await store.store(near);
    await store.store(far);

    const nearVec = new Array(384).fill(0);
    nearVec[0] = 1; // unit vector e0
    const farVec = new Array(384).fill(0);
    farVec[1] = 1; // orthogonal unit vector e1
    await store.storeEmbedding(near.id, nearVec);
    await store.storeEmbedding(far.id, farVec);

    // Query with e0: the near record (cosine 1) must rank above the orthogonal
    // far record (cosine 0). Records without embeddings are excluded entirely.
    const results = await store.searchByEmbedding(nearVec, 10);
    const nearHit = results.find((r) => r.record.id === near.id);
    const farHit = results.find((r) => r.record.id === far.id);
    expect(nearHit).toBeDefined();
    expect(nearHit!.score).toBeGreaterThan(0.9);
    expect(farHit).toBeDefined();
    expect(nearHit!.score).toBeGreaterThan(farHit!.score);
  });

  it('creates relations and traverses the graph', async () => {
    const a = track(makeRecord({ content: 'graph node A' }));
    const b = track(makeRecord({ content: 'graph node B' }));
    await store.store(a);
    await store.store(b);

    const rel = await store.createRelation(a.id, 'elaborates', b.id);
    expect(rel).not.toBeNull();

    const rels = await store.getRelations(a.id);
    expect(rels.some((r) => r.objectId === b.id)).toBe(true);

    const neighbors = await store.traverseGraph(a.id, 2);
    expect(neighbors.some((n) => n.id === b.id)).toBe(true);
  });

  it('getPublicMemoriesForSync returns only public memories', async () => {
    const pub = track(makeRecord({ content: 'public sync record', visibility: 'public' }));
    const priv = track(makeRecord({ content: 'private no-sync record', visibility: 'private' }));
    await store.store(pub);
    await store.store(priv);

    const publics = await store.getPublicMemoriesForSync();
    const ids = publics.map((r) => r.id);
    expect(ids).toContain(pub.id);
    expect(ids).not.toContain(priv.id);
  });

  it('applyMigrations is version-checked (a second init is a clean no-op)', async () => {
    const env = loadPgEnv();
    const store2 = new PgStore({ connectionString: env.ok ? env.url : undefined });
    await store2.init();
    await expect(store2.count()).resolves.toBeGreaterThanOrEqual(0);
    await store2.close();
  });
});

describe.skipIf(!RUN)('MemoryService LOD-400 wiring (PG_TEST)', () => {
  let service: MemoryService;
  let pg: PgStore;
  let tmp: string;
  const ids: string[] = [];

  beforeAll(async () => {
    const env = loadPgEnv();
    if (!env.ok) throw new Error('PG_TEST set but RH_POSTGRES_URL is not resolvable');
    tmp = await mkdtemp(join(tmpdir(), 'memsvc-pg-'));
    service = new MemoryService({
      memoryDir: join(tmp, 'm'),
      indexPath: 'MEMORY.md',
      pgConnectionString: env.url,
    });
    pg = new PgStore({ connectionString: env.url }); // independent handle for count/cleanup
    await pg.init();
  });

  afterAll(async () => {
    for (const id of ids) {
      try {
        await pg.remove(id);
      } catch {
        /* ignore */
      }
    }
    await pg.close();
    await service.close();
    await rm(tmp, { recursive: true, force: true });
  });

  it('registers LOD-400 and populates it on store()', async () => {
    const before = await pg.count();
    const rec = await service.remember('memoryservice pg tier content', 'project', 'memsvc-pg-note');
    ids.push(rec.id);

    // store() awaits the LOD-400 write, so the row is present immediately.
    const after = await pg.count();
    expect(after).toBeGreaterThan(before);

    const stats = await service.getStats();
    expect(stats.tierCounts[LodLevel.FABRICATION]).toBeGreaterThanOrEqual(1);
  });
});
