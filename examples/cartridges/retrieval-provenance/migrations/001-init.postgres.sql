-- ============================================================================
-- retrieval-provenance / 001-init.postgres.sql
-- ============================================================================
-- PROV-O-derived edge-list schema for the SCRIBE provenance graph.
-- Companion: 001-init.sqlite.sql (SQLite parity, hand-translated per
-- the portable-schema-generator skill — see top-level README in this
-- cartridge for translation rules.)
--
-- Source-of-truth doc: ../../../../.planning/missions/v1-49-621-scribe/
--   t5-retrieval-provenance/05-provenance-schemas.md  §5
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS scribe;
SET search_path TO scribe, public;

-- Required extensions ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- fuzzy search (doc 03)
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;  -- levenshtein (doc 03)
-- Vector extension is OPTIONAL — install only when embedding columns are used.
-- CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector (doc 01)


-- ============================================================================
-- 1. PROV-O CORE TABLES
-- ============================================================================

-- prov_node — entities, activities, agents (PROV-O three-class core)
CREATE TABLE IF NOT EXISTS prov_node (
    node_id     TEXT PRIMARY KEY,                -- e.g. 'commit:e3ad12b25...', 'session:2026-04-25-...'
    node_type   TEXT NOT NULL CHECK (node_type IN
                  ('Entity', 'Activity', 'Agent', 'Plan', 'Bundle', 'Collection')),
    sub_type    TEXT,                            -- 'commit', 'session', 'file', 'decision', 'alternative', 'task', ...
    label       TEXT,                            -- human-readable
    payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at  TIMESTAMPTZ,                     -- for Activity nodes
    ended_at    TIMESTAMPTZ,                     -- for Activity nodes
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prov_node_subtype_idx
    ON prov_node (sub_type);
CREATE INDEX IF NOT EXISTS prov_node_label_trgm
    ON prov_node USING gin (label gin_trgm_ops);
CREATE INDEX IF NOT EXISTS prov_node_payload_gin
    ON prov_node USING gin (payload jsonb_path_ops);


-- prov_edge — PROV-O properties as edges
CREATE TABLE IF NOT EXISTS prov_edge (
    edge_id     TEXT PRIMARY KEY,                -- typically sha256(src||rel||dst), see seeder
    src_id      TEXT NOT NULL REFERENCES prov_node(node_id) ON DELETE CASCADE,
    dst_id      TEXT NOT NULL REFERENCES prov_node(node_id) ON DELETE CASCADE,
    relation    TEXT NOT NULL CHECK (relation IN (
                  -- PROV-O starting-point properties
                  'wasGeneratedBy','used','wasInformedBy','wasDerivedFrom',
                  'wasAttributedTo','wasAssociatedWith','actedOnBehalfOf',
                  -- PROV-O extended properties used by SCRIBE
                  'wasInfluencedBy','hadMember','wasRevisionOf','wasQuotationFrom',
                  'specializationOf','alternateOf','hadPlan','hadActivity'
                )),
    payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prov_edge_src_rel
    ON prov_edge (src_id, relation);
CREATE INDEX IF NOT EXISTS prov_edge_dst_rel
    ON prov_edge (dst_id, relation);
CREATE INDEX IF NOT EXISTS prov_edge_relation
    ON prov_edge (relation);


-- ============================================================================
-- 2. CONVENIENCE VIEWS — strict-table semantics over the edge list
-- ============================================================================

CREATE OR REPLACE VIEW commits_view AS
  SELECT  node_id        AS sha,
          payload->>'subject'              AS subject,
          payload->>'body'                 AS body,
          payload->>'author'               AS author,
          (payload->>'authored_at')::timestamptz AS authored_at,
          (payload->>'lines_changed')::int AS lines_changed
  FROM    prov_node
  WHERE   node_type = 'Entity' AND sub_type = 'commit';

CREATE OR REPLACE VIEW sessions_view AS
  SELECT  node_id        AS session_id,
          payload->>'mission'              AS mission,
          started_at,
          ended_at,
          (payload->'event_count')::int    AS event_count,
          payload->>'started_commit'       AS started_commit,
          payload->>'ended_commit'         AS ended_commit
  FROM    prov_node
  WHERE   node_type = 'Activity' AND sub_type = 'session';

CREATE OR REPLACE VIEW decisions_view AS
  SELECT  node_id        AS decision_id,
          label          AS decision_label,
          payload->>'identifier'           AS identifier,
          payload->'alternatives'          AS alternatives,
          payload->>'reason'               AS reason
  FROM    prov_node
  WHERE   node_type = 'Plan' OR (node_type = 'Entity' AND sub_type = 'decision');


-- ============================================================================
-- 3. OPTIONAL pgvector EMBEDDING COLUMNS
-- ============================================================================
-- Apply 002-pgvector.postgres.sql ONLY if pgvector is installed.

-- ============================================================================
-- 4. FUZZY-SEARCH HELPER FUNCTIONS (cartridge-shipped; see fuzzy-search.sql)
-- ============================================================================

CREATE OR REPLACE FUNCTION fuzzy_find_node(q TEXT, max_results INT DEFAULT 20)
RETURNS TABLE(node_id TEXT, label TEXT, sub_type TEXT, sim REAL) AS $$
  SELECT  n.node_id, n.label, n.sub_type, similarity(n.label, q) AS sim
  FROM    prov_node n
  WHERE   n.label IS NOT NULL AND n.label % q
  ORDER BY n.label <-> q
  LIMIT   max_results
$$ LANGUAGE SQL STABLE;


-- ============================================================================
-- 5. RECURSIVE-CTE GRAPH-TRAVERSAL HELPERS
-- ============================================================================

-- upstream(target, max_depth) — all activities/entities that led to `target`
CREATE OR REPLACE FUNCTION upstream(target TEXT, max_depth INT DEFAULT 10)
RETURNS TABLE(node_id TEXT, depth INT, relation TEXT) AS $$
  WITH RECURSIVE walk AS (
    SELECT  src_id AS node_id, 1 AS depth, relation, ARRAY[dst_id, src_id] AS path
    FROM    prov_edge
    WHERE   dst_id = target
    UNION ALL
    SELECT  e.src_id, w.depth + 1, e.relation, w.path || e.src_id
    FROM    prov_edge e
    JOIN    walk w ON e.dst_id = w.node_id
    WHERE   w.depth < max_depth
      AND   NOT (e.src_id = ANY(w.path))
  )
  SELECT DISTINCT node_id, MIN(depth) AS depth, MIN(relation) AS relation
  FROM   walk
  GROUP  BY node_id
  ORDER  BY depth, node_id
$$ LANGUAGE SQL STABLE;


-- downstream(source, max_depth) — all entities/activities reachable from `source`
CREATE OR REPLACE FUNCTION downstream(source TEXT, max_depth INT DEFAULT 10)
RETURNS TABLE(node_id TEXT, depth INT, relation TEXT) AS $$
  WITH RECURSIVE walk AS (
    SELECT  dst_id AS node_id, 1 AS depth, relation, ARRAY[src_id, dst_id] AS path
    FROM    prov_edge
    WHERE   src_id = source
    UNION ALL
    SELECT  e.dst_id, w.depth + 1, e.relation, w.path || e.dst_id
    FROM    prov_edge e
    JOIN    walk w ON e.src_id = w.node_id
    WHERE   w.depth < max_depth
      AND   NOT (e.dst_id = ANY(w.path))
  )
  SELECT DISTINCT node_id, MIN(depth) AS depth, MIN(relation) AS relation
  FROM   walk
  GROUP  BY node_id
  ORDER  BY depth, node_id
$$ LANGUAGE SQL STABLE;
