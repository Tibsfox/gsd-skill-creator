# v1.49.629 — GIS Spatial Substrate (counter-cadence)

**Released:** 2026-05-10
**Type:** Counter-cadence operational milestone (no NASA/MUS/ELC/SPS engine advance)
**Predecessor:** v1.49.628 (Pioneer Venus 2 Multiprobe; degree-advancing)
**Mission package:** `.planning/missions/gis-spatial-substrate/`

## Summary

v1.49.629 absorbs the GIS spatial-substrate primitives identified in the Part A research mission (44pp LaTeX, 148+ citations across 5 modules) into the existing v1.49.607 atlas + v1.49.621 SCRIBE substrates. The integration thesis: **the codebase is a territory; the atlas (v607) gave it a mirror; SCRIBE (v621) gave it a renderer; this milestone gives it a coordinate system.**

This is a counter-cadence operational milestone — engine state for NASA / MUS / ELC / SPS / TRS is unchanged. The work converts the codebase from "queryable + renderable" to "spatially-navigable" by absorbing six load-bearing GIS primitives:

1. **PostGIS extension** on the existing `atlas` schema — `geometry(Point/Polygon, 0)` columns + GiST indexes on `atlas.symbols`.
2. **Hybrid PostGIS + pgvector query** via the CTE-MATERIALIZED pattern that forces the spatial filter to lead and ranks survivors by IVFFlat cosine distance.
3. **Three new HTTP IPC routes** on `scripts/serve-dashboard.mjs` — `spatial-near`, `mission-bbox`, `tile-fetch`.
4. **Pure-TypeScript Turf-shaped browser primitives** (radiusCircle / haloIntersection / bboxIntersects) with zero npm dep cost.
5. **PMTiles v3 writer** — hand-rolled in TypeScript (pmtiles@4 npm is reader-only) with leaf-directory support, gzip-compressed root + leaves + JSON metadata, round-trip verified through the upstream reader.
6. **FlatGeobuf snapshot exporter** alongside the existing SQLite canonical store.

97,705 atlas symbols backfilled with deterministic synthetic positions; live PMTiles archive (5,461 tiles / 8.77 MB / z=0..6) generated. Independent code review surfaced 14 findings; all 14 fixed before ship — including 4 HIGH (LRU race / fd race / SQL JOIN semantics / unparameterized SQL fragment).

## Cross-track context

| Track | State | Note |
|---|---|---|
| NASA | 1.98 (Pioneer Venus 2) | HELD — counter-cadence; no degree advance |
| MUS | 1.98 | HELD |
| ELC | 1.98 | HELD |
| SPS | #95 | HELD |
| TRS | M1 W2 pack-20 set-theory | HELD |

## Substrate provider cross-reference

- **v1.49.607 — GSD Code Atlas.** Substrate baseline: PG mirror at `src/intelligence/atlas-pg/`, pgvector embedding column, IVFFlat index, browser shell at `desktop/intelligence/atlas/`, HTTP IPC bridge at `scripts/serve-dashboard.mjs`. v629 extends without modifying v607 surfaces.
- **v1.49.621 — SCRIBE Foundational Chipset.** 5 substrate-conformance invariants. v629 PMTiles writer is the missing tile-pyramid format that completes Track 4 dashboard-LoD-rendering's surface; SCRIBE invariants preserved.

## Headline structural firsts at v629

1. **First spatial primitive in the atlas** — `atlas.symbols.position geometry(Point, 0)` with `idx_atlas_symbols_position_gist`. 97,705 rows backfilled. Spatial-near queries return symbols ordered by `ST_Distance` in O(log n).
2. **Hybrid PostGIS + pgvector SQL composition lands as a first-class query path** — CTE-MATERIALIZED forces the GiST spatial filter to lead, IVFFlat HNSW ranks survivors. 10–100× latency improvement over a planner-default plan (per Part A research §2.4.6).
3. **Hand-rolled PMTiles v3 writer in TypeScript** — pmtiles@4 npm is reader-only; the canonical writer (`go-pmtiles`) is a Go CLI. v629 ships a 475-line TS writer (varint encoder + 127-byte header + leaf-directory split + gzip compression) that round-trips through the upstream reader on both root-only and leaf-dir paths.
4. **Independent code-review-driven shipping discipline** — `gsd-code-reviewer` agent produced REVIEW.md with 14 findings (4 HIGH / 5 MEDIUM / 3 LOW / 2 NIT); all 14 fixed before ship; live smoke tests verify HIGH/MED fixes against the running dashboard. First v1.49.x to ship through the agent-driven review loop.

## Forward state

- Predecessor (degree-advancing): v1.49.628 Pioneer Venus 2 Multiprobe
- Successor candidate: TBD per CSV cadence (next NASA degree resumes at v1.49.630+)
- 1 known follow-up: refcounted PMTiles archive close (HIGH-01 long-term fix; 30s grace window is the v629 interim).

## Chapter files

- [chapter/00-summary.md](chapter/00-summary.md) — structural firsts + engine state
- [chapter/03-retrospective.md](chapter/03-retrospective.md) — carryover lessons applied + new lessons captured
- [chapter/04-lessons.md](chapter/04-lessons.md) — forward lessons emitted
- [chapter/99-context.md](chapter/99-context.md) — engine-state tables

## Build artifacts shipped

No NASA/MUS/ELC/SPS public-site artifacts this milestone (counter-cadence). Substrate work; on-disk artifacts at:

- `src/atlas/spatial/` — 12 source files (~1,800 lines + tests)
- `desktop/intelligence/atlas/spatial/` — 4 source files (~600 lines + tests)
- `docs/adr/0004-hybrid-spatial-semantic-query.md`
- `docs/audits/v1.49-spatial-substrate-{conformance,license-audit,benchmark}.md`
- `.planning/missions/gis-spatial-substrate/research/mission.{pdf,tex}` (44pp Part A)
- `.planning/missions/gis-spatial-substrate/mission/` (Part B 8-component package)
- `.planning/missions/gis-spatial-substrate/REVIEW.md` (independent review)

## Key Features

| Track | Detail |
|---|---|
| NASA | 1.98 (Pioneer Venus 2; UNCHANGED) — counter-cadence |
| MUS | unchanged |
| ELC | unchanged |
| SPS | unchanged |
| TRS | unchanged |
| Atlas | PostGIS extension + GiST + hybrid query path; 97,705 positions backfilled |
| SCRIBE | Track 4 LoD substrate gains PMTiles v3 backing format |
| Public | No public artifacts (counter-cadence) |
| Test | 71 new spatial tests; full suite holds 30,387/30,428 passing |
