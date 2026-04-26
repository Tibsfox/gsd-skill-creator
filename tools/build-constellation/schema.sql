-- Constellation graph schema.
-- Source of truth for tibsfox.com/Research/constellation.html.
-- Replaces the inline JS data tables in that file.

CREATE SCHEMA IF NOT EXISTS constellation;
SET search_path TO constellation, public;

CREATE TABLE IF NOT EXISTS clusters (
  name        text PRIMARY KEY,
  color       text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  cluster_name text REFERENCES clusters(name) ON UPDATE CASCADE,
  series_code  text,                -- e.g. NASA, S36, SPS, BLN — optional grouping
  detail_url   text,                -- link target for tooltip / node click
  notes        text
);
CREATE INDEX IF NOT EXISTS idx_projects_cluster ON projects(cluster_name);
CREATE INDEX IF NOT EXISTS idx_projects_series  ON projects(series_code);

CREATE TABLE IF NOT EXISTS edges (
  src_id text NOT NULL REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  dst_id text NOT NULL REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  weight real NOT NULL DEFAULT 1.0,
  PRIMARY KEY (src_id, dst_id)
);
CREATE INDEX IF NOT EXISTS idx_edges_dst ON edges(dst_id);

CREATE TABLE IF NOT EXISTS artists (
  project_id text PRIMARY KEY REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  artist     text NOT NULL,
  genre      text,
  energy     int CHECK (energy BETWEEN 1 AND 6),
  xrefs      int[] NOT NULL DEFAULT '{}'  -- indices into ARTIST_DATA-equivalent for cross-pollination edges
);

CREATE TABLE IF NOT EXISTS species (
  project_id text PRIMARY KEY REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  common     text NOT NULL,
  scientific text,
  family     text,
  taxon_order text,
  energy     int CHECK (energy BETWEEN 1 AND 6),
  trait      text
);

CREATE TABLE IF NOT EXISTS nasa_missions (
  project_id text PRIMARY KEY REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title      text NOT NULL,
  launch_date date,
  organism   text,
  sci_name   text,
  node_count int,
  crew       text,
  is_artemis boolean NOT NULL DEFAULT false,
  catalog_id text       -- e.g. "1.42" so we can join back to NASA/<id>/index.html
);
CREATE INDEX IF NOT EXISTS idx_nasa_catalog ON nasa_missions(catalog_id);

-- Build manifest: every successful build inserts one row.
CREATE TABLE IF NOT EXISTS build_log (
  built_at   timestamptz PRIMARY KEY DEFAULT now(),
  commit_sha text,
  node_count int,
  edge_count int,
  notes      text
);
