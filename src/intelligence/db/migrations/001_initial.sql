-- Intelligence Dashboard — initial schema (v1).
-- Source: .planning/staging/inbox/intelligence-dashboard/components/00-shared-types.md
-- Idempotent: re-applying to a DB already at version 1 is a no-op (D-05).

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  path            TEXT NOT NULL UNIQUE,
  branch          TEXT,
  kind            TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'med',
  last_activity_at TEXT NOT NULL,
  last_snapshot_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_recent ON projects(last_activity_at DESC);

CREATE TABLE IF NOT EXISTS snapshots (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  taken_at        TEXT NOT NULL,
  git_sha         TEXT,
  files_scanned   INTEGER NOT NULL,
  loc_total       INTEGER NOT NULL,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS findings (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  snapshot_id     TEXT NOT NULL REFERENCES snapshots(id),
  kind            TEXT NOT NULL,
  severity        TEXT NOT NULL,
  confidence      REAL NOT NULL,
  title           TEXT NOT NULL,
  rationale       TEXT NOT NULL,
  source_path     TEXT,
  source_range_start INTEGER,
  source_range_end   INTEGER,
  produced_by     TEXT NOT NULL,
  produced_at     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open',
  addressed_by_decision TEXT,
  dismissed_rationale TEXT
);

CREATE INDEX IF NOT EXISTS idx_findings_project_status ON findings(project_id, status);

CREATE TABLE IF NOT EXISTS briefings (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  snapshot_id     TEXT NOT NULL REFERENCES snapshots(id),
  generated_at    TEXT NOT NULL,
  body            TEXT NOT NULL,
  confidence      TEXT NOT NULL,
  source_findings TEXT NOT NULL,
  suggested_moves TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  started_at      TEXT NOT NULL,
  committed_at    TEXT,
  status          TEXT NOT NULL DEFAULT 'in_session',
  kb_snapshot     TEXT NOT NULL,
  briefing_at_start TEXT REFERENCES briefings(id)
);

CREATE TABLE IF NOT EXISTS meeting_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id      TEXT NOT NULL REFERENCES meetings(id),
  recorded_at     TEXT NOT NULL,
  kind            TEXT NOT NULL,
  body            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id              TEXT PRIMARY KEY,
  meeting_id      TEXT NOT NULL REFERENCES meetings(id),
  kind            TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'pending',
  ai_draft_title  TEXT,
  ai_draft_body   TEXT,
  developer_modifications TEXT NOT NULL DEFAULT '[]',
  source_findings TEXT NOT NULL DEFAULT '[]',
  source_move_rank INTEGER,
  approved_at     TEXT,
  emitted_at      TEXT,
  emission_path   TEXT
);

CREATE INDEX IF NOT EXISTS idx_decisions_meeting ON decisions(meeting_id, state);

CREATE TABLE IF NOT EXISTS bundles (
  id              TEXT PRIMARY KEY,
  meeting_id      TEXT NOT NULL REFERENCES meetings(id),
  emitted_at      TEXT NOT NULL,
  manifest_path   TEXT NOT NULL,
  batch_hints     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bundle_decisions (
  bundle_id       TEXT NOT NULL REFERENCES bundles(id),
  decision_id     TEXT NOT NULL REFERENCES decisions(id),
  PRIMARY KEY (bundle_id, decision_id)
);

CREATE TABLE IF NOT EXISTS mission_links (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id     TEXT NOT NULL REFERENCES decisions(id),
  artifact_kind   TEXT NOT NULL,
  artifact_ref    TEXT NOT NULL,
  recorded_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_version (
  version         INTEGER PRIMARY KEY,
  applied_at      TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
