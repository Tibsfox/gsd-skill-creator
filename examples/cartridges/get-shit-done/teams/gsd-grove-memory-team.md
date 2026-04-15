# gsd-grove-memory-team

Maintain the grove memory substrate. Capcom coordinates import/export runs, executor applies migrations between arena snapshots, verifier cross-checks record integrity (content hash + signature + activity-log replay). Run this team whenever grove state moves — new project, new namespace, cross-cartridge link, or arena upgrade.

**Roster:** `gsd-capcom`, `gsd-executor`, `gsd-verifier`.

**Use when:** importing, migrating, or auditing grove memory state
