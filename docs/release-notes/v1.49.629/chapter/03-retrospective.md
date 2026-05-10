# v1.49.629 — Retrospective (carryover lessons applied + new captures)

## Carryover lessons applied this milestone

- **Lesson #10248 (v607) — clean-room rebuild costs ~2.5× original estimate.**
  Applied: avoided this trap by *absorbing* upstream libraries (pmtiles@4 reader, vt-pbf for MVT encoding, flatgeobuf, lru-cache) instead of clean-rooming. The PMTiles **writer** was hand-rolled because pmtiles@4 npm has no writer export and `go-pmtiles` is the canonical alternative — but the writer mirrors the reader's `bytesToHeader` byte-for-byte and is round-trip-validated rather than spec-divined.

- **Lesson #10254 (v607) — run the desktop UI end-to-end before claiming ship-ready.**
  Applied: the live smoke tests against `localhost:3030` are the v629 substitute for desktop UI verification. Before ship: tile-fetch z=0 returned 33,356-byte MVT bytes; spatial-near returned real symbols ordered by ST_Distance; envelope smoke tests verified `?x=12abc` returns 400 (strict parser) and `pmtiles_name=../etc/passwd` returns 4xx (path-traversal guard).

- **Lesson #10261 (v607) — write-through side-stores remain caches, not sources of truth.**
  Applied: the SQLite canonical snapshot is unchanged. PostGIS `position`/`bbox` columns on `atlas.symbols` are *additive*; pgvector `embedding` column is untouched; FlatGeobuf and PMTiles are export-only mirrors. The migration's rollback block leaves the schema in the v607 baseline.

- **Bounded-tape v585 lesson — operator-only gates with documented overrides.**
  Applied: `CREATE EXTENSION postgis` requires PostgreSQL superuser; the maple role is the database owner but not a cluster superuser. The migration documents the manual operator step in `INSTALL.md` rather than attempting privilege escalation. Same discipline: pre-tag-gate `SC_SKIP_CI_GATE=1` etc. as documented overrides.

## New observations / candidate lessons

- **#10287 CANDIDATE — agent-driven code review before ship surfaces concurrency bugs static analysis misses.**
  v629 first used the `gsd-code-reviewer` agent before tagging. Reviewer caught a use-after-close race in the LRU cache's `dispose` callback (HIGH-01) and a TOCTOU race in NodeFileSource lazy-init (HIGH-02) — both real concurrency hazards that pass `npx tsc --noEmit` and 71/71 unit tests because tests don't exercise concurrent first-call patterns. The agent loop adds ~4 minutes wall-clock and ~108K reviewer tokens; surfaces real-bug-class findings the rest of the toolchain misses.

- **#10288 CANDIDATE — hand-rolled binary format writers must round-trip through the upstream reader to validate, not against a hand-written test fixture.**
  v629's PMTiles writer was initially "verified" by 14 unit tests against the writer's own output. The first live build crashed the reader with `"Expected varint not more than 10 bytes"` — caused by the root directory exceeding the reader's 16,384-byte initial-fetch window. The reader-round-trip test (added after the failure) catches it immediately. Pattern: every binary-format encoder in v1.50+ should land with a paired upstream-reader round-trip test, not a bytes-equal-fixture test.

- **#10289 CANDIDATE — IPC envelope conventions should be enforced at the helper layer, not by author discipline.**
  v629 originally shipped the spatial routes with `{symbols: [...]}` envelopes while the existing dashboard routes used `{ok: true, ...}`. Reviewer flagged as MED-01. The fix added `sendOk()` / `sendError()` helpers that always wrap; future route additions can't easily skip the envelope. Pattern: deduplicate envelope discipline into a helper module rather than relying on each handler to remember.

- **#10290 CANDIDATE — counter-cadence milestones can ship operator-only DB migrations without engine-state advance.**
  The PostGIS install was an operator-only superuser step (verified before tag); the migration itself runs as the maple role. Counter-cadence shipping discipline (no NASA/MUS/ELC/SPS public-site artifacts) accommodates this naturally. Pattern: any future PG cluster-level extension (e.g. pgRouting, pg_trgm tuning) follows the same shape.

## What went unusually well

- **Part A → Part B → Build pipeline.** The Squadron-profile research mission (Part A, 44pp / 148 citations) produced the citation base; the vision-to-mission transformation (Part B, 13-file mission package) decomposed it into 8 components; live build matched the package 1:1. Total wall time: ~6 hours across two sessions.
- **Independent reviewer caught the actual smoke-test 404.** The `mission-bbox?mission_id=v1-49-621-scribe → 404` was attributed by me to "no provenance data"; reviewer's HIGH-03 correctly diagnosed it as a wrong JOIN on `snapshot_id` equality. Both are true (the table is also empty), but the JOIN bug would silently mask data-presence cases.
- **Zero regressions across 30K+ tests.** The substrate-conformance preservation invariant held — v607 + v621 substrate tests pass unchanged after the spatial absorption.
