# v1.49.629 — Summary (structural firsts + engine state)

## Structural firsts

1. **First spatial primitive in the atlas mirror** — `atlas.symbols.position geometry(Point, 0)` + `atlas.symbols.bbox geometry(Polygon, 0)` columns with GiST indexes on both. 97,705 rows backfilled with deterministic synthetic positions in [0..999]² via `abs(hashtextextended(id, seed)) % 1000`. PostGIS 3.6.3 installed at the cluster level (one-time superuser step); v629 schema migration (`004-postgis.sql`) is additive only and reversible.

2. **Hybrid PostGIS + pgvector query composition** — `src/atlas/spatial/hybrid-query.ts` ships the CTE-MATERIALIZED pattern that forces the GiST spatial filter to lead and ranks survivors by IVFFlat cosine distance. Bound parameters throughout (no template-literal SQL injection risk; SRID at $7 not interpolated). EXPLAIN-plan-shape verifier asserts GiST scan precedes vector ordering.

3. **Three new HTTP IPC routes** mounted on the existing v607 W4c dashboard bridge:
   - `GET /api/atlas/spatial-near` — radius search via ST_DWithin
   - `GET /api/atlas/mission-bbox` — ST_Extent of symbols touched by a mission's commits (provenance JOIN)
   - `GET /api/atlas/tile-fetch` — PMTiles tile fetch via local file source

4. **Pure-TypeScript Turf.js-shaped browser primitives** — `desktop/intelligence/atlas/spatial/turf-like.ts` ships radiusCircle / symbolHalo / haloIntersection / bboxIntersects with zero npm-dependency cost. Drop-in upgrade path to `@turf/*` documented but not required.

5. **Hand-rolled PMTiles v3 writer in TypeScript** — pmtiles@4 npm is reader-only; the canonical writer (`go-pmtiles`) is a Go CLI. v629 ships a 475-line TS writer with: varint encoder, 127-byte header (mirrors the reader's `bytesToHeader` byte-for-byte), leaf-directory split when entries > 1,024, gzip-compressed root + leaves + JSON metadata. MVT encoding via `vt-pbf@^3` (MIT). Round-trip verified through pmtiles@4 reader on both root-only and leaf-dir paths.

6. **FlatGeobuf snapshot exporter** as a write-through static-file mirror alongside SQLite canonical and PMTiles tile-pyramid. Stub fall-through with magic-bytes-only file when upstream package absent; live mode auto-engages when present.

7. **Independent agent-driven code review prior to ship** — first v1.49.x to ship through the gsd-code-reviewer agent loop. Reviewer surfaced 14 findings (4 HIGH / 5 MEDIUM / 3 LOW / 2 NIT); all 14 fixed before tag.

## Engine state at v629 close

- **NASA:** degree 1.98 Pioneer Venus 2 Multiprobe (UNCHANGED — counter-cadence)
- **MUS:** 1.98 (UNCHANGED)
- **ELC:** 1.98 (UNCHANGED)
- **SPS:** #95 (UNCHANGED)
- **TRS:** M1 W2 pack-20 set-theory (UNCHANGED)
- **Atlas spatial substrate:** NEW — PostGIS 3.6.3 + GiST indexes + hybrid query + 97,705 positions backfilled
- **PMTiles writer:** NEW — TypeScript v3 binary writer + vt-pbf MVT encoder
- **Test count:** 71 new spatial tests (across `src/atlas/spatial/__tests__/` and `desktop/intelligence/atlas/spatial/__tests__/`); full vitest holds 30,387/30,428 passing.
- **New permissive deps:** pmtiles@4.4.1 (BSD-3) · @mapbox/vector-tile@2.0.4 (BSD-3) · @mapbox/point-geometry@1.x (ISC) · vt-pbf@3.1.3 (MIT) · flatgeobuf@4.4.0 (BSD-3) · lru-cache@11.3.6 (BlueOak-1.0.0). Zero GPL/LGPL kernels in the runtime tree.

## Through-line

The Amiga Principle: do not invent the primitive that has already been hardened. PostGIS is 25 years old. PROJ is 30 years old. R-trees are 41 years old (Guttman 1984). The OGC standards predate the modern web. v629 inherits the geometry layer that has been waiting half a century for the codebase to admit it is a territory and ask for the coordinates.
