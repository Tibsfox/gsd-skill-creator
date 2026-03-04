---
name: hypervisor
description: >
  Agent lifecycle management. Auto-activates when spawning agents,
  managing teams, or at context pressure boundaries.
user-invocable: false
---

# Hypervisor

## Operations

| Op | Trigger | Do |
|----|---------|-----|
| SPAWN | New task | Template → variables → launch |
| SCHEDULE | Multiple tasks | FIFO / Parallel / Priority |
| MIGRATE | Pressure critical | Snapshot → fresh agent → kill old |
| SNAPSHOT | Task boundary | Commit + phase + output + remaining |
| REAP | Done/stalled | Shutdown → force (30s) → TeamDelete → log |

## States

```
CREATED→READY→RUNNING→COMPLETED→REAPED
                 ├→MIGRATING→(new CREATED)
                 └→STALLED→KILLED→REAPED
```

## Migration

Zero-data-loss: snapshot before kill, always.
1. Agent writes status (done/remaining)
2. Lead snapshots: commit hash + remaining work
3. Spawn fresh from snapshot, shutdown old

## Scheduling

FIFO: one agent sequential. Parallel: wave-partitioned files. Priority: interrupt + queue displaced.
