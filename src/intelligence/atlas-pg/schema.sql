-- W4e.A — Postgres atlas mirror schema (v1.49.607)
--
-- Mirrors the per-project SQLite atlas tables (migration 003) into a single
-- centralized `atlas` schema in the tibsfox database. SQLite remains the
-- canonical write target; this schema is a write-through cache that enables
-- cross-project queries, semantic search (W4e.B adds vector columns), and
-- server-side text search (Cmd-K trigram replacement).
--
-- Idempotency: every CREATE uses IF NOT EXISTS. Re-running this script is
-- safe; bumping the schema is done by adding new statements at the end of
-- this file (no in-place ALTER unless additive).
--
-- Conventions:
--   * project_id is part of every table's primary key so multi-project mirrors
--     don't collide on synthetic ids.
--   * snapshot_id + project_id is the canonical multi-project foreign key
--     (matches the SQLite pattern).
--   * tsvector columns are auto-maintained via GENERATED ALWAYS AS … STORED
--     so Cmd-K text search runs server-side without app-layer rebuilds.

CREATE SCHEMA IF NOT EXISTS atlas;
SET search_path TO atlas, public;

-- pgvector — installed at the cluster level; verified via
-- `SELECT extname FROM pg_extension WHERE extname='vector'`.
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Symbols ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.symbols (
  project_id        TEXT NOT NULL,
  id                TEXT NOT NULL,
  snapshot_id       TEXT NOT NULL,
  file_path         TEXT NOT NULL,
  kind              TEXT NOT NULL,
  name              TEXT NOT NULL,
  qualified_name    TEXT NOT NULL,
  start_byte        INTEGER NOT NULL,
  end_byte          INTEGER NOT NULL,
  start_line        INTEGER NOT NULL,
  end_line          INTEGER NOT NULL,
  signature_hash    TEXT,
  modifiers_json    TEXT NOT NULL DEFAULT '[]',
  language          TEXT NOT NULL,
  parent_symbol_id  TEXT,
  -- W4e.A: text search index covering qualified_name + name + file_path.
  -- Re-tokenized by Postgres on every insert; no app-side trigram rebuild.
  search_text       TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(qualified_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(file_path, '')), 'C')
  ) STORED,
  -- W4e.B: 384-dim vector populated by the embed pipeline.
  -- Nullable so insert can land before embedding finishes; a backfill job
  -- (or the next indexer pass) fills it in.
  embedding         vector(384),
  PRIMARY KEY (project_id, id)
);
CREATE INDEX IF NOT EXISTS idx_atlas_symbols_snapshot ON atlas.symbols (project_id, snapshot_id);
CREATE INDEX IF NOT EXISTS idx_atlas_symbols_file ON atlas.symbols (project_id, snapshot_id, file_path);
CREATE INDEX IF NOT EXISTS idx_atlas_symbols_qn ON atlas.symbols (project_id, snapshot_id, qualified_name);
CREATE INDEX IF NOT EXISTS idx_atlas_symbols_search ON atlas.symbols USING GIN (search_text);
-- IVFFlat for approximate nearest neighbor over `embedding`. lists=100 is a
-- reasonable starting point for ≤ 1M rows; tune via `ANALYZE` + `lists =
-- sqrt(rowcount)`. Built lazily — first query after enough rows triggers
-- index build.
CREATE INDEX IF NOT EXISTS idx_atlas_symbols_embedding
  ON atlas.symbols USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── Calls ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.calls (
  project_id          TEXT NOT NULL,
  id                  TEXT NOT NULL,
  snapshot_id         TEXT NOT NULL,
  caller_symbol_id    TEXT NOT NULL,
  callee_symbol_id    TEXT NOT NULL,
  call_site_byte      INTEGER NOT NULL,
  call_site_line      INTEGER NOT NULL,
  confidence          REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (project_id, id)
);
CREATE INDEX IF NOT EXISTS idx_atlas_calls_caller ON atlas.calls (project_id, caller_symbol_id);
CREATE INDEX IF NOT EXISTS idx_atlas_calls_callee ON atlas.calls (project_id, callee_symbol_id);
CREATE INDEX IF NOT EXISTS idx_atlas_calls_snapshot ON atlas.calls (project_id, snapshot_id);

-- ── Symbol references ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.symbol_references (
  project_id              TEXT NOT NULL,
  id                      TEXT NOT NULL,
  snapshot_id             TEXT NOT NULL,
  file_path               TEXT NOT NULL,
  start_byte              INTEGER NOT NULL,
  end_byte                INTEGER NOT NULL,
  start_line              INTEGER NOT NULL,
  end_line                INTEGER NOT NULL,
  name                    TEXT NOT NULL,
  resolved_symbol_id      TEXT,
  resolution_confidence   REAL NOT NULL DEFAULT 0.0,
  resolution_kind         TEXT NOT NULL,
  PRIMARY KEY (project_id, id)
);
CREATE INDEX IF NOT EXISTS idx_atlas_refs_resolved ON atlas.symbol_references (project_id, resolved_symbol_id) WHERE resolved_symbol_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_atlas_refs_file ON atlas.symbol_references (project_id, snapshot_id, file_path);

-- ── Type relations ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.type_relations (
  project_id        TEXT NOT NULL,
  id                TEXT NOT NULL,
  snapshot_id       TEXT NOT NULL,
  from_symbol_id    TEXT NOT NULL,
  to_symbol_id      TEXT NOT NULL,
  kind              TEXT NOT NULL,
  confidence        REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (project_id, id)
);
CREATE INDEX IF NOT EXISTS idx_atlas_relations_from ON atlas.type_relations (project_id, from_symbol_id);
CREATE INDEX IF NOT EXISTS idx_atlas_relations_to ON atlas.type_relations (project_id, to_symbol_id);

-- ── Files changed (provenance) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.files_changed (
  project_id      TEXT NOT NULL,
  id              TEXT NOT NULL,
  mission_id      TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  change_kind     TEXT NOT NULL,
  rename_from     TEXT,
  added_lines     INTEGER NOT NULL DEFAULT 0,
  removed_lines   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, id)
);
CREATE INDEX IF NOT EXISTS idx_atlas_files_changed_mission ON atlas.files_changed (project_id, mission_id);

-- ── Mission provenance ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.mission_provenance (
  project_id      TEXT NOT NULL,
  id              TEXT NOT NULL,
  snapshot_id     TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  line_no         INTEGER NOT NULL,
  mission_id      TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  weight          REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (project_id, id)
);
CREATE INDEX IF NOT EXISTS idx_atlas_provenance_file_line
  ON atlas.mission_provenance (project_id, snapshot_id, file_path, line_no);
CREATE INDEX IF NOT EXISTS idx_atlas_provenance_mission
  ON atlas.mission_provenance (project_id, mission_id);

-- ── Schema-version stamp ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlas.schema_version (
  version    INTEGER PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO atlas.schema_version (version) VALUES (1) ON CONFLICT DO NOTHING;
