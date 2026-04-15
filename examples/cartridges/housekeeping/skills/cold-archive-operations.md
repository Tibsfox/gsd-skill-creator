# cold-archive-operations

Move data into cold-tier storage. Covers the mechanical side — packaging (tar/zstd/borg/restic), content-hash computation, manifest generation, upload to the cold target, and the removal of the live copy only after the cold copy has been verified. Each move produces an ArchiveEntry with `from_path`, `to_target`, content hash, manifest, and verification verdict.

**Triggers:** `archive to cold`, `cold storage`, `pack archive`, `offsite archive`, `archive manifest`, `move to cold tier`

**Affinity:** `housekeeping-capcom`, `archivist`
