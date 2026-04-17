-- Release History Schema — 001 init (SQLite)
-- Equivalent of 001-init.postgres.sql, translated for SQLite.
-- Apply: sqlite3 .planning/release-history.db < migrations/release-history/001-init.sqlite.sql

-- SQLite is namespace-flat (no CREATE SCHEMA). We prefix table names instead.

CREATE TABLE IF NOT EXISTS release (
  version               TEXT PRIMARY KEY,
  semver_major          INTEGER NOT NULL,
  semver_minor          INTEGER NOT NULL,
  semver_patch          INTEGER NOT NULL,
  semver_prerelease     TEXT,
  name                  TEXT,
  shipped_at            TEXT,           -- ISO-8601 YYYY-MM-DD
  commits               INTEGER,
  files_changed         INTEGER,
  lines_added           INTEGER,
  lines_removed         INTEGER,
  branch                TEXT,
  tag                   TEXT,
  dedication            TEXT,
  phases                INTEGER,
  plans                 INTEGER,
  source_readme         TEXT NOT NULL,
  parse_confidence      REAL NOT NULL DEFAULT 1.0,
  has_retrospective     INTEGER NOT NULL DEFAULT 0,   -- boolean (0/1)
  retrospective_status  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (retrospective_status IN ('present','missing','not_applicable','unknown')),
  ingested_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS release_semver   ON release (semver_major, semver_minor, semver_patch);
CREATE INDEX IF NOT EXISTS release_shipped  ON release (shipped_at);

CREATE TRIGGER IF NOT EXISTS release_updated_at AFTER UPDATE ON release
BEGIN
  UPDATE release SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE version = NEW.version;
END;

CREATE TABLE IF NOT EXISTS feature (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  version     TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  title       TEXT NOT NULL,
  location    TEXT,
  summary_md  TEXT NOT NULL,
  category    TEXT,
  line_count  INTEGER,
  UNIQUE (version, position)
);
CREATE INDEX IF NOT EXISTS feature_version ON feature (version);

CREATE TABLE IF NOT EXISTS metric (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  version       TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  metric_name   TEXT NOT NULL,
  before_value  TEXT,
  after_value   TEXT,
  delta         TEXT,
  unit          TEXT,
  UNIQUE (version, metric_name)
);

CREATE TABLE IF NOT EXISTS retrospective (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  version       TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  kind          TEXT NOT NULL
    CHECK (kind IN ('what_worked','what_could_be_better','lessons_learned','decisions','surprises')),
  body_md       TEXT NOT NULL,
  extracted_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (version, kind)
);

CREATE TABLE IF NOT EXISTS lesson (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  first_seen_version      TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  last_seen_version       TEXT,
  body                    TEXT NOT NULL,
  long_body_md            TEXT,
  status                  TEXT NOT NULL DEFAULT 'investigate'
    CHECK (status IN ('applied','deferred','investigate','superseded')),
  applied_in_version      TEXT REFERENCES release(version),
  superseded_by_version   TEXT REFERENCES release(version),
  classification_source   TEXT NOT NULL DEFAULT 'rule'
    CHECK (classification_source IN ('rule','llm','human')),
  classification_note     TEXT,
  requires_review         INTEGER NOT NULL DEFAULT 0,
  classified_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS lesson_status        ON lesson (status);
CREATE INDEX IF NOT EXISTS lesson_first_version ON lesson (first_seen_version);

CREATE TABLE IF NOT EXISTS publish_target (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  version          TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  chapter_file     TEXT NOT NULL,
  target           TEXT NOT NULL
    CHECK (target IN ('github','tibsfox_com','website','mirror')),
  target_path      TEXT NOT NULL,
  source_checksum  TEXT NOT NULL,
  last_synced_at   TEXT,
  UNIQUE (version, chapter_file, target)
);
CREATE INDEX IF NOT EXISTS publish_target_version ON publish_target (version);
