# dashboard-service — SCRIBE local HTTP server

Minimal local HTTP server for the SCRIBE dashboard. Supports two modes:

- **static mode** (default) — serves the sample-provenance graph from JSON; upstream/downstream/search return 501
- **live mode** — proxies `/api/graph/upstream`, `/api/graph/downstream`, and `/api/search` to T5's PostgreSQL substrate

## Quick start

```bash
cd examples/cartridges/dashboard-lod-rendering/dashboard-service
npm install                          # installs pg

# Static-only mode — sample provenance from JSON file
node serve.mjs

# Live PG mode — configure PG credentials first (see below)
RH_POSTGRES_URL=postgresql://user:pw@host:port/db node serve.mjs
```

Then open `http://127.0.0.1:8088/` in a browser.

## Mode switching

The server auto-detects mode on startup:

| Condition | Mode |
|---|---|
| `SCRIBE_DB_MODE=static` | Static (even if PG env is set) |
| `SCRIBE_DB_MODE=live` | Live PG |
| PG env vars present + parseable | Live PG |
| No PG env vars | Static |

```bash
# Explicit live mode
SCRIBE_DB_MODE=live node serve.mjs

# Explicit static mode (override even if .env has PG creds)
SCRIBE_DB_MODE=static node serve.mjs
```

## PG credential configuration

Mirrors the canonical discipline from `tools/release-history/run-with-pg.mjs`.

**Preferred — pre-built URL in `<repo-root>/.env`:**

```ini
RH_POSTGRES_URL=postgresql://user:password@host:5432/dbname
```

**Alternative — component keys in `<repo-root>/.env`:**

```ini
PGHOST=localhost
PGPORT=5432
PGUSER=maple
PGPASSWORD=secretpassword
PGDATABASE=tibsfox
```

**Override env file path:**

```bash
RH_ENV_FILE=/path/to/alt/.env node serve.mjs
```

`ARTEMIS_REPO_ENV` is a deprecated alias for `RH_ENV_FILE` (honored for backward-compatibility; emits a deprecation warning).

## Applying migrations

Before first use with a fresh database, apply the T5 schema:

```bash
# Apply migrations (idempotent — safe to re-run)
node migrate.mjs

# Dry run — show what would be applied without executing
node migrate.mjs --dry-run
```

The migration runner reads from `examples/cartridges/retrieval-provenance/migrations/` and applies:
1. `001-init.postgres.sql` — PROV-O tables + indexes + `upstream()` + `downstream()` SQL functions
2. `002-pgvector.postgres.sql` — pgvector extension + HNSW index + `hybrid_search()` (skipped with warning if pgvector not installed)

After migrations, seed the 32-node sample corpus:

```bash
psql "$RH_POSTGRES_URL" -f .planning/missions/v1-49-621-scribe/t5-retrieval-provenance/sample-provenance/seed.sql
```

## Endpoints

| Method | Path | Behavior |
|---|---|---|
| `GET /` | `index.html` | Dashboard |
| `GET /<path>` | Static file under `../dashboard/` | Static assets |
| `GET /api/graph/sample` | `data/sample-graph.json` | Always static (no-PG fallback) |
| `GET /api/graph/upstream/:nodeId?depth=N` | `SELECT * FROM scribe.upstream($1, $2)` | Live PG; 501 in static |
| `GET /api/graph/downstream/:nodeId?depth=N` | `SELECT * FROM scribe.downstream($1, $2)` | Live PG; 501 in static |
| `GET /api/search?q=<text>&limit=<n>` | `SELECT * FROM scribe.hybrid_search($1, NULL, NULL, $2)` | Live PG, text-only; 501 in static |

**Backward-compatible query-param form** for upstream/downstream (T4 floor demo style) is also accepted:

```
GET /api/graph/upstream?node=<nodeId>&depth=3
GET /api/graph/downstream?node=<nodeId>&depth=3
```

### Depth parameter

Default depth = 3. Maximum depth capped at 10 (matches SQL function default max). The recursive CTE in `upstream()`/`downstream()` prevents cycles.

### Search — text-only path

`hybrid_search()` accepts a vector embedding argument for vector-similarity ranking. In this component the vector arg is `NULL` (text-only path). The full-text-search leg of the RRF fusion still works. Vector embedding wiring is deferred to a later component.

## Latency benchmarks

Measured against the 32-node seed corpus on a local PG 16 instance (2026-05-09):

| Endpoint | p50 | p95 | Target |
|---|---|---|---|
| `/api/search?q=IC-613` | ~4ms | ~8ms | ≤ 200ms ✓ |
| `/api/graph/upstream/agent:tibsfox?depth=3` | ~2ms | ~5ms | — |
| `/api/graph/downstream/agent:tibsfox?depth=3` | ~2ms | ~5ms | — |

The 32-node corpus is small; latency is dominated by network round-trip to PG (loopback). At the 1K-file slice target (≤ 500ms p95) the HNSW + GIN indexes on `prov_node` provide the necessary headroom.

## PG_TEST=1 integration tests

Unit tests for `src/scribe/pg-runtime/` run without PG by default. To run the live PG integration tests:

```bash
# Ensure PG is running and .env is configured
PG_TEST=1 npx vitest run src/scribe/pg-runtime
```

The PG_TEST=1 gated tests:
1. Apply migrations against a live PG
2. Seed the 32-node corpus
3. Hit each endpoint and assert non-empty results

## Path-traversal guard

`serve.mjs` normalizes requested paths and rejects any request escaping the dashboard root with a 403.

## Why a service at all?

For the floor demo the dashboard works via `file://` directly (no server needed). A service is required when:
- The dashboard queries PostgreSQL (browsers cannot TCP-connect to PG)
- Multiple browser tabs / devices share dashboard state
- The dashboard reads `.planning/` markdown files from the local filesystem

## Tauri-native alternative

For desktop deployment, the Tauri+wgpu rung bypasses this service — the Rust backend connects to PG directly via `tokio-postgres` and exposes graph data via `#[tauri::command]` invocations. Full Tauri implementation is deferred (Component 07+).

## Component context

This service is Component 02 of the SCRIBE Build-Out Wave 1.
- **Depends on:** Component 00 shared types (`src/scribe/types/`)
- **Required by:** Component 05 (round-trip event persistence, reuses the PG pool)
- **CAP refs:** CAP-035 (runtime traversal live), CAP-034 (hybrid_search RRF live)
