# Systems Operations

A full cartridge for production systems operations and SRE-adjacent
runtime work — the companion to `systems-administration`, which covers
host-level surface area. Where sysadmin asks "what is this machine?",
sysops asks "what is this fleet doing right now, and what happens if
it fails?".

## Shape

- **12 skills** across 12 domains (incident, release, change, slo,
  observability, alerting, runbook, capacity, config, chaos,
  postmortem, readiness)
- **5 agents** in a router topology with `sysops-commander` as capcom
- **5 teams** — incident, release, readiness, game-day, postmortem
- **8 grove record types** — IncidentReport, PagerEvent, ReleaseRecord,
  ChangeRequest, SLOState, RunbookExecution, Postmortem,
  ReadinessChecklist

## Composition

Designed to compose with:

- `systems-administration` — host-level surface (users, packages,
  services, filesystems)
- `security` — authorization, audit, hardening baselines
- `cloud-systems` — infrastructure provisioning and IaC

The grove namespace (`systems-operations`) is distinct so records do
not collide with those cartridges.

## Forge gates

```
skill-creator cartridge validate ./cartridge.yaml --json
skill-creator cartridge eval     ./cartridge.yaml
skill-creator cartridge dedup    ./cartridge.yaml
skill-creator cartridge metrics  ./cartridge.yaml
```

All four green is the ship bar.
