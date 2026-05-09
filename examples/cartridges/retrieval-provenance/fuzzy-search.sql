-- ============================================================================
-- retrieval-provenance / fuzzy-search.sql
-- ============================================================================
-- Fuzzy-search SQL primitives layered on top of 001-init.postgres.sql.
-- See doc 03 in the source-of-truth track for algorithm rationale.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
SET search_path TO scribe, public;

-- Optional global tuning:
-- ALTER DATABASE scribe SET pg_trgm.similarity_threshold = 0.25;


-- ----------------------------------------------------------------------------
-- 1. Trigram fuzzy match on commit subjects
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fuzzy_find_commit(q TEXT, max_results INT DEFAULT 20)
RETURNS TABLE(sha TEXT, subject TEXT, sim REAL) AS $$
  SELECT  node_id AS sha,
          payload->>'subject' AS subject,
          similarity(payload->>'subject', q) AS sim
  FROM    prov_node
  WHERE   node_type = 'Entity'
    AND   sub_type = 'commit'
    AND   payload->>'subject' % q
  ORDER  BY (payload->>'subject') <-> q
  LIMIT   max_results
$$ LANGUAGE SQL STABLE;


-- ----------------------------------------------------------------------------
-- 2. Trigram fuzzy match on file paths
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fuzzy_find_path(q TEXT, max_results INT DEFAULT 20)
RETURNS TABLE(node_id TEXT, path TEXT, sim REAL) AS $$
  SELECT  node_id,
          payload->>'path' AS path,
          similarity(payload->>'path', q) AS sim
  FROM    prov_node
  WHERE   node_type = 'Entity'
    AND   sub_type = 'file'
    AND   payload->>'path' % q
  ORDER  BY (payload->>'path') <-> q
  LIMIT   max_results
$$ LANGUAGE SQL STABLE;


-- ----------------------------------------------------------------------------
-- 3. Bounded-edit-distance identifier match (e.g. IC-NNN-N.N tasks)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION near_identifier(q TEXT, max_dist INT DEFAULT 2)
RETURNS TABLE(node_id TEXT, identifier TEXT, dist INT) AS $$
  SELECT  node_id,
          payload->>'identifier' AS identifier,
          levenshtein_less_equal(payload->>'identifier', q, max_dist) AS dist
  FROM    prov_node
  WHERE   sub_type IN ('task', 'decision')
    AND   payload ? 'identifier'
    AND   levenshtein_less_equal(payload->>'identifier', q, max_dist) <= max_dist
  ORDER  BY dist
$$ LANGUAGE SQL STABLE;


-- ----------------------------------------------------------------------------
-- 4. Phonetic fallback via metaphone (rare; useful for author/name matching)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION near_label_phonetic(q TEXT, max_results INT DEFAULT 10)
RETURNS TABLE(node_id TEXT, label TEXT) AS $$
  SELECT  node_id, label
  FROM    prov_node
  WHERE   metaphone(label, 6) = metaphone(q, 6)
  LIMIT   max_results
$$ LANGUAGE SQL STABLE;
