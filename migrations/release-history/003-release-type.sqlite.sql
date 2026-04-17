-- Migration 003 (SQLite) — Release type classification

ALTER TABLE release ADD COLUMN release_type TEXT;
CREATE INDEX IF NOT EXISTS release_release_type ON release (release_type);
