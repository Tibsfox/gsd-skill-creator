# Atlas spatial IPC — wiring into `scripts/serve-dashboard.mjs`

Component 02 of the gis-spatial-substrate mission. **Status: shipped 2026-05-10.** The 3 routes are wired into the live dashboard at `scripts/serve-dashboard.mjs:1733-1801` and dispatch to the compiled handlers in `src/atlas/spatial/server-ipc.ts`.

## Active routes

| Path | Method | Handler | DB |
|---|---|---|---|
| `/api/atlas/spatial-near` | GET | `handleSpatialNear` | atlas.symbols + GiST |
| `/api/atlas/mission-bbox` | GET | `handleMissionBBox` | atlas.symbols ⨯ mission_provenance |
| `/api/atlas/tile-fetch` | GET | `handleTileFetch` | (file-system PMTiles via `pmtiles-reader.ts`) |

## Connection model

Each request opens a one-shot `pg.Client` from the existing `RH_POSTGRES_URL` / `PGHOST`+`PGUSER`+`PGPASSWORD`+`PGDATABASE` env vars (same scheme the `/api/atlas/snapshots` route uses), dispatches to the handler, and closes the client in a `finally` block. No pool — the routes are infrequent and short-lived.

503 fallbacks are wired for: missing `dist/atlas/spatial/server-ipc.js` (build hasn't run), missing `pg` module, or pg connect failure.

## Verified smoke tests (2026-05-10)

```bash
node scripts/serve-dashboard.mjs --port 3033 &
sleep 3

# 400 — parameter validation
curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost:3033/api/atlas/spatial-near
# → 400

# 200 — valid call, empty result (position columns NULL pre-backfill)
curl -s 'http://localhost:3033/api/atlas/spatial-near?x=100&y=200&radius=300&limit=5'
# → {"symbols":[]}

curl -s 'http://localhost:3033/api/atlas/mission-bbox?project_id=foo'
# → {"error":"mission-bbox: project_id and mission_id are required"}

curl -s 'http://localhost:3033/api/atlas/tile-fetch?z=0'
# → {"error":"tile-fetch: z, x, y are required and must be integers"}
```

The empty-symbols 200 response confirms the SQL path is live (PostGIS extension installed, GiST index active, CTE-MATERIALIZED query plan executes); rows return empty until the symbol-graph layout pass populates `atlas.symbols.position`.

## Tile cache

`pmtiles-reader.ts` uses an `lru-cache@^11` (max 256 entries, 5-min TTL) for tile bodies plus a separate LRU (max 64) for `PMTiles` archive instances. Archive `dispose` is refcounted — the underlying file-handle close defers until the entry's inflight `getZxy` count drains to zero (HIGH-01 refcount close v815). Caches are cleared via `clearPmtilesCaches()` (test hook) or by restarting the server.

The legacy `inflight` deprecation pattern is intentionally avoided — `lru-cache@^11` is the upstream-recommended replacement.
