-- Release History Schema — 001 init
-- Mission: .planning/missions/release-history-tracking/
-- Contract: .planning/missions/release-history-tracking/components/00-shared-schema.md
-- Apply: psql "$RH_POSTGRES_URL" -f migrations/release-history/001-init.sql

CREATE SCHEMA IF NOT EXISTS release_history;

SET search_path TO release_history;

CREATE TABLE IF NOT EXISTS release (
  version               TEXT PRIMARY KEY,
  semver_major          INT  NOT NULL,
  semver_minor          INT  NOT NULL,
  semver_patch          INT  NOT NULL,
  semver_prerelease     TEXT,
  name                  TEXT,
  shipped_at            DATE,
  commits               INT,
  files_changed         INT,
  lines_added           INT,
  lines_removed         INT,
  branch                TEXT,
  tag                   TEXT,
  dedication            TEXT,
  phases                INT,
  plans                 INT,
  source_readme         TEXT NOT NULL,
  parse_confidence      REAL NOT NULL DEFAULT 1.0,
  has_retrospective     BOOLEAN NOT NULL DEFAULT FALSE,
  retrospective_status  TEXT NOT NULL DEFAULT 'unknown',
  ingested_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (retrospective_status IN ('present','missing','not_applicable','unknown'))
);
CREATE INDEX IF NOT EXISTS release_semver   ON release (semver_major, semver_minor, semver_patch);
CREATE INDEX IF NOT EXISTS release_shipped  ON release (shipped_at);

CREATE TABLE IF NOT EXISTS feature (
  id          BIGSERIAL PRIMARY KEY,
  version     TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  position    INT  NOT NULL,
  title       TEXT NOT NULL,
  location    TEXT,
  summary_md  TEXT NOT NULL,
  category    TEXT,
  line_count  INT,
  UNIQUE (version, position)
);
CREATE INDEX IF NOT EXISTS feature_version ON feature (version);

CREATE TABLE IF NOT EXISTS metric (
  id            BIGSERIAL PRIMARY KEY,
  version       TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  metric_name   TEXT NOT NULL,
  before_value  TEXT,
  after_value   TEXT,
  delta         TEXT,
  unit          TEXT,
  UNIQUE (version, metric_name)
);

CREATE TABLE IF NOT EXISTS retrospective (
  id            BIGSERIAL PRIMARY KEY,
  version       TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  kind          TEXT NOT NULL,
  body_md       TEXT NOT NULL,
  extracted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (version, kind),
  CHECK (kind IN ('what_worked','what_could_be_better','lessons_learned','decisions','surprises'))
);

CREATE TABLE IF NOT EXISTS lesson (
  id                      BIGSERIAL PRIMARY KEY,
  first_seen_version      TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  last_seen_version       TEXT,
  body                    TEXT NOT NULL,
  long_body_md            TEXT,
  status                  TEXT NOT NULL DEFAULT 'investigate',
  applied_in_version      TEXT REFERENCES release(version),
  superseded_by_version   TEXT REFERENCES release(version),
  classification_source   TEXT NOT NULL DEFAULT 'rule',
  classification_note     TEXT,
  requires_review         BOOLEAN NOT NULL DEFAULT FALSE,
  classified_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('applied','deferred','investigate','superseded')),
  CHECK (classification_source IN ('rule','llm','human'))
);
CREATE INDEX IF NOT EXISTS lesson_status        ON lesson (status);
CREATE INDEX IF NOT EXISTS lesson_first_version ON lesson (first_seen_version);

CREATE TABLE IF NOT EXISTS publish_target (
  id               BIGSERIAL PRIMARY KEY,
  version          TEXT NOT NULL REFERENCES release(version) ON DELETE CASCADE,
  chapter_file     TEXT NOT NULL,
  target           TEXT NOT NULL,
  target_path      TEXT NOT NULL,
  source_checksum  TEXT NOT NULL,
  last_synced_at   TIMESTAMPTZ,
  UNIQUE (version, chapter_file, target),
  CHECK (target IN ('github','tibsfox_com'))
);
CREATE INDEX IF NOT EXISTS publish_target_version ON publish_target (version);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS release_updated_at ON release;
CREATE TRIGGER release_updated_at
  BEFORE UPDATE ON release
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
