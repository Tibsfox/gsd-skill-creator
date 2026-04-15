---
name: backup-and-restore
description: Operate rsync, borg, restic, and ZFS send/recv with retention, encryption, and verified restore drills.
---

# backup-and-restore

Own the data-durability surface. Run the backup jobs, prune old
generations on schedule, ship copies offsite, and — the part that
makes the backup actually real — test-restore on a cadence.

## Guiding rule

> A backup you have not restored is not a backup. It is a hope.

Every restore drill produces a `BackupVerification` grove record
with scope, achieved RPO, achieved RTO, and integrity outcome.

## Operations

- `borg create`, `borg prune`, `borg check --verify-data`
- `restic backup`, `restic forget --prune`, `restic check`
- `rsync -aHAX --numeric-ids --delete` for whole-host mirrors
- `zfs send -i <snap1> <snap2> | ssh offsite zfs recv ...`

## Retention pattern

Keep daily for 14 days, weekly for 8 weeks, monthly for 12 months,
yearly for as long as compliance requires. Offsite copies lag onsite
by at most one generation.
