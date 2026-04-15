---
name: sysadmin-incident-team
description: Live outage response — incident-responder drives triage, operator executes stabilization, architect handles escalation.
---

# sysadmin-incident-team

Use this team the moment a production host is unhealthy and user
impact is real or imminent.

## Roster

- `sysadmin-incident-responder` — runs the triage loop and writes the `IncidentTimeline`
- `sysadmin-operator` — executes stabilization commands under the responder's direction
- `sysadmin-architect` — owns escalation, comms, and the decision to involve other departments

## Output

- A completed `IncidentTimeline` grove record
- A short first-pass hypothesis for RCA
- A list of runbook gaps the incident revealed
