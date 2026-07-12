-- Intelligence Dashboard — finding embedding cache (v4).
-- Adds a per-finding embedding cache so the KBStore→pgvector sync path can
-- reuse a stored vector instead of re-embedding an unchanged finding on every
-- mirror pass. The vector is JSON-encoded (TEXT); NULL until first embedded.
--
-- Forward-only: the migration runner applies files whose version prefix exceeds
-- the recorded schema_version, so this ALTER runs exactly once per database.

ALTER TABLE findings ADD COLUMN embedding TEXT;

-- ─── schema_version stamp ────────────────────────────────
INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (4, datetime('now'));
