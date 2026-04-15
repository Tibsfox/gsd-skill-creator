---
name: sysadmin-dr-drill-team
description: Run a disaster-recovery drill end-to-end — backup-custodian restores, architect validates RPO/RTO, security-officer checks the recovered baseline.
---

# sysadmin-dr-drill-team

Use this team for scheduled DR drills and for pre-change safety
checks on data-critical hosts.

## Roster

- `sysadmin-backup-custodian` — restores into the staging target
- `sysadmin-architect` — validates achieved RPO and RTO against the runbook
- `sysadmin-security-officer` — confirms the restored image still meets the hardening baseline

## Output

A `BackupVerification` grove record with scope, generation
restored, achieved RPO, achieved RTO, integrity outcome, and
hardening-baseline pass/fail.

## Cadence

Monthly by default. The drill is the gate that lets us keep
calling the backups "real" instead of "hopeful."
