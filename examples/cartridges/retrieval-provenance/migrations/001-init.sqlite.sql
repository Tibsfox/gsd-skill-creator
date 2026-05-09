-- ============================================================================
-- retrieval-provenance / 001-init.sqlite.sql
-- ============================================================================
-- SQLite parity for 001-init.postgres.sql per the portable-schema-generator
-- skill translation rules:
--   * CREATE SCHEMA + SET search_path stripped (SQLite is namespace-flat)
--   * BIGSERIAL → INTEGER PRIMARY KEY AUTOINCREMENT  (n/a here — text PKs)
--   * TIMESTAMPTZ → TEXT (ISO8601 default via strftime)
--   * BOOLEAN → INTEGER (0/1)                       (n/a here)
--   * pg_trgm GIN index → fts5(tokenize='trigram') virtual table
--   * Function-style triggers → BEGIN..END inline triggers (n/a here)
--   * Recursive functions → expressed as views + WITH RECURSIVE in app
--
-- Required at connect time:
--   PRAGMA foreign_keys = ON;
-- ============================================================================


-- ============================================================================
-- 1. PROV-O CORE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS prov_node (
    node_id     TEXT PRIMARY KEY NOT NULL,
    node_type   TEXT NOT NULL CHECK (node_type IN
                  ('Entity', 'Activity', 'Agent', 'Plan', 'Bundle', 'Collection')),
    sub_type    TEXT,
    label       TEXT,
    payload     TEXT NOT NULL DEFAULT '{}',     -- JSON stored as TEXT in SQLite
    started_at  TEXT,                           -- ISO8601 (TIMESTAMPTZ → TEXT)
    ended_at    TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS prov_node_subtype_idx
    ON prov_node (sub_type);

-- Trigram fuzzy search: SQLite uses fts5 virtual table; not auto-synced
-- with prov_node, so the application maintains the FTS index on insert /
-- update / delete. See cartridge README §SQLite-FTS for the trigger
-- pattern when sync is needed.
CREATE VIRTUAL TABLE IF NOT EXISTS prov_node_fts USING fts5(
    node_id UNINDEXED,
    label,
    content='prov_node',
    content_rowid='rowid',
    tokenize='trigram'
);

-- JSON1 indexing (SQLite 3.38+):
CREATE INDEX IF NOT EXISTS prov_node_payload_subject
    ON prov_node (json_extract(payload, '$.subject'));


CREATE TABLE IF NOT EXISTS prov_edge (
    edge_id     TEXT PRIMARY KEY NOT NULL,
    src_id      TEXT NOT NULL REFERENCES prov_node(node_id) ON DELETE CASCADE,
    dst_id      TEXT NOT NULL REFERENCES prov_node(node_id) ON DELETE CASCADE,
    relation    TEXT NOT NULL CHECK (relation IN (
                  'wasGeneratedBy','used','wasInformedBy','wasDerivedFrom',
                  'wasAttributedTo','wasAssociatedWith','actedOnBehalfOf',
                  'wasInfluencedBy','hadMember','wasRevisionOf','wasQuotationFrom',
                  'specializationOf','alternateOf','hadPlan','hadActivity'
                )),
    payload     TEXT NOT NULL DEFAULT '{}',
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS prov_edge_src_rel ON prov_edge (src_id, relation);
CREATE INDEX IF NOT EXISTS prov_edge_dst_rel ON prov_edge (dst_id, relation);
CREATE INDEX IF NOT EXISTS prov_edge_relation ON prov_edge (relation);


-- ============================================================================
-- 2. CONVENIENCE VIEWS
-- ============================================================================

CREATE VIEW IF NOT EXISTS commits_view AS
  SELECT  node_id AS sha,
          json_extract(payload, '$.subject')         AS subject,
          json_extract(payload, '$.body')            AS body,
          json_extract(payload, '$.author')          AS author,
          json_extract(payload, '$.authored_at')     AS authored_at,
          json_extract(payload, '$.lines_changed')   AS lines_changed
  FROM    prov_node
  WHERE   node_type = 'Entity' AND sub_type = 'commit';

CREATE VIEW IF NOT EXISTS sessions_view AS
  SELECT  node_id AS session_id,
          json_extract(payload, '$.mission')         AS mission,
          started_at,
          ended_at,
          json_extract(payload, '$.event_count')     AS event_count,
          json_extract(payload, '$.started_commit')  AS started_commit,
          json_extract(payload, '$.ended_commit')    AS ended_commit
  FROM    prov_node
  WHERE   node_type = 'Activity' AND sub_type = 'session';

CREATE VIEW IF NOT EXISTS decisions_view AS
  SELECT  node_id AS decision_id,
          label   AS decision_label,
          json_extract(payload, '$.identifier')      AS identifier,
          json_extract(payload, '$.alternatives')    AS alternatives,
          json_extract(payload, '$.reason')          AS reason
  FROM    prov_node
  WHERE   node_type = 'Plan' OR (node_type = 'Entity' AND sub_type = 'decision');


-- ============================================================================
-- 3. RECURSIVE TRAVERSAL — express as VIEW + WITH RECURSIVE in application
-- ============================================================================
-- SQLite has no parameterized SQL functions, so upstream/downstream live
-- as application-side query templates. See cartridge extractor for
-- reference implementations.
--
-- Example app-side query (upstream):
--
--   WITH RECURSIVE walk(node_id, depth, relation, path) AS (
--     SELECT src_id, 1, relation, src_id || '|' || dst_id
--     FROM   prov_edge WHERE dst_id = :target
--     UNION ALL
--     SELECT e.src_id, w.depth + 1, e.relation, w.path || '|' || e.src_id
--     FROM   prov_edge e
--     JOIN   walk w ON e.dst_id = w.node_id
--     WHERE  w.depth < :max_depth
--       AND  instr(w.path, e.src_id) = 0
--   )
--   SELECT DISTINCT node_id, MIN(depth) AS depth FROM walk
--   GROUP BY node_id ORDER BY depth, node_id;
