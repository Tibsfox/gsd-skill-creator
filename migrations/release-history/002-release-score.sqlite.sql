-- Migration 002 (SQLite) — Release completeness scores

CREATE TABLE IF NOT EXISTS release_score (
  version                    TEXT PRIMARY KEY REFERENCES release(version) ON DELETE CASCADE,
  score                      INTEGER NOT NULL,
  grade                      TEXT NOT NULL,
  header_block               INTEGER NOT NULL DEFAULT 0,
  summary_findings           INTEGER NOT NULL DEFAULT 0,
  key_features_table         INTEGER NOT NULL DEFAULT 0,
  part_a_depth               INTEGER NOT NULL DEFAULT 0,
  part_b_depth               INTEGER NOT NULL DEFAULT 0,
  retrospective_structure    INTEGER NOT NULL DEFAULT 0,
  lessons_learned            INTEGER NOT NULL DEFAULT 0,
  cross_references           INTEGER NOT NULL DEFAULT 0,
  running_ledgers            INTEGER NOT NULL DEFAULT 0,
  infrastructure_block       INTEGER NOT NULL DEFAULT 0,
  notes                      TEXT,
  scored_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS release_score_grade ON release_score (grade);
CREATE INDEX IF NOT EXISTS release_score_score ON release_score (score);
