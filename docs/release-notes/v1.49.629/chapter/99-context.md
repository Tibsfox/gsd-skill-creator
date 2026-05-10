# v1.49.629 — Engine State Context

## Engine state tables (at v629 close)

### NASA / MUS / ELC / SPS / TRS

| Track | Degree / # | Mission | Change vs v628 |
|---|---|---|---|
| NASA | 1.98 | Pioneer Venus 2 Multiprobe | UNCHANGED (counter-cadence) |
| MUS | 1.98 | (predecessor pick) | UNCHANGED |
| ELC | 1.98 | (predecessor pick) | UNCHANGED |
| SPS | #95 | (predecessor pick) | UNCHANGED |
| TRS | M1 W2 pack-20 set-theory K_20 ~252 edges | (predecessor pick) | UNCHANGED |

### Atlas spatial substrate (NEW)

| Surface | State |
|---|---|
| PostGIS extension | 3.6.3 installed at cluster level |
| `atlas.symbols.position` (Point, SRID 0) | created; 97,705 rows backfilled |
| `atlas.symbols.bbox` (Polygon, SRID 0) | created; nullable; un-backfilled |
| `idx_atlas_symbols_position_gist` | created |
| `idx_atlas_symbols_bbox_gist` | created |
| pgvector + IVFFlat (existing v607) | preserved |
| `atlas.schema_version` | rows: {1, 4} (v607 baseline + v629 spatial) |

### IPC routes added on `scripts/serve-dashboard.mjs`

| Path | Method | Handler |
|---|---|---|
| `/api/atlas/spatial-near` | GET | `handleSpatialNear` (PostGIS ST_DWithin) |
| `/api/atlas/mission-bbox` | GET | `handleMissionBBox` (ST_Extent JOIN provenance) |
| `/api/atlas/tile-fetch` | GET | `handleTileFetch` (PMTiles range read) |

### Filesystem additions

| Path | Purpose |
|---|---|
| `src/atlas/spatial/` | 12 source files (~1,800 lines) |
| `src/atlas/spatial/__tests__/` | 4 test files (45 tests) |
| `src/atlas/spatial/migrations/004-postgis.sql` | applied |
| `src/atlas/spatial/migrations/INSTALL.md` | operator guide |
| `src/atlas/spatial/UPSTREAM-WIRING.md` | dep + version pinning |
| `src/atlas/spatial/server-ipc-wiring.md` | route registration ref |
| `desktop/intelligence/atlas/spatial/` | 4 source files + 26 tests |
| `docs/adr/0004-hybrid-spatial-semantic-query.md` | new ADR |
| `docs/audits/v1.49-spatial-substrate-conformance.md` | substrate audit |
| `docs/audits/v1.49-spatial-substrate-license-audit.md` | license audit |
| `docs/audits/v1.49-spatial-substrate-benchmark.md` | benchmark methodology |
| `.planning/missions/gis-spatial-substrate/research/mission.{pdf,tex}` | Part A 44-page research |
| `.planning/missions/gis-spatial-substrate/research/waves/` | W0/W1A/W1B/W2 wave outputs |
| `.planning/missions/gis-spatial-substrate/mission/` | Part B 13-file mission package |
| `.planning/missions/gis-spatial-substrate/REVIEW.md` | independent code review (14 findings, all fixed) |

### npm dependencies added (production)

| Package | Pinned | Installed | License |
|---|---|---|---|
| `pmtiles` | `^4` | 4.4.1 | BSD-3-Clause |
| `@mapbox/vector-tile` | `^2` | 2.0.4 | BSD-3-Clause |
| `@mapbox/point-geometry` | (transitive) | 1.x | ISC |
| `vt-pbf` | `^3` | 3.1.3 | MIT |
| `flatgeobuf` | `^4` | 4.4.0 | BSD-3-Clause |
| `lru-cache` | `^11` | 11.3.6 | BlueOak-1.0.0 |

### Test counts

| Surface | Tests | Δ vs v628 |
|---|---|---|
| `src/atlas/spatial/__tests__/` | 45 | +45 |
| `desktop/intelligence/atlas/spatial/__tests__/` | 26 | +26 |
| Spatial total | 71 | +71 |
| Full vitest suite | 30,387 / 30,428 (34 skipped, 7 todo, 0 failed) | +71 vs predecessor |

### Code review

| Finding severity | Count | Fixed at ship |
|---|---|---|
| HIGH | 4 | 4 |
| MEDIUM | 5 | 5 |
| LOW | 3 | 3 |
| NIT | 2 | 2 |
| Total | 14 | 14 |

### Cross-track preservation invariants

- **v607 substrate-conformance tests:** PASS unchanged
- **v621 SCRIBE substrate-conformance tests (5 invariants):** PASS unchanged
- **Migration reversibility:** rollback block in `004-postgis.sql` verified manually
- **License-clean composition:** zero GPL/LGPL/AGPL in runtime tree (verified via `npx license-checker --production`)
- **Backwards compat:** existing 13 `/api/atlas/*` routes continue to respond identically; pgvector IVFFlat index untouched; SQLite canonical store untouched

## Predecessor → successor map

```
v1.49.628 (NASA 1.98, degree-advancing)
   └─→ v1.49.629 (counter-cadence; spatial substrate; engine state preserved)
          └─→ v1.49.630+ (next degree-advancing per CSV cadence; resumes NASA track)
```
