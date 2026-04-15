# Systems Administration

A full cartridge for Linux/Unix systems administration. Covers
the daily surface area of a working sysadmin — users and access,
packages and patches, services, filesystems and storage,
networking and firewall, backup and restore, logging and audit,
monitoring, scheduling, hardening, incident triage, and capacity
planning.

Slug: `systems-administration`
Trust: `user`

## Shape

- **12 skills** — one per daily responsibility surface
- **5 agents** — architect (capcom), operator, incident-responder, security-officer, backup-custodian
- **4 teams** — runbook, incident, hardening, DR drill
- **6 grove record types** — OpsRun, IncidentTimeline, RunbookEntry, BackupVerification, HardeningBaseline, ChangeRecord

## Agent topology

Router-style, with `sysadmin-architect` as the capcom. Routine
work routes to `sysadmin-operator`, live incidents to
`sysadmin-incident-responder`, security-sensitive changes to
`sysadmin-security-officer`, and backup / DR work to
`sysadmin-backup-custodian`.

## Philosophy

Three rules underwrite every skill in this cartridge:

1. **Every non-trivial change is a `ChangeRecord`** — preconditions,
   steps, rollback, verification.
2. **A backup you have not restored is not a backup.** It is a hope.
   The `sysadmin-dr-drill-team` exists to convert hopes into
   verifications.
3. **Stabilize, then understand.** During an incident, restoring
   service is always the first job; root cause analysis comes after
   the host is healthy.

## Load + validate

```
skill-creator cartridge load ./cartridge.yaml
skill-creator cartridge validate ./cartridge.yaml --allow-validation-debt
skill-creator cartridge metrics ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
```

## Status

Scaffolded 2026-04-14 via `cartridge-forge`. First-pass content —
ready for iteration, not yet benchmarked. See
`docs/cartridge/FORGING-GUIDE.md` for the forge workflow.
