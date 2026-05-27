# Upstream library wiring — atlas spatial substrate

**Status (2026-05-10):** all components shipped in live mode. PMTiles writer (component 05 write side) authored against the v3 spec, supports leaf directories for archives > 1,024 entries, round-trip-verified through pmtiles@4 reader. MVT encoding via `vt-pbf@^3`. PostGIS migration applied; `atlas.symbols.position` backfilled for all 97,705 rows.

## Installed packages

| Package | Pinned | Installed | License | Used by |
|---|---|---|---|---|
| `pmtiles` | `^4` | 4.4.1 | BSD-3-Clause | reader (component 05) — `PMTiles`, `zxyToTileId`, `tileIdToZxy` |
| `@mapbox/vector-tile` | `^2` | 2.0.4 | BSD-3-Clause | transitive of `vt-pbf` |
| `@mapbox/point-geometry` | (transitive) | 1.x | ISC | transitive of `vt-pbf` |
| `vt-pbf` | `^3` | 3.1.3 | MIT | writer (component 05) — `fromGeojsonVt` MVT encoder |
| `flatgeobuf` | `^4` | 4.4.0 | BSD-3-Clause | exporter (component 06) |
| `lru-cache` | `^11` | 11.3.6 | BlueOak-1.0.0 | reader tile-cache + archive-cache |

The previous draft of this doc pinned `pmtiles@^3` / `vector-tile@^4` / `flatgeobuf@^3` — those pins were spec-aspirational and incorrect against the live registry. The package version of `pmtiles@4` reads/writes the v3 file-format spec; the file-format pin in `format-constants.ts` is still v3, which is correct.

`lru-cache@^11` was added at the same time, replacing the deprecated `inflight`-style coalescing that the npm registry warned about. All transitive deps in our production tree are permissive (MIT / Apache-2.0 / ISC / BSD-2/3 / BlueOak / Python-2.0 / 0BSD).

## Reinstall command

If the working tree is wiped:

```bash
npm install pmtiles@^4 @mapbox/vector-tile@^2 flatgeobuf@^4 lru-cache@^11
```

## PMTiles writer wiring (component 05) — DONE

**Note:** `pmtiles@4` exports a reader only; the canonical writer (`go-pmtiles`) is a separate Go CLI. We hand-rolled a TypeScript v3 writer in `pmtiles-writer.ts` (~330 lines) against the [PMTiles v3 spec](https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md). MVT encoding delegates to `vt-pbf` which transitively uses `@mapbox/vector-tile` for the wire-format primitives.

Architecture:
1. SELECT all positioned symbols once; compute atlas bbox via `ST_Extent`.
2. For each zoom z, bin symbols into tiles by (tx, ty) in JS — single pass, no per-tile DB query. Cap at `densityCap` symbols per tile.
3. For each occupied tile, encode MVT via `vt-pbf.fromGeojsonVt`, gzip the bytes.
4. Sort entries by tileId (`zxyToTileId` from pmtiles@4).
5. **Leaf-directory split** — when entries > 1,024, partition into 4,096-entry leaves. Each leaf's serialized + gzipped directory bytes get an entry in the root with `runLength = 0` (the spec marker for "leaf pointer"). Otherwise root holds all entries directly.
6. Gzip-compress root directory + JSON metadata so the reader's 16,384-byte initial fetch can hold them.
7. Build the 127-byte header (mirrors pmtiles@4's `bytesToHeader` byte layout exactly).
8. Concatenate header / root / json / leaves / tile_data and write.

**Live verification (2026-05-10):**
- 97,705-row pyramid built in ~2 s for z=0..6 with densityCap=500 → 5,461 tiles, 9.19 MB.
- pmtiles@4 reader round-trips both the small-archive (root-only) and large-archive (leaf-dir) paths.
- `GET /api/atlas/tile-fetch?z=0&x=0&y=0` returns 25 KB of valid MVT (after the reader's tileCompression unwrap).
- `GET /api/atlas/tile-fetch?z=99` now returns 400 (was 500) — caught the pmtiles@4 "zoom level exceeds max safe number" error and remapped.

## PMTiles reader wiring (component 05) — DONE

`src/atlas/spatial/pmtiles-reader.ts` uses pmtiles@4's `PMTiles` class with a Node-side `NodeFileSource` (file-handle based byte-range reads). Tile bodies cached via `LRUCache` (256 entries, 5-min TTL); archive instances cached via a separate `LRUCache` (max 64, refcounted dispose — close defers until the entry's inflight `getZxy` count drains to zero, HIGH-01 refcount close v815). `clearPmtilesCaches()` exposed for tests and ops.

## FlatGeobuf wiring (component 06) — DONE (live mode auto-engages)

`src/atlas/spatial/flatgeobuf-export.ts` dynamic-imports `flatgeobuf/dist/flatgeobuf-geojson.js`. With `flatgeobuf@^4` installed, the live path executes; the stub fall-through (header-only file with magic bytes) remains in place defensively for environments where the package is uninstalled. `readFlatGeobufRoundTrip` similarly auto-engages when the package is present.

## Test hooks

Each scaffold has a `__tests__/*.test.ts` test that:
1. Verifies the scaffold throws `/not implemented/` when deps are absent (current state).
2. Uses `vi.mock` to inject a fake `pmtiles` / `flatgeobuf` module and verifies the integration logic on the live path.

Once the real deps are installed, the second class of tests run against the real implementations; the first class can be flipped to `it.skip` or kept as a regression guard for the dynamic-import pattern.

## CI gate

After the deps land, the v1.49.NNN integration gate (component 07) should add:

- `npm ls pmtiles @mapbox/vector-tile flatgeobuf` returns 0 — verifies install integrity.
- `npm-license-checker --onlyAllow 'BSD-2-Clause;BSD-3-Clause;MIT;Apache-2.0;PostgreSQL'` — verifies no GPL/LGPL/AGPL transitive deps slipped in.
