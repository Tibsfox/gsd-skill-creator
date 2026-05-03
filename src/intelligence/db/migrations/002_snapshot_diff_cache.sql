-- Intelligence Dashboard — migration v2: snapshot diff cache + file metrics.
-- Adds `snapshot_diffs` for caching computed diffs between snapshot pairs.
-- Adds `file_metrics` for per-file symbol tracking (needed by SnapshotManager structural diff).
-- Idempotent: CREATE TABLE IF NOT EXISTS + INSERT OR IGNORE schema_version.

CREATE TABLE IF NOT EXISTS snapshot_diffs (
  from_snapshot   TEXT NOT NULL,
  to_snapshot     TEXT NOT NULL,
  computed_at     TEXT NOT NULL,
  payload_json    TEXT NOT NULL,
  PRIMARY KEY (from_snapshot, to_snapshot)
);

CREATE TABLE IF NOT EXISTS file_metrics (
  snapshot_id     TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  exports_json    TEXT NOT NULL DEFAULT '[]',
  imports_json    TEXT NOT NULL DEFAULT '[]',
  signatures_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (snapshot_id, file_path)
);

INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (2, datetime('now'));
