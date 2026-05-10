-- 004-postgis.sql — Atlas spatial substrate migration
--
-- Adds PostGIS geometry columns + GiST indexes to the atlas schema. Adapts the
-- gis-spatial-substrate Part B mission package (component 01) to the real
-- v1.49.607 atlas.* schema layout.
--
-- Idempotent: every CREATE / ALTER uses IF NOT EXISTS. Reversible (rollback
-- block at end of file). Additive only — does not touch existing columns,
-- indexes, or pgvector embedding column.
--
-- Predecessor: src/intelligence/atlas-pg/schema.sql (W4e.A baseline at v1.49.607).
-- Apply with:
--   psql -U maple -d tibsfox -f src/atlas/spatial/migrations/004-postgis.sql

BEGIN;

-- 1. PostGIS extension. Cluster-level install required (apt: postgresql-NN-postgis-3).
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. atlas.symbols: position (Point) + bbox (Polygon). SRID 0 (logical coords).
ALTER TABLE atlas.symbols
  ADD COLUMN IF NOT EXISTS position geometry(Point, 0),
  ADD COLUMN IF NOT EXISTS bbox     geometry(Polygon, 0);

-- 3. GiST indexes on the geometry columns.
CREATE INDEX IF NOT EXISTS idx_atlas_symbols_position_gist
  ON atlas.symbols USING GIST (position);

CREATE INDEX IF NOT EXISTS idx_atlas_symbols_bbox_gist
  ON atlas.symbols USING GIST (bbox);

-- 4. Schema-version stamp. Mirrors atlas.schema_version's existing convention.
INSERT INTO atlas.schema_version(version)
  VALUES (4)
  ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ─── Rollback (run manually if needed) ───────────────────────────────────
--   BEGIN;
--   DROP INDEX IF EXISTS atlas.idx_atlas_symbols_bbox_gist;
--   DROP INDEX IF EXISTS atlas.idx_atlas_symbols_position_gist;
--   ALTER TABLE atlas.symbols DROP COLUMN IF EXISTS bbox;
--   ALTER TABLE atlas.symbols DROP COLUMN IF EXISTS position;
--   DELETE FROM atlas.schema_version WHERE version = 4;
--   -- Note: PostGIS extension itself is left installed (other tables may use it).
--   COMMIT;

-- ─── Notes ────────────────────────────────────────────────────────────────
-- * mission_bbox is computed at query time via ST_Extent over symbols JOIN
--   mission_provenance. No persisted bbox on atlas.mission_provenance.
-- * file_bbox is similarly computed at query time, joining symbols via
--   atlas.symbols.file_path → atlas.files_changed.file_path.
-- * pgvector embedding column on atlas.symbols is untouched.
-- * IVFFlat index on atlas.symbols.embedding is untouched.
