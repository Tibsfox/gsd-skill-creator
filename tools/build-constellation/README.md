# build-constellation

Source-of-truth pipeline for `tibsfox.com/Research/constellation.html`.

The page used to hard-code ~786 nodes and ~1,628 edges as inline JS. The data
now lives in **MySQL on tibsfox.com** (`tibsfox2_claudefox`), is served live
via PHP, and is mirrored to a static JSON snapshot for fallback when PHP is
down.

## Architecture

```
                 ┌──────────────────────────────────────┐
                 │  Local PG (staging / scratchpad)     │
                 │  schema constellation.* (5 tables)   │
                 └──────────────┬───────────────────────┘
                                │ emit-mysql-seed.mjs
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │  Remote MySQL — tibsfox2_claudefox (HostPapa)           │
   │  artists, species, nasa_missions  ← new extension tables│
   │  projects, cross_refs, rosetta_*  ← pre-existing        │
   └────────┬───────────────────────────┬────────────────────┘
            │ live read (PDO)           │ snapshot read (mysql2)
            ▼                           ▼
   ┌──────────────────┐     ┌──────────────────────────────────┐
   │  api.php         │     │  snapshot-mysql.mjs              │
   │  ?type=all|...   │     │  → www/.../constellation/*.json  │
   └────────┬─────────┘     └─────────────┬────────────────────┘
            │                              │ FTP
            ▼                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │  constellation.html — bootstrap                          │
   │  1. fetch api.php?type=all  (live, ~60s cache)           │
   │  2. on any failure → fetch manifest.json + 6 payloads    │
   │  3. reshape into legacy in-memory globals → initRenderer │
   └──────────────────────────────────────────────────────────┘
```

## Stages and tools

| File | Tier | Purpose |
|---|---|---|
| `schema.sql` | local PG | scratchpad schema (5 tables) |
| `schema.mysql.sql` | remote MySQL | extension tables (`artists`, `species`, `nasa_missions`, `build_log`) — piggy-backs on existing `projects` / `cross_refs` |
| `seed-from-html.mjs` | local PG | one-time backfill from inline data in `constellation.html` |
| `augment-nasa.mjs` | local PG | pulls 449 NASA catalog rows under `M<version>` ids |
| `build.mjs` | local PG → JSON | dump local PG to JSON (legacy / staging) |
| `emit-mysql-seed.mjs` | local PG → SQL | emit MySQL INSERTs for content not yet in remote DB |
| `snapshot-mysql.mjs` | remote MySQL → JSON | **production**: dump live MySQL to static fallback JSON |
| `api.php` (in `www/.../constellation/`) | remote MySQL → HTTP | live read endpoint, called by the page first |
| `config.php` | host-side | DB credentials, gitignored, FTP'd separately |

## Connection details

- **Local PG**: localhost:5432 / `maple` / db `tibsfox`. Used for staging only;
  `.env` has `PGHOST/PGUSER/PGPASSWORD/PGDATABASE`.
- **Remote MySQL**: `216.222.199.72:3306` / `tibsfox2_claudefox`. Remote MySQL is
  enabled in cPanel; the dev machine's IP is whitelisted. `.env` has
  `DB_HOST/DB_NAME/DB_USER/DB_PASS/DB_PORT`. From the cPanel host itself
  (`api.php`), `DB_HOST` should be `localhost`; from this dev box, override via
  `DB_HOST_REMOTE=216.222.199.72`.
- **FTP**: lftp via `.env` `FTP_HOST/FTP_USER/FTP_PASS`. Plain FTP, port 21.

## Per-release flow

1. (If catalog changed) `node tools/build-constellation/augment-nasa.mjs` to
   pull new catalog rows into local PG.
2. `node tools/build-constellation/emit-mysql-seed.mjs | mysql -h … …` to push
   any new content into remote MySQL.
3. `node tools/build-constellation/snapshot-mysql.mjs` to refresh the static
   JSON fallback under `www/.../Research/constellation/`.
4. FTP sync picks up the new JSON. The page already serves live from
   `api.php`; the JSON is the safety net.

## Frontend behavior

`constellation.html` boots in this order:

1. `fetch('constellation/api.php?type=all')` — single round-trip, returns
   the full graph from MySQL.
2. On any failure (HTTP error, JSON parse error, payload missing) →
   `fetch('constellation/manifest.json')` + the six payload files.
3. Reshape into the legacy `CLUSTERS / PROJECTS / EDGES / ARTIST_DATA /
   SPECIES_DATA / NASA_DATA` globals; call `initRenderer()`.
4. Stamp the stats bar with `· live (api.php)` or `· static snapshot · built
   YYYY-MM-DD` so the source is visible without DevTools.

## Smoke tests

```sh
# Bootstrap reshape against served JSON (counts match manifest, no orphan edges)
node /tmp/smoke-constellation.mjs

# Check live API
curl -s 'https://tibsfox.com/Research/constellation/api.php?type=manifest' | jq

# Check static fallback
curl -s 'https://tibsfox.com/Research/constellation/manifest.json' | jq
```

## Schema notes

- Node ids preserve legacy short codes (`ABL`, `S36`, `A042`, `B017`, `N107`,
  `NART`, …) for hand-curated content. New NASA catalog rows use `M<version>`
  (e.g. `M1.42`) so they don't collide.
- Cluster colors stay on the page (Material palette) — `rosetta_clusters` in
  MySQL uses Tailwind colors for a different visualization. `api.php` overlays
  the constellation palette onto live cluster names so the two use cases stay
  decoupled.
- `cross_refs.ref_type` is an enum (`cites|extends|pairs|bridges`); current
  seed inserts everything as `cites` since the legacy data didn't distinguish.

## Future work

- Move `PAIRINGS` (still inline in `constellation.html`) into MySQL.
- Generate chronological edges between adjacent NASA catalog versions so the
  449 newly added M-namespace missions form a visible timeline instead of a
  cloud near the Space cluster.
- Wire `tools/build-constellation/snapshot-mysql.mjs` into the existing
  `scripts/sync-research-to-live.sh` post-release hook.
