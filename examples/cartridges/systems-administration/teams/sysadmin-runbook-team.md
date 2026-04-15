---
name: sysadmin-runbook-team
description: Build a new runbook end-to-end — architect decomposes, operator drafts steps, security-officer reviews blast radius.
---

# sysadmin-runbook-team

Use this team when authoring a new operational procedure or
updating an existing one.

## Roster

- `sysadmin-architect` — owns shape, preconditions, rollback, and verification criteria
- `sysadmin-operator` — drafts the mechanical steps and records the command line reality
- `sysadmin-security-officer` — reviews blast radius, approval path, and drift impact

## Output

A `RunbookEntry` grove record with four sections —
**preconditions, steps, rollback, verification** — plus the
date of last staging-host walkthrough and the signing
sysadmin.
