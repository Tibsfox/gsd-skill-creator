-- Constellation schema EXTENSIONS for MySQL 8.4 on tibsfox2_claudefox.
--
-- This intentionally piggy-backs on the existing tables in this database:
--   projects          (178 rows, varchar(8) id)        — primary node registry
--   cross_refs        (739 rows, source_id/target_id)  — graph edges
--   rosetta_clusters  (13 rows)                        — cluster registry
--
-- We add only the data the constellation page needs that isn't already here:
--   artists           (Seattle 360 / S36 musical wing — 64 rows expected)
--   species           (Sound of Puget Sound / SPS wing — 64 rows expected)
--   nasa_missions     (legacy 22 + catalog 449 — ~471 rows)
--   build_log         (audit trail)
--
-- All FK columns match `projects.id` collation (utf8mb4_unicode_ci) explicitly
-- to avoid the FK incompatibility that bit us when the DB default differs.

CREATE TABLE IF NOT EXISTS artists (
  project_id VARCHAR(8)   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  artist     VARCHAR(255) NOT NULL,
  genre      VARCHAR(255) NULL,
  energy     TINYINT      NULL,
  xrefs      JSON         NULL,
  CONSTRAINT fk_artists_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_artists_energy CHECK (energy IS NULL OR energy BETWEEN 1 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS species (
  project_id  VARCHAR(8)   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  common      VARCHAR(255) NOT NULL,
  scientific  VARCHAR(255) NULL,
  family      VARCHAR(64)  NULL,
  taxon_order VARCHAR(64)  NULL,
  energy      TINYINT      NULL,
  trait       TEXT         NULL,
  CONSTRAINT fk_species_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_species_energy CHECK (energy IS NULL OR energy BETWEEN 1 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nasa_missions (
  project_id  VARCHAR(8)   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  launch_date DATE         NULL,
  organism    VARCHAR(255) NULL,
  sci_name    VARCHAR(255) NULL,
  node_count  INT          NULL,
  crew        VARCHAR(255) NULL,
  is_artemis  TINYINT(1)   NOT NULL DEFAULT 0,
  catalog_id  VARCHAR(32)  NULL,
  KEY idx_nasa_catalog (catalog_id),
  CONSTRAINT fk_nasa_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS build_log (
  built_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) PRIMARY KEY,
  commit_sha VARCHAR(40) NULL,
  node_count INT         NULL,
  edge_count INT         NULL,
  notes      TEXT        NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
