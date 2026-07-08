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
import type { TurnEmbedder } from './pg-store.js';
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

  it('has() and remove() reflect the record lifecycle', async () => {
    const rec = track(makeRecord({ content: 'lifecycle record' }));
    await store.store(rec);
    expect(await store.has(rec.id)).toBe(true);

    expect(await store.remove(rec.id)).toBe(true);
    expect(await store.has(rec.id)).toBe(false);
    expect(await store.get(rec.id)).toBeNull();
    // Removing an already-absent id is a no-op that returns false.
    expect(await store.remove(rec.id)).toBe(false);
  });

  it('getRelations returns empty for a record with no relations', async () => {
    const rec = track(makeRecord({ content: 'no relations record' }));
    await store.store(rec);
    await expect(store.getRelations(rec.id)).resolves.toEqual([]);
  });

  it('storeEmbedding attaches a vector a later searchByEmbedding finds', async () => {
    const rec = track(makeRecord({ content: 'embedding attach target' }));
    await store.store(rec);

    const vec = new Array(384).fill(0);
    vec[5] = 1; // unit vector e5
    // No embedding yet -> excluded from vector search entirely.
    const before = await store.searchByEmbedding(vec, 100);
    expect(before.find((r) => r.record.id === rec.id)).toBeUndefined();

    await store.storeEmbedding(rec.id, vec);
    const after = await store.searchByEmbedding(vec, 100);
    const hit = after.find((r) => r.record.id === rec.id);
    expect(hit).toBeDefined();
    expect(hit!.score).toBeGreaterThan(0.9);
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

describe.skipIf(!RUN)('PgStore conversation history (PG_TEST)', () => {
  let store: PgStore;
  // Raw pool for cleanup: there is no public removeSession, and turns cascade
  // from their session (conversation_turns.session_id ON DELETE CASCADE).
  let cleanupPool: any; // pg.Pool — dynamically imported
  const sessionIds: string[] = [];

  // An alpha-only marker survives to_tsvector/plainto_tsquery cleanly (no digit
  // token-class surprises) and is unique enough to isolate this run's turns.
  const marker = 'convmark' + randomUUID().replace(/[0-9-]/g, '').slice(0, 8);

  beforeAll(async () => {
    const env = loadPgEnv();
    if (!env.ok) throw new Error('PG_TEST set but RH_POSTGRES_URL is not resolvable');
    store = new PgStore({ connectionString: env.url });
    await store.init();
    const pg = await import('pg');
    cleanupPool = new pg.default.Pool({ connectionString: env.url });
  });

  afterAll(async () => {
    for (const id of sessionIds) {
      try {
        await cleanupPool.query('DELETE FROM gsd_memory.conversation_sessions WHERE id = $1', [id]);
      } catch {
        /* ignore cleanup errors */
      }
    }
    await cleanupPool.end();
    await store.close();
  });

  it('stores sessions + turns, full-text searches them, and honors the session filter', async () => {
    const sessionId = randomUUID();
    const otherSessionId = randomUUID();
    sessionIds.push(sessionId, otherSessionId);

    await store.storeSession({ id: sessionId, startedAt: new Date(), project: 'pgtest', branch: 'dev', topics: ['altimetry'] });
    await store.storeSession({ id: otherSessionId, startedAt: new Date(), project: 'pgtest' });

    await store.storeTurn({ id: `turn-a-${marker}`, sessionId, role: 'user', content: `${marker} ocean topography experiment`, timestamp: new Date() });
    await store.storeTurn({ id: `turn-b-${marker}`, sessionId, role: 'assistant', content: `${marker} radar altimeter response`, timestamp: new Date() });
    await store.storeTurn({ id: `turn-c-${marker}`, sessionId: otherSessionId, role: 'user', content: `${marker} unrelated other-session topic`, timestamp: new Date() });

    // Full-text search returns matching turns with a numeric rank.
    const found = await store.searchConversations(marker, 20);
    const ids = found.map((f) => f.turn.id);
    expect(ids).toContain(`turn-a-${marker}`);
    expect(ids).toContain(`turn-c-${marker}`);
    expect(found.every((f) => typeof f.score === 'number')).toBe(true);

    // sessionFilter restricts to the named session (turn-c is excluded).
    const filtered = await store.searchConversations(marker, 20, [sessionId]);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((f) => f.sessionId === sessionId)).toBe(true);
    expect(filtered.some((f) => f.turn.id === `turn-c-${marker}`)).toBe(false);

    // Recent turns include our writes.
    const recent = await store.getRecentTurns(200);
    expect(recent.some((t) => t.id === `turn-a-${marker}`)).toBe(true);
  });

  it('increments the session turn_count as turns are stored', async () => {
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);

    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `tc-1-${tag}`, sessionId, role: 'user', content: 'first turn', timestamp: new Date() });
    await store.storeTurn({ id: `tc-2-${tag}`, sessionId, role: 'assistant', content: 'second turn', timestamp: new Date() });

    const { rows } = await cleanupPool.query(
      'SELECT turn_count FROM gsd_memory.conversation_sessions WHERE id = $1',
      [sessionId],
    );
    expect(rows[0].turn_count).toBe(2);
  });
});

describe.skipIf(!RUN)('PgStore conversation embeddings (PG-5)', () => {
  let cleanupPool: any; // pg.Pool — dynamically imported
  const stores: PgStore[] = [];
  const sessionIds: string[] = [];
  let envUrl: string | undefined;

  // Unit basis vectors, so cosine is exactly 1 (same axis) or 0 (orthogonal).
  const E = (i: number): number[] => {
    const v = new Array(384).fill(0);
    v[i] = 1;
    return v;
  };
  // Deterministic content → vector mapping keyed by marker word.
  const markerEmbedder: TurnEmbedder = {
    embed: async (text: string) => ({
      embedding: text.includes('alphamark') ? E(0) : text.includes('betamark') ? E(1) : E(2),
    }),
  };

  async function makeStore(embedder?: TurnEmbedder): Promise<PgStore> {
    const s = new PgStore({ connectionString: envUrl }, embedder);
    await s.init();
    stores.push(s);
    return s;
  }

  beforeAll(async () => {
    const env = loadPgEnv();
    if (!env.ok) throw new Error('PG_TEST set but RH_POSTGRES_URL is not resolvable');
    envUrl = env.url;
    const pg = await import('pg');
    cleanupPool = new pg.default.Pool({ connectionString: envUrl });
  });

  afterAll(async () => {
    for (const id of sessionIds) {
      try {
        await cleanupPool.query('DELETE FROM gsd_memory.conversation_sessions WHERE id = $1', [id]);
      } catch {
        /* ignore */
      }
    }
    await cleanupPool.end();
    await Promise.all(stores.map((s) => s.close()));
  });

  it('embeds turns at store time and ranks conversation search by cosine', async () => {
    const store = await makeStore(markerEmbedder);
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `near-${tag}`, sessionId, role: 'user', content: 'alphamark near content', timestamp: new Date() });
    await store.storeTurn({ id: `far-${tag}`, sessionId, role: 'user', content: 'betamark far content', timestamp: new Date() });

    // Query on the alpha axis: the near turn (cosine 1) ranks above far (cosine 0).
    const hits = await store.searchConversationsByEmbedding(E(0), 10);
    const near = hits.find((h) => h.turn.id === `near-${tag}`);
    const far = hits.find((h) => h.turn.id === `far-${tag}`);
    expect(near).toBeDefined();
    expect(near!.score).toBeGreaterThan(0.9);
    expect(far).toBeDefined();
    expect(near!.score).toBeGreaterThan(far!.score);

    // Direct column check: the vector was actually written, not just retrievable.
    const chk = await cleanupPool.query('SELECT embedding FROM gsd_memory.conversation_turns WHERE id = $1', [`near-${tag}`]);
    expect(chk.rows[0].embedding).not.toBeNull();
  });

  it('honors the session filter on semantic search', async () => {
    const store = await makeStore(markerEmbedder);
    const s1 = randomUUID();
    const s2 = randomUUID();
    sessionIds.push(s1, s2);
    const tag = s1.slice(0, 8);
    await store.storeSession({ id: s1, startedAt: new Date() });
    await store.storeSession({ id: s2, startedAt: new Date() });
    await store.storeTurn({ id: `s1-${tag}`, sessionId: s1, role: 'user', content: 'alphamark one', timestamp: new Date() });
    await store.storeTurn({ id: `s2-${tag}`, sessionId: s2, role: 'user', content: 'alphamark two', timestamp: new Date() });

    const filtered = await store.searchConversationsByEmbedding(E(0), 20, [s1]);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((h) => h.sessionId === s1)).toBe(true);
    expect(filtered.some((h) => h.turn.id === `s2-${tag}`)).toBe(false);
  });

  it('stores turns without a vector when no embedder is configured (excluded from semantic search)', async () => {
    const store = await makeStore(); // no embedder
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    const marker = 'noembedmark' + tag;
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `ne-${tag}`, sessionId, role: 'user', content: `${marker} content`, timestamp: new Date() });

    // No embedding -> excluded from semantic search...
    const sem = await store.searchConversationsByEmbedding(E(0), 50);
    expect(sem.some((h) => h.turn.id === `ne-${tag}`)).toBe(false);
    // ...but still found by full-text search.
    const ft = await store.searchConversations(marker, 20);
    expect(ft.some((h) => h.turn.id === `ne-${tag}`)).toBe(true);

    // Direct column check: the embedding column is NULL (nothing written).
    const chk = await cleanupPool.query('SELECT embedding FROM gsd_memory.conversation_turns WHERE id = $1', [`ne-${tag}`]);
    expect(chk.rows[0].embedding).toBeNull();
  });

  it('degrades gracefully when the embedder throws: the turn is still stored (no vector)', async () => {
    const throwing: TurnEmbedder = {
      embed: async () => {
        throw new Error('embed backend down');
      },
    };
    const store = await makeStore(throwing);
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    const marker = 'gracemark' + tag;
    await store.storeSession({ id: sessionId, startedAt: new Date() });

    await expect(
      store.storeTurn({ id: `g-${tag}`, sessionId, role: 'user', content: `${marker} content`, timestamp: new Date() }),
    ).resolves.toBeUndefined();

    // Stored (full-text finds it) but with no vector (excluded from semantic).
    const ft = await store.searchConversations(marker, 20);
    expect(ft.some((h) => h.turn.id === `g-${tag}`)).toBe(true);
    const sem = await store.searchConversationsByEmbedding(E(0), 50);
    expect(sem.some((h) => h.turn.id === `g-${tag}`)).toBe(false);

    // Direct column check: the embed failure left the embedding NULL.
    const chk = await cleanupPool.query('SELECT embedding FROM gsd_memory.conversation_turns WHERE id = $1', [`g-${tag}`]);
    expect(chk.rows[0].embedding).toBeNull();
  });

  // ── MEM-7 follow-ups ──────────────────────────────────────────────────

  it('tags turns with the embedder method and guards a cross-method query', async () => {
    const modelEmbedder: TurnEmbedder = {
      embed: async () => ({ embedding: E(0), method: 'model' }),
    };
    const store = await makeStore(modelEmbedder);
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `m-${tag}`, sessionId, role: 'user', content: 'method tagged content', timestamp: new Date() });

    // The producing method is recorded on the row.
    const chk = await cleanupPool.query('SELECT embedding_method FROM gsd_memory.conversation_turns WHERE id = $1', [`m-${tag}`]);
    expect(chk.rows[0].embedding_method).toBe('model');

    // A same-method query finds it; a different-method query excludes it
    // (the two occupy incomparable vector spaces).
    const same = await store.searchConversationsByEmbedding(E(0), 50, [sessionId], 'model');
    expect(same.some((h) => h.turn.id === `m-${tag}`)).toBe(true);
    const diff = await store.searchConversationsByEmbedding(E(0), 50, [sessionId], 'heuristic');
    expect(diff.some((h) => h.turn.id === `m-${tag}`)).toBe(false);
  });

  it('grandfathers turns with an unknown (NULL) method into a method-scoped query', async () => {
    const store = await makeStore(markerEmbedder); // returns no method -> NULL column
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `null-${tag}`, sessionId, role: 'user', content: 'alphamark legacy', timestamp: new Date() });

    const chk = await cleanupPool.query('SELECT embedding_method FROM gsd_memory.conversation_turns WHERE id = $1', [`null-${tag}`]);
    expect(chk.rows[0].embedding_method).toBeNull();

    // A method-scoped query still includes the NULL-method row.
    const scoped = await store.searchConversationsByEmbedding(E(0), 50, [sessionId], 'model');
    expect(scoped.some((h) => h.turn.id === `null-${tag}`)).toBe(true);
  });

  it('does not inflate turn_count when the same turn id is stored twice (idempotent)', async () => {
    const store = await makeStore();
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `dup-${tag}`, sessionId, role: 'user', content: 'once', timestamp: new Date() });
    await store.storeTurn({ id: `dup-${tag}`, sessionId, role: 'user', content: 'once', timestamp: new Date() }); // conflict → no-op

    const { rows } = await cleanupPool.query('SELECT turn_count FROM gsd_memory.conversation_sessions WHERE id = $1', [sessionId]);
    expect(rows[0].turn_count).toBe(1);
  });

  it('hasSession and clearSessionTurns support a clean re-ingest', async () => {
    const store = await makeStore(markerEmbedder);
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    const tag = sessionId.slice(0, 8);
    const marker = 'clearmark' + tag;

    expect(await store.hasSession(sessionId)).toBe(false);
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    expect(await store.hasSession(sessionId)).toBe(true);

    await store.storeTurn({ id: `c-${tag}`, sessionId, role: 'user', content: `${marker} content`, timestamp: new Date() });
    expect((await store.searchConversations(marker, 20)).some((h) => h.turn.id === `c-${tag}`)).toBe(true);

    await store.clearSessionTurns(sessionId);
    expect((await store.searchConversations(marker, 20)).some((h) => h.turn.id === `c-${tag}`)).toBe(false);
    const { rows } = await cleanupPool.query('SELECT turn_count FROM gsd_memory.conversation_sessions WHERE id = $1', [sessionId]);
    expect(rows[0].turn_count).toBe(0);
  });

  it('persists source_hash/source_path provenance on the session', async () => {
    const store = await makeStore();
    const sessionId = randomUUID();
    sessionIds.push(sessionId);
    await store.storeSession({
      id: sessionId,
      startedAt: new Date(),
      sourceHash: 'deadbeefcafe',
      sourcePath: '/tmp/transcript.jsonl',
    });
    const { rows } = await cleanupPool.query(
      'SELECT source_hash, source_path FROM gsd_memory.conversation_sessions WHERE id = $1',
      [sessionId],
    );
    expect(rows[0].source_hash).toBe('deadbeefcafe');
    expect(rows[0].source_path).toBe('/tmp/transcript.jsonl');
  });

  it('deleteSession removes the session and cascades its turns', async () => {
    const store = await makeStore(markerEmbedder);
    const sessionId = randomUUID();
    sessionIds.push(sessionId); // harmless double-delete in afterAll if it runs
    const tag = sessionId.slice(0, 8);
    await store.storeSession({ id: sessionId, startedAt: new Date() });
    await store.storeTurn({ id: `del-${tag}`, sessionId, role: 'user', content: 'alphamark doomed', timestamp: new Date() });
    expect(await store.hasSession(sessionId)).toBe(true);

    await store.deleteSession(sessionId);

    expect(await store.hasSession(sessionId)).toBe(false);
    const turns = await cleanupPool.query('SELECT count(*)::int AS n FROM gsd_memory.conversation_turns WHERE session_id = $1', [sessionId]);
    expect(turns.rows[0].n).toBe(0); // cascaded
  });
});
