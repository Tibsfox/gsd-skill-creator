-- PNW Research Series — Database Schema
-- Target: MySQL 8.4 on HostPapa (tibsfox2_claudefox)
-- Generated: 2026-03-28

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Projects table — one row per research project
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(8) NOT NULL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  path VARCHAR(256) NOT NULL,
  cluster VARCHAR(32) NOT NULL DEFAULT '',
  cluster_color VARCHAR(7) NOT NULL DEFAULT '#999999',
  modules INT UNSIGNED NOT NULL DEFAULT 0,
  total_lines INT UNSIGNED NOT NULL DEFAULT 0,
  version_added VARCHAR(16) NOT NULL DEFAULT '',
  title VARCHAR(256) NOT NULL DEFAULT '',
  subtitle TEXT,
  through_line TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cluster (cluster),
  INDEX idx_version (version_added)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clusters table — Rosetta Stone domain clusters
CREATE TABLE IF NOT EXISTS clusters (
  name VARCHAR(32) NOT NULL PRIMARY KEY,
  color VARCHAR(7) NOT NULL DEFAULT '#999999',
  hub_project VARCHAR(8),
  member_count INT UNSIGNED NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hub_project) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cross-references — edges between projects
CREATE TABLE IF NOT EXISTS cross_refs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_id VARCHAR(8) NOT NULL,
  target_id VARCHAR(8) NOT NULL,
  ref_type ENUM('cites','extends','pairs','bridges') NOT NULL DEFAULT 'cites',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_edge (source_id, target_id),
  INDEX idx_source (source_id),
  INDEX idx_target (target_id),
  FOREIGN KEY (source_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Research modules — individual markdown files within projects
CREATE TABLE IF NOT EXISTS modules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(8) NOT NULL,
  filename VARCHAR(128) NOT NULL,
  title VARCHAR(256) NOT NULL DEFAULT '',
  line_count INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_module (project_id, filename),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Releases — version history
CREATE TABLE IF NOT EXISTS releases (
  tag VARCHAR(16) NOT NULL PRIMARY KEY,
  title VARCHAR(256) NOT NULL DEFAULT '',
  code VARCHAR(8),
  released_at DATE,
  summary TEXT,
  dedicated_to VARCHAR(256),
  project_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_lines INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (code) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search index — full-text search across projects
CREATE TABLE IF NOT EXISTS search_index (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(8) NOT NULL,
  content_type ENUM('title','subtitle','module','through_line','keyword') NOT NULL,
  content TEXT NOT NULL,
  FULLTEXT INDEX ft_content (content),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stats — aggregate metrics (single row, updated by sync)
CREATE TABLE IF NOT EXISTS stats (
  id INT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
  total_projects INT UNSIGNED NOT NULL DEFAULT 0,
  total_clusters INT UNSIGNED NOT NULL DEFAULT 0,
  total_edges INT UNSIGNED NOT NULL DEFAULT 0,
  total_modules INT UNSIGNED NOT NULL DEFAULT 0,
  total_lines INT UNSIGNED NOT NULL DEFAULT 0,
  total_releases INT UNSIGNED NOT NULL DEFAULT 0,
  last_sync TIMESTAMP NULL,
  CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO stats (id) VALUES (1);
