# codebase-mapping

Build and refresh the project intel pack via `/gsd map-codebase`. Spawns parallel codebase-mapper runs for tech / arch / quality / concerns, writes structured intel files, and keeps `.planning/intel/` synchronized with the real state of the repo.

**Triggers:** `map codebase`, `codebase intel`, `refresh intel`, `architecture snapshot`, `project intel`

**Affinity:** `gsd-capcom`, `gsd-codebase-mapper`
