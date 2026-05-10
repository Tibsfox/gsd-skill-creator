# v1.49.629 — Forward Lessons (emit chain)

## Forward lessons emitted (CANDIDATE → tag forward)

### #10287 — Agent-driven code review before ship is a cheap correctness gate

**Context:** v629 was the first v1.49.x milestone to run a `gsd-code-reviewer` agent pass before tagging. Reviewer surfaced 4 HIGH / 5 MEDIUM / 3 LOW / 2 NIT findings.

**Most-load-bearing find:** HIGH-01 (LRU cache eviction `dispose` closes file handle while concurrent `getZxy` calls are mid-flight on leaf-directory archives). This is a real concurrency hazard, not a static-analysis-detectable bug. Tests pass because no test exercises concurrent first-callers on a 5+-distinct-archive workload — but the production server's `pmtiles_name` is a client-supplied query parameter, so multi-tenant pressure triggers it.

**Pattern:** Add the gsd-code-reviewer agent loop to the standard ship pipeline alongside `pre-tag-gate`. Cost: ~4 min wall-clock, ~100K reviewer tokens. Catches: concurrency bugs, SQL semantics errors, unparameterized SQL fragments, API-shape inconsistencies — bug classes that vitest + tsc don't reach.

**Apply forward:** v1.49.630+ should run code-reviewer before tag-and-push. Document in CLAUDE.md ship-pipeline section once the cadence is established.

### #10288 — Binary-format writers need upstream-reader round-trip tests, not byte-fixture tests

**Context:** v629's PMTiles v3 writer landed with 14 unit tests asserting "writer produces well-formed output." The first live build crashed the upstream `pmtiles@4` reader with `"Expected varint not more than 10 bytes"` — a corruption symptom whose root cause was the root directory exceeding the reader's 16,384-byte initial-fetch window.

**Pattern:** Every binary-format writer (PMTiles, FlatGeobuf, GeoParquet, Parquet, COG, MVT, …) must include a round-trip test that:
1. Builds an artifact via the writer.
2. Constructs the upstream reader from that artifact.
3. Calls a representative read API (header parse + tile fetch for PMTiles; feature scan for FlatGeobuf).
4. Asserts the read-back matches the inputs.

**Apply forward:** add the round-trip discipline as a written invariant in `docs/adr/` for all v1.50+ binary-format work.

### #10289 — Envelope conventions belong at the helper layer

**Context:** v629's spatial routes initially shipped with `{symbols: [...]}` / `{bbox: ...}` envelopes while the existing v607 dashboard routes used `{ok: true, ...}`. MED-01 flagged the inconsistency. Fix: introduce `sendOk()` / `sendError()` helpers that always wrap.

**Pattern:** When extending an HTTP server with new routes, the envelope discipline should be a shared module, not author convention. Per-route author discipline drifts; a `sendOk(res, body)` helper can't drift.

**Apply forward:** introduce a shared `src/atlas/server/response.ts` helper module in v1.49.630+ that is the only path to write to `res`. All future spatial routes go through it.

### #10290 — Counter-cadence milestones can ship operator-only PG superuser steps

**Context:** v629 required `CREATE EXTENSION postgis` as PostgreSQL superuser — the maple role is the database owner but not a cluster superuser. The migration documents this in `INSTALL.md` and the migration itself runs as maple.

**Pattern:** Operator-only one-time setup steps (cluster-level extension installs, file-system permissions, secret provisioning) belong in a `migrations/INSTALL.md`-style operator guide alongside the SQL migration. The migration runner detects "extension absent" → fails closed → guide tells operator the manual step. Substrate-conformance gates blocked ship until both the operator step + migration apply succeeded.

**Apply forward:** any future cluster-level PostgreSQL extension (pgRouting, pg_partman, etc.) follows the same shape — INSTALL.md + idempotent migration + fail-closed if missing.

## Lesson chain forward

Lessons #10287–#10290 inherit from the v585 deterministic-gates pattern (operational debt → tested gate) and the v607 W4 work-review-pass pattern (visual-end-to-end before ship). They form an explicit "ship-discipline trio" that v1.49.630+ should adopt:

1. **Pre-author SQL validity gate** (existing pre-tag-gate step 2: vitest)
2. **Binary-format round-trip gate** (#10288 — new for v1.50)
3. **Agent-driven code-review gate** (#10287 — new for v1.50)
4. **Live-smoke gate** (existing v607 work-review-pass discipline)

The four together form the "ship-readiness diamond" — each axis catches a bug class the others miss.
