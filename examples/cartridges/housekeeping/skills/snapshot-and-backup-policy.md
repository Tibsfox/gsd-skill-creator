# snapshot-and-backup-policy

Define and operate the snapshot schedule. Owns the policy that says which paths get snapshotted, how often, which tier they land in, and how long each tier holds. Runs the scheduled snapshots, captures a SnapshotRecord with scope + content hash + tier, and emits a warning when a scheduled snapshot is overdue. Distinct from single-file archive — a snapshot is a consistent point-in-time of a whole tree.

**Triggers:** `take snapshot`, `snapshot schedule`, `backup policy`, `snapshot tier`, `overdue snapshot`, `point in time`

**Affinity:** `housekeeping-capcom`, `archivist`
