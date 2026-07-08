/**
 * PG_TEST-gated end-to-end test for the MEM-7 ingestion keystone + semantic
 * wiring (Track A + Track B against the live LOD-400 database).
 *
 * Runs the real `ingest-conversations --pg` command over a fixture transcript,
 * then confirms the turns were dual-written to PgStore WITH embeddings and are
 * retrievable via `searchConversationsByEmbedding` (the same path the gateway
 * adapter uses). Uses the production EmbeddingService for both store-time (inside
 * the command) and query-time, so the vectors share a space. Cleans up its rows.
 *
 *   PG_TEST=1 npx vitest run src/cli/commands/ingest-conversations.pg.integration.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ingestConversationsCommand } from './ingest-conversations.js';
import { ConversationStore } from '../../memory/conversation-store.js';
import { PgStore } from '../../memory/pg-store.js';
import { getEmbeddingService } from '../../embeddings/index.js';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';

const RUN = !!process.env.PG_TEST;

// A rare token makes the ingested content unambiguous vs any pre-existing rows.
const FIXTURE =
  [
    JSON.stringify({ type: 'human', message: 'Tell me about the quokkaBeacon protocol', timestamp: '2026-07-08T00:00:00Z' }),
    JSON.stringify({ type: 'assistant', message: { content: 'The quokkaBeacon protocol synchronizes semantic conversation vectors.' }, timestamp: '2026-07-08T00:00:01Z' }),
  ].join('\n') + '\n';

describe.skipIf(!RUN)('ingest-conversations --pg end-to-end (PG_TEST)', () => {
  let cleanupPool: any;
  let workdir: string;
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
    const env = loadPgEnv();
    if (!env.ok) throw new Error('PG_TEST set but RH_POSTGRES_URL is not resolvable');
    const pg = await import('pg');
    cleanupPool = new pg.default.Pool({ connectionString: env.url });
    workdir = mkdtempSync(join(tmpdir(), 'sc-ingest-pg-'));
  });

  afterAll(async () => {
    for (const id of createdSessionIds) {
      // Turns cascade on session delete (ON DELETE CASCADE).
      await cleanupPool.query('DELETE FROM gsd_memory.conversation_sessions WHERE id = $1', [id]);
    }
    await cleanupPool.end();
    rmSync(workdir, { recursive: true, force: true });
  });

  it('dual-writes embedded turns that semantic search then retrieves', async () => {
    const convDir = join(workdir, 'conversations');
    const logPath = join(workdir, 'session.jsonl');
    writeFileSync(logPath, FIXTURE);

    const code = await ingestConversationsCommand([logPath, '--pg', '--conversations-dir', convDir]);
    expect(code).toBe(0);

    // The command minted a UUID session id; capture it for search + cleanup.
    const store = new ConversationStore({ storePath: convDir });
    const sessions = await store.listSessions();
    expect(sessions.length).toBe(1);
    const sid = sessions[0]!.id;
    createdSessionIds.push(sid);
    // Session id must be a real UUID (PgStore FK requires it).
    expect(sid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const env = loadPgEnv();
    const embedder = await getEmbeddingService();
    const pgStore = new PgStore({ connectionString: env.ok ? env.url : undefined }, embedder);
    try {
      const { embedding } = await embedder.embed('quokkaBeacon protocol');
      // Scope to our session so we assert on our own dual-written rows only.
      const results = await pgStore.searchConversationsByEmbedding(embedding, 20, [sid]);

      // Turns were written AND embedded (rows with a NULL vector are excluded).
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.turn.content.includes('quokkaBeacon'))).toBe(true);
      // Role vocabulary is passed through unchanged ('human'/'assistant').
      expect(results.every((r) => ['human', 'assistant', 'system'].includes(r.turn.role))).toBe(true);
    } finally {
      await pgStore.close();
    }
  }, 60_000);
});
