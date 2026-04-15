# media-and-format-migration

Migrate archives between media and between formats as the old ones age out — tar → zstd-packed, borg-v1 → borg-v2, LTO → object storage, deprecated codecs → current. Produces a MediaMigration record per move with source content hash, target content hash, format delta, and tool versions so the migration is itself reproducible.

**Triggers:** `migrate archive format`, `format migration`, `media migration`, `codec upgrade`, `borg upgrade`, `lto to object`

**Affinity:** `housekeeping-capcom`, `archivist`
