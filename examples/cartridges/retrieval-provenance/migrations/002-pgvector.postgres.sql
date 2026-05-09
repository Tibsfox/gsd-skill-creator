-- ============================================================================
-- retrieval-provenance / 002-pgvector.postgres.sql
-- ============================================================================
-- OPTIONAL: pgvector embedding columns + HNSW index.
-- Apply ONLY if pgvector >= 0.5.0 is installed.
--
-- Source-of-truth doc:
--   ../../../../.planning/missions/v1-49-621-scribe/
--   t5-retrieval-provenance/01-postgres-pgvector-practical-guide.md  §2.2, §3
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

SET search_path TO scribe, public;

-- Embedding dimension default: 1024 (BGE-large-en-v1.5 / E5-large-v2 / voyage-code-3).
-- Override per-deployment with ALTER COLUMN if a different model is used.
ALTER TABLE prov_node
    ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Generated full-text index (label + payload subject) for hybrid search
ALTER TABLE prov_node
    ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(label, '') || ' ' ||
        coalesce(payload->>'subject', '') || ' ' ||
        coalesce(payload->>'body', '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS prov_node_embedding_hnsw
    ON prov_node USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS prov_node_search_gin
    ON prov_node USING gin (search_tsv);


-- Hybrid search: vector + tsvector + sub_type filter, fused via RRF (k=60)
-- Returns top-N nodes ranked by combined relevance.
-- See doc 01 §4.1 for the RRF derivation.
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_emb  vector,
    sub_type_filter TEXT DEFAULT NULL,
    max_results INT DEFAULT 20
)
RETURNS TABLE(node_id TEXT, label TEXT, sub_type TEXT, rrf_score REAL) AS $$
  WITH vec AS (
    SELECT  n.node_id,
            ROW_NUMBER() OVER (ORDER BY n.embedding <=> query_emb) AS rnk
    FROM    prov_node n
    WHERE   n.embedding IS NOT NULL
      AND   (sub_type_filter IS NULL OR n.sub_type = sub_type_filter)
    ORDER  BY n.embedding <=> query_emb
    LIMIT  60
  ),
  fts AS (
    SELECT  n.node_id,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(n.search_tsv, q) DESC) AS rnk
    FROM    prov_node n,
            plainto_tsquery('english', query_text) q
    WHERE   n.search_tsv @@ q
      AND   (sub_type_filter IS NULL OR n.sub_type = sub_type_filter)
    ORDER  BY ts_rank_cd(n.search_tsv, q) DESC
    LIMIT  60
  ),
  fused AS (
    SELECT node_id, SUM(1.0 / (60 + rnk))::real AS score
    FROM   (SELECT node_id, rnk FROM vec
            UNION ALL
            SELECT node_id, rnk FROM fts) all_ranks
    GROUP BY node_id
  )
  SELECT  n.node_id, n.label, n.sub_type, f.score
  FROM    fused f
  JOIN    prov_node n USING (node_id)
  ORDER  BY f.score DESC
  LIMIT  max_results
$$ LANGUAGE SQL STABLE;
