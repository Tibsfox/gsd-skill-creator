-- Migration 003 (Postgres) — Release type classification
--
-- Adds a release_type column so scorer and drift-check can grade each
-- release against the right rubric (prose-style degree vs structured
-- feature vs short fix patch vs milestone marker).

SET search_path TO release_history;

ALTER TABLE release
  ADD COLUMN IF NOT EXISTS release_type TEXT;

CREATE INDEX IF NOT EXISTS release_release_type ON release (release_type);
