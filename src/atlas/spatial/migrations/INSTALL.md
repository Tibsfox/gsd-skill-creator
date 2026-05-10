# Atlas Spatial Substrate — Migration Install Guide

**Status:** Migration `004-postgis.sql` is authored and idempotent, but the `CREATE EXTENSION postgis;` line requires PostgreSQL superuser privilege. The `maple` role used by the atlas mirror is the database owner but is not a cluster superuser; therefore the migration cannot be applied automatically by the runtime.

## One-time superuser step

Run as a PostgreSQL superuser (typically `postgres` on a default install):

```bash
sudo -u postgres psql -d tibsfox -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Or, if connecting remotely as the `postgres` role:

```bash
PGPASSWORD=<postgres-password> psql -h localhost -U postgres -d tibsfox \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Verify:

```bash
PGPASSWORD="$(grep -E '^PGPASSWORD=' .env | cut -d= -f2-)" \
  psql -h localhost -U maple -d tibsfox \
  -tAc "SELECT extname, extversion FROM pg_extension WHERE extname='postgis';"
```

Expected output: `postgis|3.6.3` (or later).

## Apply the rest of the migration as the maple role

Once the extension is in place, the rest of the migration runs cleanly under the existing `maple` connection (which owns the `atlas.*` schema):

```bash
PGPASSWORD="$(grep -E '^PGPASSWORD=' .env | cut -d= -f2-)" \
  psql -h localhost -U maple -d tibsfox \
  -f src/atlas/spatial/migrations/004-postgis.sql
```

The migration uses `BEGIN; ... COMMIT;` and `IF NOT EXISTS` everywhere, so it is safe to re-run. Subsequent runs no-op cleanly.

## Verify post-install

```bash
PGPASSWORD="$(grep -E '^PGPASSWORD=' .env | cut -d= -f2-)" \
  psql -h localhost -U maple -d tibsfox -tAc "
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema='atlas' AND table_name='symbols'
      AND column_name IN ('position', 'bbox')
    ORDER BY column_name;
  "
```

Expected:
```
bbox|USER-DEFINED|geometry
position|USER-DEFINED|geometry
```

```bash
PGPASSWORD="$(grep -E '^PGPASSWORD=' .env | cut -d= -f2-)" \
  psql -h localhost -U maple -d tibsfox -tAc "
    SELECT indexname FROM pg_indexes
    WHERE schemaname='atlas' AND tablename='symbols'
      AND indexname LIKE '%gist%'
    ORDER BY indexname;
  "
```

Expected:
```
idx_atlas_symbols_bbox_gist
idx_atlas_symbols_position_gist
```

## Backfill (optional)

The `position` column is nullable. Symbols inserted after the migration carry NULL until populated by the layout pass (separate component). The hybrid query layer in `src/atlas/spatial/hybrid-query.ts` filters `position IS NOT NULL` so partial backfill is correct.

For an immediate test fixture, populate a sample of points:

```sql
UPDATE atlas.symbols
SET position = ST_SetSRID(
  ST_MakePoint(
    -- deterministic synthetic position from id hash, in [0, 1000) per axis
    (abs(hashtextextended(id, 0)) % 1000)::float,
    (abs(hashtextextended(id, 1)) % 1000)::float
  ),
  0
)
WHERE position IS NULL
LIMIT 1000;
```

## Rollback

If the migration ever needs to be reversed (e.g. the spatial substrate is being retired):

```sql
BEGIN;
DROP INDEX IF EXISTS atlas.idx_atlas_symbols_bbox_gist;
DROP INDEX IF EXISTS atlas.idx_atlas_symbols_position_gist;
ALTER TABLE atlas.symbols DROP COLUMN IF EXISTS bbox;
ALTER TABLE atlas.symbols DROP COLUMN IF EXISTS position;
DELETE FROM atlas.schema_version WHERE version = 4;
-- The PostGIS extension itself is left installed — other tables / projects
-- may rely on it. Drop it only if you know nothing else uses it:
--   DROP EXTENSION postgis;  -- (do not run unless certain)
COMMIT;
```
