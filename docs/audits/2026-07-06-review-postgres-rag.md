# Postgres Integration & RAG-Capability Review — 2026-07-06

Dimension **D / postgres-rag**. Scope: `src/memory/pg-store.ts` and every
consumer, `src/mcp/gateway/tools/memory-tools.ts`, `src/scribe/pg-runtime/`,
`migrations/`, and the credential/embeddings gating. Read-only audit; verified
against source.

## Summary

The repo ships a **complete, pgvector-backed PostgreSQL memory store**
(`PgStore`, LOD 400) with a real schema (memories + relations + conversation
logs), cosine ANN search, tsvector full-text search, and recursive-CTE graph
traversal — **and none of it runs.** `PgStore` is never instantiated anywhere in
`src/` (grep `new PgStore` → 0 hits); the `MemoryService` constructor explicitly
comments the tier out (`service.ts:163-164` "Phase 2, not implemented yet"); the
MCP `memory.*` tools resolve entirely on RAM/index/file tiers plus an optional
Chroma tier. So at runtime **similarity is done in JS** (`hybridRerank`) and
optionally in Chroma — **pgvector, in-DB FTS, and the whole postgres surface are
0% utilised** by the memory system. Meanwhile the local `tibsfox` postgres holds
`RH_POSTGRES_URL` and the rest of the repo (`atlas-pg`, `atlas/spatial`, scribe
`pg-runtime`, release-history) already speaks postgres competently — `PgStore`
just isn't plugged in, and worse, it wouldn't connect if it were, because it
ignores the canonical `RH_POSTGRES_URL`/.env credential path and its own
`connectionString` field. The headline opportunity is large and cheap: the code
exists and is close to correct; it needs instantiation, credential wiring behind
a flag, and a couple of index/migration upgrades.

The **separate** scribe `pg-runtime` surface (env-loader + pool factory) is
well-built and is the model the memory store should adopt.

## Findings

### PG-1 — The entire pgvector/LOD-400 postgres tier is dead code (never instantiated)
- **Severity:** high · **Category:** gap / new-function · **Effort:** L
- **Location:** `src/memory/service.ts:163-164` (commented-out tier);
  `src/memory/pg-store.ts` (whole file); wiring absent repo-wide.
- **Problem:** `grep -rn "new PgStore"` returns zero hits. `MemoryService`'s
  cascade lists `LodLevel.FABRICATION` (400) in `CASCADE_ORDER` (service.ts:116)
  but the constructor never adds a store for it — the block is literally
  `// LOD 400 — PostgreSQL (Phase 2, not implemented yet) // if (config.pgConnectionString) { ... }`.
  `MemoryServiceConfig.pgConnectionString` (service.ts:87-88) is declared and
  never consumed. Consequently: `searchByEmbedding`, `storeEmbedding`,
  `traverseGraph`, `getRelations`, `getPublicMemoriesForSync`,
  `searchConversations`, `getRecentTurns` — every method on `PgStore` — has **no
  caller** outside `pg-store.ts` and doc-comments (verified by grep). The MCP
  `memory.query`/`recall`/`stats` tools run on file/RAM/index tiers; the
  `search_conversations` tool is backed by the file-JSON `ConversationStore`, not
  pg. pgvector, tsvector FTS, and graph traversal are all defined-but-unreachable.
- **Recommendation:** Wire LOD 400 into `MemoryService` behind a feature flag
  (reuse the existing `GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED` gate plus a
  `pgConnectionString`/`RH_POSTGRES_URL` presence check, mirroring how LOD 350
  Chroma is gated on `config.chromaPath` at service.ts:158). Uncomment the tier,
  construct `new PgStore(...)`, `await store.init()`, and register it. Add an
  integration test gated on `PG_TEST=1` (the scribe pattern) so the tier is
  exercised.
- **Verify:** After wiring, `grep -rn "new PgStore" src` is non-empty; run the
  `PG_TEST=1` suite against the local `tibsfox` DB; `memory.query` returns rows
  whose `tier` is `400`.

### PG-2 — PgStore ignores the canonical RH_POSTGRES_URL/.env credential path; `connectionString` is a dead field
- **Severity:** medium · **Category:** bug · **Effort:** S
- **Location:** `src/memory/pg-store.ts:248` (`Required<Omit<PgStoreConfig, 'connectionString'>>`),
  `:252-262` (constructor), `:281-288` (`new pg.default.Pool` from host/user/pass).
- **Problem:** `PgStoreConfig.connectionString` is documented as
  "Default: postgresql://localhost:5432/tibsfox" (pg-store.ts:42) but the
  effective config type **Omits** it, and `init()` builds the Pool from
  `host/port/database/user/password` only — the connection string is never
  passed. Credentials default to `user: process.env.PGUSER ?? 'foxy'`,
  `password: process.env.PGPASSWORD ?? ''` (pg-store.ts:258-259). It does **not**
  read `RH_POSTGRES_URL`, does not use the repo `.env`, and does not use the
  scribe `loadPgEnv()` loader. This diverges from the established in-repo pattern:
  `src/intelligence/atlas-pg/mirror.ts:40-49` reads `RH_POSTGRES_URL` →
  `{ connectionString }`, and `src/scribe/pg-runtime/env-loader.ts` is the
  canonical loader. Per MEMORY the authoritative creds live in
  `<repo-root>/.env` as `RH_POSTGRES_URL`. As written, if PG-1 wired this store
  as-is, it would try `foxy@localhost/tibsfox` with an empty password and miss
  the real `maple:...` URL.
- **Recommendation:** Have `PgStore` resolve credentials via
  `scribe/pg-runtime/env-loader.loadPgEnv()` (or accept a `connectionString` and
  actually pass it to `new Pool({ connectionString })`). Delete or honor the
  `connectionString` field — do not advertise a default that is never used.
- **Verify:** Unit test: construct `PgStore` with no config in an env where only
  `RH_POSTGRES_URL` is set; assert the Pool connects to that URL, not to
  `foxy@localhost`.

### PG-3 — No real migration versioning; schema is inline TS re-run every init, errors swallowed
- **Severity:** medium · **Category:** tech-debt · **Effort:** M
- **Location:** `src/memory/pg-store.ts:111-230` (`MIGRATIONS` array),
  `:222-229` (schema_version), `:294-305` (apply loop).
- **Problem:** The memory schema is an inline array of DDL strings applied on
  every `init()`, relying entirely on `IF NOT EXISTS`. A `schema_version` table
  is created and `INSERT ... VALUES (1) ON CONFLICT DO NOTHING` — but the version
  is **never read** to decide what to apply, so it is decorative. Adding a
  migration #2 that alters an existing column has no ordering guard and no
  applied-version check. The apply loop swallows every non-"already exists" error
  into `console.error` (pg-store.ts:300-302), and `init()`'s outer catch
  downgrades any failure to `console.error('PostgreSQL not available')` and
  leaves `initialized=false` (pg-store.ts:308-311) → `ensureReady()` returns
  false → **every store method silently no-ops** (e.g. `store()` drops the record
  and returns `void`). If the `vector` extension can't be created (needs
  privilege) the whole store silently degrades with data loss. There is also no
  repo `migrations/` dir for this schema — `migrations/` contains only
  `release-history/`, while `atlas-pg/schema.sql` and
  `atlas/spatial/migrations/*.sql` use real `.sql` files.
- **Recommendation:** Either (a) move the memory DDL to `migrations/memory/*.sql`
  with a real "select max(version)"-driven applier, or (b) reuse scribe
  `pg-runtime`. At minimum, read `schema_version` before applying and surface a
  hard error (not silent no-op) when `CREATE EXTENSION vector` or a table create
  fails, so a misconfigured DB fails loudly instead of dropping writes.
- **Verify:** Point at a DB without the `vector` extension and without superuser;
  confirm `init()` throws/warns visibly and `store()` does not silently succeed.

### PG-4 — IVFFlat index built on an empty table with default probes → poor/degenerate ANN recall
- **Severity:** medium · **Category:** best-practice · **Effort:** M
- **Location:** `src/memory/pg-store.ts:166-172` (IVFFlat `lists=100`),
  `:479-510` (`searchByEmbedding`, no `probes` set).
- **Problem:** The vector index is `USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)`, created inside the migration that runs at `init()` — i.e.
  **before any rows exist.** IVFFlat trains its centroids from existing data;
  building it on an empty table yields a poorly-clustered index. `searchByEmbedding`
  never sets `SET ivfflat.probes` (default 1), so with `lists=100` the search
  scans ~1% of lists → low recall. Same IVFFlat-on-empty issue exists in
  `atlas-pg/schema.sql:67`.
- **Recommendation:** Prefer **HNSW** (`USING hnsw (embedding vector_cosine_ops)`)
  — pgvector ≥0.5 supports it, it needs no training data, and gives better
  recall/latency for this scale; the installed `pg` 8.20 client is agnostic. If
  keeping IVFFlat, build the index lazily after a seed threshold and set
  `ivfflat.probes` (e.g. 10) per query/session. Size `lists` to ~rows/1000.
- **Verify:** With N≈10k seeded vectors, compare recall@10 of HNSW vs current
  IVFFlat against a brute-force `ORDER BY embedding <=> q` baseline.

### PG-5 — Conversation semantic search defined in schema but never wired; ConversationStore is file-JSON, not the pg/FTS the docstring claims
- **Severity:** low · **Category:** gap · **Effort:** M
- **Location:** `src/memory/pg-store.ts:203-213` (`conversation_turns.embedding
  vector(384)` + `idx_turns_fulltext`), `:641-669` (`storeTurn` — inserts no
  embedding); `src/memory/conversation-store.ts:8-9,229,473` (JSON files).
- **Problem:** The pg `conversation_turns` table has an `embedding vector(384)`
  column and a GIN full-text index, but `storeTurn` writes only
  `(id, session_id, role, content, timestamp, tool_calls, files_accessed, tags)`
  — never the embedding — so conversation semantic search is impossible even if
  pg were wired. Meanwhile the MCP `memory.search_conversations` tool
  (memory-tools.ts:334-380) is backed by `ConversationStore`, whose header
  advertises "local SQLite/PostgreSQL … FTS5" (conversation-store.ts:8-18) but
  whose implementation is `writeFile`/`JSON.stringify` over `.local/` files
  (conversation-store.ts:229,473) doing JS-side search. Two overlapping,
  divergent conversation stores; the postgres one is dead, the file one
  misdocuments its backend.
- **Recommendation:** Pick one. If pg is wired (PG-1), route conversation
  storage/search through `PgStore` (populate `embedding`, use `idx_turns_fulltext`
  + pgvector) and retire or clearly demote the file store to a fallback. Fix the
  `ConversationStore` docstring to state its actual JSON backend.
- **Verify:** `memory.search_conversations` returns semantically-matched turns
  (not just keyword) and the backend is the same store that ingested them.

### PG-6 — Pool created with no bounds or timeouts (no max/idle/connect/statement_timeout/application_name)
- **Severity:** low · **Category:** best-practice · **Effort:** S
- **Location:** `src/memory/pg-store.ts:282-288`.
- **Problem:** `new pg.default.Pool({ host, port, database, user, password })`
  sets no `max` (defaults to 10), `idleTimeoutMillis`, `connectionTimeoutMillis`,
  `statement_timeout`, or `application_name`. A hung query blocks a connection
  indefinitely and the DB can't attribute connections to this client. Contrast
  scribe `createPool` (`db.ts:78-82`) which sets `max`/`idleTimeoutMillis`.
- **Recommendation:** Add pool bounds + `statement_timeout` + `application_name:
  'gsd-skill-creator/pg-store'`. Reuse scribe `createPool`.
- **Verify:** `SELECT application_name, state FROM pg_stat_activity` shows a
  labelled, bounded pool; a deliberately slow query aborts at the timeout.

### PG-7 — No dedicated PgStore test; behavior is unverified
- **Severity:** low · **Category:** tech-debt · **Effort:** M
- **Location:** `src/memory/__tests__/` (no `pg-store.test.ts`; only a string
  literal mention in `m2-reflection.test.ts:33`).
- **Problem:** A 27 KB store implementing the `MemoryStore` interface plus
  pgvector/FTS/graph/conversation methods has zero automated coverage. Because it
  is also unwired (PG-1), nothing would catch a regression, a schema drift, or the
  credential bug (PG-2).
- **Recommendation:** Add a `PG_TEST=1`-gated integration suite (scribe pattern in
  `src/scribe/pg-runtime/__tests__/endpoint-shapes.test.ts`) covering
  store→get→query→searchByEmbedding→relate→traverseGraph and the
  visibility-filter HARD RULE (`getPublicMemoriesForSync` excludes non-public;
  conversations never leak).
- **Verify:** `PG_TEST=1 npx vitest run src/memory/__tests__/pg-store` passes
  against the local `tibsfox` DB.

## New-function / capability opportunities

Postgres is presently used at ~0% of its capability by the memory/RAG system.
Concrete upgrades, roughly in ROI order:

1. **Turn on LOD 400 (PG-1).** Single biggest unlock — the store, schema, and
   query methods already exist. Gate on the existing embeddings flag + a
   `RH_POSTGRES_URL` presence check, mirroring the Chroma tier. This makes
   pgvector ANN, tsvector FTS, temporal validity, and graph traversal actually
   back `memory.query`/`recall`/`stats`.
2. **In-DB hybrid retrieval (RRF).** Today the pg tier does FTS *or* vector in
   separate methods, and the live path re-ranks in JS. Add one SQL that fuses
   pgvector ANN and `plainto_tsquery` FTS via Reciprocal Rank Fusion — a single
   round-trip hybrid retriever, stronger than either alone and cheaper than the
   JS `hybridRerank` pass for the pg tier.
3. **HNSW indexes (PG-4)** for `memories.embedding` and `conversation_turns.embedding`.
4. **pgvector-backed conversation recall (PG-5):** populate `conversation_turns.embedding`
   and expose semantic session-history search — the schema is already there.
5. **Unify the credential path (PG-2):** one loader (`scribe loadPgEnv`) and one
   pool factory (`scribe createPool`) for `PgStore`, `atlas-pg`, and scribe, so
   `RH_POSTGRES_URL`/.env is the single source of truth. Removes the divergent
   ad-hoc `foxy@localhost` path.
6. **Real migrations (PG-3):** `migrations/memory/*.sql` + version-checked applier
   (or fold into scribe pg-runtime), replacing the inline re-run-every-init array.
7. **Exploit relational power pgvector alone can't:** the graph tables
   (`memory_relations` + recursive CTE `traverseGraph`) plus temporal
   validity (`valid_from`/`valid_to`) already enable
   supersession-aware, point-in-time retrieval — surface these through the MCP
   tools (`memory.relate` exists but the pg-backed traversal is unreachable).
   This is a differentiator over a plain vector DB.

## Notes

- **This is intentional-Phase-2 debt, not accidental rot.** The comments label
  LOD 400 as "future"/"Phase 2", so PG-1 is a capability gap to schedule, not a
  broken promise. The value of flagging it here is that the store is far more
  finished than "future" implies — it's ~90% ready, held back mainly by wiring
  and the credential bug.
- **Good news / precedent in-repo:** `src/scribe/pg-runtime/` (env-loader + pool
  factory, `PgRuntimeError`, `PG_TEST=1` gated tests) and
  `src/intelligence/atlas-pg/mirror.ts` (RH_POSTGRES_URL → cached pool, IVFFlat
  pgvector) are competent postgres surfaces. The memory store should adopt their
  patterns rather than invent a third.
- **Scope discipline:** `pg` (8.20.0) and `pgvector` DDL are already dependencies
  / present; `chromadb` and `better-sqlite3` are also present. This is not a
  missing-dependency problem — it's an unwired-capability problem.
- Did not deep-review the research/math surface per instructions; no postgres
  usage found there relevant to this dimension.
