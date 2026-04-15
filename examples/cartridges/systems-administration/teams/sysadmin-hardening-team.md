---
name: sysadmin-hardening-team
description: Apply or audit a host security baseline — security-officer owns policy, operator applies changes, architect approves exceptions.
---

# sysadmin-hardening-team

Use this team when onboarding a new host, running a hardening
sprint, or preparing for a compliance audit.

## Roster

- `sysadmin-security-officer` — owns the baseline spec and diff interpretation
- `sysadmin-operator` — applies mechanical changes and records `OpsRun` entries
- `sysadmin-architect` — approves any baseline exceptions and routes work

## Output

- A `HardeningBaseline` grove record capturing the post-sprint state
- A list of approved exceptions with justifications and review dates
- An updated `RunbookEntry` if the baseline spec itself changed
