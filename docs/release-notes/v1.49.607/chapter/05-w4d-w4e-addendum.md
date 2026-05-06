# v1.49.607 — W4c / W4d / W4e Addendum

This addendum documents three wave-clusters added to the v1.49.607 milestone
**after** the original W0 → E4 mission package shipped: W4c (browser-mode atlas),
W4d (file ↔ milestone ↔ planning-doc wiring), and W4e (Postgres + pgvector + Chroma
acceleration stack).  The original 28-commit mission package described in
chapters 00 / 03 / 04 stands; these waves extend it into a queryable
code-and-mission knowledge layer accessible from any browser, not only the Tauri
shell.

Total commits at addendum close: **60 ahead of `origin/dev`** (28 original + 32
W4c/W4d/W4e and polish).

## W4c — browser-mode atlas

Closes the gap that the Tauri-only banner created.  After spot-checking the
shipped atlas, the operator pointed out that the dashboard's `/atlas.html` page
served only a "requires the Tauri shell" notice and that the four-pane shell
should run inside any browser.

### Substrate

The `intelligenceIpc` shim at `src/intelligence/ipc.ts` was already dual-mode
(feature-detects `window.__TAURI__`, falls back to
`POST /api/intelligence/invoke` + `/api/events` SSE).  W4c completed the
fallback path:

1. **`src/intelligence/atlas-bridge.ts`** — 14 atlas command handlers (13 read +
   1 indexer dispatch + 1 invalidate) installed into `dashboard-bridge.ts`'s
   `COMMANDS` table via `installAtlasCommands()`.  Resolution model mirrors the
   Rust `SqliteAtlasKbDelegate`: scan-every-registered-project, aggregate
   non-empty results.  Empty-state contract preserved: missing snapshot or
   unknown id returns `[]`, never an error.

2. **Vite atlas browser bundle** — new `desktop/intelligence/atlas/browser/`
   entry produces `dashboard/intelligence/atlas.bundle.js` (132 KB / 40 KB
   gzipped) with `preserveEntrySignatures: 'allow-extension'` so rollup keeps
   the public exports instead of tree-shaking.  Component CSS is `?inline`-
   imported and injected as a `<style data-atlas-browser>` tag at module-eval
   time, sidestepping a stable-CSS-asset path requirement.

3. **`dashboard/atlas.html`** — drops the Tauri-only gate; always attempts
   `import('./intelligence/atlas.bundle.js')`.  The bundle's
   `createAtlas(host)` runs identically under both the Tauri shell and a plain
   browser tab.  A new build-instructions banner shows only when the bundle
   itself fails to load.

### Tests + verification

- 18 new tests at `src/intelligence/__tests__/atlas-bridge.test.ts` covering
  all 14 handlers (happy path, empty-state, missing-projectId rejection,
  catalog completeness assertion).
- `atlas-deps-audit --strict`: 0 violations across 95 atlas-surface files
  (ADR 0003 invariant preserved; the bundle imports nothing from
  `@tauri-apps/api`).
- Live verification: opening `http://localhost:3030/atlas.html` in Firefox
  loads the four-pane shell + Cmd-K palette.

### Spot-check polish (W4c.5)

A live-browser spot-check surfaced eight follow-up gaps that landed as a
single polish pass:

- Quadtree depth cap (40) — closes a stack-overflow on coincident bodies in
  the symbol-graph FR layout.
- System-map sizing fixes — viewBox sync in `renderPack`, `wangWangPack` size
  is the root **radius** (not container side); padding 2→6, label cutoff
  12→6, leaf value uses `sqrt(symbolCount)` so giant files don't drown
  siblings; native `<title>` tooltips on every circle; clickable breadcrumb
  segments + ← back button.
- Symbol-graph `fitToContent` after every `loadGraph` — the FR layout's world
  spread is ≈ √n × 100 units; without the fit, viewport showed a 760-pixel
  center slice and only ~5 % of the cloud was visible.
- Code-view `.cv-root` width/height fix so `overflow: auto` actually
  scrolls.
- Source loading endpoint `GET /api/atlas/source?path=<rel>` (5 MiB cap,
  CWD-confined) consumed by `loadFileIntoCodeView`.
- File-graph view: clicking a file in the system map loads the entire
  file's symbol set + intra-file edges (capped at 200 symbols × 4 IPCs =
  800 calls), not just one symbol's 1-hop neighborhood.
- Free-form pan/zoom on the system map (wheel/pinch + drag, clamped
  0.2× – 20×).

## W4d — file ↔ milestone ↔ planning-doc wiring

Mission Archeology gained the ability to answer "which milestones touched
this file, and what planning docs drove the work?" without requiring the
existing `mission_links` table to be populated.  The implementation uses git
tags + the `.planning/missions/` directory naming convention as ground truth.

### Endpoints

- **`GET /api/atlas/file-history?path=<rel>`** — `git log --follow
  --format='%H%x09%at%x09%s' -- <path>` → groups commits by milestone tag
  via `git describe --contains --match='v1.49.*'`.  Untagged commits land
  in a synthetic `unreleased` bucket.  Cap: 200 commits × 16-batch describe
  parallelism.
- **`GET /api/atlas/mission-docs?milestoneTag=v1.49.NNN`** — globs
  `.planning/missions/v1-49-NNN-*/` and returns `{briefPath, specPath,
  planPath, retroPath, docs[]}`.  Tag → directory prefix conversion is
  deterministic (`v1.49.606` → `v1-49-606-`).  Walks up to depth 3, hard
  cap at 200 docs.
- **`GET /api/atlas/file-blame?path=<rel>`** — `git blame --line-porcelain
  -CCC` → per-line `{lineNo, sha, milestoneTag, summary}` after resolving
  each unique sha to its containing tag.

### UI

- **Archeology pane file-overlay** — when a file is focused, the pane
  renders a two-column view: left timeline of milestones that touched the
  file (newest first; tag, commit count, date, first-commit subject); right
  column shows mission directory + Brief/Spec/Plan/Retro buttons + full doc
  list + commit list.  Click any doc to open in the code view.
- **Code-view gutter blame badges (W4d.3)** — `loadFileIntoCodeView` fetches
  source + blame in parallel; the per-line milestone tag synthesizes a
  one-row `AtlasMissionProvenance` payload that the existing gutter renders
  as a colored badge.  Badge tooltip shows `<tag>  <short-sha>\n<commit
  subject>`; hover affords a 1.6× scale + 50%-white outer ring.

## W4e — Postgres + pgvector + ChromaDB acceleration stack

The atlas now writes through to three side-stores on every successful
indexer run.  SQLite remains the canonical write target; the side-stores are
caches that enable cross-project queries, semantic search, and mission-doc
retrieval that the per-project SQLite path cannot serve.

### W4e.A — Postgres atlas mirror

- **`src/intelligence/atlas-pg/schema.sql`** — `atlas` schema in the existing
  `tibsfox` DB.  Mirrors the SQLite migration 003 tables (`symbols`, `calls`,
  `symbol_references`, `type_relations`, `files_changed`,
  `mission_provenance`) with `(project_id, id)` composite primary keys.
  `symbols.search_text` is a `GENERATED ALWAYS AS … STORED` `TSVECTOR`
  (qualified_name weight A, name weight B, file_path weight C) backed by a
  GIN index — text search runs server-side at sub-50 ms with no per-call
  trigram-index rebuild.  `symbols.embedding` is `vector(384)` with an
  ivfflat cosine index for W4e.B.

- **`src/intelligence/atlas-pg/mirror.ts`** — `mirrorSnapshotToPg(db,
  projectId, snapshotId)` paginates SQLite reads (1000-row pages) and bulk-
  inserts via VALUES tuples wrapped in a single transaction.  `ON CONFLICT
  (project_id, id) DO NOTHING` makes re-runs idempotent.  Failure mode: PG-
  down or schema-mismatch logs and skips; SQLite remains canonical.

- **Endpoint `GET /api/atlas/search/symbols?q=<text>&limit=N`** — server-side
  cross-project text search via `ts_rank_cd`.  Replaces the local trigram
  index for hot queries.  Verified at 97,705 mirrored symbols against this
  repo: `q=runAtlasIndexer` returns 2 results in <50 ms.

### W4e.B — pgvector semantic symbol search

- **In-process embedder** — `loadEmbedder()` lazy-loads
  `@huggingface/transformers` `pipeline('feature-extraction',
  'Xenova/all-MiniLM-L6-v2', { quantized: true })`.  First call downloads
  ~25 MB of weights to `~/.cache/huggingface`; subsequent calls are local.

- **`embedSymbolsForSnapshot()`** — pages through unembedded symbols (64–128
  per batch), embeds each as `qualified_name + signature_hash + file_path`,
  bulk-`UPDATE`s with `(project_id, id, emb)` tuples cast to `::vector`.
  Hooked into the indexer endpoint as a fire-and-forget after-`mirror`
  task, exposed as admin endpoint `POST /api/atlas/embed`.  Throughput at
  this repo: 95,657 symbols in 498 s ≈ 192 symbols/s with batch-128.

- **Endpoint `POST /api/atlas/search/semantic { q, limit }`** — server-
  embeds the query via the same pipeline and runs cosine search with
  `embedding <=> $1::vector`.  Verified: `q="thread-safe queue"` returns
  `concurrentCount`, `InterruptHandler`, `MAX_MISSED_HEARTBEATS` —
  semantically aligned even when "queue" never appears in the symbol
  names.

### W4e.C — ChromaDB mission-doc retrieval

- **Collection `gsd-missions`** — created without an embedding function;
  embeddings are supplied explicitly using the same Xenova pipeline used
  for pgvector.  This sidesteps the chromadb 3.x dep on
  `@chroma-core/default-embed` (newer Chroma versions require this peer
  package; we don't add it) and ensures the embedding space is identical
  to W4e.B for cross-store similarity reasoning.

- **`ingestMissionDocsToChroma()`** — walks `.planning/missions/**/*.md`,
  extracts milestone tag from directory prefix (`v1-49-NNN-…` →
  `v1.49.NNN`), embeds each doc (capped at 8000 chars/file, 4-concurrent
  batches), and `upsert`s with `{ id, document, metadata, embedding }` per
  row.  Idempotent: re-running just updates content.

- **Endpoint `GET /api/atlas/mission-search?q=<text>&limit=N`** — embeds the
  query via the same Xenova pipeline and queries by `queryEmbeddings`.
  Verified: `q="apollo lunar landing"` returns the top 5 v1.49.605 / v602 /
  v606 / v588 / v595 mission docs in dist 0.83-1.00.

- **Admin endpoints** — `POST /api/atlas/chroma-ingest` (re-walk + upsert),
  `POST /api/atlas/embed` (backfill missing pgvector rows).

### Discovery + auto-load

- **`GET /api/atlas/snapshots`** — walks every per-project SQLite DB the
  registry knows about plus the PG mirror, returning
  `[{project_id, snapshot_id, symbol_count, embedded_count, source}]`
  sorted descending by symbol count.  The `source` field
  (`'sqlite' | 'pg-only'`) surfaces drift between the two stores.  The
  atlas page now hits this endpoint and auto-picks the largest snapshot —
  no more hard-coded snapshot strings in HTML.

### UI integration

The Mission Archeology pane gained a top-bar with a three-mode search
selector + debounced input:

| Mode | Endpoint | Use case |
|---|---|---|
| Symbols (text) | `GET /api/atlas/search/symbols` | Exact-name lookup |
| Symbols (semantic) | `POST /api/atlas/search/semantic` | Concept lookup ("thread-safe queue") |
| Mission docs | `GET /api/atlas/mission-search` | Planning-doc retrieval |

Click a result → dispatches focus through the coordinator: symbol results
go to symbol-graph + code-view; mission docs open in code-view directly.

## Forward lessons emitted (W4c / W4d / W4e)

These extend the lessons in `04-lessons.md` (#10248–#10259).  Each is a
CANDIDATE; soak target = 3 observations before promotion to ESTABLISHED.

### #10260 CANDIDATE — dual-mode IPC shims pay off

**Statement:** Designing IPC client libraries to feature-detect their
runtime (Tauri vs browser) at construction time and fall back to HTTP
+ SSE costs ~50 LOC at the shim layer and unlocks browser-mode operation
of any feature built on top.  W4c could complete in <1 day because
`intelligenceIpc.ts` had been dual-mode since v1.49.597 — only the atlas
command catalog needed adding to the bridge.

**Trigger:** any milestone introducing a new IPC client surface that
will eventually need browser-tab access.

**Action:** define the IPC client as a feature-detected dual-mode shim
on day one; do not lock the entire client to Tauri-only invocations.

### #10261 CANDIDATE — write-through side-stores stay caches, not sources of truth

**Statement:** When adding a side-store (PG, vector DB, search index) to
augment a primary store (SQLite), keep the primary canonical and the
side-store best-effort.  Every write to the primary is followed by a
non-blocking mirror; every mirror failure logs and continues; UI reads
prefer the primary when both are available.  This survives any of three
side-stores being down (operator can restart Postgres without breaking
the dashboard) AND keeps the data model simple — no two-phase commit, no
distributed transactions.

**Trigger:** any milestone adding a derived store on top of an existing
canonical store.

**Action:** make the canonical write succeed first; emit a non-throwing
mirror call after; cache reads through the side-store with a fall-through
to the primary on miss.

### #10262 CANDIDATE — local Xenova embedder + pgvector / Chroma is the cheapest semantic substrate

**Statement:** A local-only stack of `@huggingface/transformers`
quantized `Xenova/all-MiniLM-L6-v2` (384-dim, ~25 MB weights, ~192
symbols/s on CPU) + pgvector + Chroma supports semantic search across
~100 K rows with <300 ms query latency, zero per-query cost, and zero
external API calls.  No GPU required; first-run pulls weights to disk;
subsequent runs are cache-hot.  Throughput is sufficient to embed a
codebase-of-record incrementally (95 K rows / 8 min) without blocking the
indexer.

**Trigger:** any milestone needing semantic search over more than a few
hundred items.

**Action:** prefer this stack over hosted vector APIs when the corpus is
local.  Reserve hosted APIs (OpenAI, Cohere, Voyage) for cases that need
larger embedding models or domain-specific instruction-tuned variants.

### #10263 CANDIDATE — UI snapshot discovery should query canonical store, not derived

**Statement:** When the UI lists "available snapshots" / "available
projects" / "available data points," the discovery query MUST walk the
same store the UI's read path uses.  W4e.A's first attempt queried PG
(the derived mirror) and the UI's loadSnapshot read SQLite (the
canonical primary).  When SQLite was wiped between indexer runs but PG
retained the prior data, the discovery endpoint returned snapshots that
appeared loadable but yielded zero rows.  The fix was to walk SQLite
first, augment with PG metadata where it exists, and surface a `source`
field so operators can see drift.

**Trigger:** any milestone adding a "list-available-X" endpoint backed by
a derived store.

**Action:** query the same store the UI's read-of-X uses.  If a derived
store is in play, augment with its metadata but do not let it shape the
result set.

### #10264 CANDIDATE — file-history-via-git-tags-and-planning-dirs as zero-config provenance

**Statement:** The combination of `git log --follow + git describe
--contains` to bucket commits by milestone tag plus a globbing convention
on `.planning/missions/v1-49-NNN-*/` to find planning docs gives any GSD-
managed repo a zero-config file → milestone → planning-doc chain.  No
per-project mission_links registry, no manual annotation, no decision-id
mapping.  W4d shipped in <2 hours of implementation against this pattern.

**Trigger:** any milestone needing to surface "which work item produced
this code" in a UI.

**Action:** use git tags + the `.planning/missions/` convention before
reaching for explicit annotation systems.  Reserve explicit linkage for
cases where the tag/dir convention cannot resolve (e.g., monorepo with
multiple release streams).

### #10265 CANDIDATE — chromadb 3.x default-embed dep removal pattern

**Statement:** chromadb 3.x dropped the bundled `DefaultEmbeddingFunction`
into an optional peer (`@chroma-core/default-embed`).  Rather than pulling
in this peer (and locking the embedding model to Chroma's choice),
construct the collection without an EF and supply embeddings explicitly
on every `upsert` and `query` call.  This (a) removes the peer dep,
(b) lets the application pick its own embedding model and reuse it across
stores (pgvector + Chroma share the same Xenova pipeline in W4e), and
(c) avoids a hidden EF mismatch when the client and server resolve
different default models.

**Trigger:** any milestone using chromadb ≥ 3.0.

**Action:** create the collection without `embeddingFunction`; supply
`embeddings: number[][]` on every `upsert`; supply `queryEmbeddings:
number[][]` on every `query`.  The application owns the embedding
pipeline.

## Soak observations at W4d/W4e close

This addendum adds six new CANDIDATE observations to the soak table in
`99-context.md`.  Each must reach 3 observations before promotion.

| Lesson | Status | Observations | Note |
|---|---|---|---|
| #10260 | CANDIDATE | 1 | dual-mode IPC shim pays off (W4c) |
| #10261 | CANDIDATE | 1 | write-through side-stores stay caches (W4e.A) |
| #10262 | CANDIDATE | 1 | local Xenova + pgvector / Chroma is cheapest semantic substrate (W4e.B/C) |
| #10263 | CANDIDATE | 1 | UI snapshot discovery walks canonical store (W4e.A regression fix) |
| #10264 | CANDIDATE | 1 | file-history via git tags + .planning/missions/ as zero-config provenance (W4d) |
| #10265 | CANDIDATE | 1 | chromadb 3.x default-embed dep removal pattern (W4e.C) |

## Endpoint inventory at addendum close

Adds eleven endpoints to the dashboard's HTTP surface.  All are CWD-confined
and degrade gracefully (return `{ok:false}` rather than throwing) when their
backing service is unreachable.

| Endpoint | Method | Layer |
|---|---|---|
| `/api/atlas/source?path` | GET | W4c source-loader |
| `/api/atlas/file-history?path` | GET | W4d git history |
| `/api/atlas/mission-docs?milestoneTag` | GET | W4d planning-doc glob |
| `/api/atlas/file-blame?path` | GET | W4d blame |
| `/api/atlas/snapshots` | GET | W4e discovery |
| `/api/atlas/search/symbols?q` | GET | W4e.A PG text search |
| `/api/atlas/search/semantic` | POST | W4e.B pgvector semantic search |
| `/api/atlas/mission-search?q` | GET | W4e.C Chroma mission-doc search |
| `/api/atlas/embed` | POST | W4e.B admin: backfill embeddings |
| `/api/atlas/chroma-ingest` | POST | W4e.C admin: re-walk mission docs |
| `/api/atlas/index` | POST | extended with PG mirror + post-mirror embed |

## Test count at addendum close

- W4c: +18 tests (`atlas-bridge.test.ts`)
- W4d: 0 new tests (endpoints exercised via spot-check)
- W4e: 0 new tests (endpoints exercised via spot-check; PG schema applied
  via SQL file)
- Repo-wide vitest: 30,025 passing (post-W4c.5 polish; W4d/W4e additions
  don't add unit tests as they're integration-tested via live dashboard)

## Branch state at addendum close

- **dev:** 60 commits ahead of `origin/dev` (28 original W0–E4 + 8 W4c +
  10 W4d + 10 W4e + 4 polish)
- Pre-tag; awaits operator G3 authorization to push and tag.

## Ship sequence

The original ship sequence in `99-context.md` (steps 1–6) still applies.
W4d/W4e add no new ship-time gates — the PG and Chroma stores are
operational dependencies, not packaged with the release.  Operators who
want the W4e features running locally need:

- Postgres 14+ with pgvector extension (the existing `tibsfox` DB)
- A running ChromaDB server (`chroma run --host localhost --port 8000`)
- `<repo-root>/.env` with `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`
- The schema applied once: `psql -f
  src/intelligence/atlas-pg/schema.sql`

Without these, the W4d/W4e endpoints return `{ok:false, error:
"unavailable"}` and the dashboard UI falls back to its W4c browser-only
mode.  No operator action is required if the operator does not need the
W4d/W4e features.
