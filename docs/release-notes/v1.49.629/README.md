# v1.49.629 — GIS Spatial Substrate (counter-cadence)

**Released:** 2026-05-10
**Type:** Counter-cadence operational milestone (no NASA/MUS/ELC/SPS engine advance)
**Predecessor:** v1.49.628 (Pioneer Venus 2 Multiprobe; degree-advancing)
**Mission package:** `.planning/missions/gis-spatial-substrate/`

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.629 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** GIS Spatial Substrate ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

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
|## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

---|---|---|
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
