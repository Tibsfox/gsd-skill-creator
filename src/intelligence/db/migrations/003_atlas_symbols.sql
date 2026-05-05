-- Code Atlas — migration v3: symbol index + provenance (v1.49.607).
-- Adds 6 tables for clean-room symbol indexing, cross-file resolution, and
-- mission provenance attribution. Source-of-truth for the atlas surface
-- per .planning/missions/v1-49-607-code-atlas/03-milestone-spec.md.
--
-- Idempotency: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS
-- + INSERT OR IGNORE schema_version. Re-applying to a DB already at v3 is
-- a no-op, matching the v1/v2 convention.
--
-- Additivity (HARD RULE per ADR 0003 / Safety Warden BLOCK condition):
-- This migration ONLY creates new tables and indexes. It does NOT ALTER,
-- DROP, or RENAME any v1 or v2 table or column. The full v1.49.606 query
-- suite must continue to pass against a DB to which this migration has
-- been applied.

-- ─── Symbols ─────────────────────────────────────────────
-- Every named declaration extracted from a parsed source file.
-- Identity: (file_path, kind, name, start_byte) is unique within a snapshot.
-- The `signature_hash` is a stable fingerprint of the symbol's coarse-AST
-- shape (parameter count, return-shape category, modifiers). It is NOT a
-- type checksum — clean-room parsers extract structural shape only.
CREATE TABLE IF NOT EXISTS symbols (
  id              TEXT PRIMARY KEY,
  snapshot_id     TEXT NOT NULL,
  project_id      TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  kind            TEXT NOT NULL,           -- 'function' | 'class' | 'method' | 'interface' | 'type' | 'enum' | 'const' | 'import' | 'export'
  name            TEXT NOT NULL,
  qualified_name  TEXT NOT NULL,           -- e.g. "ClassName.methodName"
  start_byte      INTEGER NOT NULL,
  end_byte        INTEGER NOT NULL,
  start_line      INTEGER NOT NULL,
  end_line        INTEGER NOT NULL,
  signature_hash  TEXT,                    -- coarse-AST shape fingerprint
  modifiers_json  TEXT NOT NULL DEFAULT '[]',  -- ['public','async','export','static',...]
  language        TEXT NOT NULL,           -- 'ts' | 'js' | 'rust' | 'python' | 'go' | 'java' | 'cpp' | 'bash' | 'glsl'
  parent_symbol_id TEXT                    -- nullable; set for methods/properties of a class
);

CREATE INDEX IF NOT EXISTS idx_symbols_snapshot ON symbols(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(snapshot_id, file_path);
CREATE INDEX IF NOT EXISTS idx_symbols_qualified_name ON symbols(snapshot_id, qualified_name);
CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols(snapshot_id, kind);
CREATE INDEX IF NOT EXISTS idx_symbols_parent ON symbols(parent_symbol_id);

-- ─── Symbol references ───────────────────────────────────
-- Every textual occurrence of a symbol name (declaration or use). The
-- resolver promotes a subset of these to entries in `calls` and
-- `type_relations`; the raw reference table preserves all occurrences for
-- "find references" queries even when resolution is ambiguous.
CREATE TABLE IF NOT EXISTS symbol_references (
  id              TEXT PRIMARY KEY,
  snapshot_id     TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  start_byte      INTEGER NOT NULL,
  end_byte        INTEGER NOT NULL,
  start_line      INTEGER NOT NULL,
  end_line        INTEGER NOT NULL,
  name            TEXT NOT NULL,
  resolved_symbol_id TEXT,                 -- nullable until resolver runs; FK-style to symbols.id
  resolution_confidence REAL NOT NULL DEFAULT 0.0,  -- 0..1; 0 = unresolved, 1 = certain
  resolution_kind TEXT                     -- 'declaration' | 'call' | 'type_use' | 'import' | 'unknown'
);

CREATE INDEX IF NOT EXISTS idx_refs_snapshot ON symbol_references(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_refs_file ON symbol_references(snapshot_id, file_path);
CREATE INDEX IF NOT EXISTS idx_refs_resolved ON symbol_references(resolved_symbol_id);
CREATE INDEX IF NOT EXISTS idx_refs_name ON symbol_references(snapshot_id, name);

-- ─── Calls ───────────────────────────────────────────────
-- Edge: caller symbol → callee symbol. Both directions are queryable via
-- the two indexes. `confidence` reflects the resolver's certainty; values
-- < 0.5 are typically filtered out of the symbol-graph view.
CREATE TABLE IF NOT EXISTS calls (
  id              TEXT PRIMARY KEY,
  snapshot_id     TEXT NOT NULL,
  caller_symbol_id TEXT NOT NULL,
  callee_symbol_id TEXT NOT NULL,
  call_site_byte  INTEGER NOT NULL,
  call_site_line  INTEGER NOT NULL,
  confidence      REAL NOT NULL DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_calls_snapshot ON calls(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(snapshot_id, caller_symbol_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(snapshot_id, callee_symbol_id);

-- ─── Type relations ──────────────────────────────────────
-- Edge: from_symbol --kind--> to_symbol. Kinds: 'extends' | 'implements'
-- | 'uses_type' | 'returns' | 'param'.
CREATE TABLE IF NOT EXISTS type_relations (
  id              TEXT PRIMARY KEY,
  snapshot_id     TEXT NOT NULL,
  from_symbol_id  TEXT NOT NULL,
  to_symbol_id    TEXT NOT NULL,
  kind            TEXT NOT NULL,
  confidence      REAL NOT NULL DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_type_rel_snapshot ON type_relations(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_type_rel_from ON type_relations(snapshot_id, from_symbol_id);
CREATE INDEX IF NOT EXISTS idx_type_rel_to ON type_relations(snapshot_id, to_symbol_id);

-- ─── Files changed (per-mission file delta) ──────────────
-- A row per (mission, file_path, commit_sha) tuple. Populated by the
-- provenance linker walking `git log --name-status` over the commits
-- inside each mission's commit-range envelope.
CREATE TABLE IF NOT EXISTS files_changed (
  id              TEXT PRIMARY KEY,
  mission_id      TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  change_kind     TEXT NOT NULL,           -- 'A' (add) | 'M' (modify) | 'D' (delete) | 'R' (rename)
  rename_from     TEXT,                    -- non-null only when change_kind = 'R'
  added_lines     INTEGER NOT NULL DEFAULT 0,
  removed_lines   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_files_changed_mission ON files_changed(mission_id);
CREATE INDEX IF NOT EXISTS idx_files_changed_path ON files_changed(file_path);
CREATE INDEX IF NOT EXISTS idx_files_changed_commit ON files_changed(commit_sha);

-- ─── Mission provenance (per-line attribution) ───────────
-- A row per (file, line, mission). For a given (file_path, line_no) there
-- can be multiple rows when the same line was touched by multiple missions
-- across history; the provenance linker scores each (line, mission) pair
-- with a `weight` so the UI can show the most-attributable mission while
-- still retaining the full chain. Weight comes from the `git blame -CCC`
-- output × mission_links join logic in components/04-provenance-linker.md.
CREATE TABLE IF NOT EXISTS mission_provenance (
  id              TEXT PRIMARY KEY,
  snapshot_id     TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  line_no         INTEGER NOT NULL,
  mission_id      TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  weight          REAL NOT NULL DEFAULT 1.0  -- 0..1; 1 = sole attribution
);

CREATE INDEX IF NOT EXISTS idx_provenance_snapshot ON mission_provenance(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_provenance_file_line ON mission_provenance(snapshot_id, file_path, line_no);
CREATE INDEX IF NOT EXISTS idx_provenance_mission ON mission_provenance(mission_id);

-- ─── schema_version stamp ────────────────────────────────
INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (3, datetime('now'));
