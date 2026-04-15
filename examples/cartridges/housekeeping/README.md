# housekeeping

Housekeeping, data management, and archiving cartridge. Covers the
full custodial surface — repo hygiene, gitignore policy, stale-file
detection, log retention, snapshots, cold archive, dataset lifecycle,
naming conventions, content-addressed dedup, storage tiering, restore
drills, media and format migration, and retention-policy audits.

Ships **both** as an in-tree example under `examples/cartridges/` **and**
as a core cartridge that installs into every gsd-skill-creator harness
via `project-claude/manifest.json`. Any project that runs
`node project-claude/install.cjs` picks up `.claude/cartridges/housekeeping/`
on day one.

## The one rule

**Archive, never delete.** Every skill in this cartridge is built
around it. Logs rotate into dated archive bundles; stale-file scans
produce evidence reports, not deletion commands; retention audits
surface findings for human review; cold-archive moves recycle the
live copy only after the cold copy has been verified. Destructive
action is always gated on explicit human approval at `housekeeping-capcom`.

This matches the standing project rules: session logs are never
deleted (only archived), docs are the story, and `.planning/`
stays untracked rather than deleted.

## Shape

- **14 skills** — repo-hygiene, gitignore-policy, stale-file-detection,
  log-retention-and-archival, snapshot-and-backup-policy,
  cold-archive-operations, dataset-lifecycle,
  naming-and-layout-conventions, dedup-and-content-addressing,
  storage-tiering, **housekeeping-grove-memory**, restore-drill,
  media-and-format-migration, retention-policy-enforcement.
- **5 agents** — housekeeping-capcom (Opus capcom), archivist,
  curator (Sonnet), steward (Sonnet), retention-auditor.
- **5 teams** — housekeeping-sweep-team, dataset-curation-team,
  archive-migration-team, restore-drill-team, retention-audit-team.
- **11 grove record types** — HousekeepingSweep, StaleFileReport,
  SnapshotRecord, ArchiveEntry, DatasetLifecycleEvent, DedupReport,
  RetentionPolicy, RetentionAudit, RestoreDrillResult,
  MediaMigration, GroveActivityLog.
- **3 chipsets** — `department`, `grove`, `evaluation`.

## Grove as the custodial ledger

Housekeeping produces a lot of evidence — sweeps, stale-file reports,
snapshots, archive manifests, dedup findings, audits, drill results,
media migrations. Grove is where that evidence lives, and content
addressing makes it audit-grade:

1. **Replay** — the full custodial history of a project can be
   rehydrated by walking `GroveActivityLog` and reconstructing
   `HousekeepingSweep` → `StaleFileReport` → `ArchiveEntry` →
   `SnapshotRecord` → `DedupReport` → `RestoreDrillResult` →
   `RetentionAudit` in order.
2. **Drift detection** — two sweeps of the same scope can be diffed
   by content hash to see what actually moved.
3. **Verified archives** — an `ArchiveEntry` is only counted as a
   successful archive once it has at least one green
   `RestoreDrillResult` within its policy window. An unverified
   archive is an assertion, not a backup.
4. **Cross-cartridge linking** — a `ReleaseRecord` from the
   release-engine cartridge can reference the `ArchiveEntry` that
   preserved its shipped state; a `DebugSession` from the
   get-shit-done cartridge can reference the `SnapshotRecord`
   taken before the incident.
5. **Activity-log integrity** — every sweep, archive, snapshot,
   dedup, audit, drill, and migration is signed and appended so
   "who archived what, when, and why" is always queryable.

The `housekeeping-grove-memory` skill is the single owner of the
grove surface — import, export, query, diff, signature verification,
activity-log replay, namespace queries, and arena-snapshot migration.

## Load + validate

```
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
skill-creator cartridge dedup ./cartridge.yaml
skill-creator cartridge metrics ./cartridge.yaml
```

All four gates are green as of the forge commit.

## Relationship to other cartridges

- **get-shit-done** owns research → plan → execute → verify.
- **release-engine** owns package → ship → retro → flywheel.
- **housekeeping** owns hygiene → archive → verify → audit.

The three cartridges are designed to compose. A `ReleaseRecord`
gets its precondition `VerificationResult` from `get-shit-done` and
its preservation `ArchiveEntry` from `housekeeping`. Cross-cartridge
links travel through grove content addresses.

## Forged via

`cartridge-forge` skill, `department` template, gates run in this
order: scaffold → fill → scaffold-companions → validate → eval →
dedup → metrics.
